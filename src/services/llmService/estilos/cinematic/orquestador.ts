// estilos/cinematic/orquestador.ts - Cerebro Orquestador Cinematográfico

import { generarNarrativaCinematica } from './director.js';
import { seleccionarFondoCinematico } from './arte.js';
import { seleccionarActorCinematico } from './actores.js';
import { configurarCamaraCinematica } from './fotografia.js';
import { configurarSonidoCinematico } from './sonido.js';
import { configurarEdicionCinematica, aplicarEstructuraEdicion, optimizarFlujoCinematico } from './editor.js';
import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { cargarAssetsIndex } from '../../helpers/assetUtils.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];
  metadata: MetadataCinematica;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalCinematica;
}

export interface SegundoCinematico {
  segundo: number;
  narrativa: any;
  fondo: any;
  actor: any;
  camara: any;
  sonido: any;
  edicion: any;
  segmento: string;
  momentoNarrativo: string;
  esEmocional: boolean;
  tono: string;
}

export interface MetadataCinematica {
  duracionTotal: number;
  actos: number;
  momentosEmocionales: number[];
  puntosClimax: number[];
  configuracionNarrativa: any;
  estiloVisual: 'cinematic';
  version: string;
}

export interface ConfiguracionGlobalCinematica {
  aspectRatio: string;
  frameRate: number;
  resolucion: string;
  colorGrading: string;
  filtrosGlobales: string[];
  marcaAgua: boolean;
}

export async function orquestarEquipoCinematico(
  prompt: string,
  duracionTotal: number
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Cinematic] Iniciando producción cinematográfica');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  
  try {
    // 1. Cargar recursos y restricciones
    const assets = await cargarAssetsIndex();
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cinematic };
    
    // 2. Director: Establecer narrativa general
    console.log('[Orquestador] Consultando al Director...');
    const narrativaGeneral = await generarNarrativaCinematica(prompt);
    
    // 3. Segmentar timeline por estructura narrativa
    const segmentos = segmentarPorEstilo(duracionTotal, 'cinematic');
    
    // 4. Generar timeline segundo a segundo
    const timeline: SegundoCinematico[] = [];
    
    for (let segundo = 0; segundo < duracionTotal; segundo++) {
      console.log(`[Orquestador] Procesando segundo ${segundo + 1}/${duracionTotal}`);
      
      // Determinar contexto narrativo
      const segmentoActual = segmentos.find(s => 
        segundo >= s.inicio && segundo < s.inicio + s.duracion
      );
      
      const momentoNarrativo = segmentoActual?.tipo || 'desarrollo';
      const progresoNarrativo = segundo / duracionTotal;
      
      // Evaluar si es momento emocional
      const esEmocional = evaluarMomentoEmocional(
        segundo, 
        narrativaGeneral, 
        momentoNarrativo,
        progresoNarrativo
      );
      
      // Extraer tono del momento
      const tono = extraerTono(narrativaGeneral, momentoNarrativo, esEmocional);
      
      // Coordinar todos los cerebros especializados
      const segundoCinematico = await coordinarCerebros({
        segundo,
        duracionTotal,
        momentoNarrativo,
        esEmocional,
        tono,
        narrativaGeneral,
        assets,
        segmentoActual
      });
      
      timeline.push(segundoCinematico);
    }
    
    // 5. Aplicar estructura de edición
    console.log('[Orquestador] Aplicando estructura de edición...');
    const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
    
    // 6. Optimizar flujo cinematográfico
    console.log('[Orquestador] Optimizando flujo cinematográfico...');
    const timelineOptimizado = optimizarFlujoCinematico(timelineConEdicion);
    
    // 7. Generar metadata y configuración global
    const metadata = generarMetadataCinematica(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobal();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal
    };
    
    console.log('[Orquestador] Producción cinematográfica completada');
    console.log(`Timeline generado: ${videoPlan.timeline.length} segundos`);
    console.log(`Actos: ${metadata.actos}, Momentos emocionales: ${metadata.momentosEmocionales.length}`);
    
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Cinematic] Error en producción:', error);
    
    // Fallback: Plan cinematográfico básico
    return generarPlanCinematicoFallback(prompt, duracionTotal);
  }
}

