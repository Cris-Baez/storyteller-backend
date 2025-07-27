// dispatcher.ts - Dispatcher Principal de Cerebros Cinematográficos

import { orquestarEquipoCinematico, VideoPlanCinematico, validarPlanCinematico } from './estilos/cinematic/orquestador.js';

export type EstiloVisual = 'cinematic' | 'anime' | 'cartoon' | 'commercial';

export interface RequestGeneracion {
  prompt: string;
  duracion: number;
  estilo: EstiloVisual;
  configuracion?: any;
}

export interface ResponseGeneracion {
  videoPlan: any;
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
  
  console.log('[Dispatcher] Iniciando generación cinematográfica');
  console.log(`Estilo: ${request.estilo}`);
  console.log(`Duración: ${request.duracion}s`);
  console.log(`Prompt: "${request.prompt}"`);
  
  try {
    // Validar request
    if (!validarRequest(request)) {
      throw new Error('Request inválido: faltan parámetros requeridos');
    }
    
    // Despachar al equipo especializado según estilo
    let videoPlan: any;
    
    switch (request.estilo) {
      case 'cinematic':
        console.log('[Dispatcher] Despachando a equipo cinematográfico...');
        videoPlan = await orquestarEquipoCinematico(request.prompt, request.duracion);
        
        // Validar plan cinematográfico
        if (!validarPlanCinematico(videoPlan)) {
          throw new Error('Plan cinematográfico generado es inválido');
        }
        break;
        
      case 'anime':
        console.log('[Dispatcher] Estilo anime no implementado aún');
        videoPlan = await generarPlanFallback(request, 'anime');
        break;
        
      case 'cartoon':
        console.log('[Dispatcher] Estilo cartoon no implementado aún');
        videoPlan = await generarPlanFallback(request, 'cartoon');
        break;
        
      case 'commercial':
        console.log('[Dispatcher] Estilo commercial no implementado aún');
        videoPlan = await generarPlanFallback(request, 'commercial');
        break;
        
      default:
        throw new Error(`Estilo visual no soportado: ${request.estilo}`);
    }
    
    const tiempoGeneracion = Date.now() - inicioGeneracion;
    
    console.log(`[Dispatcher] Generación completada en ${tiempoGeneracion}ms`);
    console.log(`Timeline generado: ${videoPlan.timeline?.length || 0} segundos`);
    
    return {
      videoPlan: videoPlan.timeline,
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
  
  const estilosValidos: EstiloVisual[] = ['cinematic', 'anime', 'cartoon', 'commercial'];
  if (!request.estilo || !estilosValidos.includes(request.estilo)) {
    console.error('[Dispatcher] Estilo visual inválido');
    return false;
  }
  
  return true;
}

async function generarPlanFallback(request: RequestGeneracion, estilo: string): Promise<any> {
  console.log(`[Dispatcher] Generando plan fallback para estilo ${estilo}`);
  
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
  console.log('[Dispatcher] Generando plan de emergencia básico');
  
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
  console.log('[Dispatcher] Análisis de request:');
  console.log(`- Prompt: "${request.prompt}" (${request.prompt.length} caracteres)`);
  console.log(`- Duración: ${request.duracion} segundos`);
  console.log(`- Estilo: ${request.estilo}`);
  console.log(`- Configuración adicional: ${JSON.stringify(request.configuracion || {})}`);
}
