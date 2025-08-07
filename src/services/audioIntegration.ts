// audioIntegration.ts - Integración completa de audio con Freesound y Murf
// Conecta el cerebro cinematográfico con los servicios reales de audio

import { logger } from '../utils/logger.js';
import { getAdvancedMusic, getSfx } from './audioEngine.js';
import { getBackgroundMusic } from './musicService.js';
import { createVoiceBuffer } from './voiceService.js';
import { configurarSonidoCinematico } from './llmService/estilos/cinematic/sonido.js';
import type { VideoPlan, TimelineSecond } from '../utils/types.js';
// 🎤 INTEGRACIÓN AUTOMÁTICA DE VOCES MEJORADAS
import { voiceInterceptor } from './voiceInterceptor.js';

export interface AudioIntegrationOptions {
  usarFreesound: boolean;
  usarMurf: boolean;
  duracionToma: number;
  estiloCinematico: string;
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  tono: string;
  esEmocional: boolean;
}

/**
 * Genera audio completo para una toma usando servicios reales
 */
export async function generarAudioCompleto(
  seccion: TimelineSecond,
  plan: VideoPlan,
  options: AudioIntegrationOptions
): Promise<{
  musica: Buffer;
  efectos: Buffer[];
  voz: Buffer;
  metadata: any;
}> {
  const startTime = Date.now();
  logger.info(`🎼 [AudioIntegration] Generando audio completo para toma (${options.duracionToma}s)`);

  try {
    // 1. Usar el cerebro cinematográfico para obtener configuración inteligente
    const configuracionSonido = configurarSonidoCinematico(
      options.momentoNarrativo,
      seccion.segundo || 0,
      options.esEmocional,
      options.tono,
      options.duracionToma,
      seccion.actor,
      seccion as any // TomaCinematograficaPlan compatible
    );

    logger.info(`🧠 [AudioIntegration] Configuración sonora: ${JSON.stringify(configuracionSonido, null, 2)}`);

    // 2. Generar música usando Freesound
    let musicaBuffer = Buffer.from([]);
    if (configuracionSonido.musica && configuracionSonido.musica !== 'continue') {
      try {
        if (options.usarFreesound) {
          logger.info(`🎵 [AudioIntegration] Generando música via Freesound: ${configuracionSonido.musica}`);
          musicaBuffer = await getBackgroundMusic(
            configuracionSonido.musica,
            options.duracionToma,
            options.tono
          );
        } else {
          logger.info(`🎵 [AudioIntegration] Generando música via AudioEngine: ${configuracionSonido.musica}`);
          musicaBuffer = await getAdvancedMusic({
            style: configuracionSonido.musica,
            emotion: options.tono,
            musicaAvanzada: options.estiloCinematico
          });
        }
        
        if (musicaBuffer.length === 0) {
          logger.warn('⚠️ [AudioIntegration] Música vacía, usando silencio');
          musicaBuffer = createSilenceBuffer(options.duracionToma);
        }
        
        logger.info(`✅ [AudioIntegration] Música generada: ${musicaBuffer.length} bytes`);
      } catch (error) {
        logger.error(`❌ [AudioIntegration] Error generando música: ${error}`);
        musicaBuffer = createSilenceBuffer(options.duracionToma);
      }
    }

    // 3. Generar efectos de sonido usando Freesound
    const efectosBuffers: Buffer[] = [];
    if (configuracionSonido.efectos && configuracionSonido.efectos.length > 0) {
      logger.info(`🔊 [AudioIntegration] Generando ${configuracionSonido.efectos.length} efectos de sonido`);
      
      for (const efecto of configuracionSonido.efectos.slice(0, 3)) { // Máximo 3 efectos
        try {
          const efectoOptions = {
            tipo: 'cinematic' as const,
            style: efecto,
            duration: 3
          };
          const efectosArray = await getSfx(efectoOptions);
          if (efectosArray.length > 0) {
            efectosBuffers.push(...efectosArray);
            logger.info(`✅ [AudioIntegration] Efecto '${efecto}' generado: ${efectosArray.length} buffers`);
          }
        } catch (error) {
          logger.warn(`⚠️ [AudioIntegration] Error generando efecto '${efecto}': ${error}`);
        }
      }
    }

    // 4. 🎤 GENERAR VOZ CON MEJORAS AUTOMÁTICAS
    let vozBuffer = Buffer.from([]);
    if (configuracionSonido.requiereVoz && (seccion.voz || seccion.dialogo)) {
      try {
        if (options.usarMurf) {
          
          // 🎯 USAR INTERCEPTOR CON CONFIGURACIÓN MEJORADA
          if ((seccion as any).vozConfig && (seccion as any).vozConfig.optimizada) {
            logger.info(`� [AudioIntegration] Generando voz con configuración optimizada`);
            logger.info(`   Voz: ${(seccion as any).vozConfig.voiceId} (${(seccion as any).vozConfig.provider})`);
            
            // Crear solicitud de voz con configuración optimizada
            const solicitudVoz = {
              text: seccion.voz || seccion.dialogo,
              language: (seccion as any).vozConfig.language || 'es',
              outputFormat: 'mp3'
            };
            
            const audioOptimizado = await voiceInterceptor.generateVoiceConMejoras(
              solicitudVoz, 
              (seccion as any).vozConfig
            );
            
            // Convertir resultado a Buffer si es necesario
            vozBuffer = Buffer.isBuffer(audioOptimizado) ? audioOptimizado : Buffer.from(audioOptimizado);
            logger.info(`✅ [AudioIntegration] Voz optimizada generada: ${vozBuffer.length} bytes`);
            
          } else {
            // Usar método original como fallback
            logger.info(`🎙️ [AudioIntegration] Generando voz via método original`);
            vozBuffer = await createVoiceBuffer(plan);
            logger.info(`✅ [AudioIntegration] Voz original generada: ${vozBuffer.length} bytes`);
          }
          
        } else {
          logger.info(`🔇 [AudioIntegration] Murf deshabilitado, sin voz`);
        }
      } catch (error) {
        logger.error(`❌ [AudioIntegration] Error generando voz: ${error}`);
      }
    }

    // 5. Metadata de generación
    const metadata = {
      duracionGeneracion: Date.now() - startTime,
      configuracionUsada: configuracionSonido,
      serviciosUsados: {
        freesound: options.usarFreesound && musicaBuffer.length > 0,
        murf: options.usarMurf && vozBuffer.length > 0,
        efectosGenerados: efectosBuffers.length
      },
      calidad: {
        musicaTamaño: musicaBuffer.length,
        vozTamaño: vozBuffer.length,
        efectosTamaño: efectosBuffers.reduce((sum, buf) => sum + buf.length, 0)
      }
    };

    logger.info(`🎼 [AudioIntegration] Audio completo generado en ${metadata.duracionGeneracion}ms`);
    logger.info(`📊 [AudioIntegration] Calidad: Música ${metadata.calidad.musicaTamaño} bytes, Voz ${metadata.calidad.vozTamaño} bytes, ${efectosBuffers.length} efectos`);

    return {
      musica: musicaBuffer,
      efectos: efectosBuffers,
      voz: vozBuffer,
      metadata
    };

  } catch (error) {
    logger.error(`❌ [AudioIntegration] Error crítico generando audio: ${error}`);
    
    // Fallback completo
    return {
      musica: createSilenceBuffer(options.duracionToma),
      efectos: [],
      voz: Buffer.from([]),
      metadata: {
        error: error instanceof Error ? error.message : 'Error desconocido',
        duracionGeneracion: Date.now() - startTime,
        fallbackUsado: true
      }
    };
  }
}

