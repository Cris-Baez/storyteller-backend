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

export async function generarNarrativaCartoon(prompt: string, duracion?: number): Promise<NarrativaCinematica> {
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
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.nombre}: ${f.lugar}/${f.variante}/${f.ambiente} (estilo: ${f.estilo || 'cartoon'})`).join('\n')}
${fondosDisponibles.length > 20 ? `... y ${fondosDisponibles.length - 20} más fondos cartoon` : ''}

ACTORES DISPONIBLES EN CDN CARTOON:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.nombre}: ${a.ruta.split('/').pop()?.replace('.png', '') || 'actor'} (estilo: ${a.estilo || 'cartoon'})`).join('\n')}
${actoresDisponibles.length > 10 ? `... y ${actoresDisponibles.length - 10} más actores cartoon` : ''}

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

    // Calcular número de tomas basado en duración real del video
    const duracionReal = duracion || 30; // Default 30s si no se especifica
    const numeroDeTomas = Math.max(2, Math.min(8, Math.ceil(duracionReal / 8))); // 8s por toma cartoon
    const duracionPorToma = Math.floor(duracionReal / numeroDeTomas);

    console.log(`[Director Cartoon] 📊 Calculando tomas: ${duracionReal}s → ${numeroDeTomas} tomas de ~${duracionPorToma}s cada una`);

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS CARTOON:
- Duración total del video: ${duracionReal} segundos
- Crea EXACTAMENTE ${numeroDeTomas} tomas de ~${duracionPorToma} segundos cada una
- La PRIMERA toma debe ser DIVERTIDA y AMIGABLE (estilo cartoon opening)
- Asegura CONTINUIDAD VISUAL ALEGRE entre tomas usando 'carryover'
- IMPORTANTE: Cada toma debe conectar con la anterior manteniendo el tono familiar
- Usa movimientos de cámara AMIGABLES para cartoon (bouncy, smooth, playful)
- Mantén paleta de colores BRILLANTE y ALEGRE típica del cartoon
- Tono POSITIVO y FAMILIAR en cada toma

REGLAS DE CARRYOVER CARTOON (CONTINUIDAD AMIGABLE):
- Toma 1: establece personaje principal en ambiente divertido
- Toma 2+: carryover debe describir cómo continúa la diversión/aventura
- Ejemplo: "El personaje mantiene su sonrisa curiosa mientras explora nuevo lugar"

Analiza este prompt y crea un plan cartoon completo de ${numeroDeTomas} tomas con carryover alegre.`;

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
  
  // ✅ CRÍTICO: Obtener fondos y actores reales del AssetManager para el fallback
  const { AssetManager } = await import('../../../assetManager.js');
  const fondosReales = await AssetManager.obtenerFondosPorEstilo('cartoon');
  const actoresReales = await AssetManager.obtenerActoresPorEstilo('cartoon');
  
  // Determinar número de tomas basado en duración REAL del video
  // 10s → 2 tomas, 30s → 4 tomas, 45s → 5-6 tomas, 60s → 7-8 tomas
  const duracionReal = duracion || 30; // Default 30s si no se especifica
  let numeroTomas: number;
  if (duracionReal <= 10) {
    numeroTomas = 2; // Tomas de 5s cada una
  } else if (duracionReal <= 30) {
    numeroTomas = 4; // Tomas de 7-8s cada una (estilo cartoon más lento)
  } else if (duracionReal <= 45) {
    numeroTomas = 6; // ~7-8s por toma
  } else {
    numeroTomas = 8; // ~7-8s por toma para 60s+
  }
  
  // Límites cartoon: máximo 8 tomas para mantener simplicidad
  numeroTomas = Math.min(numeroTomas, 8);
  
  // ✅ CRÍTICO: Usar fondos reales del assets_index.json
  const fondosParaFallback = fondosReales.length > 0 ? fondosReales.slice(0, 4) : [];
  const actoresParaFallback = actoresReales.length > 0 ? actoresReales.slice(0, 3) : [];
  
  console.log(`[Director Cartoon] 🏗️ Fondos reales disponibles para fallback: ${fondosParaFallback.length}`);
  fondosParaFallback.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.ruta} (${f.lugar}/${f.variante})`);
  });
  
  console.log(`[Director Cartoon] 🎭 Actores reales disponibles para fallback: ${actoresParaFallback.length}`);
  actoresParaFallback.forEach((a, idx) => {
    console.log(`  [${idx + 1}] ${a.ruta}`);
  });
  
  const tomasFallback: TomaCinematograficaPlan[] = [];
  
  // Generar tomas dinámicas basadas en el prompt
  const estilosMovimiento = ['bouncy_zoom', 'smooth_pan', 'playful_tilt', 'gentle_zoom'];
  const emociones = ['happy', 'excited', 'playful', 'satisfied'];
  
  for (let i = 0; i < numeroTomas; i++) {
    const progreso = i / (numeroTomas - 1);
    let tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
    
    if (progreso <= 0.25) tipoToma = 'setup';
    else if (progreso <= 0.75) tipoToma = 'desarrollo';
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
      duracion: 8,
      tipoToma,
      descripcion: i === 0 
        ? 'Fun cartoon opening with character introduction and colorful world'
        : `${tipoToma.charAt(0).toUpperCase() + tipoToma.slice(1)}: ${prompt.substring(0, 50)}... - Toma ${i + 1}`,
      movimientoCamara: estilosMovimiento[i % estilosMovimiento.length],
      estiloVisual: 'cartoon',
      emocion: emociones[Math.min(i, emociones.length - 1)],
      fondo: fondoSeleccionado ? fondoSeleccionado.ruta : 'escenas/comic/cocina/día/frontal.png', // ✅ Usar ruta real del assets_index
      actor: actorSeleccionado ? actorSeleccionado.ruta : 'actores/comic/casa/cocina/día/jovenanime.png', // ✅ Usar actor real del assets_index
      vozMurf: i === 0 ? 'amigable_cartoon' : 'joven_alegre',
      musica: i === 0 ? 'cartoon_theme' : 'adventure_tune',
      efectosSonoros: i === 0 ? 'cartoon_boings' : 'playful_sounds',
      carryover: i === 0 ? 'cheerful_start' : `continuidad_visual_toma_${i}`
    });
  }
  
  return {
    historia: `Historia cartoon divertida basada en: ${prompt}`,
    tono: 'divertido',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: tomasFallback.map(t => t.numero * 8 - 4), // Momento emocional a mitad de cada toma cartoon (8s)
    genero: 'comedia',
    ritmo: 'medio',
    tomas: tomasFallback,
    continuidad: {
      paletaColores: 'bright_cartoon',
      iluminacion: 'bright_cartoon',
      ambiente: 'playful',
      locacion: 'cartoon_world',
      estiloGeneral: 'cartoon_style'
    }
  };
}
