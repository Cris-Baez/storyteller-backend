// Servicio para extraer frames de video y subirlos al CDN para carry-over Kling
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

/**
 * Extrae un frame de un video local en el segundo especificado y lo sube al CDN.
 * @param videoPath Ruta local al video mp4
 * @param timeSegs Tiempo en segundos (ej: 9.3)
 * @param uploadToCDN función async (localPath, cdnPath) => url
 * @returns URL pública del frame en el CDN
 */
export async function extractAndUploadFrame(videoPath: string, timeSegs: number, uploadToCDN: (local: string, cdn: string) => Promise<string>): Promise<string> {
  const tempDir = os.tmpdir();
  const frameFile = path.join(tempDir, `carryover_${Date.now()}_${Math.floor(Math.random()*1e6)}.jpg`);
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
  const cdnPath = `carryover/${path.basename(frameFile)}`;
  const url = await uploadToCDN(frameFile, cdnPath);
  await fs.unlink(frameFile);
  return url;
}
