// src/services/storyboardService.ts
/**
 * Storyboard Service v6
 * ---------------------
 * • Entradas: VideoPlan (v6)  → salida: URLs PNG (storyboards)
 * • Reglas de sampling:
 *     ◦ ≤30 s  →  1 frame por segundo
 *     ◦ 45 s / 60 s → 1 frame cada 2 s  +  todos los `highlight:true`
 * • Prompt cinematográfico enriquecido con CameraSpec, visualStyle, sceneMood
 * • Pipeline: Replicate SDXL ➜ fallback DALL·E-3 ➜ subida CDN (placeholder)
 */

import Replicate        from 'replicate';
import { OpenAI }       from 'openai';
import axios            from 'axios';
import fs               from 'fs/promises';
import path             from 'path';
import { v4 as uuid }   from 'uuid';

import { env }          from '../config/env.js';
import { logger }       from '../utils/logger.js';
import { retry }        from '../utils/retry.js';
import { VideoPlan, TimelineSecond, CameraSpec } from '../utils/types.js';
import { uploadToCDN }  from './cdnService.js';

/* ─── Config ─────────────────────────────────────────────── */
const SDXL_MODEL   = 'stability-ai/sdxl';
const SDXL_VERSION = '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b';
const TMP_DIR      = 'C:\\tmp\\storyboards_v6';
const TIMEOUT_IMG  = 60_000;  // 60 s por imagen

const replicate = new Replicate({ auth: env.REPLICATE_API_TOKEN });
const openai    = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/* Timeout helper */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_IMG): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('img timeout')), ms))
  ]);
}

/* Decide qué segundos necesitan storyboard */
function pickKeyFrames(timeline: TimelineSecond[]): TimelineSecond[] {
  const dur = timeline.length;
  const step = dur <= 30 ? 1 : 2;
  return timeline.filter((sec) => sec.highlight || sec.t % step === 0);
}

/* Genera prompt final para IA */
function buildPrompt(sec: TimelineSecond, style: VideoPlan['metadata']['visualStyle']): string {
  const { shot, movement } = sec.camera; // Acceder directamente a las propiedades de CameraSpec
  return [
    `${sec.visual},`,
    `camera ${shot} ${movement},`,
    `style ${style},`,
    `${sec.sceneMood ?? ''} cinematic lighting,`,
    'storyboard frame, line-art, no watermark'
  ].join(' ');
}

/* ---- Providers ---- */
async function genWithSDXL(prompt: string) {
  try {
    const out = await withTimeout(
      retry(() =>
        replicate.run(`${SDXL_MODEL}:${SDXL_VERSION}`, {
          input: { prompt, width: 1024, height: 1024, num_inference_steps: 30 }
        }),
        2
      )
    );
    return (out as string[])[0] as string;
  } catch (e: any) {
    logger.error(`SDXL error: ${e.message}`);
    if (e.response) {
      logger.error(`SDXL response: ${JSON.stringify(e.response.data)}`);
    }
    throw new Error('SDXL generation failed');
  }
}

async function genWithDalle(prompt: string) {
  const img = await withTimeout(
    openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024', // Ajustado para que sea compatible con los valores permitidos
      response_format: 'url'
    })
  );
  if (!img.data || img.data.length === 0) {
    throw new Error('No se generaron imágenes'); // Validación para evitar undefined
  }
  return img.data[0].url;
}

/* Fake CDN upload (write to /tmp) */
async function upload(buf: Buffer, name: string): Promise<string> {
  const file = path.join(TMP_DIR, `${name}.png`);
  try {
    await fs.mkdir(TMP_DIR, { recursive: true });
    await fs.writeFile(file, buf);
    logger.info(`Archivo escrito correctamente: ${file}`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    throw new Error(`Error al escribir el archivo: ${err.message}`);
  }
  return `file://${file}`; // Sustituye por URL CDN real
}

/* ═══════════════════════════════════════════════════════
 * generateStoryboards – API pública
 * ═════════════════════════════════════════════════════ */
export async function generateStoryboards(plan: VideoPlan): Promise<string[]> {
  logger.info('🖼️  StoryboardService v6 – iniciando…');
  const keySecs = pickKeyFrames(plan.timeline);
  logger.info(`→ Se generarán ${keySecs.length} frames de storyboard`);

  const urls: string[] = [];

  await Promise.all(
    keySecs.map(async (sec) => {
      const prompt = buildPrompt(sec, plan.metadata.visualStyle);
      let imgUrl: string;
      try {
        imgUrl = await genWithSDXL(prompt);
      } catch (e) {
        logger.warn(`SDXL fallo para t=${sec.t} → usando DALL·E`);
        const generatedUrl = await genWithDalle(prompt);
        if (!generatedUrl) {
          throw new Error('No se pudo generar una URL válida para la imagen');
        }
        imgUrl = generatedUrl; // Asignar solo si es válido
      }

      const buf = await axios.get(imgUrl, { responseType: 'arraybuffer' })
        .then(r => Buffer.from(r.data));

      try {
        const cdnUrl = await upload(buf, `t${sec.t}_${uuid().slice(0,6)}`);
        urls.push(cdnUrl);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Error al subir el archivo al CDN: ${err.message}`);
      }
    })
  );

  logger.info(`✅  Storyboards listos: ${urls.length}`);
  return urls;
}

// Ejemplo de uso
// const cdnUrl = await uploadToCDN('/tmp/storyboard_0.png', `storyboards/${env.GCP_PROJECT_ID}/storyboard_0.png`);
// logger.info(`URL subida: ${cdnUrl}`);

const timeline: TimelineSecond[] = [
  {
    t: 0,
    visual: 'scene',
    emotion: 'neutral',
    soundCue: 'quiet',
    highlight: true,
    sceneMood: 'dramatic',
    camera: { shot: 'close-up', movement: 'pan' } // Ajustar para que sea de tipo CameraSpec
  }
];
const size = '1024x1024';
