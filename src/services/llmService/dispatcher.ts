// dispatcher.ts - Dispatcher Principal de Cerebros Cinematográficos

import { orquestarEquipoCinematico, VideoPlanCinematico, validarPlanCinematico } from './estilos/cinematic/orquestador.js';
import { orquestarEquipoCinematico as orquestarEquipoAnime } from './estilos/anime/orquestador.js';
import { orquestarEquipoCinematico as orquestarEquipoCartoon } from './estilos/cartoon/orquestador.js';
import { orquestarEquipoCinematico as orquestarEquipoCommercial } from './estilos/commercial/orquestador.js';
import { EstiloVisualPrincipal } from '../../types/estilos.js';
import { safeLog } from '../../utils/logger.js';

export interface RequestGeneracion {
  prompt: string;
  duracion: number;
  estilo: EstiloVisualPrincipal; // Usar tipo unificado
  estiloOriginal?: string; // Preservar estilo original para assets
  configuracion?: any;
}

export interface ResponseGeneracion {
  videoPlan: any;
  tomasReales?: any[]; // Tomas cinematográficas reales
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
        videoPlan = await orquestarEquipoCinematico(request.prompt, request.duracion, request.estiloOriginal || request.estilo); // Pasar estilo original
        
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
        videoPlan = await orquestarEquipoAnime(request.prompt, request.duracion, request.estiloOriginal || request.estilo);
        
        // Validar plan anime
        const esValidoAnime = validarPlanCinematico(videoPlan);
        if (!esValidoAnime) {
          throw new Error('Plan anime generado es inválido');
        }
        break;
        
      case 'cartoon':
        safeLog('[Dispatcher] Despachando a equipo cartoon...');
        videoPlan = await orquestarEquipoCartoon(request.prompt, request.duracion, request.estiloOriginal || request.estilo);
        
        // Validar plan cartoon
        const esValidoCartoon = validarPlanCinematico(videoPlan);
        if (!esValidoCartoon) {
          throw new Error('Plan cartoon generado es inválido');
        }
        break;
        
      case 'commercial':
        safeLog('[Dispatcher] Despachando a equipo commercial...');
        videoPlan = await orquestarEquipoCommercial(request.prompt, request.duracion, request.estiloOriginal || request.estilo);
        
        // Validar plan commercial
        const esValidoCommercial = validarPlanCinematico(videoPlan);
        if (!esValidoCommercial) {
          throw new Error('Plan commercial generado es inválido');
        }
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
    
    return {
      videoPlan: [],
      metadata: {
        duracionTotal: request.duracion,
        actos: 1,
        momentosEmocionales: [],
        puntosClimax: [],
        configuracionNarrativa: { prompt: request.prompt },
        estiloVisual: request.estilo,
        version: '1.0.0-error'
      },
      configuracion: {
        aspectRatio: '16:9',
        frameRate: 24,
        resolucion: '1920x1080',
        colorGrading: 'none',
        filtrosGlobales: [],
        marcaAgua: true
      },
      restricciones: {},
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
