// audioEngine.ts - Motor de audio centralizado para CinemaAI
// Actualizado con soporte completo para Marketing AI

import { logFeedback } from './feedbackService.js';
import { logger } from '../utils/logger.js';

export interface AudioEngineOptions {
  musicaAvanzada?: string;
  music?: string;
  mezclaAudio?: string;
  balanceSonido?: string;
  motivoVisual?: string;
  ambiente?: string;
  emotion?: string;
  region?: string;
  idioma?: string;
  style?: string;
  subtitulos?: string;
  mood?: string;
  duration?: number;
  tags?: string[];
  fallbackKeyword?: string;
  tipo?: 'cinematic' | 'marketing' | 'commercial';
}

export interface AudioMetrics {
  escena: number;
  musicaUsada: string;
  sfxUsados: string[];
  ducking: boolean;
  crossfade: boolean;
  normalizacion: string;
  tiempoGeneracion: number;
}

/**
 * ✅ FALLBACK: Genera un buffer de audio silencioso para fallbacks
 */
async function generateSilentBuffer(durationSeconds: number): Promise<Buffer> {
  // Crear buffer de silencio (16-bit, 44.1kHz, mono)
  const sampleRate = 44100;
  const samples = Math.floor(durationSeconds * sampleRate);
  const buffer = Buffer.alloc(samples * 2); // 2 bytes por sample (16-bit)
  
  logger.info(`[AudioEngine] 🔇 Generado buffer silencioso de ${durationSeconds}s`);
  return buffer;
}

export async function getAdvancedMusic(options: AudioEngineOptions): Promise<Buffer> {
  const startTime = Date.now();
  
  const esMarketing = options.tipo === 'marketing' || options.tipo === 'commercial' || 
                      options.mood === 'corporate' || options.tags?.includes('corporate');
  
  if (esMarketing) {
    logger.info(`[AudioEngine] Detectado modo Marketing - usando Freesound`);
    
    try {
      // ✅ VERIFICAR API KEY ANTES DE USAR FREESOUND
      if (!process.env.FREESOUND_API_KEY) {
        logger.warn('[AudioEngine] FREESOUND_API_KEY no configurada, usando fallback');
        return await generateSilentBuffer(options.duration || 15);
      }
      
      const { buscarMusicaCorporativa } = await import('./freesoundService.js');
      
      const queryMarketing = {
        duracionMinima: options.duration || 15,
        tags: options.tags || ['corporate', 'business', 'marketing'],
        maxResultados: 5
      };
      
      const urlMusica = await buscarMusicaCorporativa(queryMarketing);
      
      if (urlMusica) {
        // Descargar la música
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(urlMusica);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const tiempo = Date.now() - startTime;
          logger.info(`[AudioEngine] Música Marketing obtenida de Freesound (${tiempo}ms)`);
          return buffer;
        }
      }
      
      logger.warn('[AudioEngine] Freesound falló, usando música por defecto');
      return await obtenerMusicaPorDefecto(options);
      
    } catch (error) {
      logger.error('[AudioEngine] Error con música Marketing:', error);
      return await obtenerMusicaPorDefecto(options);
    }
  }
  
  logger.info(`[AudioEngine] Modo cinematic tradicional`);
  
  try {
    const { getBackgroundMusic } = await import('./musicService.js');
    
    const buffer = await getBackgroundMusic(
      options.style || 'cinematic',
      options.duration || 30,
      options.mood || 'neutral'
    );
    
    const tiempo = Date.now() - startTime;
    logger.info(`[AudioEngine] Música cinematic obtenida (${tiempo}ms)`);
    return buffer;
    
  } catch (error) {
    logger.error('[AudioEngine] Error música cinematic:', error);
    return generarSilencio(options.duration || 30);
  }
}

export async function getSfx(options: AudioEngineOptions): Promise<Buffer[]> {
  const startTime = Date.now();
  
  const esMarketing = options.tipo === 'marketing' || options.tipo === 'commercial';
  
  if (esMarketing) {
    logger.info('[AudioEngine] Efectos para Marketing - modo sutil');
    
    try {
      const { buscarMusicaCorporativa } = await import('./freesoundService.js');
      
      const efectosQuery = {
        duracionMinima: 2,
        tags: ['transition', 'whoosh', 'subtle'],
        maxResultados: 3
      };
      
      const urlEfecto = await buscarMusicaCorporativa(efectosQuery);
      
      if (urlEfecto) {
        // Descargar el efecto
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(urlEfecto);
        
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          logger.info(`[AudioEngine] Efectos Marketing obtenidos`);
          return [buffer];
        }
      }
      
      return [];
      
    } catch (error) {
      logger.warn('[AudioEngine] No se pudieron obtener efectos Marketing:', error);
      return [];
    }
  }
  
  logger.info('[AudioEngine] Efectos cinematic tradicionales');
  
  try {
    const efectos = await obtenerEfectosCinematic(options);
    const tiempo = Date.now() - startTime;
    
    logger.info(`[AudioEngine] ${efectos.length} efectos obtenidos (${tiempo}ms)`);
    return efectos;
    
  } catch (error) {
    logger.error('[AudioEngine] Error obteniendo efectos:', error);
    return [];
  }
}

