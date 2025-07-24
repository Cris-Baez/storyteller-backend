// src/utils/mapSceneFields.ts
// Mapea campos de una escena generada por LLM a la estructura esperada por TimelineSecond


import { TimelineSecond } from './types.js';

// Utilidad para buscar campo en variantes y anidados
function findField(obj: any, keys: string[]): any {
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
  }
  // Buscar en anidados
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const found = findField(obj[key], keys);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

export function mapSceneFields(scene: any): Partial<TimelineSecond> {
  // Logging para depuración profunda
  if (process.env.NODE_ENV !== 'production') {
    console.log('[MAPSCENE] Escena original:', JSON.stringify(scene));
  }
  const mapped: Partial<TimelineSecond> = {
    t: typeof scene.t === 'number' ? scene.t : 0,
    backgroundPrompt: findField(scene, ['backgroundPrompt', 'scene', 'fondo', 'bg', 'background']) || 'fondo genérico',
    actorPrompt: findField(scene, ['actorPrompt', 'character', 'personaje', 'actor']) || 'actor genérico',
    visual: findField(scene, ['visual', 'descripcion', 'description']) || '',
    camera: findField(scene, ['camera', 'camara']) || '',
    lighting: findField(scene, ['lighting', 'luz']) || '',
    colorPalette: findField(scene, ['colorPalette', 'paletaColores']) || '',
    composition: findField(scene, ['composition', 'composicion']) || '',
    atmosphere: findField(scene, ['atmosphere', 'ambiente']) || '',
    effects: findField(scene, ['effects', 'fx', 'efectos']) || '',
    emotion: findField(scene, ['emotion', 'emocion']) || '',
    music: typeof scene.music === 'object' ? scene.music : { mood: scene.music || 'ambient', trackId: 'default' },
    dialogo: findField(scene, ['dialogo', 'voiceLine', 'dialogue', 'texto']) || '',
    voz: findField(scene, ['voz', 'voice']) || '',
    lipSync: findField(scene, ['lipSync', 'labial']) || '',
    overlays: scene.overlays || [],
    luts: scene.luts || [],
    soundCue: findField(scene, ['soundCue', 'sonido']) || '',
    transition: findField(scene, ['transition', 'transicion']) || '',
    carryover: !!findField(scene, ['carryover']),
    audioCarryover: !!findField(scene, ['audioCarryover']),
    faceAnimation: findField(scene, ['faceAnimation', 'animacionFacial']) || '',
  };
  if (process.env.NODE_ENV !== 'production') {
    console.log('[MAPSCENE] Escena mapeada:', JSON.stringify(mapped));
  }
  return mapped;
}

export function mapTimelineFields(timeline: any[]): Partial<TimelineSecond>[] {
  return (timeline || []).map(mapSceneFields);
}
