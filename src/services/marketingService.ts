// src/services/marketingService.ts - Servicio completo para Marketing AI

import { generateKlingClip } from './klingService.js';
import { createMarketingVoiceBuffer } from './voiceService.js';
import { getAdvancedMusic, processAudioForScene } from './audioEngine.js';
import { assembleVideo } from './ffmpegService.js';
import { uploadToCDN } from './cdnService.js';
import { generarVozComercial } from './murfService.js';
import { logger } from '../utils/logger.js';
import { EstiloVisualPrincipal } from '../types/estilos.js';

export interface MarketingRequest {
  imagenes: string[];
  descripcion: string;
  estilo?: EstiloVisualPrincipal;
  duracion?: number;
  textoVoz?: string;
}

export interface MarketingResponse {
  videoUrl: string;
  audioUsed: string;
  musicUsed: string;
  planUsed: any;
  metadata: {
    duracion: number;
    estilo: string;
    tipo: 'marketing';
    imagenes: number;
    hasVoz: boolean;
    hasMusica: boolean;
  };
}

/**
 * Genera un clip de marketing completo con imágenes, voz y música
 */
export async function generateMarketingClip(request: MarketingRequest): Promise<MarketingResponse> {
  const inicio = Date.now();
  const duracion = request.duracion || 15; // Duración por defecto 15 segundos
  const estilo = request.estilo || 'commercial';
  
  logger.info('[MarketingService] Iniciando generación de clip marketing', {
    imagenes: request.imagenes.length,
    descripcion: request.descripcion.substring(0, 100),
    estilo,
    duracion
  });

  try {
    // 1. Generar prompt optimizado para marketing
    const promptMarketing = generarPromptMarketing(request.descripcion, estilo);
    
    // 2. Generar texto de voz si no se proporciona
    const textoVoz = request.textoVoz || generarTextoVozMarketing(request.descripcion);
    
    // 3. Generar video usando la primera imagen como base
    const imagenPrincipal = request.imagenes[0];
    logger.info('[MarketingService] Generando video con Kling...', { imagenPrincipal });
    
    const videoClip = await generateKlingClip({
      prompt: promptMarketing,
      input_image_urls: [imagenPrincipal],
      duration: duracion,
      aspectRatio: '16:9',
      creativity: 0.7
    });

    if (!videoClip) {
      throw new Error('No se pudo generar el video base con Kling');
    }

    // 4. Generar voz comercial con Murf
    logger.info('[MarketingService] Generando voz comercial...', { textoLength: textoVoz.length });
    
    const audioVoz = await generarVozComercial({
      text: textoVoz,
      voice: seleccionarVozComercial(estilo),
      speed: 1.0,
      style: 'professional'
    });

    if (!audioVoz) {
      throw new Error('No se pudo generar la voz comercial');
    }

    // 5. Obtener música corporativa
    logger.info('[MarketingService] Obteniendo música corporativa...');
    
    const musica = await getAdvancedMusic({
      mood: 'corporate',
      duration: duracion,
      tags: ['motivational', 'upbeat', 'corporate', 'positive'],
      fallbackKeyword: 'corporate music'
    });

    if (!musica) {
      throw new Error('No se pudo obtener música corporativa');
    }

    // 6. Ensamblar video final con voz y música
    logger.info('[MarketingService] Ensamblando video final...', {
      hasVideo: !!videoClip,
      hasVoz: !!audioVoz,
      hasMusica: !!musica
    });

    const videoEnsamblado = await assembleVideo({
      plan: {
        visualStyle: estilo,
        timeline: [{
          segundo: 0,
          visual: 'marketing video',
          soundCue: 'rise'
        }],
        metadata: {
          visualStyle: estilo,
          duration: duracion as any,
          duracionTotal: duracion,
          tiempoGeneracion: Date.now()
        }
      },
      clips: [videoClip],
      voiceBuffer: audioVoz.audioBuffer || Buffer.alloc(0),
      music: [musica]
    });

    if (!videoEnsamblado) {
      throw new Error('No se pudo ensamblar el video final');
    }

    // 7. Subir a CDN
    logger.info('[MarketingService] Subiendo video a CDN...');
    
    const videoUrl = await uploadToCDN(
      videoEnsamblado, 
      `marketing/marketing_${Date.now()}.mp4`,
      {
        sceneId: `marketing_${Date.now()}`,
        type: 'marketing',
        feedback: `${estilo} marketing video`,
        metadata: {
          tipo: 'marketing',
          estilo,
          duracion,
          imagenes: request.imagenes.length
        }
      }
    );

    if (!videoUrl) {
      throw new Error('No se pudo subir el video al CDN');
    }

    const tiempoTotal = Date.now() - inicio;
    
    logger.info('[MarketingService] Clip de marketing completado exitosamente', {
      videoUrl,
      tiempoMs: tiempoTotal,
      duracion
    });

    return {
      videoUrl,
      audioUsed: 'marketing_voice_buffer',
      musicUsed: 'corporate_music_buffer',
      planUsed: {
        prompt: promptMarketing,
        textoVoz,
        imagenPrincipal,
        duracion,
        estilo
      },
      metadata: {
        duracion,
        estilo,
        tipo: 'marketing',
        imagenes: request.imagenes.length,
        hasVoz: true,
        hasMusica: true
      }
    };

  } catch (error) {
    const tiempoError = Date.now() - inicio;
    logger.error('[MarketingService] Error generando clip marketing:', {
      error: error instanceof Error ? error.message : String(error),
      tiempoMs: tiempoError,
      request: {
        imagenes: request.imagenes.length,
        descripcion: request.descripcion.substring(0, 50),
        estilo
      }
    });
    
    throw error;
  }
}