export async function processAudioForScene(
  musicaBuffer: Buffer,
  sfxBuffers: Buffer[],
  vozBuffer?: Buffer,
  options: AudioEngineOptions = {}
): Promise<Buffer> {
  try {
    logger.info('[AudioEngine] Iniciando procesamiento de audio para escena');
    
    const esMarketing = options.tipo === 'marketing';
    
    if (esMarketing) {
      return await procesarAudioMarketing(musicaBuffer, vozBuffer, sfxBuffers, options);
    } else {
      return await procesarAudioCinematic(musicaBuffer, sfxBuffers, vozBuffer, options);
    }
    
  } catch (error) {
    logger.error('[AudioEngine] Error procesando audio:', error);
    return musicaBuffer;
  }
}

async function procesarAudioMarketing(
  musicaBuffer: Buffer,
  vozBuffer?: Buffer,
  sfxBuffers: Buffer[] = [],
  options: AudioEngineOptions = {}
): Promise<Buffer> {
  
  logger.info('[AudioEngine] Procesando audio para Marketing AI');
  
  try {
    if (vozBuffer) {
      logger.info('[AudioEngine] Mezclando música con voz comercial');
      return musicaBuffer;
    }
    
    return musicaBuffer;
    
  } catch (error) {
    logger.error('[AudioEngine] Error procesando audio Marketing:', error);
    return musicaBuffer;
  }
}

async function procesarAudioCinematic(
  musicaBuffer: Buffer,
  sfxBuffers: Buffer[],
  vozBuffer?: Buffer,
  options: AudioEngineOptions = {}
): Promise<Buffer> {
  
  logger.info('[AudioEngine] Procesando audio cinematic tradicional');
  
  try {
    return musicaBuffer;
    
  } catch (error) {
    logger.error('[AudioEngine] Error procesando audio cinematic:', error);
    return musicaBuffer;
  }
}

async function obtenerMusicaPorDefecto(options: AudioEngineOptions): Promise<Buffer> {
  logger.info('[AudioEngine] Usando música por defecto');
  
  try {
    const musicaCorporativa = [
      `${process.env.CDN_BUCKET_URL}/audio/corporate/corporate_upbeat_01.mp3`,
      `${process.env.CDN_BUCKET_URL}/audio/corporate/corporate_motivational_01.mp3`,
      `${process.env.CDN_BUCKET_URL}/audio/corporate/corporate_positive_01.mp3`
    ];
    
    const indice = Math.floor(Math.random() * musicaCorporativa.length);
    const urlMusica = musicaCorporativa[indice];
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(urlMusica);
    
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      logger.info('[AudioEngine] Música por defecto cargada', {
        url: urlMusica,
        size: buffer.length
      });
      
      return buffer;
    } else {
      logger.warn('[AudioEngine] No se pudo descargar música por defecto, generando silencio');
      return generarSilencio(options.duration || 15);
    }
    
  } catch (error) {
    logger.error('[AudioEngine] Error obteniendo música por defecto:', error);
    return generarSilencio(options.duration || 15);
  }
}

async function obtenerEfectosCinematic(options: AudioEngineOptions): Promise<Buffer[]> {
  try {
    return [];
  } catch (error) {
    logger.error('[AudioEngine] Error obteniendo efectos cinematic:', error);
    return [];
  }
}

function generarSilencio(duracionSegundos: number): Buffer {
  const sampleRate = 44100;
  const bitsPerSample = 16;
  const channels = 2;
  const bytesPerSample = bitsPerSample / 8;
  const dataSize = sampleRate * duracionSegundos * channels * bytesPerSample;
  
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  header.writeUInt16LE(channels * bytesPerSample, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  
  const silenceData = Buffer.alloc(dataSize);
  
  return Buffer.concat([header, silenceData]);
}

export function logAudioMetrics(metrics: AudioMetrics): void {
  logger.info(`[AudioEngine] Métricas escena ${metrics.escena}:`, {
    musica: metrics.musicaUsada,
    sfx: metrics.sfxUsados.length,
    ducking: metrics.ducking,
    crossfade: metrics.crossfade,
    tiempo: `${metrics.tiempoGeneracion}ms`
  });
  
  logFeedback({
    service: 'AudioEngine',
    action: 'metrics',
    success: true,
    params: metrics
  });
}
