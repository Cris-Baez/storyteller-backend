// src/services/cdnService.ts
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env.js';

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

  await bucket.upload(localFilePath, {
    destination: cdnPath,
    resumable: false,
    public: true,
    metadata: {
      cacheControl: 'public, max-age=86400', // 1 día de caché
    },
  });

  return `https://storage.googleapis.com/${env.GCP_BUCKET_NAME}/${cdnPath}`;
}
