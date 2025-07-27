// estilos/cinematic/arte.ts - Cerebro Director de Arte Cinematográfico

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { AssetIndexItem, filtrarFondos, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';
import { getEstiloLimitaciones } from '../../restricciones.js';

export interface SeleccionFondo {
  ruta: string;
  nombre: string;
  justificacion: string;
  ambiente: string;
  epoca: string;
}

export async function seleccionarFondoCinematico(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number
): Promise<SeleccionFondo> {
  console.log(`[Arte Cinematic] Seleccionando fondo para ${momentoNarrativo} - segundo ${segundoActual}`);
  
  if (fondosDisponibles.length === 0) {
    console.warn('[Arte Cinematic] No hay fondos disponibles, usando fallback');
    return {
      ruta: '',
      nombre: 'fondo_default',
      justificacion: 'Fallback por falta de assets',
      ambiente: 'neutral',
      epoca: 'moderno'
    };
  }

  // Selección inteligente basada en momento narrativo
  const fondoSeleccionado = seleccionarFondoPorMomento(fondosDisponibles, momentoNarrativo, segundoActual);
  
  if (fondoSeleccionado) {
    return {
      ruta: fondoSeleccionado.ruta,
      nombre: fondoSeleccionado.nombre,
      justificacion: `Fondo seleccionado para ${momentoNarrativo}: ${fondoSeleccionado.ambiente || 'ambiente neutro'}`,
      ambiente: fondoSeleccionado.ambiente || 'neutral',
      epoca: extraerEpoca(fondoSeleccionado.nombre)
    };
  }

  // Fallback con rotación
  const fondoFallback = seleccionarAssetPorIndice(fondosDisponibles, segundoActual);
  return {
    ruta: fondoFallback?.ruta || '',
    nombre: fondoFallback?.nombre || 'fondo_fallback',
    justificacion: 'Selección por rotación sistemática',
    ambiente: fondoFallback?.ambiente || 'neutral',
    epoca: 'moderno'
  };
}

function seleccionarFondoPorMomento(
  fondos: AssetIndexItem[], 
  momento: string, 
  segundo: number
): AssetIndexItem | null {
  // Lógica de selección por momento narrativo
  const preferencias = {
    setup: ['exterior', 'abierto', 'claro', 'día'],
    desarrollo: ['interior', 'cerrado', 'neutro'],
    climax: ['dramático', 'intenso', 'oscuro', 'noche'],
    cierre: ['tranquilo', 'resolutivo', 'día', 'abierto']
  };

  const palabrasClave = preferencias[momento as keyof typeof preferencias] || [];
  
  // Buscar fondo que coincida con las palabras clave
  for (const palabraClave of palabrasClave) {
    const fondoCoincidente = fondos.find(f => 
      f.nombre.toLowerCase().includes(palabraClave) ||
      f.ambiente?.toLowerCase().includes(palabraClave) ||
      f.variante?.toLowerCase().includes(palabraClave)
    );
    if (fondoCoincidente) return fondoCoincidente;
  }
  
  return null;
}

function extraerEpoca(nombreFondo: string): string {
  const epocas = ['moderno', 'vintage', 'futurista', 'clásico', 'medieval'];
  for (const epoca of epocas) {
    if (nombreFondo.toLowerCase().includes(epoca)) return epoca;
  }
  return 'moderno';
}

export function aplicarEstilizacionCinematica(timeline: any[]): any[] {
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  return timeline.map((segundo, index) => ({
    ...segundo,
    colorGrading: 'teal-orange',
    aspectRatio: '2.35:1',
    cinematicStyle: 'hollywood',
    lighting: limitaciones.lighting
  }));
}
