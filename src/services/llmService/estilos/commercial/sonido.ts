// estilos/commercial/sonido.ts - Cerebro Sonido Commercial con ElevenLabs FX

export interface ConfiguracionSonidoCommercial {
  musica: string;
  efectos: string[];
  ambiente: string;
  lipSync: string;
  requiereVoz: boolean;
  tipoVoz?: string;
  intensidad: 'baja' | 'media' | 'alta';
  // ✨ NUEVO: ElevenLabs FX para commercial
  elevenlabsFX?: {
    habilitado: boolean;
    efectos_especificos?: string[];
    prompt_personalizado?: string;
    intensidad_fx?: number;
  };
  // Compatibilidad
  volumen_musica?: number;
  volumen_efectos?: number;
  voz?: string;
  emotion_intensity?: string;
  commercial_style?: boolean;
  brand_focused?: boolean;
  tempo?: string;
}

export function configurarSonidoCommercial(
  momentoNarrativo: any, 
  segundo: number, 
  esEmocional: boolean, 
  tono: string, 
  duracionTotal: number, 
  actor: any, 
  tomaInfo?: any
): ConfiguracionSonidoCommercial {
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
  
  // ✨ NUEVO: ElevenLabs FX para commercial
  const elevenlabsFXConfig = {
    habilitado: true, // Commercial se beneficia de efectos profesionales
    efectos_especificos: [
      'professional ambient sounds',
      'subtle brand emphasizers', 
      'clean commercial transitions'
    ],
    prompt_personalizado: `professional commercial sound effects, ${momentoNarrativo} section, ${esEmocional ? 'impactful and emotional' : 'clean and trustworthy'} brand sounds`,
    intensidad_fx: 0.3 // Más sutil para comerciales
  };
  
  return {
    musica: musica,
    efectos: [efectos],
    ambiente: tono,
    lipSync: 'auto',
    requiereVoz: true,
    tipoVoz: vozCommercial,
    intensidad: 'media' as 'baja' | 'media' | 'alta',
    // ✨ NUEVO
    elevenlabsFX: elevenlabsFXConfig,
    // Compatibilidad
    volumen_musica: 0.6,
    volumen_efectos: 0.5,
    voz: vozCommercial,
    emotion_intensity: 'professional',
    commercial_style: true,
    brand_focused: true,
    tempo: 'medium'
  };
}
