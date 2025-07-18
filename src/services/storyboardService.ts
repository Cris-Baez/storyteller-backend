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
const FLUX_MODEL   = 'black-forest-labs/flux-1.1-pro';
const SDXL_MODEL   = 'stability-ai/sdxl';
const SDXL_VERSION = '7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc';
const TMP_DIR      = 'C:\\tmp\\storyboards_v6';
const TIMEOUT_IMG  = 90_000;  // 90 s por imagen (FLUX puede ser más lento)

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
  // Solo generar la imagen del primer segundo (t=0) para el video principal
  return timeline.filter((sec) => sec.t === 0);
}

/* Genera prompt final para IA */
function buildPrompt(sec: TimelineSecond, style: VideoPlan['metadata']['visualStyle']): string {
  const { shot, movement } = sec.camera;
  // Opción 1: prompt enriquecido (prompt usuario + detalles visuales/técnicos)
  // Buscar el prompt original del usuario en metadata (si existe)
  const userPrompt = (sec as any).prompt || (sec as any).userPrompt || '';
  // Si no está en el segundo, buscar en plan.metadata (requiere acceso al plan, así que lo pasamos como prop extra si hace falta)
  // Aquí solo usamos el del segundo, pero puedes ajustar para pasar el plan si lo prefieres
  return [
    userPrompt,
    sec.visual,
    `camera ${shot} ${movement}`,
    `style ${style}`,
    `${sec.sceneMood ?? ''} cinematic lighting`,
    'storyboard frame, line-art, no watermark'
  ].filter(Boolean).join(', ');
}

