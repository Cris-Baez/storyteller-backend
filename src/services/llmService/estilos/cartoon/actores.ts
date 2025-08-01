// estilos/cartoon/actores.ts - Cerebro Actores Cartoon
export async function seleccionarActorCartoon(actoresDisponibles: any[], narrativa: any, esEmocional: boolean, contexto: any, requiereLipSync: boolean): Promise<any> {
  const actorSeleccionado = actoresDisponibles.length > 0 ? actoresDisponibles[Math.floor(Math.random() * actoresDisponibles.length)] : null;
  return {
    archivo: actorSeleccionado?.ruta || 'actores/comic/casa/baño/día/jovenmasculinoneutrointelectual.png',
    nombre: actorSeleccionado?.nombre || 'cartoon_character',
    tipo: 'cartoon_character',
    emocion: esEmocional ? 'very_happy' : 'cheerful',
    expresion: esEmocional ? 'excited_cartoon' : 'friendly_cartoon',
    estilo: 'cartoon',
    requiereLipSync,
    justificacion: 'Personaje cartoon seleccionado para máxima simpatía y diversión',
    url: actorSeleccionado?.url || ''
  };
}
