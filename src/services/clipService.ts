import Replicate from 'replicate';
import axios from 'axios';
// Generador de video con Replicate (antes en providers/replicateFallback)
export async function generateReplicateClip(sec: import('../utils/types').TimelineSecond): Promise<Buffer> {
  const { env } = await import('../config/env');
  const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  // Usa modelo realista más actualizado (2025)
  const model = 'minimax/video-01';
  const output = await replicate.run(model, {
    input: {
      prompt: sec.visual,
      aspect_ratio: '16:9',
      duration: 5
    }
  });

  let url = '';
  if (Array.isArray(output) && output.length > 0) {
    url = output[0];
  } else if (output && typeof output === 'object' && (output as any).video) {
    url = (output as any).video;
  } else {
    throw new Error('Respuesta inesperada de Replicate');
  }

  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data);
}
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
import RunwayML    from '@runwayml/sdk';

/* ─── Config ─────────────────────────────────────────────── */
const GEN_CONCURRENCY = Number(env.GEN2_CONCURRENCY ?? 3);
const GEN_TIMEOUT_MS  = Number(env.GEN2_TIMEOUT_MS  ?? 150_000);
const TMP_CLIPS       = '/tmp/clips_v6';

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
    const createOpts: any = {
      model: 'gen4_turbo',
      promptText: prompt,
      duration: Math.ceil(frames / 24) <= 5 ? 5 : 10,
      ratio: '1280:720',
    };

    if (img) {
      try {
        logger.info(`Procesando imagen de storyboard para Runway: ${img}`);
        const imageResponse = await axios.get(img, { responseType: 'arraybuffer' });
        const base64Image = Buffer.from(imageResponse.data).toString('base64');
        createOpts.promptImage = base64Image;
        logger.info('✅ Imagen convertida a Base64 y añadida a las opciones de Runway.');
      } catch (e) {
        logger.warn(`⚠️ No se pudo descargar o convertir la imagen para Runway. Error: ${(e as Error).message}. Continuando sin imagen.`);
      }
    }

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

/** Mapas de modelo Replicate - Actualizados 2025 */
const MODEL_MAP = {
  realistic: 'minimax/video-01',         // Modelo más reciente para video realista
  anime:     'tencent/hunyuan-video',    // Modelo especializado en anime
  cartoon:   'lightricks/ltx-video'      // Modelo para contenido cartoon/animated
} as const;

/** Replicate fallback */
async function replicateGen(
  prompt: string,
  frames: number,
  style: VideoPlan['metadata']['visualStyle']
): Promise<string> {
  const model = MODEL_MAP[style as keyof typeof MODEL_MAP];
  const { env } = await import('../config/env');
  const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
  
  // Parámetros actualizados para modelos 2025
  const duration = Math.min(Math.ceil(frames / 24), 5); // Max 5 segundos
  
  const output = await withTimeout(
    retry(
      () => replicate.run(model, {
        input: { 
          prompt, 
          aspect_ratio: '16:9',
          duration: duration
        }
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
  logger.info('🎞️  ClipService v6.2 — iniciando (con subida a CDN)…');
  await fs.mkdir(TMP_CLIPS, { recursive: true });

  let segments = segmentTimeline(plan.timeline);
  // Limitar a máximo 3 segmentos para reducir recursos
  if (segments.length > 3) {
    const first = segments[0];
    const last = segments[segments.length - 1];
    const middle = segments[Math.floor(segments.length / 2)];
    segments = [first, middle, last].filter((v, i, arr) => arr.indexOf(v) === i);
  }
  logger.info(`→ ${segments.length} segmentos de vídeo (limitado)`);

  const cdnUrls: string[] = [];

  for (const seg of segments) {
    const prompt = buildPrompt(seg, plan.metadata.visualStyle);
    const frames = (seg.end - seg.start + 1) * 24;
    let imgUrl: string | undefined = undefined;
    let videoUrl: string | null = null;
    let bufVideo: Buffer | null = null;

    // 1. Subir imagen a CDN y esperar que esté lista
    try {
      if (storyboardUrls?.[seg.start]) {
        const imgCandidate = storyboardUrls[seg.start];
        if (
          typeof imgCandidate === 'string' &&
          /^https:\/\//.test(imgCandidate) &&
          imgCandidate.includes('storage.googleapis.com') &&
          (await validateUrl(imgCandidate))
        ) {
          imgUrl = imgCandidate;
        } else {
          logger.warn(`Storyboard no accesible en CDN para segmento ${seg.start}: ${imgCandidate}`);
        }
      }
    } catch (imgErr) {
      logger.warn(`Error validando storyboard CDN para segmento ${seg.start}: ${imgErr}`);
    }

    // 2. Intenta con Runway SOLO si la imagen está en CDN y es válida
    try {
      videoUrl = await withTimeout(runwayGen(prompt, frames, imgUrl));
      if (videoUrl) {
        bufVideo = await fetch(videoUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
      }
    } catch (err) {
      logger.warn(`⚠️ Runway falló para segmento ${seg.start}: ${err}`);
      videoUrl = null; // Asegurar que está limpio para fallback
    }

    // 3. Si falla, intenta con Replicate
    if (!bufVideo) {
      try {
        videoUrl = await replicateGen(prompt, frames, plan.metadata.visualStyle);
        if (videoUrl) {
          bufVideo = await fetch(videoUrl).then(r => r.arrayBuffer()).then(b => Buffer.from(b));
        }
      } catch (err) {
        logger.error(`❌ Fallaron todos los modelos para el segmento ${seg.start}`);
        continue;
      }
    }

    // 4. Guardar temporal y subir a CDN
    const filename = `clip_${seg.start}_${uuid().slice(0, 8)}.mp4`;
    const localPath = path.join(TMP_CLIPS, filename);
    try {
      await fs.writeFile(localPath, bufVideo!);
      // Usar el servicio centralizado de subida a CDN
      const { uploadToCDN } = await import('./cdnService.js');
      const cdnUrl = await uploadToCDN(localPath, `clips/${filename}`);
      cdnUrls.push(cdnUrl);
      logger.info(`✅ Clip subido a CDN: ${cdnUrl}`);
    } catch (uploadError) {
      logger.error(`📤 Error al subir a CDN: ${uploadError}`);
    }
  }

  logger.info(`✅  Clips generados y subidos: ${cdnUrls.length}`);
  return cdnUrls;
}

async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch {
    return false;
  }
}
