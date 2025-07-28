// helpers/segmentador.ts - Segmentación de videos por estilo

export interface SegmentoVideo {
  inicio: number;
  fin: number;
  duracion: number;
  tipo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  intensidad: number;
}

/**
 * Segmenta un video según el estilo cinematográfico
 */
export function segmentarPorEstilo(duracionTotal: number, estilo: string): SegmentoVideo[] {
  const segmentos: SegmentoVideo[] = [];
  
  switch (estilo) {
    case 'cinematic':
      return segmentarCinematico(duracionTotal);
    case 'anime':
      return segmentarAnime(duracionTotal);
    case 'cartoon':
      return segmentarCartoon(duracionTotal);
    default:
      return segmentarCinematico(duracionTotal);
  }
}

/**
 * Segmentación cinematográfica clásica (3 actos)
 */
function segmentarCinematico(duracion: number): SegmentoVideo[] {
  const segmentos: SegmentoVideo[] = [];
  
  // Acto 1: Setup (25%)
  const duracionSetup = Math.floor(duracion * 0.25);
  segmentos.push({
    inicio: 0,
    fin: duracionSetup,
    duracion: duracionSetup,
    tipo: 'setup',
    intensidad: 3
  });
  
  // Acto 2: Desarrollo (50%)
  const duracionDesarrollo = Math.floor(duracion * 0.5);
  segmentos.push({
    inicio: duracionSetup,
    fin: duracionSetup + duracionDesarrollo,
    duracion: duracionDesarrollo,
    tipo: 'desarrollo',
    intensidad: 6
  });
  
  // Clímax (15%)
  const duracionClimax = Math.floor(duracion * 0.15);
  segmentos.push({
    inicio: duracionSetup + duracionDesarrollo,
    fin: duracionSetup + duracionDesarrollo + duracionClimax,
    duracion: duracionClimax,
    tipo: 'climax',
    intensidad: 9
  });
  
  // Cierre (10%)
  const inicioCierre = duracionSetup + duracionDesarrollo + duracionClimax;
  segmentos.push({
    inicio: inicioCierre,
    fin: duracion,
    duracion: duracion - inicioCierre,
    tipo: 'cierre',
    intensidad: 2
  });
  
  return segmentos;
}

/**
 * Segmentación para estilo anime
 */
function segmentarAnime(duracion: number): SegmentoVideo[] {
  // Estructura similar pero más dinámica
  const segmentos: SegmentoVideo[] = [];
  
  // Setup rápido (20%)
  const duracionSetup = Math.floor(duracion * 0.2);
  segmentos.push({
    inicio: 0,
    fin: duracionSetup,
    duracion: duracionSetup,
    tipo: 'setup',
    intensidad: 4
  });
  
  // Desarrollo intenso (60%)
  const duracionDesarrollo = Math.floor(duracion * 0.6);
  segmentos.push({
    inicio: duracionSetup,
    fin: duracionSetup + duracionDesarrollo,
    duracion: duracionDesarrollo,
    tipo: 'desarrollo',
    intensidad: 7
  });
  
  // Clímax explosivo (20%)
  const inicioCierre = duracionSetup + duracionDesarrollo;
  segmentos.push({
    inicio: inicioCierre,
    fin: duracion,
    duracion: duracion - inicioCierre,
    tipo: 'climax',
    intensidad: 10
  });
  
  return segmentos;
}

/**
 * Segmentación para estilo cartoon
 */
function segmentarCartoon(duracion: number): SegmentoVideo[] {
  // Estructura simple y divertida
  const segmentos: SegmentoVideo[] = [];
  
  // Setup (30%)
  const duracionSetup = Math.floor(duracion * 0.3);
  segmentos.push({
    inicio: 0,
    fin: duracionSetup,
    duracion: duracionSetup,
    tipo: 'setup',
    intensidad: 5
  });
  
  // Desarrollo (70%)
  const inicioCierre = duracionSetup;
  segmentos.push({
    inicio: inicioCierre,
    fin: duracion,
    duracion: duracion - inicioCierre,
    tipo: 'desarrollo',
    intensidad: 8
  });
  
  return segmentos;
}
