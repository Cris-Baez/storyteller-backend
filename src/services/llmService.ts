import { readFile } from 'fs/promises';
// Enriquecer el timeline con reglas visuales automáticas
export async function enrichTimeline(timeline: any[]): Promise<any[]> {
  const rulesRaw = await readFile(require.resolve('../utils/sceneRules.json'), 'utf-8');
  const sceneRules = JSON.parse(rulesRaw);
  return timeline.map((sec) => {
    const rules = sceneRules[sec.emotion] || {};
    return {
      ...sec,
      camera: rules.camera || sec.camera || 'plano medio',
      movement: rules.movement || sec.movement || 'estático',
      lighting: rules.lighting || sec.lighting || 'neutro',
      transition: rules.transition || sec.transition || 'cut',
      music: rules.music || sec.music || 'ambient'
    };
  });
}
// src/services/llmService.ts
/**
 * LLM Service para Storyteller AI (flujo Kling)
 * ---------------------------------------------
 * Genera un VideoPlan con granularidad 1s, eligiendo fondo y actor de una lista fija.
 * El LLM debe devolver para cada segundo el nombre exacto del fondo y actor, y una breve descripción de la escena y la luz.
 */

import { OpenAI } from 'openai';
import { RenderRequest, VideoPlan } from '../utils/types.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { retry } from '../utils/retry.js';

const client = new OpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  baseURL: env.OPENROUTER_BASE_URL,
  defaultHeaders: {
    'HTTP-Referer': env.OPENROUTER_HTTP_REFERER,
    'X-Title': env.OPENROUTER_X_TITLE
  }
});

const TIMEOUT_MS = 120_000;
const RETRIES = 3;

function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_MS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('LLM timeout')), ms))
  ]);
}

// Lista de fondos y actores disponibles (edítala según tus assets locales)
const FONDOS = [
  "escenario_japon_frontal.jpg",
  "escenario_japon_lateral.jpg",
  "escenario_japon_aerea.jpg",
  "escenario_japon_ventana.jpg",
  "escenario_japon_entrada.jpg",
  "escenario_japon_interior.jpg",
  "escenario_japon_noche.jpg",
  "escenario_japon_suelo.jpg"
];
const ACTORES = [
  "actor_prueba_1.jpg"
];

function buildSystemPrompt(visualStyle: string, duration: number, mode: string) {
  return `
Eres un director de cine IA. Debes crear un VideoPlan JSON para un video de ${duration} segundos, usando SOLO los siguientes fondos y actores:

Fondos disponibles:
${FONDOS.map(f=>`- ${f}`).join('\n')}
Actores disponibles:
${ACTORES.map(a=>`- ${a}`).join('\n')}

Para cada segundo (t), elige el fondo y el actor más apropiado de la lista, según la acción, la luz y el ángulo de cámara. Usa exactamente los nombres de archivo. Describe la escena y la iluminación de forma breve y realista. Los movimientos deben ser naturales y fluidos, no exagerados.

Formato JSON ESTRICTO:
{
  "timeline": [
    {
      "t": 0,
      "visual": "Descripción breve de la acción y ambiente",
      "background": "nombre_fondo.png",
      "character": "nombre_actor.png",
      "camera": {"shot": "wide|close-up|...", "movement": "pan|tilt|..."},
      "lighting": "descripción de la luz (ej: luz cálida lateral)"
    }
  ],
  "metadata": {
    "mode": "${mode}",
    "visualStyle": "${visualStyle}",
    "duration": ${duration}
  }
}

NO incluyas texto fuera del JSON. timeline.length debe ser exactamente ${duration}.
`;
}

export async function createVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  const { prompt, mode, visualStyle, duration } = req;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
    throw new Error('El prompt está vacío, no es válido o es demasiado corto');
  }
  const cleanPrompt = prompt.trim().replace(/[^\u0000-\u007f]/g, "");
  logger.info(`🎬 Prompt limpio: ${cleanPrompt.substring(0, 100)}...`);

  const systemPrompt = buildSystemPrompt(visualStyle, duration, mode);
  let raw = '';
  try {
    const res = await withTimeout(
      retry(() =>
        client.chat.completions.create({
          model: 'openai/gpt-4o',
          temperature: 0.6,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: cleanPrompt }
          ]
        }),
        RETRIES
      )
    );
    if (!res.choices || res.choices.length === 0 || !res.choices[0].message.content) {
      throw new Error('La respuesta de la API no contiene contenido válido');
    }
    raw = res.choices[0].message.content;
    logger.info(`📝 Contenido raw: ${raw.substring(0, 200)}...`);
    // Intentar parsear el JSON directamente
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Si el JSON viene con texto extra, intentar extraer el objeto
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else throw new Error('No se pudo extraer JSON válido de la respuesta');
    }
    // Validar timeline
    if (!Array.isArray(parsed.timeline) || parsed.timeline.length !== duration) {
      throw new Error('El timeline generado no es válido o no tiene la duración correcta');
    }
    // Validar que cada segundo tiene fondo y actor
    for (const sec of parsed.timeline) {
      if (!FONDOS.includes(sec.background)) throw new Error(`Fondo inválido: ${sec.background}`);
      if (!ACTORES.includes(sec.character)) throw new Error(`Actor inválido: ${sec.character}`);
    }
    // Enriquecer timeline con reglas visuales automáticas
    const enrichedTimeline = await enrichTimeline(parsed.timeline);
    // Armar VideoPlan
    const plan: VideoPlan = {
      timeline: enrichedTimeline,
      metadata: {
        mode,
        visualStyle,
        duration,
        prompt: cleanPrompt
      }
    };
    logger.info(`🎞️  VideoPlan listo (${duration}s)`);
    return plan;
  } catch (e: any) {
    logger.warn(`❌ LLM falló: ${e.message}`);
    throw new Error('No se pudo generar un VideoPlan válido');
  }
}

// (LIMPIO) No legacy, no duplicados. Sólo la versión moderna y funcional arriba.
