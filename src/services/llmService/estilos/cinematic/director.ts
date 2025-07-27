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
}

export async function generarNarrativaCinematica(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Cinematic] 🎬 Generando narrativa cinematográfica con IA...');
  
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director
    const especializacionDirector = `
Ahora actúas como el DIRECTOR CINEMATOGRÁFICO del equipo CinemaAI.

Tu responsabilidad es analizar el prompt del usuario y crear una estructura narrativa cinematográfica profesional que sea factible de producir con las herramientas de IA actuales.

DEBES CONSIDERAR:
- Estructura narrativa clásica de 3 actos
- Arco emocional ascendente y coherente
- Momentos de tensión y liberación
- Géneros cinematográficos realistas (drama, acción, misterio, romance, thriller)
- Ritmo apropiado para la duración del video
- Coherencia con las capacidades técnicas de CinemaAI

RESPONDE ÚNICAMENTE con este JSON:
{
  "historia": "resumen conciso de la historia en 2-3 líneas",
  "tono": "dramático|épico|emocional|misterioso|acción|romántico|thriller",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [5, 15, 25],
  "genero": "drama|acción|misterio|romance|thriller|aventura|ciencia_ficcion",
  "ritmo": "lento|medio|rapido"
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

Analiza este prompt y crea una narrativa cinematográfica profesional.`;

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
    ritmo: 'medio'
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
