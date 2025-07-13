// src/pipelines/renderPipeline.ts
/**
 * Render Pipeline v6
 * ------------------
 * 1. createVideoPlan  (GPT-4o → …)           → VideoPlan second-by-second
 * 2. generateStoryboards(plan)               → PNGs clave
 * 3. generateClips(plan)                     → MP4 por segmento
 * 4. createVoiceOver(plan)                   → pista VO exacta duration
 * 5. getBackgroundMusic(plan.metadata.music) → pista BGM normalizada
 * 6. assembleVideo({plan,clips,voice,music}) → MP4 1080p60 + HLS
 * 7. Devuelve RenderResponse
 */

import { RenderRequest, RenderResponse, VideoPlan } from '../utils/types.js';
import { createVideoPlan }    from '../services/llmService.js';
import { generateStoryboards }from '../services/storyboardService.js';
import { generateClips }      from '../services/clipService.js';
import { createVoiceOver }    from '../services/voiceService.js';
import { getBackgroundMusic } from '../services/musicService.js';
import { assembleVideo }      from '../services/ffmpegService.js';

import { logger }   from '../utils/logger.js';
import { retry }    from '../utils/retry.js';

const TIMEOUT = 60_000;   // Reducido a 60 segundos

/* Helper timeout */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(()=>rej(new Error('timeout')), ms))
  ]);
}

/* ════════════════════════════════════════════════════════
 * runRenderPipeline – API pública
 * ═══════════════════════════════════════════════════════ */
export async function runRenderPipeline(req: RenderRequest): Promise<RenderResponse> {
  logger.info('🚀 Pipeline v6 — inicio render');
  const t0 = Date.now();

  /* 1️⃣  Plan milimétrico */
  const plan: VideoPlan = await withTimeout(retry(()=>createVideoPlan(req)), TIMEOUT);
  logger.info(`📜 Plan OK (${plan.timeline.length}s)`);

  /* 2️⃣  Storyboards · Clips · VO · Música (paralelo) */
  const [
    storyboardUrls,
    clips,
    voiceOver,
    music
  ] = await Promise.all([
    withTimeout(retry(()=>generateStoryboards(plan))),
    withTimeout(retry(()=>generateClips(plan))),
    withTimeout(retry(()=>createVoiceOver(plan))),
    withTimeout(retry(()=>getBackgroundMusic(plan.metadata.music?.mood ?? req.mode)))
  ]);

  logger.info(`Assets → SB:${storyboardUrls.length}  Clips:${clips.length}  VO:${voiceOver.length}B  BGM:${music.length}B`);

  /* 3️⃣  Ensamblado final */
  const url = await withTimeout(
    retry(()=>assembleVideo({ plan, clips, voiceOver, music })),
    TIMEOUT * 2   // FFmpeg puede requerir más tiempo
  );

  const elapsed = ((Date.now()-t0)/1000).toFixed(1);
  logger.info(`✅ Render completo en ${elapsed}s → ${url}`);

  return { url, storyboardUrls };
}
