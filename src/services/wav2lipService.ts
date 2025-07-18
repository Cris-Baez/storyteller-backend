
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';


export interface Wav2LipOptions {
  face: string; // ruta al video o imagen base
  audio: string; // ruta al audio
  outputDir?: string; // carpeta de resultados
  still?: boolean;
  resize_factor?: number;
  fps?: number;
}


/**
 * Ejecuta Wav2Lip desde Node.js y retorna la ruta del video generado.
 */
export async function runWav2Lip(options: Wav2LipOptions): Promise<string> {
  const {
    face,
    audio,
    outputDir = './results',
    still = false,
    resize_factor = 1,
    fps = 25,
  } = options;

  // Construir comando
  const scriptPath = path.resolve(__dirname, '../../Wav2Lip/inference.py');
  const cwd = path.resolve(__dirname, '../../Wav2Lip');
  const venvPython = process.env.WAV2LIP_PYTHON || 'python';

  // Generar nombre de salida único
  const timestamp = Date.now();
  const resultDir = path.resolve(cwd, outputDir);
  if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });
  const outPath = path.join(resultDir, `wav2lip_${timestamp}.mp4`);

  // Comando base
  const args = [
    scriptPath,
    '--face', face,
    '--audio', audio,
    '--outfile', outPath,
    '--resize_factor', String(resize_factor),
    '--fps', String(fps),
  ];
  if (still) args.push('--still');

  // Ejecutar el proceso
  return new Promise((resolve, reject) => {
    logger.info(`[Wav2Lip] Ejecutando: ${venvPython} ${args.join(' ')}`);
    const proc = spawn(venvPython, args, { cwd });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) {
        logger.error(`[Wav2Lip] Error: ${stderr || stdout}`);
        return reject(new Error(`Wav2Lip error: ${stderr || stdout}`));
      }
      if (!fs.existsSync(outPath)) {
        logger.error('[Wav2Lip] No se generó ningún video mp4.');
        return reject(new Error('No se generó ningún video mp4.'));
      }
      logger.info(`[Wav2Lip] Video generado: ${outPath}`);
      resolve(outPath);
    });
  });
}


/**
 * Aplica Wav2Lip real para lip-sync en video o imagen.
 * @param face Ruta del video o imagen base
 * @param audio Ruta del archivo de audio (voz)
 * @param acting Emoción/acting a aplicar (opcional, por si se extiende)
 * @param style Estilo visual (opcional)
 * @returns Ruta del archivo de video generado
 */
export async function applyWav2Lip(face: string, audio: string, acting?: string, style?: string): Promise<string> {
  logger.info(`[Wav2Lip] Procesando ${face} + ${audio} | acting: ${acting} | style: ${style}`);
  return runWav2Lip({
    face,
    audio,
    still: false,
    resize_factor: 1,
    fps: 25,
  });
}
