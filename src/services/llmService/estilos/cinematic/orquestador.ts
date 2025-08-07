// estilos/cinematic/orquestador.ts - Cerebro Orquestador Cinematográfico

import { generarNarrativaCinematica, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoCinematico } from './arte.js';
import { seleccionarActorCinematico } from './actores.js';
import { configurarCamaraCinematica } from './fotografia.js';
import { configurarSonidoCinematico } from './sonido.js';
import { configurarEdicionCinematica, aplicarEstructuraEdicion, optimizarFlujoCinematico } from './editor.js';
import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];
  metadata: MetadataCinematica;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalCinematica;
  tomasReales?: TomaCinematograficaPlan[]; // Agregar tomas originales para el pipeline
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
  duracionTotal: number,
  estiloVisual: string = 'cinematic' // Recibir estilo visual
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Cinematic] Iniciando producción cinematográfica');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`); // LOG del estilo
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN CINEMATOGRÁFICA');
    
    // 1. Cargar recursos usando AssetManager unificado con el estilo correcto
    console.log(`[ORQUESTADOR] 🔄 Cargando assets para estilo: ${estiloVisual}...`);
    const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual); // Usar estilo correcto
    const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual); // Usar estilo correcto
    
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
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cinematic };
    
    // 2. Director: Establecer narrativa Y PLAN DE TOMAS CINEMATOGRÁFICAS
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan cinematográfico...');
    const narrativaGeneral = await generarNarrativaCinematica(prompt, duracionTotal);
    
    // VALIDACIÓN DEFENSIVA: Verificar que la narrativa tenga estructura válida
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan cinematográfico generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum, t) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    // 3. Procesar cada TOMA CINEMATOGRÁFICA (siguiendo tu flujo correcto)
    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    // Si el director generó tomas, usarlas. Si no, crear tomas por defecto
    console.log('[ORQUESTADOR] 🔍 DEBUG - Verificando tomas del director:', {
      narrativaGeneral_tiene_tomas: !!narrativaGeneral.tomas,
      narrativaGeneral_tomas_length: narrativaGeneral.tomas?.length,
      narrativaGeneral_keys: Object.keys(narrativaGeneral),
      tomas_first_item: narrativaGeneral.tomas?.[0]
    });
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasPorDefecto(duracionTotal, narrativaGeneral);
    
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
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas cinematográficas`);
    console.log('[ORQUESTADOR] 🎬 INICIANDO BUCLE DE TOMAS CINEMATOGRÁFICAS...');
    
    for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
      const toma = tomasPlanificadas[tomaIdx];
      console.log(`[ORQUESTADOR] 📸 TOMA ${toma.numero}: "${toma.descripcion}" (${toma.duracion}s)`);
      
      // ✅ PROCESAR TOMA UNA SOLA VEZ (no segundo-a-segundo)
      console.log(`[ORQUESTADOR] 🧠 Coordinando cerebros para toma ${toma.numero}...`);
      const configuracionToma = await coordinarCerebros({
        segundo: segundoActual, // Segundo de inicio de la toma
        duracionTotal,
        toma: toma, // ✅ PASAR LA TOMA COMPLETA
        segundoEnToma: 0, // Siempre 0 para configuración de toma
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
          segundo: segundoActual, // Actualizar el segundo actual
          segmento: toma.tipoToma || 'desarrollo',
          momentoNarrativo: toma.tipoToma || 'desarrollo'
        };
        
        timeline.push(segundoCinematico);
        segundoActual++;
      }
      
      console.log(`[ORQUESTADOR] ✅ Toma ${toma.numero} aplicada a ${toma.duracion} segundos`);
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
      configuracionGlobal,
      tomasReales: tomasPlanificadas // ✅ CRÍTICO: Incluir las tomas originales para el pipeline
    };
    
    console.log('[Orquestador] Producción cinematográfica completada');
    console.log(`Timeline generado: ${videoPlan.timeline.length} segundos`);
    console.log(`Actos: ${metadata.actos}, Momentos emocionales: ${metadata.momentosEmocionales.length}`);
    
    // ✅ DEBUG: Verificar que las tomas reales están incluidas
    console.log('[Orquestador] 🔍 DEBUG - Tomas reales incluidas:', {
      tomasReales_count: videoPlan.tomasReales?.length,
      tomasReales_preview: videoPlan.tomasReales?.map(t => ({
        numero: t.numero,
        descripcion: t.descripcion?.substring(0, 50) + '...',
        duracion: t.duracion,
        tipoToma: t.tipoToma
      }))
    });
    
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Cinematic] 💥 ERROR CRÍTICO en producción:', error);
    console.error('[Orquestador Cinematic] 💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Orquestador Cinematic] 💥 Error message:', error instanceof Error ? error.message : String(error));
    
    // Fallback: Plan cinematográfico básico
    console.log('[Orquestador Cinematic] 🔄 Aplicando fallback de emergencia...');
    return generarPlanCinematicoFallback(prompt, duracionTotal);
  }
}

async function coordinarCerebros(contexto: {
  segundo: number;
  duracionTotal: number;
  toma?: TomaCinematograficaPlan; // ✅ NUEVA: Información de la toma con tipo correcto
  segundoEnToma?: number; // ✅ NUEVA: Segundo dentro de la toma
  esEmocional: boolean;
  narrativaGeneral: any;
  assets: any;
}): Promise<SegundoCinematico> {
  
  const { segundo, duracionTotal, toma, segundoEnToma, esEmocional, narrativaGeneral, assets } = contexto;
  
  // Determinar contexto usando la toma si está disponible
  const momentoNarrativo = toma?.tipoToma || 'desarrollo';
  const tono = toma?.emocion || 'neutro';
  
  // Arte: Seleccionar fondo usando información completa de la toma
  const fondo = await seleccionarFondoCinematico(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`, // ✅ USAR DESCRIPCIÓN DE LA TOMA
    toma // ✅ PASAR INFORMACIÓN COMPLETA DE LA TOMA
  );
  
  // Actores: Seleccionar y configurar actor usando información de toma
  const actor = await seleccionarActorCinematico(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo, // ✅ Usar toma si existe, sino segundo para retrocompatibilidad
    false // ✅ requiereLipSync por defecto
  );
  
  // Fotografía: Configurar cámara usando información de toma
  const camara = configurarCamaraCinematica(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo, // ✅ PASAR TOMA COMPLETA O SEGUNDO
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
    actor,
    toma // Las funciones de sonido pueden manejar undefined correctamente
  );
  
  // Editor: Configurar edición
  const edicion = configurarEdicionCinematica(
    segundo,
    duracionTotal,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    tono,
    toma // ✅ PASAR INFORMACIÓN COMPLETA DE LA TOMA
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
      fondo: { archivo: 'escenas/realista/apartamento/baño/día/frontal.png', tipo: 'escenario' },
      actor: { archivo: 'actores/realista/apartamento/baño/día/jovenmasculinoneutrointelectual.png', tipo: 'principal' },
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
    if (!plan.timeline || plan.timeline.length === 0) {
      console.log('[Validacion] ❌ Timeline vacío o inexistente');
      return false;
    }
    if (!plan.metadata || !plan.configuracionGlobal) {
      console.log('[Validacion] ❌ Faltan metadata o configuracionGlobal');
      return false;
    }
    
    // Validar que cada segundo tenga los assets básicos necesarios
    for (let i = 0; i < plan.timeline.length; i++) {
      const segundo = plan.timeline[i];
      if (segundo.segundo !== i) {
        console.log(`[Validacion] ❌ Segundo ${i} tiene número incorrecto: ${segundo.segundo}`);
        return false;
      }
      if (!segundo.fondo || !segundo.actor || !segundo.camara) {
        console.log(`[Validacion] ❌ Segundo ${i} faltan assets básicos`);
        return false;
      }
    }
    
    // ✅ ARREGLO: Validación más flexible de estructura narrativa
    // Para videos cortos (10s), es suficiente con que tenga algún momento narrativo válido
    const momentosPresentes = [...new Set(plan.timeline.map(s => s.momentoNarrativo))];
    const momentosValidos = ['setup', 'desarrollo', 'climax', 'cierre'];
    const tieneAlgunMomentoValido = momentosPresentes.some(m => momentosValidos.includes(m));
    
    if (!tieneAlgunMomentoValido) {
      console.log('[Validacion] ❌ No hay momentos narrativos válidos:', momentosPresentes);
      return false;
    }
    
    console.log('[Validacion] ✅ Plan cinematográfico válido:', {
      segundos: plan.timeline.length,
      momentos: momentosPresentes,
      tomas: plan.tomasReales?.length || 0
    });
    
    return true;
    
  } catch (error) {
    console.error('[Orquestador] Error validando plan:', error);
    return false;
  }
}

