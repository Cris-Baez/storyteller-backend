import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { randomUUID } from 'crypto';
import { safeLog, hasLargeBase64 } from '../utils/logger.js';

const jobStatus: Record<string, 'pending' | 'done' | 'error'> = {};
const jobResults: Record<string, any> = {};

export async function startJob({ prompt, visualStyle, duration }: any) {
  const jobId = randomUUID();
  jobStatus[jobId] = 'pending';

  // Render en segundo plano
  setImmediate(async () => {
    try {
      const result = await renderCinemaAI({ prompt, visualStyle, duration });
      jobStatus[jobId] = 'done';
      jobResults[jobId] = result;
      
      // Logging seguro del resultado
      if (hasLargeBase64(result)) {
        safeLog(`Job ${jobId} completado con éxito. Resultado (contiene datos base64):`, {
          hasVideo: !!result?.url,
          videoUrl: result?.url ? 'URL presente' : 'No URL',
          dataKeys: result ? Object.keys(result) : [],
          scenes: result?.scenes?.length || 0
        });
      } else {
        safeLog(`Job ${jobId} completado con éxito. Resultado:`, result);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      jobStatus[jobId] = 'error';
      jobResults[jobId] = { error: err.message };
      console.error(`Error en el job ${jobId}:`, err);
    }
  });

  return jobId;
}

export function getJobStatus(jobId: string) {
  return jobStatus[jobId] || 'not_found';
}

export function getJobResult(jobId: string) {
  return jobResults[jobId] || null;
}