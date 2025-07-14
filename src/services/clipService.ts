// src/services/clipService.ts
/**
 * Clip Service v6.1 — 2025-07-13
 * ------------------------------
 * ▸ Segmenta el timeline en bloques de 2 s (o cuando hay transición).
 * ▸ Para cada bloque construye un prompt cinematográfico.
 * ▸ Pipeline de generación (orden de preferencia):
 *     1. Runway Gen-4 Turbo        → /v1/image_to_video
 *     2. Replicate (modelo según estilo visual)
 * ▸ Control de concurrencia (GEN_CONCURRENCY) y timeout (GEN_TIMEOUT_MS).
 * ▸ Descarga cada clip .mp4 a /tmp y devuelve paths locales.
 */

import { VideoPlan, TimelineSecond } from '../utils/types.js';
import { env }     from '../config/env.js';
import { logger }  from '../utils/logger.js';
import { retry }   from '../utils/retry.js';

import fetch       from 'node-fetch';
import fs          from 'fs/promises';
import path        from 'path';
import { v4 as uuid } from 'uuid';
import Replicate   from 'replicate';
import RunwayML    from '@runwayml/sdk';

/* ─── Config ─────────────────────────────────────────────── */
const GEN_CONCURRENCY = Number(env.GEN2_CONCURRENCY ?? 3);
const GEN_TIMEOUT_MS  = Number(env.GEN2_TIMEOUT_MS  ?? 150_000);
const TMP_CLIPS       = '/tmp/clips_v6';

const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
const runwayClient = new RunwayML();

/* Helper timeout */
async function withTimeout<T>(p: Promise<T>, ms = GEN_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('clip timeout')), ms))
  ]);
}

/* ────────────────────────────────────────────────────────────
 * 1) Segmentación del timeline
 * ────────────────────────────────────────────────────────── */
interface Segment { start: number; end: number; secs: TimelineSecond[] }

const SEGMENT_SIZE = 3; // Tamaño ideal de segmento en segundos

function segmentTimeline(tl: TimelineSecond[]): Segment[] {
  if (tl.length === 0) return [];
  const segs: Segment[] = [];
  let current: Segment = { start: 0, end: 0, secs: [tl[0]] };

  for (let i = 1; i < tl.length; i++) {
    const sec = tl[i];
    const needSplit = sec.transition !== 'none' || current.secs.length >= SEGMENT_SIZE;
    if (needSplit) {
      current.end = i - 1;
      segs.push(current);
      current = { start: i, end: i, secs: [sec] };
    } else {
      current.secs.push(sec);
      current.end = i;
    }
  }
  segs.push(current);
  return segs;
}

/* ────────────────────────────────────────────────────────────
 * 2) Prompt builder
 * ────────────────────────────────────────────────────────── */
function buildPrompt(
  seg: Segment,
  style: VideoPlan['metadata']['visualStyle']
): string {
  const first = seg.secs[0];
  const last  = seg.secs[seg.secs.length - 1];
  const mainVisuals = [first.visual];
  if (seg.secs.length > 1) mainVisuals.push(last.visual);

  return [
    mainVisuals.join(', '),
    `camera ${first.camera} shot movement`,
    `style ${style}`,
    (first.sceneMood || '') + ' cinematic lighting',
    'ultra-smooth camera, 24 fps, no watermark'
  ].filter(Boolean).join(', ');
}

/* ────────────────────────────────────────────────────────────
 * 3) Proveedores
 * ────────────────────────────────────────────────────────── */

/** Runway Gen-4 Turbo */
async function runwayGen(prompt: string, frames: number, promptImage: string): Promise<string | null> {
  try {
    const durationSec: 10 | 5 | undefined = Math.min(10, Math.ceil(frames / 24)) as 10 | 5;
    const task = await runwayClient.imageToVideo
      .create({
        model: 'gen4_turbo',
        promptText: prompt,
        promptImage: promptImage, // Imagen específica del storyboard
        duration: durationSec,
        ratio: '1280:720',
      })
      .waitForTaskOutput();

    if (!task || !task.output || !Array.isArray(task.output)) {
      throw new Error('Runway task failed or returned no output');
    }

    return task.output[0];
  } catch (e: any) {
    logger.warn(`Runway fail: ${e.message}`);
    return null;
  }
}

