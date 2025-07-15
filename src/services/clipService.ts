/*──────────────────────── clipService.ts v7.2 ────────────────────────
 * Storyteller AI · ClipService
 * --------------------------------------------------------------------
 * • Genera clips con Replicate.
 * • Descarga en streaming  → /tmp  → sube a Google Cloud Storage.
 * -------------------------------------------------------------------*/

import fs              from 'fs/promises';
import fss             from 'fs';
import path            from 'path';
import { pipeline }    from 'stream/promises';
import { v4 as uuid }  from 'uuid';
import fetch           from 'node-fetch';
import pLimit          from 'p-limit';
import Replicate       from 'replicate';

import { env }       from '../config/env.js';
import { logger }    from '../utils/logger.js';
import { retry }     from '../utils/retry.js';
import type {
  VideoPlan,
  TimelineSecond
} from '../utils/types.js';

/* ── Config ───────────────────────────────────────────────────────── */
const CONCURRENCY    = Number(env.GEN2_CONCURRENCY ?? 3);
const GEN_TIMEOUT_MS = Number(env.GEN2_TIMEOUT_MS ?? 300_000); // 5 minutos por defecto
const TMP_CLIPS      = '/tmp/clips_v7';
await fs.mkdir(TMP_CLIPS, { recursive: true });

const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });

const DUMMY_IMAGE = 'https://dummyimage.com/1280x720/222/fff.png'; // Puedes poner tu propio PNG CDN


// Modelos principales y recomendados para cada estilo
const MODEL_MAP = {
  realistic: 'google/veo-3',                // Google Veo 3 - realista, rápido
  anime    : 'bytedance/seedance-1-pro',    // Seedance Pro - anime/cartoon
  cartoon  : 'pixverse/pixverse-v4.5',      // PixVerse v4.5 - cartoon/estilizado
  cinematic: 'luma/ray-2-720p',             // Luma Ray 2 - cinematic, escenas complejas
  flash    : 'luma/ray-flash-2-540p',       // Luma Ray Flash 2 - escenas rápidas, anime
  kling    : 'kwaivgi/kling-v2.1',          // Kling v2.1 - animación avanzada
  director : 'minimax/video-01-director',   // Director - movimientos de cámara
} as const;


// Modelos de fallback adicionales y robustos
const FALLBACK_MODELS = {
  backup1: 'bytedance/seedance-1-lite',     // Seedance Lite - rápido, menor calidad
  backup2: 'minimax/hailuo-02',             // Hailuo 2 - robusto, buena física
  backup3: 'kwaivgi/kling-v2.1',            // Kling v2.1 - animación avanzada
  backup4: 'luma/ray-flash-2-540p',         // Ray Flash 2 - escenas rápidas
  backup5: 'minimax/video-01-director'      // Director como fallback para cualquier estilo
} as const;

/* ── Helpers ──────────────────────────────────────────────────────── */
async function withTimeout<T>(p: Promise<T>, ms = GEN_TIMEOUT_MS) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error('clip timeout')), ms))
  ]);
}

/* ── Core generators ─────────────────────────────────────────────── */
import { createReadStream } from 'fs';
import os from 'os';

// Siempre descarga la imagen a un archivo temporal local y la lee como buffer
async function fetchImageBuffer(imagePathOrUrl: string): Promise<Buffer> {
  let tempPath = '';
  
  if (imagePathOrUrl === DUMMY_IMAGE) {
    // Para la imagen dummy, crear un buffer simple
    const resp = await fetch(imagePathOrUrl);
    if (!resp.ok) throw new Error('No se pudo descargar la imagen dummy');
    const buffer = Buffer.from(await resp.arrayBuffer());
    return buffer;
  }
  
  if (imagePathOrUrl.startsWith('file://')) {
    // Local file
    const localPath = imagePathOrUrl.replace('file://', '');
    tempPath = localPath;
  } else if (imagePathOrUrl.startsWith('http')) {
    // Descargar a archivo temporal
    const resp = await fetch(imagePathOrUrl);
    if (!resp.ok) throw new Error('No se pudo descargar la imagen');
    const arr = new Uint8Array(await resp.arrayBuffer());
    tempPath = path.join(os.tmpdir(), `img_${uuid().slice(0,8)}.png`);
    await fs.writeFile(tempPath, arr);
  } else {
    // Asumir que es una ruta local
    tempPath = imagePathOrUrl;
  }

  // Leer el archivo como buffer
  const buffer = await fs.readFile(tempPath);
  
  // Limpiar archivos temporales si los creamos
  if (imagePathOrUrl.startsWith('http') && tempPath) {
    try {
      await fs.unlink(tempPath);
    } catch {}
  }
  
  return buffer;
}

