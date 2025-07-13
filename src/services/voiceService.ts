// src/services/voiceService.ts
/**
 * Voice Service v6
 * ----------------
 * Funcionalidades clave:
 * • Acepta un VideoPlan con múltiples personajes (`audio.characters[]`).
 * • Genera TTS por línea (Murf ➜ ElevenLabs fallback) escogiendo voz según CharacterVoiceSpec.
 * • Ensambla todas las líneas + relleno de silencios hasta conseguir una pista continua
 *   de exactamente `duration` segundos, 48 kHz, normalizada a -16 LUFS.
 * • Todo a buffers en disco TMP, luego concat mediante FFmpeg.
 */

import axios               from 'axios';
import { spawn }           from 'child_process';
import ffmpegPath          from 'ffmpeg-static';
import fs                  from 'fs/promises';
import path                from 'path';
import { v4 as uuid }      from 'uuid';

import { VideoPlan, CharacterVoiceSpec } from '../utils/types.js';
import { env }     from '../config/env.js';
import { logger }  from '../utils/logger.js';
import { retry }   from '../utils/retry.js';

const TMP_DIR    = '/tmp/voices_v6';
const TIMEOUT_TTS = 45_000;
const RETRIES     = 2;

/* Helper: timeout */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_TTS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), ms))
  ]);
}

/* ────────────────────────────────────────────────────────────
 * 1) Selección de voz para un personaje
 * ────────────────────────────────────────────────────────── */
function pickVoiceId(char: CharacterVoiceSpec): { provider: 'murf'|'eleven', voiceId: string } {
  // Ejemplo minimal (mapear a IDs reales en tu cuenta)
  if (env.MURF_API_KEY) {
    // Simplificación: usar un ID fijo por género
    return { provider: 'murf', voiceId: char.gender === 'female' ? 'en-US-002' : 'en-US-001' };
  }
  return { provider: 'eleven', voiceId: char.gender === 'female' ? 'eleven_female_00' : 'eleven_male_00' };
}

/* ────────────────────────────────────────────────────────────
 * 2) TTS Providers
 * ────────────────────────────────────────────────────────── */
async function murfTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!env.MURF_API_KEY) return null;
  try {
    const { data } = await withTimeout(
      axios.post(
        'https://api.murf.ai/v1/speech',
        { text, voice: voiceId },
        { headers: { Authorization: `Bearer ${env.MURF_API_KEY}` }, responseType: 'arraybuffer' }
      )
    );
    return Buffer.from(data);
  } catch (e:any) {
    logger.warn(`Murf error: ${e.message}`);
    return null;
  }
}

async function elevenTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!env.ELEVENLABS_API_KEY) return null;
  try {
    const { data } = await withTimeout(
      axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        { text, model_id:'eleven_multilingual_v2' },
        { headers: { 'xi-api-key': env.ELEVENLABS_API_KEY }, responseType:'arraybuffer' }
      )
    );
    return Buffer.from(data);
  } catch (e:any) {
    logger.warn(`Eleven error: ${e.message}`);
    return null;
  }
}

/* ────────────────────────────────────────────────────────────
 * 3) Genera silencio MP3 de n segundos
 * ────────────────────────────────────────────────────────── */
async function silence(seconds: number, file: string) {
  await new Promise((res, rej) => {
    spawn(ffmpegPath!, [
      '-f','lavfi','-i',`anullsrc=r=48000:cl=stereo`,
      '-t', String(seconds),
      '-q:a','9','-acodec','libmp3lame',
      file
    ]).on('close', (c)=> c===0?res(null):rej(new Error('ffmpeg silence failed')));
  });
}

/* ────────────────────────────────────────────────────────────
 * 4) Normaliza loudness a -16 LUFS
 * ────────────────────────────────────────────────────────── */
async function normalise(input: string, output: string) {
  await new Promise((res, rej) => {
    spawn(ffmpegPath!, [
      '-i', input,
      '-af','loudnorm=I=-16:TP=-1.5',
      '-c:a','libmp3lame','-q:a','2',
      output
    ]).on('close', (c)=> c===0?res(null):rej(new Error('ff loudnorm')));
  });
}

/* ════════════════════════════════════════════════════════════
 * createVoiceOver – API pública
 * ═══════════════════════════════════════════════════════════ */
export async function createVoiceOver(plan: VideoPlan): Promise<Buffer> {
  logger.info('🎙️  VoiceService v6 – iniciando…');
  await fs.mkdir(TMP_DIR,{recursive:true});
  const parts: string[] = [];           // lista de archivos MP3 en orden
  const charMap = new Map<string, CharacterVoiceSpec>();

  // Construye mapa nombre→spec
  plan.metadata.characters?.forEach(c => charMap.set(c.name.toLowerCase(), c));

  /* —— 1. Generar audio por cada segundo con voiceLine —— */
  for (const sec of plan.timeline) {
    if (!sec.voiceLine) continue;
    const [maybeName, ...textArr] = sec.voiceLine.split(':');
    let actualText = sec.voiceLine;
    let charSpec: CharacterVoiceSpec | undefined;

    if (textArr.length) { // "Name: texto…"
      actualText = textArr.join(':').trim();
      charSpec   = charMap.get(maybeName.trim().toLowerCase());
    }
    if (!charSpec && plan.metadata.characters?.length) {
      charSpec = plan.metadata.characters[0]; // narrador default
    }

    const { provider, voiceId } = pickVoiceId(charSpec ?? {
      name: 'Narrator',
      voiceId: 'default', // Agregar voiceId para cumplir con CharacterVoiceSpec
      gender: 'male',
      age: 35,
      language: 'en-US'
    });

    const ttsBuf =
      (provider==='murf'
        ? await retry(()=>murfTTS(actualText, voiceId), RETRIES)
        : await retry(()=>elevenTTS(actualText, voiceId), RETRIES)
      ) ?? Buffer.alloc(0);

    // Guarda a disco
    const file = path.join(TMP_DIR, `sec${sec.t}.mp3`);
    await fs.writeFile(file, ttsBuf);
    parts[sec.t] = file;            // index by second
  }

  /* —— 2. Rellenar silencios para segundos sin diálogo —— */
  for (let i=0;i<plan.metadata.duration;i++){
    if (!parts[i]) {
      const file = path.join(TMP_DIR, `silence${i}.mp3`);
      await silence(1, file);
      parts[i] = file;
    }
  }

  /* —— 3. Concat todos los segundos (ya ordenados) —— */
  const listPath = path.join(TMP_DIR, `${uuid()}.txt`);
  await fs.writeFile(listPath, parts.map(f=>`file '${f}'`).join('\n'));

  const concatRaw = path.join(TMP_DIR, `${uuid()}_raw.mp3`);
  await new Promise((res, rej) => {
    spawn(ffmpegPath!,[
      '-f','concat','-safe','0','-i',listPath,
      '-c','copy', concatRaw
    ]).on('close', (c)=> c===0?res(null):rej(new Error('concat fail')));
  });

  const finalFile = path.join(TMP_DIR, `${uuid()}_final.mp3`);
  await normalise(concatRaw, finalFile);

  const buf = await fs.readFile(finalFile);
  logger.info('✅  Pista VO lista');
  return buf;
}

const metadata = {
  characters: [
    { name: 'Narrator', voiceId: 'default' }
  ]
};
