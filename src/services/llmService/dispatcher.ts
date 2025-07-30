// dispatcher.ts - Dispatcher Principal de Cerebros Cinematográficos

import { orquestarEquipoCinematico, VideoPlanCinematico, validarPlanCinematico } from './estilos/cinematic/orquestador.js';
import { EstiloVisualPrincipal } from '../../types/estilos.js';
import { safeLog } from '../../utils/logger.js';

export interface RequestGeneracion {
  prompt: string;
  duracion: number;
  estilo: EstiloVisualPrincipal; // ✅ Usar tipo unificado
  estiloOriginal?: string; // ✅ NUEVO: Preservar estilo original para assets
  configuracion?: any;
}

export interface ResponseGeneracion {
  videoPlan: any;
  tomasReales?: any[]; // ✅ NUEVO: Tomas cinematográficas reales
  metadata: any;
  configuracion: any;
  restricciones: any;
  success: boolean;
  error?: string;
  tiempoGeneracion: number;
}

/**
 * Dispatcher Principal - Coordina todos los estilos cinematográficos
 * Selecciona el equipo de cerebros especializado según el estilo solicitado
 */
export async function dispatchCerebros(request: RequestGeneracion): Promise<ResponseGeneracion> {
  const inicioGeneracion = Date.now();
  
  safeLog('[Dispatcher] Iniciando generación cinematográfica', {
    estilo: request.estilo,
    duracion: request.duracion,
    promptLength: request.prompt?.length || 0
  });
  
  try {
    // Validar request
    if (!validarRequest(request)) {
      throw new Error('Request inválido: faltan parámetros requeridos');
    }
    
    // Despachar al equipo especializado según estilo
    let videoPlan: any;
    
    switch (request.estilo) {
      case 'cinematic':
        safeLog('[Dispatcher] Despachando a equipo cinematográfico...');
        videoPlan = await orquestarEquipoCinematico(request.prompt, request.duracion, request.estiloOriginal || request.estilo); // ✅ PASAR ESTILO ORIGINAL
        
        // 🔍 DEBUG: Analizar plan antes de validar
        safeLog('[Dispatcher] 🔍 DEBUG - Plan recibido del orquestador:', {
          timelineLength: videoPlan?.timeline?.length || 'UNDEFINED',
          hasMetadata: videoPlan?.metadata ? 'PRESENTE' : 'AUSENTE',
          hasConfigGlobal: videoPlan?.configuracionGlobal ? 'PRESENTE' : 'AUSENTE'
        });
        
        if (videoPlan?.timeline?.length > 0) {
          safeLog('[Dispatcher] 🔍 Timeline details:', {
            primerSegundo: videoPlan.timeline[0]?.segundo,
            momentosNarrativos: [...new Set(videoPlan.timeline.map((s: any) => s.momentoNarrativo))]
          });
        }
        
        // Validar plan cinematográfico
        const esValido = validarPlanCinematico(videoPlan);
        safeLog('[Dispatcher] 🔍 Resultado validación:', { esValido });
        
        if (!esValido) {
          safeLog('[Dispatcher] ❌ Plan cinematográfico inválido - detalles:', {
            hasTimeline: !!videoPlan?.timeline,
            timelineLength: videoPlan?.timeline?.length || 0,
            hasMetadata: !!videoPlan?.metadata,
            videoPlanKeys: videoPlan ? Object.keys(videoPlan) : []
          });
          throw new Error('Plan cinematográfico generado es inválido');
        }
        break;
        
      case 'anime':
        safeLog('[Dispatcher] Despachando a equipo anime...');
        videoPlan = await generarPlanFallback(request, 'anime');
        break;
        
      case 'cartoon':
        safeLog('[Dispatcher] Despachando a equipo cartoon...');
        videoPlan = await generarPlanFallback(request, 'cartoon');
        break;
        
      case 'commercial':
        safeLog('[Dispatcher] Despachando a equipo commercial...');
        videoPlan = await generarPlanFallback(request, 'commercial');
        break;
        
      default:
        throw new Error(`Estilo visual no soportado: ${request.estilo}`);
    }
    
    const tiempoGeneracion = Date.now() - inicioGeneracion;
    
    safeLog('[Dispatcher] Generación completada:', {
      tiempoMs: tiempoGeneracion,
      timelineLength: videoPlan.timeline?.length || 0
    });
    
    return {
      videoPlan: videoPlan.timeline,
      tomasReales: videoPlan.tomasReales, // ✅ NUEVO: Pasar las tomas cinematográficas
      metadata: videoPlan.metadata,
      configuracion: videoPlan.configuracionGlobal,
      restricciones: videoPlan.restricciones,
      success: true,
      tiempoGeneracion
    };
    
  } catch (error) {
    const tiempoGeneracion = Date.now() - inicioGeneracion;
    
    console.error('[Dispatcher] Error en generación:', error);
    
    // Generar plan de emergencia
    const planEmergencia = await generarPlanEmergencia(request);
    
    return {
      videoPlan: planEmergencia.timeline,
      metadata: planEmergencia.metadata,
      configuracion: planEmergencia.configuracionGlobal,
      restricciones: planEmergencia.restricciones,
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      tiempoGeneracion
    };
  }
}

