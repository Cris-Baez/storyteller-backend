// src/pipelines/renderPipeline.ts
import type { RenderRequest, RenderResponse, VideoPlan } from '../utils/types.js';
import { v4 as uuidv4 } from 'uuid';
import { createVideoPlan } from '../services/llmService.js';
import { generateStoryboards } from '../services/storyboardService.js';
import { generateClips } from '../services/clipService.js';
import { createVoiceOver } from '../services/voiceService.js';
import { getBackgroundMusic } from '../services/musicService.js';
import { assembleVideo } from '../services/ffmpegService.js';

import { logger } from '../utils/logger.js';
import { retry  } from '../utils/retry.js';
import fs         from 'fs/promises';
import fss        from 'fs';
import path       from 'path';
import fetch      from 'node-fetch';

const TIMEOUT = 600_000;         // 10 min para pipeline completo
let TMP_DIR = '/tmp/pipeline_v7';

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(()=>rej(new Error('timeout')), ms))
  ]);
}

export async function runRenderPipeline(req: RenderRequest): Promise<RenderResponse> {
  logger.info('🚀 Pipeline v7 – inicio');
  const t0 = Date.now();

  // --- DEMO MODE: fuerza carpeta única y logging de outputs ---
  let demoId = '';
  let demoMode = false;
  if (req.demoMode || req.metadata?.demoMode) demoMode = true;
  // Si el VideoPlan generado tiene demoMode, también lo activamos

  if (demoMode) {
    demoId = uuidv4();
    TMP_DIR = path.join('/tmp/pipeline_demo', demoId);
    logger.info(`[DEMO MODE] Carpeta de outputs: ${TMP_DIR}`);
  } else {
    TMP_DIR = '/tmp/pipeline_v7';
  }
  await fs.mkdir(TMP_DIR, { recursive: true });

  /* 1. Plan escena‑a‑escena */
  const plan: VideoPlan = await withTimeout(
    retry(() => createVideoPlan(req)),
    TIMEOUT
  );
  logger.info(`📜 VideoPlan listo (${plan.timeline.length}s)`);

  // --- DEMO MODE: fuerza LoRA, música, overlays, SFX globales ---
  if (demoMode) {
    if (plan.metadata.characterLora) {
      plan.timeline.forEach(sec => { sec.lora = plan.metadata.characterLora; });
    }
    if (plan.metadata.backgroundLora) {
      plan.timeline.forEach(sec => { sec.backgroundLora = plan.metadata.backgroundLora; });
    }
    if (plan.metadata.music) {
      plan.metadata.music = plan.metadata.music;
    }
    if (Array.isArray(plan.metadata.overlays)) {
      plan.timeline.forEach(sec => { sec.overlays = plan.metadata.overlays; });
    }
    if (Array.isArray(plan.metadata.luts)) {
      plan.timeline.forEach(sec => { sec.luts = plan.metadata.luts; });
    }
    if (Array.isArray(plan.metadata.sfx)) {
      plan.timeline.forEach(sec => { sec.sfx = plan.metadata.sfx; });
    }
  }

  /* 2. Storyboard (Best effort) - Adaptar el procesamiento para soportar VideoPlan.timeline con scene, sceneStart y metadatos enriquecidos */
  // Procesar cada escena/toma por separado si es necesario (por ejemplo, para llamadas a Replicate)
  // Usar referenceImages y metadatos de música si están presentes
  const storyboards = await retry(() => generateStoryboards(plan))
    .catch(err => {
      logger.warn(`StoryboardService falló → se continúa sin storyboards (${err.message})`);
      return [] as string[];
    });

  /* 3. Clips, Voz, Música en paralelo */
  // Soportar que music puede ser string o MusicSpec
  let musicMood: string = req.mode;
  if (plan.metadata.music) {
    if (typeof plan.metadata.music === 'string') {
      musicMood = plan.metadata.music;
    } else if ('mood' in plan.metadata.music && typeof plan.metadata.music.mood === 'string') {
      musicMood = plan.metadata.music.mood;
    }
  }
  const [
    clipUrlsRaw,
    voiceBufRaw,
    musicBufRaw
  ] = await Promise.all([
    retry(() => generateClips(plan)) as Promise<string[]>,
    retry(() => createVoiceOver(plan)).catch(()=>null) as Promise<Buffer|null>,
    retry(() => getBackgroundMusic(musicMood)).catch(()=>null) as Promise<Buffer|null>
  ]);

  const clipUrls: string[] = Array.isArray(clipUrlsRaw) ? clipUrlsRaw : [];
  if (!clipUrls.length) throw new Error('generateClips devolvió 0 clips');

  /* 4. Descargar clips a disco (stream) para FFmpeg */
  const localClips: string[] = [];
  for (const url of clipUrls) {
    const filename  = path.join(TMP_DIR, path.basename(url));
    if (!fss.existsSync(filename)) {
      const res = await fetch(url);
      await fs.writeFile(filename, Buffer.from(await res.arrayBuffer()));
    }
    localClips.push(filename);
  }

  /* 5. Fallback si falta VO o Música */
  const voice: Buffer = voiceBufRaw ?? await createSilentWav(plan.timeline.length);
  const music: Buffer = musicBufRaw ?? voice;              // usa silencio si falla música

  /* 6. Asamblea final */
  const finalUrl: string = await withTimeout(
    retry(() => assembleVideo({ plan, clips: localClips, voiceOver: voice, music })),
    TIMEOUT * 2
  );

  // --- DEMO MODE: guardar outputs y logs ---
  if (demoMode) {
    await fs.writeFile(path.join(TMP_DIR, 'VideoPlan.json'), Buffer.from(JSON.stringify(plan, null, 2)));
    await fs.writeFile(path.join(TMP_DIR, 'clips.json'), Buffer.from(JSON.stringify(localClips, null, 2)));
    await fs.writeFile(path.join(TMP_DIR, 'finalUrl.txt'), Buffer.from(finalUrl));
    logger.info(`[DEMO MODE] Outputs y logs guardados en ${TMP_DIR}`);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  logger.info(`✅ Render final OK en ${elapsed}s → ${finalUrl}`);

  return { url: finalUrl, storyboardUrls: storyboards as string[] };
}

/* — helper: WAV silencio — */
async function createSilentWav(seconds: number) {
  const samples = seconds * 48000;
  const header = Buffer.alloc(44);
  header.write('RIFF');            // ChunkID
  header.writeUInt32LE(36 + samples*2, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);     // Subchunk1Size
  header.writeUInt16LE(1, 20);      // PCM
  header.writeUInt16LE(1, 22);      // mono
  header.writeUInt32LE(48000, 24);  // sampleRate
  header.writeUInt32LE(48000*2, 28);// byteRate
  header.writeUInt16LE(2, 32);      // blockAlign
  header.writeUInt16LE(16, 34);     // bits
  header.write('data', 36);
  header.writeUInt32LE(samples*2, 40);
  return Buffer.concat([header, Buffer.alloc(samples*2)]);
}
