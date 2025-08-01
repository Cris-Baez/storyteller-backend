// estilos/anime/orquestador.ts - Cerebro Orquestador Anime

import { generarNarrativaAnime, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoAnime } from './arte.js';
import { seleccionarActorAnime } from './actores.js';
import { configurarCamaraAnime } from './fotografia.js';
import { configurarSonidoAnime } from './sonido.js';
import { configurarEdicionAnime, aplicarEstructuraEdicion, optimizarFlujoAnime } from './editor.js';
import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];
  metadata: MetadataCinematica;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalCinematica;
  tomasReales?: TomaCinematograficaPlan[];
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
  estiloVisual: 'anime';
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
  duracionTotal: number,
  estiloVisual: string = 'anime'
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Anime] Iniciando producción anime');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`);
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN ANIME');
    
    // 1. Cargar recursos usando AssetManager unificado con el estilo correcto
    console.log(`[ORQUESTADOR] 🔄 Cargando assets para estilo: ${estiloVisual}...`);
    const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual);
    const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual);
    
    // Crear assets en formato esperado por el sistema existente
    const assets = {
      fondos: fondosRaw,
      actores: actoresRaw
    };
    
    console.log('[ORQUESTADOR] ✅ Assets cargados', {
      fondos: fondosRaw.length,
      actores: actoresRaw.length,
      diversidadFondos: [...new Set(fondosRaw.map(f => f.lugar || f.tipo))]
    });
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.anime };
    
    // 2. Director: Establecer narrativa Y PLAN DE TOMAS ANIME
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan anime...');
    const narrativaGeneral = await generarNarrativaAnime(prompt);
    
    // ✅ VALIDACIÓN DEFENSIVA: Verificar que la narrativa tenga estructura válida
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan anime generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum, t) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    // 3. Procesar cada TOMA ANIME (clips de 5s, emociones exageradas)
    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasAnimePorDefecto(duracionTotal, narrativaGeneral);
    
    // ✅ VALIDACIÓN ADICIONAL: Verificar que todas las tomas sean válidas
    if (!tomasPlanificadas || tomasPlanificadas.length === 0) {
      throw new Error('No se pudieron generar tomas válidas');
    }
    
    // ✅ VALIDACIÓN: Verificar que cada toma tenga propiedades requeridas
    for (let i = 0; i < tomasPlanificadas.length; i++) {
      const toma = tomasPlanificadas[i];
      if (!toma || typeof toma.numero !== 'number' || typeof toma.duracion !== 'number') {
        console.error(`[ORQUESTADOR] ❌ Toma ${i} inválida:`, toma);
        throw new Error(`Toma ${i} no tiene estructura válida`);
      }
    }
    
    console.log(`[ORQUESTADOR] 🎯 DECISIÓN: ${narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 ? 'USANDO TOMAS DEL DIRECTOR' : 'USANDO TOMAS POR DEFECTO'}`);
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas anime`);
    console.log('[ORQUESTADOR] 🎬 INICIANDO BUCLE DE TOMAS ANIME...');
    
    for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
      const toma = tomasPlanificadas[tomaIdx];
      console.log(`[ORQUESTADOR] 📸 TOMA ${toma.numero}: "${toma.descripcion}" (${toma.duracion}s)`);
      
      // ✅ PROCESAR TOMA UNA SOLA VEZ (no segundo-a-segundo)
      console.log(`[ORQUESTADOR] 🧠 Coordinando cerebros para toma ${toma.numero}...`);
      const configuracionToma = await coordinarCerebros({
        segundo: segundoActual,
        duracionTotal,
        toma: toma,
        segundoEnToma: 0,
        esEmocional: narrativaGeneral.momentosEmocionales?.includes(segundoActual) || false,
        narrativaGeneral,
        assets
      });
      
      console.log(`[ORQUESTADOR] ✅ Toma ${toma.numero} configurada - aplicando a ${toma.duracion} segundos`);
      
      // ✅ APLICAR LA CONFIGURACIÓN A TODOS LOS SEGUNDOS DE LA TOMA
      for (let segundoEnToma = 0; segundoEnToma < toma.duracion; segundoEnToma++) {
        if (segundoActual >= duracionTotal) break;
        
        const segundoCinematico = {
          ...configuracionToma,
          segundo: segundoActual,
          segmento: toma.tipoToma || 'desarrollo',
          momentoNarrativo: toma.tipoToma || 'desarrollo'
        };
        
        timeline.push(segundoCinematico);
        segundoActual++;
      }
      
      console.log(`[ORQUESTADOR] ✅ Toma ${toma.numero} aplicada a ${toma.duracion} segundos`);
    }
    
    // 5. Aplicar estructura de edición anime
    console.log('[Orquestador] Aplicando estructura de edición anime...');
    const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
    
    // 6. Optimizar flujo anime
    console.log('[Orquestador] Optimizando flujo anime...');
    const timelineOptimizado = optimizarFlujoAnime(timelineConEdicion);
    
    // 7. Generar metadata y configuración global
    const metadata = generarMetadataAnime(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobalAnime();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal,
      tomasReales: tomasPlanificadas
    };
    
    console.log('[Orquestador] Producción anime completada');
    console.log(`Timeline generado: ${videoPlan.timeline.length} segundos`);
    console.log(`Actos: ${metadata.actos}, Momentos emocionales: ${metadata.momentosEmocionales.length}`);
    
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Anime] 💥 ERROR CRÍTICO en producción:', error);
    console.log('[Orquestador Anime] 🔄 Aplicando fallback de emergencia...');
    return generarPlanAnimeFallback(prompt, duracionTotal);
  }
}

async function coordinarCerebros(contexto: {
  segundo: number;
  duracionTotal: number;
  toma?: TomaCinematograficaPlan;
  segundoEnToma?: number;
  esEmocional: boolean;
  narrativaGeneral: any;
  assets: any;
}): Promise<SegundoCinematico> {
  
  const { segundo, duracionTotal, toma, segundoEnToma, esEmocional, narrativaGeneral, assets } = contexto;
  
  // Determinar contexto usando la toma si está disponible
  const momentoNarrativo = toma?.tipoToma || 'desarrollo';
  const tono = toma?.emocion || 'energico';
  
  // Arte: Seleccionar fondo anime
  const fondo = await seleccionarFondoAnime(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`,
    toma
  );
  
  // Actores: Seleccionar actor anime
  const actor = await seleccionarActorAnime(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo,
    false
  );
  
  // Fotografía: Configurar cámara anime (movimientos rápidos)
  const camara = configurarCamaraAnime(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo,
    esEmocional,
    tono
  );
  
  // Sonido: Configurar audio anime
  const sonido = configurarSonidoAnime(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor,
    toma
  );
  
  // Editor: Configurar edición anime
  const edicion = configurarEdicionAnime(
    segundo,
    duracionTotal,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    tono,
    toma
  );
  
  return {
    segundo,
    narrativa: narrativaGeneral,
    fondo,
    actor,
    camara,
    sonido,
    edicion,
    segmento: toma?.tipoToma || 'desarrollo',
    momentoNarrativo,
    esEmocional,
    tono
  };
}