/* Función de validación de URL */
function isValidHttpUrl(string: string | undefined | null): string is string {
  if (!string) return false;
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

/* ---- Providers ---- */
async function genWithFLUX(prompt: string) {
  try {
    const out = await withTimeout(
      retry(() =>
        replicate.run(FLUX_MODEL, {
          input: { 
            prompt, 
            width: 1024, 
            height: 1024,
            steps: 25,
            guidance: 3.5
          }
        }),
        2
      )
    );

    // Validación más detallada de la respuesta
    if (!out || !Array.isArray(out)) {
      logger.error(`FLUX respuesta inesperada: ${JSON.stringify(out)}`);
      throw new Error('FLUX returned invalid response format');
    }

    const url = out[0];
    if (!isValidHttpUrl(url)) {
      logger.error(`FLUX generó una URL inválida: ${url}`);
      logger.error(`Respuesta completa de FLUX: ${JSON.stringify(out)}`);
      throw new Error('FLUX generated an invalid URL');
    }

    logger.info(`✅ FLUX generó imagen exitosamente: ${url}`);
    return url;
  } catch (e: any) {
    logger.error(`FLUX error: ${e.message}`);
    if (e.response?.data) {
      logger.error(`FLUX response data: ${JSON.stringify(e.response.data)}`);
    }
    throw new Error('FLUX generation failed');
  }
}

async function genWithSDXL(prompt: string) {
  try {
    const out = await withTimeout(
      retry(() =>
        replicate.run(`${SDXL_MODEL}:${SDXL_VERSION}`, {
          input: { 
            prompt, 
            width: 1024, 
            height: 1024,
            num_inference_steps: 30,
            guidance_scale: 7.5 // Añadiendo parámetro para mejor calidad
          }
        }),
        2
      )
    );

    // Validación más detallada de la respuesta
    if (!out || !Array.isArray(out)) {
      logger.error(`SDXL respuesta inesperada: ${JSON.stringify(out)}`);
      throw new Error('SDXL returned invalid response format');
    }

    const url = out[0];
    if (!isValidHttpUrl(url)) {
      logger.error(`SDXL generó una URL inválida: ${url}`);
      logger.error(`Respuesta completa de SDXL: ${JSON.stringify(out)}`);
      throw new Error('SDXL generated an invalid URL');
    }

    logger.info(`✅ SDXL generó imagen exitosamente: ${url}`);
    return url;
  } catch (e: any) {
    logger.error(`SDXL error: ${e.message}`);
    if (e.response?.data) {
      logger.error(`SDXL response data: ${JSON.stringify(e.response.data)}`);
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
  const url = img.data?.[0]?.url;
  if (!isValidHttpUrl(url)) {
    logger.error(`DALL-E generó una URL inválida: ${url}`);
    throw new Error('No se generaron imágenes válidas con DALL-E');
  }
  return url;
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
  let keySecs: TimelineSecond[] = pickKeyFrames(plan.timeline);
  let sceneMode = false;
  // Si hay scenes en metadata, generar una imagen por escena usando la descripción
  if (plan.metadata.scenes && Array.isArray(plan.metadata.scenes) && plan.metadata.scenes.length > 0) {
    sceneMode = true;
    keySecs = plan.metadata.scenes.map(scene => {
      // Buscar el primer segundo de la escena en el timeline
      const sec = plan.timeline.find(s => s.scene === scene.scene && s.sceneStart) || plan.timeline.find(s => s.scene === scene.scene) || plan.timeline[scene.start] || plan.timeline[0];
      // Usar la descripción de la escena como visual
      return {
        ...sec,
        visual: scene.description || sec.visual,
        t: scene.start,
      };
    });
    logger.info(`→ Se generarán ${keySecs.length} storyboards (uno por escena)`);
  } else {
    logger.info(`→ Se generarán ${keySecs.length} frames de storyboard (por segundos clave)`);
  }

  const urls: string[] = [];

  await Promise.all(
    keySecs.map(async (sec, idx) => {
      let prompt = buildPrompt(sec, plan.metadata.visualStyle);
      // Si hay referenceImages, agregarlas al prompt
      if (plan.metadata.referenceImages && Array.isArray(plan.metadata.referenceImages) && plan.metadata.referenceImages.length > 0) {
        prompt += ` Reference image: ${plan.metadata.referenceImages[idx % plan.metadata.referenceImages.length]}`;
      }
      let imgUrl: string | null = null;
      try {
        imgUrl = await genWithFLUX(prompt);
      } catch (e) {
        logger.warn(`FLUX fallo para t=${sec.t} → usando SDXL`);
        try {
          imgUrl = await genWithSDXL(prompt);
        } catch (e2) {
          logger.warn(`SDXL fallo para t=${sec.t} → usando DALL·E`);
          try {
            imgUrl = await genWithDalle(prompt);
          } catch (e3) {
            logger.error(`DALL-E también falló para t=${sec.t}: ${(e3 as Error).message}`);
            imgUrl = null; // Asegurar que es null si todo falla
          }
        }
      }

      if (!imgUrl) {
        logger.error(`❌ No se pudo generar imagen para t=${sec.t} con ningún proveedor.`);
        // Continuar al siguiente en lugar de lanzar error para todo el batch
        return; 
      }

      let buf: Buffer;
      try {
        buf = await axios.get(imgUrl, { responseType: 'arraybuffer' })
          .then(r => Buffer.from(r.data));
      } catch (e) {
        logger.error(`Error al descargar la imagen generada t=${sec.t}: ${(e instanceof Error ? e.message : e)}`);
        throw new Error('No se pudo descargar la imagen generada');
      }

      try {
        const localPngPath = `t${sec.t}_${uuid().slice(0,6)}`;
        await fs.writeFile(localPngPath, buf);
        logger.info(`Archivo temporal creado: ${localPngPath}`);

        const publicUrl = await uploadToCDN(localPngPath, `storyboards/${env.GCP_PROJECT_ID}/t${sec.t}.png`);
        // Validar accesibilidad del CDN
        try {
          const axiosMod = (await import('axios')).default;
          await retry(() => axiosMod.head(publicUrl, { timeout: 10000 }), 3);
          logger.info(`✅ Storyboard accesible en CDN: ${publicUrl}`);
          urls.push(publicUrl);
        } catch {
          logger.warn(`⚠️  Storyboard no accesible en CDN (HEAD fail): ${publicUrl}`);
          // No lanzar error aquí para no detener todo el proceso
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Error al subir el archivo al CDN: ${err.message}`);
        throw err;
      }
    })
  );

  if (urls.length < keySecs.length) {
    logger.warn(`⚠️ Se generaron ${urls.length} de ${keySecs.length} storyboards solicitados.`);
  }

  if (urls.length === 0 && keySecs.length > 0) {
    throw new Error('No se pudo generar ningún storyboard.');
  }

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
    camera: { shot: 'close-up', movement: 'pan' },
    transition: 'cut' // Agregado para cumplir con el tipo TimelineSecond
  }
];
const size = '1024x1024';
