// restricciones.ts - Reglas y limitaciones por estilo de CinemaAI

export const RESTRICCIONES_GENERALES = {
  duracionMaxPorClip: 10,
  usarSoloAssetsCDN: true,
  actoresPredefinidos: true,
  animacionDisponible: true,
  maxEscenasPorVideo: 6,
  klingElementsEnabled: true
};

export const LIMITACIONES_ESTILO = {
  cinematic: {
    soportaLipSync: true,
    musica: 'orquestal',
    carryoverMax: 2,
    animacion: 'Kling Elements',
    assetStyle: 'realistic', // Usa assets realistic
    cameraMovements: ['dolly', 'crane', 'steadicam', 'tracking', 'orbiting'],
    lighting: 'dramatic',
    transiciones: ['fade', 'dissolve', 'match-cut', 'cross-dissolve'],
    duracionPreferida: 10
  },
  anime: {
    soportaLipSync: false,
    musica: 'épica o emocional',
    carryoverMax: 1,
    animacion: 'Kling Elements',
    assetStyle: 'anime',
    cameraMovements: ['static', 'pan', 'zoom'],
    lighting: 'bright',
    transiciones: ['cut', 'fade'],
    duracionPreferida: 5
  },
  cartoon: {
    soportaLipSync: false,
    musica: 'divertida',
    carryoverMax: 0,
    animacion: 'rápida y simple',
    assetStyle: 'cartoon',
    cameraMovements: ['static', 'bounce', 'zoom'],
    lighting: 'colorful',
    transiciones: ['cut', 'wipe'],
    duracionPreferida: 5
  },
  commercial: {
    soportaLipSync: true,
    musica: 'upbeat',
    carryoverMax: 1,
    animacion: 'Kling Elements',
    assetStyle: 'commercial',
    cameraMovements: ['dolly', 'pan', 'static'],
    lighting: 'bright',
    transiciones: ['cut', 'fade'],
    duracionPreferida: 7
  }
};

export function getEstiloLimitaciones(estilo: string) {
  return LIMITACIONES_ESTILO[estilo as keyof typeof LIMITACIONES_ESTILO] || LIMITACIONES_ESTILO.cinematic;
}

export function validarDuracionClip(duracion: number, estilo: string): boolean {
  const limite = getEstiloLimitaciones(estilo);
  return duracion <= RESTRICCIONES_GENERALES.duracionMaxPorClip;
}

export function getCameraMovement(estilo: string, indice: number): string {
  const limite = getEstiloLimitaciones(estilo);
  return limite.cameraMovements[indice % limite.cameraMovements.length];
}
