import { createVideoPlan } from '../services/llmService/index.js';
import { adaptarCerebrosAVideoPlan, debugAdaptador } from '../services/llmService/adaptador-cerebros.js';
import { findBestAsset } from '../services/searchAsset.js';
import { getAdvancedMusic, getSfx } from '../services/audioEngine.js';  // ✨ MEJORADO: Reorganizado
import { createVoiceBuffer } from '../services/voiceService.js';  // ✨ MEJORADO: Renombrado
import { generateKlingClip, KlingClipParams } from '../services/klingService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { uploadToCDN } from '../services/cdnService.js';
import { RenderRequest, VideoPlan, TimelineSecond, EstiloVisual } from '../utils/types.js';
import { validarRenderRequest } from '../utils/validadores.js';  // ✨ NUEVO: Validación estricta
import { cargarAssetsIndex, validarVideoPlanFondosActores, corregirFondosActoresInvalidos } from '../utils/menteFondos.js';
import { generateQuickKlingVideo } from '../services/clipService.js';

/**
 * Pipeline robusto y profesional para CinemaAI
 * @param req RenderRequest completo
 * @param actorCustomPath PNG si el usuario subió imagen personalizada
 * @param quickMode Si es true, usa el flujo rápido de video corto (Kling 2.1 + música)
 */
