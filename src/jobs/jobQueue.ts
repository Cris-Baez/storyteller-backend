import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { randomUUID } from 'crypto';
import { safeLog, hasLargeBase64 } from '../utils/logger.js';

export interface JobState {
  status: 'pending' | 'processing' | 'done' | 'error';
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  errorMessage?: string;
  startTime: number;
  endTime?: number;
  metadata?: any;
}

const jobStates: Record<string, JobState> = {};
const jobResults: Record<string, any> = {};

// Pasos del proceso de generación
const GENERATION_STEPS = [
  'Analizando prompt',
  'Orquestando cerebros',
  'Generando plan cinematográfico',
  'Seleccionando assets',
  'Configurando render',
  'Procesando video',
  'Finalizando'
];

export async function startJob({ prompt, visualStyle, duration }: any) {
  const jobId = randomUUID();
  
  // Inicializar estado del job
  jobStates[jobId] = {
    status: 'pending',
    currentStep: 'Iniciando',
    progress: 0,
    totalSteps: GENERATION_STEPS.length,
    startTime: Date.now(),
    metadata: { prompt, visualStyle, duration }
  };

  safeLog(`[JobQueue] Job ${jobId} iniciado:`, {
    visualStyle,
    duration,
    promptLength: prompt?.length || 0
  });

  // Render en segundo plano
  setImmediate(async () => {
    try {
      // Actualizar estado a procesando
      updateJobState(jobId, {
        status: 'processing',
        currentStep: GENERATION_STEPS[0],
        progress: 5
      });

      const result = await renderCinemaAI(
        { prompt, visualStyle, duration },
        (step: string, progress: number) => {
          // Callback de progreso
          updateJobState(jobId, {
            currentStep: step,
            progress: Math.min(progress, 95) // Reservar 5% para finalización
          });
        }
      );

      // Job completado exitosamente
      updateJobState(jobId, {
        status: 'done',
        currentStep: 'Completado',
        progress: 100,
        endTime: Date.now()
      });

      jobResults[jobId] = result;
      
      // Logging seguro del resultado
      if (hasLargeBase64(result)) {
        safeLog(`[JobQueue] Job ${jobId} completado con éxito. Resultado (contiene datos base64):`, {
          hasVideo: !!result?.url,
          videoUrl: result?.url ? 'URL presente' : 'No URL',
          dataKeys: result ? Object.keys(result) : [],
          scenes: result?.scenes?.length || 0,
          tiempoTotal: jobStates[jobId].endTime! - jobStates[jobId].startTime
        });
      } else {
        safeLog(`[JobQueue] Job ${jobId} completado con éxito. Resultado:`, result);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Job con error
      updateJobState(jobId, {
        status: 'error',
        currentStep: 'Error',
        errorMessage: err.message,
        endTime: Date.now()
      });

      jobResults[jobId] = { error: err.message };
      
      safeLog(`[JobQueue] Error en job ${jobId}:`, {
        error: err.message,
        tiempoAntes: Date.now() - jobStates[jobId].startTime
      });
    }
  });

  return jobId;
}

export function updateJobState(jobId: string, updates: Partial<JobState>) {
  if (jobStates[jobId]) {
    jobStates[jobId] = { ...jobStates[jobId], ...updates };
  }
}

export function getJobStatus(jobId: string): string {
  return jobStates[jobId]?.status || 'not_found';
}

export function getJobState(jobId: string): JobState | null {
  return jobStates[jobId] || null;
}

export function getJobResult(jobId: string) {
  return jobResults[jobId] || null;
}

export function getJobProgress(jobId: string): {
  status: string;
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  errorMessage?: string;
} {
  const state = jobStates[jobId];
  
  if (!state) {
    return { status: 'not_found' };
  }

  return {
    status: state.status,
    currentStep: state.currentStep,
    progress: state.progress,
    totalSteps: state.totalSteps,
    errorMessage: state.errorMessage
  };
}

// Limpiar jobs antiguos (opcionalmente)
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000) { // 24 horas por defecto
  const now = Date.now();
  const jobsToDelete: string[] = [];

  Object.entries(jobStates).forEach(([jobId, state]) => {
    const jobAge = now - state.startTime;
    if (jobAge > maxAgeMs && (state.status === 'done' || state.status === 'error')) {
      jobsToDelete.push(jobId);
    }
  });

  jobsToDelete.forEach(jobId => {
    delete jobStates[jobId];
    delete jobResults[jobId];
  });

  if (jobsToDelete.length > 0) {
    safeLog(`[JobQueue] Limpieza: eliminados ${jobsToDelete.length} jobs antiguos`);
  }
}