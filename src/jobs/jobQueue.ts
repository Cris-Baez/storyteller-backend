import { runRenderPipeline } from '../pipelines/renderPipeline.js';

const jobStatus: Record<string, 'pending' | 'done' | 'error'> = {};
const jobResults: Record<string, any> = {};

export async function startJob({ prompt, mode, visualStyle, duration }: any) {
  const jobId = crypto.randomUUID();
  jobStatus[jobId] = 'pending';

  // Render en segundo plano
  setImmediate(async () => {
    try {
      const result = await runRenderPipeline({ prompt, mode, visualStyle, duration });
      jobStatus[jobId] = 'done';
      jobResults[jobId] = result;
      console.log(`Job ${jobId} completado con éxito. Resultado:`, result);
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
