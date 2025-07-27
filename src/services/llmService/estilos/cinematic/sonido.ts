// estilos/cinematic/sonido.ts - Cerebro Director de Sonido Cinematográfico

import { getEstiloLimitaciones } from '../../restricciones.js';

export interface ConfiguracionSonido {
  musica: string;
  efectos: string[];
  ambiente: string;
  lipSync: string;
  requiereVoz: boolean;
  tipoVoz?: string;
  intensidad: 'baja' | 'media' | 'alta';
}

export function configurarSonidoCinematico(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  esEmocional: boolean,
  tono: string,
  duracionTotal: number,
  actorInfo?: any
): ConfiguracionSonido {
  console.log(`[Sonido Cinematic] Configurando audio para ${momentoNarrativo} - segundo ${segundoActual}`);
  
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  // Configurar música orquestal
  const musica = configurarMusicaCinematica(momentoNarrativo, segundoActual, esEmocional, tono);
  
  // Efectos sonoros cinematográficos
  const efectos = seleccionarEfectosSonoros(momentoNarrativo, tono, esEmocional);
  
  // Ambiente sonoro
  const ambiente = configurarAmbienteCinematico(momentoNarrativo, tono);
  
  // Configuración de lip-sync para momentos clave
  const { lipSync, requiereVoz, tipoVoz } = configurarLipSyncCinematico(
    esEmocional, 
    momentoNarrativo, 
    segundoActual, 
    duracionTotal,
    actorInfo
  );
  
  // Intensidad general
  const intensidad = determinarIntensidadSonora(momentoNarrativo, esEmocional);
  
  return {
    musica,
    efectos,
    ambiente,
    lipSync,
    requiereVoz,
    tipoVoz,
    intensidad
  };
}

function configurarMusicaCinematica(momento: string, segundo: number, esEmocional: boolean, tono: string): string {
  // Primera escena siempre inicia música
  if (segundo === 0) {
    return tono === 'épico' ? 'orchestral-epic' : 'orchestral-dramatic';
  }
  
  // Cambios musicales en momentos clave
  const cambiosMusicales = {
    setup: segundo === 0 ? 'orchestral-introduction' : 'continue',
    desarrollo: esEmocional ? getMusicalThemeByTone(tono) : 'continue',
    climax: 'orchestral-climax',
    cierre: 'orchestral-resolution'
  };
  
  return cambiosMusicales[momento as keyof typeof cambiosMusicales] || 'continue';
}

function getMusicalThemeByTone(tono: string): string {
  const temasPorTono = {
    dramático: 'strings-dramatic',
    épico: 'brass-heroic',
    emocional: 'piano-emotional',
    misterioso: 'ambient-mysterious',
    acción: 'percussion-action'
  };
  
  return temasPorTono[tono as keyof typeof temasPorTono] || 'orchestral-neutral';
}

function seleccionarEfectosSonoros(momento: string, tono: string, esEmocional: boolean): string[] {
  const efectosBase = {
    setup: ['ambient', 'footsteps', 'wind'],
    desarrollo: ['ambient', 'movement', 'subtle-fx'],
    climax: ['tension', 'impact', 'dramatic-stinger'],
    cierre: ['resolution', 'ambient', 'peaceful']
  };
  
  const efectosEmocionales = {
    dramático: ['heartbeat', 'tension', 'silence'],
    épico: ['wind', 'thunder', 'triumph'],
    emocional: ['heartbeat', 'breath', 'silence'],
    misterioso: ['whisper', 'echo', 'suspense'],
    acción: ['impact', 'whoosh', 'dynamics']
  };
  
  let efectos = efectosBase[momento as keyof typeof efectosBase] || ['ambient'];
  
  if (esEmocional) {
    const efectosTono = efectosEmocionales[tono as keyof typeof efectosEmocionales] || ['ambient'];
    efectos = [...efectos, ...efectosTono].slice(0, 3); // Máximo 3 efectos
  }
  
  return efectos;
}

function configurarAmbienteCinematico(momento: string, tono: string): string {
  const ambientesPorMomento = {
    setup: 'natural-ambience',
    desarrollo: 'contextual-ambience',
    climax: 'intense-ambience',
    cierre: 'peaceful-ambience'
  };
  
  const ambientesPorTono = {
    dramático: 'tense-ambience',
    épico: 'grand-ambience',
    emocional: 'intimate-ambience',
    misterioso: 'mysterious-ambience',
    acción: 'dynamic-ambience'
  };
  
  return ambientesPorTono[tono as keyof typeof ambientesPorTono] || 
         ambientesPorMomento[momento as keyof typeof ambientesPorMomento] || 
         'neutral-ambience';
}

function configurarLipSyncCinematico(
  esEmocional: boolean, 
  momento: string, 
  segundo: number, 
  duracionTotal: number,
  actorInfo?: any
): { lipSync: string; requiereVoz: boolean; tipoVoz?: string } {
  
  // Solo lip-sync en momentos emocionales clave y específicos
  if (!esEmocional) {
    return { lipSync: '', requiereVoz: false };
  }
  
  // Máximo 3-4 diálogos por video en momentos estratégicos
  const momentosDialogo = [
    Math.floor(duracionTotal * 0.20), // 20% - Establecimiento
    Math.floor(duracionTotal * 0.60), // 60% - Conflicto
    Math.floor(duracionTotal * 0.85)  // 85% - Resolución
  ];
  
  if (!momentosDialogo.includes(segundo)) {
    return { lipSync: '', requiereVoz: false };
  }
  
  const dialogosPorMomento = {
    setup: [
      "This changes everything",
      "Something's not right",
      "Are you ready?",
      "It's time"
    ],
    desarrollo: [
      "You don't understand",
      "This is important",
      "We have to try",
      "Trust me"
    ],
    climax: [
      "This ends now",
      "I won't give up",
      "Fight back",
      "It's our only chance"
    ],
    cierre: [
      "It's finally over",
      "We did it",
      "Thank you",
      "Everything's changed"
    ]
  };
  
  const dialogos = dialogosPorMomento[momento as keyof typeof dialogosPorMomento] || ["Yes"];
  const dialogoSeleccionado = dialogos[segundo % dialogos.length];
  
  return {
    lipSync: dialogoSeleccionado,
    requiereVoz: true,
    tipoVoz: actorInfo?.tipoVoz || 'professional'
  };
}

function determinarIntensidadSonora(momento: string, esEmocional: boolean): 'baja' | 'media' | 'alta' {
  if (esEmocional) {
    return momento === 'climax' ? 'alta' : 'media';
  }
  
  const intensidadesPorMomento: Record<string, 'baja' | 'media' | 'alta'> = {
    setup: 'baja',
    desarrollo: 'media',
    climax: 'alta',
    cierre: 'baja'
  };
  
  return intensidadesPorMomento[momento] || 'media';
}

export function aplicarConfiguracionAudioCinematica(timeline: any[]): any[] {
  return timeline.map((segundo, index) => ({
    ...segundo,
    audioMixing: 'professional',
    dynamicRange: 'cinematic',
    spatialAudio: index % 5 === 0 ? 'enabled' : 'standard'
  }));
}
