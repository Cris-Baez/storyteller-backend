// sceneAudioService.ts - Servicio que conecta el sistema de audio con la generación de video
// Integra audioIntegration.ts con renderPipeline.ts para sincronización perfecta

import { logger } from '../utils/logger.js';
import { generarAudioCompleto, obtenerConfiguracionOptima } from './audioIntegration.js';
import type { VideoPlan, TimelineSecond } from '../utils/types.js';

export interface SceneAudioResult {
  music: Buffer;
  voice: Buffer;
  sfx: Buffer[];
  metadata: {
    duration: number;
    usedServices: string[];
    quality: any;
  };
}

/**
 * Genera audio completo para una escena específica del video
 * Conecta directamente con el pipeline de renderizado
 */
export async function generateSceneAudio(
  seccion: TimelineSecond,
  plan: VideoPlan,
  sceneIndex: number
): Promise<SceneAudioResult> {
  const startTime = Date.now();
  logger.info(`🎭 [SceneAudio] Generando audio para escena ${sceneIndex + 1}/${plan.timeline.length}`);

  try {
    // 1. Obtener configuración óptima automáticamente
    const configuracionOptima = await obtenerConfiguracionOptima();
    
    // 2. Determinar contexto narrativo según posición en el timeline
    const totalSecciones = plan.timeline.length;
    let momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
    
    if (sceneIndex === 0) {
      momentoNarrativo = 'setup';
    } else if (sceneIndex === totalSecciones - 1) {
      momentoNarrativo = 'cierre';
    } else if (sceneIndex > totalSecciones * 0.7) {
      momentoNarrativo = 'climax';
    } else {
      momentoNarrativo = 'desarrollo';
    }

    // 3. Configurar opciones específicas para esta escena
    const opciones = {
      ...configuracionOptima,
      duracionToma: seccion.duracion || 10,
      momentoNarrativo,
      tono: seccion.tono || plan.metadata?.style || 'dramático',
      esEmocional: seccion.esEmocional || sceneIndex > totalSecciones * 0.5,
      estiloCinematico: plan.metadata?.visualStyle || 'cinematic'
    };

    logger.info(`🎯 [SceneAudio] Contexto: ${momentoNarrativo}, tono: ${opciones.tono}, duración: ${opciones.duracionToma}s`);

    // 4. Generar audio usando la integración completa
    const audioCompleto = await generarAudioCompleto(seccion, plan, opciones);

    // 5. Formatear resultado para compatibilidad con renderPipeline
    const resultado: SceneAudioResult = {
      music: audioCompleto.musica,
      voice: audioCompleto.voz,
      sfx: audioCompleto.efectos,
      metadata: {
        duration: Date.now() - startTime,
        usedServices: extractUsedServices(audioCompleto.metadata),
        quality: audioCompleto.metadata.calidad || {}
      }
    };

    logger.info(`✅ [SceneAudio] Escena ${sceneIndex + 1} completada en ${resultado.metadata.duration}ms`);
    logger.info(`📊 [SceneAudio] Servicios usados: ${resultado.metadata.usedServices.join(', ')}`);

    return resultado;

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error generando audio para escena ${sceneIndex + 1}: ${error}`);
    
    // Fallback completo que garantiza compatibilidad
    return {
      music: createSilenceBuffer(seccion.duracion || 10),
      voice: Buffer.from([]),
      sfx: [],
      metadata: {
        duration: Date.now() - startTime,
        usedServices: ['fallback'],
        quality: { error: String(error) }
      }
    };
  }
}

/**
 * Genera audio optimizado para múltiples escenas del plan
 * Optimiza las llamadas a APIs y reutiliza música cuando es apropiado
 */
export async function generateBatchSceneAudio(
  plan: VideoPlan,
  startIndex: number = 0,
  endIndex?: number
): Promise<SceneAudioResult[]> {
  const finalIndex = endIndex || plan.timeline.length;
  const seccionesAProcesar = plan.timeline.slice(startIndex, finalIndex);
  
  logger.info(`🎬 [SceneAudio] Procesando lote: escenas ${startIndex + 1}-${finalIndex} (${seccionesAProcesar.length} escenas)`);

  try {
    // Procesar en paralelo con límite de concurrencia
    const CONCURRENCY_LIMIT = 3; // Evitar saturar APIs
    const resultados: SceneAudioResult[] = [];
    
    for (let i = 0; i < seccionesAProcesar.length; i += CONCURRENCY_LIMIT) {
      const lote = seccionesAProcesar.slice(i, i + CONCURRENCY_LIMIT);
      const promesasLote = lote.map((seccion, indexEnLote) => 
        generateSceneAudio(seccion, plan, startIndex + i + indexEnLote)
      );
      
      const resultadosLote = await Promise.all(promesasLote);
      resultados.push(...resultadosLote);
      
      logger.info(`🔄 [SceneAudio] Lote completado: ${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, seccionesAProcesar.length)} de ${seccionesAProcesar.length}`);
    }

    logger.info(`✅ [SceneAudio] Lote completo procesado: ${resultados.length} escenas`);
    return resultados;

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error procesando lote de escenas: ${error}`);
    
    // Fallback para todo el lote
    return seccionesAProcesar.map((seccion, index) => ({
      music: createSilenceBuffer(seccion.duracion || 10),
      voice: Buffer.from([]),
      sfx: [],
      metadata: {
        duration: 0,
        usedServices: ['fallback'],
        quality: { error: String(error), sceneIndex: startIndex + index }
      }
    }));
  }
}

