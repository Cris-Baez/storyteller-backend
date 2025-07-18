import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface SadTalkerOptions {
  sourceImage: string; // ruta a la imagen
  drivenAudio: string; // ruta al audio
  outputDir?: string; // carpeta de resultados
  enhancer?: 'gfpgan' | 'RestoreFormer';
  preprocess?: 'full' | 'crop' | 'resize';
  still?: boolean;
  size?: 256 | 512;
}

/**
 * Ejecuta SadTalker desde Node.js y retorna la ruta del video generado.
 */
export async function runSadTalker(options: SadTalkerOptions): Promise<string> {
  const {
    sourceImage,
    drivenAudio,
    outputDir = './results',
    enhancer = 'gfpgan',
    preprocess = 'full',
    still = true,
    size = 256,
  } = options;

  // Construir comando
  const scriptPath = path.resolve(__dirname, '../../SadTalker/inference.py');
  const cwd = path.resolve(__dirname, '../../SadTalker');
  const venvPython = process.env.VENV_PYTHON || 'python';

  // Generar nombre de salida único
  const timestamp = Date.now();
  const resultDir = path.resolve(cwd, outputDir);
  if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });

  // Comando base
  const args = [
    scriptPath,
    '--source_image', sourceImage,
    '--driven_audio', drivenAudio,
    '--result_dir', resultDir,
    '--preprocess', preprocess,
    '--enhancer', enhancer,
    '--size', String(size),
  ];
  if (still) args.push('--still');

  // Ejecutar el proceso
  return new Promise((resolve, reject) => {
    const proc = spawn(venvPython, args, { cwd });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`SadTalker error: ${stderr || stdout}`));
      }
      // Buscar el último archivo mp4 generado en el directorio de resultados
      const files = fs.readdirSync(resultDir)
        .filter(f => f.endsWith('.mp4'))
        .map(f => ({ f, t: fs.statSync(path.join(resultDir, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t);
      if (files.length === 0) {
        return reject(new Error('No se generó ningún video mp4.'));
      }
      resolve(path.join(resultDir, files[0].f));
    });
  });
}// src/services/sadtalkerService.ts
/**
 * Aplica SadTalker real para lip-sync en imágenes.
 * @param inputPath Ruta del archivo de imagen o video base
 * @param audioPath Ruta del archivo de audio (voz)
 * @param acting Emoción/acting a aplicar (opcional, por ahora no usado)
 * @param style Estilo visual (cinematic, anime, cartoon, realistic) (opcional, por ahora no usado)
 * @returns Ruta del archivo de video generado
 */
export async function applySadTalker(inputPath: string, audioPath: string, acting?: string, style?: string): Promise<string> {
  // Puedes mapear acting/style a flags de SadTalker si lo deseas en el futuro
  // Por ahora, solo usa los parámetros básicos
  return runSadTalker({
    sourceImage: inputPath,
    drivenAudio: audioPath,
    enhancer: 'gfpgan',
    preprocess: 'full',
    still: true,
    size: 256,
  });
}
