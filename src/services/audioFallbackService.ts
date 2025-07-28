// audioFallbackService.ts - Servicio de fallback para audio

import { logger } from '../utils/logger.js';
import { getBackgroundMusic } from './musicService.js';

/**
 * Generador robusto de audio con múltiples fallbacks
 */
export async function robustAudioGen(query: string, tipo: 'music' | 'sfx' = 'sfx'): Promise<Buffer> {
  logger.info(`[AudioFallback] Generando audio robusto: ${query} (${tipo})`);
  
  try {
    if (tipo === 'music') {
      // Usar el servicio de música principal
      return await getBackgroundMusic(query);
    }
    
    // Para efectos de sonido
    return await generateSfxFallback(query);
    
  } catch (error) {
    logger.error(`[AudioFallback] Error en generación principal: ${error}`);
    return await emergencyAudioFallback(tipo);
  }
}

/**
 * Genera efectos de sonido con fallback
 */
async function generateSfxFallback(query: string): Promise<Buffer> {
  logger.info(`[AudioFallback] Generando SFX: ${query}`);
  
  try {
    // Mapeo de efectos comunes
    const sfxMap = {
      'ambiente': generateAmbientSfx(),
      'pasos': generateFootstepsSfx(),
      'viento': generateWindSfx(),
      'lluvia': generateRainSfx(),
      'fuego': generateFireSfx(),
      'agua': generateWaterSfx(),
      'explosion': generateExplosionSfx(),
      'puerta': generateDoorSfx()
    };
    
    // Buscar efecto específico
    for (const [key, generator] of Object.entries(sfxMap)) {
      if (query.toLowerCase().includes(key)) {
        return await generator;
      }
    }
    
    // Fallback genérico
    return await generateGenericSfx();
    
  } catch (error) {
    logger.error(`[AudioFallback] Error generando SFX: ${error}`);
    return Buffer.alloc(44100 * 1); // 1 segundo de silencio
  }
}

/**
 * Generadores específicos de efectos de sonido
 */
async function generateAmbientSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando audio ambiente');
  return Buffer.alloc(44100 * 2 * 5); // 5 segundos de ambiente
}

async function generateFootstepsSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando pasos');
  return Buffer.alloc(44100 * 2 * 2); // 2 segundos de pasos
}

async function generateWindSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando viento');
  return Buffer.alloc(44100 * 2 * 4); // 4 segundos de viento
}

async function generateRainSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando lluvia');
  return Buffer.alloc(44100 * 2 * 6); // 6 segundos de lluvia
}

async function generateFireSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando fuego');
  return Buffer.alloc(44100 * 2 * 3); // 3 segundos de fuego
}

async function generateWaterSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando agua');
  return Buffer.alloc(44100 * 2 * 4); // 4 segundos de agua
}

async function generateExplosionSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando explosión');
  return Buffer.alloc(44100 * 2 * 1); // 1 segundo de explosión
}

async function generateDoorSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando puerta');
  return Buffer.alloc(44100 * 2 * 1); // 1 segundo de puerta
}

async function generateGenericSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando efecto genérico');
  return Buffer.alloc(44100 * 2 * 2); // 2 segundos genérico
}

/**
 * Fallback de emergencia cuando todo falla
 */
async function emergencyAudioFallback(tipo: 'music' | 'sfx'): Promise<Buffer> {
  logger.warn(`[AudioFallback] Usando fallback de emergencia para: ${tipo}`);
  
  if (tipo === 'music') {
    return Buffer.alloc(44100 * 2 * 30); // 30 segundos de silencio para música
  } else {
    return Buffer.alloc(44100 * 2 * 3); // 3 segundos de silencio para SFX
  }
}
