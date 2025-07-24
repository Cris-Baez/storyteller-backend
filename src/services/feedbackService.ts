/**
 * logFeedback: Centraliza logs estructurados de timeout, reintentos y resultados de servicios externos.
 * El formato es compatible con dashboards, alertas y sistemas de monitoreo externos.
 * Ejemplo de evento:
 * {
 *   service: 'Voice',
 *   action: 'generateVoice',
 *   timeoutMs: 600000,
 *   elapsedMs: 12345,
 *   attempt: 2,
 *   success: false,
 *   error: 'Timeout',
 *   params: { text: 'Hola', gender: 'female' },
 *   timestamp: '2025-07-24T12:34:56.789Z'
 * }
 */
export type FeedbackEvent = {
  service: string;         // Nombre del servicio o módulo
  action: string;          // Acción o endpoint
  timeoutMs?: number;      // Timeout configurado (ms)
  elapsedMs?: number;      // Tiempo real de ejecución (ms)
  attempt?: number;        // Número de intento (si aplica)
  success: boolean;        // true=éxito, false=error
  error?: string;          // Mensaje de error si aplica
  params?: Record<string, any>; // Parámetros clave de entrada
  timestamp?: string;      // ISO timestamp (se autocompleta si falta)
};

export function logFeedback(event: FeedbackEvent) {
  const logObj = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };
  // Log estructurado, fácil de parsear por sistemas externos
  logger.info(`[FEEDBACK] ${JSON.stringify(logObj)}`);
}
// FeedbackService: registra y procesa feedback del usuario para mejorar la generación IA
// Soporta feedback por escena, global y por usuario

import { VideoPlan, TimelineSecond } from '../utils/types.js';
import { logger } from '../utils/logger.js';

export interface Feedback {
  userId?: string;
  videoId?: string;
  sceneIndex?: number;
  feedback: string;
  rating?: number;
  timestamp?: number;
  extra?: Record<string, any>;
}

// Almacén temporal en memoria (puedes migrar a DB real)
const feedbackStore: Feedback[] = [];

/**
 * Registra feedback del usuario sobre el video o escena
 */
export function registerFeedback(feedback: Feedback) {
  feedback.timestamp = Date.now();
  feedbackStore.push(feedback);
  logger.info(`[FeedbackService] Feedback registrado: ${JSON.stringify(feedback)}`);
}

/**
 * Obtiene feedback por videoId o userId
 */
export function getFeedback({ videoId, userId }: { videoId?: string; userId?: string }) {
  return feedbackStore.filter(f =>
    (videoId ? f.videoId === videoId : true) &&
    (userId ? f.userId === userId : true)
  );
}

/**
 * Integra feedback en el VideoPlan para mejorar la generación
 */
export function applyFeedbackToPlan(plan: VideoPlan, feedbacks: Feedback[]): VideoPlan {
  if (!Array.isArray(feedbacks) || feedbacks.length === 0) return plan;
  // Ejemplo: marcar escenas con feedback negativo
  for (const fb of feedbacks) {
    if (typeof fb.sceneIndex === 'number' && plan.timeline[fb.sceneIndex]) {
      plan.timeline[fb.sceneIndex].feedbackUsuario = fb.feedback;
      if (fb.rating && fb.rating < 3) {
        plan.timeline[fb.sceneIndex].validacionFinal = 'Revisar: feedback bajo';
      }
    }
  }
  logger.info('[FeedbackService] Feedback aplicado al VideoPlan');
  return plan;
}

/**
 * Limpia feedbacks (solo para pruebas)
 */
export function clearFeedbackStore() {
  feedbackStore.length = 0;
}
