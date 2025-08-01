// estilos/anime/sonido.ts - Cerebro Sonido Anime

export function configurarSonidoAnime(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundo: number,
  esEmocional: boolean,
  tono: string,
  duracionTotal: number,
  actor: any,
  tomaInfo?: any
): any {
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
  
  return {
    musica: musica,
    efectos: [efectos],
    volumen_musica: esEmocional ? 0.8 : 0.6,
    volumen_efectos: 0.7,
    ambiente: tono,
    lipSync: false, // Se manejará en post-producción
    voz: vozAnime,
    emotion_intensity: esEmocional ? 'high' : 'medium',
    anime_style: true,
    dramatic_pauses: esEmocional,
    tempo: 'fast' // Típico del anime
  };
}
