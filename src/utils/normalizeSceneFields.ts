// src/utils/normalizeSceneFields.ts
// Normaliza y completa todos los campos clave de una escena para evitar bloqueos en el pipeline

import { TimelineSecond } from './types.js';

const DEFAULTS: Partial<TimelineSecond> = {
  backgroundPrompt: 'fondo genérico cinematográfico',
  actorPrompt: 'actor genérico',
  visual: 'Acción cinematográfica',
  camera: 'plano medio',
  lighting: 'neutro',
  colorPalette: 'natural',
  composition: 'centrado',
  atmosphere: 'normal',
  effects: '',
  continuidad: 'sí',
  variedadVisual: 'media',
  efectosAvanzados: '',
  musicaAvanzada: '',
  music: { mood: 'ambient', trackId: 'default' },
  emotion: 'neutral',
  dialogo: '',
  voz: '',
  lipSync: '',
  parametrosVoz: '',
  idioma: 'es',
  feedbackUsuario: '',
  validacionFinal: '',
  faseNarrativa: 'desarrollo',
};

export function normalizeSceneFields(scene: any): TimelineSecond {
  const normalized: any = { ...scene };
  for (const key in DEFAULTS) {
    if (normalized[key] === undefined || normalized[key] === null || normalized[key] === '') {
      normalized[key] = DEFAULTS[key];
    }
  }
  // Garantizar que t (segundo) exista
  if (typeof normalized.t !== 'number') normalized.t = 0;
  return normalized as TimelineSecond;
}

export function normalizeTimeline(timeline: any[]): TimelineSecond[] {
  return (timeline || []).map(normalizeSceneFields);
}
