// helpers/segmentador.ts - Divide duración en clips optimizados por estilo

export interface VideoSegmento {
  inicio: number;
  duracion: number;
  estilo: string;
  tipo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
}

export function segmentarPorEstilo(duracionTotal: number, estilo: string): VideoSegmento[] {
  const segmentos: VideoSegmento[] = [];
  let tiempoRestante = duracionTotal;
  let tiempoActual = 0;

  // Determinar duración preferida por estilo
  const duracionPreferida = getDuracionPreferida(estilo);
  
  // Calcular estructura narrativa
  const estructura = calcularEstructuraNarrativa(duracionTotal);
  
  while (tiempoRestante > 0) {
    const duracionSegmento = Math.min(duracionPreferida, tiempoRestante);
    const tipoSegmento = determinarTipoSegmento(tiempoActual, duracionTotal, estructura);
    
    segmentos.push({
      inicio: tiempoActual,
      duracion: duracionSegmento,
      estilo,
      tipo: tipoSegmento
    });
    
    tiempoActual += duracionSegmento;
    tiempoRestante -= duracionSegmento;
  }
  
  return segmentos;
}

function getDuracionPreferida(estilo: string): number {
  const preferencias: { [key: string]: number } = {
    cinematic: 10,
    anime: 5,
    cartoon: 5,
    commercial: 7,
    realistic: 8
  };
  return preferencias[estilo] || 8;
}

function calcularEstructuraNarrativa(duracionTotal: number) {
  return {
    setup: Math.floor(duracionTotal * 0.25),
    desarrollo: Math.floor(duracionTotal * 0.50),
    climax: Math.floor(duracionTotal * 0.15),
    cierre: Math.floor(duracionTotal * 0.10)
  };
}

function determinarTipoSegmento(
  tiempoActual: number, 
  duracionTotal: number, 
  estructura: any
): 'setup' | 'desarrollo' | 'climax' | 'cierre' {
  const progreso = tiempoActual / duracionTotal;
  
  if (progreso <= 0.25) return 'setup';
  if (progreso <= 0.75) return 'desarrollo';
  if (progreso <= 0.90) return 'climax';
  return 'cierre';
}
