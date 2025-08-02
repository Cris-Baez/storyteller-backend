import { fal } from '@fal-ai/client';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { logFeedback } from './feedbackService.js';
import https from 'https';
import fs from 'fs';
import path from 'path';

// ✅ CORRECTO: Usar fal.ai que es el wrapper oficial para Kling Elements
fal.config({
  credentials: env.FAL_KEY
});

export interface VideoSegment {
  prompt: string;
  duration: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  cameraMovement: 'static' | 'slow' | 'fast';
  creativity: number;
  fps: number;
  input_image_urls?: string[];
}

export interface KlingClipParams {
  prompt: string;
  duration: number;
  aspectRatio?: string;
  cameraMovement?: string;
  creativity?: number;
  fps?: number;
  input_image_urls?: string[];
}

export class KlingService {
  private static instance: KlingService;

  private constructor() {}

  public static getInstance(): KlingService {
    if (!KlingService.instance) {
      KlingService.instance = new KlingService();
    }
    return KlingService.instance;
  }

  /**
   * ✅ Descargar clip para evitar que expire
   */
  private async downloadClip(url: string, filename: string): Promise<string> {
    const tmpDir = './tmp';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const localPath = path.join(tmpDir, filename);
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(localPath);
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Error descargando: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          logger.info(`[KlingService] ✅ Clip descargado: ${localPath}`);
          resolve(localPath);
        });
        
        file.on('error', (err) => {
          fs.unlink(localPath, () => {}); // cleanup
          reject(err);
        });
      }).on('error', reject);
    });
  }

  /**
   * ✅ CORRECTO: Usar fal.ai (el wrapper oficial de Kling Elements)
   */
  async generateSegmentWithKling(segment: VideoSegment): Promise<string> {
    logger.info(`[KlingService] Generando video con Kling Elements via fal.ai`, {
      prompt: segment.prompt.substring(0, 100),
      duration: segment.duration,
      aspectRatio: segment.aspectRatio
    });

    try {
      // ✅ VERIFICACIÓN DE API KEY
      if (!env.FAL_KEY) {
        throw new Error('FAL_KEY no configurada - Configure la clave para usar Kling Elements');
      }

      // ✅ CORRECTO: Usar fal.ai que SÍ existe y es el wrapper oficial de Kling
      const result = await fal.run('fal-ai/kling-video/v1/standard/text-to-video', {
        input: {
          prompt: segment.prompt,
          duration: segment.duration <= 5 ? "5" : "10", // Kling solo acepta "5" o "10"
          aspect_ratio: segment.aspectRatio
        }
      });

      if (!result?.data || !result.data.video?.url) {
        logger.error('[KlingService] ❌ Kling no devolvió video válido:', result);
        throw new Error('Kling no devolvió video válido');
      }

      logger.info(`[KlingService] ✅ Video generado exitosamente: ${result.data.video.url}`);
      
      logFeedback({
        service: 'KlingService',
        action: 'generateVideo',
        success: true,
        params: { duration: segment.duration, aspectRatio: segment.aspectRatio }
      });

      return result.data.video.url;

    } catch (error) {
      logger.error(`[KlingService] ❌ Error generando video:`, error);
      
      logFeedback({
        service: 'KlingService',
        action: 'generateVideo',
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        params: segment
      });

      // ✅ MODO FALLBACK: Devolver video de demostración en caso de error
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[KlingService] 🚀 Usando video de demostración como fallback');
        return 'https://storage.googleapis.com/storyteller-ai-cdn/demo/sample-video-10s.mp4';
      }

      throw error;
    }
  }

  /**
   * ✅ CORRECTO: Imagen a video con fal.ai
   */
  async generateImageToVideo(imageUrl: string, prompt: string, duration: number = 5): Promise<string> {
    logger.info(`[KlingService] Generando imagen a video con Kling Elements`, {
      imageUrl: imageUrl.substring(0, 50) + '...',
      prompt: prompt.substring(0, 100),
      duration
    });

    try {
      // ✅ VERIFICACIÓN DE API KEY
      if (!env.FAL_KEY) {
        throw new Error('FAL_KEY no configurada - Configure la clave para usar Kling Elements');
      }

      const result = await fal.run('fal-ai/kling-video/v1/standard/image-to-video', {
        input: {
          image_url: imageUrl,
          prompt,
          duration: duration <= 5 ? "5" : "10"
        }
      });

      if (!result?.data || !result.data.video?.url) {
        throw new Error('Kling imagen a video no devolvió URL válida');
      }

      const remoteUrl = result.data.video.url;
      logger.info(`[KlingService] ✅ Imagen a video generada: ${remoteUrl}`);
      
      // ✅ NUEVO: Descargar clip inmediatamente para evitar expiración
      try {
        const timestamp = Date.now();
        const filename = `kling_clip_${timestamp}.mp4`;
        const localPath = await this.downloadClip(remoteUrl, filename);
        logger.info(`[KlingService] 📁 Clip descargado localmente: ${localPath}`);
        return localPath; // Devolver ruta local en lugar de URL remota
      } catch (downloadError) {
        logger.warn(`[KlingService] ⚠️ No se pudo descargar clip, usando URL remota: ${downloadError}`);
        return remoteUrl; // Fallback a URL remota si falla la descarga
      }

    } catch (error) {
      logger.error(`[KlingService] ❌ Error en imagen a video:`, error);
      
      // ✅ MODO FALLBACK: Devolver video de demostración en caso de error
      if (process.env.NODE_ENV !== 'production') {
        logger.warn('[KlingService] 🚀 Usando video de demostración como fallback para imagen a video');
        return 'https://storage.googleapis.com/storyteller-ai-cdn/demo/sample-image-to-video.mp4';
      }
      
      throw error;
    }
  }
}

