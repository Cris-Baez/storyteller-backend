// estilos/cartoon/director.ts - Cerebro Director Cartoon

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

export async function generarNarrativaCartoon(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Cartoon] 🎬 Generando narrativa cartoon con IA...');
  
  try {
    // ✅ PASO 1: Cargar assets reales antes de planificar
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('cartoon');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('cartoon');
    
    const systemBase = await cargarSystemPromptBase();
    
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR CARTOON de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI NO genera videos desde cero
- Usa fondos pre-generados del CDN (seleccionas de catálogo existente)
- Usa actores pre-generados del CDN (seleccionas de catálogo existente)  
- Kling Elements anima los fondos como tomas en movimiento
- Murf.ai proporciona voces (catálogo existente)
- Freesound.org proporciona música/efectos (catálogo existente)
- FFmpeg renderiza el resultado final

TU TRABAJO COMO DIRECTOR CARTOON:
✅ Crear estructura narrativa cartoon (intro divertida → aventura → climax cómico → final feliz)
✅ Planificar tomas con HUMOR y DIVERSIÓN típicas del cartoon
✅ La primera toma DEBE ser DIVERTIDA y capturar atención (classic cartoon opening)
✅ Clips de 8 segundos (ritmo medio cartoon)
✅ Movimientos de cámara amigables (bouncy, smooth, playful)
✅ Transiciones suaves y alegres
✅ USAR ÚNICAMENTE assets del CDN disponibles (ver lista abajo)

FONDOS DISPONIBLES EN CDN CARTOON:
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.tipo}/${f.lugar}/${f.variante}/${f.ambiente} (${f.tags.join(', ')})`).join('\n')}
... y ${fondosDisponibles.length - 20} más fondos cartoon

ACTORES DISPONIBLES EN CDN CARTOON:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.personaje} (${a.edad}, ${a.personalidad})`).join('\n')}
... y ${actoresDisponibles.length - 10} más actores cartoon

RESPONDE ÚNICAMENTE con este JSON:
{
  "historia": "resumen conciso de la historia cartoon en 2-3 líneas",
  "tono": "divertido|alegre|aventurero|comico|familiar|educativo",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [8, 16, 24],
  "genero": "comedia|aventura|familiar|educativo|fantasia|slice_of_life",
  "ritmo": "medio",
  "tomas": [
    {
      "numero": 1,
      "duracion": 8,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma cartoon",
      "movimientoCamara": "bouncy_zoom|smooth_pan|playful_tilt|gentle_zoom|friendly_movement",
      "estiloVisual": "cartoon|animated|colorful",
      "emocion": "happy|excited|curious|playful|friendly",
      "fondo": "USAR RUTA EXACTA DEL CDN: tipo/lugar/variante/ambiente",
      "actor": "USAR PERSONAJE EXACTO DEL CDN",
      "vozMurf": "amigable_cartoon|joven_alegre|narrativo_familiar",
      "musica": "cartoon_theme|playful_music|adventure_tune|happy_melody",
      "efectosSonoros": "cartoon_boings|playful_sounds|adventure_sfx|happy_ambient",
      "carryover": "descripcion_de_continuidad_cartoon"
    }
  ],
  "continuidad": {
    "paletaColores": "bright|colorful|warm|cheerful|vivid",
    "iluminacion": "bright_cartoon|soft_colorful|cheerful|warm",
    "ambiente": "playful|happy|adventurous|friendly",
    "locacion": "cartoon_world|animated_environment|colorful_setting",
    "estiloGeneral": "cartoon_style|animated_aesthetic|family_friendly"
  }
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS CARTOON:
- Crea EXACTAMENTE 4 tomas de 8 segundos cada una (total 32s) - RITMO CARTOON MEDIO
- La PRIMERA toma debe ser DIVERTIDA y AMIGABLE (estilo cartoon opening)
- Asegura CONTINUIDAD ALEGRE entre las tomas
- Usa movimientos de cámara AMIGABLES para cartoon (bouncy, smooth, playful)
- Mantén paleta de colores BRILLANTE y ALEGRE típica del cartoon
- Tono POSITIVO y FAMILIAR en cada toma

Analiza este prompt y crea un plan cartoon completo de 4 tomas amigables.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '',
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Cartoon] ✅ Narrativa cartoon generada exitosamente');
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Cartoon] ❌ Error generando narrativa:', error);
  }
  
  // Fallback cartoon
  console.log('[Director Cartoon] 🔄 Usando narrativa cartoon fallback...');
  return {
    historia: `Historia cartoon divertida basada en: ${prompt}`,
    tono: 'divertido',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [8, 16, 24],
    genero: 'comedia',
    ritmo: 'medio',
    tomas: [
      {
        numero: 1,
        duracion: 8,
        tipoToma: 'setup',
        descripcion: 'Fun cartoon opening with character introduction and colorful world',
        movimientoCamara: 'bouncy_zoom',
        estiloVisual: 'cartoon',
        emocion: 'happy',
        fondo: 'cartoon_world_colorful',
        actor: 'cartoon_protagonist',
        vozMurf: 'amigable_cartoon',
        musica: 'cartoon_theme',
        efectosSonoros: 'cartoon_boings',
        carryover: 'cheerful_start'
      },
      {
        numero: 2,
        duracion: 8,
        tipoToma: 'desarrollo',
        descripcion: 'Adventure begins with playful character interaction',
        movimientoCamara: 'smooth_pan',
        estiloVisual: 'cartoon',
        emocion: 'excited',
        fondo: 'adventure_setting',
        actor: 'cartoon_adventuring',
        vozMurf: 'joven_alegre',
        musica: 'adventure_tune',
        efectosSonoros: 'playful_sounds',
        carryover: 'adventure_buildup'
      },
      {
        numero: 3,
        duracion: 8,
        tipoToma: 'desarrollo',
        descripcion: 'Comedic situation with funny character reactions',
        movimientoCamara: 'playful_tilt',
        estiloVisual: 'cartoon',
        emocion: 'playful',
        fondo: 'comedy_scene',
        actor: 'cartoon_funny_pose',
        vozMurf: 'narrativo_familiar',
        musica: 'playful_music',
        efectosSonoros: 'comedy_sfx',
        carryover: 'comedy_flow'
      },
      {
        numero: 4,
        duracion: 8,
        tipoToma: 'cierre',
        descripcion: 'Happy ending with satisfying cartoon conclusion',
        movimientoCamara: 'gentle_zoom',
        estiloVisual: 'cartoon',
        emocion: 'satisfied',
        fondo: 'happy_ending_scene',
        actor: 'cartoon_happy_ending',
        vozMurf: 'amigable_cartoon',
        musica: 'happy_melody',
        efectosSonoros: 'happy_ambient',
        carryover: 'happy_resolution'
      }
    ],
    continuidad: {
      paletaColores: 'bright_cartoon',
      iluminacion: 'bright_cartoon',
      ambiente: 'playful',
      locacion: 'cartoon_world',
      estiloGeneral: 'cartoon_style'
    }
  };
}
