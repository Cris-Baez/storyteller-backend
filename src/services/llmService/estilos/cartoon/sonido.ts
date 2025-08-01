// estilos/cartoon/sonido.ts - Cerebro Sonido Cartoon
export function configurarSonidoCartoon(momentoNarrativo: any, segundo: number, esEmocional: boolean, tono: string, duracionTotal: number, actor: any, tomaInfo?: any): any {
  const musicaCartoon = {
    setup: ['cartoon_theme', 'happy_intro', 'playful_start'],
    desarrollo: ['adventure_tune', 'fun_music', 'cartoon_journey'],
    climax: ['exciting_music', 'cartoon_climax', 'fun_peak'],
    cierre: ['happy_ending', 'cartoon_outro', 'satisfied_tune']
  };
  const efectosCartoon = {
    setup: ['cartoon_boings', 'playful_sounds', 'happy_ambient'],
    desarrollo: ['adventure_sfx', 'cartoon_movement', 'fun_effects'],
    climax: ['exciting_sfx', 'cartoon_action', 'climax_sounds'],
    cierre: ['happy_ambient', 'peaceful_cartoon', 'satisfied_sounds']
  };
  const musica = musicaCartoon[momentoNarrativo as keyof typeof musicaCartoon] ? musicaCartoon[momentoNarrativo as keyof typeof musicaCartoon][0] : 'cartoon_theme';
  const efectos = efectosCartoon[momentoNarrativo as keyof typeof efectosCartoon] ? efectosCartoon[momentoNarrativo as keyof typeof efectosCartoon][0] : 'cartoon_boings';
  const vozCartoon = esEmocional ? 'amigable_cartoon' : 'joven_alegre';
  return {
    musica: musica,
    efectos: [efectos],
    volumen_musica: 0.7,
    volumen_efectos: 0.6,
    ambiente: tono,
    lipSync: false,
    voz: vozCartoon,
    emotion_intensity: 'medium',
    cartoon_style: true,
    family_friendly: true,
    tempo: 'medium'
  };
}
