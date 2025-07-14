/*──────────────────────── clipService.ts v7.2 ────────────────────────
 * Storyteller AI · ClipService
 * --------------------------------------------------------------------
 * • Genera clips con Runway Gen‑4 Turbo. Fallback a Replicate.
 * • Descarga en streaming  → /tmp  → sube a Google Cloud Storage.function buildPrompt(seg: Segment, style: VideoPlan['metadata']['visualStyle']) {
  const f = seg.secs[0];
  const l = seg.secs[seg.secs.length - 1];
  
  // Construir comando de cámara específico para Director
  const cameraCommand = `[${f.camera.shot} shot, ${f.camera.movement}]`;
  
  return [
    cameraCommand,  // Comando de cámara al inicio para Director
    [f.visual, seg.secs.length > 1 ? l.visual : ''].filter(Boolean).join(', '),
    `style ${style}`,
    (f.sceneMood || '') + ' cinematic lighting',
    '24 fps, ultra‑smooth, no watermark'
  ].filter(Boolean).join(', ');
}rrencia limitada por ENV GEN2_CONCURRENCY.
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
const GEN_TIMEOUT_MS = Number(env.GEN2_TIMEOUT_MS ?? 150_000);
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

// RunwayML eliminado: función genRunway removida

async function genReplicateFallback(
  prompt: string,
  frames: number,
  modelName: string,
  referenceImages?: string[]
): Promise<string> {
  const dur = Math.min(Math.ceil(frames / 24), 10);
  
  let input: any = {
    prompt: prompt.trim(),
    duration: dur
  };

  // Configuración para modelos de fallback
  if (modelName === 'bytedance/seedance-1-lite') {
    input = {
      prompt: prompt.trim(),
      duration: dur,
      resolution: '720p',
      aspect_ratio: '16:9'
    };
    
    if (referenceImages && referenceImages.length > 0 && referenceImages[0] !== DUMMY_IMAGE) {
      input.input_image = referenceImages[0];
    }
    
  } else if (modelName === 'minimax/hailuo-02') {
    input = {
      prompt: prompt.trim(),
      duration: Math.min(dur, 6), // Hailuo máximo 6s
      resolution: 'standard'      // 720p
    };
    
    if (referenceImages && referenceImages.length > 0 && referenceImages[0] !== DUMMY_IMAGE) {
      input.image = referenceImages[0];
    }
    
  } else if (modelName === 'minimax/video-01-director') {
    // Director como fallback - especializado en movimientos de cámara
    input = {
      prompt: prompt.trim(),
      duration: Math.min(dur, 6) // Director máximo 6s
    };
    
    if (referenceImages && referenceImages.length > 0 && referenceImages[0] !== DUMMY_IMAGE) {
      input.first_frame_image = referenceImages[0];
    }
  }

  logger.info(`🔄 Usando modelo fallback: ${modelName}`);
  
  const res: any = await replicate.run(modelName as any, { input });
  
  // Manejar diferentes formatos de respuesta
  if (typeof res === 'string') {
    return res;
  } else if (Array.isArray(res)) {
    return res[0];
  } else if (res && typeof res === 'object') {
    return res.video || res.output || res.url || res[0];
  }
  
  throw new Error(`Formato de respuesta inesperado de ${modelName}`);
}

async function genReplicate(
  prompt: string,
  frames: number,
  style: keyof typeof MODEL_MAP,
  referenceImages?: string[]
): Promise<string> {
  const dur = Math.min(Math.ceil(frames / 24), 10); // Aumentar a máximo 10s
  const model = MODEL_MAP[style];
  
  let input: any = {
    prompt: prompt.trim(),
    duration: dur
  };

  // Configuración específica por modelo
  if (model === 'google/veo-3') {
    // Google Veo 3 - text-to-video y image-to-video
    input = {
      prompt: prompt.trim(),
      duration: dur,
      aspect_ratio: '16:9'
    };
    
    // Si hay imagen de referencia, usarla como input_image
    if (referenceImages && referenceImages.length > 0 && referenceImages[0] !== DUMMY_IMAGE) {
      input.input_image = referenceImages[0];
    }
    
  } else if (model === 'bytedance/seedance-1-pro') {
    // Seedance Pro - muy bueno para anime/cartoon
    input = {
      prompt: prompt.trim(),
      duration: dur,
      resolution: '1080p',
      aspect_ratio: '16:9'
    };
    
    if (referenceImages && referenceImages.length > 0 && referenceImages[0] !== DUMMY_IMAGE) {
      input.input_image = referenceImages[0];
    }
    
  } else if (model === 'pixverse/pixverse-v4.5') {
    // PixVerse v4.5 - excelente para cartoon
    input = {
      prompt: prompt.trim(),
      duration: Math.min(dur, 8), // PixVerse máximo 8s
      resolution: '1080p'
    };
    
    if (referenceImages && referenceImages.length > 0 && referenceImages[0] !== DUMMY_IMAGE) {
      input.input_image = referenceImages[0];
    }
    
  } else if (model === 'minimax/video-01-director') {
    // Director - especializado en movimientos de cámara complejos
    input = {
      prompt: prompt.trim(),
      duration: Math.min(dur, 6) // Director máximo 6s
    };
    
    // Para Director, usar first_frame_image en lugar de input_image
    if (referenceImages && referenceImages.length > 0 && referenceImages[0] !== DUMMY_IMAGE) {
      input.first_frame_image = referenceImages[0];
    }
  }

  logger.info(`🎬 Generando con ${model} - dur:${dur}s - style:${style}`);
  
  try {
    const res: any = await replicate.run(model as any, { input });
    
    // Manejar diferentes formatos de respuesta
    if (typeof res === 'string') {
      return res;
    } else if (Array.isArray(res)) {
      return res[0];
    } else if (res && typeof res === 'object') {
      return res.video || res.output || res.url || res[0];
    }
    
    throw new Error(`Formato de respuesta inesperado de ${model}`);
    
  } catch (error) {
    logger.error(`❌ Error con ${model}: ${(error as Error).message}`);
    throw error;
  }
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

    // Buscar imagen de storyboard local (si existe), luego dummy
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
        if (url) {
          logger.info(`✅ Éxito con ${MODEL_MAP[modelStyle]} para seg ${seg.start}`);
          break;
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
          if (url) {
            logger.info(`✅ Éxito con modelo de emergencia ${backupModel} para seg ${seg.start}`);
            break;
          }
        } catch (err) {
          logger.warn(`❌ Modelo de emergencia ${backupModel} falló para seg ${seg.start}: ${(err as Error).message}`);
        }
      }
    }

    if (!url) {
      logger.error(`❌ Todos los modelos Replicate fallaron para seg ${seg.start}`);
      return; // omite segmento
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
