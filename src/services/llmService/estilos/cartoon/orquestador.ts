// estilos/cartoon/orquestador.ts - Cerebro Orquestador Cartoon

import { generarNarrativaCartoon, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoCartoon } from './arte.js';
import { seleccionarActorCartoon } from './actores.js';
import { configurarCamaraCartoon } from './fotografia.js';
import { configurarSonidoCartoon } from './sonido.js';
import { configurarEdicionCartoon, aplicarEstructuraEdicion, optimizarFlujoCartoon } from './editor.js';
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
  estiloVisual: 'cartoon';
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
  estiloVisual: string = 'cartoon'
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Cartoon] Iniciando producción cartoon');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`);
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN CARTOON');
    
    const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual);
    const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual);
    
    const assets = {
      fondos: fondosRaw,
      actores: actoresRaw
    };
    
    console.log('[ORQUESTADOR] ✅ Assets cargados', {
      fondos: fondosRaw.length,
      actores: actoresRaw.length,
      diversidadFondos: [...new Set(fondosRaw.map(f => f.lugar || f.tipo))]
    });
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cartoon };
    
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan cartoon...');
    const narrativaGeneral = await generarNarrativaCartoon(prompt, duracionTotal);
    
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan cartoon generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum: number, t: any) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasCartoonPorDefecto(duracionTotal, narrativaGeneral);
    
    if (!tomasPlanificadas || tomasPlanificadas.length === 0) {
      throw new Error('No se pudieron generar tomas válidas');
    }
    
    for (let i = 0; i < tomasPlanificadas.length; i++) {
      const toma = tomasPlanificadas[i];
      if (!toma || typeof toma.numero !== 'number' || typeof toma.duracion !== 'number') {
        console.error(`[ORQUESTADOR] ❌ Toma ${i} inválida:`, toma);
        throw new Error(`Toma ${i} no tiene estructura válida`);
      }
    }
    
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas cartoon`);
    
    for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
      const toma = tomasPlanificadas[tomaIdx];
      console.log(`[ORQUESTADOR] 📸 TOMA ${toma.numero}: "${toma.descripcion}" (${toma.duracion}s)`);
      
      const configuracionToma = await coordinarCerebros({
        segundo: segundoActual,
        duracionTotal,
        toma: toma,
        segundoEnToma: 0,
        esEmocional: narrativaGeneral.momentosEmocionales?.includes(segundoActual) || false,
        narrativaGeneral,
        assets
      });
      
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
    }
    
    const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
    const timelineOptimizado = optimizarFlujoCartoon(timelineConEdicion);
    
    const metadata = generarMetadataCartoon(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobalCartoon();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal,
      tomasReales: tomasPlanificadas
    };
    
    console.log('[Orquestador] Producción cartoon completada');
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Cartoon] 💥 ERROR CRÍTICO en producción:', error);
    console.log('[Orquestador Cartoon] 🔄 Aplicando fallback de emergencia...');
    return generarPlanCartoonFallback(prompt, duracionTotal);
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
  
  const momentoNarrativo = toma?.tipoToma || 'desarrollo';
  const tono = toma?.emocion || 'comico';
  
  const fondo = await seleccionarFondoCartoon(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`,
    toma
  );
  
  const actor = await seleccionarActorCartoon(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo,
    false
  );
  
  const camara = configurarCamaraCartoon(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo,
    esEmocional,
    tono
  );
  
  const sonido = configurarSonidoCartoon(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor,
    toma
  );
  
  const edicion = configurarEdicionCartoon(
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

function generarMetadataCartoon(
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
    estiloVisual: 'cartoon',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobalCartoon(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 24, // Cartoon clásico
    resolucion: '1920x1080',
    colorGrading: 'cartoon-bright',
    filtrosGlobales: ['cartoon-filter', 'bright-colors', 'soft-edges'],
    marcaAgua: true
  };
}

function generarPlanCartoonFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan cartoon de emergencia');
  
  // ✅ GENERAR TOMAS EN LUGAR DE TIMELINE SEGUNDO-A-SEGUNDO
  const tomasReales = crearTomasCartoonPorDefecto(duracion, { 
    historia: prompt, 
    tono: 'comico', 
    genero: 'cartoon',
    momentosEmocionales: []
  });
  
  console.log(`[Orquestador] 🎬 Tomas cartoon fallback: ${tomasReales.length} tomas generadas`);
  
  const timeline: SegundoCinematico[] = [];
  let segundoActual = 0;
  
  // Crear timeline basado en las tomas
  for (const toma of tomasReales) {
    for (let segundoEnToma = 0; segundoEnToma < toma.duracion; segundoEnToma++) {
      if (segundoActual >= duracion) break;
      
      timeline.push({
        segundo: segundoActual,
        narrativa: { prompt, tono: 'comico' },
        fondo: { archivo: 'escenas/comic/casa/baño/día/frontal.png', tipo: 'escenario' },
        actor: { archivo: 'actores/comic/casa/baño/día/jovenmasculinoneutrointelectual.png', tipo: 'principal' },
        camara: { shot: 'medium', movement: 'bouncy', angle: 'friendly' },
        sonido: { musica: 'cartoon_theme', efectos: [], lipSync: false },
        edicion: { duracionEscena: toma.duracion, carryover: false, tipoCorte: 'fun_cut' },
        segmento: toma.tipoToma || 'desarrollo',
        momentoNarrativo: toma.tipoToma || 'desarrollo',
        esEmocional: segundoActual % 8 === 0, // Menos frecuente, más cómico
        tono: 'comico'
      });
      
      segundoActual++;
    }
  }

  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'comico' },
      estiloVisual: 'cartoon',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cartoon },
    configuracionGlobal: generarConfiguracionGlobalCartoon(),
    tomasReales: tomasReales // ✅ CRÍTICO: Incluir tomas en fallback
  };
}

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

function crearTomasCartoonPorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 8; // 8 segundos por toma para cartoon (ritmo medio)
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  const promptBase = narrativa.historia || narrativa.prompt || 'Una historia cartoon';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Fun cartoon opening with character introduction: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Happy cartoon conclusion with satisfying ending: ${promptBase}`;
    } else if (i >= numTomas * 0.6) {
      tipoToma = 'climax';
      descripcionBase = `Exciting cartoon climax with comedic peak: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Fun cartoon sequence ${i} with character development: ${promptBase}`;
    }
    
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion,
      movimientoCamara: 'bouncy_pan',
      estiloVisual: 'cartoon',
      emocion: 'divertido',
      fondo: 'cartoon_world.jpg',
      actor: 'cartoon_character.png',
      vozMurf: 'es-ES-ElviraNeural',
      musica: 'cartoon_theme',
      efectosSonoros: 'cartoon_sfx',
      carryover: i > 0 ? 'continuar_diversion' : 'inicio_alegre'
    });
  }
  
  return tomas;
}
