// estilos/narrativa/orquestador.ts - Orquestador para Estilo Narrativa/Documental

import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanNarrativa {
  timeline: SegundoNarrativa[];
  metadata: MetadataNarrativa;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalNarrativa;
  tomasReales?: TomaNarrativaPlan[];
}

export interface SegundoNarrativa {
  segundo: number;
  narrativa: any;
  fondo: any;
  actor: any;
  camara: any;
  sonido: any;
  edicion: any;
  segmento: string;
  momentoNarrativo: string;
  vozEnOff: string;
  tipoToma: 'panoramica' | 'detalle' | 'contexto';
}

export interface TomaNarrativaPlan {
  id: string;
  inicio: number;
  duracion: number;
  texto: string;
  vozEnOff: string;
  descripcionVisual: string;
  tipoToma: 'panoramica' | 'detalle' | 'contexto';
  transicion: string;
  intensidadNarrativa: 'baja' | 'media' | 'alta';
}

export interface MetadataNarrativa {
  duracionTotal: number;
  numeroTomas: number;
  estiloVisual: 'narrativa';
  tematicaPrincipal: string;
  tonoNarrativo: 'documental' | 'epico' | 'educativo' | 'historico';
}

export interface ConfiguracionGlobalNarrativa {
  priorizarVozEnOff: boolean;
  duracionPromedioPorToma: number;
  usarTransicionesSuaves: boolean;
  minimoTiempoEntreCortes: number;
  volumenMusicaFondo: number;
  calideNarracion: 'profesional' | 'casual' | 'academica';
}

/**
 * Orquestador principal para el estilo Narrativa/Documental
 */
export async function orquestarEquipoNarrativa(
  prompt: string,
  duracionSegundos: number,
  estiloVisual: string = 'narrativa'
): Promise<VideoPlanNarrativa> {
  console.log('[Orquestador Narrativa] 📚 Iniciando producción narrativa');

  const assetManager = new AssetManager();

  // 1. CONFIGURACIÓN ESPECÍFICA PARA NARRATIVA
  const configuracionGlobal: ConfiguracionGlobalNarrativa = {
    priorizarVozEnOff: true,           // VOZ EN OFF es lo más importante
    duracionPromedioPorToma: 8,        // Tomas más largas para narrativa
    usarTransicionesSuaves: true,      // Transiciones suaves tipo documental
    minimoTiempoEntreCortes: 6,        // Menos cortes abruptos
    volumenMusicaFondo: 0.3,           // Música de fondo más baja
    calideNarracion: 'profesional'     // Voz profesional de narrador
  };

  // 2. GENERAR NARRATIVA DOCUMENTAL
  console.log('[Director Narrativa] 🎬 Generando estructura narrativa');
  const narrativaDocumental = await generarNarrativaDocumental(prompt, duracionSegundos);

  // 3. SEGMENTAR POR MOMENTOS NARRATIVOS
  const segmentos = segmentarPorMomentosNarrativos(narrativaDocumental, duracionSegundos);

  // 4. CONFIGURAR CADA SEGUNDO DEL TIMELINE
  const timeline: SegundoNarrativa[] = [];
  
  for (let segundo = 0; segundo < duracionSegundos; segundo++) {
    const segmentoActual = encontrarSegmento(segundo, segmentos);
    
    timeline.push({
      segundo,
      narrativa: {
        texto: segmentoActual.vozEnOff,
        intensidad: segmentoActual.intensidadNarrativa,
        ritmo: calcularRitmoNarrativo(segundo, duracionSegundos)
      },
      fondo: await seleccionarFondoNarrativo(segmentoActual, assetManager),
      actor: null, // En narrativa no hay actores principales hablando
      camara: configurarCamaraNarrativa(segmentoActual.tipoToma, segundo),
      sonido: configurarSonidoNarrativo(segmentoActual, configuracionGlobal),
      edicion: configurarEdicionNarrativa(segundo, segmentoActual),
      segmento: segmentoActual.id,
      momentoNarrativo: segmentoActual.descripcionVisual,
      vozEnOff: segmentoActual.vozEnOff,
      tipoToma: segmentoActual.tipoToma
    });
  }

  // 5. METADATA NARRATIVA
  const metadata: MetadataNarrativa = {
    duracionTotal: duracionSegundos,
    numeroTomas: segmentos.length,
    estiloVisual: 'narrativa',
    tematicaPrincipal: extraerTematica(prompt),
    tonoNarrativo: determinarTonoNarrativo(prompt)
  };

  // 6. RESTRICCIONES ESPECÍFICAS NARRATIVA
  const restricciones = {
    ...RESTRICCIONES_GENERALES,
    // Restricciones específicas para narrativa
    maxDuracionToma: 12,
    minDuracionToma: 6,
    requiereVozEnOff: true,
    prohibirDialogos: false,
    priorizarImagenesContextuales: true
  };

  console.log('[Orquestador Narrativa] ✅ Plan narrativo completado');

  return {
    timeline,
    metadata,
    restricciones,
    configuracionGlobal,
    tomasReales: segmentos.map(convertirATomaReal)
  };
}

// ===== FUNCIONES AUXILIARES NARRATIVA =====

async function generarNarrativaDocumental(prompt: string, duracion: number) {
  // Generar estructura narrativa específica para documental/narrativa
  return {
    introduccion: extraerIntroduccion(prompt),
    desarrollo: extraerDesarrollo(prompt, duracion),
    conclusion: extraerConclusion(prompt),
    momentosClave: identificarMomentosClave(prompt)
  };
}

