// estilos/anime/director.ts - Cerebro Director Anime con IA distribuida

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
  tomas: TomaCinematograficaPlan[];
  continuidad: ContinuidadVisual;
}

export interface TomaCinematograficaPlan {
  numero: number;
  duracion: number;
  tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  descripcion: string;
  movimientoCamara: string;
  estiloVisual: string;
  emocion: string;
  fondo: string;
  actor: string;
  vozMurf: string;
  musica: string;
  efectosSonoros: string;
  carryover: string;
}

export interface ContinuidadVisual {
  paletaColores: string;
  iluminacion: string;
  ambiente: string;
  locacion: string;
  estiloGeneral: string;
}

export async function generarNarrativaAnime(prompt: string, duracion: number = 30): Promise<NarrativaCinematica> {
  console.log('[Director Anime] 🎬 Generando narrativa anime con IA...');
  
  try {
    // ✅ PASO 1: Cargar assets reales antes de planificar
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('anime');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('anime');
    
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director Anime de CinemaAI
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR ANIME de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI NO genera videos desde cero
- Usa fondos pre-generados del CDN (seleccionas de catálogo existente)
- Usa actores pre-generados del CDN (seleccionas de catálogo existente)  
- Kling Elements anima los fondos como tomas en movimiento
- Murf.ai proporciona voces (catálogo existente)
- Freesound.org proporciona música/efectos (catálogo existente)
- FFmpeg renderiza el resultado final

TU TRABAJO COMO DIRECTOR ANIME:
✅ Crear estructura narrativa anime (introducción dramática → desarrollo intenso → clímax explosivo → final emotivo)
✅ Planificar tomas con EMOCIONES EXAGERADAS típicas del anime
✅ La primera toma DEBE ser SÚPER IMPACTANTE (classic anime opening)
✅ Clips de 5 segundos (ritmo rápido anime)
✅ Movimientos de cámara dinámicos (zoom rápido, ángulos dramáticos)
✅ Transiciones con energía anime
✅ USAR ÚNICAMENTE assets del CDN disponibles (ver lista abajo)

FONDOS DISPONIBLES EN CDN ANIME:
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.nombre}: ${f.lugar}/${f.variante}/${f.ambiente} (estilo: ${f.estilo || 'anime'})`).join('\n')}
${fondosDisponibles.length > 20 ? `... y ${fondosDisponibles.length - 20} más fondos anime` : ''}

ACTORES DISPONIBLES EN CDN ANIME:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.nombre}: ${a.ruta.split('/').pop()?.replace('.png', '') || 'actor'} (estilo: ${a.estilo || 'anime'})`).join('\n')}
${actoresDisponibles.length > 10 ? `... y ${actoresDisponibles.length - 10} más actores anime` : ''}

