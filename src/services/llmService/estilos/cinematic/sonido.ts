// estilos/cinematic/sonido.ts - Cerebro Director de Sonido Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { getEstiloLimitaciones } from '../../restricciones.js';

export interface ConfiguracionSonido {
  musica: string;
  efectos: string[];
  ambiente: string;
  lipSync: string;
  requiereVoz: boolean;
  tipoVoz?: string;
  intensidad: 'baja' | 'media' | 'alta';
  justificacion?: string;
  estilo_musical?: string;
  emociones_clave?: string[];
}

/**
 * Usa IA para configurar el diseño sonoro cinematográfico
 */
export async function configurarSonidoConIA(
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string
): Promise<ConfiguracionSonido> {
  console.log(`[Sonido Cinematic] 🎵 Configurando sonido con IA para ${momentoNarrativo}...`);
  
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de Sonido
    const especializacionSonido = `
Ahora actúas como el DIRECTOR DE SONIDO del equipo CinemaAI.

Tu responsabilidad es diseñar la banda sonora y efectos de audio para cada escena:
- Seleccionar estilo musical apropiado
- Elegir efectos sonoros que complementen la narrativa
- Definir ambiente sonoro
- Configurar intensidad emocional del audio
- Asegurar coherencia con el tono cinematográfico

OPCIONES DISPONIBLES:

MÚSICA: orchestral, cinematic, electronic, ambient, dramatic, epic, emotional, mysterious, action, romantic, suspense
EFECTOS: wind, rain, thunder, footsteps, doors, nature, urban, mechanical, magical, tension, impact
AMBIENTE: quiet, bustling, tense, peaceful, mysterious, dramatic, action-packed, romantic, ethereal
INTENSIDAD: baja, media, alta

RESPONDE ÚNICAMENTE con este JSON:
{
  "musica": "uno_de_los_estilos_musicales",
  "efectos": ["efecto1", "efecto2", "efecto3"],
  "ambiente": "uno_de_los_ambientes",
  "intensidad": "baja|media|alta",
  "requiereVoz": true/false,
  "tipoVoz": "narrador|personaje|voz_en_off|ninguna",
  "justificacion": "por qué esta configuración sonora es perfecta",
  "estilo_musical": "descripción del estilo musical específico",
  "emociones_clave": ["emocion1", "emocion2"]
}`;

    const contextoUsuario = `
NARRATIVA: ${narrativa.historia}
TONO: ${narrativa.tono}
GÉNERO: ${narrativa.genero}
MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
PROMPT ORIGINAL: "${prompt}"

Diseña el audio cinematográfico para esta escena.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionSonido, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', 
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const config = extractFirstJsonBlock(response as string, { returnParsed: true }) as ConfiguracionSonido;
    
    if (config && typeof config === 'object' && 'musica' in config) {
      // Asegurar campos requeridos
      config.lipSync = 'auto'; // Por defecto
      
      console.log('[Sonido Cinematic] ✅ Configuración sonora IA exitosa');
      console.log(`- Música: ${config.musica}`);
      console.log(`- Ambiente: ${config.ambiente}`);
      console.log(`- Intensidad: ${config.intensidad}`);
      return config;
    }
  } catch (error) {
    console.error('[Sonido Cinematic] ❌ Error en configuración IA:', error);
  }
  
  // Fallback a lógica tradicional
  console.log('[Sonido Cinematic] 🔄 Usando configuración sonora fallback...');
  return configurarSonidoCinematico(momentoNarrativo, segundoActual, false, narrativa.tono || 'dramático', 30);
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