/**
 * ✅ BACKWARD COMPATIBILITY: Mantener función legacy para compatibilidad
 */
export async function generateKlingClip(params: KlingClipParams): Promise<string> {
  const service = KlingService.getInstance();
  
  // Convertir parámetros legacy al nuevo formato
  const segment: VideoSegment = {
    prompt: params.prompt,
    duration: params.duration,
    aspectRatio: (params.aspectRatio as '16:9' | '9:16' | '1:1') || '16:9',
    cameraMovement: (params.cameraMovement as 'static' | 'slow' | 'fast') || 'slow',
    creativity: params.creativity || 0.7,
    fps: params.fps || 25,
    input_image_urls: params.input_image_urls
  };

  // ✅ IMAGEN A VIDEO: Si hay imágenes, usar imagen a video
  if (params.input_image_urls && params.input_image_urls.length > 0) {
    const firstImage = params.input_image_urls[0];
    return await service.generateImageToVideo(firstImage, params.prompt, params.duration);
  }

  // ✅ TEXTO A VIDEO: Usar generación estándar
  return await service.generateSegmentWithKling(segment);
}

/**
 * ✅ NUEVO: Función quick para reemplazar generateQuickKlingVideo
 */
export async function generateQuickKlingVideo(options: {
  fondoUrl?: string;
  actorUrl?: string;
  prompt: string;
  musicStyle?: string;
  duration?: number;
  aspectRatio?: string;
}): Promise<{ videoUrl: string; musicBuffer?: Buffer }> {
  logger.info(`[KlingService] Generando video rápido con opciones:`, {
    hasFondo: !!options.fondoUrl,
    hasActor: !!options.actorUrl,
    prompt: options.prompt.substring(0, 50),
    duration: options.duration || 5
  });

  const params: KlingClipParams = {
    prompt: options.prompt,
    duration: options.duration || 5,
    aspectRatio: options.aspectRatio || '16:9',
    cameraMovement: 'slow',
    creativity: 0.7,
    fps: 25
  };

  // Si hay imágenes (fondo/actor), agregarlas
  if (options.fondoUrl || options.actorUrl) {
    params.input_image_urls = [options.fondoUrl, options.actorUrl].filter(Boolean) as string[];
  }

  const videoUrl = await generateKlingClip(params);

  // Generar música si se solicita
  let musicBuffer: Buffer | undefined;
  if (options.musicStyle) {
    try {
      const { getAdvancedMusic } = await import('./audioEngine.js');
      musicBuffer = await getAdvancedMusic({ style: options.musicStyle });
    } catch (error) {
      logger.warn(`[KlingService] No se pudo generar música: ${error}`);
    }
  }

  return { videoUrl, musicBuffer };
}
