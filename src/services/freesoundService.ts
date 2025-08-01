// src/services/freesoundService.ts - Servicio para obtener música de Freesound

import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';

interface FreesoundTrack {
  id: number;
  name: string;
  url: string;
  download: string;
  duration: number;
  license: string;
  username: string;
  tags: string[];
}

interface FreesoundResponse {
  count: number;
  results: FreesoundTrack[];
}

/**
 * Busca música corporativa en Freesound
 */
export async function buscarMusicaCorporativa(opciones: {
  duracionMinima?: number;
  tags?: string[];
  maxResultados?: number;
}): Promise<string | null> {
  const apiKey = process.env.FREESOUND_API_KEY;
  
  if (!apiKey) {
    logger.warn('[FreesoundService] API key no configurada, usando música por defecto');
    return obtenerMusicaPorDefecto();
  }

  try {
    const tags = opciones.tags || ['corporate', 'motivational', 'upbeat'];
    const query = tags.join(' OR ');
    const duracionMin = opciones.duracionMinima || 10;
    const maxResults = opciones.maxResultados || 10;

    const searchUrl = new URL('https://freesound.org/apiv2/search/text/');
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('filter', `duration:[${duracionMin} TO *] license:Creative`);
    searchUrl.searchParams.append('fields', 'id,name,url,download,duration,license,username,tags');
    searchUrl.searchParams.append('page_size', maxResults.toString());
    searchUrl.searchParams.append('token', apiKey);

    logger.info('[FreesoundService] Buscando música corporativa', {
      query,
      duracionMin,
      maxResults
    });

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Freesound API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FreesoundResponse;
    
    if (!data.results || data.results.length === 0) {
      logger.warn('[FreesoundService] No se encontraron pistas, usando música por defecto');
      return obtenerMusicaPorDefecto();
    }

    // Filtrar y seleccionar la mejor pista
    const pistaSeleccionada = seleccionarMejorPista(data.results, opciones);
    
    if (!pistaSeleccionada) {
      logger.warn('[FreesoundService] No se pudo seleccionar pista adecuada');
      return obtenerMusicaPorDefecto();
    }

    // Obtener URL de descarga
    const urlDescarga = await obtenerUrlDescarga(pistaSeleccionada.id, apiKey);
    
    if (!urlDescarga) {
      logger.warn('[FreesoundService] No se pudo obtener URL de descarga');
      return obtenerMusicaPorDefecto();
    }

    logger.info('[FreesoundService] Música corporativa obtenida exitosamente', {
      id: pistaSeleccionada.id,
      nombre: pistaSeleccionada.name,
      duracion: pistaSeleccionada.duration,
      usuario: pistaSeleccionada.username
    });

    return urlDescarga;

  } catch (error) {
    logger.error('[FreesoundService] Error buscando música corporativa:', error);
    return obtenerMusicaPorDefecto();
  }
}

/**
 * Selecciona la mejor pista según criterios específicos
 */
function seleccionarMejorPista(pistas: FreesoundTrack[], opciones: any): FreesoundTrack | null {
  if (!pistas || pistas.length === 0) return null;

  // Priorizar pistas con tags más relevantes
  const tagsRelevantes = ['corporate', 'motivational', 'upbeat', 'positive', 'business'];
  
  const pistasConPuntuacion = pistas.map(pista => {
    let puntuacion = 0;
    
    // Puntos por tags relevantes
    const tagsLowerCase = pista.tags.map(tag => tag.toLowerCase());
    tagsRelevantes.forEach(tag => {
      if (tagsLowerCase.includes(tag)) {
        puntuacion += 10;
      }
    });
    
    // Puntos por duración apropiada (10-30 segundos ideal)
    if (pista.duration >= 10 && pista.duration <= 30) {
      puntuacion += 5;
    } else if (pista.duration >= 30 && pista.duration <= 60) {
      puntuacion += 3;
    }
    
    // Penalizar pistas muy largas
    if (pista.duration > 120) {
      puntuacion -= 5;
    }
    
    return { pista, puntuacion };
  });

  // Ordenar por puntuación y seleccionar la mejor
  pistasConPuntuacion.sort((a, b) => b.puntuacion - a.puntuacion);
  
  return pistasConPuntuacion[0]?.pista || null;
}

/**
 * Obtiene la URL de descarga directa de una pista
 */
async function obtenerUrlDescarga(trackId: number, apiKey: string): Promise<string | null> {
  try {
    const downloadUrl = `https://freesound.org/apiv2/sounds/${trackId}/download/`;
    
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo URL de descarga: ${response.status}`);
    }

    return response.url;

  } catch (error) {
    logger.error('[FreesoundService] Error obteniendo URL de descarga:', error);
    return null;
  }
}

/**
 * Obtiene música por defecto cuando Freesound no está disponible
 */
function obtenerMusicaPorDefecto(): string {
  // URLs de música corporativa por defecto (deberías tener estas en tu CDN)
  const musicaPorDefecto = [
    `${process.env.CDN_BUCKET_URL}/audio/corporate/corporate_upbeat_01.mp3`,
    `${process.env.CDN_BUCKET_URL}/audio/corporate/corporate_motivational_01.mp3`,
    `${process.env.CDN_BUCKET_URL}/audio/corporate/corporate_positive_01.mp3`
  ];

  // Seleccionar aleatoriamente
  const indice = Math.floor(Math.random() * musicaPorDefecto.length);
  return musicaPorDefecto[indice];
}

/**
 * Busca efectos de sonido corporativos
 */
export async function buscarEfectosSonidoCorporativos(): Promise<string[]> {
  const apiKey = process.env.FREESOUND_API_KEY;
  
  if (!apiKey) {
    logger.warn('[FreesoundService] API key no configurada para efectos de sonido');
    return obtenerEfectosPorDefecto();
  }

  try {
    const tags = ['corporate', 'business', 'office', 'professional', 'clean'];
    const query = tags.join(' OR ');

    const searchUrl = new URL('https://freesound.org/apiv2/search/text/');
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('filter', 'duration:[1 TO 5] license:Creative');
    searchUrl.searchParams.append('fields', 'id,name,download,duration');
    searchUrl.searchParams.append('page_size', '5');
    searchUrl.searchParams.append('token', apiKey);

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Freesound API error: ${response.status}`);
    }

    const data = await response.json() as FreesoundResponse;
    
    if (!data.results || data.results.length === 0) {
      return obtenerEfectosPorDefecto();
    }

    // Obtener URLs de descarga para los efectos
    const efectos: string[] = [];
    for (const track of data.results.slice(0, 3)) {
      const url = await obtenerUrlDescarga(track.id, apiKey);
      if (url) {
        efectos.push(url);
      }
    }

    return efectos.length > 0 ? efectos : obtenerEfectosPorDefecto();

  } catch (error) {
    logger.error('[FreesoundService] Error buscando efectos de sonido:', error);
    return obtenerEfectosPorDefecto();
  }
}

/**
 * Efectos de sonido por defecto para marketing
 */
function obtenerEfectosPorDefecto(): string[] {
  return [
    `${process.env.CDN_BUCKET_URL}/audio/sfx/corporate_chime.mp3`,
    `${process.env.CDN_BUCKET_URL}/audio/sfx/success_sound.mp3`,
    `${process.env.CDN_BUCKET_URL}/audio/sfx/notification.mp3`
  ];
}

/**
 * Valida la configuración de Freesound
 */
export function validarConfiguracionFreesound(): boolean {
  return !!process.env.FREESOUND_API_KEY;
}