RESPONDE ÚNICAMENTE con este JSON:
{
  "historia": "resumen conciso de la historia anime en 2-3 líneas",
  "tono": "energico|dramatico|epico|emocional|accion|romántico|misterioso",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [2, 8, 14, 20],
  "genero": "shonen|seinen|shoujo|mecha|slice_of_life|fantasy|romance",
  "ritmo": "rapido",
  "tomas": [
    {
      "numero": 1,
      "duracion": 5,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma anime",
      "movimientoCamara": "quick_zoom_in|dynamic_pan|dramatic_tilt|spin_zoom|crash_zoom",
      "estiloVisual": "anime|manga|vibrant",
      "emocion": "shock|excitement|determination|dramatic|intense",
      "fondo": "USAR RUTA EXACTA DEL CDN: tipo/lugar/variante/ambiente",
      "actor": "USAR PERSONAJE EXACTO DEL CDN",
      "vozMurf": "joven_energica|dramatico_anime|emocional_anime",
      "musica": "jpop|jrock|orchestral_anime|electronic|emotional_piano",
      "efectosSonoros": "anime_gasp|wind_whoosh|dramatic_silence|action_sfx",
      "carryover": "descripcion_de_continuidad_anime"
    }
  ],
  "continuidad": {
    "paletaColores": "vibrant|saturated|neon|warm_anime|cool_anime",
    "iluminacion": "dramatic_anime|high_contrast|cell_shaded|vibrant",
    "ambiente": "energetic|dramatic|emotional|intense",
    "locacion": "japon|urban_anime|fantasy|school|natural",
    "estiloGeneral": "anime_style|manga_aesthetic|japanese_animation"
  }
}`;

    // Calcular número de tomas basado en duración real del video
    const duracionReal = duracion || 30; // Default 30s si no se especifica
    const numeroDeTomas = Math.max(2, Math.min(8, Math.ceil(duracionReal / 5))); // 5s por toma anime
    const duracionPorToma = Math.floor(duracionReal / numeroDeTomas);

    console.log(`[Director Anime] 📊 Calculando tomas: ${duracionReal}s → ${numeroDeTomas} tomas de ~${duracionPorToma}s cada una`);

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS ANIME:
- Duración total del video: ${duracionReal} segundos
- Crear EXACTAMENTE ${numeroDeTomas} tomas de ~${duracionPorToma} segundos cada una
- La PRIMERA toma debe ser SÚPER DRAMÁTICA e IMPACTANTE (estilo anime opening)
- Asegura CONTINUIDAD VISUAL Y EMOCIONAL entre tomas usando 'carryover'
- IMPORTANTE: Cada toma debe conectar con la anterior a través del campo 'carryover'
- Usa movimientos de cámara DINÁMICOS para anime (quick_zoom, crash_zoom, dramatic_tilt)
- Mantén paleta de colores VIBRANTE y SATURADA típica del anime
- Emociones EXAGERADAS en cada toma

REGLAS DE CARRYOVER (CRUCIAL PARA CONTINUIDAD):
- Toma 1: establece personaje principal y situación
- Toma 2: carryover debe describir qué elemento visual/emocional continúa de la toma 1
- Toma 3: carryover describe la conexión con toma 2, y así sucesivamente
- Ejemplo: "El personaje mantiene la misma expresión determinada mientras cambia de escenario"

Analiza este prompt y crea un plan anime completo de ${numeroDeTomas} tomas con carryover detallado.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', // El contexto ya está en el prompt completo
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Anime] ✅ Narrativa anime generada exitosamente');
      console.log(`- Género: ${narrativa.genero}`);
      console.log(`- Tono: ${narrativa.tono}`);
      console.log(`- Ritmo: ${narrativa.ritmo}`);
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Anime] ❌ Error generando narrativa:', error);
  }
  
  // Fallback estructurado y profesional anime
  console.log('[Director Anime] 🔄 Usando narrativa anime fallback...');
  
  // ✅ CRÍTICO: Obtener fondos y actores reales del AssetManager para el fallback
  const { AssetManager } = await import('../../../assetManager.js');
  const fondosReales = await AssetManager.obtenerFondosPorEstilo('anime');
  const actoresReales = await AssetManager.obtenerActoresPorEstilo('anime');
  
  // Determinar número de tomas basado en duración REAL del video
  // 10s → 2 tomas, 30s → 4-6 tomas, 45s → 6-8 tomas, 60s → 8-10 tomas
  let numeroTomas: number;
  if (duracion <= 10) {
    numeroTomas = 2; // Tomas de 5s cada una
  } else if (duracion <= 30) {
    numeroTomas = Math.ceil(duracion / 6); // ~5-6s por toma
  } else if (duracion <= 45) {
    numeroTomas = Math.ceil(duracion / 7); // ~6-7s por toma  
  } else {
    numeroTomas = Math.ceil(duracion / 8); // ~8s por toma para 60s+
  }
  
  // Límites anime: máximo 8 tomas para mantener energía
  numeroTomas = Math.min(numeroTomas, 8);
  
  // ✅ CRÍTICO: Usar fondos reales del assets_index.json
  const fondosParaFallback = fondosReales.length > 0 ? fondosReales.slice(0, 6) : [];
  const actoresParaFallback = actoresReales.length > 0 ? actoresReales.slice(0, 4) : [];
  
  console.log(`[Director Anime] 🏗️ Fondos reales disponibles para fallback: ${fondosParaFallback.length}`);
  fondosParaFallback.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.ruta} (${f.lugar}/${f.variante})`);
  });
  
  console.log(`[Director Anime] 🎭 Actores reales disponibles para fallback: ${actoresParaFallback.length}`);
  actoresParaFallback.forEach((a, idx) => {
    console.log(`  [${idx + 1}] ${a.ruta}`);
  });
  
  const tomasFallback: TomaCinematograficaPlan[] = [];
  
  // Generar tomas dinámicas basadas en el prompt
  const estilosMovimiento = ['quick_zoom_in', 'dramatic_tilt', 'pan_right', 'zoom_out', 'tilt_up', 'dolly_forward'];
  const emociones = ['shock', 'determination', 'emocion', 'climax', 'resolucion'];
  
  for (let i = 0; i < numeroTomas; i++) {
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
      duracion: i === 0 ? 5 : 5, // Tomas anime típicamente más cortas para dinamismo
      tipoToma,
      descripcion: i === 0 
        ? 'Dramatic anime opening - impactful establishing shot with character introduction'
        : `${tipoToma.charAt(0).toUpperCase() + tipoToma.slice(1)}: ${prompt.substring(0, 50)}... - Toma ${i + 1}`,
      movimientoCamara: estilosMovimiento[i % estilosMovimiento.length],
      estiloVisual: 'anime',
      emocion: emociones[Math.min(i, emociones.length - 1)],
      fondo: fondoSeleccionado ? fondoSeleccionado.ruta : 'escenas/anime/apartamento/baño/día/frontal.png', // ✅ Usar ruta real del assets_index
      actor: actorSeleccionado ? actorSeleccionado.ruta : 'actores/anime/casa/estudio/día/jovenmasculinotristeformal.png', // ✅ Usar actor real del assets_index
      vozMurf: i === 0 ? 'joven_energica' : 'dramatico_anime',
      musica: i === 0 ? 'jrock_opening' : 'orchestral_anime',
      efectosSonoros: i === 0 ? 'anime_gasp' : 'wind_whoosh',
      // ✅ CARRYOVER INTELIGENTE para continuidad visual
      carryover: i === 0 
        ? 'establece_personaje_principal_y_ambiente_dramatico'
        : i === 1 
        ? 'mantiene_energia_dramatica_del_personaje_con_nuevo_desafio'
        : i === numeroTomas - 1
        ? 'resuelve_tension_con_continuidad_emocional_del_climax'
        : `conecta_emocion_${emociones[Math.min(i-1, emociones.length - 1)]}_hacia_${emociones[Math.min(i, emociones.length - 1)]}_manteniendo_ritmo_anime`
    });
  }
  
  return {
    historia: `Historia anime dramática basada en: ${prompt}`,
    tono: 'energico',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: tomasFallback.map(t => t.numero * 5 - 2), // Momento emocional a mitad de cada toma anime (5s)
    genero: 'shonen',
    ritmo: 'rapido',
    tomas: tomasFallback,
    continuidad: {
      paletaColores: 'vibrant_anime',
      iluminacion: 'dramatic_anime',
      ambiente: 'energetic',
      locacion: 'japon_moderno',
      estiloGeneral: 'anime_style'
    }
  };
}


export function aplicarEstructuraNarrativa(
  timeline: any[], 
  narrativa: NarrativaCinematica, 
  duracion: number
): any[] {
  console.log('[Director Anime] 🎭 Aplicando estructura narrativa anime...');
  
  return timeline.map((segundo, index) => {
    const progreso = index / duracion;
    let acto: ActoNarrativo = 'desarrollo';
    
    // Distribución más rápida para anime
    if (progreso <= 0.20) acto = 'setup';
    else if (progreso <= 0.70) acto = 'desarrollo';
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
      intensidadEmocional: esMomentoEmocional ? 0.9 : 0.6, // Más intensa para anime
      visual: `${segundo.visual || 'Escena anime'} (${acto} - ${narrativa.tono} - estilo anime)`
    };
  });
}
