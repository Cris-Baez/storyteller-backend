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

const TIMEOUT = 500_000;   // 5 minutos para todo el pipeline

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

  try {
    /* 1️⃣  Plan milimétrico */
    const plan: VideoPlan = await withTimeout(retry(()=>createVideoPlan(req)), TIMEOUT);
    logger.info(`📜 Plan OK (${plan.timeline.length}s)`);


    // 2️⃣ Storyboards primero
    const storyboardUrls: string[] = await withTimeout(retry(()=>generateStoryboards(plan))).catch(err => {
      logger.error(`❌ Error en generateStoryboards: ${err.message}`);
      throw err;
    });

    // 3️⃣ Clips, VO y música en paralelo
    const [clips, voiceOver, music] = await Promise.all([
      withTimeout(retry(()=>generateClips(plan, storyboardUrls))).catch(err => {
        logger.error(`❌ Error en generateClips: ${err.message}`);
        throw err;
      }),
      withTimeout(retry(()=>createVoiceOver(plan))).catch(err => {
        logger.error(`❌ Error en createVoiceOver: ${err.message}`);
        throw err;
      }),
      withTimeout(retry(()=>getBackgroundMusic(plan.metadata.music?.mood ?? req.mode))).catch(err => {
        logger.error(`❌ Error en getBackgroundMusic: ${err.message}`);
        throw err;
      })
    ]);

    // Verificación de assets
    logger.info('Verificando assets generados...');
    if (!Array.isArray(storyboardUrls) || storyboardUrls.length === 0) {
      logger.error('No se generaron storyboards válidos.');
      throw new Error('No se generaron storyboards válidos.');
    }
    if (!Array.isArray(clips) || clips.length === 0) {
      logger.error('No se generaron clips de video válidos.');
      throw new Error('No se generaron clips de video válidos.');
    }
    if (!voiceOver || !Buffer.isBuffer(voiceOver) || voiceOver.length === 0) {
      logger.error('No se generó la pista de voz.');
      throw new Error('No se generó la pista de voz.');
    }
    if (!music || !Buffer.isBuffer(music) || music.length === 0) {
      logger.error('No se generó la pista de música.');
      throw new Error('No se generó la pista de música.');
    }

    // Logs claros de assets
    logger.info('Storyboards CDN URLs:');
    storyboardUrls.forEach((url, i) => logger.info(`  [SB${i}] ${url}`));
    logger.info('Clips locales:');
    clips.forEach((clip, i) => logger.info(`  [Clip${i}] ${clip}`));
    logger.info(`VoiceOver buffer size: ${voiceOver.length} bytes`);
    logger.info(`Music buffer size: ${music.length} bytes`);

    // Validar accesibilidad de URLs de storyboards (HEAD request)
    const axios = (await import('axios')).default;
    await Promise.all(storyboardUrls.map(async (url, i) => {
      try {
        await axios.head(url, { timeout: 10000 });
        logger.info(`✅ Storyboard accesible: ${url}`);
      } catch {
        logger.warn(`⚠️  Storyboard no accesible (HEAD fail): ${url}`);
      }
    }));

    /* 3️⃣  Ensamblado final y subida a CDN */
    let url = '';
    try {
      url = await withTimeout(
        retry(()=>assembleVideo({ plan, clips, voiceOver, music })),
        TIMEOUT * 2   // FFmpeg puede requerir más tiempo
      );
    } catch (err) {
      logger.error(`❌ Error en assembleVideo o subida CDN: ${(err instanceof Error ? err.message : err)}`);
      throw new Error('Error en el ensamblado o subida del video final al CDN');
    }

    // Validar accesibilidad del video final
    try {
      const axios = (await import('axios')).default;
      await axios.head(url, { timeout: 15000 });
      logger.info(`✅ Video final accesible en CDN: ${url}`);
    } catch {
      logger.warn(`⚠️  El video final no es accesible en el CDN (HEAD fail): ${url}`);
      throw new Error('El video final no es accesible en el CDN');
    }

    const elapsed = ((Date.now()-t0)/1000).toFixed(1);
    logger.info(`✅ Render completo en ${elapsed}s → ${url}`);

    return { url, storyboardUrls };
  } catch (error) {
    logger.error(`❌ Error en runRenderPipeline: ${(error instanceof Error ? error.message : error)}`);
    throw new Error(`Pipeline falló: ${error instanceof Error ? error.message : error}`);
  }
}
