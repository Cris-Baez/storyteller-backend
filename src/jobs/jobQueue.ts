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

// Thread-safe job storage con locks
const jobStates: Record<string, JobState> = {};
const jobResults: Record<string, any> = {};
const jobLocks: Record<string, boolean> = {}; // Simple mutex por job

// Función thread-safe para actualizar estado
function atomicUpdateJobState(jobId: string, updates: Partial<JobState>): void {
  // Simple mutex check
  while (jobLocks[jobId]) {
    // Esperar que termine la operación anterior
    continue;
  }
  
  jobLocks[jobId] = true;
  try {
    if (jobStates[jobId]) {
      jobStates[jobId] = { ...jobStates[jobId], ...updates };
    }
  } finally {
    delete jobLocks[jobId];
  }
}

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
      atomicUpdateJobState(jobId, {
        status: 'processing',
        currentStep: GENERATION_STEPS[0],
        progress: 5
      });

      const result = await renderCinemaAI(
        { prompt, visualStyle, duration },
        (step: string, progress: number) => {
          // Callback de progreso thread-safe
          atomicUpdateJobState(jobId, {
            currentStep: step,
            progress: Math.min(progress, 95) // Reservar 5% para finalización
          });
        }
      );

      // Job completado exitosamente
      atomicUpdateJobState(jobId, {
        status: 'done',
        currentStep: 'Completado',
        progress: 100,
        endTime: Date.now()
      });

      // Thread-safe result storage
      while (jobLocks[jobId + '_result']) continue;
      jobLocks[jobId + '_result'] = true;
      try {
        jobResults[jobId] = result;
      } finally {
        delete jobLocks[jobId + '_result'];
      }
      
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
      atomicUpdateJobState(jobId, {
        status: 'error',
        currentStep: 'Error',
        errorMessage: err.message,
        endTime: Date.now()
      });

      // Thread-safe result storage
      while (jobLocks[jobId + '_result']) continue;
      jobLocks[jobId + '_result'] = true;
      try {
        jobResults[jobId] = { error: err.message };
      } finally {
        delete jobLocks[jobId + '_result'];
      }
      
      safeLog(`[JobQueue] Error en job ${jobId}:`, {
        error: err.message,
        tiempoAntes: Date.now() - jobStates[jobId].startTime
      });
    }
  });

  return jobId;
}

export function updateJobState(jobId: string, updates: Partial<JobState>) {
  // Usar versión thread-safe
  atomicUpdateJobState(jobId, updates);
}

export function getJobStatus(jobId: string): string {
  // Thread-safe read
  return jobStates[jobId]?.status || 'not_found';
}

export function getJobState(jobId: string): JobState | null {
  // Thread-safe read con copia
  const state = jobStates[jobId];
  return state ? { ...state } : null;
}

export function getJobResult(jobId: string) {
  // Thread-safe read con copia si es objeto
  const result = jobResults[jobId];
  if (result && typeof result === 'object') {
    return { ...result };
  }
  return result || null;
}

export function getJobProgress(jobId: string): {
  status: string;
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  errorMessage?: string;
} {
  const state = getJobState(jobId); // Usar versión thread-safe
  
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

// Limpiar jobs antiguos (thread-safe)
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000) { // 24 horas por defecto
  const now = Date.now();
  const jobsToDelete: string[] = [];

  // Thread-safe deletion
  Object.entries(jobStates).forEach(([jobId, state]) => {
    // Verificar que no esté siendo modificado
    if (jobLocks[jobId]) return;
    
    const jobAge = now - state.startTime;
    if (jobAge > maxAgeMs && (state.status === 'done' || state.status === 'error')) {
      jobsToDelete.push(jobId);
    }
  });

  jobsToDelete.forEach(jobId => {
    // Lock durante eliminación
    jobLocks[jobId] = true;
    jobLocks[jobId + '_result'] = true;
    try {
      delete jobStates[jobId];
      delete jobResults[jobId];
    } finally {
      delete jobLocks[jobId];
      delete jobLocks[jobId + '_result'];
    }
  });

  if (jobsToDelete.length > 0) {
    safeLog(`[JobQueue] Limpieza: eliminados ${jobsToDelete.length} jobs antiguos`);
  }
}