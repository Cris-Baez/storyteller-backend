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

export async function uploadToCDN(localFilePath: string, cdnPath: string): Promise<string> {
  try {
    // Verificar si el archivo existe
    await fs.access(localFilePath);
  } catch (error) {
    throw new Error(`El archivo no existe en la ruta especificada: ${localFilePath}`);
  }


  // Subida simple, sin ACLs ni public:true (compatible con uniform bucket-level access)
  await bucket.upload(localFilePath, {
    destination: cdnPath
  });

  const url = `https://storage.googleapis.com/${env.GCP_BUCKET_NAME}/${cdnPath}`;
  logger.info(`Archivo subido correctamente al CDN: ${cdnPath} → ${url}`);
  return url;
}
