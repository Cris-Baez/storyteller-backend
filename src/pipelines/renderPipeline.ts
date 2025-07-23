// src/pipelines/renderPipeline.ts

import type { RenderRequest, RenderResponse } from '../utils/types.js';
import { logger } from '../utils/logger.js';
import { retry  } from '../utils/retry.js';
import fs from 'fs/promises';
import path from 'path';

// Nuevo: servicios para el flujo Kling + ChatGPT
import { createVideoPlan } from '../services/llmService.js';
import { generateClipsKling } from '../services/clipService.js';
import { getBackgroundMusic } from '../services/musicService.js';
import { segmentVideoByStyle } from '../services/videoEngine.js';

const TIMEOUT = 600_000; // 10 min


export async function runRenderPipeline(req: RenderRequest): Promise<RenderResponse> {
  // Validaciones de modo Free/Creator
  const mode = (req.mode || '').toLowerCase();
  const allowedFreeStyles = ['realistic', 'cinematic'];
  if (mode === 'free') {
    if (req.duration > 30) {
      logger.warn('Duración excede el máximo para Free.');
      throw new Error('La versión Free solo permite videos de hasta 30 segundos.');
    }
    if (!allowedFreeStyles.includes((req.visualStyle || '').toLowerCase())) {
      logger.warn('Estilo visual no permitido en Free.');
      throw new Error('La versión Free solo permite estilos Realistic o Cinematic.');
    }
    // Validar 1 fondo y 1 actor (asume que el frontend envía metadata)
    if (req.metadata) {
      if (Array.isArray(req.metadata.backgrounds) && req.metadata.backgrounds.length > 1) {
        logger.warn('Más de un fondo enviado en Free.');
        throw new Error('La versión Free solo permite un fondo.');
      }
      if (Array.isArray(req.metadata.actors) && req.metadata.actors.length > 1) {
        logger.warn('Más de un actor enviado en Free.');
        throw new Error('La versión Free solo permite un actor.');
      }
    }
  }
  if (mode === 'creator') {
    if (req.duration > 60) {
      logger.warn('Duración excede el máximo para Creator.');
      throw new Error('La versión Creator solo permite videos de hasta 60 segundos.');
    }
    // Validar estilos permitidos (puedes expandir la lista)
    const allowedCreatorStyles = ['realistic', 'cinematic', 'anime', 'cartoon', 'commercial', 'game', 'narrative'];
    if (!allowedCreatorStyles.includes((req.visualStyle || '').toLowerCase())) {
      logger.warn('Estilo visual no permitido en Creator.');
      throw new Error('El estilo visual no está permitido en Creator.');
    }
    // Validar máximo de actores/fondos si lo deseas
    if (req.metadata) {
      if (Array.isArray(req.metadata.backgrounds) && req.metadata.backgrounds.length > 10) {
        logger.warn('Demasiados fondos en Creator.');
        throw new Error('La versión Creator permite hasta 10 fondos.');
      }
      if (Array.isArray(req.metadata.actors) && req.metadata.actors.length > 5) {
        logger.warn('Demasiados actores en Creator.');
        throw new Error('La versión Creator permite hasta 5 actores.');
      }
    }
  }
  logger.info('🚀 Pipeline Kling+LLMService+Segmentación – inicio');
  const t0 = Date.now();

  // 1. Calcular la segmentación óptima (clips de 5s/10s) según estilo y duración
  const segments = segmentVideoByStyle(req.duration, req.visualStyle);
  logger.info(`🧩 Segmentos calculados: ${segments.map(s => s.duration).join('+')}s`);

  // 2. Obtener el VideoPlan completo usando llmService
  logger.info('🎬 Llamando a llmService para obtener VideoPlan...');
  const plan = await retry(() => createVideoPlan(req));
  const timeline = plan.timeline || [];

  // 3. Dividir el timeline en escenas según los segmentos calculados
  let scenes = [];
  let idx = 0;
  for (const seg of segments) {
    const sceneTimeline = timeline.slice(idx, idx + seg.duration);
    // Cast a any para robustez y compatibilidad con el pipeline
    const base = (sceneTimeline[0] || {}) as any;
    scenes.push({
      start: seg.start,
      duration: seg.duration,
      style: seg.style,
      background: base.background || '',
      character: base.character || 'TheRockActor',
      visual: base.visual || 'Acción cinematográfica',
      camera: base.camera || 'plano medio',
      movement: base.movement || 'estático',
      lighting: base.lighting || 'neutro',
      transition: base.transition || 'cut',
      music: base.music || 'ambient',
      emotion: base.emotion || '',
      timeline: sceneTimeline
    });
    idx += seg.duration;
  }
  logger.info(`🎬 ${scenes.length} escenas/tomas generadas por segmentación.`);

  // 4. Generar música de fondo según el estilo visual
  logger.info('🎵 Generando música de fondo...');
  let music: Buffer;
  try {
    music = await getBackgroundMusic(req.visualStyle || 'cinematic');
  } catch (e) {
    logger.warn('No se pudo generar música de fondo, se usará buffer vacío');
    music = Buffer.from([]);
  }

  // 5. Generar clips con Kling para cada escena y pasar música
  logger.info('🎥 Generando clips con Kling...');
  const result = await retry(() => generateClipsKling(scenes, { plan, music }));
  const finalUrl = (result as any).finalUrl;
  const clips = (result as any).clips;
  if (!finalUrl) throw new Error('generateClipsKling no devolvió video final');

  // 5. (Opcional) Guardar logs/outputs si es demoMode
  if (req.demoMode) {
    const TMP_DIR = path.join('/tmp/pipeline_demo', Date.now().toString());
    await fs.mkdir(TMP_DIR, { recursive: true });
    await fs.writeFile(path.join(TMP_DIR, 'plan.json'), Buffer.from(JSON.stringify(plan, null, 2)));
    await fs.writeFile(path.join(TMP_DIR, 'segments.json'), Buffer.from(JSON.stringify(segments, null, 2)));
    await fs.writeFile(path.join(TMP_DIR, 'scenes.json'), Buffer.from(JSON.stringify(scenes, null, 2)));
    await fs.writeFile(path.join(TMP_DIR, 'clips.json'), Buffer.from(JSON.stringify(clips, null, 2)));
    await fs.writeFile(path.join(TMP_DIR, 'finalUrl.txt'), Buffer.from(finalUrl));
    logger.info(`[DEMO MODE] Outputs y logs guardados en ${TMP_DIR}`);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  logger.info(`✅ Render final OK en ${elapsed}s → ${finalUrl}`);

  // storyboardUrls reservado para futura integración con Kling (storyboards generados por IA)
  return { url: finalUrl, storyboardUrls: [] };
}
