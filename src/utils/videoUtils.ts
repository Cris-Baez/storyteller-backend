// src/utils/videoUtils.ts
// Utilidades para verificar duración y propiedades de videos

import { spawn } from 'child_process';
import { logger } from './logger.js';

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  format: string;
}

/**
 * Obtiene información de un video usando ffprobe
 */
export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath
    ]);

    let output = '';
    let errorOutput = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        logger.error(`[VideoUtils] FFprobe error (code ${code}):`, errorOutput);
        reject(new Error(`FFprobe failed with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const result = JSON.parse(output);
        const videoStream = result.streams.find((s: any) => s.codec_type === 'video');
        
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const info: VideoInfo = {
          duration: parseFloat(result.format.duration) || 0,
          width: parseInt(videoStream.width) || 0,
          height: parseInt(videoStream.height) || 0,
          frameRate: eval(videoStream.r_frame_rate) || 0, // e.g., "30/1" -> 30
          bitrate: parseInt(result.format.bit_rate) || 0,
          format: result.format.format_name || 'unknown'
        };

        resolve(info);
      } catch (error) {
        logger.error('[VideoUtils] Error parsing ffprobe output:', error);
        reject(new Error(`Failed to parse ffprobe output: ${error}`));
      }
    });

    ffprobe.on('error', (error) => {
      logger.error('[VideoUtils] FFprobe spawn error:', error);
      reject(error);
    });
  });
}

/**
 * Verifica que la duración del video coincida con la esperada
 */
export async function verificarDuracionVideo(
  videoPath: string, 
  duracionEsperada: number,
  tolerancia: number = 0.5
): Promise<{ coincide: boolean; duracionReal: number; diferencia: number }> {
  try {
    const info = await getVideoInfo(videoPath);
    const diferencia = Math.abs(info.duration - duracionEsperada);
    const coincide = diferencia <= tolerancia;

    logger.info(`[VideoUtils] Verificación de duración:`, {
      duracionEsperada,
      duracionReal: info.duration,
      diferencia,
      coincide,
      tolerancia
    });

    return {
      coincide,
      duracionReal: info.duration,
      diferencia
    };
  } catch (error) {
    logger.error('[VideoUtils] Error verificando duración:', error);
    throw error;
  }
}

/**
 * Calcula la duración total esperada desde un plan de video
 */
export function calcularDuracionEsperadaDesdePlan(videoPlan: any): number {
  // Si el plan tiene tomas reales, usar esas
  if (videoPlan.tomasReales && Array.isArray(videoPlan.tomasReales)) {
    const duracionTomas = videoPlan.tomasReales.reduce((total: number, toma: any) => {
      return total + (toma.duracion || 0);
    }, 0);
    logger.info(`[VideoUtils] Duración calculada desde tomas reales: ${duracionTomas}s`);
    return duracionTomas;
  }
  
  // Si el plan tiene timeline, usar el timeline
  if (videoPlan.timeline && Array.isArray(videoPlan.timeline)) {
    const duracionTimeline = videoPlan.timeline.length;
    logger.info(`[VideoUtils] Duración calculada desde timeline: ${duracionTimeline}s`);
    return duracionTimeline;
  }
  
  // Si tiene metadata con duración
  if (videoPlan.metadata && videoPlan.metadata.duracionTotal) {
    const duracionMetadata = videoPlan.metadata.duracionTotal;
    logger.info(`[VideoUtils] Duración calculada desde metadata: ${duracionMetadata}s`);
    return duracionMetadata;
  }
  
  logger.warn('[VideoUtils] No se pudo calcular duración esperada del plan');
  return 0;
}