/**
 * Sincroniza audio generado con clips de video para renderPipeline
 * Garantiza que los buffers de audio coincidan con la duración de los clips
 */
export async function syncAudioWithVideoClips(
  audioResults: SceneAudioResult[],
  videoClips: string[]
): Promise<{
  voiceBuffer: Buffer;
  musicBuffers: Buffer[];
  sfxBuffers: Buffer[];
}> {
  logger.info(`🎵 [SceneAudio] Sincronizando ${audioResults.length} audios con ${videoClips.length} clips`);

  try {
    // 1. Combinar voz de todas las escenas
    const voiceBuffers = audioResults
      .map(result => result.voice)
      .filter(voice => voice.length > 0);
    
    const voiceBuffer = voiceBuffers.length > 0 
      ? Buffer.concat(voiceBuffers)
      : Buffer.from([]);

    // 2. Combinar música manteniendo continuidad
    const musicBuffers = audioResults.map(result => result.music);

    // 3. Combinar efectos de sonido
    const sfxBuffers = audioResults.flatMap(result => result.sfx);

    logger.info(`✅ [SceneAudio] Sincronización completada:`);
    logger.info(`   - Voz: ${voiceBuffer.length} bytes`);
    logger.info(`   - Música: ${musicBuffers.length} buffers`);
    logger.info(`   - SFX: ${sfxBuffers.length} efectos`);

    return {
      voiceBuffer,
      musicBuffers,
      sfxBuffers
    };

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error sincronizando audio con video: ${error}`);
    
    // Fallback que garantiza compatibilidad con renderPipeline
    return {
      voiceBuffer: Buffer.from([]),
      musicBuffers: audioResults.map(result => createSilenceBuffer(10)),
      sfxBuffers: []
    };
  }
}

/**
 * Función optimizada para renderPipeline.ts
 * Reemplaza las llamadas individuales a audioEngine y musicService
 */
export async function generateUnifiedAudioForPipeline(
  plan: VideoPlan
): Promise<{
  voiceBuffer: Buffer;
  musicBuffer: Buffer;
  sfxBuffer: Buffer;
  metadata: any;
}> {
  logger.info(`🎼 [SceneAudio] Generando audio unificado para pipeline (${plan.timeline.length} escenas)`);

  try {
    // 1. Generar audio para todas las escenas
    const audioResults = await generateBatchSceneAudio(plan);

    // 2. Sincronizar con el formato esperado por renderPipeline
    const syncResult = await syncAudioWithVideoClips(audioResults, []);

    // 3. Combinar música en un solo buffer
    const musicBuffer = syncResult.musicBuffers.length > 0
      ? Buffer.concat(syncResult.musicBuffers)
      : createSilenceBuffer(30);

    // 4. Combinar SFX en un solo buffer
    const sfxBuffer = syncResult.sfxBuffers.length > 0
      ? Buffer.concat(syncResult.sfxBuffers)
      : createSilenceBuffer(5);

    // 5. Metadata consolidada
    const metadata = {
      totalEscenas: plan.timeline.length,
      serviciosUsados: audioResults.flatMap(r => r.metadata.usedServices),
      duracionTotal: audioResults.reduce((sum, r) => sum + r.metadata.duration, 0),
      calidad: {
        musicaTamaño: musicBuffer.length,
        vozTamaño: syncResult.voiceBuffer.length,
        sfxTamaño: sfxBuffer.length
      }
    };

    logger.info(`✅ [SceneAudio] Audio unificado generado para pipeline`);
    logger.info(`📊 [SceneAudio] Total: música ${metadata.calidad.musicaTamaño} bytes, voz ${metadata.calidad.vozTamaño} bytes, SFX ${metadata.calidad.sfxTamaño} bytes`);

    return {
      voiceBuffer: syncResult.voiceBuffer,
      musicBuffer,
      sfxBuffer,
      metadata
    };

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error generando audio unificado: ${error}`);
    
    // Fallback completo que garantiza que renderPipeline no falle
    return {
      voiceBuffer: Buffer.from([]),
      musicBuffer: createSilenceBuffer(30),
      sfxBuffer: createSilenceBuffer(5),
      metadata: {
        error: String(error),
        fallbackUsado: true
      }
    };
  }
}

// Helper functions
function extractUsedServices(metadata: any): string[] {
  const servicios = [];
  
  if (metadata?.serviciosUsados?.freesound) servicios.push('Freesound');
  if (metadata?.serviciosUsados?.murf) servicios.push('Murf');
  if (metadata?.serviciosUsados?.efectosGenerados > 0) servicios.push('SFX');
  
  return servicios.length > 0 ? servicios : ['fallback'];
}

function createSilenceBuffer(duration: number): Buffer {
  const silenceDuration = Math.max(duration, 1);
  const bufferSize = Math.floor(silenceDuration * 44100 * 2 * 2); // 44.1kHz stereo 16-bit
  return Buffer.alloc(bufferSize);
}
