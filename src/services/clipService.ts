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

import { TimelineSecond, VideoPlan } from '../utils/types';
import { env }     from '../config/env.js';
import { logger }  from '../utils/logger.js';
import { retry }   from '../utils/retry.js';

import fetch       from 'node-fetch';
import fs          from 'fs/promises';
import path        from 'path';
import { v4 as uuid } from 'uuid';
import Replicate   from 'replicate';
import RunwayML    from '@runwayml/sdk';
import axios       from 'axios';

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
    `camera ${first.camera.shot} ${first.camera.movement}`,
    `style ${style}`,
    (first.sceneMood || '') + ' cinematic lighting',
    'ultra-smooth camera, 24 fps, no watermark'
  ].filter(Boolean).join(', ');
}

/* ────────────────────────────────────────────────────────────
 * 3) Proveedores
 * ────────────────────────────────────────────────────────── */

/** Runway Gen-4 Turbo */
async function runwayGen(prompt: string, frames: number, img?: string): Promise<string | null> {
  try {
    let validImg: string | undefined = undefined;
    if (img && typeof img === 'string' && img.length > 0) {
      // Solo aceptar URLs HTTPS válidas
      const isValidUrl = /^https:\/\//.test(img);
      if (isValidUrl && await validateUrl(img)) {
        validImg = img;
      } else {
        logger.warn(`promptImage inválido (no https o inaccesible), ignorando: ${img}`);
      }
    }

    // Runway solo acepta duration 5 o 10
    let durationSec: 10 | 5 = 10;
    const seconds = Math.ceil(frames / 24);
    if (seconds <= 5) durationSec = 5;
    else durationSec = 10;

    // Solo incluir promptImage si es https válido
    const createOpts: any = {
      model: 'gen4_turbo',
      promptText: prompt,
      duration: durationSec,
      ratio: '1280:720',
    };
    if (validImg) createOpts.promptImage = validImg;

    const task = await runwayClient.imageToVideo
      .create(createOpts)
      .waitForTaskOutput();

    if (!task || !task.output || !Array.isArray(task.output)) {
      throw new Error('Runway task failed or returned no output');
    }

    return task.output[0];
  } catch (e) {
    logger.error(`Runway error: ${(e as Error).message}`);
    if ((e as any).response) {
      logger.error(`Runway response: ${JSON.stringify((e as any).response.data)}`);
    }
    return null; // Fallback
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
  const model = MODEL_MAP[style as keyof typeof MODEL_MAP];
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

/* ────────────────────────────────────────────────────────────
 * 4) generateClips — API pública
 * ────────────────────────────────────────────────────────── */
export async function generateClips(plan: VideoPlan, storyboardUrls: string[]): Promise<string[]> {
  logger.info('🎞️  ClipService v6.1 — iniciando…');
  await fs.mkdir(TMP_CLIPS, { recursive: true });

  let segments = segmentTimeline(plan.timeline);
  // Limitar a máximo 3 segmentos para reducir recursos
  if (segments.length > 3) {
    // Tomar solo el primero, el del medio y el último
    const first = segments[0];
    const last = segments[segments.length - 1];
    const middle = segments[Math.floor(segments.length / 2)];
    segments = [first, middle, last].filter((v, i, arr) => arr.indexOf(v) === i); // evitar duplicados
  }
  logger.info(`→ ${segments.length} segmentos de vídeo (limitado)`);

  const paths: string[] = [];

  for (let i = 0; i < segments.length; i += GEN_CONCURRENCY) {
    const batch = segments.slice(i, i + GEN_CONCURRENCY);

    const proms = batch.map(async (seg) => {
      const prompt = buildPrompt(seg, plan.metadata.visualStyle);
      const frames = (seg.end - seg.start + 1) * 24;
      const imgUrl = storyboardUrls?.[seg.start];

      // Generar el video clip usando Runway o Replicate
      const videoUrl =
        (await runwayGen(prompt, frames, imgUrl)) ??
        (await replicateGen(prompt, frames, plan.metadata.visualStyle));

      if (!videoUrl) {
        logger.error(`❌ No se pudo generar el clip para el segmento ${seg.start}`);
        throw new Error('no clip url');
      }

      const destVideo = path.join(TMP_CLIPS, `clip_${seg.start}_${uuid().slice(0, 6)}.mp4`);
      const bufVideo = await fetch(videoUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
      await fs.writeFile(destVideo, bufVideo);
      // Validar que el archivo existe
      try {
        await fs.access(destVideo);
      } catch (e) {
        logger.error(`❌ Clip no se guardó correctamente: ${destVideo}`);
        throw new Error('No se pudo guardar el clip de video');
      }
      // Validar accesibilidad si se sube a CDN en el futuro
      logger.info(`✅ Clip generado y guardado: ${destVideo}`);
      return destVideo;
    });

    paths.push(...(await Promise.all(proms)));
  }

  logger.info(`✅  Clips generados: ${paths.length}`);
  return paths;
}

async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch {
    return false;
  }
}
