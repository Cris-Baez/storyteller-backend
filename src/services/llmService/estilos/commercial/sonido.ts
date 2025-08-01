// estilos/commercial/sonido.ts - Cerebro Sonido Commercial
export function configurarSonidoCommercial(momentoNarrativo: any, segundo: number, esEmocional: boolean, tono: string, duracionTotal: number, actor: any, tomaInfo?: any): any {
  const musicaCommercial = {
    setup: ['corporate_theme', 'brand_intro', 'professional_start'],
    desarrollo: ['professional_bg', 'product_demo_music', 'commercial_flow'],
    climax: ['brand_music', 'impact_theme', 'value_music'],
    cierre: ['corporate_theme', 'call_to_action_music', 'brand_close']
  };
  const efectosCommercial = {
    setup: ['professional_ambient', 'brand_sounds', 'corporate_atmosphere'],
    desarrollo: ['product_sounds', 'demo_sfx', 'professional_movement'],
    climax: ['impact_sounds', 'value_emphasis', 'brand_impact'],
    cierre: ['corporate_sfx', 'closing_sounds', 'call_to_action_sfx']
  };
  const musica = musicaCommercial[momentoNarrativo as keyof typeof musicaCommercial] ? musicaCommercial[momentoNarrativo as keyof typeof musicaCommercial][0] : 'corporate_theme';
  const efectos = efectosCommercial[momentoNarrativo as keyof typeof efectosCommercial] ? efectosCommercial[momentoNarrativo as keyof typeof efectosCommercial][0] : 'professional_ambient';
  const vozCommercial = esEmocional ? 'profesional_comercial' : 'confiable_marca';
  return {
    musica: musica,
    efectos: [efectos],
    volumen_musica: 0.6,
    volumen_efectos: 0.5,
    ambiente: tono,
    lipSync: false,
    voz: vozCommercial,
    emotion_intensity: 'professional',
    commercial_style: true,
    brand_focused: true,
    tempo: 'medium'
  };
}