// Valida si una imagen es accesible y es realmente una imagen
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, { method: 'HEAD' });
    if (!resp.ok) return false;
    const type = resp.headers.get('content-type') || '';
    return type.startsWith('image/');
  } catch {
    return false;
  }
}

async function genReplicate(
  prompt: string,
  frames: number,
  style: keyof typeof MODEL_MAP,
  referenceImages?: string[]
): Promise<string> {
  let dur = Math.min(Math.ceil(frames / 24), 10);
  const model = MODEL_MAP[style];
  let input: any = { prompt: prompt.trim() };

  // Validar imagen si existe y es diferente a dummy
  let validImage: string | undefined = undefined;
  if (referenceImages && referenceImages[0] && referenceImages[0] !== DUMMY_IMAGE) {
    const imgUrl = referenceImages[0];
    if (await isValidImageUrl(imgUrl)) {
      validImage = imgUrl;
    } else {
      logger.warn(`⚠️ Imagen de referencia no válida o inaccesible: ${imgUrl}. Se omitirá.`);
    }
  }

  // Ajuste por modelo según doc oficial
  if (model === 'luma/ray-2-720p' || model === 'luma/ray-flash-2-540p') {
    // Solo prompt y duration (5 o 9)
    dur = dur >= 9 ? 9 : 5;
    input.duration = dur;
    // Estos modelos NO aceptan imagen, nunca la incluyas
  } else if (model === 'google/veo-3') {
    input.duration = Math.max(1, Math.min(dur, 10));
    input.aspect_ratio = '16:9';
    if (validImage) {
      input.input_image = validImage;
    }
  } else if (model === 'bytedance/seedance-1-pro') {
    input.duration = Math.max(1, Math.min(dur, 10));
    input.resolution = '1080p';
    input.aspect_ratio = '16:9';
    if (validImage) {
      input.input_image = validImage;
    }
  } else if (model === 'pixverse/pixverse-v4.5') {
    input.duration = Math.max(1, Math.min(dur, 8));
    input.resolution = '1080p';
    if (validImage) {
      input.input_image = validImage;
    }
  } else if (model === 'minimax/video-01-director') {
    input.duration = Math.max(1, Math.min(dur, 6));
    if (validImage) {
      input.first_frame_image = validImage;
    }
  } else if (model === 'kwaivgi/kling-v2.1') {
    // Kling acepta start_image
    if (validImage) {
      input.start_image = validImage;
    }
  }

  logger.info(`🎬 Generando con ${model} - dur:${input.duration ?? '-'}s - style:${style}`);
  try {
    const res: any = await replicate.run(model as any, { input });
    if (typeof res === 'string' && res.startsWith('http')) {
      return res;
    } else if (Array.isArray(res) && typeof res[0] === 'string' && res[0].startsWith('http')) {
      return res[0];
    } else if (res && typeof res === 'object') {
      if (typeof res.video === 'string' && res.video.startsWith('http')) return res.video;
      if (typeof res.output === 'string' && res.output.startsWith('http')) return res.output;
      if (typeof res.url === 'string' && res.url.startsWith('http')) return res.url;
      if (typeof res[0] === 'string' && res[0].startsWith('http')) return res[0];
      logger.error(`⚠️ Respuesta sin URL válida de ${model}: ${JSON.stringify(res)}`);
    } else {
      logger.error(`⚠️ Respuesta inesperada de ${model}: ${JSON.stringify(res)}`);
    }
    logger.error(`❌ No se obtuvo URL válida de ${model}. Respuesta completa: ${JSON.stringify(res)}`);
    throw new Error(`Formato de respuesta inesperado de ${model}`);
  } catch (error) {
    logger.error(`❌ Error con ${model}: ${(error as Error).message}`);
    throw error;
  }
}

