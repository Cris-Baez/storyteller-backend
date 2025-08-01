// estilos/commercial/orquestador.ts - Cerebro Orquestador Commercial

import { generarNarrativaCommercial, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoCommercial } from './arte.js';
import { seleccionarActorCommercial } from './actores.js';
import { configurarCamaraCommercial } from './fotografia.js';
import { configurarSonidoCommercial } from './sonido.js';
import { configurarEdicionCommercial, aplicarEstructuraEdicion, optimizarFlujoCommercial } from './editor.js';
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
  estiloVisual: 'commercial';
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
  estiloVisual: string = 'commercial'
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Commercial] Iniciando producción comercial');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`);
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN COMERCIAL');
    
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
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.commercial };
    
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan comercial...');
    const narrativaGeneral = await generarNarrativaCommercial(prompt);
    
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan comercial generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum: number, t: any) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasCommercialPorDefecto(duracionTotal, narrativaGeneral);
    
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
    
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas comerciales`);
    
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
    const timelineOptimizado = optimizarFlujoCommercial(timelineConEdicion);
    
    const metadata = generarMetadataCommercial(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobalCommercial();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal,
      tomasReales: tomasPlanificadas
    };
    
    console.log('[Orquestador] Producción comercial completada');
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Commercial] 💥 ERROR CRÍTICO en producción:', error);
    console.log('[Orquestador Commercial] 🔄 Aplicando fallback de emergencia...');
    return generarPlanCommercialFallback(prompt, duracionTotal);
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
  const tono = toma?.emocion || 'profesional';
  
  const fondo = await seleccionarFondoCommercial(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`,
    toma
  );
  
  const actor = await seleccionarActorCommercial(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo,
    false
  );
  
  const camara = configurarCamaraCommercial(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo,
    esEmocional,
    tono
  );
  
  const sonido = configurarSonidoCommercial(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor,
    toma
  );
  
  const edicion = configurarEdicionCommercial(
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

function generarMetadataCommercial(
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
    estiloVisual: 'commercial',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobalCommercial(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 30, // Comercial típicamente a 30fps
    resolucion: '1920x1080',
    colorGrading: 'commercial-bright',
    filtrosGlobales: ['commercial-filter', 'brand-colors', 'professional-look'],
    marcaAgua: true
  };
}

function generarPlanCommercialFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan comercial de emergencia');
  
  const timeline: SegundoCinematico[] = [];
  
  for (let segundo = 0; segundo < duracion; segundo++) {
    const progreso = segundo / duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.20) momentoNarrativo = 'setup';
    else if (progreso > 0.80) momentoNarrativo = 'cierre';
    else if (progreso > 0.65) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { prompt, tono: 'profesional' },
      fondo: { archivo: 'escenas/realista/casa/baño/día/frontal.png', tipo: 'profesional' },
      actor: { archivo: 'actores/realista/casa/baño/día/jovenmasculinoneutrointelectual.png', tipo: 'profesional' },
      camara: { shot: 'medium', movement: 'smooth', angle: 'professional' },
      sonido: { musica: 'corporate_theme', efectos: [], lipSync: false },
      edicion: { duracionEscena: 6, carryover: false, tipoCorte: 'professional_cut' },
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 15 === 0, // Menos frecuente, más profesional
      tono: 'profesional'
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'profesional' },
      estiloVisual: 'commercial',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.commercial },
    configuracionGlobal: generarConfiguracionGlobalCommercial()
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

function crearTomasCommercialPorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 6; // 6 segundos por toma para comercial (ritmo profesional)
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  const promptBase = narrativa.historia || narrativa.prompt || 'Un comercial profesional';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Professional commercial opening with product focus: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Strong commercial conclusion with call to action: ${promptBase}`;
    } else if (i >= numTomas * 0.65) {
      tipoToma = 'climax';
      descripcionBase = `Commercial climax with product benefits highlight: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Product demonstration sequence ${i}: ${promptBase}`;
    }
    
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion,
      movimientoCamara: 'smooth_professional',
      estiloVisual: 'commercial',
      emocion: 'profesional',
      fondo: 'professional_setting.jpg',
      actor: 'professional_talent.png',
      vozMurf: 'es-ES-AlvaroNeural',
      musica: 'corporate_theme',
      efectosSonoros: 'professional_ambient',
      carryover: i > 0 ? 'continuar_profesional' : 'inicio_impactante'
    });
  }
  
  return tomas;
}
