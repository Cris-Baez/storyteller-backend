// estilos/cinematic/editor.ts - Cerebro Editor Cinematográfico

import { segmentarPorEstilo } from '../../helpers/segmentador.js';
import { validarDuracionClip } from '../../restricciones.js';

export interface ConfiguracionEdicion {
  duracionEscena: number;
  carryover: boolean;
  audioCarryover: boolean;
  tipoCorte: string;
  ritmo: 'lento' | 'medio' | 'rápido';
  continuidad: boolean;
}

export function configurarEdicionCinematica(
  segundoActual: number,
  duracionTotal: number,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  esEmocional: boolean,
  tono: string
): ConfiguracionEdicion {
  console.log(`[Editor Cinematic] Configurando edición para segundo ${segundoActual}/${duracionTotal}`);
  
  // Calcular duración óptima de escena
  const duracionEscena = calcularDuracionEscena(momentoNarrativo, esEmocional, duracionTotal);
  
  // Determinar si necesita carryover visual
  const carryover = determinarCarryover(segundoActual, momentoNarrativo, esEmocional);
  
  // Carryover de audio (música/ambiente)
  const audioCarryover = determinarAudioCarryover(segundoActual, momentoNarrativo);
  
  // Tipo de corte cinematográfico
  const tipoCorte = seleccionarTipoCorte(momentoNarrativo, esEmocional, segundoActual);
  
  // Ritmo de edición
  const ritmo = determinarRitmoEdicion(momentoNarrativo, tono, esEmocional);
  
  // Continuidad visual
  const continuidad = evaluarContinuidad(segundoActual, carryover);
  
  return {
    duracionEscena,
    carryover,
    audioCarryover,
    tipoCorte,
    ritmo,
    continuidad
  };
}

function calcularDuracionEscena(momento: string, esEmocional: boolean, duracionTotal: number): number {
  // Duraciones base por momento narrativo
  const duracionesMomento = {
    setup: 8,      // Establecimiento más lento
    desarrollo: 6,  // Ritmo medio
    climax: 4,     // Cortes más rápidos
    cierre: 10     // Resolución pausada
  };
  
  let duracionBase = duracionesMomento[momento as keyof typeof duracionesMomento] || 6;
  
  // Ajustar por momento emocional
  if (esEmocional) {
    if (momento === 'climax') {
      duracionBase = 3; // Cortes muy rápidos en climax emocional
    } else {
      duracionBase += 2; // Más tiempo para momentos emocionales
    }
  }
  
  // Asegurar que no exceda límites
  const duracionMaxima = Math.min(10, Math.floor(duracionTotal / 3));
  return Math.min(duracionBase, duracionMaxima);
}

function determinarCarryover(segundo: number, momento: string, esEmocional: boolean): boolean {
  // No carryover en el primer segundo
  if (segundo === 0) return false;
  
  // Carryover estratégico para continuidad cinematográfica
  const momentosCarryover = {
    setup: segundo % 8 === 0,        // Cada 8 segundos en setup
    desarrollo: segundo % 6 === 0,    // Cada 6 segundos en desarrollo  
    climax: segundo % 3 === 0,       // Cada 3 segundos en climax
    cierre: segundo % 10 === 0       // Cada 10 segundos en cierre
  };
  
  let necesitaCarryover = momentosCarryover[momento as keyof typeof momentosCarryover] || false;
  
  // Forzar carryover en momentos emocionales para intensidad
  if (esEmocional && momento === 'climax') {
    necesitaCarryover = true;
  }
  
  return necesitaCarryover;
}

function determinarAudioCarryover(segundo: number, momento: string): boolean {
  // Audio carryover más frecuente para fluidez
  if (segundo === 0) return false;
  
  // Mantener audio en la mayoría de transiciones
  const sinAudioCarryover = {
    setup: segundo % 12 === 0,       // Cambio cada 12 segundos
    desarrollo: segundo % 10 === 0,   // Cambio cada 10 segundos
    climax: segundo % 6 === 0,       // Cambio cada 6 segundos  
    cierre: segundo % 15 === 0       // Cambio cada 15 segundos
  };
  
  // Invertir lógica: true significa mantener audio
  return !sinAudioCarryover[momento as keyof typeof sinAudioCarryover];
}

