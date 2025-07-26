// Router maestro para LLMService por estilo
import { RenderRequest, VideoPlan } from '../../utils/types.js';
import { generateAnimeVideoPlan } from './anime.js';
import { generateRealisticVideoPlan } from './realistic.js';
import { generateCinematicVideoPlan } from './cinematic.js';
import { generateNarrativeVideoPlan } from './narrative.js';
import { generateCommercialVideoPlan } from './commercial.js';
import { generateGameVideoPlan } from './game.js';

import { validateVideoPlan } from '../../utils/validateVideoPlan.js';
import { logFeedback } from '../feedbackService.js';

// Feedback loop y soporte de hints
export async function createVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  let videoPlan: VideoPlan | undefined;
  let lastError: any;
  let attempts = 0;
  let userPrompt = req.prompt || '';
  const hints = req.metadata?.hints || '';
  if (hints) userPrompt += '\n\nHINTS: ' + hints;

  // Validar visualStyle
  let style = req.visualStyle?.toLowerCase();
  const validStyles = ['anime', 'realistic', 'cinematic', 'narrative', 'commercial', 'game'];
  if (!style || !validStyles.includes(style)) {
    throw new Error('Estilo no soportado o indefinido: ' + req.visualStyle);
  }

  while (attempts < 2) { // 1 intento normal, 1 con feedback si falla
    attempts++;
    try {
      let planFn;
      switch (style) {
        case 'anime': planFn = generateAnimeVideoPlan; break;
        case 'realistic': planFn = generateRealisticVideoPlan; break;
        case 'cinematic': planFn = generateCinematicVideoPlan; break;
        case 'narrative': planFn = generateNarrativeVideoPlan; break;
        case 'commercial': planFn = generateCommercialVideoPlan; break;
        case 'game': planFn = generateGameVideoPlan; break;
        default: throw new Error('Estilo no soportado: ' + style);
      }
      // Pasar el prompt modificado con hints y feedback
      const reqWithPrompt = { ...req, prompt: userPrompt, visualStyle: style };
      if (process?.env?.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[LLMService] Intento #${attempts} para estilo: ${style}`);
      }
      videoPlan = await planFn(reqWithPrompt);
      if (!videoPlan) {
        throw new Error('El plan generado es undefined.');
      }
      const validation = validateVideoPlan(videoPlan);
      if (validation.ok) return videoPlan;
      // Si falla, agregar feedback explícito al prompt y reintentar
      userPrompt += '\n\nFEEDBACK: Corrige estos errores: ' + validation.errors.slice(0, 3).join('; ');
      lastError = validation.errors;
      // Loggear el fallo de validación del VideoPlan
      logFeedback({
        service: 'LLMService',
        action: 'validateVideoPlan',
        success: false,
        error: 'Errores de validación en VideoPlan',
        params: {
          errors: validation.errors,
          warnings: validation.warnings,
          prompt: userPrompt,
          style,
          attempt: attempts
        }
      });
      if (process?.env?.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.warn('[LLMService] Errores de validación:', validation.errors);
      }
    } catch (err) {
      lastError = err;
      // Loggear el error de generación del plan
      logFeedback({
        service: 'LLMService',
        action: 'generateVideoPlan',
        success: false,
        error: err instanceof Error ? err.message : String(err),
        params: {
          prompt: userPrompt,
          style,
          attempt: attempts
        }
      });
      if (process?.env?.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('[LLMService] Error en intento', attempts, err);
      }
    }
  }
  // Mejorar detalle del error final
  let errorMsg = 'No se pudo generar un VideoPlan válido.';
  if (lastError instanceof Error) {
    errorMsg += ' Último error: ' + lastError.message;
  } else if (Array.isArray(lastError)) {
    errorMsg += ' Errores: ' + lastError.join('; ');
  } else if (typeof lastError === 'string') {
    errorMsg += ' Detalle: ' + lastError;
  } else if (lastError) {
    errorMsg += ' Detalle: ' + JSON.stringify(lastError);
  }
  throw new Error(errorMsg);
}