function validarRequest(request: RequestGeneracion): boolean {
  if (!request.prompt || request.prompt.trim().length === 0) {
    console.error('[Dispatcher] Prompt vacío');
    return false;
  }
  
  if (!request.duracion || request.duracion <= 0 || request.duracion > 60) {
    console.error('[Dispatcher] Duración inválida (debe ser 1-60 segundos)');
    return false;
  }
  
  const estilosValidos: EstiloVisualPrincipal[] = ['cinematic', 'anime', 'cartoon', 'commercial'];
  if (!request.estilo || !estilosValidos.includes(request.estilo)) {
    console.error('[Dispatcher] Estilo visual inválido');
    return false;
  }
  
  return true;
}

async function generarPlanFallback(request: RequestGeneracion, estilo: string): Promise<any> {
  safeLog('[Dispatcher] Generando plan fallback:', { estilo });
  
  // Plan básico adaptado al estilo
  const timeline = [];
  
  for (let segundo = 0; segundo < request.duracion; segundo++) {
    const progreso = segundo / request.duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.25) momentoNarrativo = 'setup';
    else if (progreso > 0.75) momentoNarrativo = 'cierre';
    else if (progreso > 0.60) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { 
        prompt: request.prompt, 
        tono: obtenerTonoDefaultPorEstilo(estilo)
      },
      fondo: { 
        archivo: `default_${estilo}.jpg`, 
        tipo: 'escenario' 
      },
      actor: { 
        archivo: `default_actor_${estilo}.jpg`, 
        tipo: 'principal' 
      },
      camara: obtenerConfiguracionCamaraDefault(estilo),
      sonido: obtenerConfiguracionSonidoDefault(estilo),
      edicion: obtenerConfiguracionEdicionDefault(estilo),
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 10 === 0,
      tono: obtenerTonoDefaultPorEstilo(estilo),
      estilo
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: request.duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt: request.prompt },
      estiloVisual: estilo,
      version: '1.0.0'
    },
    configuracionGlobal: obtenerConfiguracionGlobalDefault(estilo),
    restricciones: obtenerRestriccionesDefault(estilo)
  };
}

