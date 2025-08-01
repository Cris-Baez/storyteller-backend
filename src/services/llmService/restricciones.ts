// restricciones.ts - Limitaciones y restricciones del sistema

export const RESTRICCIONES_GENERALES = {
  duracionMinima: 5,
  duracionMaxima: 60,
  resolucionDefecto: '1920x1080',
  fpsDefecto: 30,
  formatoSalida: 'mp4'
};

export const LIMITACIONES_ESTILO = {
  cinematic: {
    duracionMaxima: 60,
    movimientosCamara: ['estatica', 'pan', 'tilt', 'zoom'],
    transiciones: ['corte', 'fade', 'disolver'],
    efectos: ['ninguno', 'color_grading', 'vignette']
  },
  anime: {
    duracionMaxima: 45,
    movimientosCamara: ['estatica', 'pan', 'zoom'],
    transiciones: ['corte', 'fade'],
    efectos: ['ninguno', 'saturacion', 'contraste']
  },
  cartoon: {
    duracionMaxima: 30,
    movimientosCamara: ['estatica', 'zoom'],
    transiciones: ['corte'],
    efectos: ['ninguno', 'saturacion']
  },
  commercial: {
    duracionMaxima: 40,
    movimientosCamara: ['estatica', 'pan', 'zoom', 'smooth_professional'],
    transiciones: ['corte', 'fade', 'professional_cut'],
    efectos: ['ninguno', 'brand_colors', 'professional_look']
  }
};

/**
 * Obtiene las limitaciones para un estilo específico
 */
export function getEstiloLimitaciones(estilo: string) {
  return LIMITACIONES_ESTILO[estilo as keyof typeof LIMITACIONES_ESTILO] || LIMITACIONES_ESTILO.cinematic;
}

/**
 * Valida la duración de un clip según el estilo
 */
export function validarDuracionClip(duracion: number, estilo: string): boolean {
  const limitaciones = getEstiloLimitaciones(estilo);
  return duracion >= RESTRICCIONES_GENERALES.duracionMinima && 
         duracion <= limitaciones.duracionMaxima;
}

/**
 * Obtiene movimiento de cámara válido para el estilo
 */
export function getCameraMovement(estilo: string): string {
  const limitaciones = getEstiloLimitaciones(estilo);
  const movimientos = limitaciones.movimientosCamara;
  return movimientos[Math.floor(Math.random() * movimientos.length)];
}

/**
 * Obtiene transición válida para el estilo
 */
export function getTransicion(estilo: string): string {
  const limitaciones = getEstiloLimitaciones(estilo);
  const transiciones = limitaciones.transiciones;
  return transiciones[Math.floor(Math.random() * transiciones.length)];
}

/**
 * Obtiene efecto válido para el estilo
 */
export function getEfecto(estilo: string): string {
  const limitaciones = getEstiloLimitaciones(estilo);
  const efectos = limitaciones.efectos;
  return efectos[Math.floor(Math.random() * efectos.length)];
}
