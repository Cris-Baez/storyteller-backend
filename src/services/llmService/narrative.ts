import { callOpenRouter } from './openRouterUtil.js';
import { extractFirstJsonBlock } from './extractJsonUtil.js';
// LLMService especializado para estilo Narrativo
import { RenderRequest, VideoPlan } from '../../utils/types.js';

export async function generateNarrativeVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  if (!req.metadata) req.metadata = {};
  if (!req.metadata.visualStyle) req.metadata.visualStyle = req.visualStyle || 'narrative';
  const duration = req.duration || 30;
  const style = req.metadata.visualStyle || 'narrative';
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
      "visualStyle": "narrative"
    }
  - NO uses otros nombres de campo ni anides la timeline en otro objeto.
  - Si algún campo no aplica, pon un string vacío o valor por defecto.
  - No devuelvas arrays de objetos con campos distintos ni anidados.
  - No devuelvas videoPlan, solo timeline y visualStyle en la raíz.
      "voiceLine": "Cada historia tiene un origen...",
      "music": "instrumental suave",
      "fx": ["pasos", "páginas"],
      "transition": "fade",
      "carryover": false,
      "audioCarryover": false
    },
    {
      "t": 5,
      "scene": "biblioteca_antigua",
      "camera": { "shot": "close-up", "movement": "static" },
      "visual": "Primer plano del narrador, expresión de asombro mientras abre un libro antiguo.",
      "emotion": "asombro",
      "dialogue": "",
      "voiceLine": "Lo que encontré cambiaría todo...",
      "music": "instrumental suave",
      "fx": ["páginas"],
      "transition": "cut",
      "carryover": true, // Mismo fondo y narrador que la escena anterior
      "audioCarryover": true, // Música y ambiente continúan
      "faceAnimation": "sadtalker" // Primer plano con expresión facial y diálogo
    },
    {
      "t": 10,
      "scene": "sala_investigacion",
      "camera": { "shot": "medium", "movement": "pan" },
      "visual": "El narrador muestra documentos a cámara, tono didáctico.",
      "emotion": "interés",
      "dialogue": "",
      "voiceLine": "",
      "music": "instrumental suave",
      "fx": ["papeles"],
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
- Los fondos y narradores deben tener sentido en secuencia (ej: inicio → desarrollo → descubrimiento → cierre), y se debe indicar cuándo se reutilizan para continuidad.
- Las emociones deben evolucionar (no saltar de misterio a alegría sin contexto).
- Las tomas deben estar planificadas como en un documental o relato profesional (estableces el lugar, luego el detalle, luego el personaje o narrador).
- Indica si hay cambio de fondo (corte), carryover visual, o es la misma escena desde otro ángulo.
- Si hay movimientos de cámara, deben ser naturales y coordinados con la acción y el mensaje.
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
      // 1. Primera llamada al LLM para generar el plan
      llmResponse = await callOpenRouter(systemPrompt, userPrompt, model, timeout);
      if (!llmResponse) throw new Error('Respuesta vacía del modelo: ' + model);
      const rawResponse = llmResponse as string;

      // 2. Segunda llamada para forzar JSON válido con timeline y visualStyle
      const transformSystemPrompt = `# JSON TRANSFORMER
Devuelve exclusivamente un objeto JSON válido con la siguiente estructura exacta:
{
  "timeline": [ /* array de escenas */ ],
  "visualStyle": "${style}"
}
Sin texto adicional.`;
      const transformUserPrompt = `Por favor, toma la siguiente respuesta del modelo y devuélvela SOLO como JSON válido con los campos "timeline" y "visualStyle":

${rawResponse}`;
      const rectifyResponse = await callOpenRouter(transformSystemPrompt, transformUserPrompt, model, timeout);
      const videoPlan = extractFirstJsonBlock(rectifyResponse as string, { returnParsed: true, debug: true }) as VideoPlan;

      if (!videoPlan) {
        console.error('[LLMService] No se encontró bloque JSON en la respuesta:', llmResponse);
        throw new Error('No se encontró bloque JSON en la respuesta del modelo.');
      }

      // --- BLINDAJE Y NORMALIZACIÓN DEL PLAN ---
      // 1. Forzar el visualStyle correcto para evitar el error de validación más común.
      if (!videoPlan.visualStyle) {
        videoPlan.visualStyle = style; // Usar el estilo de la petición original.
      }

      // 2. Adaptar automáticamente la estructura si el LLM usa 'videoPlan' en lugar de 'timeline'.
      if (!videoPlan.timeline && (videoPlan as any).videoPlan) {
        videoPlan.timeline = (videoPlan as any).videoPlan;
        delete (videoPlan as any).videoPlan;
      }

      // 3. Validar que el timeline exista y sea un array con contenido.
      if (!videoPlan.timeline || !Array.isArray(videoPlan.timeline) || videoPlan.timeline.length === 0) {
        console.error('[LLMService] VideoPlan inválido o timeline vacío tras normalización:', videoPlan);
        throw new Error('El modelo no devolvió un timeline válido y con contenido.');
      }

      // --- BLINDAJE FINAL: Forzar visualStyle antes de retornar ---
      if (!videoPlan.visualStyle) {
        videoPlan.visualStyle = style;
      }

      return videoPlan;
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw new Error('Error al generar el VideoPlan con los modelos disponibles: ' + lastError);
}
