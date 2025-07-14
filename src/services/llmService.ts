// src/services/llmService.ts
/**
 * Storyteller AI · LLM Service v6
 * -------------------------------
 * • Genera un VideoPlan con granularidad 1 s, coherente con los tipos v6
 * • Modelo fallback: gpt-4o → gpt-4-turbo → gpt-3.5-turbo
 * • Self-heal JSON + autocompleta segundos ausentes
 * • Valida timeline.length === duration (10│15│30│45│60 s)
 */

import { OpenAI }      from 'openai';
import { AudioSpec, RenderRequest, VideoPlan, TimelineSecond, AllowedDuration, CameraSpec, CharacterVoiceSpec } from '../utils/types.js';
import { env }     from '../config/env.js';
import { logger }  from '../utils/logger.js';
import { retry }   from '../utils/retry.js';

const client = new OpenAI({
  apiKey:  env.OPENROUTER_API_KEY,
  baseURL: env.OPENROUTER_BASE_URL,
  defaultHeaders: {
    'HTTP-Referer': env.OPENROUTER_HTTP_REFERER,
    'X-Title':      env.OPENROUTER_X_TITLE
  }
});

const MODELS = [
  'openai/gpt-4o',
  'openai/gpt-4o-mini', 
  'anthropic/claude-3-5-sonnet-20241022',
  'openai/gpt-4-turbo',
  'anthropic/claude-3-sonnet'
];
const TIMEOUT_MS  = 120_000; // Aumentado para evitar timeouts frecuentes
const RETRIES     = 3;

/* ——————————————————————————————————————————— */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('LLM timeout')), ms))
  ]);
}

function temperatureByDur(d: AllowedDuration) {
  return d <= 15 ? 0.55 : d <= 30 ? 0.7 : 0.85;
}

/* Self-heal JSON malformado */
async function fixJson(raw: string, model: string): Promise<string> {
  if (!raw || raw.trim() === '') {
    return '{}';
  }

  try {
    JSON.parse(raw);
    return raw;
  } catch {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonMatch[0];

    try {
      const { choices } = await client.chat.completions.create({
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: 'Fix this JSON to be syntactically valid. Return ONLY valid JSON, no explanations.' },
          { role: 'user', content: raw.slice(0, 7000) }
        ]
      });

      if (!choices || choices.length === 0 || !choices[0].message.content) {
        return '{}';
      }

      return choices[0].message.content;
    } catch {
      return '{}';
    }
  }
}

/* Validadores / ayudantes ------------------------------ */
const ALLOWED_SHOTS = ['close-up','medium','wide','first-person','drone','static'];
const ALLOWED_MOVES = ['pan','tilt','zoom','dolly-in','dolly-out','shake','none'];
const ALLOWED_SCENE_MOODS = ['calm','tense','joyful','mysterious','epic','dark'];
const ALLOWED_SOUNDCUES = ['quiet','rise','climax','fade'];

function sanitizeCamera(c: any): CameraSpec {
  const shot = ALLOWED_SHOTS.includes(c?.shot) ? c.shot : 'medium';
  const movement = ALLOWED_MOVES.includes(c?.movement) ? c.movement : 'none';
  return { shot, movement } as CameraSpec;
}

function sanitizeSecond(s: any, t: number): TimelineSecond {
  return {
    t,
    visual: String(s.visual ?? '…'),
    camera: sanitizeCamera(s.camera ?? {}),
    emotion: String(s.emotion ?? 'neutral'),
    dialogue: s.dialogue ? String(s.dialogue) : undefined,
    voiceLine: s.voiceLine ? String(s.voiceLine) : undefined,
    soundCue: ALLOWED_SOUNDCUES.includes(s.soundCue) ? s.soundCue : 'quiet',
    effects: s.effects,
    highlight: !!s.highlight,
    sceneMood: ALLOWED_SCENE_MOODS.includes(s.sceneMood) ? s.sceneMood : undefined,
    transition: ['cut','fade','wipe','none'].includes(s.transition) ? s.transition : 'cut'
  };
}

/* ———————————————————————————————————————————
 *  createVideoPlan – API pública
 * —————————————————————————————————————————— */
