// estilos/cartoon/arte.ts - Cerebro Arte Cartoon
export async function seleccionarFondoCartoon(fondosDisponibles: any[], narrativa: any, momentoNarrativo: any, segundoActual: number, prompt: string, tomaInfo?: any): Promise<any> {
  const fondoSeleccionado = fondosDisponibles.length > 0 ? fondosDisponibles[Math.floor(Math.random() * fondosDisponibles.length)] : null;
  return {
    archivo: fondoSeleccionado?.ruta || 'escenas/comic/casa/baño/día/frontal.png',
    nombre: fondoSeleccionado?.nombre || 'cartoon_world',
    tipo: 'cartoon_background',
    categoria: 'cartoon',
    ambiente: 'colorful',
    estilo: 'cartoon_style',
    paleta: 'bright_colors',
    iluminacion: 'cheerful',
    justificacion: 'Fondo cartoon seleccionado para ambiente alegre y familiar',
    url: fondoSeleccionado?.url || ''
  };
}
