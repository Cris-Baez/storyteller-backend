// estilos/commercial/fotografia.ts - Cerebro Fotografía Commercial
export function configurarCamaraCommercial(momentoNarrativo: any, contexto: any, esEmocional: boolean, tono: string): any {
  const movimientosCommercial = {
    setup: ['smooth_professional', 'brand_reveal', 'professional_zoom'],
    desarrollo: ['product_focus', 'professional_pan', 'smooth_tracking'],
    climax: ['brand_reveal', 'impact_zoom', 'professional_tilt'],
    cierre: ['smooth_professional', 'brand_close', 'confident_zoom']
  };
  const movimiento = movimientosCommercial[momentoNarrativo as keyof typeof movimientosCommercial] ? movimientosCommercial[momentoNarrativo as keyof typeof movimientosCommercial][0] : 'smooth_professional';
  return {
    shot: esEmocional ? 'close_up' : 'medium',
    movement: movimiento,
    angle: 'professional',
    duration: 6,
    transition: 'professional_cut',
    focus: 'brand_focused',
    style: 'commercial_smooth',
    intensity: 'professional',
    speed: 'medium'
  };
}