async function generarPlanEmergencia(request: RequestGeneracion): Promise<any> {
  safeLog('[Dispatcher] Generando plan de emergencia básico');
  
  const timeline = [];
  
  for (let segundo = 0; segundo < request.duracion; segundo++) {
    timeline.push({
      segundo,
      narrativa: { prompt: request.prompt, tono: 'neutral' },
      fondo: { archivo: 'default.jpg', tipo: 'escenario' },
      actor: { archivo: 'default_actor.jpg', tipo: 'principal' },
      camara: { shot: 'medium', movement: 'static', angle: 'frontal' },
      sonido: { musica: 'neutral', efectos: [], lipSync: false },
      edicion: { duracionEscena: 5, carryover: false, tipoCorte: 'cut' },
      segmento: 'desarrollo',
      momentoNarrativo: 'desarrollo',
      esEmocional: false,
      tono: 'neutral',
      estilo: request.estilo
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: request.duracion,
      actos: 1,
      momentosEmocionales: [],
      puntosClimax: [],
      configuracionNarrativa: { prompt: request.prompt },
      estiloVisual: request.estilo,
      version: '1.0.0-emergency'
    },
    configuracionGlobal: {
      aspectRatio: '16:9',
      frameRate: 24,
      resolucion: '1920x1080',
      colorGrading: 'none',
      filtrosGlobales: [],
      marcaAgua: true
    },
    restricciones: {}
  };
}

function obtenerTonoDefaultPorEstilo(estilo: string): string {
  const tonosDefault: Record<string, string> = {
    cinematic: 'dramático',
    anime: 'épico',
    cartoon: 'divertido',
    commercial: 'profesional'
  };
  
  return tonosDefault[estilo] || 'neutral';
}

function obtenerConfiguracionCamaraDefault(estilo: string): any {
  const configuracionesCamara: Record<string, any> = {
    cinematic: { shot: 'medium', movement: 'dolly', angle: 'frontal' },
    anime: { shot: 'close-up', movement: 'pan', angle: 'dinamico' },
    cartoon: { shot: 'wide', movement: 'zoom', angle: 'alto' },
    commercial: { shot: 'medium', movement: 'static', angle: 'frontal' }
  };
  
  return configuracionesCamara[estilo] || { shot: 'medium', movement: 'static', angle: 'frontal' };
}

function obtenerConfiguracionSonidoDefault(estilo: string): any {
  const configuracionesSonido: Record<string, any> = {
    cinematic: { musica: 'orchestral', efectos: ['ambiente'], lipSync: 'strategic' },
    anime: { musica: 'epic-anime', efectos: ['efectos-anime'], lipSync: 'frequent' },
    cartoon: { musica: 'playful', efectos: ['cartoon-sounds'], lipSync: 'exaggerated' },
    commercial: { musica: 'corporate', efectos: ['profesional'], lipSync: 'minimal' }
  };
  
  return configuracionesSonido[estilo] || { musica: 'neutral', efectos: [], lipSync: false };
}

function obtenerConfiguracionEdicionDefault(estilo: string): any {
  const configuracionesEdicion: Record<string, any> = {
    cinematic: { duracionEscena: 6, carryover: true, tipoCorte: 'dissolve' },
    anime: { duracionEscena: 4, carryover: false, tipoCorte: 'cut' },
    cartoon: { duracionEscena: 3, carryover: false, tipoCorte: 'wipe' },
    commercial: { duracionEscena: 5, carryover: true, tipoCorte: 'cut' }
  };
  
  return configuracionesEdicion[estilo] || { duracionEscena: 5, carryover: false, tipoCorte: 'cut' };
}

function obtenerConfiguracionGlobalDefault(estilo: string): any {
  const configuracionesGlobales: Record<string, any> = {
    cinematic: {
      aspectRatio: '16:9',
      frameRate: 24,
      resolucion: '1920x1080',
      colorGrading: 'cinematic-lut',
      filtrosGlobales: ['film-grain', 'vignette'],
      marcaAgua: true
    },
    anime: {
      aspectRatio: '16:9',
      frameRate: 30,
      resolucion: '1920x1080',
      colorGrading: 'anime-vibrant',
      filtrosGlobales: ['saturation-boost', 'sharp'],
      marcaAgua: true
    },
    cartoon: {
      aspectRatio: '16:9',
      frameRate: 30,
      resolucion: '1920x1080',
      colorGrading: 'cartoon-bright',
      filtrosGlobales: ['high-contrast', 'bright'],
      marcaAgua: true
    },
    commercial: {
      aspectRatio: '16:9',
      frameRate: 30,
      resolucion: '1920x1080',
      colorGrading: 'professional',
      filtrosGlobales: ['clean', 'sharp'],
      marcaAgua: true
    }
  };
  
  return configuracionesGlobales[estilo] || configuracionesGlobales.cinematic;
}

function obtenerRestriccionesDefault(estilo: string): any {
  // Restricciones básicas por estilo
  return {
    duracionMaximaEscena: 10,
    duracionMinimaEscena: 2,
    transicionesPermitidas: ['cut', 'dissolve', 'fade'],
    movimientosCamara: ['static', 'pan', 'zoom'],
    estilo
  };
}

// Función de utilidad para debugging
export function analizarRequest(request: RequestGeneracion): void {
  safeLog('[Dispatcher] Análisis de request:', {
    promptLength: request.prompt?.length || 0,
    duracion: request.duracion,
    estilo: request.estilo,
    hasConfig: !!request.configuracion,
    configKeys: request.configuracion ? Object.keys(request.configuracion) : []
  });
}
