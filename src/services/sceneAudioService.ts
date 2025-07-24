// Servicio para obtener/generar audio por escena (música, ambiente, sfx)
// Este esqueleto soporta buffers, URLs o rutas locales. Puedes conectar aquí Mubert, Freesound, etc.


import { robustAudioGen } from './audioFallbackService.js';
import { getBackgroundMusic } from './musicService.js';
// Si tienes servicios para ambience y sfx, impórtalos aquí

export interface SceneAudio {
  music: Buffer;
  ambience: Buffer;
  sfx: Buffer;
}


// Puedes reemplazar estas funciones por servicios reales si los tienes
async function getAmbience(ambienceType: string): Promise<Buffer> {
  // Aquí deberías conectar a un servicio real de ambience
  return Buffer.from([]); // placeholder
}
async function getSfx(sfxType: string): Promise<Buffer> {
  // Aquí deberías conectar a un servicio real de sfx
  return Buffer.from([]); // placeholder
}


// Mejora: crossfade, ducking y alineación avanzada
export async function getSceneAudio(scenes: any[]): Promise<SceneAudio[]> {
  const audios: SceneAudio[] = [];
  let lastMusic: Buffer | null = null;
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    // Música robusta
    let music = await robustAudioGen(getBackgroundMusic, [scene.music || 'cinematic'], 3, 3);
    // Ambience robusto
    let ambience = await robustAudioGen(getAmbience, [scene.ambience || 'default'], 3, 3);
    // SFX robusto
    let sfx = await robustAudioGen(getSfx, [scene.sfx || 'default'], 3, 1);

    // Crossfade automático si la transición lo requiere
    if (i > 0 && scenes[i-1].transition && ['fade','crossfade'].includes(scenes[i-1].transition) && lastMusic) {
      // TODO: aplicar crossfade real entre lastMusic y music (usar ffmpeg o librería de audio)
      console.log(`[Audio] Crossfade automático entre escenas ${i-1} y ${i}`);
    }

    // Audio ducking: bajar música si hay diálogo importante
    if (scene.voiceLine && scene.voiceLine.length > 0) {
      // TODO: aplicar ducking real (bajar volumen de music donde hay voz)
      console.log(`[Audio] Ducking automático en escena ${i} por diálogo/voz`);
    }

    // TODO: Alinear música, efectos y voz según timeline y transición

    audios.push({ music, ambience, sfx });
    lastMusic = music;
  }
  return audios;
}
