// Extiende RenderRequest para Cinema AI (campos extra para engines modernos)
type RenderRequestExtended = RenderRequest & {
  type?: string;
  style?: string;
  hasDialogue?: boolean;
  loraCharacter?: string;
  baseImages?: string[];
  seed?: number | string;
};
// Tabla de capacidades de modelos IA (julio 2025)
// Puedes actualizar esto fácilmente si hay nuevos modelos o cambios
const MODEL_CAPABILITIES: Record<string, { durations: number[], quality: number, notes?: string }> = {
  // Duraciones máximas reales según specs y pruebas (julio 2025)
  'runway/gen4_turbo': { durations: [16, 10, 5], quality: 9, notes: 'Realista/cinemático, máx 16s, requiere imagen base.' },
  'google/veo-3':      { durations: [60, 45, 30, 15, 10, 5], quality: 10, notes: 'Calidad top, máx 60s, ideal para clips largos.' },
  'luma/ray-2-720p':   { durations: [18, 9, 5], quality: 8, notes: 'Muy rápido, máx 18s, buena calidad.' },
  'pixverse/pixverse-v4.5': { durations: [8,7,6,5,4,3,2,1], quality: 7, notes: 'Animación/cartoon, máx 8s.' },
  'bytedance/seedance-1-pro': { durations: [15, 10, 5], quality: 8, notes: 'Anime, dinámico, máx 15s.' },
  'minimax/video-01-director': { durations: [6,5,4,3,2,1], quality: 6, notes: 'Creativo, experimental, máx 6s.' },
  'bytedance/seedance-1-lite': { durations: [15, 10, 5], quality: 6, notes: 'Versión lite, máx 15s.' },
  'minimax/hailuo-02': { durations: [15, 10, 5], quality: 6, notes: 'Experimental, máx 15s.' },
  'luma/ray-flash-2-540p': { durations: [15, 10, 5], quality: 5, notes: 'Rápido, máx 15s.' },
  // ...agrega más si tienes acceso
};

// Devuelve la lista óptima de segmentos (duraciones) para cubrir totalSeconds, priorizando menos cortes y mayor calidad
function optimalSegments(totalSeconds: number, allowedModels: string[]): { model: string, duration: number }[] {
  // Filtra modelos válidos y ordena por calidad descendente
  const candidates = allowedModels
    .map(m => ({ name: m, ...MODEL_CAPABILITIES[m] }))
    .filter(m => m && m.durations && m.durations.length)
    .sort((a, b) => b.quality - a.quality);

  let rem = totalSeconds;
  const result: { model: string, duration: number }[] = [];

  // Estrategia: siempre priorizar el segmento más largo posible del modelo de mayor calidad
  while (rem > 0) {
    let found = false;
    for (const cand of candidates) {
      // Busca la mayor duración posible <= rem
      const d = cand.durations.find(x => x <= rem);
      if (d) {
        result.push({ model: cand.name, duration: d });
        rem -= d;
        found = true;
        break;
      }
    }
    if (!found) {
      // Si no hay modelo que cubra el resto, usa Veo3 como último recurso (si no está ya)
      if (!result.some(r => r.model === 'google/veo-3') && MODEL_CAPABILITIES['google/veo-3'].durations.some(d=>d<=rem)) {
        const d = MODEL_CAPABILITIES['google/veo-3'].durations.find(x => x <= rem);
        if (d) {
          result.push({ model: 'google/veo-3', duration: d });
          rem -= d;
          continue;
        }
      }
      // Si ni así, aborta
      throw new Error(`No hay modelo IA que soporte segmento de ${rem}s`);
    }
  }
  // Ajuste final: si la suma de segmentos sobrepasa o no cubre exacto, corrige el último
  const sum = result.reduce((a, b) => a + b.duration, 0);
  if (sum !== totalSeconds && result.length > 0) {
    const diff = totalSeconds - sum;
    result[result.length - 1].duration += diff;
    if (result[result.length - 1].duration <= 0) {
      throw new Error('Segmentación inválida: duración negativa');
    }
  }
  return result;
}

