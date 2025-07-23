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
