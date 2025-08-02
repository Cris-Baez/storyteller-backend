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

    // Mapear estilos cinematográficos a tags de Freesound con términos más amplios
    const musicStyles = {
      'cinematic': 'cinematic movie film orchestral background instrumental',
      'anime': 'electronic music instrumental background loop',
      'cartoon': 'funny comedy instrumental background music',
      'dramatic': 'dramatic emotional orchestral strings background',
      'adventure': 'adventure epic orchestral heroic instrumental',
      'mystery': 'mysterious dark ambient atmospheric background',
      'romance': 'romantic soft piano peaceful instrumental',
      'action': 'action energetic drums intense background',
      'orchestral': 'orchestra classical symphonic instrumental background',
      'orchestral-dramatic': 'orchestral dramatic epic cinematic background',
      'orchestral-neutral': 'orchestral calm peaceful background instrumental',
      'orchestral-climax': 'orchestral powerful epic dramatic background',
      'orchestral-climax-extended': 'orchestral epic dramatic cinematic background',
      'orchestral-development': 'orchestral building tension background',
      'ambient': 'ambient atmospheric calm peaceful background',
      'suspense': 'suspense tension mysterious dark background',
      'fantasy': 'fantasy magical mystical orchestral background'
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
    
    // Buscar en Freesound con términos más amplios y flexibles
    const searchQuery = `${styleTags} ${moodTag}`;
    const searchUrl = 'https://freesound.org/apiv2/search/text/';
    
    logger.info(`🔍 [MusicService] Buscando en Freesound: "${searchQuery}"`);
    
    const searchResponse = await axios.get<FreesoundResponse>(searchUrl, {
      params: {
        query: searchQuery,
        filter: `duration:[5 TO 120] type:wav OR type:mp3 OR type:aiff`, // Más duración flexible y formatos
        sort: 'downloads_desc',
        page_size: 20, // Más resultados para mayor probabilidad
        fields: 'id,name,url,tags,duration,download,previews'
      },
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 15000 // Más tiempo para la búsqueda
    });

    if (!searchResponse.data.results.length) {
      logger.warn(`🚫 [MusicService] No se encontraron resultados para: ${searchQuery}`);
      
      // Fallback: intentar búsqueda más simple solo con "music"
      logger.info(`🔄 [MusicService] Intentando búsqueda de fallback...`);
      const fallbackQuery = `music instrumental background`;
      
      const fallbackResponse = await axios.get<FreesoundResponse>(searchUrl, {
        params: {
          query: fallbackQuery,
          filter: `duration:[5 TO 120] type:wav OR type:mp3`,
          sort: 'downloads_desc',
          page_size: 10,
          fields: 'id,name,url,tags,duration,download,previews'
        },
        headers: {
          'Authorization': `Token ${env.FREESOUND_API_KEY}`
        },
        timeout: 15000
      });
      
      if (!fallbackResponse.data.results.length) {
        logger.warn(`🚫 [MusicService] Tampoco se encontraron resultados en búsqueda de fallback`);
        return createSilenceBuffer(duration);
      }
      
      searchResponse.data = fallbackResponse.data;
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

// Función helper para crear buffer de silencio MP3 válido
function createSilenceBuffer(duration: number): Buffer {
  // Crear un MP3 de silencio válido con headers apropiados
  const silenceDuration = Math.max(duration, 1);
  
  // MP3 mínimo válido header para silencio (44.1kHz, stereo, 128kbps)
  const mp3Header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MP3 sync word + header
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  // Calcular frames necesarios para la duración (38.28ms por frame en MP3)
  const framesNeeded = Math.ceil(silenceDuration * 1000 / 38.28);
  const frameSize = 417; // Tamaño típico de frame MP3 @ 128kbps
  
  // Crear buffer con headers repetidos
  const buffers: Buffer[] = [];
  for (let i = 0; i < framesNeeded; i++) {
    buffers.push(mp3Header);
    // Agregar padding de silencio
    buffers.push(Buffer.alloc(frameSize - mp3Header.length));
  }
  
  const silenceBuffer = Buffer.concat(buffers);
  
  logger.info(`🔇 [MusicService] MP3 de silencio válido creado: ${silenceBuffer.length} bytes (${silenceDuration}s)`);
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
