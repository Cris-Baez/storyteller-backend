import { createVideoPlan } from '../services/llmService/index.js';
import { findBestAsset } from '../services/searchAsset.js';
import { getAdvancedMusic } from '../services/musicService.js';
import { createVoiceOver } from '../services/voiceService.js';
import { getSfx } from '../services/sceneAudioService.js';
import { generateKlingClip, KlingClipParams } from '../services/klingService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { uploadToCDN } from '../services/cdnService.js';
import { RenderRequest, VideoPlan, TimelineSecond } from '../utils/types.js';
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
  let videoPlan: VideoPlan;
  try {
    videoPlan = await createVideoPlan(req);
    // BLINDAJE: Rellenar campos vacíos o faltantes
    if (!videoPlan.visualStyle) videoPlan.visualStyle = req.visualStyle || 'cinematic';
    if (!videoPlan.metadata) videoPlan.metadata = {
      visualStyle: videoPlan.visualStyle,
      duration: req.duration || 30,
      prompt: req.prompt || '',
    };
    if (!videoPlan.metadata.visualStyle) videoPlan.metadata.visualStyle = videoPlan.visualStyle;
    if (!videoPlan.metadata.duration) videoPlan.metadata.duration = req.duration || 30;
    if (!videoPlan.metadata.prompt) videoPlan.metadata.prompt = req.prompt || '';
    if (!videoPlan.timeline || !Array.isArray(videoPlan.timeline)) videoPlan.timeline = [];
    for (let i = 0; i < Math.max(videoPlan.timeline.length, 1); i++) {
      const scene = videoPlan.timeline[i] || {};
      if (typeof scene.t !== 'number') scene.t = i * 5;
      if (!scene.backgroundPrompt) scene.backgroundPrompt = 'fondo por defecto';
      if (!scene.actorPrompt) scene.actorPrompt = 'actor por defecto';
      if (!scene.visual) scene.visual = 'visual por defecto';
      if (!scene.camera) scene.camera = 'medium';
      if (!scene.lighting) scene.lighting = 'normal';
      if (!scene.colorPalette) scene.colorPalette = 'neutro';
      if (!scene.composition) scene.composition = '';
      if (!scene.atmosphere) scene.atmosphere = '';
      if (!scene.effects) scene.effects = '';
      if (!scene.emotion) scene.emotion = 'neutro';
      if (!scene.music) scene.music = { mood: 'neutro', trackId: '' };
      if (!scene.dialogo) scene.dialogo = '';
      if (!scene.voz) scene.voz = '';
      if (!scene.lipSync) scene.lipSync = '';
      if (!scene.overlays) scene.overlays = [];
      if (!scene.luts) scene.luts = [];
      if (!scene.soundCue) scene.soundCue = 'ambiente';
      if (!scene.transition) scene.transition = 'cut';
      if (typeof scene.carryover !== 'boolean') scene.carryover = false;
      if (typeof scene.audioCarryover !== 'boolean') scene.audioCarryover = false;
      if (!scene.faceAnimation) scene.faceAnimation = '';
      videoPlan.timeline[i] = scene;
    }
    logger.info('[Pipeline] VideoPlan generado y blindado', { timeline: videoPlan.timeline?.length, visualStyle: videoPlan.metadata?.visualStyle });
    if (!videoPlan || !videoPlan.timeline || videoPlan.timeline.length === 0) {
      logger.warn('[Pipeline] VideoPlan vacío, se genera escena por defecto');
      videoPlan.timeline = [{
        t: 0,
        backgroundPrompt: 'fondo por defecto',
        actorPrompt: 'actor por defecto',
        visual: 'visual por defecto',
        camera: 'medium',
        lighting: 'normal',
        colorPalette: 'neutro',
        composition: '',
        atmosphere: '',
        effects: '',
        emotion: 'neutro',
        music: { mood: 'neutro', trackId: '' },
        dialogo: '',
        voz: '',
        lipSync: '',
        overlays: [],
        luts: [],
        soundCue: 'ambiente',
        transition: 'cut',
        carryover: false,
        audioCarryover: false,
        faceAnimation: ''
      }];
    }
  } catch (err) {
    logger.error('[Pipeline] Error generando VideoPlan', { error: err });
    throw err;
  }

  let scenes: any[] = [];
  try {
    scenes = await Promise.all(videoPlan.timeline.map(async (scene: TimelineSecond, idx: number) => {
      let angulo = typeof scene.camera === 'object' ? scene.camera.shot : scene.camera;
      let fondoAsset = null;
      let actorAsset = null;
      try {
        fondoAsset = await findBestAsset({ tipo: 'escenas', nombre: scene.backgroundPrompt, angulo });
        if (!fondoAsset || !fondoAsset.ruta || typeof fondoAsset.ruta !== 'string') {
          logger.error(`[Pipeline] Fondo no encontrado o inválido en escena ${idx}`, { scene });
          throw new Error('Fondo no encontrado o inválido');
        }
      } catch (err) {
        logger.error(`[Pipeline] Error buscando fondo en escena ${idx}`, { error: err });
        throw err;
      }
      try {
        if (actorCustomPath) {
          actorAsset = { ruta: actorCustomPath, tipo: 'actor', nombre: 'custom' };
        } else {
          actorAsset = await findBestAsset({ tipo: 'actor', nombre: scene.actorPrompt });
        }
        if (!actorAsset || !actorAsset.ruta || typeof actorAsset.ruta !== 'string') {
          logger.error(`[Pipeline] Actor no encontrado o inválido en escena ${idx}`, { scene });
          throw new Error('Actor no encontrado o inválido');
        }
      } catch (err) {
        logger.error(`[Pipeline] Error buscando actor en escena ${idx}`, { error: err });
        throw err;
      }
      return { ...scene, fondoAsset, actorAsset };
    }));
    logger.info('[Pipeline] Assets seleccionados para todas las escenas', { scenes: scenes.length });
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

  // Composición y animación en Kling
  const clips: string[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const params: KlingClipParams = {
      prompt: scene.visual || scene.backgroundPrompt || req.prompt,
      input_image_urls: [scene.fondoAsset?.ruta, scene.actorAsset?.ruta].filter((v): v is string => typeof v === 'string'),
      duration: req.duration || 30,
      aspect_ratio: '16:9',
    };
    try {
      if (params.input_image_urls.length < 2) {
        logger.error(`[Pipeline] URLs de imagen insuficientes en escena ${i}`, { params });
        throw new Error('input_image_urls debe ser un array de al menos dos strings (fondo y actor)');
      }
      const clipUrl = await generateKlingClip(params);
      logger.info(`[Pipeline] Clip generado para escena ${i}`, { clipUrl });
      clips.push(clipUrl);
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
    voiceBuffer = await createVoiceOver(videoPlan);
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
      voiceOver: voiceBuffer,
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
