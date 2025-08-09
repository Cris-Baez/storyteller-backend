// validadores.ts - Validadores estrictos para el sistema CinemaAI
// ⚠️ CRÍTICO: Validación de duración implementada para prevenir errores silenciosos

import { AllowedDuration, EstiloVisual, CarryoverLevel } from './types.js';
import { EstiloVisualAPI, normalizarEstilo } from '../types/estilos.js';
import { logger } from './logger.js';

/**
 * ⚠️ VALIDACIÓN CRÍTICA: Valida que la duración sea exactamente una de las permitidas
 * Previene errores silenciosos que pueden romper el pipeline
 */
export function validarDuracionEstricta(duration: number): duration is AllowedDuration {
  const duracionesPermitidas: AllowedDuration[] = [15, 30, 45, 60];
  
  if (!duracionesPermitidas.includes(duration as AllowedDuration)) {
    logger.error(`❌ [Validador] Duración inválida: ${duration}. Permitidas: ${duracionesPermitidas.join(', ')}`);
    return false;
  }
  
  logger.info(`✅ [Validador] Duración válida: ${duration}s`);
  return true;
}

/**
 * Validar y normalizar la duración con fallback automático
 */
export function normalizarDuracion(duration: number): AllowedDuration {
  const duracionesPermitidas: AllowedDuration[] = [15, 30, 45, 60];
  
  // Si es exactamente una duración permitida, devolverla
  if (duracionesPermitidas.includes(duration as AllowedDuration)) {
    return duration as AllowedDuration;
  }
  
  // Buscar la duración permitida más cercana
  const duracionCercana = duracionesPermitidas.reduce((prev, curr) => 
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  );
  
  logger.warn(`⚠️ [Validador] Duración ${duration}s normalizada a ${duracionCercana}s`);
  return duracionCercana;
}

/**
 * Validar estilo visual
 */
