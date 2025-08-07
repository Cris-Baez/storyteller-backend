// estilos/cinematic/director.ts - Cerebro Director Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';

type ActoNarrativo = 'setup' | 'desarrollo' | 'climax' | 'cierre';

export interface NarrativaCinematica {
  historia: string;
  tono: string;
  estructura: ActoNarrativo[];
  momentosEmocionales: number[];
  genero: string;
  ritmo: 'lento' | 'medio' | 'rapido';
  tomas: TomaCinematograficaPlan[]; // ✅ NUEVO: Plan específico de tomas
  continuidad: ContinuidadVisual; // ✅ NUEVO: Reglas de continuidad
}

export interface TomaCinematograficaPlan {
  numero: number;
  duracion: number;
  tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  descripcion: string;
  movimientoCamara: string;
  estiloVisual: string;
  emocion: string;
  fondo: string; // ✅ OBLIGATORIO: Fondo específico del CDN
  actor: string; // ✅ OBLIGATORIO: Actor específico
  vozMurf: string; // ✅ OBLIGATORIO: Voz Murf.ai
  musica: string; // ✅ OBLIGATORIO: Música/emoción
  efectosSonoros: string; // ✅ OBLIGATORIO: Efectos sonoros
  carryover: string; // ✅ OBLIGATORIO: Conexión con toma anterior
}

export interface ContinuidadVisual {
  paletaColores: string;
  iluminacion: string;
  ambiente: string;
  locacion: string;
  estiloGeneral: string;
}

