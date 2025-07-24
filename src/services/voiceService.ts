import { logFeedback } from './feedbackService.js';
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
const TIMEOUT_TTS  = 600_000; // Incrementar tiempo de espera a 10 minutos
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
  if (!env.MURF_API_KEY) {
    logFeedback({
      service: 'Voice',
      action: 'murfTTS',
      success: false,
      error: 'MURF_API_KEY no configurada',
      params: { voiceId }
    });
    return null;
  }

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
    logFeedback({
      service: 'Voice',
      action: 'murfTTS',
      success: false,
      error: 'Respuesta inesperada de Murf',
      params: { text, voiceId }
    });
    throw new Error('Murf: respuesta inesperada');
  } catch (e: any) {
    // Registro detallado del error
    logFeedback({
      service: 'Voice',
      action: 'murfTTS',
      success: false,
      error: e?.message || 'Error Murf',
      params: { text, voiceId, response: e?.response?.data }
    });
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
  if (!env.ELEVENLABS_API_KEY) {
    logFeedback({
      service: 'Voice',
      action: 'elevenTTS',
      success: false,
      error: 'ELEVENLABS_API_KEY no configurada',
      params: { voiceId }
    });
    return null;
  }

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
    logFeedback({
      service: 'Voice',
      action: 'elevenTTS',
      success: false,
      error: e?.message || 'Error ElevenLabs',
      params: { text, voiceId, response: e?.response?.data }
    });
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
// Google TTS fallback simple (puedes mejorar con API oficial si tienes credenciales)
async function googleTTS(text: string, lang = 'es'): Promise<Buffer | null> {
  try {
    // Usar gtts-cli si está disponible (requiere tenerlo instalado)
    const tmpFile = path.join(TMP_DIR, `gtts_${uuid()}.mp3`);
    await new Promise((res, rej) => {
      const proc = spawn('gtts-cli', ['--lang', lang, '--output', tmpFile, text]);
      proc.on('close', (code) => code === 0 ? res(true) : rej(new Error('gtts error')));
    });
    const buf = await fs.readFile(tmpFile);
    try {
      await fs.unlink(tmpFile);
    } catch (cleanupErr) {
      logger.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tmpFile}`);
      logFeedback && logFeedback({
        service: 'Voice',
        action: 'cleanup',
        success: false,
        error: 'No se pudo eliminar archivo temporal',
        params: { tmpFile }
      });
    }
    logger.info('Google TTS (gtts-cli) generado correctamente.');
    return buf;
  } catch (e) {
    logger.warn('Google TTS error: ' + (e instanceof Error ? e.message : e));
    return null;
  }
}

// Genera un beep de emergencia (1s, 440Hz)
async function beepFallback(): Promise<Buffer> {
  const tmpFile = path.join(TMP_DIR, `beep_${uuid()}.mp3`);
  await new Promise((res, rej) => {
    if (typeof ffmpegPath !== 'string') return rej(new Error('ffmpeg path not found'));
    const proc = spawn(ffmpegPath, [
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=1',
      '-ar', '48000',
      '-ac', '2',
      '-q:a', '9',
      '-acodec', 'libmp3lame',
      tmpFile
    ]);
    proc.on('close', (code) => code === 0 ? res(true) : rej(new Error('ffmpeg beep fail')));
  });
  const buf = await fs.readFile(tmpFile);
  try {
    await fs.unlink(tmpFile);
  } catch (cleanupErr) {
    logger.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tmpFile}`);
    logFeedback && logFeedback({
      service: 'Voice',
      action: 'cleanup',
      success: false,
      error: 'No se pudo eliminar archivo temporal',
      params: { tmpFile }
    });
  }
  logger.info('Beep fallback generado.');
  return buf;
}