export function validarEstiloVisual(style: string): style is EstiloVisual {
  const estilosPermitidos: EstiloVisual[] = ['cinematic', 'anime', 'cartoon', 'commercial', 'narrativa', 'noticias'];
  
  if (!estilosPermitidos.includes(style as EstiloVisual)) {
    logger.error(`❌ [Validador] Estilo visual inválido: ${style}. Permitidos: ${estilosPermitidos.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * 🎨 Normalizar estilo visual - usando sistema unificado
 */
export function normalizarEstiloVisual(style: string): EstiloVisual {
  // Usar el normalizador unificado del sistema de tipos (maneja strings)
  const estiloUnificado = normalizarEstilo(style as any);
  
  // Mapear de EstiloVisualAPI a EstiloVisual manteniendo compatibilidad
  const mapeoRetrocompatible: Partial<Record<EstiloVisualAPI, EstiloVisual>> = {
    'cinematic': 'cinematic',
    'realistic': 'cinematic', // realistic usa los mismos assets que cinematic
    'anime': 'anime',
    'comic': 'cartoon',      // comic se mapea a cartoon para retrocompatibilidad
    'commercial': 'commercial',
    'cartoon': 'cartoon',    // mapeo directo
    'narrativa': 'narrativa',
    'noticias': 'noticias',
    'realista': 'cinematic', // alias español
    'comercial': 'commercial', // alias español
    'documental': 'narrativa', // alias para narrativa
    'presentacion': 'noticias', // alias para noticias
    'actor-directo': 'noticias' // alias para noticias
  };
  
  const estiloMapeado = mapeoRetrocompatible[estiloUnificado] || 'cinematic';
  if (estiloMapeado !== style) {
    logger.warn(`⚠️ [Validador] Estilo ${style} normalizado a '${estiloMapeado}' via sistema unificado`);
  }
  
  return estiloMapeado;
}

/**
 * ✨ NUEVO: Validar nivel de carryover
 */
export function validarCarryoverLevel(level: any): level is CarryoverLevel {
  // Backward compatibility: false/true → none/soft
  if (typeof level === 'boolean') {
    return true; // Será convertido automáticamente
  }
  
  const nivelesPermitidos: CarryoverLevel[] = ['none', 'soft', 'hard'];
  
  if (!nivelesPermitidos.includes(level as CarryoverLevel)) {
    logger.error(`❌ [Validador] Nivel de carryover inválido: ${level}. Permitidos: ${nivelesPermitidos.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * ✨ NUEVO: Normalizar nivel de carryover con backward compatibility
 */
export function normalizarCarryoverLevel(level: any): CarryoverLevel {
  // Backward compatibility: boolean → string
  if (typeof level === 'boolean') {
    const normalizado = level ? 'soft' : 'none';
    logger.info(`🔄 [Validador] Carryover boolean ${level} normalizado a '${normalizado}'`);
    return normalizado;
  }
  
  const nivelesPermitidos: CarryoverLevel[] = ['none', 'soft', 'hard'];
  
  if (nivelesPermitidos.includes(level as CarryoverLevel)) {
    return level as CarryoverLevel;
  }
  
  logger.warn(`⚠️ [Validador] Carryover ${level} normalizado a 'none'`);
  return 'none';
}

/**
 * 📊 NUEVO: Validar estructura de métricas
 */
export function validarEstructuraMetricas(metricas: any): boolean {
  if (!metricas || typeof metricas !== 'object') {
    return true; // Las métricas son opcionales
  }
  
  // Validar campos opcionales con tipos correctos
  const camposValidos = [
    'usaLipSync', 'usaCarryover', 'fondoGenerado', 'actorGenerado', 
    'musicaUsada', 'sfxUsados', 'tiempoGeneracion', 'errorOcurrido'
  ];
  
  for (const campo in metricas) {
    if (!camposValidos.includes(campo)) {
      logger.warn(`⚠️ [Validador] Campo de métricas desconocido: ${campo}`);
    }
  }
  
  return true;
}

/**
 * ⚠️ VALIDADOR CRÍTICO PRINCIPAL: Valida toda la estructura de RenderRequest
 */
export function validarRenderRequest(req: any): {
  valido: boolean;
  errores: string[];
  normalizado?: any;
} {
  const errores: string[] = [];
  const normalizado: any = { ...req };
  
  // Validar duración (CRÍTICO)
  if (req.duration === undefined || req.duration === null) {
    normalizado.duration = 30; // Fallback por defecto
    logger.warn('⚠️ [Validador] Duración no especificada, usando 30s por defecto');
  } else if (!validarDuracionEstricta(req.duration)) {
    normalizado.duration = normalizarDuracion(req.duration);
    errores.push(`Duración ${req.duration} normalizada a ${normalizado.duration}`);
  }
  
  // Validar estilo visual
  if (!req.visualStyle) {
    normalizado.visualStyle = 'cinematic';
    logger.warn('⚠️ [Validador] Estilo visual no especificado, usando cinematic por defecto');
  } else if (!validarEstiloVisual(req.visualStyle)) {
    normalizado.visualStyle = normalizarEstiloVisual(req.visualStyle);
    errores.push(`Estilo ${req.visualStyle} normalizado a ${normalizado.visualStyle}`);
  }
  
  // Validar prompt
  if (!req.prompt || typeof req.prompt !== 'string') {
    errores.push('Prompt requerido como string');
    normalizado.prompt = req.prompt || '';
  }
  
  const valido = errores.length === 0;
  
  if (valido) {
    logger.info('✅ [Validador] RenderRequest válido');
  } else {
    logger.warn(`⚠️ [Validador] RenderRequest con ${errores.length} warning(s): ${errores.join(', ')}`);
  }
  
  return { valido, errores, normalizado };
}

/**
 * 🔧 HELPER: Log de validación detallado para debugging
 */
export function logValidacion(tipo: string, original: any, resultado: any): void {
  logger.info(`🔍 [Validador] ${tipo}:`, {
    original: JSON.stringify(original),
    resultado: JSON.stringify(resultado),
    timestamp: new Date().toISOString()
  });
}
