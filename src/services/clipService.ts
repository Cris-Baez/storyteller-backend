/*───────────────────────── clipService.ts ─────────────────────────
 * Storyteller AI · ClipService v7
 * -----------------------------------------------------------------
 * • Genera segmentos de 1‑5 s con Runway Gen‑4 Turbo
 * • Fallback automático a Replicate (modelo según estilo)
 * • Descarga el MP4 en streaming → sin llenar la RAM
 * • Sube cada clip a Google Cloud Storage y devuelve las URLs
 * • Procesa varios segmentos en paralelo (concurrencia configurable)
 * -----------------------------------------------------------------*/

import fs           from 'fs/promises';
import fss          from 'fs';
import path         from 'path';
import { pipeline } from 'stream/promises';
import { v4 as uuid }  from 'uuid';
import fetch        from 'node-fetch';
import axios        from 'axios';
import pLimit       from 'p-limit';
import RunwayML     from '@runwayml/sdk';
import Replicate    from 'replicate';

import { env }              from '../config/env.js';
import { logger }           from '../utils/logger.js';
import { retry }            from '../utils/retry.js';
import type {
  VideoPlan,
  TimelineSecond
} from '../utils/types';

/* ─── Config ─────────────────────────────────────────────── */
const CONCURRENCY    = Number(env.GEN2_CONCURRENCY ?? 3);   // clips en paralelo
const GEN_TIMEOUT_MS = Number(env.GEN2_TIMEOUT_MS ?? 150_000);
const TMP_CLIPS      = '/tmp/clips_v7';
await fs.mkdir(TMP_CLIPS, { recursive: true });

const runway   = new RunwayML();
const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

/* ─── Helpers ────────────────────────────────────────────── */
async function asyncTimeout<T>(p: Promise<T>, ms = GEN_TIMEOUT_MS) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('clip timeout')), ms))
  ]);
}

const MODEL_MAP = {
  realistic: 'minimax/video-01',
  anime:     'tencent/hunyuan-video',
  cartoon:   'lightricks/ltx-video'
} as const;

/* ─── Core generators ───────────────────────────────────── */
async function genWithRunway(prompt: string, frames: number) {
  const res = await runway.imageToVideo
    .create({
      model      : 'gen4_turbo',
      promptText : prompt.trim(),
      promptImage: '',
      duration   : Math.ceil(frames / 24) <= 5 ? 5 : 10,
      ratio      : '1280:720'
    })
    .waitForTaskOutput();

  if (!Array.isArray(res?.output) || !res.output[0])
    throw new Error('Runway output vacío');
  return res.output[0] as string;
}

async function genWithReplicate(prompt: string, frames: number, style: keyof typeof MODEL_MAP) {
  const duration = Math.min(Math.ceil(frames / 24), 5);
  const out: any = await replicate.run(MODEL_MAP[style], {
    input: { prompt, aspect_ratio: '16:9', duration }
  });
  return Array.isArray(out) ? out[0] : out.video;
}

/* ─── Timeline utils ────────────────────────────────────── */
interface Segment { start: number; end: number; secs: TimelineSecond[] }

function segmentTimeline(tl: TimelineSecond[]): Segment[] {
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
  const f = seg.secs[0], l = seg.secs[seg.secs.length - 1];
  return [
    [f.visual, seg.secs.length > 1 ? l.visual : ''].filter(Boolean).join(', '),
    `camera ${f.camera.shot} ${f.camera.movement}`,
    `style ${style}`,
    (f.sceneMood || '') + ' cinematic lighting',
    '24 fps, ultra‑smooth, no watermark'
  ].filter(Boolean).join(', ');
}

/* ─── Public API ─────────────────────────────────────────── */
export async function generateClips(
  plan: VideoPlan, storyboardUrls: string[]
): Promise<string[]> {

  logger.info('🎞️ ClipService v7 – iniciando…');

  const segments = segmentTimeline(plan.timeline).slice(0, 3); // máx 3
  logger.info(`→ Generando ${segments.length} segmentos…`);

  const limit = pLimit(CONCURRENCY);
  const clipUrls: string[] = [];

  await Promise.all(
    segments.map(seg => limit(async () => {
      const prompt = buildPrompt(seg, plan.metadata.visualStyle);
      const frames = (seg.end - seg.start + 1) * 24;

      let videoUrl: string | null = null;
      try {
        videoUrl = await asyncTimeout(genWithRunway(prompt, frames));
      } catch (e: any) {
        logger.warn(`Runway falla (seg ${seg.start}): ${e.message}`);
        try {
          videoUrl = await asyncTimeout(
            genWithReplicate(prompt, frames, plan.metadata.visualStyle as "realistic" | "anime" | "cartoon")
          );
        } catch (re) {
          logger.error(`Replicate también falla (seg ${seg.start})`);
          return; // omite segmento
        }
      }

      /* stream → archivo */
      const filename  = `clip_${seg.start}_${uuid().slice(0, 8)}.mp4`;
      const localPath = path.join(TMP_CLIPS, filename);
      const resp = await fetch(videoUrl!);
      await pipeline(resp.body!, fss.createWriteStream(localPath));

      /* subir a CDN */
      const { uploadToCDN } = await import('./cdnService.js');
      const cdnUrl = await uploadToCDN(localPath, `clips/${filename}`);
      clipUrls.push(cdnUrl);
      logger.info(`✅ Clip listo: ${cdnUrl}`);
    }))
  );

  logger.info(`✅ Total clips subidos: ${clipUrls.length}`);
  return clipUrls;
}
