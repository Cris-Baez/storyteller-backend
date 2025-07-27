// ❌ ARCHIVO LEGACY DESHABILITADO
// Este archivo ya no se usa - Todo pasa por el sistema de cerebros (dispatcher.ts)
// Mantenido solo por compatibilidad temporal hasta confirmar que no se necesita

import { RenderRequest, VideoPlan } from '../../utils/types.js';

/**
 * @deprecated Este sistema legacy ha sido reemplazado por el dispatcher de cerebros
 * Ver: src/services/llmService/dispatcher.ts para la nueva arquitectura
 */
export async function createVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  throw new Error('❌ Sistema legacy deshabilitado. Usar dispatcher de cerebros en su lugar.');
}
