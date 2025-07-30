// src/types/estilos.ts - Tipos unificados para estilos visuales

/**
 * Estilos visuales principales soportados por CinemaAI
 */
export type EstiloVisualPrincipal = 
  | 'cinematic'     // Estilo cinematográfico profesional
  | 'anime'         // Estilo anime/manga japonés
  | 'cartoon'       // Estilo cartoon/animación occidental
  | 'commercial';   // Estilo comercial/publicitario

/**
 * Estilos de entrada permitidos desde la API (incluye alias)
 */
export type EstiloVisualAPI = 
  | EstiloVisualPrincipal
  | 'realistic'     // Alias para 'cinematic'
  | 'realista'      // Alias español para 'cinematic'  
  | 'comic'         // Alias para 'cartoon'
  | 'comercial';    // Alias español para 'commercial'

/**
 * Mapeo de estilos de entrada a estilos principales
 */
export const MAPEO_ESTILOS: Record<EstiloVisualAPI, EstiloVisualPrincipal> = {
  // Estilos principales (sin mapeo)
  'cinematic': 'cinematic',
  'anime': 'anime', 
  'cartoon': 'cartoon',
  'commercial': 'commercial',
  
  // Alias mapeados
  'realistic': 'cinematic',
  'realista': 'cinematic',
  'comic': 'cartoon',
  'comercial': 'commercial'
};

/**
 * Convierte cualquier estilo de entrada al estilo principal correspondiente
 */
export function normalizarEstilo(estilo: EstiloVisualAPI): EstiloVisualPrincipal {
  const estiloNormalizado = MAPEO_ESTILOS[estilo];
  if (!estiloNormalizado) {
    console.warn(`Estilo visual '${estilo}' no reconocido, usando 'cinematic' por defecto`);
    return 'cinematic';
  }
  return estiloNormalizado;
}

/**
 * Verifica si un estilo es válido
 */
export function esEstiloValido(estilo: string): estilo is EstiloVisualAPI {
  return estilo in MAPEO_ESTILOS;
}

/**
 * Lista de todos los estilos válidos para validaciones
 */
export const ESTILOS_VALIDOS: EstiloVisualAPI[] = Object.keys(MAPEO_ESTILOS) as EstiloVisualAPI[];

/**
 * Configuración específica por estilo
 */
export const CONFIGURACION_ESTILOS = {
  cinematic: {
    duracionMaximaToma: 10,
    aspectRatio: '16:9',
    usaLipSync: true,
    tecnologiaLipSync: 'wav2lip',
    descripcion: 'Estilo cinematográfico profesional con calidad de película'
  },
  anime: {
    duracionMaximaToma: 8,
    aspectRatio: '16:9', 
    usaLipSync: true,
    tecnologiaLipSync: 'sadtalker',
    descripcion: 'Estilo anime/manga japonés con características distintivas'
  },
  cartoon: {
    duracionMaximaToma: 6,
    aspectRatio: '16:9',
    usaLipSync: true, 
    tecnologiaLipSync: 'sadtalker',
    descripcion: 'Estilo cartoon occidental animado'
  },
  commercial: {
    duracionMaximaToma: 5,
    aspectRatio: '16:9',
    usaLipSync: false,
    tecnologiaLipSync: null,
    descripcion: 'Estilo comercial/publicitario enfocado en productos'
  }
} as const;