function seleccionarTipoCorte(momento: string, esEmocional: boolean, segundo: number): string {
  if (segundo === 0) return 'fade-in';
  
  if (esEmocional) {
    const cortesEmocionales = ['match-cut', 'cross-dissolve', 'iris-in'];
    return cortesEmocionales[segundo % cortesEmocionales.length];
  }
  
  const cortesPorMomento = {
    setup: ['cut', 'dissolve', 'fade'],
    desarrollo: ['cut', 'dissolve', 'wipe'],
    climax: ['cut', 'smash-cut', 'match-cut'],
    cierre: ['dissolve', 'fade-out', 'iris-out']
  };
  
  const cortesDisponibles = cortesPorMomento[momento as keyof typeof cortesPorMomento] || ['cut'];
  return cortesDisponibles[segundo % cortesDisponibles.length];
}

function determinarRitmoEdicion(momento: string, tono: string, esEmocional: boolean): 'lento' | 'medio' | 'rápido' {
  if (esEmocional && momento === 'climax') return 'rápido';
  
  const ritmosPorMomento: Record<string, 'lento' | 'medio' | 'rápido'> = {
    setup: 'medio',
    desarrollo: 'medio',
    climax: 'rápido',
    cierre: 'lento'
  };
  
  const ritmosPorTono: Record<string, 'lento' | 'medio' | 'rápido'> = {
    dramático: 'medio',
    épico: 'rápido',
    emocional: 'lento',
    misterioso: 'lento',
    acción: 'rápido'
  };
  
  // Priorizar tono sobre momento
  return ritmosPorTono[tono] || ritmosPorMomento[momento] || 'medio';
}

function evaluarContinuidad(segundo: number, carryover: boolean): boolean {
  // La continuidad depende del carryover y la posición
  return carryover || segundo % 4 === 0;
}

export function aplicarEstructuraEdicion(timeline: any[], duracionTotal: number): any[] {
  // Aplicar estructura de edición cinematográfica
  const segmentos = segmentarPorEstilo(duracionTotal, 'cinematic');
  
  return timeline.map((segundo, index) => {
    const segmentoActual = segmentos.find(s => 
      index >= s.inicio && index < s.inicio + s.duracion
    );
    
    return {
      ...segundo,
      segmento: segmentoActual?.tipo || 'desarrollo',
      esInicioSegmento: segmentoActual?.inicio === index,
      esFinalSegmento: segmentoActual ? 
        index === segmentoActual.inicio + segmentoActual.duracion - 1 : false
    };
  });
}

export function optimizarFlujoCinematico(timeline: any[]): any[] {
  // Aplicar optimizaciones específicas de edición cinematográfica
  return timeline.map((segundo, index) => {
    const anterior = timeline[index - 1];
    const siguiente = timeline[index + 1];
    
    return {
      ...segundo,
      // Optimizar transiciones
      transicionOptimizada: optimizarTransicion(segundo, anterior, siguiente),
      // Continuidad mejorada
      continuidadMejorada: index > 0 && segundo.carryover,
      // Flujo narrativo
      flujoNarrativo: evaluarFlujoNarrativo(segundo, index, timeline.length)
    };
  });
}

function optimizarTransicion(actual: any, anterior: any, siguiente: any): string {
  if (!anterior) return 'fade-in';
  if (!siguiente) return 'fade-out';
  
  // Lógica de optimización de transiciones
  if (actual.acto !== anterior.acto) return 'dissolve';
  if (actual.esEmocional && !anterior.esEmocional) return 'cross-dissolve';
  if (actual.carryover) return 'match-cut';
  
  return actual.transition || 'cut';
}

function evaluarFlujoNarrativo(segundo: any, index: number, total: number): 'ascendente' | 'descendente' | 'estable' {
  const progreso = index / total;
  
  if (progreso < 0.25) return 'ascendente';      // Setup
  if (progreso < 0.75) return 'ascendente';      // Desarrollo
  if (progreso < 0.90) return 'ascendente';      // Climax
  return 'descendente';                          // Cierre
}
