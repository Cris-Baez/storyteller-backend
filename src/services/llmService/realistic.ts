import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';
// LLMService especializado para estilo Realista
import { RenderRequest, VideoPlan } from '../../utils/types.js';

export async function generateRealisticVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  if (!req.metadata) req.metadata = {};
  if (!req.metadata.visualStyle) req.metadata.visualStyle = req.visualStyle || 'realistic';
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'realistic';
  const userPrompt = req.prompt || '';
  const systemPrompt = `
  # INSTRUCCIONES ESTRICTAS PARA EL LLM:
  - Devuelve SIEMPRE un objeto JSON con la siguiente estructura exacta:
    {
      "timeline": [
        {
          "t": 0,
          "backgroundPrompt": "...",
          "actorPrompt": "...",
          "visual": "...",
          "camera": "...",
          "lighting": "...",
          "colorPalette": "...",
          "composition": "...",
          "atmosphere": "...",
          "effects": "...",
          "emotion": "...",
          "music": { "mood": "...", "trackId": "..." },
          "dialogo": "...",
          "voz": "...",
          "lipSync": "...",
          "overlays": [],
          "luts": [],
          "soundCue": "...",
          "transition": "...",
          "carryover": false,
          "audioCarryover": false,
          "faceAnimation": "..."
        }, ...
      ],
      "visualStyle": "realistic"
    }
  - NO uses otros nombres de campo ni anides la timeline en otro objeto.
  - Si algún campo no aplica, pon un string vacío o valor por defecto.
  - No devuelvas arrays de objetos con campos distintos ni anidados.
  - No devuelvas videoPlan, solo timeline y visualStyle en la raíz.
      "music": "piano suave",
      "fx": ["ruido de ciudad", "tazas"],
      "transition": "fade",
      "carryover": false,
      "audioCarryover": false
    },
    {
      "t": 5,
      "scene": "departamento_luz_natural",
      "camera": { "shot": "close-up", "movement": "static" },
      "visual": "Primer plano del rostro del personaje, expresión de duda mientras mira por la ventana.",
      "emotion": "duda",
      "dialogue": "",
      "voiceLine": "¿Y si todo sale mal?",
      "music": "piano suave",
      "fx": ["ruido de ciudad"],
      "transition": "cut",
      "carryover": true, // Mismo fondo y actor que la escena anterior
      "audioCarryover": true, // La música y ambiente continúan
      "faceAnimation": "sadtalker" // Primer plano con expresión facial y diálogo
    },
    {
      "t": 10,
      "scene": "calle_centro",
      "camera": { "shot": "medium", "movement": "pan" },
      "visual": "El personaje camina por la calle, rodeado de gente.",
      "emotion": "ansiedad",
      "dialogue": "",
      "voiceLine": "",
      "music": "piano suave",
      "fx": ["tráfico"],
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
- Los fondos y actores deben tener sentido en secuencia (ej: casa → calle → trabajo → regreso), y se debe indicar cuándo se reutilizan para continuidad.
- Las emociones deben evolucionar (no saltar de calma a angustia sin contexto).
- Las tomas deben estar planificadas como en una película realista (estableces el lugar, luego el detalle, luego el personaje o acción).
- Indica si hay cambio de fondo (corte), carryover visual, o es la misma escena desde otro ángulo.
- Si hay movimientos de cámara, deben ser naturales y coordinados con la acción y el estado emocional.
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
      // Forzar metadata en el objeto raíz
      if (!videoPlan.visualStyle) videoPlan.visualStyle = req.metadata?.visualStyle || 'realistic';
      // Adaptar automáticamente videoPlan a timeline si es necesario
      if (!videoPlan.timeline && Array.isArray(videoPlan.videoPlan)) {
        videoPlan.timeline = videoPlan.videoPlan;
      }
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
