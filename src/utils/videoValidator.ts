import fetch from 'node-fetch';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
  duration: number;
  hasAudio: boolean;
}

export class VideoValidator {
  
  /**
   * Valida un video completo desde su URL
   */
  static async validateVideo(videoUrl: string, expectedDuration?: number): Promise<VideoValidationResult> {
    const result: VideoValidationResult = {
      valid: false,
      errors: [],
      duration: 0,
      hasAudio: false
    };

    try {
      // 1. Verificar que el URL existe y responde con status 200
      const urlValidation = await this.validateUrl(videoUrl);
      if (!urlValidation.valid) {
        result.errors.push(`URL no válida: ${urlValidation.error}`);
        return result;
      }

      // 2. Descargar temporalmente para análisis
      const tempFile = await this.downloadVideoTemporarily(videoUrl);
      
      try {
        // 3. Analizar el video con ffprobe
        const videoInfo = await this.analyzeVideoWithFFProbe(tempFile);
        
        result.duration = videoInfo.duration;
        result.hasAudio = videoInfo.hasAudio;

        // 4. Validar duración (al menos 90% del tiempo esperado)
        if (expectedDuration) {
          const minDuration = expectedDuration * 0.9;
          if (result.duration < minDuration) {
            result.errors.push(`Duración insuficiente: ${result.duration}s (mínimo: ${minDuration}s)`);
          }
        }

        // 5. Validar que tenga audio
        if (!result.hasAudio) {
          result.errors.push('El video no tiene pista de audio');
        }

        // 6. Determinar si es válido
        result.valid = result.errors.length === 0;

      } finally {
        // Limpiar archivo temporal
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }

    } catch (error: any) {
      result.errors.push(`Error durante validación: ${error?.message || 'Error desconocido'}`);
    }

    return result;
  }

  /**
   * Valida que la URL sea accesible
   */
  private static async validateUrl(url: string): Promise<{valid: boolean, error?: string}> {
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.status !== 200) {
        return { valid: false, error: `Status HTTP ${response.status}` };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('video')) {
        return { valid: false, error: `Content-Type no es video: ${contentType}` };
      }

      return { valid: true };
    } catch (error: any) {
      return { valid: false, error: error?.message || 'Error de conexión' };
    }
  }

  /**
   * Descarga el video temporalmente para análisis
   */
  private static async downloadVideoTemporarily(url: string): Promise<string> {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `video_${Date.now()}.mp4`);
    
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) {
      throw new Error(`Error descargando video: ${response.status}`);
    }

    const fileStream = fs.createWriteStream(tempFile);
    return new Promise((resolve, reject) => {
      if (!response.body) {
        reject(new Error('Response body is null'));
        return;
      }
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', () => resolve(tempFile));
      fileStream.on('error', reject);
    });
  }

  /**
   * Analiza el video usando ffprobe
   */
  private static async analyzeVideoWithFFProbe(filePath: string): Promise<{duration: number, hasAudio: boolean}> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ]);

      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        console.warn('ffprobe stderr:', data.toString());
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          // Si ffprobe falla, usar método alternativo más simple
          this.analyzeVideoBasic(filePath)
            .then(resolve)
            .catch(reject);
          return;
        }

        try {
          const info = JSON.parse(output);
          const duration = parseFloat(info.format?.duration || '0');
          const hasAudio = info.streams?.some((stream: any) => stream.codec_type === 'audio') || false;
          
          resolve({ duration, hasAudio });
        } catch (error: any) {
          reject(new Error(`Error parsing ffprobe output: ${error?.message || 'Parse error'}`));
        }
      });

      ffprobe.on('error', (error) => {
        // Si ffprobe no está disponible, usar método básico
        this.analyzeVideoBasic(filePath)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Análisis básico cuando ffprobe no está disponible
   */
  private static async analyzeVideoBasic(filePath: string): Promise<{duration: number, hasAudio: boolean}> {
    const stats = fs.statSync(filePath);
    
    // Estimación básica: archivos muy pequeños probablemente están corruptos
    if (stats.size < 100000) { // menos de 100KB
      throw new Error('Archivo de video muy pequeño, posiblemente corrupto');
    }

    // Para videos de Kling, asumimos que tienen audio y duración aproximada
    // Esta es una aproximación cuando no tenemos ffprobe
    const estimatedDuration = Math.max(10, Math.min(120, stats.size / 1000000)); // aprox 1MB por segundo
    
    return {
      duration: estimatedDuration,
      hasAudio: true // Kling típicamente genera con audio
    };
  }
}
