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
const TIMEOUT_TTS  = 45_000;
const RETRIES      = 2;

/* Helper timeout */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_TTS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), ms))
  ]);
}

/* ────────────────────────────────────────────────────────────
 * 1) Selección de voz simplificada (puedes mapear a IDs reales)
 * ────────────────────────────────────────────────────────── */
function pickVoiceId(
  char: CharacterVoiceSpec
): { provider: 'murf' | 'eleven'; voiceId: string } {
  if (env.MURF_API_KEY) {
    return {
      provider: 'murf',
      voiceId: char.gender === 'female' ? 'en-US-natalie' : 'en-US-will'
    };
  }
  return {
    provider: 'eleven',
    voiceId: char.gender === 'female'
      ? 'pNInz6obpgDQGcFmaJgB' // ejemplo female
      : 'EXAVITQu4vr4xnSDxMaL' // ejemplo male
  };
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

      const ttsBuf =
        (provider === 'murf'
          ? await retry(() => murfTTS(actualText, voiceId), RETRIES)
          : await retry(() => elevenTTS(actualText, voiceId), RETRIES)) ??
        Buffer.alloc(0);

      const file = path.join(TMP_DIR, `sec${sec.t}.mp3`);
      await fs.writeFile(file, ttsBuf);
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
    logger.info('✅  Pista de voz lista');
    return buf;
  } catch (e: any) {
    logger.error(`VoiceService error: ${e.message}`);
    throw new Error('VoiceService failed');
  }
}