export async function createVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  const { prompt, mode, visualStyle, duration, audio } = req;
  const temp = temperatureByDur(duration);

  // Validación del prompt y limpieza
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
    throw new Error('El prompt está vacío, no es válido o es demasiado corto');
  }

  // Limpiar el prompt de caracteres problemáticos
  const cleanPrompt = prompt.trim().replace(/[^\x00-\x7F]/g, "");
  logger.info(`🎬 Prompt limpio: ${cleanPrompt.substring(0, 100)}...`);

  // Función para completar timeline si faltan segundos
  function completeTimeline(timeline: any[], targetDuration: number): any[] {
    if (timeline.length >= targetDuration) {
      return timeline.slice(0, targetDuration);
    }
    
    const completed = [...timeline];
    const lastItem = timeline[timeline.length - 1] || {
      visual: "Continuing scene",
      camera: { shot: "medium", movement: "none" },
      emotion: "neutral",
      soundCue: "quiet"
    };
    
    for (let i = timeline.length; i < targetDuration; i++) {
      completed.push({
        ...lastItem,
        t: i,
        visual: `${lastItem.visual} (continued)`,
        camera: { ...lastItem.camera }
      });
    }
    
    logger.info(`🛠️  Timeline auto-completado a ${targetDuration}s`);
    return completed;
  }

  const SYSTEM = `
You are a world-class film/TV showrunner. You must produce an ULTRA detailed script at 1 second = 1 object in "timeline" array.

CRITICAL REQUIREMENTS:
- You MUST generate EXACTLY ${duration} timeline objects (one for each second)
- Each object represents 1 second of the video
- Timeline must start at t:0 and end at t:${duration-1}
- You MUST respond ONLY with valid JSON, no other text
- Do not include any explanations or text outside the JSON

STRICT JSON FORMAT:

{
 "timeline":[
   {
     "t":0,
     "visual":"exact description...",
     "camera":{"shot":"wide","movement":"dolly-in"},
     "emotion":"wonder",
     "dialogue":"Text ≤15 words",
     "voiceLine":"(optional) VO narration",
     "soundCue":"quiet|rise|climax|fade",
     "effects":"(optional) particles/light",
     "assets":["prop1","prop2"],
     "highlight":false,
     "sceneMood":"epic",
     "transition":"cut|fade|wipe|none"
   }
 ],
 "metadata":{
   "mode":"${mode}",
   "visualStyle":"${visualStyle}",
   "duration":${duration}
 }
}

REMEMBER: timeline.length MUST equal ${duration}. No extra text, no markdown.`;

  // Validar la estructura de la respuesta antes de procesarla
  function validateAndFixResponse(parsed: any, duration: AllowedDuration): any {
    if (!Array.isArray(parsed.timeline)) {
      throw new Error('La respuesta no contiene un array "timeline" válido');
    }
    
    // En lugar de fallar, completar el timeline automáticamente
    if (parsed.timeline.length !== duration) {
      logger.warn(`⚠️  Timeline incompleto (${parsed.timeline.length}/${duration}), completando automáticamente...`);
      parsed.timeline = completeTimeline(parsed.timeline, duration);
    }
    
    return parsed;
  }

  for (const model of MODELS) {
    try {
      logger.info(`🤖 Intentando modelo: ${model}`);
      
      const res = await withTimeout(
        retry(() =>
          client.chat.completions.create({
            model,
            temperature: temp,
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user',   content: cleanPrompt }
            ]
          }),
          RETRIES
        )
      );

      logger.info(`✅ Respuesta recibida de ${model}`);

      // Validar que la respuesta tiene choices
      if (!res.choices || res.choices.length === 0) {
        throw new Error('La respuesta de la API no contiene choices');
      }

      // Validar que el primer choice tiene message
      if (!res.choices[0].message || !res.choices[0].message.content) {
        throw new Error('La respuesta de la API no contiene contenido válido');
      }

      let raw = res.choices[0].message.content;
      logger.info(`📝 Contenido raw: ${raw.substring(0, 200)}...`);
      
      raw = await fixJson(raw, model);
      const parsed = JSON.parse(raw);

      // Validar y arreglar la respuesta antes de procesarla
      const fixedParsed = validateAndFixResponse(parsed, duration);

      const timeline: TimelineSecond[] = fixedParsed.timeline.map((s: any, t: number) => sanitizeSecond(s, t));

      const plan: VideoPlan = {
        timeline,
        metadata: {
          mode,
          visualStyle,
          duration,
          characters: audio?.characters,
          music: audio?.music
        }
      };

      logger.info(`🎞️  VideoPlan listo (${duration}s) via ${model}`);
      return plan;
    } catch (e: any) {
      logger.warn(`❌ LLM ${model} falló: ${e.message}`);
      logger.warn(`❌ Stack trace: ${e.stack}`);
    }
  }

  throw new Error('Todos los modelos LLM fallaron');
}
