// estilos/noticias/orquestador.ts - Orquestador para Estilo Noticias/Presentación

import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanNoticias {
  timeline: SegundoNoticias[];
  metadata: MetadataNoticias;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalNoticias;
  tomasReales?: TomaNoticiasPlan[];
}

export interface SegundoNoticias {
  segundo: number;
  narrativa: any;
  fondo: any;
  actor: any;
  camara: any;
  sonido: any;
  edicion: any;
  segmento: string;
  momentoNarrativo: string;
  textoDirecto: string;
  tipoToma: 'primer_plano' | 'plano_medio' | 'busto';
}

export interface TomaNoticiasPlan {
  id: string;
  inicio: number;
  duracion: number;
  texto: string;
  textoDirecto: string;
  actorPrincipal: string;
  tipoToma: 'primer_plano' | 'plano_medio' | 'busto';
  fondoEstudio: string;
  transicion: string;
  intensidadPresentacion: 'informativa' | 'persuasiva' | 'urgente';
}

export interface MetadataNoticias {
  duracionTotal: number;
  numeroTomas: number;
  estiloVisual: 'noticias';
  temaPresentacion: string;
  tipoPresentacion: 'noticias' | 'corporativo' | 'educativo' | 'testimonial';
}

export interface ConfiguracionGlobalNoticias {
  priorizarLipSync: boolean;
  duracionPromedioPorToma: number;
  usarPrimerPlano: boolean;
  requireFondoEstudio: boolean;
  calividadAudio: 'premium' | 'profesional';
  tipoIluminacion: 'estudio' | 'profesional' | 'corporativa';
}

/**
 * Orquestador principal para el estilo Noticias/Presentación
 */
export async function orquestarEquipoNoticias(
  prompt: string,
  duracionSegundos: number,
  estiloVisual: string = 'noticias'
): Promise<VideoPlanNoticias> {
  console.log('[Orquestador Noticias] 📺 Iniciando producción de noticias');

  const assetManager = new AssetManager();

  // 1. CONFIGURACIÓN ESPECÍFICA PARA NOTICIAS
  const configuracionGlobal: ConfiguracionGlobalNoticias = {
    priorizarLipSync: true,             // LIP SYNC es CRÍTICO
    duracionPromedioPorToma: 6,         // Tomas más cortas para mantener atención
    usarPrimerPlano: true,              // Siempre primer plano
    requireFondoEstudio: true,          // Fondo de estudio profesional
    calividadAudio: 'premium',          // Audio de máxima calidad
    tipoIluminacion: 'estudio'          // Iluminación de estudio
  };

  // 2. GENERAR ESTRUCTURA DE PRESENTACIÓN
  console.log('[Director Noticias] 🎬 Generando estructura de presentación');
  const estructuraPresentacion = await generarEstructuraPresentacion(prompt, duracionSegundos);

  // 3. SEGMENTAR POR PUNTOS DE PRESENTACIÓN
  const segmentos = segmentarPorPuntosPresentacion(estructuraPresentacion, duracionSegundos);

  // 4. CONFIGURAR CADA SEGUNDO DEL TIMELINE
  const timeline: SegundoNoticias[] = [];
  
  for (let segundo = 0; segundo < duracionSegundos; segundo++) {
    const segmentoActual = encontrarSegmento(segundo, segmentos);
    
    timeline.push({
      segundo,
      narrativa: {
        texto: segmentoActual.textoDirecto,
        intensidad: segmentoActual.intensidadPresentacion,
        ritmo: calcularRitmoPresentacion(segundo, duracionSegundos)
      },
      fondo: await seleccionarFondoEstudio(segmentoActual, assetManager),
      actor: configurarActorPresentador(segmentoActual, segundo),
      camara: configurarCamaraNoticias(segmentoActual.tipoToma, segundo),
      sonido: configurarSonidoNoticias(segmentoActual, configuracionGlobal),
      edicion: configurarEdicionNoticias(segundo, segmentoActual),
      segmento: segmentoActual.id,
      momentoNarrativo: segmentoActual.texto,
      textoDirecto: segmentoActual.textoDirecto,
      tipoToma: segmentoActual.tipoToma
    });
  }

  // 5. METADATA NOTICIAS
  const metadata: MetadataNoticias = {
    duracionTotal: duracionSegundos,
    numeroTomas: segmentos.length,
    estiloVisual: 'noticias',
    temaPresentacion: extraerTema(prompt),
    tipoPresentacion: determinarTipoPresentacion(prompt)
  };

  // 6. RESTRICCIONES ESPECÍFICAS NOTICIAS
  const restricciones = {
    ...RESTRICCIONES_GENERALES,
    // Restricciones específicas para noticias
    maxDuracionToma: 8,
    minDuracionToma: 4,
    requiereActorPrincipal: true,
    requiereLipSync: true,
    requiereFondoEstudio: true,
    priorizarCalidadAudio: true
  };

  console.log('[Orquestador Noticias] ✅ Plan de noticias completado');

  return {
    timeline,
    metadata,
    restricciones,
    configuracionGlobal,
    tomasReales: segmentos.map(convertirATomaReal)
  };
}

// ===== FUNCIONES AUXILIARES NOTICIAS =====

async function generarEstructuraPresentacion(prompt: string, duracion: number) {
  // Generar estructura específica para presentación directa
  return {
    apertura: extraerApertura(prompt),
    puntosPrincipales: extraerPuntosPrincipales(prompt, duracion),
    cierre: extraerCierre(prompt),
    llamadaAccion: extraerLlamadaAccion(prompt)
  };
}