/**
 * Valida la configuración de servicios de audio
 */
export async function validarConfiguracionAudio(): Promise<{
  freesoundDisponible: boolean;
  murfDisponible: boolean;
  errores: string[];
}> {
  const errores: string[] = [];
  let freesoundDisponible = false;
  let murfDisponible = false;

  try {
    const { env } = await import('../config/env.js');
    
    // Verificar Freesound
    if (!env.FREESOUND_API_KEY) {
      errores.push('FREESOUND_API_KEY no configurada');
    } else {
      try {
        // Test simple de API
        const axios = (await import('axios')).default;
        await axios.get('https://freesound.org/apiv2/search/text/', {
          params: { query: 'test', page_size: 1 },
          headers: { 'Authorization': `Token ${env.FREESOUND_API_KEY}` },
          timeout: 5000
        });
        freesoundDisponible = true;
        logger.info('✅ [AudioIntegration] Freesound API disponible');
      } catch (error) {
        errores.push(`Freesound API error: ${error}`);
        logger.warn(`⚠️ [AudioIntegration] Freesound API no disponible: ${error}`);
      }
    }

    // Verificar Murf
    if (!env.MURF_API_KEY) {
      errores.push('MURF_API_KEY no configurada');
    } else {
      murfDisponible = true; // Asumimos que está disponible si hay API key
      logger.info('✅ [AudioIntegration] Murf API configurada');
    }

  } catch (error) {
    errores.push(`Error validando configuración: ${error}`);
  }

  return {
    freesoundDisponible,
    murfDisponible,
    errores
  };
}

