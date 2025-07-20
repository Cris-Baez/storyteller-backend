
// Servicio para generar clips usando Kling

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { extractAndUploadFrame } from './carryOverService.js';
import { getSceneAudio } from './sceneAudioService.js';


export async function generateClipsKling(
  scenes: any[],
  opts?: { plan?: any; music?: Buffer; voiceOver?: Buffer; sfx?: Buffer }
): Promise<{ finalUrl: string, clips: string[] }> {
  const klingService = await import('./klingService.js');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Paths relativos robustos para ESM
  const fondoPath = `${__dirname}/../config/fondoDescs.json`;
  const actorPath = `${__dirname}/../config/actorDescs.json`;
  const fondoDescsRaw = await readFile(fondoPath, 'utf-8');
  const FONDO_DESCS: Record<string, string> = JSON.parse(fondoDescsRaw);
  const actorDescsRaw = await readFile(actorPath, 'utf-8');
  const ACTOR_DESCS: Record<string, string> = JSON.parse(actorDescsRaw);
  const axios = (await import('axios')).default;
  const fs = await import('fs/promises');
  const os = await import('os');
  const pathMod = await import('path');
  const { uploadToCDN } = await import('./cdnService.js');


  // Soporte para continuidad visual y narrativa
  let carryoverFrameUrl: string | undefined = undefined;
  let carryoverFrameTime = 0;
  let lastBackground: string | undefined = undefined;
  let lastCharacter: string | undefined = undefined;
  // Log de inicio de generación de clips Kling
  console.log('🟡 [Kling] INICIO generación de clips para todas las escenas...');
  // Si la escena tiene duración, la usamos; si no, default 10s
  const clipPromises = scenes.map(async (scene, idx) => {
    // Usar campos directos del nuevo formato
    const background = scene.background || lastBackground;
    // Forzar el actor a actor_joven.png siempre
    const character = 'actor_joven.png';
    lastBackground = background;
    lastCharacter = character;
    const backgroundUrl = background ? `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${background}` : undefined;
    const characterUrl = `https://storage.googleapis.com/storyteller-ai-cdn/assets/actores/actor_joven.png`;

    // Descripciones
    const fondoDesc = background && FONDO_DESCS[background] ? FONDO_DESCS[background] : '';
    const actorDesc = character && ACTOR_DESCS[character] ? ACTOR_DESCS[character] : '';

    // Prompt avanzado y cinematográfico
    const subject = character ? 'A young actor' : 'A character';
    const visual = (scene.visual || '').replace(/\s+/g, ' ').trim();
    const action = scene.action ? scene.action : '';
    const emotion = scene.emotion ? `Emotion: ${scene.emotion}` : '';
    const ambience = scene.ambience ? `Ambience: ${scene.ambience}` : '';
    const camera = scene.camera ? `Camera: ${scene.camera.shot || ''}${scene.camera.movement ? ', ' + scene.camera.movement : ''}` : '';
    const lighting = scene.lighting ? `Lighting: ${scene.lighting}` : '';
    const atmosphere = 'Atmosphere: cinematic, realistic, emotional.';
    const quality = 'Render in photorealistic 1080p, sharp focus, no watermark.';

    let promptEscena = [
      fondoDesc,
      actorDesc,
      subject,
      action,
      visual,
      emotion,
      ambience,
      camera,
      lighting,
      atmosphere,
      quality
    ].filter(Boolean).join(', ');

    // Transición explícita si no es el primer clip
    if (idx > 0) {
      promptEscena += ', continues from previous shot, seamless transition, matching pose and lighting';
    }

    // input_image_urls: carryover frame, fondo, actor
    const input_image_urls = [];
    if (idx > 0 && carryoverFrameUrl) {
      input_image_urls.push(carryoverFrameUrl, carryoverFrameUrl);
    } else if (backgroundUrl) {
      input_image_urls.push(backgroundUrl);
    }
    if (characterUrl) {
      input_image_urls.push(characterUrl, characterUrl, characterUrl);
    }

    // Negative prompt robusto
    let negativePrompt = 'blur, distorted face, duplicate limbs, color shift, low quality, duplicate head, melted limbs';
    if (promptEscena.toLowerCase().includes('rain') || promptEscena.toLowerCase().includes('bokeh')) {
      negativePrompt = 'distorted face, duplicate limbs, color shift, low quality, duplicate head, melted limbs';
    }

    // Limitar prompt a 280 caracteres y formato 3 líneas
    let promptFinal = promptEscena;
    if (promptFinal.length > 280) {
      promptFinal = promptFinal.slice(0, 277) + '...';
    }
    const promptLines = promptFinal.split(',').map(s => s.trim()).filter(Boolean);
    const prompt3 = [promptLines[0] || '', promptLines[1] || '', promptLines.slice(2).join(', ')].join('\n');

    // Duración variable por escena
    let duration = '10';
    if (scene.duration && !isNaN(Number(scene.duration))) {
      duration = String(Math.max(3, Math.min(20, Math.round(Number(scene.duration))))); // entre 3 y 20s
    }
    // Ajustar carryoverFrameTime para el corte correcto
    carryoverFrameTime = Math.max(0, Number(duration) - 0.2);

    const klingParams = {
      prompt: prompt3,
      input_image_urls,
      duration,
      aspect_ratio: '16:9',
      negative_prompt: negativePrompt,
      ...scene
    };

    // Polling para esperar el video listo (máx 10 min, 10s entre reintentos)
    let url = null;
    let attempts = 0;
    const maxAttempts = 60;
    while (!url && attempts < maxAttempts) {
      try {
        url = await klingService.generateKlingClip(klingParams);
      } catch (e: any) {
        if (e?.status === 422) throw e;
        await new Promise(res => setTimeout(res, 10000));
        attempts++;
        continue;
      }
    }
    if (!url) throw new Error('No se pudo obtener el video de Kling tras varios intentos');

    // Descargar el archivo .mp4 a local antes de subirlo al CDN
    const tempDir = os.tmpdir();
    const tempFile = pathMod.join(tempDir, `klingclip_${Date.now()}_${Math.floor(Math.random()*1e6)}.mp4`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    await fs.writeFile(tempFile, response.data);

    // Subir al CDN y devolver la ruta local para FFmpeg
    const videoName = pathMod.basename(tempFile);
    await uploadToCDN(tempFile, `videos/${videoName}`);

    // Carry-over: extraer frame justo antes del corte para el siguiente clip (solo si no es el último)
    if (idx < scenes.length - 1) {
      try {
        carryoverFrameUrl = await extractAndUploadFrame(tempFile, carryoverFrameTime, uploadToCDN);
      } catch (e) {
        carryoverFrameUrl = undefined;
      }
    }

    // No borrar el archivo temporal aún, lo usará FFmpeg
    return tempFile;
  });

  // Esperar a que TODOS los clips estén listos antes de pasar a FFmpeg
  const clips: string[] = await Promise.all(clipPromises);
  console.log('🟢 [Kling] TODOS los clips generados y descargados. Iniciando ensamblado FFmpeg...');
  // Obtener buffers de audio por escena (music, ambience, sfx)
  const sceneAudio = await getSceneAudio(scenes);
  // Separar buffers por tipo
  const musicArr = sceneAudio.map(a => a.music);
  const ambienceArr = sceneAudio.map(a => a.ambience);
  const sfxArr = sceneAudio.map(a => a.sfx);
  const { assembleVideo } = await import('./ffmpegService.js');
  const plan = opts?.plan ?? ({} as any);
  const voiceOver = opts?.voiceOver ?? Buffer.from([]);
  // Integración: pasar arrays de audio por escena a assembleVideo
  const finalUrl = await assembleVideo({
    plan,
    clips,
    voiceOver,
    music: musicArr,
    ambience: ambienceArr,
    sfx: sfxArr
    // Puedes agregar más hooks aquí para overlays, branding, etc.
  });
  return { finalUrl, clips };
}
