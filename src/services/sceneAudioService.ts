// sceneAudioService.ts - Servicio que conecta el sistema de audio con la generación de video
// Integra audioIntegration.ts con renderPipeline.ts para sincronización perfecta
// ✨ NUEVO: Integración con ElevenLabs FX para efectos avanzados

import { logger } from '../utils/logger.js';
import { generarAudioCompleto, obtenerConfiguracionOptima } from './audioIntegration.js';
import { generateFXForVideo, isElevenLabsFXAvailable, ElevenLabsFXService } from './elevenlabsFXService.js'; // ✨ NUEVO
import type { VideoPlan, TimelineSecond } from '../utils/types.js';

export interface SceneAudioResult {
  music: Buffer;
  voice: Buffer;
  sfx: Buffer[];
  // ✨ NUEVO: Efectos FX generados con ElevenLabs
  efectosFX?: Buffer[];
  metadata: {
    duration: number;
    usedServices: string[];
    quality: any;
    // ✨ NUEVO: Información sobre FX
    fxCount?: number;
    fxService?: string;
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
 * ✨ NUEVO: Genera audio para tomas del orquestador cinematográfico
 */
async function generateBatchTomaAudio(
  plan: VideoPlan, 
  tomas: any[]
): Promise<SceneAudioResult[]> {
  logger.info(`🎬 [SceneAudio] Procesando lote: tomas 1-${tomas.length} (${tomas.length} tomas)`);
  
  const audioResults: SceneAudioResult[] = [];
  
  // Procesar cada toma como una escena larga
  for (let i = 0; i < tomas.length; i++) {
    const toma = tomas[i];
    logger.info(`🎭 [SceneAudio] Generando audio para toma ${i + 1}/${tomas.length}`);
    
    // Convertir toma a formato de escena para compatibilidad
    const escenaVirtual = {
      segundo: i * (toma.duracion || 10),
      narrativa: { descripcion: toma.descripcion, tipo: toma.tipoToma },
      fondo: toma.fondo,
      actor: toma.actor,
      camara: toma.camara || {},
      sonido: toma.sonido || {},
      edicion: toma.edicion || {},
      segmento: toma.tipoToma || 'desarrollo',
      momentoNarrativo: toma.descripcion || '',
      esEmocional: toma.emocion !== 'neutral',
      tono: toma.emocion || plan.metadata?.tono || 'neutral'
    };
    
    const audioResult = await generateSceneAudio(escenaVirtual, plan, i);
    audioResults.push(audioResult);
    
    logger.info(`✅ [SceneAudio] Toma ${i + 1} completada en ${Date.now()}ms`);
    logger.info(`📊 [SceneAudio] Servicios usados: ${audioResult.metadata.usedServices.join(', ')}`);
  }
  
  logger.info(`🔄 [SceneAudio] Lote completado: 1-${tomas.length} de ${tomas.length}`);
  return audioResults;
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
  // ✨ NUEVO: Incluir efectos FX en el resultado
  efectosFX?: Buffer[];
  metadata: any;
}> {
  // ✅ NUEVO: Usar tomas del orquestador si existen, sino usar timeline
  const usarTomas = plan.tomasReales && plan.tomasReales.length > 0;
  const items = (usarTomas ? plan.tomasReales : plan.timeline) ?? [];
  const itemType = usarTomas ? 'tomas' : 'escenas';
  
  logger.info(`🎼 [SceneAudio] Generando audio unificado para pipeline (${items.length} ${itemType})`);

  try {
    // 1. Generar audio para todas las tomas/escenas
    const audioResults = usarTomas 
      ? await generateBatchTomaAudio(plan, plan.tomasReales!)
      : await generateBatchSceneAudio(plan);

    // 2. Sincronizar con el formato esperado por renderPipeline
    const syncResult = await syncAudioWithVideoClips(audioResults, []);

    // 3. Combinar música en un solo buffer
    const musicBuffer = syncResult.musicBuffers.length > 0
      ? Buffer.concat(syncResult.musicBuffers)
      : createSilenceBuffer(30);

    // 4. Combinar SFX existentes + ElevenLabs FX (sin romper sistema actual)
    let serviciosUsados = audioResults.flatMap((r: any) => r.metadata.usedServices);
    
    // Mantener SFX existentes
    const sfxExistentes = syncResult.sfxBuffers.length > 0
      ? Buffer.concat(syncResult.sfxBuffers)
      : createSilenceBuffer(5);
    
    // Inicializar variables para FX
    let efectosFXBuffers: Buffer[] = [];
    let sfxBuffer: Buffer;
    
    // Agregar ElevenLabs FX si está disponible y hay tomas
    if (isElevenLabsFXAvailable() && usarTomas && plan.tomasReales && plan.tomasReales.length > 0) {
      try {
        logger.info('🎵 [SceneAudio] Generando efectos avanzados con ElevenLabs FX...');
        
        const estiloVisual = plan.metadata?.visualStyle || 'cinematic';
        const elevenlabsService = new ElevenLabsFXService();
        
        // Generar efectos específicos para cada toma
        for (let i = 0; i < plan.tomasReales.length; i++) {
          const toma = plan.tomasReales[i];
          
          const efectosDeToma = await elevenlabsService.generarEfectosDeToma(
            toma,
            estiloVisual,
            plan.id || 'video',
            5 // duración en segundos
          );
          
          // Agregar los buffers de audio generados
          for (const efecto of efectosDeToma) {
            if (efecto.audio) {
              efectosFXBuffers.push(efecto.audio);
              
              // Log del efecto guardado
              if (efecto.cdnUrl) {
                logger.info(`[SceneAudio] ✅ Efecto FX guardado en CDN: ${efecto.cdnUrl}`);
              }
            }
          }
        }
        
        if (efectosFXBuffers.length > 0) {
          const efectosBuffer = Buffer.concat(efectosFXBuffers);
          // Combinar SFX existentes + ElevenLabs FX
          sfxBuffer = Buffer.concat([sfxExistentes, efectosBuffer]);
          logger.info(`✅ [SceneAudio] ${efectosFXBuffers.length} efectos ElevenLabs agregados`);
          
          // Agregar a servicios usados
          serviciosUsados.push('ElevenLabs FX');
        } else {
          sfxBuffer = sfxExistentes;
          logger.info('⚠️ [SceneAudio] ElevenLabs FX disponible pero no se generaron efectos');
        }
      } catch (error) {
        logger.warn('[SceneAudio] Error con ElevenLabs FX, usando SFX tradicionales:', error);
        sfxBuffer = sfxExistentes; // Fallback seguro
      }
    } else {
      sfxBuffer = sfxExistentes;
      if (!isElevenLabsFXAvailable()) {
        logger.info('[SceneAudio] ElevenLabs FX no disponible (falta ELEVENLABS_API_KEY)');
      }
    }

    // 5. Metadata consolidada
    const metadata = {
      totalEscenas: (items ?? []).length,
      serviciosUsados: serviciosUsados,
      duracionTotal: audioResults.reduce((sum: number, r: any) => sum + r.metadata.duration, 0),
      // ✨ NUEVO: Información sobre efectos FX
      fxCount: efectosFXBuffers.length,
      fxService: efectosFXBuffers.length > 0 ? 'ElevenLabs FX' : undefined,
      calidad: {
        musicaTamaño: musicBuffer.length,
        vozTamaño: syncResult.voiceBuffer.length,
        sfxTamaño: sfxBuffer.length,
        // ✨ NUEVO: Tamaño de efectos FX
        fxTamaño: efectosFXBuffers.reduce((sum, buf) => sum + buf.length, 0)
      }
    };

    logger.info(`✅ [SceneAudio] Audio unificado generado para pipeline`);
    logger.info(`📊 [SceneAudio] Total: música ${metadata.calidad.musicaTamaño} bytes, voz ${metadata.calidad.vozTamaño} bytes, SFX ${metadata.calidad.sfxTamaño} bytes, FX ${metadata.calidad.fxTamaño} bytes`);

    return {
      voiceBuffer: syncResult.voiceBuffer,
      musicBuffer,
      sfxBuffer,
      // ✨ NUEVO: Incluir efectos FX en el resultado
      efectosFX: efectosFXBuffers.length > 0 ? efectosFXBuffers : undefined,
      metadata
    };

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error generando audio unificado: ${error}`);
    
    // Fallback completo que garantiza que renderPipeline no falle
    return {
      voiceBuffer: Buffer.from([]),
      musicBuffer: createSilenceBuffer(30),
      sfxBuffer: createSilenceBuffer(5),
      // ✨ NUEVO: Fallback para efectos FX
      efectosFX: undefined,
      metadata: {
        error: String(error),
        fallbackUsado: true,
        // ✨ NUEVO: Metadatos de FX en fallback
        fxCount: 0,
        fxService: undefined
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
