// estilos/cinematic/director.ts - Cerebro Director Cinematográfico

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';

type ActoNarrativo = 'setup' | 'desarrollo' | 'climax' | 'cierre';

export interface NarrativaCinematica {
  historia: string;
  tono: string;
  estructura: ActoNarrativo[];
  momentosEmocionales: number[];
}

export async function generarNarrativaCinematica(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Cinematic] Generando narrativa base...');
  
  const promptLLM = `Como DIRECTOR CINEMATOGRÁFICO profesional, analiza este prompt y crea una estructura narrativa:

PROMPT DEL USUARIO: "${prompt}"

Crea una respuesta JSON con:
{
  "historia": "resumen de la historia en 2-3 líneas",
  "tono": "dramático|épico|emocional|misterioso|acción",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [5, 15, 25] // segundos donde hay picos emocionales
}

PRINCIPIOS CINEMATOGRÁFICOS:
- Estructura de 3 actos clara
- Arco emocional ascendente
- Momentos de tensión y liberación
- Coherencia narrativa

Responde SOLO con el JSON, sin texto adicional.`;

  try {
    const response = await callOpenRouter(
      'Eres un director cinematográfico profesional especializado en narrativa.',
      promptLLM,
      'openai/chatgpt-4o-latest',
      60000
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Cinematic] Narrativa generada exitosamente');
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Cinematic] Error generando narrativa:', error);
  }
  
  // Fallback estructurado
  return {
    historia: `Historia cinematográfica basada en: ${prompt}`,
    tono: 'dramático',
        estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [5, 15, 25] // Momentos por defecto
  };
}

export function aplicarEstructuraNarrativa(
  timeline: any[], 
  narrativa: any, 
  duracion: number
): any[] {
  return timeline.map((segundo, index) => {
    const progreso = index / duracion;
    let acto = 'desarrollo';
    
    if (progreso <= 0.25) acto = 'setup';
    else if (progreso <= 0.75) acto = 'desarrollo';
    else if (progreso <= 0.90) acto = 'climax';
    else acto = 'cierre';
    
    const esMomentoEmocional = narrativa.momentosEmocionales.includes(index);
    
    return {
      ...segundo,
      acto,
      tono: narrativa.tono,
      esEmocional: esMomentoEmocional,
      visual: `${segundo.visual} (${acto} - ${narrativa.tono})`
    };
  });
}
