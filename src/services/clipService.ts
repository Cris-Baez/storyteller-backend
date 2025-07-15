/*──────────────────────── clipService.ts v7.2 ────────────────────────
 * Storyteller AI · ClipService
 * --------------------------------------------------------------------
 * • Genera clips con Replicate.
 * • Descarga en streaming  → /tmp  → sube a Google Cloud Storage.
 * -------------------------------------------------------------------*/

/*────────────────── clipService.ts v7.3 ──────────────────*/
import fs from 'fs/promises';
import fss from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { v4 as uuid } from 'uuid';
import fetch from 'node-fetch';
import pLimit from 'p-limit';
import Replicate from 'replicate';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { extractVideoUrl } from '../utils/extractVideoUrl.js';
import type { VideoPlan, TimelineSecond } from '../utils/types.js';

const TMP = '/tmp/clips_v7';
await fs.mkdir(TMP, { recursive: true });

const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

const MODEL = {
  realistic : 'google/veo-3',
  anime     : 'bytedance/seedance-1-pro',
  cartoon   : 'pixverse/pixverse-v4.5',
  cinematic : 'luma/ray-2-720p',
} as const;

const MINIMAX_DIRECTOR = 'minimax/video-01-director';

const BACKUP = [
  'bytedance/seedance-1-lite',
  'minimax/hailuo-02',
  'luma/ray-flash-2-540p',
];

// util duración
function supports(m: string, d: number) {
  if (m.startsWith('luma/ray-2'))         return d === 5 || d === 9;
  if (m === 'pixverse/pixverse-v4.5')     return d <= 8;
  if (m.startsWith('minimax/video-01'))   return d <= 6;
  return true;
}

// timeline → segmentos de 5 s
interface Segment { start:number; end:number; secs:TimelineSecond[]; dur:number; }
function segment(tl: TimelineSecond[]): Segment[] {
  const out: Segment[] = [];
  for (let i = 0; i < tl.length; i += 5) {
    const end = Math.min(i+4, tl.length-1);
    out.push({ start:i, end, secs:tl.slice(i,end+1), dur:end-i+1 });
  }
  return out;
}


// prompt avanzado: usa todos los campos de la plantilla
function promptOf(seg: Segment, style: string, plan: VideoPlan) {
  const a = seg.secs[0], b = seg.secs[seg.secs.length-1];
  const env = (plan as any).environment || {};
  const grading = (plan as any).grading || {};
  const shotList = (plan as any).shot_list || [];
  const characters = plan.metadata?.characters || [];
  let shotDesc = '';
  if (shotList.length) {
    const shotIdx = shotList.findIndex((s:any) => s.TCIn === a.t || s.TCIn === a.scene);
    if (shotIdx >= 0) {
      const shot = shotList[shotIdx];
      shotDesc = [shot.Plano, shot.Lens, shot.Move].filter(Boolean).join(', ');
    }
  }
  let charDesc = '';
  if (characters.length) {
    const char = characters[0];
    charDesc = [char.name, char.gender, char.age, char.language].filter(Boolean).join(', ');
  }
  return [
    env.ext_int ? `escena: ${env.ext_int}` : '',
    env.location ? `lugar: ${env.location}` : '',
    env.timeOfDay ? `hora: ${env.timeOfDay}` : '',
    env.weather ? `clima: ${env.weather}` : '',
    env.setDressing ? `decorado: ${Array.isArray(env.setDressing) ? env.setDressing.join(', ') : env.setDressing}` : '',
    env.lighting ? `luz: ${JSON.stringify(env.lighting)}` : '',
    env.cameraRig ? `cámara: ${JSON.stringify(env.cameraRig)}` : '',
    [a.visual, seg.secs.length>1?b.visual:''].filter(Boolean).join(', '),
    shotDesc,
    `cámara ${a.camera.shot} ${a.camera.movement}`,
    charDesc,
    `estilo: ${style}`,
    grading.lut ? `LUT: ${grading.lut}` : '',
    grading.grain ? `grano: ${grading.grain}` : '',
    (a.sceneMood||'')+' cinematic lighting',
    '24 fps, no watermark'
  ].filter(Boolean).join(', ');
}


