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

export async function generarNarrativaAnime(prompt: string): Promise<NarrativaCinematica> {
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
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.tipo}/${f.lugar}/${f.variante}/${f.ambiente} (${f.tags.join(', ')})`).join('\n')}
... y ${fondosDisponibles.length - 20} más fondos anime

ACTORES DISPONIBLES EN CDN ANIME:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.personaje} (${a.edad}, ${a.personalidad})`).join('\n')}
... y ${actoresDisponibles.length - 10} más actores anime

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

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS ANIME:
- Crea EXACTAMENTE 6 tomas de 5 segundos cada una (total 30s) - RITMO ANIME RÁPIDO
- La PRIMERA toma debe ser SÚPER DRAMÁTICA e IMPACTANTE (estilo anime opening)
- Asegura CONTINUIDAD EMOCIONAL EXAGERADA entre las tomas
- Usa movimientos de cámara DINÁMICOS para anime (quick_zoom, crash_zoom, dramatic_tilt)
- Mantén paleta de colores VIBRANTE y SATURADA típica del anime
- Emociones EXAGERADAS en cada toma

Analiza este prompt y crea un plan anime completo de 6 tomas rápidas.`;

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
  return {
    historia: `Historia anime dramática basada en: ${prompt}`,
    tono: 'energico',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [2, 8, 14, 20, 26],
    genero: 'shonen',
    ritmo: 'rapido',
    tomas: [
      {
        numero: 1,
        duracion: 5,
        tipoToma: 'setup',
        descripcion: 'Dramatic anime opening - impactful establishing shot with character introduction',
        movimientoCamara: 'quick_zoom_in',
        estiloVisual: 'anime',
        emocion: 'shock',
        fondo: 'japon_dramatico',
        actor: 'anime_protagonist',
        vozMurf: 'joven_energica',
        musica: 'jrock_opening',
        efectosSonoros: 'anime_gasp',
        carryover: 'dramatic_start'
      },
      {
        numero: 2,
        duracion: 5,
        tipoToma: 'desarrollo',
        descripcion: 'Character determination moment with intense expression',
        movimientoCamara: 'dramatic_tilt',
        estiloVisual: 'anime',
        emocion: 'determination',
        fondo: 'urban_anime',
        actor: 'anime_protagonist_determined',
        vozMurf: 'dramatico_anime',
        musica: 'orchestral_anime',
        efectosSonoros: 'wind_whoosh',
        carryover: 'emotional_buildup'
      },
      {
        numero: 3,
        duracion: 5,
        tipoToma: 'desarrollo',
        descripcion: 'Action sequence with dynamic movement',
        movimientoCamara: 'dynamic_pan',
        estiloVisual: 'anime',
        emocion: 'excitement',
        fondo: 'action_scene',
        actor: 'anime_action_pose',
        vozMurf: 'joven_energica',
        musica: 'electronic_intense',
        efectosSonoros: 'action_sfx',
        carryover: 'energy_buildup'
      },
      {
        numero: 4,
        duracion: 5,
        tipoToma: 'desarrollo',
        descripcion: 'Emotional conflict internal struggle',
        movimientoCamara: 'spin_zoom',
        estiloVisual: 'anime',
        emocion: 'dramatic',
        fondo: 'emotional_backdrop',
        actor: 'anime_conflicted',
        vozMurf: 'emocional_anime',
        musica: 'emotional_piano',
        efectosSonoros: 'dramatic_silence',
        carryover: 'emotional_tension'
      },
      {
        numero: 5,
        duracion: 5,
        tipoToma: 'climax',
        descripcion: 'Climactic power moment - transformation or breakthrough',
        movimientoCamara: 'crash_zoom',
        estiloVisual: 'anime',
        emocion: 'intense',
        fondo: 'climax_energy',
        actor: 'anime_power_up',
        vozMurf: 'dramatico_anime',
        musica: 'orchestral_climax',
        efectosSonoros: 'power_surge',
        carryover: 'climax_energy'
      },
      {
        numero: 6,
        duracion: 5,
        tipoToma: 'cierre',
        descripcion: 'Emotional resolution with beautiful aftermath',
        movimientoCamara: 'slow_zoom_out',
        estiloVisual: 'anime',
        emocion: 'peaceful',
        fondo: 'serene_ending',
        actor: 'anime_peaceful',
        vozMurf: 'emocional_anime',
        musica: 'peaceful_outro',
        efectosSonoros: 'gentle_wind',
        carryover: 'peaceful_resolution'
      }
    ],
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
