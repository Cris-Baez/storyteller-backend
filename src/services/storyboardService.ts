
// StoryboardService deshabilitado temporalmente.
// TODO: Migrar a generación de storyboards usando Kling (escenario/personaje elegido por el usuario).
// Cuando se active, permitir que el usuario solicite imágenes de storyboard generadas por Kling.

import { VideoPlan } from '../utils/types.js';

/**
 * generateStoryboards (stub temporal)
 * @param plan VideoPlan
 * @returns string[] vacío
 */
export async function generateStoryboards(plan: VideoPlan): Promise<string[]> {
  // Servicio legacy deshabilitado. Migrar a Kling en el futuro.
  // throw new Error('StoryboardService deshabilitado. Próximamente con Kling.');
  return [];
}
