// audioEngine.ts - Motor de audio centralizado
// Reorganiza getAdvancedMusic y getSfx en un motor semánticamente coherente

import { logFeedback } from './feedbackService.js';
import { logger } from '../utils/logger.js';

export interface AudioEngineOptions {
  musicaAvanzada?: string;
  music?: string;
  mezclaAudio?: string;
  balanceSonido?: string;
  motivoVisual?: string;
  sonidoAmbiente?: string;
  emotion?: string;
  region?: string;
  idioma?: string;
  style?: string;
  subtitulos?: string;
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
 * Motor centralizado de música avanzada
 * Movido desde musicService para mejor organización semántica
 */
export async function getAdvancedMusic(options: AudioEngineOptions): Promise<Buffer> {
  const startTime = Date.now();
  
  // Construir el estilo de búsqueda combinando los campos relevantes
  let style = options.musicaAvanzada || options.music || options.style || 'cinematic';
  if (options.emotion) style += ` ${options.emotion}`;
  if (options.motivoVisual) style += ` ${options.motivoVisual}`;
  if (options.sonidoAmbiente) style += ` ${options.sonidoAmbiente}`;
  if (options.region) style += ` ${options.region}`;
  if (options.idioma) style += ` ${options.idioma}`;
  
  if (options.subtitulos && typeof options.subtitulos === 'string') {
    // Si hay subtítulos multilingües, agregar palabras clave para adaptar la música
    style += ` ${options.subtitulos.split(' ').slice(0, 5).join(' ')}`;
  }
  
  logger.info(`🎵 [AudioEngine] Buscar música avanzada para: "${style}"`);
  
  try {
    // Import dinámico para evitar dependencias circulares
    const { fetchFromFreesound, fetchFromArtlist, normalise } = await import('./musicService.js');
    
    const raw = (await fetchFromFreesound(style)) ?? (await fetchFromArtlist(style));
    
    if (!raw) {
      logger.warn('⚠️ [AudioEngine] No se encontró música avanzada; devolviendo buffer vacío');
      logFeedback({
        service: 'AudioEngine',
        action: 'getAdvancedMusic',
        success: false,
        error: 'No se pudo generar la pista de música avanzada',
        params: { options }
      });
      throw new Error('No se pudo generar la pista de música avanzada');
    }
    
    const buf = await normalise(raw);
    
    if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
      logger.error('❌ [AudioEngine] La pista de música avanzada generada está vacía o es inválida');
      logFeedback({
        service: 'AudioEngine',
        action: 'getAdvancedMusic',
        success: false,
        error: 'Pista de música vacía o inválida',
        params: { options }
      });
      throw new Error('Pista de música vacía o inválida');
    }
    
    const metrics: AudioMetrics = {
      escena: 0, // Se rellenará desde el contexto
      musicaUsada: style,
      sfxUsados: [],
      ducking: false,
      crossfade: false,
      normalizacion: 'loudnorm',
      tiempoGeneracion: Date.now() - startTime
    };
    
    logger.info(`✅ [AudioEngine] Música generada: ${buf.length} bytes en ${metrics.tiempoGeneracion}ms`);
    
    logFeedback({
      service: 'AudioEngine',
      action: 'getAdvancedMusic',
      success: true,
      params: { style, metrics }
    });
    
    return buf;
    
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error generando música: ${error}`);
    logFeedback({
      service: 'AudioEngine',
      action: 'getAdvancedMusic',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      params: { options }
    });
    throw error;
  }
}

/**
 * Motor centralizado de efectos de sonido
 * Movido desde sceneAudioService para mejor organización semántica
 */
export async function getSfx(sfxType: string): Promise<Buffer> {
  const startTime = Date.now();
  
  logger.info(`🔊 [AudioEngine] Buscar SFX para: "${sfxType}"`);
  
  try {
    // Import dinámico para evitar dependencias circulares
    const { robustAudioGen } = await import('./audioFallbackService.js');
    
    // Función interna para obtener SFX
    const getSfxInternal = async (type: string): Promise<Buffer> => {
      // Aquí deberías conectar a un servicio real de sfx
      // Por ahora devolvemos buffer vacío como placeholder
      return Buffer.from([]);
    };
    
    const sfxBuffer = await robustAudioGen(getSfxInternal, [sfxType], 3, 1);
    
    const metrics: AudioMetrics = {
      escena: 0, // Se rellenará desde el contexto
      musicaUsada: '',
      sfxUsados: [sfxType],
      ducking: false,
      crossfade: false,
      normalizacion: 'none',
      tiempoGeneracion: Date.now() - startTime
    };
    
    logger.info(`✅ [AudioEngine] SFX generado: ${sfxBuffer.length} bytes en ${metrics.tiempoGeneracion}ms`);
    
    logFeedback({
      service: 'AudioEngine',
      action: 'getSfx',
      success: true,
      params: { sfxType, metrics }
    });
    
    return sfxBuffer;
    
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error generando SFX: ${error}`);
    logFeedback({
      service: 'AudioEngine',
      action: 'getSfx',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      params: { sfxType }
    });
    return Buffer.from([]); // Fallback a buffer vacío
  }
}

/**
 * Aplicar ducking automático (bajar música cuando hay voz)
 */
export async function applyAudioDucking(
  musicBuffer: Buffer, 
  voiceBuffer: Buffer, 
  duckingLevel: number = 0.3
): Promise<Buffer> {
  logger.info(`🎚️ [AudioEngine] Aplicando ducking automático (nivel: ${duckingLevel})`);
  
  try {
    // TODO: Implementar ducking real con ffmpeg o librería de audio
    // Por ahora devolvemos el buffer original
    logger.info('⚠️ [AudioEngine] Ducking automático pendiente de implementación');
    return musicBuffer;
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error aplicando ducking: ${error}`);
    return musicBuffer;
  }
}

/**
 * Aplicar crossfade entre dos pistas de audio
 */
export async function applyCrossfade(
  audioA: Buffer, 
  audioB: Buffer, 
  crossfadeDuration: number = 2.0
): Promise<Buffer> {
  logger.info(`🔀 [AudioEngine] Aplicando crossfade (duración: ${crossfadeDuration}s)`);
  
  try {
    // TODO: Implementar crossfade real con ffmpeg o librería de audio
    // Por ahora devolvemos el buffer B
    logger.info('⚠️ [AudioEngine] Crossfade automático pendiente de implementación');
    return audioB;
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error aplicando crossfade: ${error}`);
    return audioB;
  }
}

/**
 * Registrar métricas de audio por escena
 */
export function logAudioMetrics(metrics: AudioMetrics): void {
  logger.info(`📊 [AudioEngine] Métricas escena ${metrics.escena}:`, {
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
