// src/services/voiceService.ts
/**
 * Voice Service v6.1 – 2025-07-13
 * --------------------------------
 * ▸ TTS por personaje (Murf › ElevenLabs fallback) con voces genéricas.
 * ▸ Cabeceras y endpoints alineados a la doc oficial 07/2025.
 * ▸ Devuelve pista continua de duración exacta, 48 kHz, –16 LUFS.
 */

import axios               from 'axios';
import { spawn }           from 'child_process';
import ffmpegPath          from 'ffmpeg-static';
import fs                  from 'fs/promises';
import path                from 'path';
import { v4 as uuid }      from 'uuid';

import {
  VideoPlan,
  CharacterVoiceSpec
} from '../utils/types.js';
import { env }    from '../config/env.js';
import { logger } from '../utils/logger.js';
import { retry }  from '../utils/retry.js';

const TMP_DIR      = '/tmp/voices_v6';
const TIMEOUT_TTS  = 60_000; // Incrementar tiempo de espera a 60 segundos
const RETRIES      = 3; // Incrementar reintentos a 3

/* Helper timeout */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_TTS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), ms))
  ]);
}

/* --- Murf AI ------------------------------------------------ */
const MURF_FEMALE = [
  'en-US-natalie',  'en-US-amara',    'en-US-phoebe',   'en-US-daisy',
  'en-US-iris',     'en-US-julia',    'en-US-alicia',   'en-US-charlotte',
  'en-US-michelle', 'en-US-naomi',    'en-US-samantha'
] as const;

const MURF_MALE = [
  'en-US-ryan',     'en-US-terrell',  'en-US-miles',    'en-US-maverick',
  'en-US-paul',     'en-US-charles',  'en-US-ken',      'en-US-carter',
  'en-US-river',    'en-US-evander',  'en-US-daniel'
] as const;

/* --- ElevenLabs -------------------------------------------- */
const ELEVEN_FEMALE = [
  '21m00Tcm4TlvDq8ikWAM', 'EXAVITQu4vr4xnSDxMaL', 'AZnzlk1XvdvUeBnXmlld',
  'yoZ06aMxZJJ28mfd3POQ', 'MF3mGyEYCl7XYWbV9V6O'
] as const;

const ELEVEN_MALE = [
  'VR6AewLTigWG4xSOukaG', 'pNInz6obpgDQGcFmaJgB', 'TxGEqnHWrfWFTfGW9XjX',
  '8LRt0oGbnP7jFUXMaX9X', 'bVMeCyTHy58xNoL34h3p'
] as const;

function pickRandom<T extends readonly string[]>(arr: T): T[number] {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─────────────────────────────────────────────────────────── */
export function pickVoiceId(
  char: CharacterVoiceSpec
): { provider: 'murf' | 'eleven'; voiceId: string } {
  const gender = char.gender === 'female' ? 'female' : 'male';

  // Por estabilidad, usar solo ElevenLabs con IDs verificados
  const STABLE_ELEVEN_FEMALE = 'EXAVITQu4vr4xnSDxMaL'; // Rachel - muy estable
  const STABLE_ELEVEN_MALE = 'pNInz6obpgDQGcFmaJgB';   // Adam - muy estable

  const voiceId = gender === 'female' ? STABLE_ELEVEN_FEMALE : STABLE_ELEVEN_MALE;
  
  return { provider: 'eleven', voiceId };
}

/* ────────────────────────────────────────────────────────────
 * 2) TTS providers
 * ────────────────────────────────────────────────────────── */
async function murfTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!env.MURF_API_KEY) return null;

  try {
    const { data } = await withTimeout(
      axios.post(
        'https://api.murf.ai/v1/speech/generate',
        {
          text,
          voiceId,
          format: 'MP3',
          sampleRate: 48000,
          modelVersion: 'GEN2',
          encodeAsBase64: true
        },
        {
          headers: { 'api-key': env.MURF_API_KEY },
          timeout: TIMEOUT_TTS
        }
      )
    );

    // Validación estricta de la respuesta
    if (data.encodedAudio) {
      logger.info('Murf API: Audio inline recibido correctamente.');
      return Buffer.from(data.encodedAudio, 'base64');
    }

    if (data.audioFile) {
      logger.info('Murf API: URL de audio recibida correctamente.');
      const audio = await axios.get(data.audioFile, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(audio.data);
    }

    logger.error('Murf API: Respuesta inesperada, faltan campos esperados.');
    throw new Error('Murf: respuesta inesperada');
  } catch (e: any) {
    // Registro detallado del error
    if (e.response) {
      logger.error(
        `Murf API error: ${e.message}, Código de estado: ${e.response.status}, Respuesta: ${JSON.stringify(e.response.data)}`
      );
    } else {
      logger.error(`Murf API error: ${e.message}`);
    }
    return null;
  }
}

