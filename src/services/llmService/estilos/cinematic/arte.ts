// estilos/cinematic/arte.ts - Cerebro Director de Arte Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { AssetIndexItem, filtrarFondos, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';
import { getEstiloLimitaciones } from '../../restricciones.js';

export interface SeleccionFondo {
  ruta: string;
  nombre: string;
  justificacion: string;
  ambiente: string;
  epoca: string;
  estilo_visual: string;
  paleta_colores: string;
}

export interface DecisionArte {
  fondo_seleccionado: string;
  justificacion: string;
  ambiente: string;
  epoca: string;
  estilo_visual: string;
  paleta_colores: string;
  iluminacion: string;
}

/**
 * Usa IA para tomar decisiones artísticas inteligentes sobre fondos y estilo visual
 */
export async function decidirArteConIA(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string
): Promise<DecisionArte> {
  console.log(`[Arte Cinematic] 🎨 Analizando arte con IA para ${momentoNarrativo}...`);
  
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de Arte
    const especializacionArte = `
Ahora actúas como el DIRECTOR DE ARTE del equipo CinemaAI.

Tu responsabilidad es seleccionar fondos y definir el estilo visual de cada escena, basándote en:
- La narrativa cinematográfica establecida por el Director
- Los fondos disponibles en el catálogo
- El momento narrativo específico (setup/desarrollo/climax/cierre)
- La coherencia visual general de la producción

FONDOS DISPONIBLES:
${fondosDisponibles.map(f => `- ${f.nombre}: ${f.ambiente || 'ambiente neutro'}`).join('\n')}

RESPONDE ÚNICAMENTE con este JSON:
{
  "fondo_seleccionado": "nombre_exacto_del_fondo_seleccionado",
  "justificacion": "por qué este fondo es perfecto para este momento",
  "ambiente": "descripción del ambiente (ej: misterioso, alegre, tenso)",
  "epoca": "época temporal (moderno, clásico, futurista, etc)",
  "estilo_visual": "estilo cinematográfico (realista, dramático, épico, etc)",
  "paleta_colores": "paleta dominante (cálida, fría, contrastada, etc)",
  "iluminacion": "tipo de iluminación (natural, dramática, suave, contrastada)"
}`;

    const contextoUsuario = `
NARRATIVA: ${narrativa.historia}
TONO: ${narrativa.tono}
GÉNERO: ${narrativa.genero}
MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
PROMPT ORIGINAL: "${prompt}"

Selecciona el fondo más apropiado y define el estilo visual para esta escena.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionArte, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', 
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const decision = extractFirstJsonBlock(response as string, { returnParsed: true }) as DecisionArte;
    
    if (decision && typeof decision === 'object' && 'fondo_seleccionado' in decision) {
      // Verificar que el fondo seleccionado existe
      const fondoExiste = fondosDisponibles.find(f => f.nombre === decision.fondo_seleccionado);
      
      if (fondoExiste) {
        console.log('[Arte Cinematic] ✅ Decisión artística IA exitosa');
        console.log(`- Fondo: ${decision.fondo_seleccionado}`);
        console.log(`- Ambiente: ${decision.ambiente}`);
        return decision;
      }
    }
  } catch (error) {
    console.error('[Arte Cinematic] ❌ Error en decisión IA:', error);
  }
  
  // Fallback inteligente
  console.log('[Arte Cinematic] 🔄 Usando fallback inteligente...');
  const fondoFallback = seleccionarFondoPorMomento(fondosDisponibles, momentoNarrativo, segundoActual) || 
                       seleccionarAssetPorIndice(fondosDisponibles, segundoActual);

  if (!fondoFallback) {
    return {
      fondo_seleccionado: 'fondo_fallback',
      justificacion: `No se encontró fondo adecuado, usando fallback por defecto para ${momentoNarrativo}`,
      ambiente: 'neutral',
      epoca: 'moderno',
      estilo_visual: 'cinematográfico',
      paleta_colores: 'equilibrada',
      iluminacion: 'natural'
    };
  }

  return {
    fondo_seleccionado: fondoFallback.nombre,
    justificacion: `Fondo fallback apropiado para ${momentoNarrativo}`,
    ambiente: fondoFallback.ambiente || 'neutral',
    epoca: extraerEpoca(fondoFallback.nombre),
    estilo_visual: 'cinematográfico',
    paleta_colores: 'equilibrada',
    iluminacion: 'natural'
  };
}

export async function seleccionarFondoCinematico(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt?: string
): Promise<SeleccionFondo> {
  console.log(`[Arte Cinematic] Seleccionando fondo para ${momentoNarrativo} - segundo ${segundoActual}`);
  
  if (fondosDisponibles.length === 0) {
    console.warn('[Arte Cinematic] No hay fondos disponibles, usando fallback');
    return {
      ruta: '',
      nombre: 'fondo_default',
      justificacion: 'Fallback por falta de assets',
      ambiente: 'neutral',
      epoca: 'moderno',
      estilo_visual: 'neutro',
      paleta_colores: 'equilibrada'
    };
  }

  // Usar IA si tenemos prompt, sino lógica tradicional
  if (prompt) {
    const decisionIA = await decidirArteConIA(fondosDisponibles, narrativa, momentoNarrativo, segundoActual, prompt);
    const fondoSeleccionado = fondosDisponibles.find(f => f.nombre === decisionIA.fondo_seleccionado);
    
    if (fondoSeleccionado) {
      return {
        ruta: fondoSeleccionado.ruta,
        nombre: fondoSeleccionado.nombre,
        justificacion: decisionIA.justificacion,
        ambiente: decisionIA.ambiente,
        epoca: decisionIA.epoca,
        estilo_visual: decisionIA.estilo_visual,
        paleta_colores: decisionIA.paleta_colores
      };
    }
  }

  // Lógica tradicional como fallback
  const fondoSeleccionado = seleccionarFondoPorMomento(fondosDisponibles, momentoNarrativo, segundoActual);
  
  if (fondoSeleccionado) {
    return {
      ruta: fondoSeleccionado.ruta,
      nombre: fondoSeleccionado.nombre,
      justificacion: `Fondo seleccionado para ${momentoNarrativo}: ${fondoSeleccionado.ambiente || 'ambiente neutro'}`,
      ambiente: fondoSeleccionado.ambiente || 'neutral',
      epoca: extraerEpoca(fondoSeleccionado.nombre),
      estilo_visual: 'cinematográfico',
      paleta_colores: 'equilibrada'
    };
  }

  // Fallback con rotación
  const fondoFallback = seleccionarAssetPorIndice(fondosDisponibles, segundoActual);
  return {
    ruta: fondoFallback?.ruta || '',
    nombre: fondoFallback?.nombre || 'fondo_fallback',
    justificacion: 'Selección por rotación sistemática',
    ambiente: fondoFallback?.ambiente || 'neutral',
    epoca: 'moderno',
    estilo_visual: 'neutral',
    paleta_colores: 'equilibrada'
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
