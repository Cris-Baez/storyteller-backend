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

  // IDs válidos y existentes (actualizados a julio 2025)
  const DEFAULT_MURF = gender === 'female' ? 'en-US-natalie' : 'en-US-ryan';
  const DEFAULT_ELEVEN = gender === 'female' ? '21m00Tcm4TlvDq8ikWAM' : 'VR6AewLTigWG4xSOukaG';

  // Convertir a arrays de string para validación flexible
  const murfVoices = [...MURF_FEMALE, ...MURF_MALE].map(String);
  const elevenVoices = [...ELEVEN_FEMALE, ...ELEVEN_MALE].map(String);

  if (env.MURF_API_KEY) {
    const voiceId = gender === 'female'
      ? pickRandom(MURF_FEMALE)
      : pickRandom(MURF_MALE);
    if (!murfVoices.includes(String(voiceId))) {
      logger.warn(`VoiceId Murf inválido (${voiceId}), usando por defecto: ${DEFAULT_MURF}`);
      return { provider: 'murf', voiceId: DEFAULT_MURF };
    }
    return { provider: 'murf', voiceId };
  }

  // Fallback – ElevenLabs
  const voiceId = gender === 'female'
    ? pickRandom(ELEVEN_FEMALE)
    : pickRandom(ELEVEN_MALE);
  if (!elevenVoices.includes(String(voiceId))) {
    logger.warn(`VoiceId ElevenLabs inválido (${voiceId}), usando por defecto: ${DEFAULT_ELEVEN}`);
    return { provider: 'eleven', voiceId: DEFAULT_ELEVEN };
  }
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
  await new Promise((res, rej) => {
    spawn(ffmpegPath!, [
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
    ]).on('close', c => (c === 0 ? res(null) : rej(new Error('ffmpeg silence'))));
  });
}

/* ────────────────────────────────────────────────────────────
 * 4) Normaliza loudness a –16 LUFS
 * ────────────────────────────────────────────────────────── */
async function normalise(input: string, output: string) {
  await new Promise((res, rej) => {
    spawn(ffmpegPath!, [
      '-i',
      input,
      '-af',
      'loudnorm=I=-16:TP=-1.5',
      '-c:a',
      'libmp3lame',
      '-q:a',
      '2',
      output
    ]).on('close', c => (c === 0 ? res(null) : rej(new Error('loudnorm fail'))));
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
  const isValid = await validateVoiceId(voiceId);
  if (!isValid) {
    logger.warn(`Voice ID inválido: ${voiceId}. Usando ElevenLabs como fallback.`);
  }
  return isValid;
}

/* ════════════════════════════════════════════════════════════
 * createVoiceOver – API pública
 * ═══════════════════════════════════════════════════════════ */
export async function createVoiceOver(plan: VideoPlan): Promise<Buffer> {
  logger.info('🎙️  VoiceService v6.1 – iniciando…');
  await fs.mkdir(TMP_DIR, { recursive: true });

  const parts: string[] = []; // archivos MP3 en orden
  const charMap = new Map<string, CharacterVoiceSpec>();
  plan.metadata.characters?.forEach(c => charMap.set(c.name.toLowerCase(), c));

  try {
    /* —— 1. TTS línea por línea —— */
    for (const sec of plan.timeline) {
      if (!sec.voiceLine) continue;

      const [maybeName, ...textArr] = sec.voiceLine.split(':');
      let actualText = sec.voiceLine;
      let charSpec: CharacterVoiceSpec | undefined;

      if (textArr.length) {
        actualText = textArr.join(':').trim();
        charSpec = charMap.get(maybeName.toLowerCase());
      }

      const { provider, voiceId } = pickVoiceId(
        charSpec ?? {
          name: 'Narrator',
          voiceId: 'default',
          gender: 'male',
          age: 35,
          language: 'en-US'
        }
      );

      let ttsBuf: Buffer | null = null;

      try {
        if (provider === 'murf' && (await validateVoiceIdBeforeUse(voiceId))) {
          ttsBuf = await retry(() => murfTTS(actualText, voiceId), RETRIES);
        } else {
          ttsBuf = await retry(() => elevenTTS(actualText, voiceId), RETRIES);
        }
      } catch (error) {
        logger.error(`❌ Error en TTS para línea ${sec.t}: ${(error as Error).message}`);
        ttsBuf = Buffer.alloc(0); // Fallback a silencio
      }

      const file = path.join(TMP_DIR, `sec${sec.t}.mp3`);
      const bufferToWrite = ttsBuf ?? Buffer.alloc(0); // Asegurar que siempre se escribe un buffer válido
      await fs.writeFile(file, bufferToWrite);
      parts[sec.t] = file;
    }

    /* —— 2. Rellenar silencios —— */
    for (let i = 0; i < plan.metadata.duration; i++) {
      if (!parts[i]) {
        const file = path.join(TMP_DIR, `silence${i}.mp3`);
        await silence(1, file);
        parts[i] = file;
      }
    }

    /* —— 3. Concat —— */
    const listPath = path.join(TMP_DIR, `${uuid()}.txt`);
    await fs.writeFile(listPath, parts.map(f => `file '${f}'`).join('\n'));

    const concatRaw = path.join(TMP_DIR, `${uuid()}_raw.mp3`);
    await new Promise((res, rej) => {
      spawn(ffmpegPath!, [
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listPath,
        '-c',
        'copy',
        concatRaw
      ]).on('close', c => (c === 0 ? res(null) : rej(new Error('concat fail'))));
    });

    const finalFile = path.join(TMP_DIR, `${uuid()}_final.mp3`);
    await normalise(concatRaw, finalFile);

    const buf = await fs.readFile(finalFile);
    if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
      logger.error('❌ La pista de voz generada está vacía o es inválida');
      throw new Error('La pista de voz generada está vacía o es inválida');
    }
    logger.info(`✅  Pista de voz lista (${buf.length} bytes)`);
    return buf;
  } catch (e: any) {
    logger.error(`VoiceService error: ${e.message}`);
    throw new Error('VoiceService failed');
  }
}