function segmentarPorMomentosNarrativos(narrativa: any, duracion: number): TomaNarrativaPlan[] {
  const segmentos: TomaNarrativaPlan[] = [];
  const numSegmentos = Math.max(3, Math.floor(duracion / 8)); // Tomas de ~8 segundos
  
  for (let i = 0; i < numSegmentos; i++) {
    const inicio = Math.floor((duracion / numSegmentos) * i);
    const duracionSegmento = Math.floor(duracion / numSegmentos);
    
    segmentos.push({
      id: `narrativa_${i}`,
      inicio,
      duracion: duracionSegmento,
      texto: narrativa.desarrollo[i] || narrativa.introduccion,
      vozEnOff: generarTextoVozEnOff(narrativa, i),
      descripcionVisual: generarDescripcionVisual(narrativa, i),
      tipoToma: determinarTipoToma(i, numSegmentos),
      transicion: i > 0 ? 'fade' : 'none',
      intensidadNarrativa: determinarIntensidad(i, numSegmentos)
    });
  }
  
  return segmentos;
}

async function seleccionarFondoNarrativo(segmento: TomaNarrativaPlan, assetManager: AssetManager) {
  // Seleccionar fondos apropiados para narrativa (paisajes, contextuales)
  return {
    tipo: 'paisaje_contexto',
    calidad: 'alta',
    estilo: 'documental',
    descripcion: 'Fondo panorámico para narrativa'
  };
}

function configurarCamaraNarrativa(tipoToma: string, segundo: number) {
  return {
    tipo: tipoToma,
    movimiento: segundo % 20 === 0 ? 'pan_lento' : 'estatica',
    enfoque: 'panoramico',
    angulo: 'neutral',
    zoom: 'medio'
  };
}

function configurarSonidoNarrativo(segmento: TomaNarrativaPlan, config: ConfiguracionGlobalNarrativa) {
  return {
    vozEnOff: {
      texto: segmento.vozEnOff,
      velocidad: 'normal',
      tono: 'profesional',
      volumen: 0.8
    },
    musicaFondo: {
      estilo: 'documental_ambiental',
      volumen: config.volumenMusicaFondo,
      tipo: 'instrumental'
    },
    efectos: {
      ambiente: true,
      transiciones: true,
      dramaticos: false
    }
  };
}

function configurarEdicionNarrativa(segundo: number, segmento: TomaNarrativaPlan) {
  return {
    transicion: segmento.transicion,
    filtros: ['suavizado', 'color_documental'],
    efectosVisuales: [],
    ritmo: 'pausado'
  };
}

// Helper functions
function encontrarSegmento(segundo: number, segmentos: TomaNarrativaPlan[]): TomaNarrativaPlan {
  return segmentos.find(s => segundo >= s.inicio && segundo < s.inicio + s.duracion) || segmentos[0];
}

function calcularRitmoNarrativo(segundo: number, duracionTotal: number): 'lento' | 'normal' | 'rapido' {
  const progreso = segundo / duracionTotal;
  if (progreso < 0.3) return 'normal'; // Inicio
  if (progreso < 0.7) return 'lento';  // Desarrollo pausado
  return 'normal'; // Final
}

function extraerTematica(prompt: string): string {
  return prompt.split(' ').slice(0, 3).join(' '); // Primeras 3 palabras como temática
}

function determinarTonoNarrativo(prompt: string): 'documental' | 'epico' | 'educativo' | 'historico' {
  const texto = prompt.toLowerCase();
  if (texto.includes('historia') || texto.includes('pasado')) return 'historico';
  if (texto.includes('aprend') || texto.includes('educat')) return 'educativo';
  if (texto.includes('epic') || texto.includes('grand')) return 'epico';
  return 'documental';
}

function extraerIntroduccion(prompt: string): string {
  return `Introducción narrativa: ${prompt.substring(0, 100)}`;
}

function extraerDesarrollo(prompt: string, duracion: number): string[] {
  const numPartes = Math.floor(duracion / 10);
  return Array(numPartes).fill(null).map((_, i) => 
    `Desarrollo parte ${i + 1}: ${prompt.substring(i * 50, (i + 1) * 50)}`
  );
}

function extraerConclusion(prompt: string): string {
  return `Conclusión narrativa basada en: ${prompt.substring(-100)}`;
}

function identificarMomentosClave(prompt: string): string[] {
  return ['momento_inicial', 'desarrollo_principal', 'climax_narrativo', 'conclusion'];
}

function generarTextoVozEnOff(narrativa: any, index: number): string {
  return narrativa.desarrollo[index] || narrativa.introduccion;
}

function generarDescripcionVisual(narrativa: any, index: number): string {
  return `Secuencia visual ${index + 1}: Imágenes que acompañan la narración`;
}

function determinarTipoToma(index: number, total: number): 'panoramica' | 'detalle' | 'contexto' {
  if (index === 0 || index === total - 1) return 'panoramica';
  return index % 2 === 0 ? 'contexto' : 'detalle';
}

function determinarIntensidad(index: number, total: number): 'baja' | 'media' | 'alta' {
  const progreso = index / total;
  if (progreso < 0.3) return 'baja';
  if (progreso < 0.7) return 'media';
  return 'alta';
}

function convertirATomaReal(segmento: TomaNarrativaPlan): TomaNarrativaPlan {
  return segmento; // Ya está en formato correcto
}

export default orquestarEquipoNarrativa;
