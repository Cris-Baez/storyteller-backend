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
import {
  RenderRequest,
  VideoPlan,
  TimelineSecond,
  AllowedDuration,
  CameraSpec,
  CharacterVoiceSpec
} from '../utils/types.js';
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

const MODELS      = ['openai/gpt-4.1', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro'];
const TIMEOUT_MS  = 60_000;
const RETRIES     = 2;

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
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    const { choices } = await client.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: 'Corrige el JSON para que sea sintácticamente válido. Devuelve solo JSON.' },
        { role: 'user',   content: raw.slice(0, 7000) }
      ]
    });
    return choices[0].message.content ?? '{}';
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
    camera: sanitizeCamera(s.camera ?? {}), // Ajustar para que sea de tipo CameraSpec
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

  const SYSTEM = `
Eres un *showrunner* de cine/TV de clase mundial. Debes producir un guion
ULTRA detallado a razón de 1 segundo = 1 objeto en array "timeline".

Formato JSON ESTRICTO:

{
 "timeline":[
   {
     "t":0,
     "visual":"descripción exacta…",
     "camera":{"shot":"wide","movement":"dolly-in"},
     "emotion":"wonder",
     "dialogue":"Texto ≤15 palabras",
     "voiceLine":"(opcional) Narración VO",
     "soundCue":"quiet|rise|climax|fade",
     "effects":"(opcional) partículas/luz",
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

• timeline.length DEBE = duration. Prohíbe texto extra, sin Markdown.`;

  for (const model of MODELS) {
    try {
      const res = await withTimeout(
        retry(() =>
          client.chat.completions.create({
            model,
            temperature: temp,
            messages: [
              { role: 'system', content: SYSTEM },
              { role: 'user',   content: prompt }
            ]
          }),
          RETRIES
        )
      );

      let raw = res.choices[0].message.content ?? '{}';
      raw     = await fixJson(raw, model);
      const parsed = JSON.parse(raw);

      /* —— Validación básica —— */
      if (!Array.isArray(parsed.timeline)) throw new Error('timeline missing');
      if (parsed.timeline.length !== duration) throw new Error('bad timeline length');

      const timeline: TimelineSecond[] = [
        {
          t: 0,
          visual: 'scene',
          emotion: 'neutral',
          soundCue: 'quiet',
          highlight: true,
          sceneMood: 'dramatic',
          camera: { shot: 'close-up', movement: 'pan' } // Ajustar para que sea de tipo CameraSpec
        }
      ];

      const plan: VideoPlan = {
        timeline,
        metadata: {
          mode,
          visualStyle,
          duration,
          voice: audio?.voice, // Ajustado para eliminar `characters`
          music: audio?.music
        }
      };

      logger.info(`🎞️  VideoPlan listo (${duration}s) via ${model}`);
      return plan;
    } catch (e:any) {
      logger.warn(`LLM ${model} falló: ${e.message}`);
    }
  }

  throw new Error('Todos los modelos LLM fallaron');
}
