/*──────────────────────── clipService.ts v7.2 ────────────────────────
 * Storyteller AI · ClipService
 * --------------------------------------------------------------------
 * • Genera clips con Runway Gen‑4 Turbo. Fallback a Replicate.
 * • Descarga en streaming  → /tmp  → sube a Google Cloud Storage.
 * • Concurrencia limitada por ENV GEN2_CONCURRENCY.
 * -------------------------------------------------------------------*/

import fs              from 'fs/promises';
import fss             from 'fs';
import path            from 'path';
import { pipeline }    from 'stream/promises';
import { v4 as uuid }  from 'uuid';
import fetch           from 'node-fetch';
import pLimit          from 'p-limit';
import RunwayML        from '@runwayml/sdk';
import Replicate       from 'replicate';

import { env }       from '../config/env.js';
import { logger }    from '../utils/logger.js';
import { retry }     from '../utils/retry.js';
import type {
  VideoPlan,
  TimelineSecond
} from '../utils/types';

/* ── Config ───────────────────────────────────────────────────────── */
const CONCURRENCY    = Number(env.GEN2_CONCURRENCY ?? 3);
const GEN_TIMEOUT_MS = Number(env.GEN2_TIMEOUT_MS ?? 150_000);
const TMP_CLIPS      = '/tmp/clips_v7';
await fs.mkdir(TMP_CLIPS, { recursive: true });

const runway    = new RunwayML();
const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

const DUMMY_IMAGE = 'https://dummyimage.com/1280x720/222/fff.png'; // Puedes poner tu propio PNG CDN

const MODEL_MAP = {
  realistic: 'zeroscope/zeroscope-v2-xl:latest', // text-to-video realista
  anime    : 'tencent/hunyuan-video:latest',
  cartoon  : 'lightricks/ltx-video:latest'
} as const;

/* ── Helpers ──────────────────────────────────────────────────────── */
async function withTimeout<T>(p: Promise<T>, ms = GEN_TIMEOUT_MS) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('clip timeout')), ms))
  ]);
}

/* ── Core generators ─────────────────────────────────────────────── */
async function genRunway(prompt: string, frames: number, promptImage: string): Promise<string> {
  // Runway SOLO acepta 5 o 10 (seconds)
  const dur: 5 | 10 = (Math.ceil(frames / 24) <= 5 ? 5 : 10);
  const out = await runway.imageToVideo
    .create({
      model      : 'gen4_turbo',
      promptImage: promptImage,
      promptText : prompt.trim(),
      duration   : dur,
      ratio      : '1280:720'
    })
    .waitForTaskOutput();

  if (!Array.isArray(out?.output) || !out.output[0])
    throw new Error('Runway output vacío');
  return out.output[0] as string;
}

async function genReplicate(
  prompt: string,
  frames: number,
  style: keyof typeof MODEL_MAP,
  referenceImages?: string[]
): Promise<string> {
  const dur = Math.min(Math.ceil(frames / 24), 5);
  let model: string = MODEL_MAP[style];
  let input: any = { prompt, duration: dur };
  // Para realismo, usar Veo-3-fast si no hay imágenes, o zeroscope si no
  if (style === 'realistic') {
    if (referenceImages && referenceImages.length > 0) {
      model = 'runwayml/gen4-image';
      input = { prompt, reference_images: referenceImages, aspect_ratio: '16:9', duration: dur };
    } else {
      model = 'google/veo-3-fast';
      input = { prompt, duration: dur };
    }
  } else if (referenceImages && referenceImages.length > 0) {
    input.reference_images = referenceImages;
  }
  if (!input.aspect_ratio) input.aspect_ratio = '16:9';
  const res: any = await replicate.run(model as any, { input });
  return Array.isArray(res) ? res[0] : res.video;
}

interface Segment { start: number; end: number; secs: TimelineSecond[] }

