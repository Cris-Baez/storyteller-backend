// Servicio para extraer frames de video y subirlos al CDN para carry-over Kling
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';


import { logger } from '../utils/logger.js';

/**
 * Extrae un frame de un video local en el segundo especificado y lo sube al CDN.
 * Permite validación avanzada, logs enriquecidos y metadatos opcionales para trazabilidad profesional.
 * @param videoPath Ruta local al video mp4
 * @param timeSegs Tiempo en segundos (ej: 9.3)
 * @param uploadToCDN función async (localPath, cdnPath) => url
 * @param options Opcional: metadatos avanzados (escena, feedback, continuidad, etc)
 * @returns URL pública del frame en el CDN
 */
export async function extractAndUploadFrame(
  videoPath: string,
  timeSegs: number,
  uploadToCDN: (local: string, cdn: string) => Promise<string>,
  options?: {
    sceneId?: string;
    continuity?: string;
    feedback?: string;
    [key: string]: any;
  }
): Promise<string> {
  // Validación avanzada de parámetros
  if (typeof videoPath !== 'string' || !videoPath.endsWith('.mp4')) {
    logger.error('extractAndUploadFrame: videoPath inválido o no es mp4');
    throw new Error('videoPath inválido');
  }
  if (typeof timeSegs !== 'number' || timeSegs < 0) {
    logger.error('extractAndUploadFrame: timeSegs inválido');
    throw new Error('timeSegs inválido');
  }
  if (typeof uploadToCDN !== 'function') {
    logger.error('extractAndUploadFrame: uploadToCDN debe ser función async');
    throw new Error('uploadToCDN inválido');
  }
  logger.info(`[CarryOver] Extrayendo frame: video=${videoPath}, seg=${timeSegs}, opts=${JSON.stringify(options)}`);
  const tempDir = os.tmpdir();
  const frameFile = path.join(tempDir, `carryover_${Date.now()}_${Math.floor(Math.random()*1e6)}.jpg`);
  try {
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-ss', String(timeSegs),
        '-i', videoPath,
        '-frames:v', '1',
        '-q:v', '2',
        '-y',
        frameFile
      ]);
      ffmpeg.on('close', (code) => code === 0 ? resolve() : reject(new Error('ffmpeg error')));
    });
    logger.info(`[CarryOver] Frame extraído correctamente: ${frameFile}`);
    const cdnPath = `carryover/${path.basename(frameFile)}`;
    const url = await uploadToCDN(frameFile, cdnPath);
    logger.info(`[CarryOver] Frame subido al CDN: ${url}`);
    await fs.unlink(frameFile);
    // Registrar metadatos si existen
    if (options) {
      logger.info(`[CarryOver] Metadatos asociados: ${JSON.stringify(options)}`);
      // Aquí podrías guardar los metadatos en una base de datos/log externo si lo deseas
    }
    return url;
  } catch (e: any) {
    logger.error(`[CarryOver] Error extrayendo/subiendo frame: ${e.message}`);
    // Fallback: podrías retornar una imagen por defecto o null
    throw e;
  }
}