// Ejemplo de uso/documentación:
// optimalSegments(15, ['runway/gen4_turbo','bytedance/seedance-1-pro','google/veo-3'])
// → [{model:'bytedance/seedance-1-pro',duration:15}]
// optimalSegments(25, ['runway/gen4_turbo','bytedance/seedance-1-pro','google/veo-3'])
// → [{model:'google/veo-3',duration:15},{model:'google/veo-3',duration:10}]
// optimalSegments(10, ['runway/gen4_turbo','google/veo-3'])
// → [{model:'runway/gen4_turbo',duration:10}]
/*──────────────────────── clipService.ts v7.2 ────────────────────────
 * Storyteller AI · ClipService
 * --------------------------------------------------------------------
 * • Genera clips con arquitectura multi-motor (videoEngine).
 * • Descarga en streaming  → /tmp  → sube a Google Cloud Storage.
 * -------------------------------------------------------------------*/

/*────────────────── clipService.ts v7.3 ──────────────────*/
import fs from 'fs/promises';
import fss from 'fs';
import path from 'path';
import { uploadToCDN } from './cdnService.js';
import { pipeline } from 'stream/promises';
import { v4 as uuid } from 'uuid';
import fetch from 'node-fetch';
import pLimit from 'p-limit';


import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { applySadTalker } from './sadtalkerService.js';
import { applyWav2Lip } from './wav2lipService.js';
import { extractVideoUrl } from '../utils/extractVideoUrl.js';
import type { VideoPlan, TimelineSecond, AllowedDuration, RenderRequest } from '../utils/types.js';

const TMP = '/tmp/clips_v7';
await fs.mkdir(TMP, { recursive: true });