/**
 * Genera un prompt optimizado para marketing según el estilo
 */
function generarPromptMarketing(descripcion: string, estilo: EstiloVisualPrincipal): string {
  const basePrompt = `A dynamic and vibrant commercial featuring ${descripcion}. Professional lighting, clean background, happy energy.`;
  
  switch (estilo) {
    case 'commercial':
      return `${basePrompt} Shot with smooth camera movement, corporate style, modern and sleek presentation.`;
    
    case 'cinematic':
      return `${basePrompt} Cinematic camera work, dramatic lighting, premium quality feel.`;
    
    case 'cartoon':
      return `${basePrompt} Animated style, bright colors, fun and engaging presentation.`;
    
    case 'anime':
      return `${basePrompt} Anime-inspired visuals, dynamic angles, vibrant presentation.`;
    
    default:
      return `${basePrompt} Professional commercial presentation with smooth camera movement.`;
  }
}

/**
 * Genera texto de voz automático para marketing
 */
function generarTextoVozMarketing(descripcion: string): string {
  const textosBase = [
    `Descubre ${descripcion}. Una experiencia única te está esperando.`,
    `${descripcion}. Calidad excepcional que marca la diferencia.`,
    `Vive ${descripcion}. Reserva hoy y disfruta de algo extraordinario.`,
    `${descripcion}. La excelencia que mereces está aquí.`,
    `Experimenta ${descripcion}. Tu momento perfecto comienza ahora.`
  ];
  
  // Seleccionar texto aleatorio
  const indice = Math.floor(Math.random() * textosBase.length);
  return textosBase[indice];
}

/**
 * Selecciona voz comercial apropiada según el estilo
 */
function seleccionarVozComercial(estilo: EstiloVisualPrincipal): string {
  switch (estilo) {
    case 'commercial':
    case 'cinematic':
      return 'en-US-mark'; // Voz masculina profesional
    
    case 'cartoon':
    case 'anime':
      return 'en-US-samantha'; // Voz femenina energética
    
    default:
      return 'en-US-mark';
  }
}

/**
 * Genera configuración de movimiento de cámara para marketing
 */
function generarMovimientoCamara(estilo: EstiloVisualPrincipal): any {
  const movimientos = {
    commercial: {
      type: 'smooth_pan',
      speed: 'slow',
      direction: 'horizontal'
    },
    cinematic: {
      type: 'dolly_zoom',
      speed: 'medium',
      direction: 'forward'
    },
    cartoon: {
      type: 'bounce',
      speed: 'fast',
      direction: 'dynamic'
    },
    anime: {
      type: 'dynamic_sweep',
      speed: 'medium',
      direction: 'diagonal'
    }
  };
  
  return movimientos[estilo] || movimientos.commercial;
}

/**
 * Valida que las imágenes proporcionadas sean válidas
 */
export function validarImagenesMarketing(imagenes: string[]): boolean {
  if (!imagenes || imagenes.length === 0) {
    return false;
  }
  
  // Verificar que sean URLs válidas
  return imagenes.every(imagen => {
    try {
      new URL(imagen);
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Obtiene estadísticas de clips de marketing generados
 */
export async function obtenerEstadisticasMarketing(): Promise<{
  totalGenerados: number;
  estilosMasUsados: string[];
  duracionPromedio: number;
}> {
  // En el futuro esto podría leer de una base de datos
  // Por ahora retornamos valores por defecto
  return {
    totalGenerados: 0,
    estilosMasUsados: ['commercial', 'cinematic'],
    duracionPromedio: 15
  };
}