// Polling robusto para esperar job Replicate y obtener la URL del video
async function pollReplicateJob(model: string, input: Record<string, any>, maxWaitMs = 600_000, pollIntervalMs = 3500) {
  logger.info(`🚦 Solicitando generación a Replicate (${model})...`);
  let prediction;
  try {
    prediction = await replicate.predictions.create({
      version: undefined, // usar última versión
      model,
      input,
      webhook: undefined,
      stream: false,
    });
  } catch (err) {
    logger.error(`❌ Error creando predicción Replicate: ${(err as Error).message}`);
    throw err;
  }
  logger.info(`🕒 Esperando job Replicate: ${prediction.id}`);
  const started = Date.now();
  let status = prediction.status;
  let output = prediction.output;
  let lastErr = '';
  let pollCount = 0;
  let url: string | undefined = undefined;
  while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
    if (Date.now() - started > maxWaitMs) {
      logger.error(`⏰ Timeout esperando job Replicate (${model}) tras ${(Date.now()-started)/1000}s`);
      // Si hay una URL válida, permítele continuar aunque haya timeout
      {
        const maybeUrl = extractVideoUrl(output);
        url = maybeUrl === null ? undefined : maybeUrl;
      }
      if (url) {
        logger.warn(`⚠️ Timeout, pero se detectó video generado. Continuando con la URL: ${url}`);
        break;
      }
      throw new Error(`Timeout esperando job Replicate (${model})`);
    }
    await new Promise(r => setTimeout(r, pollIntervalMs));
    pollCount++;
    try {
      const poll = await replicate.predictions.get(prediction.id);
      status = poll.status;
      output = poll.output;
      lastErr = typeof poll.error === 'string' ? poll.error : (poll.error ? JSON.stringify(poll.error) : '');
      logger.info(`🔄 [${model}] Poll #${pollCount}: status=${status}`);
      if (status === 'processing' || status === 'starting') {
        if (poll.logs) logger.debug(`   Progreso: ${poll.logs}`);
        // Si ya hay una URL de video válida, permítele continuar
        {
          const maybeUrl = extractVideoUrl(output);
          url = maybeUrl === null ? undefined : maybeUrl;
        }
        if (url) {
          logger.warn(`⚠️  Status aún en '${status}', pero se detectó video generado. Continuando con la URL: ${url}`);
          break;
        }
      }
    } catch (err) {
      logger.warn(`⚠️  Error polling Replicate: ${(err as Error).message}`);
    }
  }
  if (status !== 'succeeded' && !url) {
    logger.error(`❌ Job Replicate falló (${model}): ${lastErr || status}`);
    throw new Error(`Job Replicate falló (${model}): ${lastErr || status}`);
  }
  if (!url) {
    const maybeUrl = extractVideoUrl(output);
    url = maybeUrl === null ? undefined : maybeUrl;
  }
  if (!url) {
    logger.error(`❌ Respuesta Replicate sin URL de video (${model})`);
    throw new Error('respuesta sin URL');
  }
  logger.info(`🎬 URL de video lista para descargar (${model}): ${url}`);
  return url;
}

// API principal