async function genReplicateFallback(
  prompt: string,
  frames: number,
  modelName: string,
  referenceImages?: string[]
): Promise<string> {
  let dur = Math.min(Math.ceil(frames / 24), 10);
  let input: any = { prompt: prompt.trim() };

  // Ajuste por modelo según doc oficial
  if (modelName === 'bytedance/seedance-1-lite') {
    input.duration = Math.max(1, Math.min(dur, 10));
    input.resolution = '720p';
    input.aspect_ratio = '16:9';
    if (referenceImages && referenceImages[0] && referenceImages[0] !== DUMMY_IMAGE) {
      input.input_image = referenceImages[0];
    }
  } else if (modelName === 'minimax/hailuo-02') {
    input.duration = Math.max(1, Math.min(dur, 6));
    input.resolution = 'standard';
    if (referenceImages && referenceImages[0] && referenceImages[0] !== DUMMY_IMAGE) {
      input.image = referenceImages[0];
    }
  } else if (modelName === 'minimax/video-01-director') {
    input.duration = Math.max(1, Math.min(dur, 6));
    if (referenceImages && referenceImages[0] && referenceImages[0] !== DUMMY_IMAGE) {
      input.first_frame_image = referenceImages[0];
    }
  } else if (modelName === 'kwaivgi/kling-v2.1') {
    if (referenceImages && referenceImages[0] && referenceImages[0] !== DUMMY_IMAGE) {
      input.start_image = referenceImages[0];
    }
  } else if (modelName === 'luma/ray-2-720p' || modelName === 'luma/ray-flash-2-540p') {
    dur = dur >= 9 ? 9 : 5;
    input.duration = dur;
  }

  logger.info(`🔄 Usando modelo fallback: ${modelName}`);
  const res: any = await replicate.run(modelName as any, { input });
  if (typeof res === 'string' && res.startsWith('http')) {
    return res;
  } else if (Array.isArray(res) && typeof res[0] === 'string' && res[0].startsWith('http')) {
    return res[0];
  } else if (res && typeof res === 'object') {
    if (typeof res.video === 'string' && res.video.startsWith('http')) return res.video;
    if (typeof res.output === 'string' && res.output.startsWith('http')) return res.output;
    if (typeof res.url === 'string' && res.url.startsWith('http')) return res.url;
    if (typeof res[0] === 'string' && res[0].startsWith('http')) return res[0];
    logger.error(`⚠️ Fallback sin URL válida (${modelName}): ${JSON.stringify(res)}`);
  } else {
    logger.error(`⚠️ Fallback respuesta inesperada (${modelName}): ${JSON.stringify(res)}`);
  }
  throw new Error(`Formato de respuesta inesperado de ${modelName}`);
}

interface Segment { start: number; end: number; secs: TimelineSecond[]; duration: number }

