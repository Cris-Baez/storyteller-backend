// ✨ ARQUITECTURA UNIFICADA: Todo pasa por el sistema de cerebros cinematográficos
import { dispatchCerebros, RequestGeneracion } from '../services/llmService/dispatcher.js';
import { EstiloVisualPrincipal, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
// ❌ ELIMINADO: import { createVideoPlan } from '../services/llmService/index.js'; - Ya no usamos sistema legacy
import { getAdvancedMusic, getSfx } from '../services/audioEngine.js';  // ✨ MEJORADO: Reorganizado
import { createVoiceBuffer } from '../services/voiceService.js';  // ✨ MEJORADO: Renombrado
import { generateKlingClip, KlingClipParams } from '../services/klingService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { uploadToCDN } from '../services/cdnService.js';
import { applySadTalker } from '../services/sadtalkerService.js';
import { applyWav2Lip } from '../services/wav2lipService.js';
import { RenderRequest, VideoPlan, TimelineSecond, EstiloVisual } from '../utils/types.js';
import { validarRenderRequest } from '../utils/validadores.js';  // ✨ NUEVO: Validación estricta
import { cargarAssetsIndex, validarVideoPlanFondosActores, corregirFondosActoresInvalidos } from '../utils/menteFondos.js';
import { generateQuickKlingVideo } from '../services/clipService.js';

/**
 * Analiza la ruta de un asset para extraer información contextual
 */
function analizarRutaAsset(ruta: string): { lugar?: string, variante?: string, tipo?: string, estilo?: string } {
  // Ejemplo de ruta: "escenas/realista/naturaleza/montaña/día/lateral.png"
  // o "actores/comic/casa/baño/día/ninomasculinopensativocasual.png"
  // También maneja URLs del CDN: "https://storage.googleapis.com/storyteller-ai-cdn/escenas/comic/naturaleza/desierto/día/frontal.png"
  
  // Extraer solo la parte de la ruta después del CDN
  let rutaLimpia = ruta;
  if (ruta.includes('storyteller-ai-cdn/')) {
    rutaLimpia = ruta.split('storyteller-ai-cdn/')[1];
  }
  
  const partes = rutaLimpia.split('/');
  if (partes.length < 3) return {};
  
  const tipoAsset = partes[0]; // escenas o actores
  const estilo = partes[1]; // realista, comic, anime, etc.
  
  if (tipoAsset === 'escenas' && partes.length >= 4) {
    return {
      lugar: partes[2], // naturaleza, ciudad, casa, etc.
      variante: partes[3], // montaña, calle, baño, etc.
      estilo
    };
  } else if (tipoAsset === 'actores' && partes.length >= 6) {
    const nombreActor = partes[5].replace('.png', '');
    return {
      tipo: extraerTipoPersonaje(nombreActor),
      lugar: partes[2],
      variante: partes[3],
      estilo
    };
  }
  
  return { estilo };
}

/**
 * Extrae el tipo de personaje del nombre del archivo
 */
function extraerTipoPersonaje(nombreArchivo: string): string {
  // Ejemplo: "ninomasculinopensativocasual" → "thoughtful young man"
  const masculino = nombreArchivo.includes('masculino');
  const femenino = nombreArchivo.includes('femenino');
  const nino = nombreArchivo.includes('nino');
  const adulto = nombreArchivo.includes('adulto') || nombreArchivo.includes('hombre') || nombreArchivo.includes('mujer');
  
  let descripcion = '';
  if (nino) {
    descripcion += masculino ? 'young man' : femenino ? 'young woman' : 'young person';
  } else if (adulto) {
    descripcion += masculino ? 'man' : femenino ? 'woman' : 'person';
  } else {
    descripcion += 'person';
  }
  
  // Agregar emociones/características comunes
  if (nombreArchivo.includes('pensativo')) descripcion += ', thoughtful';
  if (nombreArchivo.includes('feliz')) descripcion += ', happy';
  if (nombreArchivo.includes('sorprendido')) descripcion += ', surprised';
  if (nombreArchivo.includes('serio')) descripcion += ', serious';
  
  return descripcion;
}

/**
 * Genera un prompt cinematográfico coherente y específico para Kling
 * MEJORADO: Contexto narrativo y continuidad visual
 */
function generarPromptCinematografico(params: {
  prompt: string;
  descripcionToma?: string;
  promptKling?: string;
  visual?: string;
  duracion: number;
  momento?: string;
  visualStyle?: EstiloVisualPrincipal;
  tomaNumero?: number;
  totalTomas?: number;
  contextoPrevio?: string; // ✅ NUEVO: Continuidad narrativa
  fondoDescripcion?: string; // ✅ NUEVO: Descripción del escenario
  personajeDescripcion?: string; // ✅ NUEVO: Descripción del personaje
}): string {
  const { 
    prompt, descripcionToma, promptKling, visual, duracion, momento, visualStyle,
    tomaNumero = 1, totalTomas = 1, contextoPrevio, fondoDescripcion, personajeDescripcion
  } = params;
  
  // 1. Base narrativa específica
  const contenidoBase = promptKling || descripcionToma || visual || prompt;
  
  // 2. Contexto de secuencia para continuidad
  let contextoSecuencia = '';
  if (totalTomas > 1) {
    if (tomaNumero === 1) {
      contextoSecuencia = 'Opening sequence: ';
    } else if (tomaNumero === totalTomas) {
      contextoSecuencia = 'Final sequence: ';
    } else {
      contextoSecuencia = `Sequence ${tomaNumero} of ${totalTomas}: `;
    }
  }
  
  // 3. Continuidad narrativa específica
  const continuidad = contextoPrevio ? `Continuing from previous scene, ${contextoPrevio}. ` : '';
  
  // 4. Descripción del ambiente específico - ✅ CORREGIDO: Validación robusta
  const ambiente = fondoDescripcion && fondoDescripcion !== 'scenic location' 
    ? `Setting: ${fondoDescripcion}. ` 
    : '';
  const personaje = personajeDescripcion && personajeDescripcion !== 'character' 
    ? `Character: ${personajeDescripcion}. ` 
    : '';
  
  // 5. Estilo visual coherente
  const contextoEstilo = visualStyle === 'cinematic' ? 'photorealistic, cinematic style, film quality' :
                        visualStyle === 'anime' ? 'anime style, vibrant colors, manga aesthetic' :
                        visualStyle === 'cartoon' ? 'cartoon style, stylized animation' :
                        visualStyle === 'commercial' ? 'commercial style, polished, professional' :
                        'cinematic style';
  
  // 6. Construcción del prompt coherente y específico - ✅ MEJORADO
  const promptFinal = `${contextoSecuencia}${continuidad}${ambiente}${personaje}${contenidoBase}. ${contextoEstilo}, smooth camera movement, professional cinematography, ${duracion} seconds duration, dramatic lighting, high production value`;
  
  // ✅ DEBUG: Log del prompt final
  console.log(`[Pipeline] 🔍 DEBUG Prompt generado:`, {
    tomaNumero,
    contextoParts: {
      contextoSecuencia,
      continuidad: continuidad.substring(0, 50) + '...',
      ambiente,
      personaje,
      contenidoBase: contenidoBase.substring(0, 50) + '...',
      contextoEstilo
    },
    promptFinal: promptFinal.substring(0, 100) + '...'
  });
  
  return promptFinal;
}

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
    // ✨ ARQUITECTURA UNIFICADA: Todo pasa por el sistema de cerebros
    logger.info(`[Pipeline] 🧠 Usando SISTEMA DE CEREBROS CINEMATOGRÁFICOS para: ${reqNormalizado.visualStyle}`);
    
    // ✅ NORMALIZAR ESTILO: Usar función unificada
    const estiloNormalizado = normalizarEstilo(reqNormalizado.visualStyle as EstiloVisualAPI);
    
    // Crear request para sistema de cerebros
    const requestCerebros: RequestGeneracion = {
      prompt: reqNormalizado.prompt,
      duracion: reqNormalizado.duration,
      estilo: estiloNormalizado,
      estiloOriginal: reqNormalizado.visualStyle, // ✅ NUEVO: Estilo original para assets
      configuracion: {
        demoMode: reqNormalizado.demoMode,
        previewMode: reqNormalizado.previewMode,
        metadata: reqNormalizado.metadata
      }
    };    // Despachar al equipo de cerebros (con fallbacks internos)
    const resultadoCerebros = await dispatchCerebros(requestCerebros);
    
    if (!resultadoCerebros.success) {
      throw new Error(`❌ Sistema de cerebros falló: ${resultadoCerebros.error}`);
    }
    
    // Convertir respuesta de cerebros al formato VideoPlan esperado
    videoPlan = {
      timeline: resultadoCerebros.videoPlan,
      tomasReales: resultadoCerebros.tomasReales, // ✅ NUEVO: Incluir tomas cinematográficas
      metadata: resultadoCerebros.metadata,
      configuracionGlobal: resultadoCerebros.configuracion,
      restricciones: resultadoCerebros.restricciones
    };
    
    logger.info(`[Pipeline] ✅ Cerebros generaron: ${videoPlan.timeline.length} segundos (${estiloNormalizado} para ${reqNormalizado.visualStyle})`);
    
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
    // Mapear desde el formato de los cerebros cinematográficos
    scenes = videoPlan.timeline.map((scene: any, idx: number) => {
      // Los cerebros retornan 'fondo' y 'actor' como objetos
      let fondoAsset = scene.fondo && scene.fondo.ruta ? { ruta: scene.fondo.ruta, tipo: 'escenas', nombre: scene.fondo.nombre || '' } : null;
      let actorAsset = null;
      
      if (actorCustomPath) {
        actorAsset = { ruta: actorCustomPath, tipo: 'actor', nombre: 'custom' };
      } else if (scene.actor && scene.actor.ruta) {
        actorAsset = { ruta: scene.actor.ruta, tipo: 'actor', nombre: scene.actor.nombre || '' };
      }
      
      // Si alguno está vacío, usar fallbacks
      if (!fondoAsset || !fondoAsset.ruta) {
        logger.warn(`[Pipeline] Usando fondo fallback para escena ${idx}`);
        fondoAsset = { ruta: 'assets/escenas/default_background.jpg', tipo: 'escenas', nombre: 'fallback_background' };
      }
      if (!actorAsset || !actorAsset.ruta) {
        logger.warn(`[Pipeline] Usando actor fallback para escena ${idx}`);
        actorAsset = { ruta: 'assets/actores/default_actor.jpg', tipo: 'actor', nombre: 'fallback_actor' };
      }
      
      // ✨ CRÍTICO: Convertir rutas relativas a URLs completas
      fondoAsset.ruta = convertirRutaAURLCompleta(fondoAsset.ruta);
      actorAsset.ruta = convertirRutaAURLCompleta(actorAsset.ruta);
      
      logger.info(`[Pipeline] Escena ${idx} validada:`, { 
        fondo: fondoAsset.ruta, 
        actor: actorAsset.ruta, 
        segundo: scene.segundo 
      });
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

  // ✨ NUEVO: Generación inteligente de clips por tomas cinematográficas
  // En lugar de generar 30 clips de 1 segundo, generar 3 clips de 10 segundos
  
  // ✅ CRÍTICO: Detectar si el orquestador ya creó tomas reales
  let tomasUnicas: any[];
  if (videoPlan.tomasReales && videoPlan.tomasReales.length > 0) {
    // ✅ CORREGIDO: Combinar tomas reales con información del timeline
    tomasUnicas = videoPlan.tomasReales.map((tomaReal: any) => {
      // Buscar el primer segundo del timeline que corresponde a esta toma
      const segundoInicioToma = videoPlan.timeline.findIndex((seg: any, idx: number) => {
        // Calcular en qué toma debería estar este segundo
        let segundoAcumulado = 0;
        for (const toma of videoPlan.tomasReales) {
          if (segundoAcumulado <= idx && idx < segundoAcumulado + toma.duracion) {
            return toma.numero === tomaReal.numero;
          }
          segundoAcumulado += toma.duracion;
        }
        return false;
      });
      
      const infoTimeline = segundoInicioToma >= 0 ? videoPlan.timeline[segundoInicioToma] : null;
      
      return {
        ...tomaReal,
        fondo: infoTimeline?.fondo,
        actor: infoTimeline?.actor,
        camara: infoTimeline?.camara,
        sonido: infoTimeline?.sonido,
        edicion: infoTimeline?.edicion
      };
    });
    logger.info(`[Pipeline] 🎬 Usando ${tomasUnicas.length} tomas del orquestador cinematográfico`);
    
    // ✅ DEBUG: Verificar que las tomas combinadas tienen la información necesaria
    tomasUnicas.forEach((toma, idx) => {
      logger.info(`[Pipeline] 🔍 DEBUG Toma combinada ${idx + 1}:`, {
        numero: toma.numero,
        descripcion: toma.descripcion?.substring(0, 50) + '...',
        duracion: toma.duracion,
        tieneFondo: !!toma.fondo?.ruta,
        tieneActor: !!toma.actor?.ruta,
        rutaFondo: toma.fondo?.ruta,
        rutaActor: toma.actor?.ruta
      });
    });
  } else {
    // Fallback: agrupar scenes en tomas cinematográficas únicas
    tomasUnicas = agruparEnTomasUnicas(scenes, logger);
    logger.info(`[Pipeline] 🎬 Generando ${tomasUnicas.length} tomas cinematográficas (fallback - agrupando ${scenes.length} escenas)`);
  }
  
  // 🚀 GENERACIÓN PARALELA DE TODAS LAS TOMAS
  logger.info(`[Pipeline] 🎬 Generando ${tomasUnicas.length} tomas en paralelo...`);
  
  // ✅ VALIDACIÓN PREVIA: Verificar que todas las tomas tienen las URLs necesarias
  for (let i = 0; i < tomasUnicas.length; i++) {
    const toma = tomasUnicas[i];
    if (!toma.fondo?.ruta || !toma.actor?.ruta) {
      logger.error(`[Pipeline] ❌ Toma ${i + 1} no tiene URLs válidas:`, {
        numero: toma.numero,
        rutaFondo: toma.fondo?.ruta,
        rutaActor: toma.actor?.ruta,
        estructuraToma: Object.keys(toma)
      });
      throw new Error(`Toma ${i + 1} no tiene assets válidos (fondo: ${!!toma.fondo?.ruta}, actor: ${!!toma.actor?.ruta})`);
    }
  }
  
  const tomasPromises = tomasUnicas.map(async (toma, tomaIdx) => {
    // Generar prompt cinematográfico con continuidad narrativa
    const estiloNormalizado = videoPlan.metadata?.visualStyle ? 
      normalizarEstilo(videoPlan.metadata.visualStyle as any) : 
      'cinematic';
    
    // ✅ NUEVO: Análisis del fondo y personaje para contexto específico
    const rutaFondo = toma.fondo?.ruta;
    const rutaActor = toma.actor?.ruta;
    
    // ✅ DEBUG: Log detallado para depuración
    logger.info(`[Pipeline] 🔍 DEBUG Toma ${tomaIdx + 1}:`, {
      rutaFondo,
      rutaActor,
      descripcionToma: toma.descripcion,
      tipoToma: toma.tipoToma,
      duracion: toma.duracion,
      tomaCompleta: JSON.stringify(toma, null, 2)
    });
    
    // Extraer información contextual del fondo
    const fondoInfo = rutaFondo ? analizarRutaAsset(rutaFondo) : null;
    const actorInfo = rutaActor ? analizarRutaAsset(rutaActor) : null;
    
    // ✅ DEBUG: Log información extraída
    logger.info(`[Pipeline] 🔍 DEBUG Info extraída:`, {
      fondoInfo,
      actorInfo
    });
    
    // ✅ NUEVO: Contexto de toma anterior para continuidad
    const contextoPrevio = tomaIdx > 0 ? 
      `previous scene showed ${tomasUnicas[tomaIdx - 1].descripcion}` : 
      undefined;
    
    // ✅ CORREGIDO: Construir descripciones más robustas
    const fondoDescripcion = fondoInfo && fondoInfo.lugar && fondoInfo.variante 
      ? `${fondoInfo.lugar}/${fondoInfo.variante}` 
      : fondoInfo?.lugar || 'scenic location';
      
    const personajeDescripcion = actorInfo?.tipo || 'character';
    
    // ✅ DEBUG: Log descripciones finales
    logger.info(`[Pipeline] 🔍 DEBUG Descripciones:`, {
      fondoDescripcion,
      personajeDescripcion,
      contextoPrevio
    });
      
    const promptCinematografico = generarPromptCinematografico({
      prompt: req.prompt,
      descripcionToma: toma.descripcion,
      promptKling: toma.promptKling,
      visual: toma.visual,
      duracion: toma.duracion,
      momento: toma.momentoNarrativo,
      visualStyle: estiloNormalizado,
      tomaNumero: tomaIdx + 1,
      totalTomas: tomasUnicas.length,
      contextoPrevio,
      fondoDescripcion,
      personajeDescripcion
    });
    
    const params: KlingClipParams = {
      prompt: promptCinematografico,
      input_image_urls: [
        rutaFondo, 
        rutaActor
      ].filter((v): v is string => typeof v === 'string' && v.length > 0)
       .map(ruta => convertirRutaAURLCompleta(ruta)),
      duration: Math.min(toma.duracion, 10), // Kling máximo 10s
      aspect_ratio: '16:9',
    };
    
    if (params.input_image_urls.length < 2) {
      logger.error(`[Pipeline] URLs de imagen insuficientes en toma ${tomaIdx + 1}`, { params });
      throw new Error('input_image_urls debe ser un array de al menos dos strings (fondo y actor)');
    }
    
    logger.info(`[Pipeline] 🎥 Generando toma ${tomaIdx + 1}/${tomasUnicas.length}: "${toma.descripcion}" (${toma.duracion}s)`, { 
      params: {
        prompt: params.prompt.substring(0, 100) + '...',
        duration: params.duration,
        urls: params.input_image_urls.map(url => url.substring(0, 50) + '...')
      }
    });
    
    const clipPromise = generateKlingClip(params);
    // Timeout extendido: 10 minutos por toma (video generation can take time)
    const clipUrl = await Promise.race([
      clipPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout generando toma ${tomaIdx + 1} Kling`)), 600000))
    ]);
    
    logger.info(`[Pipeline] ✅ Toma ${tomaIdx + 1} generada exitosamente`, { 
      clipUrl: typeof clipUrl === 'string' ? clipUrl.substring(0, 100) + '...' : 'URL generada' 
    });
    return clipUrl as string;
  });
  
  // Esperar a que todas las tomas se generen
  const clips = await Promise.all(tomasPromises);
  logger.info(`[Pipeline] 🎉 Todas las ${clips.length} tomas generadas exitosamente`);

  // Generación de audio automática
  let voiceBuffer: Buffer;
  let musicBuffer: Buffer;
  let sfxBuffer: Buffer;
  let voiceAudioPath: string = ''; // Para el lip-sync
  try {
    voiceBuffer = await createVoiceBuffer(videoPlan);  // ✨ MEJORADO: Nuevo nombre
    if (!voiceBuffer || !(voiceBuffer instanceof Buffer) || voiceBuffer.length === 0) {
      logger.warn('[Pipeline] Buffer de voz vacío, se usará silencio');
      voiceBuffer = Buffer.alloc(1);
    } else {
      // Guardar el audio de voz temporalmente para lip-sync
      const fs = await import('fs');
      const path = await import('path');
      voiceAudioPath = path.join(process.cwd(), 'tmp', `voice_${Date.now()}.wav`);
      fs.writeFileSync(voiceAudioPath, voiceBuffer);
      logger.info('[Pipeline] Audio de voz guardado para lip-sync:', voiceAudioPath);
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

  // ✨ NUEVO: Aplicar lip-sync inteligente según el estilo visual
  if (voiceAudioPath && clips.length > 0) {
    try {
      logger.info('[Pipeline] 🎭 Aplicando lip-sync inteligente...');
      
      // Determinar qué tecnología usar según el estilo
      const estiloVisual = videoPlan.metadata?.visualStyle || 'cinematic';
      const usarSadTalker = ['anime', 'cartoon'].includes(estiloVisual);
      
      logger.info(`[Pipeline] Estilo detectado: ${estiloVisual} → Usando ${usarSadTalker ? 'SadTalker' : 'Wav2Lip'}`);
      
      // Aplicar lip-sync a todos los clips
      for (let i = 0; i < clips.length; i++) {
        const originalClip = clips[i];
        logger.info(`[Pipeline] Procesando clip ${i + 1}/${clips.length} con ${usarSadTalker ? 'SadTalker' : 'Wav2Lip'}`);
        
        try {
          let lipSyncClip: string;
          if (usarSadTalker) {
            // Para anime/cartoon: usar SadTalker
            lipSyncClip = await applySadTalker(
              originalClip, 
              voiceAudioPath, 
              scenes[i]?.ambiente || 'neutral',
              estiloVisual
            );
          } else {
            // Para realista/cinematic: usar Wav2Lip
            lipSyncClip = await applyWav2Lip(
              originalClip, 
              voiceAudioPath, 
              scenes[i]?.ambiente || 'neutral',
              estiloVisual
            );
          }
          
          // Reemplazar el clip original con el que tiene lip-sync
          clips[i] = lipSyncClip;
          logger.info(`[Pipeline] ✅ Clip ${i + 1} procesado con lip-sync: ${lipSyncClip}`);
          
        } catch (lipSyncError) {
          logger.warn(`[Pipeline] ⚠️ Error en lip-sync del clip ${i + 1}, usando clip original:`, lipSyncError);
          // Mantener el clip original si hay error
        }
      }
      
      logger.info('[Pipeline] 🎭 Lip-sync completado para todos los clips');
      
    } catch (err) {
      logger.warn('[Pipeline] ⚠️ Error general en lip-sync, continuando sin él:', err);
      // Continuar con clips originales si hay error general
    }
    
    // Limpiar archivo temporal de audio
    try {
      const fs = await import('fs');
      if (fs.existsSync(voiceAudioPath)) {
        fs.unlinkSync(voiceAudioPath);
        logger.info('[Pipeline] Archivo temporal de audio limpiado');
      }
    } catch (cleanupError) {
      logger.warn('[Pipeline] No se pudo limpiar archivo temporal:', cleanupError);
    }
  } else {
    logger.info('[Pipeline] Saltando lip-sync (sin audio de voz o sin clips)');
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

/**
 * ✨ CRÍTICO: Convierte rutas relativas a URLs completas para Fal.ai
 * Las rutas como 'escenas/anime/...' deben convertirse a URLs completas
 */
function convertirRutaAURLCompleta(ruta: string): string {
  // Si ya es una URL completa, retornarla tal como está
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
    console.log(`[Pipeline] URL ya completa: ${ruta}`);
    return ruta;
  }
  
  // Usar la URL correcta del CDN configurada en .env
  const CDN_BASE = process.env.CDN_BUCKET_URL || 'https://storage.googleapis.com/storyteller-ai-cdn';
  
  // Limpiar la ruta: eliminar barras iniciales
  const rutaLimpia = ruta.startsWith('/') ? ruta.substring(1) : ruta;
  
  const urlCompleta = `${CDN_BASE}/${rutaLimpia}`;
  console.log(`[Pipeline] 🔗 Convertida: ${ruta} → ${urlCompleta}`);
  return urlCompleta;
}

/**
 * ✨ NUEVO: Agrupa escenas individuales en tomas cinematográficas únicas
 * Convierte 30 escenas de 1s en 3 tomas de 10s (límite de Kling)
 */
function agruparEnTomasUnicas(scenes: any[], logger: any): any[] {
  const tomasUnicas: any[] = [];
  const DURACION_MAXIMA_TOMA = 10; // Límite de Kling
  
  let tomaActual: any = null;
  let duracionAcumulada = 0;
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    
    // Si no hay toma actual o cambió el fondo/contexto, crear nueva toma
    const cambioDeContexto = tomaActual && (
      tomaActual.fondoAsset?.ruta !== scene.fondoAsset?.ruta ||
      duracionAcumulada >= DURACION_MAXIMA_TOMA
    );
    
    if (!tomaActual || cambioDeContexto) {
      // Finalizar toma anterior si existe
      if (tomaActual) {
        tomaActual.duracion = duracionAcumulada;
        tomasUnicas.push(tomaActual);
        logger.info(`[Pipeline] 📸 Toma ${tomasUnicas.length} creada: ${duracionAcumulada}s - ${tomaActual.descripcionToma}`);
      }
      
      // Iniciar nueva toma
      tomaActual = {
        id: tomasUnicas.length + 1,
        fondoAsset: scene.fondoAsset,
        actorAsset: scene.actorAsset,
        visual: scene.visual || scene.backgroundPrompt,
        promptKling: scene.promptKling,
        descripcionToma: scene.descripcionToma || `Toma ${tomasUnicas.length + 1}`,
        momentoNarrativo: scene.momentoNarrativo,
        movimientoKling: scene.camara?.movimientoKling || 'camera_static',
        inicioSegundo: scene.segundo,
        escenasIncluidas: [scene.segundo]
      };
      duracionAcumulada = 1;
    } else {
      // Continuar toma actual
      duracionAcumulada++;
      tomaActual.escenasIncluidas.push(scene.segundo);
      
      // Actualizar información si es más específica
      if (scene.promptKling && !tomaActual.promptKling) {
        tomaActual.promptKling = scene.promptKling;
      }
      if (scene.descripcionToma && scene.descripcionToma !== `Toma ${tomaActual.id}`) {
        tomaActual.descripcionToma = scene.descripcionToma;
      }
    }
  }
  
  // Finalizar última toma
  if (tomaActual) {
    tomaActual.duracion = duracionAcumulada;
    tomasUnicas.push(tomaActual);
    logger.info(`[Pipeline] 📸 Última toma creada: ${duracionAcumulada}s - ${tomaActual.descripcionToma}`);
  }
  
  logger.info(`[Pipeline] 🎬 Resumen: ${scenes.length} escenas → ${tomasUnicas.length} tomas cinematográficas`);
  
  return tomasUnicas;
}