export async function renderCinemaAI(req: RenderRequest, actorCustomPath?: string, quickMode?: boolean) {

  // LOGS Y MANEJO DE ERRORES EN TODO EL PIPELINE
  const logger = console; // Puedes cambiar por tu logger profesional
  logger.info('[Pipeline] Iniciando renderCinemaAI', { quickMode, actorCustomPath });

  // ⚠️ CRÍTICO: Validación estricta para prevenir errores silenciosos
  const validacion = validarRenderRequest(req);
  if (!validacion.valido) {
    logger.warn(`⚠️ [Pipeline] Request con warnings: ${validacion.errores.join(', ')}`);
  }
  
  // Usar datos normalizados si es necesario
  const reqNormalizado = validacion.normalizado || req;
  
  // Validar y rellenar los datos mínimos restantes
  if (!reqNormalizado.visualStyle) reqNormalizado.visualStyle = 'cinematic';
  if (!reqNormalizado.duration) reqNormalizado.duration = 30;
  if (!reqNormalizado.prompt) reqNormalizado.prompt = '';

  let videoPlan: VideoPlan;
  let sugerencias: any[] = [];
  try {
    // NUEVO: Usar sistema de cerebros cinematográficos para estilos soportados
    const estilosSoportadosCerebros = ['cinematic'];
    const usarSistemaCerebros = estilosSoportadosCerebros.includes(reqNormalizado.visualStyle);
    
    if (usarSistemaCerebros) {
      logger.info('[Pipeline] Usando sistema de cerebros cinematográficos con adaptador');
      
      videoPlan = await adaptarCerebrosAVideoPlan(reqNormalizado);
      
      // Debug del adaptador en desarrollo
      if (process.env.NODE_ENV === 'development') {
        debugAdaptador(videoPlan);
      }
      
      logger.info(`[Pipeline] VideoPlan generado por cerebros: ${videoPlan.timeline.length} segundos`);
      
    } else {
      // Usar sistema legacy para otros estilos
      logger.info('[Pipeline] Usando sistema legacy para estilo:', req.visualStyle);
      videoPlan = await createVideoPlan(req);
    }
    // Validación final: el VideoPlan debe tener timeline válida y al menos una escena
    if (!videoPlan || !videoPlan.timeline || !Array.isArray(videoPlan.timeline) || videoPlan.timeline.length === 0) {
      logger.error('[Pipeline] VideoPlan inválido o vacío', { videoPlan });
      throw new Error('El VideoPlan generado por LLMService es inválido o está vacío.');
    }
    
    // NOTA: Los modelos de LLMService ya aplican validación y corrección internamente
    // Esta es una verificación adicional para garantizar que los assets son válidos
    const assetsIndex = await cargarAssetsIndex();
    const { valido, errores } = validarVideoPlanFondosActores(videoPlan, assetsIndex);
    
    if (!valido) {
      logger.warn('[Pipeline] Se detectaron assets inválidos en el VideoPlan final', { errores });
      // Aplicar una última corrección por seguridad
      const resultado = corregirFondosActoresInvalidos(videoPlan, assetsIndex);
      videoPlan = resultado.videoPlan;
      sugerencias = resultado.sugerencias;
      logger.warn('[Pipeline] VideoPlan corregido nuevamente por assets inválidos', { sugerencias });
    } else {
      logger.info('[Pipeline] VideoPlan validado correctamente, todos los assets son válidos');
    }
    
    logger.info('[Pipeline] VideoPlan generado, validado y corregido', { timeline: videoPlan.timeline.length, visualStyle: videoPlan.metadata?.visualStyle });
  } catch (err) {
    logger.error('[Pipeline] Error generando/corrigiendo VideoPlan', { error: err });
    throw err;
  }

  let scenes: any[] = [];
  try {
    // Usar directamente los campos corregidos del videoPlan (ya son URLs CDN)
    scenes = videoPlan.timeline.map((scene: TimelineSecond, idx: number) => {
      let fondoAsset = scene.background && typeof scene.background === 'string' ? { ruta: scene.background, tipo: 'escenas', nombre: scene.backgroundPrompt || '' } : null;
      let actorAsset = null;
      if (actorCustomPath) {
        actorAsset = { ruta: actorCustomPath, tipo: 'actor', nombre: 'custom' };
      } else {
        actorAsset = scene.character && typeof scene.character === 'string' ? { ruta: scene.character, tipo: 'actor', nombre: scene.actorPrompt || '' } : null;
      }
      // Si alguno está vacío, lanzar error
      if (!fondoAsset || !fondoAsset.ruta) {
        logger.error(`[Pipeline] Fondo no encontrado o inválido en escena ${idx}`, { scene });
        throw new Error('Fondo no encontrado o inválido');
      }
      if (!actorAsset || !actorAsset.ruta) {
        logger.error(`[Pipeline] Actor no encontrado o inválido en escena ${idx}`, { scene });
        throw new Error('Actor no encontrado o inválido');
      }
      logger.info(`[Pipeline] Escena ${idx} validada:`, { fondo: fondoAsset.ruta, actor: actorAsset.ruta, t: scene.t, visualStyle: scene.visualStyle, ambiente: scene.ambiente, angulo: scene.angulo });
      return { ...scene, fondoAsset, actorAsset };
    });
    logger.info('[Pipeline] Assets seleccionados y validados para todas las escenas', { scenes: scenes.length });
  } catch (err) {
    logger.error('[Pipeline] Error seleccionando assets', { error: err });
    throw err;
  }

  // QuickMode
  if (quickMode && scenes.length > 0) {
    logger.info('[Pipeline] QuickMode activo');
    const fondoUrl = scenes[0].fondoAsset?.ruta;
    const actorUrl = scenes[0].actorAsset?.ruta;
    const prompt = scenes[0].visual || scenes[0].backgroundPrompt || req.prompt;
    const musicStyle = videoPlan.metadata?.visualStyle || 'cinematic';
    if (typeof fondoUrl !== 'string' || typeof actorUrl !== 'string') {
      logger.error('[Pipeline] No se encontró fondo o actor válido para QuickMode', { fondoUrl, actorUrl });
      throw new Error('No se encontró fondo o actor válido para el modo rápido (Kling 2.1)');
    }
    try {
      const { videoUrl, musicBuffer } = await generateQuickKlingVideo({ fondoUrl, actorUrl, prompt, musicStyle });
      logger.info('[Pipeline] Video rápido generado', { videoUrl });
      return {
        url: videoUrl,
        plan: videoPlan,
        scenes,
        clips: [videoUrl],
        resolution: videoPlan.metadata?.duration,
        visualStyle: videoPlan.metadata?.visualStyle,
        music: musicBuffer,
        quickMode: true
      };
    } catch (err) {
      logger.error('[Pipeline] Error en QuickMode', { error: err });
      throw err;
    }
  }

  // Composición y animación en Kling con timeout generoso y logs detallados
  const clips: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const params: KlingClipParams = {
      prompt: scene.visual || scene.backgroundPrompt || req.prompt,
      input_image_urls: [scene.fondoAsset?.ruta, scene.actorAsset?.ruta].filter((v): v is string => typeof v === 'string'),
      duration: reqNormalizado.duration || 30,
      aspect_ratio: '16:9',
    };
    try {
      if (params.input_image_urls.length < 2) {
        logger.error(`[Pipeline] URLs de imagen insuficientes en escena ${i}`, { params });
        throw new Error('input_image_urls debe ser un array de al menos dos strings (fondo y actor)');
      }
      logger.info(`[Pipeline] Generando clip Kling para escena ${i} con timeout extendido...`, { params });
      const clipPromise = generateKlingClip(params);
      // Timeout extendido: 2 minutos por escena
      const clipUrl = await Promise.race([
        clipPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout generando clip Kling')), 120000))
      ]);
      logger.info(`[Pipeline] Clip generado para escena ${i}`, { clipUrl });
      clips.push(clipUrl as string);
    } catch (err) {
      logger.error(`[Pipeline] Error generando clip Kling en escena ${i}`, { error: err });
      throw err;
    }
  }

  // Generación de audio automática
  let voiceBuffer: Buffer;
  let musicBuffer: Buffer;
  let sfxBuffer: Buffer;
  try {
    voiceBuffer = await createVoiceBuffer(videoPlan);  // ✨ MEJORADO: Nuevo nombre
    if (!voiceBuffer || !(voiceBuffer instanceof Buffer) || voiceBuffer.length === 0) {
      logger.warn('[Pipeline] Buffer de voz vacío, se usará silencio');
      voiceBuffer = Buffer.alloc(1);
    }
    musicBuffer = await getAdvancedMusic({ style: videoPlan.metadata?.visualStyle || 'cinematic' });
    if (!musicBuffer || !(musicBuffer instanceof Buffer) || musicBuffer.length === 0) {
      logger.warn('[Pipeline] Buffer de música vacío, se usará silencio');
      musicBuffer = Buffer.alloc(1);
    }
    sfxBuffer = await getSfx(scenes[0]?.soundCue || 'ambiente');
    if (!sfxBuffer || !(sfxBuffer instanceof Buffer) || sfxBuffer.length === 0) {
      logger.warn('[Pipeline] Buffer de SFX vacío, se usará silencio');
      sfxBuffer = Buffer.alloc(1);
    }
    logger.info('[Pipeline] Buffers de audio generados');
  } catch (err) {
    logger.error('[Pipeline] Error generando audio', { error: err });
    throw err;
  }

  // Edición final por plan (lógica avanzada según plan)
  // ...existing code...

  // Exportación profesional
  let finalUrl: string;
  try {
    finalUrl = await assembleVideo({
      plan: videoPlan,
      clips,
      voiceBuffer: voiceBuffer,  // ✨ MEJORADO: Renombrado para consistencia
      music: [musicBuffer],
      sfx: [sfxBuffer],
    });
    logger.info('[Pipeline] Video ensamblado correctamente', { finalUrl });
  } catch (err) {
    logger.error('[Pipeline] Error ensamblando video final', { error: err });
    throw err;
  }

  let cdnUrl: string;
  try {
    cdnUrl = await uploadToCDN(finalUrl, `renders/${Date.now()}_video.mp4`);
    logger.info('[Pipeline] Video subido al CDN', { cdnUrl });
  } catch (err) {
    logger.error('[Pipeline] Error subiendo video al CDN', { error: err });
    throw err;
  }

  return {
    url: cdnUrl,
    plan: videoPlan,
    scenes,
    clips,
    resolution: videoPlan.metadata?.duration,
    visualStyle: videoPlan.metadata?.visualStyle,
  };
}
