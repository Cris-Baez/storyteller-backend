// estilos/cinematic/actores.ts - Cerebro Selección de Actores Cinematográfico

import { AssetIndexItem, filtrarActores, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';
import { TomaCinematograficaPlan } from './director.js';

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
  tomaInfo: TomaCinematograficaPlan | number, // ✅ TomaCinematograficaPlan o número para retrocompatibilidad
  requiereLipSync: boolean = false
): Promise<SeleccionActor> {
  
  // ✅ Adaptar a sistema de tomas
  const esToma = typeof tomaInfo === 'object';
  const infoToma = esToma ? tomaInfo : { numero: Math.floor((tomaInfo as number) / 10) + 1, duracion: 10, tipoToma: 'desarrollo', descripcion: 'Toma automática' };
  const segundoActual = esToma ? (tomaInfo as TomaCinematograficaPlan).numero * 10 : (tomaInfo as number);
  
  console.log(`[Actores Cinematic] Seleccionando actor para ${esToma ? `toma ${infoToma.numero} (${infoToma.duracion}s)` : `segundo ${segundoActual}`}, emocional: ${momentoEmocional}, tipo: ${infoToma.tipoToma}`);
  
  // ✅ PRIORIDAD 1: Si el Director especificó un actor, usarlo directamente
  if (esToma && (tomaInfo as TomaCinematograficaPlan).actor) {
    const actorEspecificado = (tomaInfo as TomaCinematograficaPlan).actor;
    console.log(`[Actores Cinematic] 🎯 Director especificó actor: ${actorEspecificado}`);
    
    // Buscar el actor exacto especificado por el Director
    let actorDirector: AssetIndexItem | undefined;
    
    // Intentar encontrar por ruta completa primero
    actorDirector = actoresDisponibles.find(a => a.ruta === actorEspecificado);
    
    // Si no se encuentra por ruta, buscar por nombre
    if (!actorDirector && typeof actorEspecificado === 'string') {
      const nombreActor = actorEspecificado.includes('/') 
        ? actorEspecificado.split('/').pop()?.replace(/\.(png|jpg|jpeg)$/, '') 
        : actorEspecificado;
      
      if (nombreActor) {
        actorDirector = actoresDisponibles.find(a => a.nombre === nombreActor);
      }
    }
    
    if (actorDirector) {
      console.log(`[Actores Cinematic] ✅ Usando actor especificado por Director: ${actorDirector.ruta}`);
      const edad = extraerEdadActor(actorDirector.nombre);
      const tipoVoz = determinarTipoVoz(actorDirector.nombre);
      
      return {
        ruta: actorDirector.ruta,
        nombre: actorDirector.nombre,
        edad,
        expresion: momentoEmocional ? getExpresionEmocional(narrativa.tono) : 'neutral',
        tipoVoz,
        estiloVoz: requiereLipSync ? getEstiloVozCinematico(narrativa.tono, edad) : 'sin_voz'
      };
    } else {
      console.warn(`[Actores Cinematic] ⚠️ No se encontró el actor especificado por Director: ${actorEspecificado}`);
    }
  }
  if (actoresDisponibles.length === 0) {
    console.warn('[Actores Cinematic] No hay actores disponibles, usando actor real del CDN');
    return {
      ruta: 'actores/anime/apartamento/cocina/día/ancianomasculinofelizescolar.png', // ✅ ARREGLO: Actor real del índice
      nombre: 'ancianomasculinofelizescolar',
      edad: 'mayor',
      expresion: 'feliz',
      tipoVoz: 'masculina',
      estiloVoz: 'maduro'
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
