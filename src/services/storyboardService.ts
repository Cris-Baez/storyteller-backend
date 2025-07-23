
// StoryboardService deshabilitado temporalmente.
// TODO: Migrar a generación de storyboards usando Kling (escenario/personaje elegido por el usuario).
// Cuando se active, permitir que el usuario solicite imágenes de storyboard generadas por Kling.

import { VideoPlan, TimelineSecond } from '../utils/types.js';
import { logger } from '../utils/logger.js';
import { generateKlingClip } from './klingService.js';
import { getFeedback, applyFeedbackToPlan } from './feedbackService.js';


/**
 * generateStoryboards – Genera storyboards IA usando Kling, soportando campos avanzados y logs enriquecidos.
 * @param plan VideoPlan
 * @returns string[] URLs públicas de los storyboards generados
 */
export async function generateStoryboards(plan: VideoPlan): Promise<string[]> {
  logger.info('[StoryboardService] Generando storyboards IA para plan…');
  if (!plan || !Array.isArray(plan.timeline)) {
    logger.error('[StoryboardService] VideoPlan inválido o sin timeline.');
    return [];
  }
  // Integrar feedback antes de generar storyboards
  const feedbacks = getFeedback({ videoId: (plan as any).id });
  const planConFeedback = applyFeedbackToPlan(plan, feedbacks);
  // Generar un storyboard por cada segundo relevante del timeline
  const storyboardUrls: string[] = [];
  for (const sec of planConFeedback.timeline) {
    if ('storyboard' in sec && (sec as any).storyboard === false) continue;
    // Usar solo campos válidos según types.ts
    const prompt = [
      sec.visual || '',
      typeof sec.camera === 'string' ? sec.camera : (sec.camera?.shot || ''),
      sec.emotion || '',
      sec.tipoTransicion || '',
      Array.isArray(sec.overlays) ? sec.overlays.join(', ') : '',
      sec.sonidoAmbiente || '',
      typeof sec.music === 'string' ? sec.music : '',
      sec.dialogo || '',
      sec.subtitulos || '',
      sec.feedbackUsuario || planConFeedback.metadata?.feedbackUsuario || '',
      sec.idioma || planConFeedback.metadata?.idioma || 'es',
      sec.perfilUsuario || planConFeedback.metadata?.perfilUsuario || '',
      sec.continuidad || '',
      '[Storyboard]'
    ].filter(Boolean).join(' | ');
    try {
      const url = await generateKlingClip({
        prompt,
        style: (sec as any).style || planConFeedback.metadata?.style || 'storyboard',
        continuity: sec.continuidad,
        feedback: sec.feedbackUsuario,
        idioma: sec.idioma,
        perfilUsuario: sec.perfilUsuario,
        input_image_urls: Array.isArray(planConFeedback.metadata?.userImages) ? planConFeedback.metadata.userImages : [],
        duration: 1,
      });
      logger.info(`[StoryboardService] Storyboard generado: ${url}`);
      storyboardUrls.push(url);
    } catch (e: any) {
      logger.error(`[StoryboardService] Error generando storyboard: ${e.message}`);
      // Opcional: podrías agregar una imagen de fallback o null
    }
  }
  return storyboardUrls;
}
