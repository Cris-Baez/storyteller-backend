// Validador avanzado para VideoPlan y TimelineSecond
// Revisa que todos los campos clave estén completos, coherentes y listos para renderizar IA profesional

import { VideoPlan, TimelineSecond } from './types.js';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateVideoPlan(plan: VideoPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!plan || !Array.isArray(plan.timeline) || plan.timeline.length === 0) {
    errors.push('El VideoPlan no tiene timeline válido.');
    return { ok: false, errors, warnings };
  }
  // Validar metadata
  if (!plan.metadata || typeof plan.metadata.mode !== 'string' || typeof plan.metadata.visualStyle !== 'string') {
    errors.push('Metadata incompleta: falta mode o visualStyle.');
  }
  // Validar cada segundo
  plan.timeline.forEach((sec: TimelineSecond, idx: number) => {
    if (typeof sec.t !== 'number') errors.push(`timeline[${idx}]: falta campo t (segundo).`);
    if (!sec.backgroundPrompt) errors.push(`timeline[${idx}]: falta backgroundPrompt.`);
    if (!sec.actorPrompt) errors.push(`timeline[${idx}]: falta actorPrompt.`);
    if (!sec.visual) warnings.push(`timeline[${idx}]: falta visual.`);
    if (!sec.camera) warnings.push(`timeline[${idx}]: falta camera.`);
    if (!sec.lighting) warnings.push(`timeline[${idx}]: falta lighting.`);
    if (!sec.colorPalette) warnings.push(`timeline[${idx}]: falta colorPalette.`);
    if (!sec.composition) warnings.push(`timeline[${idx}]: falta composition.`);
    if (!sec.atmosphere) warnings.push(`timeline[${idx}]: falta atmosphere.`);
    if (!sec.effects) warnings.push(`timeline[${idx}]: falta effects.`);
    if (!sec.continuidad) warnings.push(`timeline[${idx}]: falta continuidad.`);
    if (!sec.variedadVisual) warnings.push(`timeline[${idx}]: falta variedadVisual.`);
    if (!sec.efectosAvanzados) warnings.push(`timeline[${idx}]: falta efectosAvanzados.`);
    if (!sec.musicaAvanzada) warnings.push(`timeline[${idx}]: falta musicaAvanzada.`);
    if (!sec.music) warnings.push(`timeline[${idx}]: falta music.`);
    if (!sec.emotion) warnings.push(`timeline[${idx}]: falta emotion.`);
    if (!sec.dialogo) warnings.push(`timeline[${idx}]: falta dialogo.`);
    if (!sec.voz) warnings.push(`timeline[${idx}]: falta voz.`);
    if (!sec.lipSync) warnings.push(`timeline[${idx}]: falta lipSync.`);
    if (!sec.parametrosVoz) warnings.push(`timeline[${idx}]: falta parametrosVoz.`);
    if (!sec.idioma) warnings.push(`timeline[${idx}]: falta idioma.`);
    if (!sec.feedbackUsuario) warnings.push(`timeline[${idx}]: falta feedbackUsuario.`);
    if (!sec.validacionFinal) warnings.push(`timeline[${idx}]: falta validacionFinal.`);
    // Puedes agregar más validaciones para los campos avanzados aquí
  });
  return { ok: errors.length === 0, errors, warnings };
}
