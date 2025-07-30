// estilos/cinematic/fotografia.ts - Cerebro Director de Fotografía Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { getCameraMovement, getEstiloLimitaciones } from '../../restricciones.js';
import { TomaCinematograficaPlan } from './director.js';

export interface ConfiguracionCamara {
  shot: string;
  movement: string;
  angulo: string;
  iluminacion: string;
  transicion: string;
  justificacion?: string;
  plano?: string;
  profundidad_campo?: string;
}

/**
 * Usa IA para configurar fotografía cinematográfica inteligente
 */
export async function configurarFotografiaConIA(
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string
): Promise<ConfiguracionCamara> {
  console.log(`[Fotografía Cinematic] 📸 Configurando fotografía con IA para ${momentoNarrativo}...`);
  
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de Fotografía
    const especializacionFotografia = `
Ahora actúas como el DIRECTOR DE FOTOGRAFÍA del equipo CinemaAI.

Tu responsabilidad es decidir los aspectos técnicos y artísticos de la cámara para cada escena:
- Ángulos de cámara cinematográficos
- Movimientos de cámara apropiados  
- Tipos de plano según el momento narrativo
- Configuración de iluminación
- Transiciones cinematográficas

OPCIONES DISPONIBLES (usa solo estas opciones):

PLANOS (shot): close-up, medium, wide, extreme-wide, detail, over-shoulder
MOVIMIENTOS (movement): static, pan-left, pan-right, zoom-in, zoom-out, tracking, dolly, crane
ÁNGULOS (angulo): frontal, lateral, high, low, dutch, profile, three-quarter
ILUMINACIÓN (iluminacion): natural, dramatic, soft, hard, side-lit, backlit, diffused
TRANSICIONES (transicion): cut, fade, dissolve, wipe, zoom-transition

RESPONDE ÚNICAMENTE con este JSON:
{
  "shot": "uno_de_los_planos_listados",
  "movement": "uno_de_los_movimientos_listados",
  "angulo": "uno_de_los_angulos_listados", 
  "iluminacion": "una_de_las_iluminaciones_listadas",
  "transicion": "una_de_las_transiciones_listadas",
  "justificacion": "por qué esta configuración es perfecta cinematográficamente"
}`;

    const contextoUsuario = `
NARRATIVA: ${narrativa.historia}
TONO: ${narrativa.tono}
GÉNERO: ${narrativa.genero}
MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
PROMPT ORIGINAL: "${prompt}"

Configura la cámara cinematográficamente para esta escena.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionFotografia, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', 
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const config = extractFirstJsonBlock(response as string, { returnParsed: true }) as ConfiguracionCamara;
    
    if (config && typeof config === 'object' && 'shot' in config) {
      console.log('[Fotografía Cinematic] ✅ Configuración fotográfica IA exitosa');
      console.log(`- Plano: ${config.shot}`);
      console.log(`- Ángulo: ${config.angulo}`);
      console.log(`- Movimiento: ${config.movement}`);
      return config;
    }
  } catch (error) {
    console.error('[Fotografía Cinematic] ❌ Error en configuración IA:', error);
  }
  
  // Fallback a lógica tradicional
  console.log('[Fotografía Cinematic] 🔄 Usando configuración fallback...');
  return configurarCamaraCinematica(momentoNarrativo, segundoActual, false, narrativa.tono || 'dramático');
}

export function configurarCamaraCinematica(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  infoToma: TomaCinematograficaPlan | number, // ✅ Usa interfaz correcta o segundo
  esEmocional: boolean,
  tono: string
): ConfiguracionCamara {
  
  // ✅ Adaptar a sistema de tomas
  const esToma = typeof infoToma === 'object';
  const tomaInfo = esToma ? infoToma : { numero: Math.floor((infoToma as number) / 10) + 1, duracion: 10 };
  const segundoActual = esToma ? (infoToma as TomaCinematograficaPlan).numero * 10 : (infoToma as number);
  
  console.log(`[Fotografía Cinematic] Configurando cámara para ${momentoNarrativo} - ${esToma ? `toma ${tomaInfo.numero} (${tomaInfo.duracion}s)` : `segundo ${segundoActual}`}`);
  
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  // ✅ NUEVO: Si es una toma con movimiento específico, usarlo
  let movement: string;
  if (esToma && (infoToma as TomaCinematograficaPlan).movimientoCamara) {
    movement = adaptarMovimientoKling((infoToma as TomaCinematograficaPlan).movimientoCamara);
    console.log(`[Fotografía] Usando movimiento: ${(infoToma as TomaCinematograficaPlan).movimientoCamara} → ${movement}`);
  } else {
    // Movimiento de cámara según estilo y momento tradicional
    movement = seleccionarMovimientoCinematico(momentoNarrativo, segundoActual, esEmocional);
  }
  
  // Selección de plano según momento narrativo y duración de toma
  const duracionToma = esToma ? (infoToma as TomaCinematograficaPlan).duracion : 10;
  const shot = seleccionarPlanoCinematico(momentoNarrativo, esEmocional, duracionToma);
  
  // Ángulo cinematográfico
  const angulo = seleccionarAnguloCinematico(momentoNarrativo, tono);
  
  // Iluminación dramática
  const iluminacion = configurarIluminacionCinematica(momentoNarrativo, tono, esEmocional);
  
  // Transición cinematográfica
  const transicion = seleccionarTransicionCinematica(segundoActual, momentoNarrativo);
  
  return {
    shot,
    movement,
    angulo,
    iluminacion,
    transicion
  };
}

/**
 * Adapta selección de plano considerando duración de toma
 */
function seleccionarPlanoCinematico(momento: string, esEmocional: boolean, duracionToma?: number): string {
  // ✅ Adaptar plano según duración de toma
  const estomaLarga = duracionToma && duracionToma >= 8;
  
  if (esEmocional) {
    // Para momentos emocionales, usar planos más íntimos
    const planosEmocionales = estomaLarga ? ['medium-close-up', 'close-up'] : ['close-up', 'extreme-close-up'];
    return planosEmocionales[Math.floor(Math.random() * planosEmocionales.length)];
  }
  
  const planosPorMomento = {
    setup: estomaLarga ? ['wide', 'extreme-wide', 'establishing'] : ['wide', 'medium'],
    desarrollo: estomaLarga ? ['medium', 'medium-wide'] : ['medium', 'close-up'],
    climax: estomaLarga ? ['close-up', 'medium-close-up'] : ['close-up', 'extreme-close-up'],
    cierre: estomaLarga ? ['wide', 'establishing'] : ['wide', 'medium-wide']
  };
  
  const planosDisponibles = planosPorMomento[momento as keyof typeof planosPorMomento] || ['medium'];
  return planosDisponibles[Math.floor(Math.random() * planosDisponibles.length)];
}

function seleccionarMovimientoCinematico(momento: string, segundo: number, esEmocional: boolean): string {
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  if (esEmocional) {
    // Movimientos más intensos para momentos emocionales
    const movimientosEmocionales = ['dolly-in', 'crane-up', 'tracking', 'orbiting'];
    return movimientosEmocionales[segundo % movimientosEmocionales.length];
  }
  
  const movimientosPorMomento = {
    setup: ['static', 'dolly-in', 'steadicam'],
    desarrollo: ['dolly-in', 'dolly-out', 'tracking', 'steadicam'],
    climax: ['dolly-in', 'crane-up', 'orbiting', 'tracking'],
    cierre: ['dolly-out', 'crane-down', 'steadicam', 'static']
  };
  
  const movimientosDisponibles = movimientosPorMomento[momento as keyof typeof movimientosPorMomento] || limitaciones.movimientosCamara;
  return movimientosDisponibles[segundo % movimientosDisponibles.length];
}

function seleccionarAnguloCinematico(momento: string, tono: string): string {
  const angulosPorTono = {
    dramático: ['low-angle', 'dutch-angle', 'eye-level'],
    épico: ['low-angle', 'wide-angle', 'hero-angle'],
    emocional: ['eye-level', 'slightly-high', 'intimate'],
    misterioso: ['high-angle', 'dutch-angle', 'shadow'],
    acción: ['dynamic', 'low-angle', 'tracking-angle']
  };
  
  const angulos = angulosPorTono[tono as keyof typeof angulosPorTono] || ['eye-level'];
  return angulos[Math.floor(Math.random() * angulos.length)];
}

function configurarIluminacionCinematica(momento: string, tono: string, esEmocional: boolean): string {
  if (esEmocional) {
    return 'dramatic side lighting with strong shadows';
  }
  
  const iluminacionPorMomento = {
    setup: 'soft natural light with subtle shadows',
    desarrollo: 'balanced three-point lighting',
    climax: 'dramatic high-contrast lighting',
    cierre: 'warm golden hour light with rim lighting'
  };
  
  const iluminacionPorTono = {
    dramático: 'hard side lighting with deep shadows',
    épico: 'heroic backlighting with rim light',
    emocional: 'soft window light with fill',
    misterioso: 'low-key lighting with mysterious shadows',
    acción: 'dynamic lighting with movement'
  };
  
  // Combinar momento y tono
  const baseMomento = iluminacionPorMomento[momento as keyof typeof iluminacionPorMomento];
  const baseTono = iluminacionPorTono[tono as keyof typeof iluminacionPorTono];
  
  return baseTono || baseMomento || 'professional cinematic lighting';
}

function seleccionarTransicionCinematica(segundo: number, momento: string): string {
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  // Primera escena siempre fade-in
  if (segundo === 0) return 'fade-in';
  
  // Transiciones especiales para momentos clave
  if (momento === 'climax') {
    return ['match-cut', 'cross-dissolve', 'smash-cut'][segundo % 3];
  }
  
  // Transiciones cinematográficas estándar
  const transicionesEstandar = ['cut', 'dissolve', 'fade'];
  return transicionesEstandar[segundo % transicionesEstandar.length];
}

// ✅ NUEVAS FUNCIONES PARA SISTEMA DE TOMAS

/**
 * Adapta movimientos de cámara a nomenclatura fluida para Kling
 */
function adaptarMovimientoKling(movimientoKling: string): string {
  const mapeoMovimientos: Record<string, string> = {
    // Movimientos básicos mejorados para fluidez
    'camera_zoom_in': 'smooth zoom in',
    'camera_zoom_out': 'smooth zoom out',
    'camera_pan_right': 'slow pan right',
    'camera_pan_left': 'slow pan left',
    'camera_static': 'static shot',
    'camera_tilt_up': 'gentle tilt up',
    'camera_tilt_down': 'gentle tilt down',
    'camera_dolly_in': 'dolly in',
    'camera_dolly_out': 'dolly out',
    // Mapeos directos para nombres sin 'camera_'
    'zoom_in': 'smooth zoom in',
    'zoom_out': 'smooth zoom out', 
    'pan_right': 'slow pan right',
    'pan_left': 'slow pan left',
    'static': 'static shot',
    'tilt_up': 'gentle tilt up',
    'tilt_down': 'gentle tilt down',
    'slow_zoom_in': 'smooth zoom in'
  };
  
  const movimientoAdaptado = mapeoMovimientos[movimientoKling] || 'static shot';
  console.log(`[Fotografía] 🎥 Movimiento adaptado: ${movimientoKling} → ${movimientoAdaptado}`);
  return movimientoAdaptado;
}



export function aplicarEstiloFotograficoCinematico(timeline: any[]): any[] {
  return timeline.map((segundo, index) => ({
    ...segundo,
    filmGrain: 'subtle',
    colorTemperature: 'cinematic',
    bokehQuality: 'professional',
    lensFlare: index % 8 === 0 ? 'subtle' : 'none'
  }));
}