function segment(tl: TimelineSecond[]): Segment[] {
  const segs: Segment[] = [];
  let cur: Segment | null = null;

  tl.forEach((sec, idx) => {
    if (!cur || sec.transition !== 'none' || cur.secs.length >= 3) {
      cur && segs.push(cur);
      cur = { start: idx, end: idx, secs: [sec] };
    } else {
      cur.secs.push(sec);
      cur.end = idx;
    }
  });
  cur && segs.push(cur);
  return segs;
}

function buildPrompt(seg: Segment, style: VideoPlan['metadata']['visualStyle']) {
  const f = seg.secs[0];
  const l = seg.secs[seg.secs.length - 1];
  return [
    [f.visual, seg.secs.length > 1 ? l.visual : ''].filter(Boolean).join(', '),
    `camera ${f.camera.shot} ${f.camera.movement}`,
    `style ${style}`,
    (f.sceneMood || '') + ' cinematic lighting',
    '24 fps, ultra‑smooth, no watermark'
  ].filter(Boolean).join(', ');
}

/* ── Public API ─────────────────────────────────────────────────── */
export async function generateClips(
  plan: VideoPlan, storyboardUrls: string[] = []
): Promise<string[]> {

  logger.info('🎞️ ClipService v7.2 – iniciando…');

  const segments = segment(plan.timeline).slice(0, 3);
  logger.info(`→ Generando ${segments.length} segmentos…`);

  const limit = pLimit(CONCURRENCY);
  const clipUrls: string[] = [];

  await Promise.all(segments.map(async (seg, idx) => {
    const prompt = buildPrompt(seg, plan.metadata.visualStyle);
    const frames = (seg.end - seg.start + 1) * 24;

    // 1. Buscar imagen de storyboard local (si existe), luego CDN, luego dummy
    let promptImage = DUMMY_IMAGE;
    if (Array.isArray(storyboardUrls) && storyboardUrls[seg.start]) {
      // Si la URL es file:// usa local, si es http(s) usa CDN
      if (storyboardUrls[seg.start].startsWith('file://')) {
        promptImage = storyboardUrls[seg.start].replace('file://', '');
      } else {
        promptImage = storyboardUrls[seg.start];
      }
    }

    // 2. RunwayML: probar primero local, si falla probar CDN, si falla dummy
    let url: string | null = null;
    let triedImages: string[] = [];
    for (const img of [promptImage, DUMMY_IMAGE]) {
      triedImages.push(img);
      try {
        url = await withTimeout(genRunway(prompt, frames, img));
        break;
      } catch (err) {
        logger.warn(`Runway fallo (seg ${seg.start}) con imagen ${img}: ${(err as Error).message}`);
      }
    }
    if (!url) {
      // Si hay imagen válida, pásala como reference_images a Replicate
      let referenceImages: string[] = [];
      if (promptImage && promptImage !== DUMMY_IMAGE && promptImage.startsWith('http')) {
        referenceImages = [promptImage];
      }
      try {
        url = await withTimeout(genReplicate(
          prompt, frames,
          plan.metadata.visualStyle as keyof typeof MODEL_MAP,
          referenceImages
        ));
      } catch {
        logger.error(`Replicate también fallo (seg ${seg.start})`);
        return;                                   // omite segmento
      }
    }

    // 3. Descargar en streaming → /tmp
    const fname = `clip_${seg.start}_${uuid().slice(0,8)}.mp4`;
    const local = path.join(TMP_CLIPS, fname);
    const resp  = await fetch(url!);
    await pipeline(resp.body as any, fss.createWriteStream(local));

    // 4. Subir a CDN
    const { uploadToCDN } = await import('./cdnService.js');
    const cdn = await uploadToCDN(local, `clips/${fname}`);
    clipUrls.push(cdn);
    logger.info(`✅ Clip listo: ${cdn}`);
  }));

  logger.info(`✅ Total clips subidos: ${clipUrls.length}`);
  return clipUrls;
}