/** Mapas de modelo Replicate */
const MODEL_MAP = {
  realistic: 'kwaivgi/kling-v1.6-standard',
  anime:     'zsxkib/animate-diff',
  cartoon:   'minimax/video-01'
} as const;

/** Replicate fallback */
async function replicateGen(
  prompt: string,
  frames: number,
  style: VideoPlan['metadata']['visualStyle']
): Promise<string> {
  const model = MODEL_MAP[style];
  const output = await withTimeout(
    retry(
      () => replicate.run(model, {
        input: { prompt, num_frames: frames }
      }),
      2 /* reintentos */
    )
  );
  /* algunos modelos devuelven string[], otros { video } */
  if (Array.isArray(output)) return output[0] as string;
  if (output && typeof output === 'object' && (output as any).video) return (output as any).video;
  throw new Error('Unexpected Replicate response');
}

// Integración de Murf para generación de voces
// Manejo explícito de null en respuestas
async function generateVoiceMurf(prompt: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.murf.ai/v1/voice', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MURF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error(`Murf HTTP ${res.status}`);
    const data = await res.json();
    if (data && typeof data === 'object' && 'audioUrl' in data) {
      return (data as { audioUrl?: string }).audioUrl || null;
    }
    throw new Error('Respuesta inesperada de Murf API');
  } catch (e: unknown) {
    const error = e as Error;
    logger.warn(`Murf fail: ${error.message}`);
    return null;
  }
}

async function fetchSoundFreesound(query: string): Promise<string | null> {
  try {
    const res = await fetch(`https://freesound.org/api/sounds/search?q=${query}&token=${env.FREESOUND_API_KEY}`);
    if (!res.ok) throw new Error(`Freesound HTTP ${res.status}`);
    const data = await res.json();
    if (data && typeof data === 'object' && 'results' in data) {
      const results = (data as { results?: { previewUrl?: string }[] }).results;
      return results?.[0]?.previewUrl || null;
    }
    throw new Error('Respuesta inesperada de Freesound API');
  } catch (e: unknown) {
    const error = e as Error;
    logger.warn(`Freesound fail: ${error.message}`);
    return null;
  }
}

/* ────────────────────────────────────────────────────────────
 * 4) generateClips — API pública
 * ────────────────────────────────────────────────────────── */
export async function generateClips(plan: VideoPlan, storyboardUrls: string[]): Promise<string[]> {
  logger.info('🎞️  ClipService v6.1 — iniciando…');
  await fs.mkdir(TMP_CLIPS, { recursive: true });

  const segments = segmentTimeline(plan.timeline);
  logger.info(`→ ${segments.length} segmentos de vídeo`);

  const paths: string[] = [];

  for (let i = 0; i < segments.length; i += GEN_CONCURRENCY) {
    const batch = segments.slice(i, i + GEN_CONCURRENCY);

    const proms = batch.map(async (seg) => {
      const prompt = buildPrompt(seg, plan.metadata.visualStyle);
      const frames = (seg.end - seg.start + 1) * 24;

      const promptImage = storyboardUrls[seg.start] ?? undefined;

      const videoUrl = await runwayGen(prompt, frames, promptImage) ?? await replicateGen(prompt, frames, plan.metadata.visualStyle);
      const voiceUrl = await generateVoiceMurf(`Narración para segmento ${seg.start}`);
      const soundUrl = await fetchSoundFreesound('ambient space');

      if (!videoUrl) throw new Error('no clip url');

      const destVideo = path.join(TMP_CLIPS, `clip_${seg.start}_${uuid().slice(0, 6)}.mp4`);
      const bufVideo = await fetch(videoUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
      await fs.writeFile(destVideo, bufVideo);

      if (voiceUrl) {
        const destVoice = path.join(TMP_CLIPS, `voice_${seg.start}_${uuid().slice(0, 6)}.mp3`);
        const bufVoice = await fetch(voiceUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
        await fs.writeFile(destVoice, bufVoice);
      }

      if (soundUrl) {
        const destSound = path.join(TMP_CLIPS, `sound_${seg.start}_${uuid().slice(0, 6)}.mp3`);
        const bufSound = await fetch(soundUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
        await fs.writeFile(destSound, bufSound);
      }

      return destVideo;
    });

    paths.push(...await Promise.all(proms));
  }

  logger.info(`✅  Clips generados: ${paths.length}`);
  return paths;
}
