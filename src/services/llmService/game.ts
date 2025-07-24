import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';
// LLMService especializado para estilo Gaming
import { RenderRequest, VideoPlan } from '../../utils/types.js';

export async function generateGameVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  if (!req.metadata) req.metadata = {};
  if (!req.metadata.visualStyle) req.metadata.visualStyle = req.visualStyle || 'game';
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'game';
  const userPrompt = req.prompt || '';
  const systemPrompt = `
      "voiceLine": "¡Es hora de la batalla final!",
      "music": "electrónica intensa",
      "fx": ["aplausos", "explosiones"],
      "transition": "cut",
      "carryover": false,
      "audioCarryover": false
    },
    {
      "t": 5,
      "scene": "arena_principal",
      "camera": { "shot": "close-up", "movement": "static" },
      "visual": "Primer plano del personaje, expresión de concentración antes del combate.",
      "emotion": "concentración",
      "dialogue": "",
      "voiceLine": "No puedo fallar ahora...",
      "music": "electrónica intensa",
      "fx": ["aplausos"],
      "transition": "cut",
      "carryover": true, // Mismo fondo y personaje que la escena anterior
      "audioCarryover": true, // Música y ambiente continúan
      "faceAnimation": "sadtalker" // Primer plano con expresión facial y diálogo
    },
    {
      "t": 10,
      "scene": "boss_room",
      "camera": { "shot": "medium", "movement": "pan" },
      "visual": "El personaje avanza hacia el jefe final, la cámara lo sigue.",
      "emotion": "tensión",
      "dialogue": "",
      "voiceLine": "",
      "music": "electrónica intensa",
      "fx": ["pasos"],
      "transition": "glitch",
      "carryover": false,
      "audioCarryover": true,
      "lipSync": "wav2lip" // Plano medio, solo sincronización labial si hay voz
    },
    ...
  ]
}

📌 Reglas obligatorias:
- La historia debe tener introducción, desarrollo, clímax y cierre (aunque sea corto).
- Los fondos y personajes deben tener sentido en secuencia (ej: lobby → arena → boss room), y se debe indicar cuándo se reutilizan para continuidad.
- Las emociones deben evolucionar (no saltar de euforia a derrota sin contexto).
- Las tomas deben estar planificadas como en una cinemática de videojuego (estableces el lugar, luego un detalle, luego el personaje o acción).
- Indica si hay cambio de fondo (corte), carryover visual, o es la misma escena desde otro ángulo.
- Si hay movimientos de cámara, deben ser naturales y coordinados con la acción del juego.
- Si la música, efectos o voz continúan entre escenas, usa "audioCarryover": true.
- Si la escena requiere animación facial avanzada, usa "faceAnimation": "sadtalker". Si solo requiere sincronización labial, usa "lipSync": "wav2lip".

🎯 Tu output final debe ser un JSON tipo VideoPlan válido para ${duration} segundos, con campos de carryover, audioCarryover, faceAnimation y lipSync cuando corresponda.
NO EXCEDAS la duración ni generes segundos vacíos.
`;
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
      if (!videoPlan.visualStyle) videoPlan.visualStyle = req.metadata?.visualStyle || 'game';
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
