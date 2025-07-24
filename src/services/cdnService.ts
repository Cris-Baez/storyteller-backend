import { logFeedback } from './feedbackService.js';
// src/services/cdnService.ts
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const storage = new Storage({
  projectId: env.GCP_PROJECT_ID,
  keyFilename: env.GCP_CREDENTIALS_JSON,
});

const bucket = storage.bucket(env.GCP_BUCKET_NAME);

/**
 * Sube un archivo local al CDN (Google Cloud Storage) con validación avanzada, logs enriquecidos y soporte opcional para metadatos.
 * @param localFilePath Ruta local al archivo
 * @param cdnPath Ruta destino en el bucket
 * @param options Opcional: metadatos avanzados (escena, feedback, tipo, etc)
 * @returns URL pública del archivo en el CDN
 */
export async function uploadToCDN(
  localFilePath: string,
  cdnPath: string,
  options?: {
    sceneId?: string;
    feedback?: string;
    type?: string;
    [key: string]: any;
  }
): Promise<string> {
  // Validación avanzada de parámetros
  if (typeof localFilePath !== 'string' || !localFilePath) {
    logger.error('uploadToCDN: localFilePath inválido');
    logFeedback({
      service: 'CDN',
      action: 'upload',
      success: false,
      error: 'localFilePath inválido',
      params: { localFilePath, cdnPath }
    });
    throw new Error('localFilePath inválido');
  }
  if (typeof cdnPath !== 'string' || !cdnPath) {
    logger.error('uploadToCDN: cdnPath inválido');
    logFeedback({
      service: 'CDN',
      action: 'upload',
      success: false,
      error: 'cdnPath inválido',
      params: { localFilePath, cdnPath }
    });
    throw new Error('cdnPath inválido');
  }
  try {
    await fs.access(localFilePath);
  } catch (error) {
    logger.error(`uploadToCDN: El archivo no existe en la ruta especificada: ${localFilePath}`);
    throw new Error(`El archivo no existe en la ruta especificada: ${localFilePath}`);
  }

  // Subida robusta con timeout y retry
  const uploadTimeout = 600_000; // 10 minutos
  logger.info(`[CDN] Timeout de subida configurado en ${uploadTimeout / 1000} segundos`);
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const start = Date.now();
    try {
      const uploadPromise = bucket.upload(localFilePath, { destination: cdnPath });
      await Promise.race([
        uploadPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de subida a CDN')), uploadTimeout))
      ]);
      const url = `https://storage.googleapis.com/${env.GCP_BUCKET_NAME}/${cdnPath}`;
      logger.info(`[CDN] Archivo subido correctamente: ${cdnPath} → ${url} (intento ${attempt})`);
      if (options) {
        logger.info(`[CDN] Metadatos asociados: ${JSON.stringify(options)}`);
      }
      logFeedback({
        service: 'CDN',
        action: 'upload',
        timeoutMs: uploadTimeout,
        elapsedMs: Date.now() - start,
        attempt,
        success: true,
        params: { localFilePath, cdnPath }
      });
      return url;
    } catch (e: any) {
      lastError = e;
      logger.error(`[CDN] Error subiendo archivo (intento ${attempt}): ${e.message}`);
      logFeedback({
        service: 'CDN',
        action: 'upload',
        timeoutMs: uploadTimeout,
        elapsedMs: Date.now() - start,
        attempt,
        success: false,
        error: e.message,
        params: { localFilePath, cdnPath }
      });
      if (attempt < 5) await new Promise(res => setTimeout(res, 2000 * attempt));
    }
  }
  logger.error(`[CDN] Fallo definitivo tras 5 intentos: ${lastError?.message}`);
  throw lastError || new Error('Error desconocido en subida a CDN');
}
