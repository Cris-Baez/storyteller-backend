// estilos/cartoon/sonido.ts - Cerebro Sonido Cartoon con ElevenLabs FX

export interface ConfiguracionSonidoCartoon {
  musica: string;
  efectos: string[];
  ambiente: string;
  lipSync: string;
  requiereVoz: boolean;
  tipoVoz?: string;
  intensidad: 'baja' | 'media' | 'alta';
  // ✨ NUEVO: ElevenLabs FX para cartoon
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
  cartoon_style?: boolean;
  family_friendly?: boolean;
  tempo?: string;
}

export function configurarSonidoCartoon(
  momentoNarrativo: any, 
  segundo: number, 
  esEmocional: boolean, 
  tono: string, 
  duracionTotal: number, 
  actor: any, 
  tomaInfo?: any
): ConfiguracionSonidoCartoon {
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
  
  // ✨ NUEVO: ElevenLabs FX para cartoon
  const elevenlabsFXConfig = {
    habilitado: true, // Cartoon es perfecto para FX creativos
    efectos_especificos: [
      'cartoon boing sounds', 
      'playful whoosh effects', 
      'family-friendly ambient sounds'
    ],
    prompt_personalizado: `cartoon-style sound effects, playful and family-friendly, ${momentoNarrativo} scene with ${esEmocional ? 'emotional' : 'fun'} tone`,
    intensidad_fx: 0.5
  };
  
  return {
    musica: musica,
    efectos: [efectos],
    ambiente: tono,
    lipSync: 'auto',
    requiereVoz: true,
    tipoVoz: vozCartoon,
    intensidad: 'media' as 'baja' | 'media' | 'alta',
    // ✨ NUEVO
    elevenlabsFX: elevenlabsFXConfig,
    // Compatibilidad
    volumen_musica: 0.7,
    volumen_efectos: 0.6,
    voz: vozCartoon,
    emotion_intensity: 'medium',
    cartoon_style: true,
    family_friendly: true,
    tempo: 'medium'
  };
}
