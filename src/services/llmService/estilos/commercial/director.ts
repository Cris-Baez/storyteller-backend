// estilos/commercial/director.ts - Cerebro Director Commercial
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

export async function generarNarrativaCommercial(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Commercial] 🎬 Generando narrativa comercial con IA...');
  
  try {
    // ✅ PASO 1: Cargar assets reales antes de planificar
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('commercial');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('commercial');
    
    const systemBase = await cargarSystemPromptBase();
    
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR COMERCIAL de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI NO genera videos desde cero
- Usa fondos pre-generados del CDN (seleccionas de catálogo existente)
- Usa actores pre-generados del CDN (seleccionas de catálogo existente)  
- Kling Elements anima los fondos como tomas en movimiento
- Murf.ai proporciona voces (catálogo existente)
- Freesound.org proporciona música/efectos (catálogo existente)
- FFmpeg renderiza el resultado final

TU TRABAJO COMO DIRECTOR COMERCIAL:
✅ Crear estructura narrativa comercial (hook → demostración → beneficios → call to action)
✅ Planificar tomas con ENFOQUE EN PRODUCTO y PERSUASIÓN
✅ La primera toma DEBE CAPTURAR ATENCIÓN (hook comercial)
✅ Clips de 6 segundos (ritmo comercial profesional)
✅ Movimientos de cámara profesionales (smooth, product-focused)
✅ Transiciones que mantienen engagement
✅ USAR ÚNICAMENTE assets del CDN disponibles (ver lista abajo)

FONDOS DISPONIBLES EN CDN COMMERCIAL:
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.tipo}/${f.lugar}/${f.variante}/${f.ambiente} (${f.tags.join(', ')})`).join('\n')}
... y ${fondosDisponibles.length - 20} más fondos commercial

ACTORES DISPONIBLES EN CDN COMMERCIAL:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.personaje} (${a.edad}, ${a.personalidad})`).join('\n')}
... y ${actoresDisponibles.length - 10} más actores commercial

RESPONDE ÚNICAMENTE con este JSON:
{
  "historia": "resumen conciso del mensaje comercial en 2-3 líneas",
  "tono": "profesional|persuasivo|confiable|innovador|premium|accesible",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [6, 18, 24],
  "genero": "comercial|publicitario|corporativo|producto|servicio|marca",
  "ritmo": "medio",
  "tomas": [
    {
      "numero": 1,
      "duracion": 6,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma comercial",
      "movimientoCamara": "smooth_professional|product_focus|brand_reveal|professional_pan",
      "estiloVisual": "commercial|professional|branded",
      "emocion": "confident|trustworthy|innovative|premium|accessible",
      "fondo": "USAR RUTA EXACTA DEL CDN: tipo/lugar/variante/ambiente",
      "actor": "USAR PERSONAJE EXACTO DEL CDN",
      "vozMurf": "profesional_comercial|confiable_marca|innovador_tech",
      "musica": "corporate_theme|brand_music|professional_bg|upbeat_commercial",
      "efectosSonoros": "professional_ambient|product_sounds|corporate_sfx",
      "carryover": "descripcion_de_continuidad_comercial"
    }
  ],
  "continuidad": {
    "paletaColores": "brand_colors|professional|clean|modern|premium",
    "iluminacion": "professional_bright|clean_commercial|brand_lighting",
    "ambiente": "professional|trustworthy|innovative|premium",
    "locacion": "commercial_setting|professional_environment|brand_space",
    "estiloGeneral": "commercial_style|professional_aesthetic|brand_focused"
  }
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS COMERCIAL:
- Crea EXACTAMENTE 5 tomas de 6 segundos cada una (total 30s) - RITMO COMERCIAL PROFESIONAL
- La PRIMERA toma debe ser un HOOK COMERCIAL PODEROSO
- Asegura CONTINUIDAD DE MARCA entre las tomas
- Usa movimientos de cámara PROFESIONALES para comercial
- Mantén paleta de colores CONSISTENTE CON LA MARCA
- Enfoque en PRODUCTO/SERVICIO y CALL TO ACTION

Analiza este prompt y crea un plan comercial completo de 5 tomas profesionales.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '',
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Commercial] ✅ Narrativa comercial generada exitosamente');
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Commercial] ❌ Error generando narrativa:', error);
  }
  
  // Fallback comercial
  console.log('[Director Commercial] 🔄 Usando narrativa comercial fallback...');
  return {
    historia: `Mensaje comercial profesional basado en: ${prompt}`,
    tono: 'profesional',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [6, 18, 24],
    genero: 'comercial',
    ritmo: 'medio',
    tomas: [
      {
        numero: 1,
        duracion: 6,
        tipoToma: 'setup',
        descripcion: 'Professional commercial hook with strong brand introduction',
        movimientoCamara: 'smooth_professional',
        estiloVisual: 'commercial',
        emocion: 'confident',
        fondo: 'professional_brand_setting',
        actor: 'commercial_talent',
        vozMurf: 'profesional_comercial',
        musica: 'corporate_theme',
        efectosSonoros: 'professional_ambient',
        carryover: 'brand_introduction'
      },
      {
        numero: 2,
        duracion: 6,
        tipoToma: 'desarrollo',
        descripcion: 'Product demonstration with clear benefits showcase',
        movimientoCamara: 'product_focus',
        estiloVisual: 'commercial',
        emocion: 'trustworthy',
        fondo: 'product_demo_setting',
        actor: 'demonstrating_talent',
        vozMurf: 'confiable_marca',
        musica: 'professional_bg',
        efectosSonoros: 'product_sounds',
        carryover: 'product_focus'
      },
      {
        numero: 3,
        duracion: 6,
        tipoToma: 'desarrollo',
        descripcion: 'Customer satisfaction and testimonial moment',
        movimientoCamara: 'professional_pan',
        estiloVisual: 'commercial',
        emocion: 'satisfied',
        fondo: 'customer_environment',
        actor: 'satisfied_customer',
        vozMurf: 'innovador_tech',
        musica: 'upbeat_commercial',
        efectosSonoros: 'positive_ambient',
        carryover: 'customer_satisfaction'
      },
      {
        numero: 4,
        duracion: 6,
        tipoToma: 'climax',
        descripcion: 'Strong value proposition and key benefits highlight',
        movimientoCamara: 'brand_reveal',
        estiloVisual: 'commercial',
        emocion: 'innovative',
        fondo: 'value_showcase_setting',
        actor: 'confident_presenter',
        vozMurf: 'profesional_comercial',
        musica: 'brand_music',
        efectosSonoros: 'impact_sounds',
        carryover: 'value_emphasis'
      },
      {
        numero: 5,
        duracion: 6,
        tipoToma: 'cierre',
        descripcion: 'Powerful call to action with brand closing',
        movimientoCamara: 'smooth_professional',
        estiloVisual: 'commercial',
        emocion: 'compelling',
        fondo: 'call_to_action_setting',
        actor: 'closing_talent',
        vozMurf: 'confiable_marca',
        musica: 'corporate_theme',
        efectosSonoros: 'corporate_sfx',
        carryover: 'call_to_action'
      }
    ],
    continuidad: {
      paletaColores: 'professional_brand',
      iluminacion: 'professional_bright',
      ambiente: 'professional',
      locacion: 'commercial_setting',
      estiloGeneral: 'commercial_style'
    }
  };
}
