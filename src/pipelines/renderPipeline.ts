// src/pipelines/renderPipeline.ts
import type { RenderRequest, RenderResponse, VideoPlan } from '../utils/types.js';
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
const TMP_DIR = '/tmp/pipeline_v7';

async function withTimeout<T>(p: Promise<T>, ms = TIMEOUT) {
  return Promise.race([
    p,
    new Promise<never>((_, rej) => setTimeout(()=>rej(new Error('timeout')), ms))
  ]);
}

export async function runRenderPipeline(req: RenderRequest): Promise<RenderResponse> {
  logger.info('🚀 Pipeline v7 – inicio');
  const t0 = Date.now();
  await fs.mkdir(TMP_DIR, { recursive: true });

  /* 1. Plan escena‑a‑escena */
  const plan: VideoPlan = await withTimeout(
    retry(() => createVideoPlan(req)),
    TIMEOUT
  );
  logger.info(`📜 VideoPlan listo (${plan.timeline.length}s)`);

  /* 2. Storyboard (Best effort) */
  const storyboards = await retry(() => generateStoryboards(plan))
    .catch(err => {
      logger.warn(`StoryboardService falló → se continúa sin storyboards (${err.message})`);
      return [] as string[];
    });

  /* 3. Clips, Voz, Música en paralelo */
  const [
    clipUrlsRaw,
    voiceBufRaw,
    musicBufRaw
  ] = await Promise.all([
    retry(() => generateClips(plan)) as Promise<string[]>,
    retry(() => createVoiceOver(plan)).catch(()=>null) as Promise<Buffer|null>,
    retry(() => getBackgroundMusic(plan.metadata.music?.mood ?? req.mode)).catch(()=>null) as Promise<Buffer|null>
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
