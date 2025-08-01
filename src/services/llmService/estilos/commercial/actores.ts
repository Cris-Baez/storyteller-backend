// estilos/commercial/actores.ts - Cerebro Actores Commercial
export async function seleccionarActorCommercial(actoresDisponibles: any[], narrativa: any, esEmocional: boolean, contexto: any, requiereLipSync: boolean): Promise<any> {
  const actorSeleccionado = actoresDisponibles.length > 0 ? actoresDisponibles[Math.floor(Math.random() * actoresDisponibles.length)] : null;
  return {
    archivo: actorSeleccionado?.ruta || 'actor_joven.png',
    nombre: actorSeleccionado?.nombre || 'commercial_talent',
    tipo: 'commercial_talent',
    emocion: esEmocional ? 'confident' : 'professional',
    expresion: esEmocional ? 'compelling_commercial' : 'trustworthy_commercial',
    estilo: 'commercial',
    requiereLipSync,
    justificacion: 'Talento comercial seleccionado para máxima credibilidad y confianza',
    url: actorSeleccionado?.url || ''
  };
}
