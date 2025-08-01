// estilos/commercial/editor.ts - Cerebro Editor Commercial
export function configurarEdicionCommercial(segundo: number, duracionTotal: number, momentoNarrativo: any, esEmocional: boolean, tono: string, tomaInfo?: any): any {
  const transicionesCommercial = {
    setup: ['professional_cut', 'brand_transition', 'smooth_cut'],
    desarrollo: ['professional_cut', 'product_transition', 'demo_cut'],
    climax: ['impact_cut', 'brand_transition', 'value_cut'],
    cierre: ['professional_cut', 'brand_close', 'call_to_action_cut']
  };
  const transicion = transicionesCommercial[momentoNarrativo as keyof typeof transicionesCommercial] ? transicionesCommercial[momentoNarrativo as keyof typeof transicionesCommercial][0] : 'professional_cut';
  return {
    duracionEscena: 6,
    tipoCorte: transicion,
    carryover: segundo > 0,
    intensidad: 'profesional',
    filtros: ['commercial_filter', 'brand_colors', 'professional_look'],
    efectos_visuales: esEmocional ? ['brand_glow', 'professional_highlight'] : ['subtle_brand'],
    ritmo: 'medio',
    estilo: 'commercial_editing',
    brand_consistency: true,
    professional_polish: true,
    commercial_aesthetics: true
  };
}

export function aplicarEstructuraEdicion(timeline: any[], duracion: number): any[] {
  return timeline.map((segundo, index) => {
    const filtrosCommercial = ['commercial_filter', 'brand_colors', 'professional_look'];
    if (segundo.esEmocional) {
      filtrosCommercial.push('brand_glow', 'professional_highlight');
    }
    return {
      ...segundo,
      filtros: filtrosCommercial,
      commercial_style: true,
      brand_consistency: 1.2,
      professional_grade: 1.1,
      commercial_polish: true
    };
  });
}

export function optimizarFlujoCommercial(timeline: any[]): any[] {
  return timeline.map((segundo, index) => {
    const optimizado = {
      ...segundo,
      frame_rate: 30,
      commercial_smoothing: true,
      brand_optimization: true,
      professional_grade: true,
      commercial_polish: true
    };
    if (index > 0) {
      const anterior = timeline[index - 1];
      if (anterior.esEmocional !== segundo.esEmocional) {
        optimizado.transition_speed = 'professional';
        optimizado.brand_transition = true;
      }
    }
    return optimizado;
  });
}