export async function generarNarrativaCinematica(prompt: string, duracion?: number): Promise<NarrativaCinematica> {
  console.log('[Director Cinematic] 🎬 Generando narrativa cinematográfica con IA...');
  
  try {
    // ✅ CORRECCIÓN CRÍTICA: Cargar assets reales ANTES de generar plan
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('cinematic');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('cinematic');
    
    console.log('[Director] 🎯 Assets disponibles:', {
      fondos: fondosDisponibles.length,
      actores: actoresDisponibles.length,
      ejemplosFondos: fondosDisponibles.slice(0, 5).map(f => ({ lugar: f.lugar, variante: f.variante, ambiente: f.ambiente })),
      ejemplosActores: actoresDisponibles.slice(0, 3).map(a => a.nombre)
    });
    
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de CinemaAI con assets reales
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR CINEMATOGRÁFICO de CinemaAI.

ASSETS REALES DISPONIBLES EN EL CDN:
FONDOS: ${fondosDisponibles.map(f => `${f.lugar}/${f.variante}/${f.ambiente} (${f.angulo})`).slice(0, 20).join(', ')}
ACTORES: ${actoresDisponibles.map(a => a.nombre.replace('.png', '')).slice(0, 10).join(', ')}

CONTEXTO TÉCNICO REAL:
- CinemaAI usa ÚNICAMENTE los fondos listados arriba del CDN
- Debes elegir fondos ESPECÍFICOS que existan realmente
- Los actores están pre-generados, elige nombres EXACTOS de la lista
- Kling Elements anima estos fondos como tomas en movimiento
- La narrativa DEBE ser comprensible y tener continuidad visual

TU TRABAJO COMO DIRECTOR:
✅ Crear historia coherente que use ÚNICAMENTE assets disponibles
✅ Primera toma DEBE ser impactante y establecer contexto
✅ Cada toma debe conectar visualmente con la anterior (carryover)
✅ Usar lugares reales del CDN que tengan sentido narrativo
✅ Los fondos DEBEN existir en la lista de arriba

EJEMPLOS DE FONDOS CORRECTOS:
- "apartamento/cocina/día" para escenas caseras
- "casa/patio/día" para exteriores
- "naturaleza/montaña/día" para aventuras
- "ciudad/calle/noche" para drama urbano

RESPONDE ÚNICAMENTE con este JSON usando ASSETS REALES:
{
  "historia": "resumen conciso de la historia en 2-3 líneas",
  "tono": "dramático|épico|emocional|misterioso|acción|romántico|thriller",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [5, 15, 25],
  "genero": "drama|acción|misterio|romance|thriller|aventura|ciencia_ficcion",
  "ritmo": "lento|medio|rapido",
  "tomas": [
    {
      "numero": 1,
      "duracion": 10,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma",
      "movimientoCamara": "slow_zoom_in|pan_left|pan_right|tilt_up|tilt_down|static",
      "estiloVisual": "cinematico|dramatico|epico",
      "emocion": "intriga|tension|emocion|accion|calma",
      "fondo": "categoria_del_CDN_o_ID_especifico",
      "actor": "descripcion_del_actor_necesario",
      "vozMurf": "masculina_seria|femenina_emotiva|joven_energica|adulto_narrativo",
      "musica": "epica|dramatica|misteriosa|emotiva|accion",
      "efectosSonoros": "viento|lluvia|pasos|naturaleza|silencio",
      "carryover": "descripcion_de_continuidad_desde_toma_anterior"
    }
  ],
  "continuidad": {
    "paletaColores": "natural|dramatica|epica|calida|fria",
    "iluminacion": "natural|dramatica|suave|intensa",
    "ambiente": "coherente|progresivo|contrastante",
    "locacion": "epica|urbana|natural|interior|exterior",
    "estiloGeneral": "realista_cinematico|dramatico|aventura"
  }
}`;

    // Calcular número de tomas basado en duración real del video
    const duracionReal = duracion || 30; // Default 30s si no se especifica
    const numeroDeTomasCalculado = Math.max(2, Math.min(10, Math.ceil(duracionReal / 8))); // 8s por toma cinematica
    const duracionPorToma = Math.floor(duracionReal / numeroDeTomasCalculado);

    console.log(`[Director Cinematic] 📊 Calculando tomas: ${duracionReal}s → ${numeroDeTomasCalculado} tomas de ~${duracionPorToma}s cada una`);

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS PARA NARRATIVA CINEMATOGRÁFICA:
- Duración total del video: ${duracionReal} segundos
- Crear EXACTAMENTE ${numeroDeTomasCalculado} tomas de ~${duracionPorToma} segundos cada una
- Cada toma debe tener continuidad visual y narrativa

ESTRUCTURA NARRATIVA OBLIGATORIA:
1. SETUP (25%): Establece personaje, lugar, situación inicial
2. DESARROLLO (50%): Presenta conflicto, tensión, complicaciones
3. CLIMAX (20%): Momento de máxima tensión o revelación
4. CIERRE (5%): Resolución satisfactoria

CADA TOMA DEBE TENER:
- Movimiento de cámara intencional (no static salvo que sea por tensión)
- Emoción específica que escale progresivamente
- Fondo del CDN que exista realmente
- Actor coherente con la historia
- Continuidad visual clara con la toma anterior

PROGRESIÓN EMOCIONAL DINÁMICA:
- Para 1 toma (10s): Completa setup→desarrollo→climax en una sola toma
- Para 3+ tomas: Toma 1: Intriga/curiosidad, Toma 2: Desarrollo/tensión, Toma 3: Climax/resolución

Analiza este prompt y crea un plan cinematográfico dinámico y emocionalmente progresivo.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', // El contexto ya está en el prompt completo
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Cinematic] ✅ Narrativa cinematográfica generada exitosamente');
      console.log(`- Género: ${narrativa.genero}`);
      console.log(`- Tono: ${narrativa.tono}`);
      console.log(`- Ritmo: ${narrativa.ritmo}`);
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Cinematic] ❌ Error generando narrativa:', error);
  }
  
  // Fallback estructurado y profesional con narrativa dinámica
  console.log('[Director Cinematic] 🔄 Usando narrativa fallback mejorada...');
  
  // Obtener fondos reales del AssetManager para el fallback
  const { AssetManager } = await import('../../../assetManager.js');
  const fondosReales = await AssetManager.obtenerFondosPorEstilo('cinematic');
  const actoresReales = await AssetManager.obtenerActoresPorEstilo('cinematic');
  
  // Determinar número de tomas basado en duración REAL del video
  const duracionReal = duracion || 30; // Default 30s si no se especifica
  let numeroTomas: number;
  if (duracionReal <= 10) {
    numeroTomas = 2; // Tomas de 5s cada una
  } else if (duracionReal <= 30) {
    numeroTomas = 4; // Tomas de 7-8s cada una
  } else if (duracionReal <= 45) {
    numeroTomas = 6; // ~7-8s por toma
  } else {
    numeroTomas = 8; // ~7-8s por toma para 60s+
  }
  
  // Límites cinematic: máximo 10 tomas para narrativas complejas
  numeroTomas = Math.min(numeroTomas, 10);
  
  console.log(`[Director Cinematic] 📊 Calculando tomas: ${duracionReal}s → ${numeroTomas} tomas de ~${Math.floor(duracionReal / numeroTomas)}s cada una`);
  
  const tomasFallback: TomaCinematograficaPlan[] = [];
  
  // Generar tomas dinámicas basadas en el prompt
  const estilosMovimiento = ['slow_zoom_in', 'pan_right', 'pan_left', 'tilt_up', 'tilt_down', 'dolly_forward'];
  const emociones = ['intriga', 'tension', 'emocion', 'climax', 'resolucion'];
  
  // ✅ CRÍTICO: Usar fondos reales del assets_index.json
  const fondosParaFallback = fondosReales.length > 0 ? fondosReales.slice(0, 4) : [];
  const actoresParaFallback = actoresReales.length > 0 ? actoresReales.slice(0, 2) : [];
  
  console.log(`[Director Cinematic] 🏗️ Fondos reales disponibles para fallback: ${fondosParaFallback.length}`);
  fondosParaFallback.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.ruta} (${f.lugar}/${f.variante})`);
  });
  
  console.log(`[Director Cinematic] 🎭 Actores reales disponibles para fallback: ${actoresParaFallback.length}`);
  actoresParaFallback.forEach((a, idx) => {
    console.log(`  [${idx + 1}] ${a.ruta}`);
  });
  
  for (let i = 0; i < Math.min(numeroTomas, 6); i++) {
    const progreso = i / (numeroTomas - 1);
    let tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
    
    if (progreso <= 0.25) tipoToma = 'setup';
    else if (progreso <= 0.75) tipoToma = 'desarrollo';
    else if (progreso <= 0.9) tipoToma = 'climax';
    else tipoToma = 'cierre';
    
    // Seleccionar fondo y actor reales del assets_index
    const fondoSeleccionado = fondosParaFallback.length > 0 
      ? fondosParaFallback[i % fondosParaFallback.length]
      : null;
      
    const actorSeleccionado = actoresParaFallback.length > 0
      ? actoresParaFallback[i % actoresParaFallback.length]
      : null;
    
    tomasFallback.push({
      numero: i + 1,
      duracion: 10,
      tipoToma,
      descripcion: `${tipoToma.charAt(0).toUpperCase() + tipoToma.slice(1)}: ${prompt.substring(0, 50)}... - Toma ${i + 1}`,
      movimientoCamara: estilosMovimiento[i % estilosMovimiento.length],
      estiloVisual: 'cinematico',
      emocion: emociones[Math.min(i, emociones.length - 1)],
      fondo: fondoSeleccionado ? fondoSeleccionado.ruta : 'escenas/anime/apartamento/baño/día/frontal.png', // ✅ Usar ruta real del assets_index
      actor: actorSeleccionado ? actorSeleccionado.ruta : 'actores/anime/casa/estudio/día/jovenmasculinotristeformal.png', // ✅ Usar actor real del assets_index
      vozMurf: i === 0 ? 'masculina_narrativa' : 'masculina_dramatica',
      musica: i < 2 ? 'tension_creciente' : 'climax_orquestal',
      efectosSonoros: i % 2 === 0 ? 'ambiente_interior' : 'naturaleza_viento',
      carryover: i === 0 ? 'inicio' : `continuidad_visual_toma_${i}`
    });
  }
  
  return {
    historia: `Historia cinematográfica basada en: ${prompt}`,
    tono: 'dramático',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: tomasFallback.map(t => t.numero * 10 - 5), // Momento emocional a mitad de cada toma
    genero: 'drama',
    ritmo: 'medio',
    tomas: tomasFallback,
    continuidad: {
      paletaColores: 'cinematica_natural',
      iluminacion: 'natural_dramatica',
      ambiente: 'coherente',
      locacion: 'epica_aventura',
      estiloGeneral: 'realista_cinematico'
    }
  };
}


export function aplicarEstructuraNarrativa(
  timeline: any[], 
  narrativa: NarrativaCinematica, 
  duracion: number
): any[] {
  console.log('[Director Cinematic] 🎭 Aplicando estructura narrativa...');
  
  return timeline.map((segundo, index) => {
    const progreso = index / duracion;
    let acto: ActoNarrativo = 'desarrollo';
    
    // Distribuir actos según progreso temporal
    if (progreso <= 0.25) acto = 'setup';
    else if (progreso <= 0.75) acto = 'desarrollo';
    else if (progreso <= 0.90) acto = 'climax';
    else acto = 'cierre';
    
    const esMomentoEmocional = narrativa.momentosEmocionales.includes(index);
    
    return {
      ...segundo,
      acto,
      tono: narrativa.tono,
      genero: narrativa.genero,
      ritmo: narrativa.ritmo,
      esEmocional: esMomentoEmocional,
      intensidadEmocional: esMomentoEmocional ? 0.8 : 0.4,
      visual: `${segundo.visual || 'Escena cinematográfica'} (${acto} - ${narrativa.tono})`
    };
  });
}
