// src/pipelines/renderPipeline.ts

import type { RenderRequest, RenderResponse } from '../utils/types.js';
import { logger } from '../utils/logger.js';
import { retry  } from '../utils/retry.js';
import fs from 'fs/promises';
import path from 'path';

// Nuevo: servicios para el flujo Kling + ChatGPT
import { createVideoPlan } from '../services/llmService/index.js';
import { generateClipsKling } from '../services/clipService.js';
import { getBackgroundMusic } from '../services/musicService.js';
import { createVoiceOver } from '../services/voiceService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { validateVideoPlan } from '../utils/validateVideoPlan.js';
import { segmentVideoByStyle } from '../services/videoEngine.js';

const TIMEOUT = 600_000; // 10 min


export async function runRenderPipeline(req: RenderRequest): Promise<RenderResponse> {
  // let plan; (ya declarado arriba, eliminar duplicado)
  let plan;
  let alreadyRetriedPlan = false;
  // Refuerzo: Validar cumplimiento de plantilla para todos los estilos principales
  const plantillaChecks: Record<string, (plan: any) => string[]> = {
    'anime': (plan) => {
      const errors = [];
      if (!plan.timeline || plan.timeline.length === 0) errors.push('El plan anime no tiene timeline.');
      if (plan.timeline && plan.timeline.length > 0) {
        for (const [i, escena] of plan.timeline.entries()) {
          let prompt = (escena.prompt || '').toLowerCase();
          if (!/acting|expresi[oó]n|gesto|emoci[oó]n|drama|c[aá]mara|manga|anime/.test(prompt)) {
            errors.push(`Escena ${i} sin acting/cámara/emoción manga.`);
          }
        }
      }
      return errors;
    },
    'comercial': (plan) => {
      const errors = [];
      if (!plan.timeline || plan.timeline.length < 2) errors.push('El plan comercial debe tener al menos 2 escenas.');
      if (!plan.timeline?.some((e:any)=>/local|negocio|producto/.test((e.prompt||'').toLowerCase()))) errors.push('Falta escena de local/negocio/producto.');
      return errors;
    },
    'cinematic': (plan) => {
      const errors = [];
      if (!plan.timeline || plan.timeline.length < 2) errors.push('El plan cinematic debe tener al menos 2 escenas.');
      if (!plan.timeline?.some((e:any)=>/emoci[oó]n|viaje|historia|c[aá]mara/.test((e.prompt||'').toLowerCase()))) errors.push('Falta emoción o narrativa cinematográfica.');
      return errors;
    },
    'realistic': (plan) => []
  };

  if (plantillaChecks[req.visualStyle]) {
    // Normalizar: aceptar tanto 'timeline' como 'videoPlan'
    let planToCheck = req.metadata?.plan || plan;
    if (planToCheck && !planToCheck.timeline && planToCheck.videoPlan) {
      planToCheck.timeline = planToCheck.videoPlan;
    }
    let planErrors = plantillaChecks[req.visualStyle](planToCheck || {});
    if (planErrors.length > 0) {
      logger.warn(`[Plantilla] El plan no cumple reglas de plantilla ${req.visualStyle}: ${planErrors.join('; ')}`);
      // Fallback: reintentar generación del plan con prompt reforzado
      if (!alreadyRetriedPlan) {
        logger.info(`[Fallback] Reintentando generación de plan con prompt reforzado para ${req.visualStyle}`);
        const { logFeedback } = await import('../services/feedbackService.js');
        logFeedback({
          service: 'Pipeline',
          action: 'retryPlanWithReinforcedPrompt',
          success: false,
          error: planErrors.join('; '),
          params: { visualStyle: req.visualStyle, plan: planToCheck }
        });
        alreadyRetriedPlan = true;
        // Usar copia local del prompt reforzado
        const reinforcedPrompt = (req.prompt || '') + ' (IMPORTANTE: genera un timeline estructurado, con escenas, acting, emoción, cámara y narrativa tipo plantilla 2025)';
        // Crear copia local de req para el retry
        const reqRetry = { ...req, prompt: reinforcedPrompt };
        let newPlan;
        try {
          newPlan = await retry(() => createVideoPlan(reqRetry));
        } catch (e) {
          logger.error('❌ Error al reintentar createVideoPlan con prompt reforzado:', e);
          throw new Error(`El plan no cumple reglas de plantilla ${req.visualStyle}: ${planErrors.join('; ')}`);
        }
        // Normalizar: aceptar tanto 'timeline' como 'videoPlan' en el fallback
        if (newPlan && !newPlan.timeline && newPlan.videoPlan) {
          newPlan.timeline = newPlan.videoPlan;
        }
        let newPlanErrors = plantillaChecks[req.visualStyle](newPlan || {});
        if (newPlanErrors.length > 0) {
          logger.warn(`[Fallback] El plan reforzado sigue sin cumplir plantilla: ${newPlanErrors.join('; ')}`);
          const { logFeedback } = await import('../services/feedbackService.js');
          logFeedback({
            service: 'Pipeline',
            action: 'validatePlantillaFallback',
            success: false,
            error: newPlanErrors.join('; '),
            params: { visualStyle: req.visualStyle, plan: newPlan }
          });
          throw new Error(`El plan no cumple reglas de plantilla ${req.visualStyle} (ni con fallback): ${newPlanErrors.join('; ')}`);
        } else {
          logger.info(`[Fallback] El plan reforzado cumple plantilla, continuando.`);
          planToCheck = newPlan;
          plan = newPlan;
        }
      } else {
        const { logFeedback } = await import('../services/feedbackService.js');
        logFeedback({
          service: 'Pipeline',
          action: 'validatePlantilla',
          success: false,
          error: planErrors.join('; '),
          params: { visualStyle: req.visualStyle, plan: planToCheck }
        });
        throw new Error(`El plan no cumple reglas de plantilla ${req.visualStyle}: ${planErrors.join('; ')}`);
      }
    }
  }
  // Refuerzo automático para anime/cartoon: acting, fondos, emoción, cámara manga
  if (["anime", "cartoon"].includes(req.visualStyle)) {
    if (req.metadata && Array.isArray(req.metadata.actors) && req.metadata.actors.length > 2) {
      logger.warn('Más de 2 personajes en plantilla anime/cartoon. Solo se permiten 2.');
      throw new Error('Solo se permiten hasta 2 personajes en videos anime/cartoon.');
    }
    // Validar acting, emoción, cámara, manga en cada escena
    if (req.metadata && Array.isArray(req.metadata.timeline)) {
      for (const [i, scene] of req.metadata.timeline.entries()) {
        let prompt = (scene.prompt || '').toLowerCase();
        let actingOk = /acting|expresi[oó]n|gesto|emoci[oó]n|drama|c[aá]mara|manga|anime/.test(prompt);
        if (!actingOk) {
          logger.warn(`[Pipeline] Escena anime/cartoon sin acting/cámara/emoción, reforzando escena ${i}.`);
          scene.prompt += ' con acting expresivo, fondos a juego, emoción exagerada, cámara dramática y narrativa tipo manga';
        }
      }
    }
  }
  // NUEVO: modo previsualización rápida (proxy render)
  const previewMode = !!req.previewMode;
  // Unificar: solo visualStyle como identificador de estilo
  let visualStyle = (req.visualStyle || '').toLowerCase();
  if (!req.metadata) req.metadata = {};
  req.metadata.planType = visualStyle;
  if (!req.metadata.visualStyle) req.metadata.visualStyle = visualStyle;
  req.visualStyle = visualStyle;
  // Validaciones de plan
  if (visualStyle === 'free') {
    if (req.duration > 30) {
      logger.warn('Duración excede el máximo para Free.');
      throw new Error('La versión Free solo permite videos de hasta 30 segundos.');
    }
    const allowedFreeStyles = ['realistic', 'cinematic'];
    if (!allowedFreeStyles.includes(visualStyle)) {
      logger.warn('Estilo visual no permitido en Free.');
      throw new Error('La versión Free solo permite estilos Realistic o Cinematic.');
    }
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
  if (visualStyle === 'creator') {
    if (req.duration > 60) {
      logger.warn('Duración excede el máximo para Creator.');
      throw new Error('La versión Creator solo permite videos de hasta 60 segundos.');
    }
    const allowedCreatorStyles = ['realistic', 'cinematic', 'anime', 'cartoon', 'commercial', 'game', 'narrative'];
    if (!allowedCreatorStyles.includes(visualStyle)) {
      logger.warn('Estilo visual no permitido en Creator.');
      throw new Error('El estilo visual no está permitido en Creator.');
    }
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
  if (previewMode) logger.info('🟡 Render en modo previsualización rápida (proxy)');

  // 2. Obtener el VideoPlan completo usando llmService
  logger.info('🎬 Llamando a llmService para obtener VideoPlan...');
  // Eliminada declaración duplicada de 'let plan;'
  try {
    plan = await retry(() => createVideoPlan(req));
  } catch (e) {
    logger.error('❌ Error al llamar a llmService.createVideoPlan:', e);
    const { logFeedback } = await import('../services/feedbackService.js');
    logFeedback({
      service: 'LLMService',
      action: 'createVideoPlan',
      success: false,
      error: e instanceof Error ? e.message : String(e),
      params: { req }
    });
    throw new Error('No se pudo generar el plan de video.');
  }
  // Validación avanzada de coherencia y continuidad
  const validation = validateVideoPlan(plan);
  if (!validation.ok) {
    logger.error('❌ VideoPlan inválido. Errores:', validation.errors);
    const { logFeedback } = await import('../services/feedbackService.js');
    logFeedback({
      service: 'LLMService',
      action: 'validateVideoPlan',
      success: false,
      error: validation.errors.join('; '),
      params: { plan }
    });
    throw new Error('VideoPlan inválido: ' + validation.errors.join('; '));
  }
  if (validation.warnings.length > 0) {
    logger.warn('⚠️ VideoPlan con advertencias:', validation.warnings);
    const { logFeedback } = await import('../services/feedbackService.js');
    logFeedback({
      service: 'LLMService',
      action: 'validateVideoPlan',
      success: true,
      error: 'Advertencias: ' + validation.warnings.join('; '),
      params: { plan }
    });
  }
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


  // 4. Generar música de fondo y voice-over
  logger.info('🎵 Generando música de fondo...');
  let music: Buffer;
  try {
    music = await getBackgroundMusic(req.visualStyle || 'cinematic', previewMode);
  } catch (e) {
    logger.warn('No se pudo generar música de fondo, se usará buffer vacío');
    const { logFeedback } = await import('../services/feedbackService.js');
    logFeedback({
      service: 'Music',
      action: 'getBackgroundMusic',
      success: false,
      error: e instanceof Error ? e.message : String(e),
      params: { style: req.visualStyle, previewMode }
    });
    music = Buffer.from([]);
  }
  if (!music || !Buffer.isBuffer(music) || music.length === 0) {
    const { logFeedback } = await import('../services/feedbackService.js');
    logFeedback({
      service: 'Music',
      action: 'validateMusicBuffer',
      success: false,
      error: 'Buffer de música vacío tras generación',
      params: { style: req.visualStyle, previewMode }
    });
  }

  logger.info('🎙️ Generando voice-over completo...');
  let voiceOver: Buffer;
  try {
    voiceOver = await createVoiceOver(plan);
  } catch (e) {
    logger.warn('No se pudo generar voice-over, se usará buffer vacío');
    const { logFeedback } = await import('../services/feedbackService.js');
    logFeedback({
      service: 'Voice',
      action: 'createVoiceOver',
      success: false,
      error: e instanceof Error ? e.message : String(e),
      params: { plan }
    });
    voiceOver = Buffer.from([]);
  }
  if (!voiceOver || !Buffer.isBuffer(voiceOver) || voiceOver.length === 0) {
    const { logFeedback } = await import('../services/feedbackService.js');
    logFeedback({
      service: 'Voice',
      action: 'validateVoiceOverBuffer',
      success: false,
      error: 'Buffer de voice-over vacío tras generación',
      params: { plan }
    });
  }

  // SFX: por ahora buffer vacío, puedes expandir para extraer de plan.timeline
  let sfx: Buffer[] = [];



  // 5. Render incremental: generar cada clip de forma independiente y manejar errores por escena
  logger.info('🎥 Generando clips con Kling (render incremental)...');
  const clips: string[] = [];
  const failedScenes: number[] = [];
  for (let i = 0; i < scenes.length; i++) {
    try {
      logger.info(`🎬 Generando clip ${i + 1}/${scenes.length}...`);
      const result = await retry(() => generateClipsKling([scenes[i]], { plan, music, previewMode }));
      if (result && result.clips && result.clips[0]) {
        // Validar que la URL del clip sea válida y no placeholder
        if (typeof result.clips[0] !== 'string' || !result.clips[0].startsWith('http') || result.clips[0].includes('placehold.co')) {
          logger.error(`❌ Clip ${i + 1} falló: URL inválida o placeholder`);
          const { logFeedback } = await import('../services/feedbackService.js');
          logFeedback({
            service: 'KlingService',
            action: 'validateClipUrl',
            success: false,
            error: 'URL inválida o placeholder',
            params: { url: result.clips[0], scene: scenes[i] }
          });
          failedScenes.push(i);
          clips.push('');
        } else {
          clips.push(result.clips[0]);
        }
      } else {
        logger.error(`❌ Clip ${i + 1} falló: no se devolvió URL`);
        failedScenes.push(i);
        clips.push('');
      }
    } catch (err) {
      logger.error(`❌ Error al generar clip ${i + 1}:`, err);
      const { logFeedback } = await import('../services/feedbackService.js');
      logFeedback({
        service: 'KlingService',
        action: 'generateClipsKling',
        success: false,
        error: err instanceof Error ? err.message : String(err),
        params: { scene: scenes[i] }
      });
      failedScenes.push(i);
      clips.push('');
    }
  }
  // Si hay fallos, intentar reintentar solo los fallidos una vez más
  if (failedScenes.length > 0) {
    logger.warn(`🔁 Reintentando escenas fallidas: ${failedScenes.join(', ')}`);
    for (const idx of failedScenes) {
      try {
        const result = await retry(() => generateClipsKling([scenes[idx]], { plan, music, previewMode }));
        if (result && result.clips && result.clips[0] && typeof result.clips[0] === 'string' && result.clips[0].startsWith('http')) {
          clips[idx] = result.clips[0];
          logger.info(`✅ Clip ${idx + 1} recuperado en reintento.`);
        } else {
          logger.error(`❌ Clip ${idx + 1} falló de nuevo.`);
        }
      } catch (err) {
        logger.error(`❌ Error persistente en clip ${idx + 1}:`, err);
        const { logFeedback } = await import('../services/feedbackService.js');
        logFeedback({
          service: 'KlingService',
          action: 'generateClipsKlingRetry',
          success: false,
          error: err instanceof Error ? err.message : String(err),
          params: { scene: scenes[idx] }
        });
      }
    }
  }
  // Componer el video final solo con los clips exitosos
  const successfulClips = clips.filter(Boolean);
  if (successfulClips.length === 0) throw new Error('No se pudo generar ningún clip exitosamente.');

  // Ensamblar video final con voz, música y SFX
  logger.info('🛠️ Ensamblando video final con voz, música y SFX...');
  let finalUrl = '';
  try {
    finalUrl = await assembleVideo({ plan, clips: successfulClips, voiceOver, music: [music], sfx });
    // Validar duración y formato del video final
    // (Simulado: en producción, analizar metadatos del archivo generado)
    if (!finalUrl || typeof finalUrl !== 'string' || !finalUrl.endsWith('.mp4')) {
      logger.error('❌ Video final no tiene formato .mp4 válido');
      const { logFeedback } = await import('../services/feedbackService.js');
      logFeedback({
        service: 'FFmpegService',
        action: 'validateFinalVideo',
        success: false,
        error: 'Video final no tiene formato .mp4 válido',
        params: { finalUrl }
      });
      throw new Error('Video final no tiene formato .mp4 válido');
    }
  } catch (e) {
    logger.error('❌ Error en ensamblaje final: ' + (e instanceof Error ? e.message : e));
    throw new Error('Error en ensamblaje final: ' + (e instanceof Error ? e.message : e));
  }

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
  if (failedScenes.length > 0) {
    logger.warn(`⚠️ Escenas fallidas (no incluidas en el video final): ${failedScenes.join(', ')}`);
  }

  // storyboardUrls reservado para futura integración con Kling (storyboards generados por IA)
  return { url: finalUrl, storyboardUrls: [] };
}