// Importar el nuevo engine multi-motor
import { generateVideoByType } from './videoEngine.js';

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
  // Forzar trigger_word de personaje y fondo al inicio del prompt
  const triggerActor = 'TheRockActor';
  const triggerBg = 'Samuraifield';
  const userPrompt = plan.metadata?.prompt || '';
  return [
    `${triggerActor}, ${triggerBg}`,
    userPrompt,
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




// API principal

export async function generateClips(plan: VideoPlan): Promise<string[]> {
  // Validación estricta: el prompt del usuario debe estar siempre en metadata.prompt
  if (!plan.metadata || typeof plan.metadata.prompt !== 'string' || !plan.metadata.prompt.trim()) {
    logger.error('[ClipService] FALTA prompt en plan.metadata.prompt. plan.metadata=' + JSON.stringify(plan.metadata));
    throw new Error('Falta prompt en metadata.prompt. No se puede generar video sin prompt base.');
  }
  logger.info('🎞️ ClipService v9 – usando videoEngine multi-motor');
  const lim  = pLimit(Number(env.GEN2_CONCURRENCY ?? 3));
  // Determinar duración total
  const totalSeconds = plan.timeline.length;
  // Calcular segmentos óptimos (puedes mejorar allowedModels según lógica de negocio)
  const allowedModels = [
    'runway/gen4_turbo',
    'bytedance/seedance-1-pro',
    'luma/ray-2-720p',
    'pixverse/pixverse-v4.5',
    'minimax/video-01-director',
    ...BACKUP
  ];
  const segments = optimalSegments(totalSeconds, allowedModels);
  logger.info(`→ Segmentos óptimos: ${segments.map(s=>`${s.model}(${s.duration}s)`).join(' + ')}`);

  // Mapear segmentos a timeline
  let t = 0;
  const segs: { model: string, seg: Segment }[] = [];
  for (const s of segments) {
    const seg: Segment = {
      start: t,
      end: t + s.duration - 1,
      secs: plan.timeline.slice(t, t + s.duration),
      dur: s.duration
    };
    segs.push({ model: s.model, seg });
    t += s.duration;
  }

  const urls: string[] = [];

  await Promise.all(segs.map(({ model: m, seg }) => lim(async () => {
    try {
      if (!plan.metadata || typeof plan.metadata.prompt !== 'string' || !plan.metadata.prompt.trim()) {
        logger.error(`[ClipService] FALTA prompt en metadata al generar segmento ${seg.start}-${seg.end}. plan.metadata=` + JSON.stringify(plan.metadata));
        throw new Error(`Falta prompt en metadata.prompt en segmento ${seg.start}-${seg.end}`);
      }
      const style = plan.metadata.visualStyle;
      const segMeta = seg.secs[0] || {};
      const lora = segMeta.lora ?? plan.metadata.lora;
      const loraScale = segMeta.loraScale ?? plan.metadata.loraScale;
      const seed = segMeta.seed ?? plan.metadata.seed;
      // Preparar imágenes base si existen (stub: puedes conectar pipeline SDXL+LoRA aquí)
      const baseImages = plan.metadata.baseImages || [];
      // Determinar tipo de clip
      const type = plan.metadata.type || m;
      // ¿Hay diálogo?
      const hasDialogue = !!seg.secs.find(s => s.lipSyncType && s.lipSyncType !== 'none');
      // Personaje LoRA
      const loraCharacter: string | undefined = segMeta.lora ?? plan.metadata.lora ?? undefined;
      // Prompt avanzado
      const prompt = promptOf(seg, style, plan);
      // Llamar al engine multi-motor
      const videoResult = await generateVideoByType({
        prompt,
        type,
        style,
        hasDialogue,
        loraCharacter,
        baseImages,
        seed,
        duration: seg.dur as AllowedDuration,
      } as RenderRequestExtended);
      const src = videoResult?.url;
      if (!src) {
        logger.error(`× sin clip ${seg.start}-${seg.end}`);
        return;
      }

      // stream‑download → /tmp (con reintentos y timeout generoso)
      const fn = path.join(TMP, `clip_${seg.start}_${uuid().slice(0,8)}.mp4`);
      let ok = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        logger.info(`⬇️  Descargando video (intento ${attempt}/3): ${src}`);
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 180_000); // 3 minutos por descarga
          const r = await fetch(src, { signal: controller.signal });
          clearTimeout(timeout);
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
        logger.error(`× sin video descargado para ${seg.start}-${seg.end}`);
        return;
      }

      // --- Lógica de lip-sync avanzada ---
      const lipSyncType = seg.secs.find(s => s.lipSyncType && s.lipSyncType !== 'none')?.lipSyncType;
      const acting = seg.secs.find(s => s.acting)?.acting;
      const styleLip = seg.secs.find(s => s.style)?.style;
      const audioPath = fn; // En integración real, aquí deberías pasar la ruta del audio de voz
      if (lipSyncType) {
        logger.info(`[LipSync] Segmento ${seg.start}-${seg.end} requiere lip-sync: ${lipSyncType}`);
        try {
          if (lipSyncType === 'sadtalker') {
            logger.info(`[LipSync] Aplicando SadTalker a ${fn} (acting: ${acting}, style: ${styleLip})`);
            await applySadTalker(fn, audioPath, acting, styleLip);
          } else if (lipSyncType === 'wav2lip') {
            logger.info(`[LipSync] Aplicando Wav2Lip a ${fn} (acting: ${acting}, style: ${styleLip})`);
            await applyWav2Lip(fn, audioPath, acting, styleLip);
          }
        } catch (err) {
          logger.error(`[LipSync] Error aplicando lip-sync (${lipSyncType}) a ${fn}: ${(err as Error).message}`);
        }
      } else {
        logger.info(`[LipSync] Segmento ${seg.start}-${seg.end} no requiere lip-sync.`);
      }

      // Subir a CDN y validar
      try {
        const cdn = await uploadToCDN(fn, `clips/${path.basename(fn)}`);
        if (!cdn || typeof cdn !== 'string' || !cdn.startsWith('http')) {
          logger.error(`❌ uploadToCDN no devolvió URL válida para: ${fn}`);
          return;
        }
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
    } catch (err) {
      logger.error(`[ClipService] Error inesperado en segmento ${seg.start}-${seg.end}: ${(err as Error).message}`);
      return;
    }
  })));  
  logger.info('✅ Total clips: ' + urls.length);
  return urls;
}

// Asegúrate de que AllowedDuration solo esté definido en utils/types
// Elimina cualquier declaración duplicada

// Importa solo una vez los tipos necesarios

