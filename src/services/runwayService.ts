// src/services/runwayService.ts
// Servicio para generar video con Runway Gen-4 Turbo (imagen→video)
import RunwayML from '@runwayml/sdk';
import { env } from '../config/env.js';

const client = new RunwayML({
  apiKey: env.RUNWAY_API_TOKEN || env.RUNWAYML_API_SECRET || '',
});

/**
 * Genera un video usando Runway Gen-4 Turbo
 * @param {Object} opts
 * @param {string} opts.promptImage - URL o data-URI de la imagen base
 * @param {string} opts.promptText - Descripción de la escena
 * @param {string} [opts.model] - Modelo a usar (default: gen4_turbo)
 * @param {string} [opts.ratio] - Resolución ("1280:720" o "768:1280")
 * @param {number} [opts.duration] - Duración en segundos
 * @returns {Promise<string>} URL del video generado
 */
export async function generateRunwayVideo({
  promptImage,
  promptText,
  model = 'gen4_turbo',
  ratio = '1280:720',
  duration = 5,
}: {
  promptImage: string;
  promptText: string;
  model?: 'gen4_turbo' | 'gen3a_turbo';
  ratio?: '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672' | '1280:768' | '768:1280';
  duration?: 5 | 10;
}): Promise<string> {
  const task = await client.imageToVideo.create({
    model,
    promptImage,
    promptText,
    ratio,
    duration,
  }).waitForTaskOutput();
  // Puede devolver { output: { url: string } } o { output: string[] }
  if (Array.isArray((task as any).output)) {
    if ((task as any).output.length > 0 && typeof (task as any).output[0] === 'string') {
      return (task as any).output[0];
    }
    throw new Error('Runway no devolvió URL de video');
  }
  if ((task as any).output?.url) {
    return (task as any).output.url;
  }
  throw new Error('Runway no devolvió URL de video');
}
