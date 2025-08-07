// estilos/anime/sonido.ts - Cerebro Sonido Anime con ElevenLabs FX

export interface ConfiguracionSonidoAnime {
  musica: string;
  efectos: string[];
  ambiente: string;
  lipSync: string;
  requiereVoz: boolean;
  tipoVoz?: string;
  intensidad: 'baja' | 'media' | 'alta';
  // ✨ NUEVO: ElevenLabs FX para anime
  elevenlabsFX?: {
    habilitado: boolean;
    efectos_especificos?: string[];
    prompt_personalizado?: string;
    intensidad_fx?: number;
  };
  // Compatibilidad con propiedades existentes
  volumen_musica?: number;
  volumen_efectos?: number;
  voz?: string;
  emotion_intensity?: string;
  anime_style?: boolean;
  dramatic_pauses?: boolean;
  tempo?: string;
}

export function configurarSonidoAnime(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundo: number,
  esEmocional: boolean,
  tono: string,
  duracionTotal: number,
  actor: any,
  tomaInfo?: any
): ConfiguracionSonidoAnime {
  console.log('[Sonido Anime] 🎵 Configurando sonido anime...');
  
  // Música típica del anime por momento
  const musicaAnime = {
    setup: ['jrock_opening', 'dramatic_intro', 'mystery_anime'],
    desarrollo: ['action_jpop', 'emotional_buildup', 'adventure_theme'],
    climax: ['orchestral_climax', 'power_theme', 'battle_music'],
    cierre: ['peaceful_outro', 'emotional_piano', 'gentle_ending']
  };
  
  // Efectos sonoros típicos del anime
  const efectosAnime = {
    setup: ['anime_gasp', 'wind_whoosh', 'dramatic_silence'],
    desarrollo: ['footsteps', 'environment', 'movement_sfx'],
    climax: ['power_surge', 'explosion', 'dramatic_impact'],
    cierre: ['gentle_wind', 'peaceful_ambience', 'soft_footsteps']
  };
  
  const musica = musicaAnime[momentoNarrativo][
    Math.floor(Math.random() * musicaAnime[momentoNarrativo].length)
  ];
  
  const efectos = efectosAnime[momentoNarrativo][
    Math.floor(Math.random() * efectosAnime[momentoNarrativo].length)
  ];
  
  // Voces para anime (más expresivas)
  const vozAnime = esEmocional ? 'dramatico_anime' : 'joven_energica';
  
  // ✨ NUEVO: Configurar ElevenLabs FX para anime
  const elevenlabsFXConfig = {
    habilitado: true, // Anime se beneficia mucho de FX dinámicos
    efectos_especificos: momentoNarrativo === 'climax' 
      ? ['power energy surge', 'dramatic whoosh', 'anime impact sound'] 
      : ['subtle anime ambience', 'soft movement sounds'],
    prompt_personalizado: `anime-style sound effects for ${momentoNarrativo} scene, ${esEmocional ? 'emotional and dramatic' : 'energetic and light'}`,
    intensidad_fx: esEmocional ? 0.6 : 0.4
  };
  
  return {
    musica: musica,
    efectos: [efectos],
    ambiente: tono,
    lipSync: 'auto', // Configuración como string
    requiereVoz: true,
    tipoVoz: vozAnime,
    intensidad: (esEmocional ? 'alta' : 'media') as 'baja' | 'media' | 'alta',
    // ✨ NUEVO: Incluir configuración ElevenLabs FX
    elevenlabsFX: elevenlabsFXConfig,
    // Propiedades específicas del anime (compatibilidad)
    volumen_musica: esEmocional ? 0.8 : 0.6,
    volumen_efectos: 0.7,
    voz: vozAnime,
    emotion_intensity: esEmocional ? 'high' : 'medium',
    anime_style: true,
    dramatic_pauses: esEmocional,
    tempo: 'fast' // Típico del anime
  };
}
