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

  // Derivar campos para mapeo de assets CDN
  // Ejemplo simple: extraer estilo, lugar, variante, ambiente, angulo, nombre de backgroundPrompt y otros campos
  // Puedes mejorar la lógica según tu estructura de prompts
  const prompt = normalized.backgroundPrompt || '';
  // Estilo: busca palabras clave comunes
  normalized.estilo = /anime|realista|cinematic|cartoon|comercial|narrativa|gaming/i.exec(prompt)?.[0] || 'cinematic';
  // Lugar: busca después de "en" o "escenario"
  normalized.lugar = /en ([^,\.]+)|escenario ([^,\.]+)/i.exec(prompt)?.[1] || '';
  // Variante: busca "variante" o "tipo"
  normalized.variante = /variante ([^,\.]+)|tipo ([^,\.]+)/i.exec(prompt)?.[1] || '';
  // Ambiente: busca "ambiente" o "clima"
  normalized.ambiente = /ambiente ([^,\.]+)|clima ([^,\.]+)/i.exec(prompt)?.[1] || '';
  // Ángulo: busca "frontal", "lateral", "aérea", "ventana", "noche", "interior", "suelo"
  normalized.angulo = /(frontal|lateral|a[ée]rea|ventana|noche|interior|suelo)/i.exec(prompt)?.[1] || '';
  // Nombre: usa el actorPrompt o el nombre de la escena si existe
  normalized.nombre = normalized.actorPrompt || normalized.visual || `escena_${normalized.idx}`;

  return normalized as TimelineSecond;
}

export function normalizeTimeline(timeline: any[]): TimelineSecond[] {
  return (timeline || []).map(normalizeSceneFields);
}
