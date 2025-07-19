// src/pipelines/renderPipeline.ts

import type { RenderRequest, RenderResponse } from '../utils/types.js';
import { logger } from '../utils/logger.js';
import { retry  } from '../utils/retry.js';
import fs from 'fs/promises';
import path from 'path';

// Nuevo: servicios para el flujo Kling + ChatGPT
import { createVideoPlan } from '../services/llmService.js';
import { generateClipsKling } from '../services/clipService.js';
import { segmentVideoByStyle } from '../services/videoEngine.js';

const TIMEOUT = 600_000; // 10 min


export async function runRenderPipeline(req: RenderRequest): Promise<RenderResponse> {
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
    scenes.push({
      start: seg.start,
      duration: seg.duration,
      style: seg.style,
      timeline: sceneTimeline
    });
    idx += seg.duration;
  }
  logger.info(`🎬 ${scenes.length} escenas/tomas generadas por segmentación.`);

  // 4. Generar clips con Kling para cada escena
  logger.info('🎥 Generando clips con Kling...');
  const result = await retry(() => generateClipsKling(scenes));
  const finalUrl = (result as any).finalUrl;
  const clips = (result as any).clips;
  if (!finalUrl) throw new Error('generateClipsKling no devolvió video final');
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
