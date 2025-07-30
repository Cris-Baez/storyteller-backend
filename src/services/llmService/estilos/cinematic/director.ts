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

export async function generarNarrativaCinematica(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Cinematic] 🎬 Generando narrativa cinematográfica con IA...');
  
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de CinemaAI
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR CINEMATOGRÁFICO de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI NO genera videos desde cero
- Usa fondos pre-generados del CDN (seleccionas de catálogo existente)
- Usa actores pre-generados del CDN (seleccionas de catálogo existente)  
- Kling Elements anima los fondos como tomas en movimiento
- Murf.ai proporciona voces (catálogo existente)
- Freesound.org proporciona música/efectos (catálogo existente)
- FFmpeg renderiza el resultado final

TU TRABAJO COMO DIRECTOR:
✅ Crear estructura narrativa profesional (introducción → desarrollo → clímax → final)
✅ Planificar tomas que tengan continuidad visual y emocional
✅ La primera toma DEBE ser visualmente impactante para captar atención
✅ Asegurar carryover emocional entre tomas (no cortes bruscos)
✅ Pensar en movimientos de cámara factibles para Kling (zoom, pan, tilt)
✅ Mantener coherencia de colores, iluminación y estilo

RESPONDE ÚNICAMENTE con este JSON:
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

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS:
- Crea EXACTAMENTE 3 tomas de 10 segundos cada una (total 30s)
- La PRIMERA toma debe ser visualmente IMPACTANTE para captar atención
- Asegura CONTINUIDAD VISUAL entre las 3 tomas
- Usa movimientos de cámara apropiados para Kling Elements
- Mantén coherencia de paleta de colores y estilo

Analiza este prompt y crea un plan cinematográfico completo de 3 tomas.`;

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
  
  // Fallback estructurado y profesional
  console.log('[Director Cinematic] 🔄 Usando narrativa fallback...');
  return {
    historia: `Historia cinematográfica profesional basada en: ${prompt}`,
    tono: 'dramático',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [5, 15, 25],
    genero: 'drama',
    ritmo: 'medio',
    tomas: [
      {
        numero: 1,
        duracion: 10,
        tipoToma: 'setup',
        descripcion: 'Establecimiento visual impactante - plano general épico',
        movimientoCamara: 'slow_zoom_in',
        estiloVisual: 'cinematico',
        emocion: 'intriga',
        fondo: 'escenario_epico_general',
        actor: 'protagonista_heroico',
        vozMurf: 'masculina_narrativa',
        musica: 'epica_inicio',
        efectosSonoros: 'ambiente_natural',
        carryover: 'inicio'
      },
      {
        numero: 2,
        duracion: 10,
        tipoToma: 'desarrollo',
        descripcion: 'Desarrollo dinámico de la acción',
        movimientoCamara: 'pan_right',
        estiloVisual: 'cinematico',
        emocion: 'tension',
        fondo: 'escenario_epico_accion',
        actor: 'protagonista_accion',
        vozMurf: 'masculina_dramatica',
        musica: 'tension_creciente',
        efectosSonoros: 'movimiento_dinamico',
        carryover: 'continuidad_visual'
      },
      {
        numero: 3,
        duracion: 10,
        tipoToma: 'climax',
        descripcion: 'Momento culminante épico',
        movimientoCamara: 'tilt_up',
        estiloVisual: 'cinematico',
        emocion: 'climax',
        fondo: 'escenario_epico_culminante',
        actor: 'protagonista_heroico',
        vozMurf: 'masculina_epica',
        musica: 'climax_orquestal',
        efectosSonoros: 'impacto_dramatico',
        carryover: 'resolucion'
      }
    ],
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
