// --- Funciones stub para generación automática de imágenes y ángulos ---
import { fal } from '@fal-ai/client';

/**
 * Genera una imagen realista usando el modelo AI más adecuado
 */
export async function generateImageRealista(prompt: string, backgroundUrl?: string): Promise<string> {
  console.log(`[Fal.ai] [Realista] Generando imagen: prompt="${prompt}" fondo="${backgroundUrl}"`);
  // Fal.ai modelo realista
  // Timeout robusto para Fal.ai (5 minutos)
  const TIMEOUT_MS = 300000;
  const result = await Promise.race([
    fal.subscribe('fal-ai/flux-pro/realistic', {
      input: {
        prompt,
        image_url: backgroundUrl || ''
      },
      logs: true
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Fal.ai timeout')), TIMEOUT_MS))
  ]) as any;
  return result?.data?.image_url || '';
}

/**
 * Genera una imagen anime estilo Ghibli
 */
export async function generateImageAnime(prompt: string, backgroundUrl?: string): Promise<string> {
  console.log(`[Fal.ai] [Anime] Generando imagen: prompt="${prompt}" fondo="${backgroundUrl}"`);
  // Fal.ai modelo anime
  const TIMEOUT_MS = 300000;
  const result = await Promise.race([
    fal.subscribe('fal-ai/flux-pro/anime', {
      input: {
        prompt,
        image_url: backgroundUrl || ''
      },
      logs: true
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Fal.ai timeout')), TIMEOUT_MS))
  ]) as any;
  return result?.data?.image_url || '';
}

/**
 * Genera una imagen tipo cartoon
 */
export async function generateImageCartoon(prompt: string, backgroundUrl?: string): Promise<string> {
  console.log(`[Fal.ai] [Cartoon] Generando imagen: prompt="${prompt}" fondo="${backgroundUrl}"`);
  // Fal.ai modelo cartoon
  const TIMEOUT_MS = 300000;
  const result = await Promise.race([
    fal.subscribe('fal-ai/flux-pro/cartoon', {
      input: {
        prompt,
        image_url: backgroundUrl || ''
      },
      logs: true
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Fal.ai timeout')), TIMEOUT_MS))
  ]) as any;
  return result?.data?.image_url || '';
}

/**
 * Genera una imagen estilo gaming/cinemática
 */
export async function generateImageGaming(prompt: string, backgroundUrl?: string): Promise<string> {
  console.log(`[Fal.ai] [Gaming] Generando imagen: prompt="${prompt}" fondo="${backgroundUrl}"`);
  // Fal.ai modelo gaming
  const TIMEOUT_MS = 300000;
  const result = await Promise.race([
    fal.subscribe('fal-ai/flux-pro/gaming', {
      input: {
        prompt,
        image_url: backgroundUrl || ''
      },
      logs: true
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Fal.ai timeout')), TIMEOUT_MS))
  ]) as any;
  return result?.data?.image_url || '';
}

/**
 * Genera una imagen para comercial
 */
export async function generateImageComercial(prompt: string, backgroundUrl?: string): Promise<string> {
  console.log(`[Fal.ai] [Comercial] Generando imagen: prompt="${prompt}" fondo="${backgroundUrl}"`);
  // Fal.ai modelo comercial
  const TIMEOUT_MS = 300000;
  const result = await Promise.race([
    fal.subscribe('fal-ai/flux-pro/commercial', {
      input: {
        prompt,
        image_url: backgroundUrl || ''
      },
      logs: true
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Fal.ai timeout')), TIMEOUT_MS))
  ]) as any;
  return result?.data?.image_url || '';
}

/**
 * Genera una imagen narrativa
 */
export async function generateImageNarrativa(prompt: string, backgroundUrl?: string): Promise<string> {
  console.log(`[Fal.ai] [Narrativa] Generando imagen: prompt="${prompt}" fondo="${backgroundUrl}"`);
  // Fal.ai modelo narrativa
  const TIMEOUT_MS = 300000;
  const result = await Promise.race([
    fal.subscribe('fal-ai/flux-pro/narrative', {
      input: {
        prompt,
        image_url: backgroundUrl || ''
      },
      logs: true
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Fal.ai timeout')), TIMEOUT_MS))
  ]) as any;
  return result?.data?.image_url || '';
}

/**
 * Genera otro ángulo o agrega multitudes usando Kontext (Fal.ai)
 */
export async function generateKontextAngleOrCrowd(imageUrl: string, kontextPrompt: string): Promise<string> {
  console.log(`[Fal.ai] [Kontext] Generando ángulo/multitudes: prompt="${kontextPrompt}" imagen="${imageUrl}"`);
  // Fal.ai Kontext para ángulos y multitudes
  const TIMEOUT_MS = 300000;
  const result = await Promise.race([
    fal.subscribe('fal-ai/flux-pro/kontext/max', {
      input: {
        prompt: kontextPrompt,
        image_url: imageUrl || ''
      },
      logs: true
    }),
    new Promise((_, rej) => setTimeout(() => rej(new Error('Fal.ai Kontext timeout')), TIMEOUT_MS))
  ]) as any;
  if (result?.data?.images && Array.isArray(result.data.images) && result.data.images.length > 0) {
    return result.data.images[0].url || '';
  }
  return '';
}

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
  console.log('[ClipService] [Pipeline] Iniciando generateClipsKling:', { scenesCount: scenes.length, opts: !!opts });
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
  console.log('[ClipService] [Clips] Procesando escenas:', { total: scenes.length, carryoverEnabled: true });
  // Si la escena tiene duración, la usamos; si no, default 10s
  // Generar imágenes de transición entre escenas
  async function generateTransitionImage(prevImageUrl: string, nextImageUrl: string): Promise<string> {
    console.log(`[Fal.ai] [Transición] Generando imagen de transición entre "${prevImageUrl}" y "${nextImageUrl}"`);
    // Prompt para transición cinematográfica
    const prompt = 'cinematic fade transition, soft light, seamless, film look';
    // Usar Fal.ai para generar imagen de transición
    const result = await fal.subscribe('fal-ai/flux-pro/realistic', {
      input: {
        prompt,
        image_url: prevImageUrl || ''
      },
      logs: true
    });
    return result.data?.image_url || '';
  }

    const clipPromises = scenes.map(async (scene, idx) => {
        // Detectar idioma de la escena o del plan
        const idioma = scene.idioma || (opts?.plan?.metadata?.idioma) || 'es';
        const isEnglish = idioma.startsWith('en');
        const isSpanish = idioma.startsWith('es');
        // Log multilingüe
        if (isEnglish) {
            console.log(`[ClipService] [Scene] Processing scene ${idx + 1}/${scenes.length}:`, { scene: scene.visual || scene.prompt, background: scene.background });
        } else {
            console.log(`[ClipService] [Escena] Procesando escena ${idx + 1}/${scenes.length}:`, { escena: scene.visual || scene.prompt, fondo: scene.background });
        }
        // Usar campos directos del nuevo formato
        const backgroundPrompt = scene.backgroundPrompt || scene.background || lastBackground;
        const actorPrompt = scene.actorPrompt || scene.character || 'TheRockActor';
        lastBackground = backgroundPrompt;
        lastCharacter = actorPrompt;

        // Adaptar prompts según idioma
        let backgroundPromptFinal = backgroundPrompt;
        let actorPromptFinal = actorPrompt;
        if (isEnglish) {
            // Si el prompt está en español, traducir (stub, puedes integrar traductor real)
            if (/\b(el|la|de|y|con|en|por|para|un|una)\b/i.test(backgroundPromptFinal)) {
                backgroundPromptFinal = `[EN] ${backgroundPromptFinal}`;
            }
            if (/\b(el|la|de|y|con|en|por|para|un|una)\b/i.test(actorPromptFinal)) {
                actorPromptFinal = `[EN] ${actorPromptFinal}`;
            }
        } else if (isSpanish) {
            // Si el prompt está en inglés, marcarlo (stub)
            if (/\b(the|and|with|in|for|a|an|on|to|by)\b/i.test(backgroundPromptFinal)) {
                backgroundPromptFinal = `[ES] ${backgroundPromptFinal}`;
            }
            if (/\b(the|and|with|in|for|a|an|on|to|by)\b/i.test(actorPromptFinal)) {
                actorPromptFinal = `[ES] ${actorPromptFinal}`;
            }
        }

        // Generar PNG de fondo usando Fal.ai
        let backgroundImageUrl = '';
        if (backgroundPromptFinal) {
            try {
                backgroundImageUrl = await generateImageRealista(backgroundPromptFinal);
                // Subir al CDN
                const bgName = `bg_${Date.now()}_${Math.floor(Math.random()*1e6)}.png`;
                const tempDir = os.tmpdir();
                const tempBgFile = pathMod.join(tempDir, bgName);
                const bgResp = await axios.get(backgroundImageUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(tempBgFile, bgResp.data);
                await uploadToCDN(tempBgFile, `assets/escenas/${bgName}`);
                backgroundImageUrl = `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${bgName}`;
            } catch (err) {
                console.warn(`[ClipService] [Error] No se pudo generar/subir fondo: ${backgroundPromptFinal}`, err);
            }
        }

        // Generar PNG de actor usando Fal.ai
        let actorImageUrl = '';
        if (actorPromptFinal) {
            try {
                actorImageUrl = await generateImageRealista(actorPromptFinal);
                // Subir al CDN
                const actorName = `actor_${Date.now()}_${Math.floor(Math.random()*1e6)}.png`;
                const tempDir = os.tmpdir();
                const tempActorFile = pathMod.join(tempDir, actorName);
                const actorResp = await axios.get(actorImageUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(tempActorFile, actorResp.data);
                await uploadToCDN(tempActorFile, `assets/escenas/${actorName}`);
                actorImageUrl = `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${actorName}`;
            } catch (err) {
                console.warn(`[ClipService] [Error] No se pudo generar/subir actor: ${actorPromptFinal}`, err);
            }
        }

        // input_image_urls: fondo y actor en base64
        const input_image_urls = [];
        for (const imgUrl of [backgroundImageUrl, actorImageUrl]) {
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                try {
                    const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                    input_image_urls.push(`data:image/png;base64,${base64Image}`);
                } catch (err) {
                    console.warn(`[ClipService] [Error] No se pudo descargar/convertir imagen a base64: ${imgUrl}`, err);
                }
            }
        }

        // Negative prompt robusto
        let negativePrompt = 'blur, distorted face, duplicate limbs, color shift, low quality, duplicate head, melted limbs';
        if (actorPromptFinal && actorPromptFinal.toLowerCase().includes('rain') || actorPromptFinal.toLowerCase().includes('bokeh')) {
            negativePrompt = 'distorted face, duplicate limbs, color shift, low quality, duplicate head, melted limbs';
        }

        // Limitar prompt a 280 caracteres y formato 3 líneas
        let promptFinal = actorPromptFinal;
        if (promptFinal.length > 280) {
            promptFinal = promptFinal.slice(0, 277) + '...';
        }
        const promptLines: string[] = promptFinal.split(',').map((s: string): string => s.trim()).filter((s: string): boolean => Boolean(s));
        const prompt3 = [promptLines[0] || '', promptLines[1] || '', promptLines.slice(2).join(', ')].join('\n');

        // Duración variable por escena
        let duration = '10';
        if (scene.duration && !isNaN(Number(scene.duration))) {
            duration = String(Math.max(3, Math.min(20, Math.round(Number(scene.duration))))); // entre 3 y 20s
        }
        carryoverFrameTime = Math.max(0, Number(duration) - 0.2);

        const klingParams = {
            prompt: prompt3,
            input_image_urls,
            duration,
            aspect_ratio: '16:9',
            negative_prompt: negativePrompt,
            idioma,
            ...scene
        };
        if (isEnglish) {
            console.log(`[ClipService] [Kling] Sending to Kling scene ${idx + 1}:`, { prompt: prompt3.substring(0, 50) + '...', duration, images: input_image_urls.length, idioma });
        } else {
            console.log(`[ClipService] [Kling] Enviando a Kling escena ${idx + 1}:`, { prompt: prompt3.substring(0, 50) + '...', duration, images: input_image_urls.length, idioma });
        }

        // Polling para esperar el video listo (máx 10 min, 10s entre reintentos)
        let url = null;
        let attempts = 0;
        const maxAttempts = 60;
        while (!url && attempts < maxAttempts) {
            try {
                url = await klingService.generateKlingClip(klingParams);
                if (url) {
                    if (isEnglish) {
                        console.log(`[ClipService] [Kling] Video generated successfully for scene ${idx + 1}:`, { url: url.substring(0, 50) + '...' });
                    } else {
                        console.log(`[ClipService] [Kling] Video generado exitosamente para escena ${idx + 1}:`, { url: url.substring(0, 50) + '...' });
                    }
                }
            } catch (e: any) {
                if (isEnglish) {
                    console.log(`[ClipService] [Error] Attempt ${attempts + 1}/${maxAttempts} failed for scene ${idx + 1}:`, { error: e.message });
                } else {
                    console.log(`[ClipService] [Error] Intento ${attempts + 1}/${maxAttempts} falló para escena ${idx + 1}:`, { error: e.message });
                }
                if (e?.status === 422) throw e;
                await new Promise(res => setTimeout(res, 10000));
                attempts++;
                continue;
            }
        }
        if (!url) throw new Error(isEnglish ? 'Could not get Kling video after several attempts' : 'No se pudo obtener el video de Kling tras varios intentos');
        if (isEnglish) {
            console.log(`[ClipService] [Download] Downloading Kling video for scene ${idx + 1}...`);
        } else {
            console.log(`[ClipService] [Descarga] Descargando video de Kling para escena ${idx + 1}...`);
        }

        // Descargar el archivo .mp4 a local antes de subirlo al CDN
        const tempDir = os.tmpdir();
        const tempFile = pathMod.join(tempDir, `klingclip_${Date.now()}_${Math.floor(Math.random()*1e6)}.mp4`);
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await fs.writeFile(tempFile, response.data);

        // Subir al CDN y devolver la ruta local para FFmpeg

        // Generar subtítulos multilingües
        let subtitles = '';
        if (scene.dialogue || scene.localizacionDialogo) {
            // Usar el campo de diálogo y el idioma detectado
            if (isEnglish) {
                subtitles = scene.dialogue || scene.localizacionDialogo || '';
            } else {
                subtitles = scene.localizacionDialogo || scene.dialogue || '';
            }
        }
        // Si se quiere usar traducción automática, aquí se puede integrar un traductor externo

        // Guardar subtítulos en formato SRT simple
        let srtContent = '';
        if (subtitles) {
            // Generar SRT para toda la duración
            srtContent = `1\n00:00:00,000 --> 00:00:${duration.padStart(2, '0')},000\n${subtitles}\n`;
            // Guardar SRT temporal
            const srtName = `sub_${Date.now()}_${Math.floor(Math.random()*1e6)}.srt`;
            const tempSrtFile = pathMod.join(tempDir, srtName);
            await fs.writeFile(tempSrtFile, srtContent);
            // Subir al CDN
            await uploadToCDN(tempSrtFile, `assets/escenas/${srtName}`);
            srtContent = `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${srtName}`;
        }

        // Retornar también la URL de subtítulos junto al video
        const videoName = pathMod.basename(tempFile);
        console.log(`[ClipService] [CDN] Subiendo video al CDN:`, { videoName, size: response.data.length });
        await uploadToCDN(tempFile, `videos/${videoName}`);

        // Carry-over: extraer frame justo antes del corte para el siguiente clip (solo si no es el último)
        if (idx < scenes.length - 1) {
            console.log(`[ClipService] [Carryover] Extrayendo frame para continuidad de escena ${idx + 1}...`);
            try {
                carryoverFrameUrl = await extractAndUploadFrame(tempFile, carryoverFrameTime, uploadToCDN);
                console.log(`[ClipService] [Carryover] Frame extraído exitosamente:`, { frameUrl: carryoverFrameUrl?.substring(0, 50) + '...' });
            } catch (e) {
                console.log(`[ClipService] [Error] Error extrayendo frame de carryover:`, { error: e });
                carryoverFrameUrl = undefined;
            }
        }

        // No borrar el archivo temporal aún, lo usará FFmpeg
        // Si no es el primer clip, generar imagen de transición y guardarla
        if (idx > 0) {
            console.log(`[ClipService] [Transición] Generando transición para escena ${idx + 1}...`);
            const prevScene = scenes[idx - 1];
            const prevImageUrl = (prevScene.backgroundImageUrl || '') as string;
            const transitionImageUrl = await generateTransitionImage(prevImageUrl, backgroundImageUrl || '');
            // Descargar imagen de transición y guardarla como clip
            if (transitionImageUrl) {
                console.log(`[ClipService] [Transición] Descargando imagen de transición...`);
                const tempDir = os.tmpdir();
                const tempTransitionFile = pathMod.join(tempDir, `transition_${Date.now()}_${Math.floor(Math.random()*1e6)}.png`);
                const response = await axios.get(transitionImageUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(tempTransitionFile, response.data);
                // Insertar el archivo de transición antes del clip actual
                return [tempTransitionFile, tempFile];
            }
        }
        return tempFile;
    });

  // Esperar a que TODOS los clips estén listos antes de pasar a FFmpeg
  // Aplanar el array de clips para incluir transiciones
  const clipsRaw = await Promise.all(clipPromises);
  const clips: string[] = clipsRaw.flat();
  console.log('🟢 [Kling] TODOS los clips generados y descargados. Iniciando ensamblado FFmpeg...');
  console.log('[ClipService] [FFmpeg] Preparando para ensamblado:', { totalClips: clips.length, hasVoiceOver: !!opts?.voiceOver });
  // Obtener buffers de audio por escena (music, ambience, sfx)
  const sceneAudio = await getSceneAudio(scenes);
  console.log('[ClipService] [Audio] Audio de escenas obtenido:', { scenes: sceneAudio.length });
  // Separar buffers por tipo
  const musicArr = sceneAudio.map(a => a.music);
  const ambienceArr = sceneAudio.map(a => a.ambience);
  const sfxArr = sceneAudio.map(a => a.sfx);
  console.log('[ClipService] [Audio] Buffers separados:', { music: musicArr.length, ambience: ambienceArr.length, sfx: sfxArr.length });
  const { assembleVideo } = await import('./ffmpegService.js');
  const plan = opts?.plan ?? ({} as any);
  const voiceOver = opts?.voiceOver ?? Buffer.from([]);
  // Mejora 3: aplicar LUT profesional de cine en el ensamblado final
  // Ejemplo: 'CineLook.cube' debe estar en la carpeta 'luts/'
  const lutPath = pathMod.join(__dirname, '../luts/CineLook.cube');
  console.log('[ClipService] [FFmpeg] Iniciando ensamblado base:', { clips: clips.length, lutPath });
  const finalUrlRaw = await assembleVideo({
    plan,
    clips,
    voiceOver,
    music: musicArr,
    ambience: ambienceArr,
    sfx: sfxArr
    // Puedes agregar más hooks aquí para overlays, branding, etc.
  });
  console.log('[ClipService] [FFmpeg] Video base ensamblado:', { finalUrlRaw });
  // Aplica el LUT y motion blur/profundidad de campo con FFmpeg
  const finalUrlLut = finalUrlRaw.replace('.mp4', '_lut.mp4');
  const ffmpegLutCmd = `ffmpeg -y -i "${finalUrlRaw}" -vf "lut3d='${lutPath}'" -c:a copy "${finalUrlLut}"`;
  console.log('[ClipService] [LUT] Aplicando LUT cinematográfico:', { input: finalUrlRaw, output: finalUrlLut });
  await import('child_process').then(cp => cp.execSync(ffmpegLutCmd));

  // Motion blur y profundidad de campo
  const finalUrlBlur = finalUrlLut.replace('.mp4', '_blur.mp4');
  const ffmpegBlurCmd = `ffmpeg -y -i "${finalUrlLut}" -vf "minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1',boxblur=2:1" -c:a copy "${finalUrlBlur}"`;
  console.log('[ClipService] [MotionBlur] Aplicando motion blur y profundidad de campo:', { input: finalUrlLut, output: finalUrlBlur });
  await import('child_process').then(cp => cp.execSync(ffmpegBlurCmd));

  // Mejora 5: overlay de logo y subtítulos automáticos
  const finalUrlOverlay = finalUrlBlur.replace('.mp4', '_overlay.mp4');
  const logoPath = pathMod.join(__dirname, '../branding/logo.png');
  console.log('[ClipService] [Overlay] Preparando overlay de branding y subtítulos:', { logoPath });
  // Generar archivo de subtítulos si hay texto en las escenas
  let subtitlesPath = '';
  const subtitlesArr = scenes.map((scene, idx) => {
    if (scene.subtitle) {
      return `${idx + 1}\n00:00:${String(idx * 10).padStart(2, '0')},000 --> 00:00:${String((idx + 1) * 10).padStart(2, '0')},000\n${scene.subtitle}\n`;
    }
    return '';
  }).filter(Boolean);
  if (subtitlesArr.length > 0) {
    console.log('[ClipService] [Subtítulos] Generando archivo de subtítulos:', { count: subtitlesArr.length });
    subtitlesPath = pathMod.join(os.tmpdir(), `subtitles_${Date.now()}.srt`);
    await fs.writeFile(subtitlesPath, subtitlesArr.join('\n'), 'utf-8');
  }
  // Comando FFmpeg para overlay de logo y subtítulos
  let ffmpegOverlayCmd = `ffmpeg -y -i "${finalUrlBlur}" -i "${logoPath}" -filter_complex "overlay=W-w-20:H-h-20" -c:a copy`;
  if (subtitlesPath) {
    ffmpegOverlayCmd += ` -vf subtitles='${subtitlesPath}'`;
  }
  ffmpegOverlayCmd += ` "${finalUrlOverlay}"`;
  console.log('[ClipService] [Overlay] Ejecutando overlay final:', { hasSubtitles: !!subtitlesPath, output: finalUrlOverlay });
  await import('child_process').then(cp => cp.execSync(ffmpegOverlayCmd));

  console.log('[ClipService] [Success] Pipeline completado exitosamente:', { finalUrl: finalUrlOverlay, totalClips: clips.length });
  return { finalUrl: finalUrlOverlay, clips };
}
