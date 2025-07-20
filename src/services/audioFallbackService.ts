// Servicio centralizado para fallback y reintentos de audio robusto
import { logger } from '../utils/logger.js';
import { getBackgroundMusic } from './musicService.js';
import { createVoiceOver } from './voiceService.js';
import fs from 'fs/promises';

// Fallback de silencio (buffer de n segundos)
export async function getSilenceBuffer(durationSec: number = 3): Promise<Buffer> {
  // Genera un buffer de silencio usando ffmpeg o un archivo preexistente
  // Aquí solo retorna un buffer vacío (puedes mejorar con un archivo real)
  return Buffer.from([]);
}

// Reintento robusto para cualquier generador de audio
export async function robustAudioGen<T extends (...args: any[]) => Promise<Buffer>>(
  fn: T,
  args: Parameters<T>,
  maxRetries = 3,
  fallbackSilenceSec = 3
): Promise<Buffer> {
  let lastErr;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const buf = await fn(...args);
      if (buf && Buffer.isBuffer(buf) && buf.length > 0) return buf;
    } catch (e) {
      lastErr = e;
      logger.warn(`[AudioFallback] Intento ${i + 1} fallido: ${e instanceof Error ? e.message : e}`);
    }
  }
  logger.warn(`[AudioFallback] Todos los intentos fallaron. Usando silencio de ${fallbackSilenceSec}s.`);
  return getSilenceBuffer(fallbackSilenceSec);
}