export async function generateClips(plan: VideoPlan): Promise<string[]> {
  logger.info('🎞️ ClipService v7.4 – start');
  const lim  = pLimit(Number(env.GEN2_CONCURRENCY ?? 3));
  const segs = segment(plan.timeline);
  logger.info(`→ ${segs.length} segmentos de 5 s`);

  const urls: string[] = [];

  await Promise.all(segs.map(seg => lim(async () => {
    const frames = seg.dur*24;
    const style = plan.metadata.visualStyle;
    const pref   = MODEL[style as keyof typeof MODEL] ?? MODEL.realistic;

    // Priorizar minimax/video-01-director para realistic y cinematic, y poner google/veo-2 como última opción
    let tryModels: string[] = [];
    const GOOGLE_VEO = 'google/veo-2';
    if (style === 'realistic' || style === 'cinematic') {
      tryModels = [MINIMAX_DIRECTOR, pref, MODEL.realistic, MODEL.cinematic, ...BACKUP, GOOGLE_VEO];
    } else {
      tryModels = [pref, MODEL.realistic, ...BACKUP, GOOGLE_VEO];
    }

    let src: string|undefined;
    for (const m of tryModels) {
      if (!supports(m, seg.dur)) {
        logger.info(`⏩ Modelo ${m} no soporta duración ${seg.dur}s, se omite.`);
        continue;
      }
      // Construir input según modelo
      let input: Record<string, any> = {};
      if (m.startsWith('bytedance/seedance-1-pro')) {
        input = {
          fps: 24,
          prompt: promptOf(seg, style, plan),
          duration: seg.dur,
          resolution: '1080p',
          aspect_ratio: '16:9',
          camera_fixed: false
        };
      } else if (m.startsWith('minimax/hailuo-02')) {
        input = {
          prompt: promptOf(seg, style, plan),
          duration: seg.dur,
          resolution: '1080p',
          prompt_optimizer: false
        };
      } else if (m.startsWith('minimax/video-01-director')) {
        input = {
          prompt: promptOf(seg, style, plan),
          prompt_optimizer: true
        };
      } else if (m.startsWith('minimax/video-01')) {
        input = {
          prompt: promptOf(seg, style, plan),
          prompt_optimizer: true
        };
      } else if (m.startsWith('luma/ray-flash-2-720p')) {
        input = {
          loop: false,
          prompt: promptOf(seg, style, plan),
          duration: seg.dur,
          aspect_ratio: '16:9'
        };
      } else if (m.startsWith('luma/ray-2-720p') || m.startsWith('luma/ray-2')) {
        input = {
          prompt: promptOf(seg, style, plan),
          duration: seg.dur,
          aspect_ratio: '16:9'
        };
      } else if (m === GOOGLE_VEO) {
        input = {
          prompt: promptOf(seg, style, plan),
          duration: seg.dur,
          aspect_ratio: '16:9'
        };
      } else if (m === 'pixverse/pixverse-v4.5') {
        input = {
          prompt: promptOf(seg, style, plan),
          duration: seg.dur,
          aspect_ratio: '16:9'
        };
      } else {
        input = {
          prompt: promptOf(seg, style, plan),
          duration: seg.dur
        };
      }
      try {
        src = await pollReplicateJob(m, input);
        logger.info(`✅ ${m} OK (seg${seg.start})`);
        break;
      } catch (e:any) {
        logger.warn(`❌ ${m} ${e.message}`);
      }
    }
    if (!src) {
      logger.error(`× sin clip seg${seg.start}`);
      return;
    }

    /* stream‑download → /tmp (con reintentos) */
    const fn = path.join(TMP, `clip_${seg.start}_${uuid().slice(0,8)}.mp4`);
    let ok = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      logger.info(`⬇️  Descargando video (intento ${attempt}/3): ${src}`);
      try {
        const r = await fetch(src);
        if (!r.ok) {
          logger.error(`❌ Error descargando video: ${src} - status: ${r.status}`);
          continue;
        }
        await pipeline(r.body as any, fss.createWriteStream(fn));
        let stats;
        try {
          stats = fss.statSync(fn);
        } catch (err) {
          logger.error(`❌ No se pudo leer el archivo descargado: ${fn}`);
          continue;
        }
        if (stats.size < 100_000) {
          logger.error(`❌ Archivo de video muy pequeño o vacío: ${fn} (${stats.size} bytes)`);
          // Elimina archivo corrupto
          try { fss.unlinkSync(fn); } catch {}
          continue;
        }
        logger.info(`✅ Video descargado: ${fn} (${stats.size} bytes)`);
        ok = true;
        break;
      } catch (err) {
        logger.error(`❌ Error inesperado al descargar video: ${(err as Error).message}`);
        try { fss.unlinkSync(fn); } catch {}
      }
    }
    if (!ok) {
      logger.error(`❌ Fallaron todos los intentos de descarga para: ${src}`);
      return;
    }

    /* subir a CDN */
    logger.info(`⬆️  Subiendo a CDN: ${fn}`);
    let cdn: string | undefined;
    try {
      const { uploadToCDN } = await import('./cdnService.js');
      cdn = await uploadToCDN(fn, path.basename(fn));
      if (!cdn || typeof cdn !== 'string' || !cdn.startsWith('http')) {
        logger.error(`❌ uploadToCDN no devolvió URL válida para: ${fn}`);
        return;
      }
      // Verifica que el archivo subido sea accesible (opcional, si tienes fetch disponible)
      try {
        const resp = await fetch(cdn, { method: 'HEAD' });
        if (!resp.ok) {
          logger.error(`❌ El archivo subido no es accesible en CDN: ${cdn} (status: ${resp.status})`);
        } else {
          logger.info(`✅ Archivo accesible en CDN: ${cdn}`);
        }
      } catch (err) {
        logger.warn(`⚠️  No se pudo verificar acceso CDN por red: ${(err as Error).message}`);
      }
      urls.push(cdn);
      logger.info(`☁️ subido: ${cdn}`);
    } catch (err) {
      logger.error(`❌ Error subiendo a CDN: ${(err as Error).message}`);
      return;
    }
  })));

  logger.info(`✅ Total clips: ${urls.length}`);
  return urls;
}
    
