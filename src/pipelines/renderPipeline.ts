// ✨ ARQUITECTURA UNIFICADA: Todo pasa por el sistema de cerebros cinematográficos
import { dispatchCerebros, RequestGeneracion } from '../services/llmService/dispatcher.js';
import { EstiloVisualPrincipal, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
// ❌ ELIMINADO: import { createVideoPlan } from '../services/llmService/index.js'; - Ya no usamos sistema legacy
import { getAdvancedMusic, getSfx } from '../services/audioEngine.js';  // ✨ MEJORADO: Reorganizado
import { createVoiceBuffer } from '../services/voiceService.js';  // ✨ MEJORADO: Renombrado
import { generateUnifiedAudioForPipeline } from '../services/sceneAudioService.js';  // ✨ NUEVO: Integración completa
import { generateKlingClip, KlingClipParams } from '../services/klingService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { uploadToCDN } from '../services/cdnService.js';
import { generateMarketingClip, type MarketingRequest } from '../services/marketingService.js';  // ✨ NUEVO: Marketing AI
import { spawn } from 'child_process';

// ✅ PASO 2: Función para obtener duración de video usando ffprobe
async function obtenerDuracionVideo(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      videoPath
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed with code ${code}`));
        return;
      }
      
      const duration = parseFloat(output.trim());
      resolve(isNaN(duration) ? 0 : duration);
    });

    ffprobe.on('error', (error) => {
      reject(error);
    });
  });
}
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
  // ✅ NUEVO: Parámetros optimizados para Kling
  objetivoEmocional?: string; // ✅ Objetivo emocional de la escena
  accionPrincipal?: string; // ✅ Acción principal resumida
  carryover?: string; // ✅ NUEVO: Continuidad específica por toma
}): string {
  const { 
    prompt, descripcionToma, promptKling, visual, duracion, momento, visualStyle,
    tomaNumero = 1, totalTomas = 1, contextoPrevio, fondoDescripcion, personajeDescripcion,
    objetivoEmocional, accionPrincipal
  } = params;
  
  // 1. Base narrativa específica - ✅ OPTIMIZADO: Priorizar descripción de toma
  const contenidoBase = descripcionToma || promptKling || visual || prompt;
  
  // ✅ NUEVO: Extraer acción principal de la descripción si no se proporciona
  const accionExtraida = accionPrincipal || extraerAccionPrincipal(contenidoBase);
  
  // 2. Contexto de secuencia para continuidad - ✅ OPTIMIZADO
  let contextoSecuencia = '';
  if (totalTomas > 1) {
    if (tomaNumero === 1) {
      contextoSecuencia = 'Opening: ';
    } else if (tomaNumero === totalTomas) {
      contextoSecuencia = 'Climax: ';
    } else {
      contextoSecuencia = `Part ${tomaNumero}: `;
    }
  }
  
  // ✅ NUEVO: Continuidad resumida y específica
  const continuidad = contextoPrevio ? 
    `From: ${resumirEscenaPrevia(contextoPrevio)}. ` : '';
  
  // ✅ NUEVO: Objetivo emocional específico
  const objetivoEmo = objetivoEmocional ? 
    `Goal: ${objetivoEmocional}. ` : 
    generarObjetivoEmocional(momento);
  
  // 4. Descripción del ambiente específico - ✅ OPTIMIZADO: Más conciso
  const ambiente = fondoDescripcion && fondoDescripcion !== 'scenic location' 
    ? `Location: ${fondoDescripcion}. ` 
    : '';
  const personaje = personajeDescripcion && personajeDescripcion !== 'character' 
    ? `Subject: ${personajeDescripcion}. ` 
    : '';
  
  // ✅ NUEVO: Acción principal resumida
  const accion = accionExtraida ? `Action: ${accionExtraida}. ` : '';
  
  // 5. Estilo visual coherente - ✅ OPTIMIZADO: Más específico para Kling
  const contextoEstilo = generarEstiloKling(visualStyle, momento);
  
  // ✅ OPTIMIZADO: Construcción priorizada para Kling (máximo impacto en menos tokens)
  const promptFinal = `${contextoSecuencia}${objetivoEmo}${ambiente}${personaje}${accion}${contextoEstilo}`;
  
  // ✅ DEBUG: Log del prompt optimizado
  console.log(`[Pipeline] 🔍 DEBUG Prompt optimizado:`, {
    tomaNumero,
    length: promptFinal.length,
    contextoParts: {
      contextoSecuencia,
      objetivoEmo: objetivoEmo.substring(0, 30) + '...',
      ambiente,
      personaje,
      accion: accion.substring(0, 40) + '...',
      contextoEstilo: contextoEstilo.substring(0, 50) + '...'
    },
    promptFinal: promptFinal.substring(0, 150) + '...'
  });
  
  return promptFinal;
}

/**
 * ✨ NUEVO: Extrae la acción principal de una descripción larga
 */
function extraerAccionPrincipal(descripcion: string): string {
  if (!descripcion) return '';
  
  // Buscar verbos de acción comunes y extraer la frase principal
  const patronesAccion = [
    /(\w+\s+(?:camina|escala|alcanza|levanta|mira|corre|salta|vuela)[^.]*)/i,
    /([^.]*(?:hacia|por|en|sobre|bajo)[^.]*)/i,
    /(el hombre[^.]*)/i,
    /(la mujer[^.]*)/i
  ];
  
  for (const patron of patronesAccion) {
    const match = descripcion.match(patron);
    if (match && match[1] && match[1].length > 10) {
      return match[1].trim();
    }
  }
  
  // Fallback: tomar las primeras 8 palabras importantes
  const palabras = descripcion.split(' ').filter(p => p.length > 3);
  return palabras.slice(0, 8).join(' ');
}

/**
 * ✨ NUEVO: Resume escena previa para continuidad
 */
function resumirEscenaPrevia(escenaPrevia: string): string {
  if (!escenaPrevia || escenaPrevia.length < 20) return '';
  
  // Extraer elementos clave: ubicación, acción, emoción
  const resumen = escenaPrevia
    .replace(/^previous scene showed?/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limitar a elementos esenciales (máximo 6 palabras)
  const palabrasClave = resumen.split(' ').slice(0, 6).join(' ');
  return palabrasClave;
}

/**
 * ✨ NUEVO: Genera objetivo emocional basado en momento narrativo
 */
function generarObjetivoEmocional(momento?: string): string {
  const objetivosPorMomento = {
    'setup': 'Goal: establish mood and context. ',
    'desarrollo': 'Goal: build tension and character. ',
    'climax': 'Goal: create emotional peak. ',
    'cierre': 'Goal: provide resolution. '
  };
  
  return objetivosPorMomento[momento as keyof typeof objetivosPorMomento] || 'Goal: engage viewer. ';
}

/**
 * ✨ NUEVO: Genera estilo optimizado para Kling
 */
function generarEstiloKling(visualStyle?: EstiloVisualPrincipal, momento?: string): string {
  const estiloBase = visualStyle === 'cinematic' ? 'cinematic film quality' :
                     visualStyle === 'anime' ? 'anime style animation' :
                     visualStyle === 'cartoon' ? 'cartoon animation' :
                     visualStyle === 'commercial' ? 'commercial production' :
                     'cinematic style';
  
  const tecnicaPorMomento = {
    'setup': 'establishing shot, smooth movement',
    'desarrollo': 'dynamic framing, controlled motion',
    'climax': 'dramatic angles, intense focus',
    'cierre': 'wide perspective, gentle movement'
  };
  
  const tecnica = tecnicaPorMomento[momento as keyof typeof tecnicaPorMomento] || 'professional cinematography';
  
  return `${estiloBase}, ${tecnica}, high production value`;
}

/**
 * ✨ NUEVO: Genera objetivo emocional específico para una toma
 */
function generarObjetivoEmocionalToma(tipoToma?: string, emocion?: string): string {
  // Primero intentar usar la emoción específica de la toma
  if (emocion) {
    const objetivosPorEmocion = {
      'intriga': 'create mystery and curiosity',
      'tension': 'build suspense and anticipation', 
      'emocion': 'evoke strong emotional response',
      'triunfo': 'convey victory and achievement',
      'melancolia': 'express nostalgia and reflection',
      'excitement': 'generate energy and excitement',
      'fear': 'create tension and unease',
      'joy': 'convey happiness and celebration'
    };
    
    const objetivo = objetivosPorEmocion[emocion as keyof typeof objetivosPorEmocion];
    if (objetivo) return objetivo;
  }
  
  // Fallback a tipo de toma
  if (tipoToma) {
    const objetivosPorTipo = {
      'setup': 'establish context and mood',
      'desarrollo': 'advance story and character',
      'climax': 'create emotional peak',
      'cierre': 'provide satisfying resolution'
    };
    
    return objetivosPorTipo[tipoToma as keyof typeof objetivosPorTipo] || 'engage viewer';
  }
  
  return 'create compelling visual narrative';
}

/**
 * Pipeline robusto y profesional para CinemaAI
 * @param req RenderRequest completo
 * @param progressCallback Callback para reportar progreso (paso, porcentaje)
 * @param actorCustomPath PNG si el usuario subió imagen personalizada
 * @param quickMode Si es true, usa el flujo rápido de video corto (Kling 2.1 + música)
 */
export async function renderCinemaAI(
  req: RenderRequest, 
  progressCallback?: (step: string, progress: number) => void,
  actorCustomPath?: string, 
  quickMode?: boolean
) {

  // LOGS Y MANEJO DE ERRORES EN TODO EL PIPELINE
  const logger = console; // Puedes cambiar por tu logger profesional
  logger.info('[Pipeline] Iniciando renderCinemaAI', { quickMode, actorCustomPath });

  // Helper para reportar progreso
  const reportProgress = (step: string, progress: number) => {
    if (progressCallback) {
      progressCallback(step, progress);
    }
    logger.info(`[Pipeline] ${step} (${progress}%)`);
  };

  reportProgress('Validando request', 5);

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

  reportProgress('Orquestando cerebros cinematográficos', 10);

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
    
    reportProgress('Validando plan cinematográfico', 20);
    
    // Validación final: el VideoPlan debe tener timeline válida y al menos una escena
    if (!videoPlan || !videoPlan.timeline || !Array.isArray(videoPlan.timeline) || videoPlan.timeline.length === 0) {
      logger.error('[Pipeline] VideoPlan inválido o vacío', { videoPlan });
      throw new Error('El VideoPlan generado por LLMService es inválido o está vacío.');
    }
    
    reportProgress('Validando y corrigiendo assets', 25);
    
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
    
    reportProgress('Preparando escenas', 30);
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
      
      // Si alguno está vacío, usar fallbacks con assets reales existentes
      if (!fondoAsset || !fondoAsset.ruta) {
        logger.warn(`[Pipeline] Usando fondo fallback para escena ${idx}`);
        fondoAsset = { ruta: 'escenas/anime/apartamento/baño/día/frontal.png', tipo: 'escenas', nombre: 'fallback_background' };
      }
      if (!actorAsset || !actorAsset.ruta) {
        logger.warn(`[Pipeline] Usando actor fallback para escena ${idx}`);
        actorAsset = { ruta: 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png', tipo: 'actor', nombre: 'fallback_actor' };
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
    
    reportProgress('Configurando renderizado', 35);
    
  } catch (err) {
    logger.error('[Pipeline] Error seleccionando assets', { error: err });
    throw err;
  }

  // QuickMode
  if (quickMode && scenes.length > 0) {
    logger.info('[Pipeline] QuickMode activo');
    reportProgress('Generando video rápido', 40);
    
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
      reportProgress('Video completado', 100);
      
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
  
  // ✅ VALIDACIÓN PREVIA Y AUTO-CORRECCIÓN: Verificar que todas las tomas tienen assets válidos
  for (let i = 0; i < tomasUnicas.length; i++) {
    const toma = tomasUnicas[i];
    
    // Auto-asignar fondo si no existe
    if (!toma.fondo?.ruta && scenes.length > 0) {
      const fondoFallback = scenes.find(s => s.fondoAsset?.ruta)?.fondoAsset;
      if (fondoFallback) {
        toma.fondo = { ruta: fondoFallback.ruta, nombre: fondoFallback.nombre };
        logger.warn(`[Pipeline] 🔧 Auto-asignando fondo fallback a toma ${i + 1}: ${fondoFallback.ruta}`);
      } else {
        // Último recurso: usar asset por defecto del CDN
        toma.fondo = { 
          ruta: 'escenas/realista/naturaleza/campo/día/frontal.png',
          nombre: 'frontal.png'
        };
        logger.warn(`[Pipeline] 🔧 Usando fondo por defecto para toma ${i + 1}`);
      }
    }
    
    // Auto-asignar actor si no existe
    if (!toma.actor?.ruta && scenes.length > 0) {
      const actorFallback = scenes.find(s => s.actorAsset?.ruta)?.actorAsset;
      if (actorFallback) {
        toma.actor = { ruta: actorFallback.ruta, nombre: actorFallback.nombre };
        logger.warn(`[Pipeline] 🔧 Auto-asignando actor fallback a toma ${i + 1}: ${actorFallback.ruta}`);
      } else {
        // Último recurso: usar actor por defecto del CDN
        toma.actor = { 
          ruta: 'actores/realista/casa/sala/día/jovenmasculinosorprendidocasual.png',
          nombre: 'jovenmasculinosorprendidocasual.png'
        };
        logger.warn(`[Pipeline] 🔧 Usando actor por defecto para toma ${i + 1}`);
      }
    }
    
    // Verificación final
    if (!toma.fondo?.ruta || !toma.actor?.ruta) {
      logger.error(`[Pipeline] ❌ Toma ${i + 1} sigue sin URLs válidas después de auto-corrección:`, {
        numero: toma.numero,
        rutaFondo: toma.fondo?.ruta,
        rutaActor: toma.actor?.ruta,
        estructuraToma: Object.keys(toma)
      });
      throw new Error(`Toma ${i + 1} no tiene assets válidos después de auto-corrección (fondo: ${!!toma.fondo?.ruta}, actor: ${!!toma.actor?.ruta})`);
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
    
    // ✅ PASO 3: Mejorar contexto de toma anterior para continuidad REAL
    const contextoPrevio = tomaIdx > 0 ? 
      tomasUnicas[tomaIdx - 1].carryover || `previous scene: ${tomasUnicas[tomaIdx - 1].descripcion}` : 
      undefined;
    
    // ✅ PASO 3: Usar carryover específico de la toma actual si existe
    const carryoverActual = toma.carryover || '';
    
    // ✅ DEBUG: Log información de carryover
    logger.info(`[Pipeline] 🔗 Carryover info:`, {
      tomaNumero: tomaIdx + 1,
      tieneCarryover: !!carryoverActual,
      contextoPrevio: contextoPrevio?.substring(0, 50) + '...',
      carryoverActual: carryoverActual.substring(0, 50) + '...'
    });
    
    // ✅ CORREGIDO: Construir descripciones más robustas
    const fondoDescripcion = fondoInfo && fondoInfo.lugar && fondoInfo.variante 
      ? `${fondoInfo.lugar}/${fondoInfo.variante}` 
      : fondoInfo?.lugar || 'scenic location';
      
    const personajeDescripcion = actorInfo?.tipo || 'character';
    
    // ✅ NUEVO: Extraer información adicional para prompt optimizado
    const objetivoEmocional = generarObjetivoEmocionalToma(toma.tipoToma, toma.emocion);
    const accionPrincipal = extraerAccionPrincipal(toma.descripcion);
    
    // ✅ DEBUG: Log descripciones finales
    logger.info(`[Pipeline] 🔍 DEBUG Descripciones:`, {
      fondoDescripcion,
      personajeDescripcion,
      contextoPrevio,
      objetivoEmocional,
      accionPrincipal
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
      // ✅ PASO 3: Añadir carryover específico para continuidad
      carryover: carryoverActual,
      fondoDescripcion,
      personajeDescripcion,
      // ✅ NUEVO: Parámetros optimizados
      objetivoEmocional,
      accionPrincipal
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
    
    // Reportar progreso por toma
    const progressBase = 60;
    const progressPerToma = 25 / tomasUnicas.length;
    const currentProgress = progressBase + (tomaIdx * progressPerToma);
    reportProgress(`Generando clip ${tomaIdx + 1}/${tomasUnicas.length}`, Math.round(currentProgress));
    
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
  
  // ✅ VALIDACIÓN DEFINITIVA DE CLIPS GENERADOS
  const validClips = clips.filter(c => c && typeof c === 'string' && c.includes("https://"));
  if (validClips.length === 0) {
    throw new Error("Ningún clip fue generado correctamente.");
  }
  
  logger.info(`[Pipeline] 🎉 ${validClips.length}/${clips.length} clips válidos generados exitosamente`);
  
  // Usar solo clips válidos para el resto del proceso
  const finalClips = validClips;

  // Generación de audio automática con integración completa Freesound/Murf
  let voiceBuffer: Buffer;
  let musicBuffer: Buffer;
  let sfxBuffer: Buffer[];
  let audioMetadata: any;
  let voiceAudioPath: string = ''; // Para el lip-sync
  
  try {
    logger.info('[Pipeline] 🎵 Generando audio unificado con Freesound/Murf...');
    
    reportProgress('Generando audio de voz', 45);
    
    // ✅ PASO 4: Configurar assets manuales en videoPlan
    if (req.voice) {
      logger.info('[Pipeline] 🎤 Configurando voz manual en videoPlan');
      videoPlan.metadata.voiceManual = req.voice;
    }
    
    if (req.music) {
      logger.info('[Pipeline] 🎵 Configurando música manual en videoPlan');
      videoPlan.metadata.musicManual = req.music;
    }
    
    // ✨ NUEVO: Usar el servicio integrado que ahora puede manejar assets manuales
    const audioUnificado = await generateUnifiedAudioForPipeline(videoPlan);
    
    reportProgress('Procesando audio y música', 55);
    
    voiceBuffer = audioUnificado.voiceBuffer;
    musicBuffer = audioUnificado.musicBuffer;
    sfxBuffer = audioUnificado.sfxBuffer ? [audioUnificado.sfxBuffer] : [];
    audioMetadata = {
      ...audioUnificado.metadata,
      vozManual: !!req.voice,
      musicaManual: !!req.music
    };
    
    // Validar buffers generados
    if (!voiceBuffer || !(voiceBuffer instanceof Buffer)) {
      logger.warn('[Pipeline] Buffer de voz inválido, usando fallback');
      voiceBuffer = Buffer.alloc(1);
    }
    
    if (!musicBuffer || !(musicBuffer instanceof Buffer) || musicBuffer.length === 0) {
      logger.warn('[Pipeline] Buffer de música vacío, usando fallback');
      musicBuffer = Buffer.alloc(1);
    }
    
    if (!sfxBuffer || !Array.isArray(sfxBuffer) || sfxBuffer.length === 0) {
      logger.warn('[Pipeline] Buffer de SFX inválido, usando fallback');
      sfxBuffer = [Buffer.alloc(1)];
    }
    
    // Guardar audio de voz para lip-sync si existe
    if (voiceBuffer.length > 1) {
      const fs = await import('fs');
      const path = await import('path');
      voiceAudioPath = path.join(process.cwd(), 'tmp', `voice_${Date.now()}.wav`);
      fs.writeFileSync(voiceAudioPath, voiceBuffer);
      logger.info('[Pipeline] Audio de voz guardado para lip-sync:', voiceAudioPath);
    }
    
    logger.info(`[Pipeline] ✅ Audio generado: ${audioMetadata?.serviciosUsados?.join(', ') || 'servicios básicos'}`);
    logger.info(`[Pipeline] 📊 Calidad: Música ${musicBuffer.length} bytes, Voz ${voiceBuffer.length} bytes, SFX ${sfxBuffer.length} bytes`);
    
  } catch (err) {
    logger.error('[Pipeline] Error generando audio integrado, usando fallbacks básicos', { error: err });
    
    // Fallback a sistema anterior como seguridad
    try {
      voiceBuffer = await createVoiceBuffer(videoPlan);
      if (!voiceBuffer || !(voiceBuffer instanceof Buffer) || voiceBuffer.length === 0) {
        logger.warn('[Pipeline] Buffer de voz vacío, se usará silencio');
        voiceBuffer = Buffer.alloc(1);
      }
      musicBuffer = await getAdvancedMusic({ style: videoPlan.metadata?.visualStyle || 'cinematic' });
      if (!musicBuffer || !(musicBuffer instanceof Buffer) || musicBuffer.length === 0) {
        logger.warn('[Pipeline] Buffer de música vacío, se usará silencio');
        musicBuffer = Buffer.alloc(1);
      }
      sfxBuffer = await getSfx({ style: scenes[0]?.soundCue || 'ambiente', tipo: 'cinematic' });
      if (!sfxBuffer || !Array.isArray(sfxBuffer) || sfxBuffer.length === 0) {
        logger.warn('[Pipeline] Buffer de SFX vacío, se usará silencio');
        sfxBuffer = [Buffer.alloc(1)];
      }
      logger.info('[Pipeline] Buffers de audio generados (fallback)');
    } catch (fallbackErr) {
      logger.error('[Pipeline] Error crítico en fallback de audio', { error: fallbackErr });
      // Buffers mínimos para evitar fallo total
      voiceBuffer = Buffer.alloc(1);
      musicBuffer = Buffer.alloc(1);
      sfxBuffer = [Buffer.alloc(1)];
    }
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
    reportProgress('Ensamblando video final', 85);
    
    finalUrl = await assembleVideo({
      plan: videoPlan,
      clips: finalClips,
      voiceBuffer: voiceBuffer,  // ✨ MEJORADO: Renombrado para consistencia
      music: [musicBuffer],
      sfx: sfxBuffer,
    });
    logger.info('[Pipeline] Video ensamblado correctamente', { finalUrl });
    
    // ✅ PASO 2: Verificar duración del video final
    reportProgress('Verificando duración del video', 87);
    try {
      // Calcular duración esperada desde el plan
      let duracionEsperada = reqNormalizado.duration || 15;
      if (videoPlan.timeline && Array.isArray(videoPlan.timeline)) {
        duracionEsperada = videoPlan.timeline.length;
      }
      
      // Obtener duración real usando ffprobe
      const duracionReal = await obtenerDuracionVideo(finalUrl);
      const diferencia = Math.abs(duracionReal - duracionEsperada);
      
      logger.info('[Pipeline] ✅ Verificación de duración:', {
        duracionEsperada,
        duracionReal,
        diferencia,
        coincide: diferencia <= 0.5
      });
      
      if (diferencia > 0.5) {
        logger.warn('[Pipeline] ⚠️ Duración no coincide con lo esperado');
      }
      
    } catch (error) {
      logger.warn('[Pipeline] ⚠️ No se pudo verificar duración:', error);
    }
    
    reportProgress('Subiendo video al CDN', 90);
    
  } catch (err) {
    logger.error('[Pipeline] Error ensamblando video final', { error: err });
    throw err;
  }

  let cdnUrl: string;
  try {
    cdnUrl = await uploadToCDN(finalUrl, `renders/${Date.now()}_video.mp4`);
    logger.info('[Pipeline] Video subido al CDN', { cdnUrl });
    
    // ✅ LOG FINAL DE ÉXITO TOTAL
    console.log("🎬 Video generado exitosamente:", cdnUrl);
    
    reportProgress('Video completado', 100);
    
  } catch (err) {
    logger.error('[Pipeline] Error subiendo video al CDN', { error: err });
    throw err;
  }

  // ✅ PASO 8: Agregar metadatos extendidos al resultado
  const ahora = new Date();
  const expiraEn = new Date(ahora.getTime() + 48 * 60 * 60 * 1000); // 48 horas
  
  // Recopilar assets usados
  const assetsUsados = [];
  if (scenes && scenes.length > 0) {
    for (const scene of scenes) {
      if (scene.fondoAsset?.ruta) {
        assetsUsados.push({
          tipo: 'fondo',
          ruta: scene.fondoAsset.ruta,
          nombre: scene.fondoAsset.nombre
        });
      }
      if (scene.actorAsset?.ruta) {
        assetsUsados.push({
          tipo: 'actor', 
          ruta: scene.actorAsset.ruta,
          nombre: scene.actorAsset.nombre
        });
      }
    }
  }

  return {
    url: cdnUrl,
    plan: videoPlan,
    scenes,
    clips: finalClips,
    resolution: videoPlan.metadata?.duration,
    visualStyle: videoPlan.metadata?.visualStyle,
    // ✅ PASO 8: Metadatos extendidos
    metadata: {
      duracion: reqNormalizado.duration,
      estilo: reqNormalizado.visualStyle,
      assetsUsados: assetsUsados.slice(0, 10), // Primeros 10 para evitar payloads grandes
      fechaCreacion: ahora.toISOString(),
      expiraEn: expiraEn.toISOString(),
      vozManual: !!req.voice,
      musicaManual: !!req.music,
      carryoverUsado: tomasUnicas?.some(t => t.carryover) || false,
      ...audioMetadata
    }
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

/**
 * ✨ NUEVO: Pipeline específico para Marketing AI
 * Genera clips publicitarios cortos con imágenes, voz y música
 */
export async function renderMarketingAI(
  request: MarketingRequest,
  progressCallback?: (step: string, progress: number) => void
) {
  const logger = console;
  logger.info('[Pipeline] Iniciando renderMarketingAI', {
    imagenes: request.imagenes.length,
    descripcion: request.descripcion,
    estilo: request.estilo
  });

  // Helper para reportar progreso
  const reportProgress = (step: string, progress: number) => {
    if (progressCallback) {
      progressCallback(step, progress);
    }
    logger.info(`[Pipeline Marketing] ${step} (${progress}%)`);
  };

  try {
    reportProgress('Validando imágenes y parámetros', 10);

    // Validar request de marketing
    if (!request.imagenes || request.imagenes.length === 0) {
      throw new Error('Se requiere al menos una imagen para Marketing AI');
    }

    if (!request.descripcion || request.descripcion.trim().length < 10) {
      throw new Error('Descripción del producto/servicio es requerida');
    }

    reportProgress('Generando clip de marketing con IA', 30);

    // Generar clip completo usando el servicio de marketing
    const resultado = await generateMarketingClip(request);

    reportProgress('Procesamiento de audio completado', 70);
    reportProgress('Video final ensamblado', 90);
    reportProgress('Subida a CDN completada', 100);

    logger.info('[Pipeline Marketing] ✅ Marketing AI completado exitosamente', {
      videoUrl: resultado.videoUrl,
      duracion: resultado.metadata.duracion,
      estilo: resultado.metadata.estilo
    });

    // Retornar formato compatible con respuesta estándar
    return {
      url: resultado.videoUrl,
      scenes: [{
        segundo: 0,
        descripcion: request.descripcion,
        tipo: 'marketing',
        videoUrl: resultado.videoUrl,
        duracion: resultado.metadata.duracion
      }],
      clips: [{
        id: `marketing_${Date.now()}`,
        url: resultado.videoUrl,
        duration: resultado.metadata.duracion
      }],
      voice: resultado.metadata.hasVoz,
      music: resultado.metadata.hasMusica,
      sfx: false,
      estilo: resultado.metadata.estilo,
      tipo: 'marketing',
      metadata: {
        ...resultado.metadata,
        planUsed: resultado.planUsed,
        audioUsed: resultado.audioUsed,
        musicUsed: resultado.musicUsed,
        generatedAt: new Date().toISOString(),
        pipeline: 'marketing-ai'
      }
    };

  } catch (error) {
    logger.error('[Pipeline Marketing] ❌ Error en Marketing AI:', error);
    
    // Reportar error en progreso
    if (progressCallback) {
      progressCallback(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 0);
    }
    
    throw error;
  }
}

/**
 * ✨ NUEVO: Detecta automáticamente el tipo de request y usa el pipeline apropiado
 */
export async function renderAutomatic(
  request: any,
  progressCallback?: (step: string, progress: number) => void
): Promise<any> {
  const logger = console;
  
  // Detectar si es request de marketing
  if (request.imagenes && request.descripcion && !request.prompt) {
    logger.info('[Pipeline] 🎯 Detectado request de Marketing AI');
    
    const marketingRequest: MarketingRequest = {
      imagenes: request.imagenes,
      descripcion: request.descripcion,
      estilo: request.estilo || 'commercial',
      duracion: request.duracion || 15,
      textoVoz: request.textoVoz
    };
    
    return await renderMarketingAI(marketingRequest, progressCallback);
  }
  
  // Detectar si es request cinematográfico estándar
  if (request.prompt && request.visualStyle && request.duration) {
    logger.info('[Pipeline] 🎬 Detectado request Cinematográfico');
    
    const cinematicRequest: RenderRequest = {
      prompt: request.prompt,
      visualStyle: request.visualStyle,
      duration: request.duration,
      metadata: request.metadata,
      demoMode: request.demoMode,
      previewMode: request.previewMode
    };
    
    return await renderCinemaAI(cinematicRequest, progressCallback);
  }
  
  // Si no se puede detectar el tipo, usar cinematográfico por defecto
  logger.warn('[Pipeline] ⚠️ Tipo de request no detectado, usando modo cinematográfico');
  
  return await renderCinemaAI(request, progressCallback);
}
