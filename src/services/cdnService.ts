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
    throw new Error('localFilePath inválido');
  }
  if (typeof cdnPath !== 'string' || !cdnPath) {
    logger.error('uploadToCDN: cdnPath inválido');
    throw new Error('cdnPath inválido');
  }
  try {
    await fs.access(localFilePath);
  } catch (error) {
    logger.error(`uploadToCDN: El archivo no existe en la ruta especificada: ${localFilePath}`);
    throw new Error(`El archivo no existe en la ruta especificada: ${localFilePath}`);
  }

  // Subida simple, sin ACLs ni public:true (compatible con uniform bucket-level access)
  try {
    await bucket.upload(localFilePath, {
      destination: cdnPath
    });
    const url = `https://storage.googleapis.com/${env.GCP_BUCKET_NAME}/${cdnPath}`;
    logger.info(`[CDN] Archivo subido correctamente: ${cdnPath} → ${url}`);
    // Registrar metadatos si existen
    if (options) {
      logger.info(`[CDN] Metadatos asociados: ${JSON.stringify(options)}`);
      // Aquí podrías guardar los metadatos en una base de datos/log externo si lo deseas
    }
    return url;
  } catch (e: any) {
    logger.error(`[CDN] Error subiendo archivo: ${e.message}`);
    throw e;
  }
}