/**
 * Crear tomas por defecto cuando el director no genera tomas específicas
 * Siguiendo el flujo de Cris: "divide en tomas de 10s cada una"
 */
function crearTomasPorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 10; // 10 segundos por toma por defecto
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  // ✅ MEJORADO: Generar descripciones más ricas basadas en el contexto
  const promptBase = narrativa.historia || narrativa.prompt || 'Una historia cinematográfica';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    // Determinar tipo de toma basado en progreso
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Opening scene establishing the story: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Final sequence bringing resolution to: ${promptBase}`;
    } else if (i >= numTomas * 0.6) {
      tipoToma = 'climax';
      descripcionBase = `Climactic moment in the story: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Development sequence ${i} continuing the narrative: ${promptBase}`;
    }
    
    // ✅ DESCRIPCIÓN RICA: Basada en el contexto y el tipo de toma
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion, // ✅ MEJORADO: Descripción rica en lugar de "Toma X"
      movimientoCamara: 'slow_pan',
      estiloVisual: 'cinematic',
      emocion: narrativa.tono || 'neutro',
      fondo: 'ciudad.jpg', // ✅ Valor por defecto
      actor: 'actor_joven.png', // ✅ Valor por defecto  
      vozMurf: 'es-ES-ElviraNeural', // ✅ Valor por defecto
      musica: 'ambient', // ✅ Valor por defecto
      efectosSonoros: 'ambiente_ciudad', // ✅ Valor por defecto
      carryover: i > 0 ? 'continuar_ambiente' : 'inicio' // ✅ Valor por defecto
    });
  }
  
  console.log('[Orquestador] 🎬 DEBUG - Tomas por defecto creadas:', {
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