function generarMetadataAnime(
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
    actos: 3,
    momentosEmocionales,
    puntosClimax,
    configuracionNarrativa: narrativa,
    estiloVisual: 'anime',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobalAnime(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 30, // Anime típicamente a 30fps
    resolucion: '1920x1080',
    colorGrading: 'anime-vibrant',
    filtrosGlobales: ['saturation-boost', 'anime-filter', 'sharp-edges'],
    marcaAgua: true
  };
}

function generarPlanAnimeFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan anime de emergencia');
  
  const timeline: SegundoCinematico[] = [];
  
  for (let segundo = 0; segundo < duracion; segundo++) {
    const progreso = segundo / duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.25) momentoNarrativo = 'setup';
    else if (progreso > 0.75) momentoNarrativo = 'cierre';
    else if (progreso > 0.60) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { prompt, tono: 'energico' },
      fondo: { archivo: 'escenas/anime/apartamento/baño/día/frontal.png', tipo: 'escenario' },
      actor: { archivo: 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png', tipo: 'principal' },
      camara: { shot: 'close_up', movement: 'quick_zoom', angle: 'dynamic' },
      sonido: { musica: 'jpop', efectos: [], lipSync: false },
      edicion: { duracionEscena: 3, carryover: false, tipoCorte: 'quick_cut' },
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 5 === 0, // Más frecuente en anime
      tono: 'energico'
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'energico' },
      estiloVisual: 'anime',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.anime },
    configuracionGlobal: generarConfiguracionGlobalAnime()
  };
}

// Función de utilidad para validar el plan generado
export function validarPlanCinematico(plan: VideoPlanCinematico): boolean {
  try {
    if (!plan.timeline || plan.timeline.length === 0) return false;
    if (!plan.metadata || !plan.configuracionGlobal) return false;
    
    for (let i = 0; i < plan.timeline.length; i++) {
      const segundo = plan.timeline[i];
      if (segundo.segundo !== i) return false;
      if (!segundo.fondo || !segundo.actor || !segundo.camara) return false;
    }
    
    const tieneSetup = plan.timeline.some(s => s.momentoNarrativo === 'setup');
    const tieneClimax = plan.timeline.some(s => s.momentoNarrativo === 'climax');
    const tieneCierre = plan.timeline.some(s => s.momentoNarrativo === 'cierre');
    const tieneDesarrollo = plan.timeline.some(s => s.momentoNarrativo === 'desarrollo');
    
    return tieneSetup && (tieneClimax || tieneDesarrollo || tieneCierre);
    
  } catch (error) {
    console.error('[Orquestador] Error validando plan:', error);
    return false;
  }
}

/**
 * Crear tomas anime por defecto - clips de 5s, emociones exageradas
 */
function crearTomasAnimePorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 5; // 5 segundos por toma para anime (más rápido)
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  const promptBase = narrativa.historia || narrativa.prompt || 'Una historia anime';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Dramatic anime opening with exaggerated emotions: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Emotional anime conclusion with powerful final scene: ${promptBase}`;
    } else if (i >= numTomas * 0.6) {
      tipoToma = 'climax';
      descripcionBase = `Intense anime climax with dynamic action: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Fast-paced anime sequence ${i} with emotional intensity: ${promptBase}`;
    }
    
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion,
      movimientoCamara: 'quick_zoom',
      estiloVisual: 'anime',
      emocion: 'energico',
      fondo: 'japon.jpg',
      actor: 'actor_joven.png',
      vozMurf: 'es-ES-AlvaroNeural',
      musica: 'jpop',
      efectosSonoros: 'anime_effects',
      carryover: i > 0 ? 'continuar_energia' : 'inicio_dramatico'
    });
  }
  
  console.log('[Orquestador] 🎬 DEBUG - Tomas anime por defecto creadas:', {
    numTomas: tomas.length,
    tomasPreview: tomas.map(t => ({
      numero: t.numero,
      tipoToma: t.tipoToma,
      descripcion: t.descripcion.substring(0, 80) + '...',
      duracion: t.duracion
    }))
  });
  
  return tomas;
}
