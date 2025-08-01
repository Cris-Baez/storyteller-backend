// estilos/anime/arte.ts - Cerebro Director de Arte Anime con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { AssetIndexItem, filtrarFondos, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';
import { getEstiloLimitaciones } from '../../restricciones.js';
import { TomaCinematograficaPlan } from './director.js';

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
  _fondoSeleccionadoCompleto?: AssetIndexItem;
}

/**
 * Usa IA para tomar decisiones artísticas inteligentes sobre fondos estilo anime
 */
export async function decidirArteConIA(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<DecisionArte> {
  console.log(`[Arte Anime] 🎨 Analizando arte anime con IA para ${momentoNarrativo}...`);
  
  if (tomaInfo) {
    console.log(`[Arte Anime] 🎬 Toma ${tomaInfo.numero}: ${tomaInfo.descripcion} (${tomaInfo.duracion}s)`);
  }
  try {
    const systemBase = await cargarSystemPromptBase();
    
    const especializacionArte = `
Ahora actúas como el CEREBRO DIRECTOR DE ARTE ANIME de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI usa fondos PRE-GENERADOS del CDN (no crea nuevos)
- Tu trabajo es SELECCIONAR el fondo perfecto del catálogo existente para ESTILO ANIME
- Kling Elements animará el fondo seleccionado con movimientos de cámara dinámicos
- Debes garantizar CONTINUIDAD VISUAL ANIME entre tomas
- La primera toma DEBE ser SÚPER visualmente impactante (estilo anime opening)

🎭 SELECCIÓN CONTEXTUAL ANIME POR GÉNERO:
- SHONEN/ACTION → escuelas, dojos, ciudades japonesas, paisajes épicos con energía
- SLICE OF LIFE → apartamentos japoneses, cafeterías, calles residenciales, parques
- ROMANCE/SHOUJO → jardines, sakura, atardeceres, espacios románticos japoneses
- MECHA/SCI-FI → ciudades futuristas, laboratorios, espacios tecnológicos
- FANTASY → paisajes mágicos, templos, naturaleza exuberante
- THRILLER → callejones urbanos, edificios modernos, espacios cerrados dramáticos

🎬 PRINCIPIOS ANIME ESPECÍFICOS:
✅ COLORES VIBRANTES Y SATURADOS - típicos del anime
✅ LUGARES ICÓNICOS JAPONESES cuando sea apropiado
✅ ILUMINACIÓN DRAMÁTICA con alto contraste
✅ ESPACIOS que permitan EMOCIONES EXAGERADAS
✅ Primera toma debe crear SHOCK VISUAL anime
✅ Progresión emocional MÁS INTENSA que el cine live-action

FONDOS DISPONIBLES EN EL CDN:
${fondosDisponibles.slice(0, 20).map(f => `- ${f.nombre}: ${f.lugar}/${f.variante} (${f.ambiente || 'neutro'})`).join('\n')}
${fondosDisponibles.length > 20 ? `... y ${fondosDisponibles.length - 20} fondos más` : ''}

⚠️ REGLAS TÉCNICAS ANIME:
- SIEMPRE prioriza locaciones que soporten EMOCIONES EXAGERADAS
- Para anime escolar: usa escuelas, aulas, patios
- Para anime urbano: usa ciudades japonesas modernas
- Para anime fantasy: usa paisajes naturales dramáticos
- PALETAS MÁS SATURADAS que el cine realista

RESPONDE ÚNICAMENTE con este JSON:
{
  "fondo_seleccionado": "nombre_exacto_del_fondo_seleccionado",
  "justificacion": "por qué este fondo es perfecto para este contexto anime específico",
  "ambiente": "ambiente anime (energético, dramático, romántico, épico, etc)",
  "epoca": "época temporal anime (moderno_japonés, fantasy, futurista, etc)",
  "estilo_visual": "estilo anime específico",
  "paleta_colores": "paleta vibrante apropiada para anime",
  "iluminacion": "iluminación dramática anime"
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
${tomaInfo ? `TOMA INFO: ${tomaInfo.descripcion} (${tomaInfo.emocion})` : ''}

INSTRUCCIONES ESPECÍFICAS ANIME:
- Analiza el prompt para entender el tipo de historia anime
- Selecciona fondo que soporte EMOCIONES EXAGERADAS
- Asegúrate de que el fondo permita movimientos de cámara dinámicos
- Mantén paleta de colores VIBRANTE y SATURADA
- Para momento ${momentoNarrativo}: selecciona apropiadamente

Analiza y selecciona el fondo perfecto para esta toma anime.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionArte, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '',
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const decision = extractFirstJsonBlock(response as string, { returnParsed: true }) as DecisionArte;
    
    if (decision && typeof decision === 'object' && 'fondo_seleccionado' in decision) {
      console.log('[Arte Anime] ✅ Decisión artística anime exitosa');
      
      // Buscar el asset completo
      const assetCompleto = fondosDisponibles.find(f => f.nombre === decision.fondo_seleccionado);
      if (assetCompleto) {
        decision._fondoSeleccionadoCompleto = assetCompleto;
      }
      
      return decision;
    }
  } catch (error) {
    console.error('[Arte Anime] ❌ Error en decisión artística:', error);
  }
  
  // Fallback anime
  console.log('[Arte Anime] 🔄 Usando decisión artística anime fallback...');
  const fondoFallback = fondosDisponibles[0] || {
    nombre: 'japon_urbano_anime',
    ruta: 'escenas/anime/apartamento/baño/día/frontal.png',
    lugar: 'ciudad',
    variante: 'dia'
  };
  
  return {
    fondo_seleccionado: fondoFallback.nombre,
    justificacion: 'Fondo anime por defecto - ciudad japonesa moderna perfecta para historias anime urbanas',
    ambiente: 'energético_anime',
    epoca: 'moderno_japonés',
    estilo_visual: 'anime_vibrante',
    paleta_colores: 'saturada_anime',
    iluminacion: 'dramática_anime',
    _fondoSeleccionadoCompleto: fondoFallback
  };
}

/**
 * Función principal de selección de fondo anime (mantiene compatibilidad)
 */
export async function seleccionarFondoAnime(
  fondosDisponibles: any[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<any> {
  
  try {
    // Convertir fondos al formato esperado
    const fondosNormalizados = fondosDisponibles.map(f => ({
      tipo: 'escenas',
      nombre: f.nombre || f.archivo || `fondo_${Math.random()}`,
      ruta: f.ruta || f.url || '',
      completitud: 'completo',
      estilo: 'anime',
      lugar: f.lugar || 'desconocido',
      variante: f.variante || 'general',
      ambiente: f.ambiente || 'neutro'
    }));

    const decision = await decidirArteConIA(
      fondosNormalizados,
      narrativa,
      momentoNarrativo,
      segundoActual,
      prompt,
      tomaInfo
    );
    
    // Retornar en formato compatible con el sistema existente
    return {
      archivo: decision._fondoSeleccionadoCompleto?.ruta || decision.fondo_seleccionado,
      nombre: decision.fondo_seleccionado,
      tipo: 'anime_background',
      categoria: 'anime',
      ambiente: decision.ambiente,
      estilo: decision.estilo_visual,
      paleta: decision.paleta_colores,
      iluminacion: decision.iluminacion,
      justificacion: decision.justificacion,
      url: decision._fondoSeleccionadoCompleto?.ruta || ''
    };
    
  } catch (error) {
    console.error('[Arte Anime] ❌ Error seleccionando fondo anime:', error);
    
    // Fallback simplificado
    return {
      archivo: 'escenas/anime/apartamento/baño/día/frontal.png',
      nombre: 'anime_default',
      tipo: 'anime_background',
      categoria: 'anime',
      ambiente: 'energético',
      estilo: 'anime_standard',
      paleta: 'vibrante',
      iluminacion: 'dramática',
      justificacion: 'Fondo anime por defecto',
      url: ''
    };
  }
}