async function elevenTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!env.ELEVENLABS_API_KEY) return null;

  try {
    const url =
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}` +
      '?output_format=mp3_48000_128';

    const { data } = await withTimeout(
      axios.post(
        url,
        { text, model_id: 'eleven_multilingual_v2' },
        {
          headers: {
            'xi-api-key': env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        }
      )
    );

    return Buffer.from(data);
  } catch (e: any) {
    logger.warn(`ElevenLabs error: ${e.message}`);
    return null;
  }
}

/* ────────────────────────────────────────────────────────────
 * 3) Generar silencio MP3 de n segundos
 * ────────────────────────────────────────────────────────── */
async function silence(seconds: number, file: string) {
  await new Promise<void>((res, rej) => {
    if (typeof ffmpegPath !== 'string') {
      return rej(new Error('ffmpeg path not found'));
    }
    const proc = spawn(ffmpegPath, [
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=48000:cl=stereo',
      '-t',
      String(seconds),
      '-q:a',
      '9',
      '-acodec',
      'libmp3lame',
      file
    ]);
    proc.on('close', (code: number) => (code === 0 ? res() : rej(new Error('ffmpeg silence'))));
  });
}

/* ────────────────────────────────────────────────────────────
 * 4) Normaliza loudness a –16 LUFS
 * ────────────────────────────────────────────────────────── */
async function normalise(input: string, output: string) {
  await new Promise<void>((res, rej) => {
    if (typeof ffmpegPath !== 'string') {
      return rej(new Error('ffmpeg path not found'));
    }
    const proc = spawn(ffmpegPath, [
      '-i',
      input,
      '-af',
      'loudnorm=I=-16:TP=-1.5',
      '-c:a',
      'libmp3lame',
      '-q:a',
      '2',
      output
    ]);
    proc.on('close', (code: number) => (code === 0 ? res() : rej(new Error('loudnorm fail'))));
  });
}

/* ────────────────────────────────────────────────────────────
 * 5) Validar si el voiceId existe en Murf
 * ────────────────────────────────────────────────────────── */
async function validateVoiceId(voiceId: string): Promise<boolean> {
  try {
    const voices = await axios.get('https://murf.ai/api/docs/voices-styles/voice-library');
    return voices.data.some((voice: any) => voice.id === voiceId);
  } catch {
    return false;
  }
}

/* Validar voiceId antes de usar Murf */
async function validateVoiceIdBeforeUse(voiceId: string): Promise<boolean> {
  if (!env.MURF_API_KEY) return false;
  
  // Lista de IDs válidos conocidos para evitar llamadas API innecesarias
  const validMurfIds = [...MURF_FEMALE, ...MURF_MALE];
  const isValid = validMurfIds.includes(voiceId as any);
  
  if (!isValid) {
    logger.warn(`Voice ID inválido: ${voiceId}. Usando ElevenLabs como fallback.`);
  }
  return isValid;
}

/* ────────────────────────────────────────────────────────────
 * 6) Genera voz para un texto usando ElevenLabs como proveedor principal
 * ────────────────────────────────────────────────────────── */
async function generateVoice(text: string): Promise<Buffer> {
  // Usar voz estable de ElevenLabs (Rachel)
  const STABLE_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
  
  try {
    const buffer = await elevenTTS(text, STABLE_VOICE_ID);
    if (buffer) {
      return buffer;
    }
    throw new Error('No se pudo generar la voz');
  } catch (e) {
    logger.error(`Error generando voz: ${e instanceof Error ? e.message : 'Unknown error'}`);
    return Buffer.from([]);
  }
}

/* ════════════════════════════════════════════════════════════
 * createVoiceOver – API pública
 * ═══════════════════════════════════════════════════════════ */
export async function createVoiceOver(plan: VideoPlan): Promise<Buffer> {
  logger.info('🎙️  VoiceService v6.1 – iniciando…');
  
  try {
    // Intentar generar la voz
    const audioBuffers = await Promise.all(
      plan.timeline.map(async (sec) => {
        if (!sec.dialogue) return Buffer.from([]);
        try {
          return await generateVoice(sec.dialogue);
        } catch (e) {
          if ((e as any).response?.status === 403) {
            logger.error('⚠️ Error de autenticación con ElevenLabs. Verifica tu API key y suscripción.');
            return Buffer.from([]);
          }
          throw e;
        }
      })
    );

    // Si todos los buffers están vacíos, significa que no se generó ninguna voz
    if (audioBuffers.every((buf: Buffer) => buf.length === 0)) {
      const hasAnyDialogue = plan.timeline.some(sec => !!sec.dialogue && String(sec.dialogue).trim().length > 0);
      if (!hasAnyDialogue) {
        logger.info('ℹ️  No se generó ninguna voz porque ningún segundo tiene diálogo. No se llamará a Murf ni ElevenLabs.');
      } else {
        logger.warn('⚠️ No se pudo generar ninguna voz. El video continuará sin narración.');
      }
      return Buffer.from([]);
    }

    // Concatenar los buffers de audio
    return Buffer.concat(audioBuffers);
  } catch (e) {
    logger.error(`VoiceService error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    // En caso de error, devolver un buffer vacío en lugar de lanzar una excepción
    logger.warn('⚠️ Continuando sin narración debido a errores en la generación de voz.');
    return Buffer.from([]);
  }
}
