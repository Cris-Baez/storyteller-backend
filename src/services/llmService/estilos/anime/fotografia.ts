// estilos/anime/fotografia.ts - Cerebro Fotografía Anime

export function configurarCamaraAnime(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  contexto: any,
  esEmocional: boolean,
  tono: string
): any {
  console.log('[Fotografía Anime] 📸 Configurando cámara anime...');
  
  // Movimientos de cámara típicos del anime - más dinámicos
  const movimientosAnime = {
    setup: ['quick_zoom_in', 'dramatic_tilt', 'crash_zoom'],
    desarrollo: ['dynamic_pan', 'quick_zoom_in', 'spin_zoom'],
    climax: ['crash_zoom', 'dramatic_tilt', 'explosive_zoom'],
    cierre: ['slow_zoom_out', 'gentle_pan', 'peaceful_tilt']
  };
  
  const angulosAnime = {
    setup: ['low_angle', 'dutch_angle', 'dramatic'],
    desarrollo: ['medium_angle', 'dynamic', 'action'],
    climax: ['extreme_close', 'power_angle', 'heroic'],
    cierre: ['wide_angle', 'peaceful', 'serene']
  };
  
  const movimiento = movimientosAnime[momentoNarrativo][
    Math.floor(Math.random() * movimientosAnime[momentoNarrativo].length)
  ];
  
  const angulo = angulosAnime[momentoNarrativo][
    Math.floor(Math.random() * angulosAnime[momentoNarrativo].length)
  ];
  
  return {
    shot: esEmocional ? 'close_up' : 'medium',
    movement: movimiento,
    angle: angulo,
    duration: 5, // Típico para anime - clips rápidos
    transition: esEmocional ? 'dramatic_cut' : 'quick_cut',
    focus: 'character_focused',
    style: 'anime_dynamic',
    intensity: esEmocional ? 'high' : 'medium',
    speed: 'fast' // Anime típicamente más rápido
  };
}
