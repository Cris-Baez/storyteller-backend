// estilos/cartoon/fotografia.ts - Cerebro Fotografía Cartoon
export function configurarCamaraCartoon(momentoNarrativo: any, contexto: any, esEmocional: boolean, tono: string): any {
  const movimientosCartoon = {
    setup: ['bouncy_zoom', 'gentle_pan', 'friendly_tilt'],
    desarrollo: ['smooth_pan', 'bouncy_zoom', 'playful_movement'],
    climax: ['exciting_zoom', 'dynamic_pan', 'fun_tilt'],
    cierre: ['gentle_zoom_out', 'smooth_pan', 'peaceful_movement']
  };
  const movimiento = movimientosCartoon[momentoNarrativo as keyof typeof movimientosCartoon] ? movimientosCartoon[momentoNarrativo as keyof typeof movimientosCartoon][Math.floor(Math.random() * movimientosCartoon[momentoNarrativo as keyof typeof movimientosCartoon].length)] : 'smooth_pan';
  return {
    shot: esEmocional ? 'close_up' : 'medium',
    movement: movimiento,
    angle: 'friendly',
    duration: 8,
    transition: 'smooth_cut',
    focus: 'character_friendly',
    style: 'cartoon_smooth',
    intensity: 'medium',
    speed: 'medium'
  };
}
