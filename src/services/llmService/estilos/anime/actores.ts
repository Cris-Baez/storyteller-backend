// estilos/anime/actores.ts - Cerebro Selección de Actores Anime

export async function seleccionarActorAnime(
  actoresDisponibles: any[],
  narrativa: any,
  esEmocional: boolean,
  contexto: any,
  requiereLipSync: boolean
): Promise<any> {
  console.log('[Actores Anime] 🎭 Seleccionando actor anime...');
  
  try {
    // Selección inteligente para anime - personajes más expresivos
    const actorSeleccionado = actoresDisponibles.length > 0 
      ? actoresDisponibles[Math.floor(Math.random() * actoresDisponibles.length)]
      : null;
    
    return {
      archivo: actorSeleccionado?.ruta || actorSeleccionado?.url || 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png',
      nombre: actorSeleccionado?.nombre || 'anime_protagonist',
      tipo: 'anime_character',
      emocion: esEmocional ? 'exagerada' : 'energica',
      expresion: esEmocional ? 'dramatic_anime' : 'determined_anime',
      estilo: 'anime',
      requiereLipSync,
      justificacion: 'Personaje anime seleccionado para máxima expresividad emocional',
      url: actorSeleccionado?.url || ''
    };
    
  } catch (error) {
    console.error('[Actores Anime] ❌ Error seleccionando actor:', error);
    
    return {
      archivo: 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png',
      nombre: 'anime_default',
      tipo: 'anime_character',
      emocion: 'energica',
      expresion: 'standard_anime',
      estilo: 'anime',
      requiereLipSync,
      justificacion: 'Personaje anime por defecto',
      url: ''
    };
  }
}