// Fallback robusto: Murf → ElevenLabs → Google TTS → beep
async function generateVoice(text: string, gender: 'female' | 'male' = 'female'): Promise<Buffer> {
  // Validación estricta de parámetros
  if (typeof text !== 'string' || !text.trim()) {
    logger.error('[VoiceService] Texto de entrada inválido para TTS');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: false,
      error: 'Texto de entrada inválido',
      params: { text, gender }
    });
    throw new Error('Texto de entrada inválido para TTS');
  }
  if (gender !== 'female' && gender !== 'male') {
    logger.error('[VoiceService] Género inválido para TTS');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: false,
      error: 'Género inválido',
      params: { text, gender }
    });
    throw new Error('Género inválido para TTS');
  }
  // 1. Murf
  const murfId = gender === 'female' ? MURF_FEMALE[0] : MURF_MALE[0];
  let buffer = await murfTTS(text, murfId);
  if (buffer && buffer.length > 0) {
    logger.info('Voz generada con Murf.');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: true,
      params: { provider: 'Murf', text, gender }
    });
    return buffer;
  }
  // 2. ElevenLabs
  const elevenId = gender === 'female' ? ELEVEN_FEMALE[1] : ELEVEN_MALE[1];
  buffer = await elevenTTS(text, elevenId);
  if (buffer && buffer.length > 0) {
    logger.info('Voz generada con ElevenLabs.');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: true,
      params: { provider: 'ElevenLabs', text, gender }
    });
    return buffer;
  }
  // 3. Google TTS
  buffer = await googleTTS(text, gender === 'female' ? 'es' : 'es');
  if (buffer && buffer.length > 0) {
    logger.info('Voz generada con Google TTS.');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: true,
      params: { provider: 'GoogleTTS', text, gender }
    });
    return buffer;
  }
  // 4. Beep de emergencia
  logger.warn('No se pudo generar voz con ningún TTS. Usando beep de emergencia.');
  logFeedback({
    service: 'Voice',
    action: 'generateVoice',
    success: false,
    error: 'No se pudo generar voz con ningún TTS',
    params: { text, gender }
  });
  return await beepFallback();
}

/* ════════════════════════════════════════════════════════════
 * createVoiceOver – API pública
 * ═══════════════════════════════════════════════════════════ */
export async function createVoiceOver(plan: VideoPlan): Promise<Buffer> {
  logger.info('🎙️  VoiceService v6.2 – iniciando…');
  try {
    // Si el usuario pide un efecto de sonido explícito en el prompt, priorizarlo
    const audioBuffers = await Promise.all(
      plan.timeline.map(async (sec) => {
        // Si hay subtítulos multilingües, usarlos como fuente de voz
        let textoVoz = sec.voz || sec.dialogo;
        if (sec.subtitulos && typeof sec.subtitulos === 'string' && !sec.subtitulos.endsWith('.srt')) {
          // Si subtitulos es texto (no SRT), usarlo como fuente principal
          textoVoz = sec.subtitulos;
        }
        // Si hay SRT, podrías parsear y usar el texto (opcional, aquí solo si es texto)
        if (!textoVoz) return Buffer.from([]);
        // Detectar si el usuario pide un efecto de sonido explícito
        const sfxMatch = typeof textoVoz === 'string' && textoVoz.match(/\[SFX:([^\]]+)\]/i);
        if (sfxMatch) {
          logger.info(`Efecto de sonido solicitado: ${sfxMatch[1]}`);
          return await beepFallback();
        }
        // Parámetros avanzados de voz
        const parametrosVoz = sec.parametrosVoz || {};
        const idioma = sec.idioma || 'es';
        const perfilUsuario = sec.perfilUsuario || plan.metadata?.perfilUsuario || 'default';
        const feedbackUsuario = sec.feedbackUsuario || plan.metadata?.feedbackUsuario;
        const lipSync = sec.lipSync || 'auto';
        // Selección de género y voz
        const gender = (parametrosVoz as any)?.genero || (sec as any).gender || (plan.metadata?.characters?.[0]?.gender) || 'female';
        // Aquí podrías usar Murf, ElevenLabs, Google TTS, etc. con los parámetros avanzados
        try {
          // Ejemplo: pasar parámetros avanzados a la función de generación de voz
          return await generateVoice(textoVoz ?? '', gender);
        } catch (e) {
          logger.error('Error generando voz para segmento: ' + (e instanceof Error ? e.message : e));
          return await beepFallback();
        }
      })
    );
    return Buffer.concat(audioBuffers);
  } catch (e) {
    logger.error(`VoiceService error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    logger.warn('⚠️ Continuando con beep de emergencia debido a errores en la generación de voz.');
    return await beepFallback();
  }
}
