// musicService.ts - Servicio de música cinematográfica con integración Freesound

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

interface MusicRequest {
  style: string;
  duration: number;
  mood: string;
}

interface FreesoundSearchResult {
  id: number;
  name: string;
  url: string;
  tags: string[];
  duration: number;
  download: string;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
}

interface FreesoundResponse {
  results: FreesoundSearchResult[];
  count: number;
}

/**
 * Obtiene música de fondo usando Freesound API
 */
export async function getBackgroundMusic(style: string, duration: number = 30, mood: string = 'neutral'): Promise<Buffer> {
  logger.info(`🎵 [MusicService] Solicitando música: ${style}, ${mood}, ${duration}s`);
  
  try {
    // Si no hay API key de Freesound, usar fallback de silencio
    if (!env.FREESOUND_API_KEY) {
      logger.warn('🔑 [MusicService] FREESOUND_API_KEY no configurada, usando silencio como fallback');
      return createSilenceBuffer(duration);
    }

    // Mapear estilos cinematográficos a tags de Freesound
    const musicStyles = {
      'cinematic': 'cinematic epic orchestral film score',
      'anime': 'electronic upbeat japanese anime',
      'cartoon': 'playful orchestral cartoon comedy',
      'dramatic': 'dramatic tense strings emotional',
      'adventure': 'adventure heroic brass epic',
      'mystery': 'mystery dark ambient suspense',
      'romance': 'romantic soft piano emotional',
      'action': 'action intense drums fast',
      'orchestral': 'orchestral symphony classical strings',
      'ambient': 'ambient atmospheric calm peaceful',
      'suspense': 'suspense mysterious dark tension',
      'fantasy': 'fantasy magical mystical enchanted'
    };
    
    const moodTags = {
      'happy': 'happy upbeat positive',
      'sad': 'sad melancholy emotional',
      'tense': 'tense suspense dark',
      'calm': 'calm peaceful relaxing',
      'exciting': 'exciting energetic dynamic',
      'mysterious': 'mysterious dark atmospheric',
      'neutral': 'background instrumental'
    };

    const styleTags = musicStyles[style as keyof typeof musicStyles] || `${style} cinematic music`;
    const moodTag = moodTags[mood as keyof typeof moodTags] || mood;
    
    // Buscar en Freesound
    const searchQuery = `${styleTags} ${moodTag} loop background`;
    const searchUrl = 'https://freesound.org/apiv2/search/text/';
    
    logger.info(`🔍 [MusicService] Buscando en Freesound: "${searchQuery}"`);
    
    const searchResponse = await axios.get<FreesoundResponse>(searchUrl, {
      params: {
        query: searchQuery,
        filter: `duration:[${Math.max(duration - 10, 10)} TO ${duration + 30}]`,
        sort: 'downloads_desc',
        page_size: 15,
        fields: 'id,name,url,tags,duration,download,previews'
      },
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 10000
    });

    if (!searchResponse.data.results.length) {
      logger.warn(`🚫 [MusicService] No se encontraron resultados para: ${searchQuery}`);
      return createSilenceBuffer(duration);
    }

    // Seleccionar el mejor resultado (el primero por relevancia y descargas)
    const selectedSound = searchResponse.data.results[0];
    logger.info(`✅ [MusicService] Seleccionado: "${selectedSound.name}" (${selectedSound.duration}s)`);

    // Descargar el preview del audio (alta calidad preferida)
    const audioUrl = selectedSound.previews['preview-hq-mp3'] || selectedSound.previews['preview-lq-mp3'];
    
    if (!audioUrl) {
      logger.warn(`🚫 [MusicService] No hay preview disponible para: ${selectedSound.name}`);
      return createSilenceBuffer(duration);
    }

    logger.info(`⬇️ [MusicService] Descargando audio desde: ${audioUrl}`);
    
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const audioBuffer = Buffer.from(audioResponse.data);
    logger.info(`🎵 [MusicService] Música descargada: ${audioBuffer.length} bytes desde Freesound`);
    
    return audioBuffer;
    
  } catch (error: any) {
    logger.error('❌ [MusicService] Error obteniendo música de Freesound:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // Fallback a silencio en caso de error
    logger.info('🔇 [MusicService] Usando silencio como fallback');
    return createSilenceBuffer(duration);
  }
}

/**
 * Obtiene música específica por ID de Freesound
 */
export async function getMusicById(musicId: string): Promise<Buffer> {
  logger.info(`🎵 [MusicService] Obteniendo música por ID: ${musicId}`);
  
  try {
    if (!env.FREESOUND_API_KEY) {
      logger.warn('🔑 [MusicService] FREESOUND_API_KEY no configurada');
      return createSilenceBuffer(20);
    }

    // Obtener detalles del sonido específico
    const soundUrl = `https://freesound.org/apiv2/sounds/${musicId}/`;
    
    const soundResponse = await axios.get(soundUrl, {
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 10000
    });

    const sound = soundResponse.data;
    const audioUrl = sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'];
    
    if (!audioUrl) {
      throw new Error(`No hay preview disponible para el sonido ID: ${musicId}`);
    }

    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const audioBuffer = Buffer.from(audioResponse.data);
    logger.info(`🎵 [MusicService] Música ID ${musicId} obtenida: ${audioBuffer.length} bytes`);
    
    return audioBuffer;
    
  } catch (error: any) {
    logger.error(`❌ [MusicService] Error obteniendo música por ID: ${error.message}`);
    return createSilenceBuffer(20);
  }
}

/**
 * Obtiene lista de música disponible por categoría desde Freesound
 */
export async function getMusicLibrary(category: string = 'cinematic'): Promise<Array<{id: string, name: string, duration: number}>> {
  logger.info(`📚 [MusicService] Obteniendo biblioteca de música: ${category}`);
  
  try {
    if (!env.FREESOUND_API_KEY) {
      logger.warn('🔑 [MusicService] FREESOUND_API_KEY no configurada, devolviendo biblioteca simulada');
      return getSimulatedLibrary(category);
    }

    const searchUrl = 'https://freesound.org/apiv2/search/text/';
    const searchQuery = `${category} cinematic background music`;
    
    const searchResponse = await axios.get<FreesoundResponse>(searchUrl, {
      params: {
        query: searchQuery,
        sort: 'downloads_desc',
        page_size: 20,
        fields: 'id,name,duration'
      },
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 10000
    });

    const library = searchResponse.data.results.map(sound => ({
      id: sound.id.toString(),
      name: sound.name,
      duration: Math.round(sound.duration)
    }));

    logger.info(`📚 [MusicService] Biblioteca obtenida: ${library.length} elementos`);
    return library;
    
  } catch (error: any) {
    logger.error(`❌ [MusicService] Error obteniendo biblioteca: ${error.message}`);
    return getSimulatedLibrary(category);
  }
}

// Función helper para crear buffer de silencio
function createSilenceBuffer(duration: number): Buffer {
  // Crear buffer de silencio de la duración especificada
  // 44.1kHz, stereo, 16-bit = 44100 * 2 * 2 bytes por segundo
  const silenceDuration = Math.max(duration, 1);
  const bufferSize = Math.floor(silenceDuration * 44100 * 2 * 2);
  const silenceBuffer = Buffer.alloc(bufferSize);
  
  logger.info(`🔇 [MusicService] Buffer de silencio creado: ${silenceBuffer.length} bytes (${silenceDuration}s)`);
  return silenceBuffer;
}

// Biblioteca simulada como fallback
function getSimulatedLibrary(category: string): Array<{id: string, name: string, duration: number}> {
  const library = [
    { id: 'epic_001', name: 'Epic Orchestra', duration: 30 },
    { id: 'anime_001', name: 'Electronic Beat', duration: 25 },
    { id: 'cartoon_001', name: 'Playful Melody', duration: 20 },
    { id: 'dramatic_001', name: 'Tense Atmosphere', duration: 35 },
    { id: 'adventure_001', name: 'Heroic Journey', duration: 40 },
    { id: 'cinematic_001', name: 'Cinematic Theme', duration: 45 },
    { id: 'mystery_001', name: 'Dark Mystery', duration: 32 },
    { id: 'romance_001', name: 'Romantic Piano', duration: 28 }
  ];
  
  if (category === 'all') {
    return library;
  }
  
  return library.filter(item => 
    item.name.toLowerCase().includes(category.toLowerCase()) ||
    item.id.toLowerCase().includes(category.toLowerCase())
  );
}