/**
 * Obtiene configuración optimizada según disponibilidad de servicios
 */
export async function obtenerConfiguracionOptima(): Promise<AudioIntegrationOptions> {
  const validacion = await validarConfiguracionAudio();
  
  const configuracion: AudioIntegrationOptions = {
    usarFreesound: validacion.freesoundDisponible,
    usarMurf: validacion.murfDisponible,
    duracionToma: 30,
    estiloCinematico: 'cinematic',
    momentoNarrativo: 'desarrollo',
    tono: 'dramático',
    esEmocional: true
  };

  logger.info(`🔧 [AudioIntegration] Configuración óptima: Freesound ${configuracion.usarFreesound}, Murf ${configuracion.usarMurf}`);
  
  if (validacion.errores.length > 0) {
    logger.warn(`⚠️ [AudioIntegration] Limitaciones: ${validacion.errores.join(', ')}`);
  }

  return configuracion;
}

// Helper function para crear silencio
function createSilenceBuffer(duration: number): Buffer {
  const silenceDuration = Math.max(duration, 1);
  const bufferSize = Math.floor(silenceDuration * 44100 * 2 * 2); // 44.1kHz stereo 16-bit
  return Buffer.alloc(bufferSize);
}

/**
 * Procesa audio completo para todo el plan de video
 */
export async function procesarAudioCompleto(plan: VideoPlan): Promise<{
  audioTotal: Buffer;
  metadataCompleta: any;
}> {
  logger.info(`🎬 [AudioIntegration] Procesando audio para plan completo (${plan.timeline.length} secciones)`);
  
  const configuracionOptima = await obtenerConfiguracionOptima();
  const audioSecciones: Buffer[] = [];
  const metadataSecciones: any[] = [];

  for (let i = 0; i < plan.timeline.length; i++) {
    const seccion = plan.timeline[i];
    
    // Determinar momento narrativo según posición
    let momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
    if (i === 0) momentoNarrativo = 'setup';
    else if (i === plan.timeline.length - 1) momentoNarrativo = 'cierre';
    else if (i > plan.timeline.length * 0.7) momentoNarrativo = 'climax';
    else momentoNarrativo = 'desarrollo';

    const opcionesSeccion: AudioIntegrationOptions = {
      ...configuracionOptima,
      duracionToma: seccion.duracion || 10,
      momentoNarrativo,
      tono: seccion.tono || plan.metadata?.style || 'dramático',
      esEmocional: seccion.esEmocional || i > plan.timeline.length * 0.5
    };

    try {
      const audioSeccion = await generarAudioCompleto(seccion, plan, opcionesSeccion);
      
      // Usar la música principal como audio de la sección
      audioSecciones.push(audioSeccion.musica);
      metadataSecciones.push({
        seccion: i,
        ...audioSeccion.metadata
      });
      
      logger.info(`✅ [AudioIntegration] Sección ${i} procesada: ${audioSeccion.musica.length} bytes`);
      
    } catch (error) {
      logger.error(`❌ [AudioIntegration] Error procesando sección ${i}: ${error}`);
      audioSecciones.push(createSilenceBuffer(opcionesSeccion.duracionToma));
      metadataSecciones.push({ seccion: i, error: String(error) });
    }
  }

  // Concatenar todo el audio
  const audioTotal = Buffer.concat(audioSecciones);
  
  const metadataCompleta = {
    duracionTotal: audioSecciones.length,
    tamañoTotal: audioTotal.length,
    seccionesProcesadas: metadataSecciones.length,
    configuracionUsada: configuracionOptima,
    secciones: metadataSecciones
  };

  logger.info(`🎼 [AudioIntegration] Audio completo procesado: ${audioTotal.length} bytes totales`);
  
  return {
    audioTotal,
    metadataCompleta
  };
}