async function coordinarCerebros(contexto: {
  segundo: number;
  duracionTotal: number;
  momentoNarrativo: string;
  esEmocional: boolean;
  tono: string;
  narrativaGeneral: any;
  assets: any;
  segmentoActual: any;
}): Promise<SegundoCinematico> {
  
  const { segundo, duracionTotal, momentoNarrativo, esEmocional, tono, narrativaGeneral, assets } = contexto;
  
  // Arte: Seleccionar fondo
  const fondo = await seleccionarFondoCinematico(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo
  );
  
  // Actores: Seleccionar y configurar actor
  const actor = seleccionarActorCinematico(
    assets.actores || [],
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    narrativaGeneral
  );
  
  // Fotografía: Configurar cámara
  const camara = configurarCamaraCinematica(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono
  );
  
  // Sonido: Configurar audio
  const sonido = configurarSonidoCinematico(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor
  );
  
  // Editor: Configurar edición
  const edicion = configurarEdicionCinematica(
    segundo,
    duracionTotal,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    tono
  );
  
  return {
    segundo,
    narrativa: narrativaGeneral,
    fondo,
    actor,
    camara,
    sonido,
    edicion,
    segmento: contexto.segmentoActual?.tipo || 'desarrollo',
    momentoNarrativo,
    esEmocional,
    tono
  };
}

function evaluarMomentoEmocional(
  segundo: number,
  narrativa: any,
  momento: string,
  progreso: number
): boolean {
  // Momentos emocionales estratégicos
  const momentosEmocionales = [
    Math.floor(progreso * 100) % 25 === 0,  // Cada 25% del video
    momento === 'climax',                    // Todo el climax es emocional
    narrativa?.momentosEmocionales?.includes(segundo) // Definidos por director
  ];
  
  return momentosEmocionales.some(Boolean);
}

function extraerTono(narrativa: any, momento: string, esEmocional: boolean): string {
  // Extraer tono del contexto narrativo
  if (narrativa?.tono) return narrativa.tono;
  
  // Tonos por defecto según momento y emoción
  if (esEmocional) {
    const tonosEmocionales = ['dramático', 'emocional', 'épico'];
    return tonosEmocionales[Math.floor(Math.random() * tonosEmocionales.length)];
  }
  
  const tonosPorMomento: Record<string, string> = {
    setup: 'misterioso',
    desarrollo: 'dramático',
    climax: 'épico',
    cierre: 'emocional'
  };
  
  return tonosPorMomento[momento] || 'dramático';
}

function generarMetadataCinematica(
  narrativa: any,
  duracion: number,
  timeline: SegundoCinematico[]
): MetadataCinematica {
  
  const momentosEmocionales = timeline
    .filter(s => s.esEmocional)
    .map(s => s.segundo);
  
  const puntosClimax = timeline
    .filter(s => s.momentoNarrativo === 'climax')
    .map(s => s.segundo);
  
  return {
    duracionTotal: duracion,
    actos: 3, // Estructura clásica de 3 actos
    momentosEmocionales,
    puntosClimax,
    configuracionNarrativa: narrativa,
    estiloVisual: 'cinematic',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobal(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 24, // Cinematográfico
    resolucion: '1920x1080',
    colorGrading: 'cinematic-lut',
    filtrosGlobales: ['film-grain', 'vignette', 'color-grading'],
    marcaAgua: true
  };
}

function generarPlanCinematicoFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan cinematográfico de emergencia');
  
  const timeline: SegundoCinematico[] = [];
  
  for (let segundo = 0; segundo < duracion; segundo++) {
    const progreso = segundo / duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.25) momentoNarrativo = 'setup';
    else if (progreso > 0.75) momentoNarrativo = 'cierre';
    else if (progreso > 0.60) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { prompt, tono: 'dramático' },
      fondo: { archivo: 'default_cinematic.jpg', tipo: 'escenario' },
      actor: { archivo: 'default_actor.jpg', tipo: 'principal' },
      camara: { shot: 'medium', movement: 'static', angle: 'frontal' },
      sonido: { musica: 'orchestral', efectos: [], lipSync: false },
      edicion: { duracionEscena: 6, carryover: false, tipoCorte: 'cut' },
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 10 === 0,
      tono: 'dramático'
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'dramático' },
      estiloVisual: 'cinematic',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cinematic },
    configuracionGlobal: generarConfiguracionGlobal()
  };
}

// Función de utilidad para validar el plan generado
export function validarPlanCinematico(plan: VideoPlanCinematico): boolean {
  try {
    // Validaciones básicas
    if (!plan.timeline || plan.timeline.length === 0) return false;
    if (!plan.metadata || !plan.configuracionGlobal) return false;
    
    // Validar continuidad de timeline
    for (let i = 0; i < plan.timeline.length; i++) {
      const segundo = plan.timeline[i];
      if (segundo.segundo !== i) return false;
      if (!segundo.fondo || !segundo.actor || !segundo.camara) return false;
    }
    
    // Validar estructura narrativa
    const tieneSetup = plan.timeline.some(s => s.momentoNarrativo === 'setup');
    const tieneClimax = plan.timeline.some(s => s.momentoNarrativo === 'climax');
    const tieneCierre = plan.timeline.some(s => s.momentoNarrativo === 'cierre');
    
    return tieneSetup && tieneClimax && tieneCierre;
    
  } catch (error) {
    console.error('[Orquestador] Error validando plan:', error);
    return false;
  }
}
