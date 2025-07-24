// LLMService especializado para estilo Cinematic
import { RenderRequest, VideoPlan } from '../../utils/types.js';
import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';

export async function generateCinematicVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  if (!req.metadata) req.metadata = {};
  if (!req.metadata.visualStyle) req.metadata.visualStyle = req.visualStyle || 'cinematic';
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'cinematic';
  const userPrompt = req.prompt || '';
  const systemPrompt = `
      "visual": "El personaje camina lentamente hacia el templo por el costado. El atardecer crea sombras largas.",
      "emotion": "melancholy",
      "dialogue": "",
      "voiceLine": "En ese lugar empezó todo...",
      "music": "piano emocional",
      "fx": ["birds", "wind"],
      "transition": "fade",
      "carryover": false,
      "audioCarryover": false
    },
    {
      "t": 5,
      "scene": "templo_japones_entrada_lateral",
      "camera": { "shot": "close-up", "movement": "static" },
      "visual": "Primer plano del rostro del personaje, la emoción cambia a determinación.",
      "emotion": "determinación",
      "dialogue": "",
      "voiceLine": "Debo entrar, no hay vuelta atrás...",
      "music": "piano emocional",
      "fx": ["birds"],
      "transition": "cut",
      "carryover": true, // Mismo fondo y actor que la escena anterior
      "audioCarryover": true, // La música y ambiente continúan sin corte
      "faceAnimation": "sadtalker" // Primer plano con expresión facial y diálogo visible
    },
    {
      "t": 10,
      "scene": "templo_japones_interior",
      "camera": { "shot": "medium", "movement": "pan" },
      "visual": "El personaje entra al templo, la cámara sigue su movimiento.",
      "emotion": "tensión",
      "dialogue": "",
      "voiceLine": "",
      "music": "piano emocional",
      "fx": ["puerta"],
      "transition": "fade",
      "carryover": false,
      "audioCarryover": true,
      "lipSync": "wav2lip" // Plano medio, solo sincronización labial si hay voz
    },
    ...
  ]
}

📌 Reglas obligatorias:
- La historia debe tener introducción, desarrollo, clímax y cierre (aunque sea corto).
- Los fondos y actores deben tener sentido en secuencia (ej: entrada → pasillo → interior), y se debe indicar cuándo se reutilizan para continuidad.
- Las emociones deben evolucionar (no saltar de feliz a tristeza sin contexto).
- Las tomas deben estar planificadas como en una escena real de cine (ej: estableces el lugar, luego un detalle, luego el personaje).
- Debes indicar si hay cambio de fondo (corte), carryover visual, o es la misma escena desde otro ángulo.
- Si hay movimientos en Kling, deben ser naturales y coordinados con el fondo y la continuidad visual.
- Si la música, efectos o voz continúan entre escenas, usa "audioCarryover": true.
- Si la escena requiere animación facial avanzada, usa "faceAnimation": "sadtalker". Si solo requiere sincronización labial, usa "lipSync": "wav2lip".

🎯 Tu output final debe ser un JSON tipo VideoPlan válido para ${duration} segundos, con campos de carryover, audioCarryover, faceAnimation y lipSync cuando corresponda.
NO EXCEDAS la duración ni generes segundos vacíos.
`;

  // Modelos de fallback en orden de preferencia
  const models = [
    req.metadata?.llmModel,
    'openai/chatgpt-4o-latest',
    'openai/gpt-4',
    'openai/gpt-3.5-turbo',
    'google/gemini-pro',
    'anthropic/claude-3-opus',
    'mistral/mistral-large',
  ].filter(Boolean);

  let llmResponse: string | undefined;
  let lastError: any;
  const timeout = 300000; // 300 segundos (5 minutos)
  for (const model of models) {
    try {
      llmResponse = await callOpenRouter(systemPrompt, userPrompt, model, timeout);
      if (!llmResponse) throw new Error('Respuesta vacía del modelo: ' + model);
      const videoPlan = extractFirstJsonBlock(llmResponse as string, { returnParsed: true, debug: true }) as VideoPlan;
      if (!videoPlan) {
        console.error('[LLMService] No se encontró bloque JSON en la respuesta:', llmResponse);
        throw new Error('No se encontró bloque JSON en la respuesta del modelo.');
      }
      if (!videoPlan.visualStyle) videoPlan.visualStyle = req.metadata?.visualStyle || 'cinematic';
      // ...existing code...
      if (!videoPlan.timeline || !Array.isArray(videoPlan.timeline) || !videoPlan.timeline[0]) {
        console.error('[LLMService] VideoPlan inválido o timeline vacío:', videoPlan);
        throw new Error('El modelo no devolvió un VideoPlan válido.');
      }
      return videoPlan;
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw new Error('Error al generar el VideoPlan con los modelos disponibles: ' + lastError);
}