function segmentarPorPuntosPresentacion(estructura: any, duracion: number): TomaNoticiasPlan[] {
  const segmentos: TomaNoticiasPlan[] = [];
  const numSegmentos = Math.max(3, Math.floor(duracion / 6)); // Tomas de ~6 segundos
  
  for (let i = 0; i < numSegmentos; i++) {
    const inicio = Math.floor((duracion / numSegmentos) * i);
    const duracionSegmento = Math.floor(duracion / numSegmentos);
    
    segmentos.push({
      id: `noticias_${i}`,
      inicio,
      duracion: duracionSegmento,
      texto: estructura.puntosPrincipales[i] || estructura.apertura,
      textoDirecto: generarTextoDirecto(estructura, i),
      actorPrincipal: 'presentador_profesional',
      tipoToma: determinarTipoTomaNoticias(i, numSegmentos),
      fondoEstudio: 'estudio_noticias_profesional',
      transicion: i > 0 ? 'corte_directo' : 'none',
      intensidadPresentacion: determinarIntensidadPresentacion(i, numSegmentos)
    });
  }
  
  return segmentos;
}

async function seleccionarFondoEstudio(segmento: TomaNoticiasPlan, assetManager: AssetManager) {
  // Seleccionar fondos de estudio profesional
  return {
    tipo: 'estudio_noticias',
    calidad: 'premium',
    estilo: 'profesional_corporativo',
    iluminacion: 'frontal_suave',
    colores: 'neutros_profesionales'
  };
}

function configurarActorPresentador(segmento: TomaNoticiasPlan, segundo: number) {
  return {
    tipo: 'presentador',
    posicion: 'central',
    vestimenta: 'formal_profesional',
    expresion: 'seria_confiable',
    gestos: 'moderados_profesionales',
    contactoVisual: 'directo_camara'
  };
}

function configurarCamaraNoticias(tipoToma: string, segundo: number) {
  return {
    tipo: tipoToma,
    movimiento: 'estatica', // Cámara fija para noticias
    enfoque: 'primer_plano',
    angulo: 'frontal_directo',
    zoom: 'busto_perfecto',
    estabilizacion: 'profesional'
  };
}

function configurarSonidoNoticias(segmento: TomaNoticiasPlan, config: ConfiguracionGlobalNoticias) {
  return {
    vozDirecta: {
      texto: segmento.textoDirecto,
      velocidad: 'profesional',
      tono: 'autoritativo',
      volumen: 0.9,
      calidad: config.calividadAudio
    },
    musicaFondo: {
      estilo: 'corporativo_suave',
      volumen: 0.15, // Muy baja para no interferir
      tipo: 'instrumental_profesional'
    },
    efectos: {
      reduccionRuido: true,
      ecualizacion: 'voz_profesional',
      compresion: true
    }
  };
}

function configurarEdicionNoticias(segundo: number, segmento: TomaNoticiasPlan) {
  return {
    transicion: segmento.transicion,
    filtros: ['nitidez_profesional', 'color_corporativo'],
    efectosVisuales: ['lower_third'],
    ritmo: 'dinamico_profesional'
  };
}

// Helper functions
function encontrarSegmento(segundo: number, segmentos: TomaNoticiasPlan[]): TomaNoticiasPlan {
  return segmentos.find(s => segundo >= s.inicio && segundo < s.inicio + s.duracion) || segmentos[0];
}

function calcularRitmoPresentacion(segundo: number, duracionTotal: number): 'lento' | 'normal' | 'rapido' {
  return 'normal'; // Ritmo constante profesional para noticias
}

function extraerTema(prompt: string): string {
  return prompt.split(' ').slice(0, 4).join(' '); // Primeras 4 palabras como tema
}

function determinarTipoPresentacion(prompt: string): 'noticias' | 'corporativo' | 'educativo' | 'testimonial' {
  const texto = prompt.toLowerCase();
  if (texto.includes('empresa') || texto.includes('product')) return 'corporativo';
  if (texto.includes('aprend') || texto.includes('educat')) return 'educativo';
  if (texto.includes('testimon') || texto.includes('experienc')) return 'testimonial';
  return 'noticias';
}

function extraerApertura(prompt: string): string {
  return `Apertura: ${prompt.substring(0, 80)}`;
}

function extraerPuntosPrincipales(prompt: string, duracion: number): string[] {
  const numPuntos = Math.floor(duracion / 10);
  return Array(numPuntos).fill(null).map((_, i) => 
    `Punto ${i + 1}: ${prompt.substring(i * 40, (i + 1) * 40)}`
  );
}

function extraerCierre(prompt: string): string {
  return `Cierre profesional basado en: ${prompt.substring(-80)}`;
}

function extraerLlamadaAccion(prompt: string): string {
  return `Llamada a la acción derivada de: ${prompt}`;
}

function generarTextoDirecto(estructura: any, index: number): string {
  return estructura.puntosPrincipales[index] || estructura.apertura;
}

function determinarTipoTomaNoticias(index: number, total: number): 'primer_plano' | 'plano_medio' | 'busto' {
  // Para noticias, principalmente primer plano y busto
  return index === 0 ? 'primer_plano' : 'busto';
}

function determinarIntensidadPresentacion(index: number, total: number): 'informativa' | 'persuasiva' | 'urgente' {
  const progreso = index / total;
  if (progreso < 0.4) return 'informativa';
  if (progreso < 0.8) return 'persuasiva';
  return 'informativa'; // Volver a informativa al final
}

function convertirATomaReal(segmento: TomaNoticiasPlan): TomaNoticiasPlan {
  return segmento; // Ya está en formato correcto
}

export default orquestarEquipoNoticias;
