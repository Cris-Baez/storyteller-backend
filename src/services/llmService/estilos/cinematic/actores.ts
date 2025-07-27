// estilos/cinematic/actores.ts - Cerebro Selección de Actores Cinematográfico

import { AssetIndexItem, filtrarActores, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';

export interface SeleccionActor {
  ruta: string;
  nombre: string;
  edad: 'joven' | 'adulto' | 'mayor';
  expresion: string;
  tipoVoz: 'masculina' | 'femenina' | 'neutral';
  estiloVoz: string;
}

export async function seleccionarActorCinematico(
  actoresDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoEmocional: boolean,
  segundoActual: number,
  requiereLipSync: boolean = false
): Promise<SeleccionActor> {
  console.log(`[Actores Cinematic] Seleccionando actor para segundo ${segundoActual}, emocional: ${momentoEmocional}`);
  
  if (actoresDisponibles.length === 0) {
    console.warn('[Actores Cinematic] No hay actores disponibles, usando fallback');
    return {
      ruta: '',
      nombre: 'actor_default',
      edad: 'adulto',
      expresion: 'neutral',
      tipoVoz: 'neutral',
      estiloVoz: 'neutro'
    };
  }

  // Seleccionar actor basado en momento emocional y narrativa
  const actorSeleccionado = seleccionarActorPorEmocion(
    actoresDisponibles, 
    momentoEmocional, 
    narrativa.tono, 
    segundoActual
  );

  if (actorSeleccionado) {
    const edad = extraerEdadActor(actorSeleccionado.nombre);
    const tipoVoz = determinarTipoVoz(actorSeleccionado.nombre);
    
    return {
      ruta: actorSeleccionado.ruta,
      nombre: actorSeleccionado.nombre,
      edad,
      expresion: momentoEmocional ? getExpresionEmocional(narrativa.tono) : 'neutral',
      tipoVoz,
      estiloVoz: requiereLipSync ? getEstiloVozCinematico(narrativa.tono, edad) : 'sin_voz'
    };
  }

  // Fallback con rotación
  const actorFallback = seleccionarAssetPorIndice(actoresDisponibles, segundoActual);
  return {
    ruta: actorFallback?.ruta || '',
    nombre: actorFallback?.nombre || 'actor_fallback',
    edad: 'adulto',
    expresion: 'determinado',
    tipoVoz: 'neutral',
    estiloVoz: 'profesional'
  };
}

function seleccionarActorPorEmocion(
  actores: AssetIndexItem[],
  esEmocional: boolean,
  tono: string,
  segundo: number
): AssetIndexItem | null {
  if (!esEmocional) {
    // Para momentos no emocionales, rotación simple
    return seleccionarAssetPorIndice(actores, segundo);
  }

  // Para momentos emocionales, buscar actor apropiado según tono
  const preferenciasEmocionales = {
    dramático: ['serio', 'intenso', 'adulto'],
    épico: ['heroico', 'fuerte', 'decidido'],
    emocional: ['expresivo', 'sensible'],
    misterioso: ['enigmático', 'reservado'],
    acción: ['dinámico', 'atlético', 'joven']
  };

  const palabrasClave = preferenciasEmocionales[tono as keyof typeof preferenciasEmocionales] || ['neutral'];
  
  for (const palabraClave of palabrasClave) {
    const actorCoincidente = actores.find(a => 
      a.nombre.toLowerCase().includes(palabraClave) ||
      a.estilo?.toLowerCase().includes(palabraClave)
    );
    if (actorCoincidente) return actorCoincidente;
  }
  
  return null;
}

function extraerEdadActor(nombreActor: string): 'joven' | 'adulto' | 'mayor' {
  const nombre = nombreActor.toLowerCase();
  if (nombre.includes('joven') || nombre.includes('teen') || nombre.includes('young')) return 'joven';
  if (nombre.includes('mayor') || nombre.includes('old') || nombre.includes('senior')) return 'mayor';
  return 'adulto';
}

function determinarTipoVoz(nombreActor: string): 'masculina' | 'femenina' | 'neutral' {
  const nombre = nombreActor.toLowerCase();
  if (nombre.includes('mujer') || nombre.includes('female') || nombre.includes('ella')) return 'femenina';
  if (nombre.includes('hombre') || nombre.includes('male') || nombre.includes('él')) return 'masculina';
  return 'neutral';
}

function getExpresionEmocional(tono: string): string {
  const expresiones = {
    dramático: 'intenso',
    épico: 'determinado',
    emocional: 'vulnerable',
    misterioso: 'enigmático',
    acción: 'decidido'
  };
  return expresiones[tono as keyof typeof expresiones] || 'neutral';
}

function getEstiloVozCinematico(tono: string, edad: string): string {
  const estilos = {
    dramático: {
      joven: 'emotivo_joven',
      adulto: 'profesional_dramático',
      mayor: 'sabio_profundo'
    },
    épico: {
      joven: 'heroico_joven',
      adulto: 'comandante',
      mayor: 'mentor_épico'
    },
    emocional: {
      joven: 'sensible_joven',
      adulto: 'emotivo_adulto',
      mayor: 'reflexivo'
    }
  };
  
  const estilosPorTono = estilos[tono as keyof typeof estilos];
  if (estilosPorTono) {
    return estilosPorTono[edad as keyof typeof estilosPorTono] || 'profesional_neutro';
  }
  return 'profesional_neutro';
}