// Divide el timeline en segmentos de 5 o 9 segundos (nunca 10)
function segment(tl: TimelineSecond[]): Segment[] {
  const segs: Segment[] = [];
  let i = 0;
  while (i < tl.length) {
    let remaining = tl.length - i;
    let dur = 0;
    if (remaining === 9) dur = 9;
    else if (remaining >= 10) dur = 9;
    else if (remaining >= 5) dur = 5;
    else if (remaining < 5 && segs.length > 0) {
      segs[segs.length - 1].end = tl.length - 1;
      segs[segs.length - 1].secs = tl.slice(segs[segs.length - 1].start, tl.length);
      segs[segs.length - 1].duration = segs[segs.length - 1].secs.length;
      break;
    } else {
      dur = remaining;
    }
    segs.push({ start: i, end: i + dur - 1, secs: tl.slice(i, i + dur), duration: dur });
    i += dur;
  }
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
  const segments = segment(plan.timeline);
  logger.info(`→ Generando ${segments.length} segmentos de 5 o 9s…`);
  const limit = pLimit(CONCURRENCY);
  const clipUrls: string[] = [];
  await Promise.all(segments.map(async (seg, idx) => {
    const prompt = buildPrompt(seg, plan.metadata.visualStyle);
    const frames = seg.duration * 24;
    let referenceImages: string[] = [];
    if (Array.isArray(storyboardUrls) && storyboardUrls[seg.start] && storyboardUrls[seg.start].startsWith('http')) {
      referenceImages = [storyboardUrls[seg.start]];
    }
    // Lista de modelos para probar en orden de preferencia
    const baseStyle = plan.metadata.visualStyle as keyof typeof MODEL_MAP;
    const hasComplexMovement = seg.secs.some(s =>
      s.camera.movement !== 'none' &&
      ['dolly-in', 'dolly-out', 'pan', 'tilt', 'zoom'].includes(s.camera.movement)
    );
    const fallbackModels: Array<keyof typeof MODEL_MAP> = hasComplexMovement
      ? ['cinematic', baseStyle, 'realistic', 'cartoon']
      : [baseStyle, 'realistic', 'cinematic', 'cartoon'];
    const uniqueModels = [...new Set(fallbackModels)];

    let url: string | null = null;
    for (const modelStyle of uniqueModels) {
      try {
        logger.info(`🎬 Probando modelo Replicate: ${MODEL_MAP[modelStyle]} para seg ${seg.start}`);
        url = await withTimeout(genReplicate(
          prompt, frames, modelStyle, referenceImages
        ));
        // Validar que la URL es string y válida
        if (typeof url === 'string' && url.startsWith('http')) {
          logger.info(`✅ Éxito con ${MODEL_MAP[modelStyle]} para seg ${seg.start}`);
          break;
        } else {
          url = null;
        }
      } catch (err) {
        logger.warn(`❌ ${MODEL_MAP[modelStyle]} falló para seg ${seg.start}: ${(err as Error).message}`);
      }
    }

    // Si aún no hay URL, probar modelos de fallback adicionales
    if (!url) {
      const backupModels = Object.values(FALLBACK_MODELS);
      for (const backupModel of backupModels) {
        try {
          logger.info(`🆘 Probando modelo de emergencia ${backupModel} para seg ${seg.start}`);
          url = await withTimeout(genReplicateFallback(
            prompt, frames, backupModel, referenceImages
          ));
          if (typeof url === 'string' && url.startsWith('http')) {
            logger.info(`✅ Éxito con modelo de emergencia ${backupModel} para seg ${seg.start}`);
            break;
          } else {
            url = null;
          }
        } catch (err) {
          logger.warn(`❌ Modelo de emergencia ${backupModel} falló para seg ${seg.start}: ${(err as Error).message}`);
        }
      }
    }

    if (!url) {
      logger.error(`❌ Todos los modelos Replicate fallaron para seg ${seg.start}`);
      return;
    }

    // Validar URL antes de descargar
    if (typeof url !== 'string' || !url.startsWith('http')) {
      logger.error(`❌ URL inválida para seg ${seg.start}: ${url}`);
      return;
    }

    // Descargar en streaming → /tmp
    const fname = `clip_${seg.start}_${uuid().slice(0,8)}.mp4`;
    const local = path.join(TMP_CLIPS, fname);
    const resp  = await fetch(url);
    await pipeline(resp.body as any, fss.createWriteStream(local));

    // Subir a CDN
    const { uploadToCDN } = await import('./cdnService.js');
    const cdn = await uploadToCDN(local, `clips/${fname}`);
    clipUrls.push(cdn);
    logger.info(`✅ Clip listo: ${cdn}`);
  }));

  logger.info(`✅ Total clips subidos: ${clipUrls.length}`);
  return clipUrls;
}
