import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';
// LLMService especializado para estilo Anime
import { RenderRequest, VideoPlan } from '../../utils/types.js';

export async function generateAnimeVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  if (!req.metadata) req.metadata = {};
  if (!req.metadata.visualStyle) req.metadata.visualStyle = req.visualStyle || 'anime';
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'anime';
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
      "visualStyle": "anime"
    }
  - NO uses otros nombres de campo ni anides la timeline en otro objeto.
  - Si algún campo no aplica, pon un string vacío o valor por defecto.
  - No devuelvas arrays de objetos con campos distintos ni anidados.
  - No devuelvas videoPlan, solo timeline y visualStyle en la raíz.
      "voiceLine": "¿Por qué siento que hoy todo cambiará?",
      "music": "j-pop suave",
      "fx": ["viento", "campana escolar"],
      "transition": "fade",
      "carryover": false,
      "audioCarryover": false
    },
    {
      "t": 5,
      "scene": "aula_soleada",
      "camera": { "shot": "close-up", "movement": "static" },
      "visual": "Primer plano anime de la protagonista, ojos brillantes y expresión de sorpresa.",
      "emotion": "sorpresa",
      "dialogue": "",
      "voiceLine": "¡No puede ser!",
      "music": "j-pop suave",
      "fx": ["viento"],
      "transition": "cut",
      "carryover": true, // Mismo fondo y personaje que la escena anterior
      "audioCarryover": true, // Música y ambiente continúan
      "faceAnimation": "sadtalker" // Primer plano anime con expresión intensa
    },
    {
      "t": 10,
      "scene": "pasillo_escuela",
      "camera": { "shot": "medium", "movement": "pan" },
      "visual": "La protagonista corre por el pasillo, la cámara la sigue.",
      "emotion": "urgencia",
      "dialogue": "",
      "voiceLine": "",
      "music": "j-pop suave",
      "fx": ["pasos"],
      "transition": "speedline",
      "carryover": false,
      "audioCarryover": true,
      "lipSync": "wav2lip" // Plano medio, solo sincronización labial si hay voz
    },
    ...
  ]
}

📌 Reglas obligatorias:
- La historia debe tener introducción, desarrollo, clímax y cierre (aunque sea corto).
- Los fondos y personajes deben tener sentido en secuencia (ej: casa → escuela → parque → atardecer), y se debe indicar cuándo se reutilizan para continuidad.
- Las emociones deben evolucionar (no saltar de alegría a tristeza sin contexto).
- Las tomas deben estar planificadas como en una serie anime (estableces el lugar, luego el detalle, luego el personaje o acción).
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
      if (!videoPlan.visualStyle) videoPlan.visualStyle = req.metadata?.visualStyle || 'anime';
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
