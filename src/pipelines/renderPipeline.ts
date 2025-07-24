// src/pipelines/renderPipeline.ts
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
import { normalizeSceneFields } from '../utils/normalizeSceneFields.js';
import { mapSceneFields, mapTimelineFields } from '../utils/mapSceneFields.js';
import { segmentVideoByStyle } from '../services/videoEngine.js';

const TIMEOUT = 600_000; // 10 min


export async function runRenderPipeline(req: RenderRequest): Promise<RenderResponse> {
  // --- NUEVO FLUJO: Generar el plan primero, luego validar y contingencias ---
  let plan: any = undefined;
  let alreadyRetriedPlan = false;
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

  // 1. Generar el plan principal con bucle de autocorrección robusto
  let maxPlanAttempts = 3;
  let planAttempt = 0;
  let lastValidationErrors: string[] = [];
  let lastValidationWarnings: string[] = [];
  let lastPrompt = req.prompt;
  let planMetadata = req.metadata || {};
  while (planAttempt < maxPlanAttempts) {
    planAttempt++;
    let planReq = { ...req, prompt: lastPrompt, metadata: planMetadata };
    try {
      plan = await retry(() => createVideoPlan(planReq));
    } catch (e) {
      logger.error(`❌ Error al llamar a llmService.createVideoPlan (intento ${planAttempt}):`, e);
      const { logFeedback } = await import('../services/feedbackService.js');
      logFeedback({
        service: 'LLMService',
        action: 'createVideoPlan',
        success: false,
        error: e instanceof Error ? e.message : String(e),
        params: { req: planReq, attempt: planAttempt }
      });
      if (planAttempt >= maxPlanAttempts) throw new Error('No se pudo generar el plan de video tras varios intentos.');
      continue;
    }
    // Normalizar estructura del plan
    if (plan && !plan.timeline && plan.videoPlan) {
      plan.timeline = plan.videoPlan;
    }
    if (plan && Array.isArray(plan.timeline)) {
      plan.timeline = mapTimelineFields(plan.timeline).map(normalizeSceneFields);
    }
    // Validación avanzada de coherencia y continuidad
    const validation = validateVideoPlan(plan);
    lastValidationErrors = validation.errors || [];
    lastValidationWarnings = validation.warnings || [];
    if (validation.ok) {
      if (lastValidationWarnings.length > 0) {
        logger.warn('⚠️ VideoPlan con advertencias:', lastValidationWarnings);
        const { logFeedback } = await import('../services/feedbackService.js');
        logFeedback({
          service: 'LLMService',
          action: 'validateVideoPlan',
          success: true,
          error: 'Advertencias: ' + lastValidationWarnings.join('; '),
          params: { plan, attempt: planAttempt }
        });
      }
      break; // Plan válido, salimos del bucle
    } else {
      logger.error(`❌ VideoPlan inválido (intento ${planAttempt}). Errores:`, lastValidationErrors);
      const { logFeedback } = await import('../services/feedbackService.js');
      logFeedback({
        service: 'LLMService',
        action: 'validateVideoPlan',
        success: false,
        error: lastValidationErrors.join('; '),
        params: { plan, attempt: planAttempt }
      });
      // Construir feedback explícito para el LLM
      let feedback = `\n\nFEEDBACK: Corrige los siguientes errores en el VideoPlan generado: ${lastValidationErrors.join('; ')}\n`;
      // Refuerza el prompt con feedback y recordatorio de plantilla
      lastPrompt = (req.prompt || '') + feedback + '\nRecuerda: el plan debe cumplir la plantilla profesional CinemaAI, con todos los campos obligatorios, continuidad, variedad visual, efectos, música, voz, idioma, feedback de usuario y validación final.';
      // Si hay metadata relevante, la mantenemos
      planMetadata = { ...planMetadata };
      if (planAttempt >= maxPlanAttempts) {
        throw new Error('VideoPlan inválido tras varios intentos: ' + lastValidationErrors.join('; '));
      }
    }
  }

  // 2. Validar el plan y aplicar contingencias/fallbacks si es necesario
  let planToCheck: any = plan || {};
  let contingenciaActiva = false;
  let planErrors: string[] = [];
  if (plantillaChecks[req.visualStyle]) {
    planErrors = plantillaChecks[req.visualStyle](planToCheck || {});
    if (planErrors.length > 0) {
      contingenciaActiva = true;
      logger.warn(`[Contingencia] Primer LLM falló: ${planErrors.join('; ')}`);
      const { logFeedback } = await import('../services/feedbackService.js');
      logFeedback({
        service: 'Pipeline',
        action: 'contingencyLLMRetry',
        success: false,
        error: planErrors.join('; '),
        params: { visualStyle: req.visualStyle, plan: planToCheck }
      });
      // Cambiar modelo LLM (si hay más de uno disponible)
      const altModels = [
        'openai/gpt-4',
        'openai/gpt-3.5-turbo',
        'google/gemini-pro',
        'anthropic/claude-3-opus',
        'mistral/mistral-large'
      ];
      let altPlan = null;
      for (const altModel of altModels) {
        if (req.metadata?.llmModel && req.metadata.llmModel === altModel) continue;
        try {
          const reqAlt = { ...req, metadata: { ...req.metadata, llmModel: altModel } };
          altPlan = await retry(() => createVideoPlan(reqAlt));
          if (altPlan && !altPlan.timeline && altPlan.videoPlan) {
            altPlan.timeline = altPlan.videoPlan;
          }
          if (altPlan && Array.isArray(altPlan.timeline)) {
            altPlan.timeline = mapTimelineFields(altPlan.timeline).map(normalizeSceneFields);
          }
          const altErrors = plantillaChecks[req.visualStyle](altPlan || {});
          if (altErrors.length === 0) {
            planToCheck = altPlan;
            planErrors = [];
            contingenciaActiva = false;
            logger.info('[Contingencia] Segundo LLM generó plan válido.');
            plan = altPlan;
            break;
          } else {
            logger.warn(`[Contingencia] Segundo LLM también falló: ${altErrors.join('; ')}`);
          }
        } catch (e) {
          logger.error('[Contingencia] Error al reintentar con otro LLM:', e);
        }
      }
      // 2. Si todos los LLM fallan, rellenar todo automáticamente
      if (planErrors.length > 0) {
        logger.error('[Contingencia] Todos los LLM fallaron, rellenando campos automáticamente.');
        if (planToCheck && Array.isArray(planToCheck.timeline)) {
          planToCheck.timeline = planToCheck.timeline.map(normalizeSceneFields);
        } else {
          planToCheck.timeline = [{ t: 0 }];
          planToCheck.timeline = planToCheck.timeline.map(normalizeSceneFields);
        }
        logFeedback({
          service: 'Pipeline',
          action: 'contingencyAutoFill',
          success: true,
          error: 'Se rellenaron campos por defecto en todas las escenas',
          params: { plan: planToCheck }
        });
        planErrors = [];
        contingenciaActiva = false;
        plan = planToCheck;
      }
    }
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



  // Validación avanzada de coherencia y continuidad (después de contingencias)
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
  const timeline = (plan && plan.timeline) ? plan.timeline : [];

  // --- Variables de control de pipeline ---
  logger.info('🚀 Pipeline Kling+LLMService+Segmentación – inicio');
  const t0 = Date.now();
  const previewMode = !!req.previewMode;
  // Eliminamos segmentación artificial: cada escena del timeline es una toma real
  const scenes = (timeline as any[]).map((scene: any, idx: number) => ({
    ...scene,
    idx,
    // Puedes agregar aquí lógica para enriquecer la escena si falta algún campo obligatorio
  }));
  logger.info(`🎬 ${scenes.length} escenas/tomas generadas desde el timeline del LLM.`);

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
    voiceOver = await createVoiceOver(plan as any);
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
  logger.info('🎥 Generando clips con Kling (render incremental, 1:1 con timeline)...');
  const clips: string[] = [];
  const failedScenes: number[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const normalizedScene = normalizeSceneFields(scenes[i]);
    try {
      logger.info(`🎬 Generando clip ${i + 1}/${scenes.length}...`);
      const result = await retry(() => generateClipsKling([normalizedScene], { plan: plan as any, music, previewMode }));
      if (result && result.clips && result.clips[0]) {
        if (typeof result.clips[0] !== 'string' || !result.clips[0].startsWith('http') || result.clips[0].includes('placehold.co')) {
          logger.error(`❌ Clip ${i + 1} falló: URL inválida o placeholder`);
          const { logFeedback } = await import('../services/feedbackService.js');
          logFeedback({
            service: 'KlingService',
            action: 'validateClipUrl',
            success: false,
            error: 'URL inválida o placeholder',
            params: { url: result.clips[0], scene: normalizedScene }
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
        params: { scene: normalizedScene }
      });
      failedScenes.push(i);
      clips.push('');
    }
  }
  // Si hay fallos, intentar reintentar solo los fallidos una vez más
  if (failedScenes.length > 0) {
    logger.warn(`🔁 Reintentando escenas fallidas: ${failedScenes.join(', ')}`);
    for (const idx of failedScenes) {
      const normalizedScene = normalizeSceneFields(scenes[idx]);
      try {
        const result = await retry(() => generateClipsKling([normalizedScene], { plan: plan as any, music, previewMode }));
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
    finalUrl = await assembleVideo({ plan: plan as any, clips: successfulClips, voiceOver, music: [music], sfx });
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

