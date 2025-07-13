// src/services/clipService.ts
/**
 * Clip Service v6
 * ---------------
 * Funcionalidades:
 * ▸ Agrupa el timeline en “segmentos” de 2 s (o al cambio de `transition`)
 * ▸ Para cada segmento construye un prompt cinematográfico completo
 * ▸ Pipeline de generación: Runway Gen-2 → Dream Machine → Replicate
 *   Replicate usa modelo distinto según visualStyle:
 *      • realistic  → video-lcm/film
 *      • anime      → animate-diffusion/animatediff
 *      • cartoon    → kling-ai/kling-v1
 * ▸ Concurrencia controlada (GEN_CONC) y time-out (GEN_TIMEOUT)
 * ▸ Crea un clip MP4 por segmento, lo descarga en /tmp, y devuelve paths locales
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

/* ─── Config ─────────────────────────────────────────────── */
const GEN_CONCURRENCY = Number(env.GEN2_CONCURRENCY ?? 3);
const GEN_TIMEOUT_MS = Number(env.GEN2_TIMEOUT_MS ?? 150_000);
const TMP_CLIPS   = '/tmp/clips_v6';

const replicate   = new Replicate({ auth: env.REPLICATE_API_TOKEN });

/* Timeout helper */
async function withTimeout<T>(p: Promise<T>, ms = GEN_TIMEOUT_MS): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('clip timeout')), ms))
  ]);
}

/* ────────────────────────────────────────────────────────────
 * 1) Segmentación de timeline
 *    – Agrupar cada 2 s o cuando sec.transition !== 'none'
 * ────────────────────────────────────────────────────────── */
interface Segment { start: number; end: number; secs: TimelineSecond[] }

function segmentTimeline(tl: TimelineSecond[]): Segment[] {
  const segs: Segment[] = [];
  let current: Segment = { start: 0, end: 0, secs: [tl[0]] };

  for (let i=1; i<tl.length; i++) {
    const sec = tl[i];
    // Nuevo segmento si hay transición explícita o cada 2 segundos
    const needSplit = sec.transition !== 'none' || i % 2 === 0;
    if (needSplit) {
      current.end = i-1;
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
function buildPrompt(seg: Segment, style: VideoPlan['metadata']['visualStyle']): string {
  const first = seg.secs[0];
  const last  = seg.secs[seg.secs.length-1];
  const mainVisuals = [first.visual];
  if (seg.secs.length>1) mainVisuals.push(last.visual);

  return [
    mainVisuals.join(', '),
    `camera ${first.camera} shot movement`, // Ajustado para tratar 'camera' como string
    `style ${style}`,
    (first.sceneMood||'') + ' cinematic lighting',
    'ultra-smooth camera, 24 fps, no watermark'
  ].join(', ');
}

/* ────────────────────────────────────────────────────────────
 * 3) Providers
 * ────────────────────────────────────────────────────────── */
async function runwayGen(prompt: string, frames: number): Promise<string|null> {
  try {
    const res = await withTimeout(
      fetch('https://api.runwayml.com/v1/generations',{
        method:'POST',
        headers:{
          Authorization:`Bearer ${env.RUNWAY_API_TOKEN}`,
          'Content-Type':'application/json'
        },
        body:JSON.stringify({prompt,num_frames:frames,inference_steps:40})
      })
    );
    if (!res.ok) throw new Error(`Runway HTTP ${res.status}`);
    const { id } = await res.json() as any;

    /* polling */
    let wait = 3000;
    while(true){
      const poll = await fetch(`https://api.runwayml.com/v1/generations/${id}`,{
        headers:{Authorization:`Bearer ${env.RUNWAY_API_TOKEN}`}
      });
      const j:any = await poll.json();
      if (j.status==='completed') return j.urls.video;
      if (j.status==='failed') throw new Error(j.error||'Runway failed');
      await new Promise(r=>setTimeout(r,wait));
      wait = Math.min(wait*1.6, 15000);
    }
  }catch(e:any){
    logger.warn(`Runway fail: ${e.message}`); return null;
  }
}

async function dreamMachineGen(prompt:string,frames:number):Promise<string|null>{
  if (!env.DM_API_TOKEN) return null;
  try{
    const res = await withTimeout(fetch('https://api.dreammachine.ai/v1/generate',{
      method:'POST',
      headers:{Authorization:`Bearer ${env.DM_API_TOKEN}`,'Content-Type':'application/json'},
      body:JSON.stringify({prompt,frames,quality:'high'})
    }));
    if(!res.ok) throw new Error(`DM status ${res.status}`);
    const j:any = await res.json();
    return j.video_url;
  }catch(e:any){ logger.warn(`DM fail: ${e.message}`); return null;}
}

/* Replicate model map */
const MODEL_MAP: Record<VideoPlan['metadata']['visualStyle'],string> = {
  realistic: 'minimax/video-01',
  anime: 'animate-diffusion/animatediff',
  cartoon: 'minimax/video-01'
};
async function replicateGen(prompt:string,frames:number,style:VideoPlan['metadata']['visualStyle']):Promise<string>{
  const model = MODEL_MAP[style];
  const out = await withTimeout(
    retry(()=>replicate.run(model,{input:{prompt,num_frames:frames}}),2)
  );
  return (out as string[])[0];
}

/* ────────────────────────────────────────────────────────────
 * 4) generateClips (API pública)
 * ────────────────────────────────────────────────────────── */
export async function generateClips(plan: VideoPlan): Promise<string[]> {
  logger.info('🎞️  ClipService v6 — iniciando…');
  await fs.mkdir(TMP_CLIPS,{recursive:true});

  const segments = segmentTimeline(plan.timeline);
  logger.info(`→ ${segments.length} segmentos de vídeo`);

  const paths: string[] = [];

  /* batch por concurrencia */
  for (let i=0;i<segments.length;i+=GEN_CONCURRENCY){
    const batch = segments.slice(i,i+GEN_CONCURRENCY);

    const promises = batch.map(async (seg)=>{
      const prompt = buildPrompt(seg, plan.metadata.visualStyle);
      const frames = (seg.end-seg.start+1)*24;  // 24 fps nativo

      const url =
        await runwayGen(prompt,frames) ??
        await dreamMachineGen(prompt,frames) ??
        await replicateGen(prompt,frames,plan.metadata.visualStyle);

      if (!url) throw new Error('no clip url');

      // descarga a TMP
      const dest = path.join(TMP_CLIPS, `clip_${seg.start}_${uuid().slice(0,6)}.mp4`);
      const buf  = await fetch(url).then(r=>r.arrayBuffer()).then(b=>Buffer.from(b));
      await fs.writeFile(dest,buf);
      return dest;
    });

    paths.push(...await Promise.all(promises));
  }

  logger.info(`✅  Clips generados: ${paths.length}`);
  return paths;
}
