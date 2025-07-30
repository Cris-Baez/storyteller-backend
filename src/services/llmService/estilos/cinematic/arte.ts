// estilos/cinematic/arte.ts - Cerebro Director de Arte Cinematográfico con IA distribuida

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
  _fondoSeleccionadoCompleto?: AssetIndexItem; // ✅ Asset completo para evitar confusiones con duplicados
}

/**
 * Usa IA para tomar decisiones artísticas inteligentes sobre fondos y estilo visual
 */
export async function decidirArteConIA(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<DecisionArte> {
  console.log(`[Arte Cinematic] 🎨 Analizando arte con IA para ${momentoNarrativo}...`);
  
  // ✅ Log de información de toma si está disponible
  if (tomaInfo) {
    console.log(`[Arte Cinematic] 🎬 Toma ${tomaInfo.numero}: ${tomaInfo.descripcion} (${tomaInfo.duracion}s)`);
  }
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de Arte de CinemaAI
    const especializacionArte = `
Ahora actúas como el CEREBRO DIRECTOR DE ARTE de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI usa fondos PRE-GENERADOS del CDN (no crea nuevos)
- Tu trabajo es SELECCIONAR el fondo perfecto del catálogo existente según CONTEXTO NARRATIVO
- Kling Elements animará el fondo seleccionado con movimientos de cámara
- Debes garantizar CONTINUIDAD VISUAL entre tomas
- La primera toma DEBE ser visualmente impactante

🎭 SELECCIÓN CONTEXTUAL POR GÉNERO/TONO:
- DRAMA ÍNTIMO/ROMANCE → apartamentos, casas, cafeterías, espacios íntimos y cálidos
- THRILLER CORPORATIVO → oficinas, edificios modernos, interiores profesionales
- AVENTURA ÉPICA → naturaleza, montañas, paisajes amplios, exteriores dramáticos  
- COMEDIA URBANA → calles, plazas, espacios públicos vibrantes
- TERROR/SUSPENSE → interiores cerrados, escaleras, pasillos, espacios claustrofóbicos
- DOCUMENTAL → locaciones apropiadas según el tema específico
- CIENCIA FICCIÓN → espacios futuristas, laboratorios, arquitectura moderna

🎬 PRINCIPIOS CINEMATOGRÁFICOS:
✅ Analiza el PROMPT para entender género, tono y contexto emocional
✅ Selecciona locación que APOYE la narrativa (íntima vs épica según historia)
✅ Mantén COHERENCIA VISUAL entre tomas (paleta, iluminación, estilo)
✅ Considera PROGRESIÓN EMOCIONAL: espacios cerrados→abiertos o viceversa
✅ Primera toma debe crear IMPACTO VISUAL apropiado para el género

FONDOS DISPONIBLES EN EL CDN:
${fondosDisponibles.slice(0, 20).map(f => `- ${f.nombre}: ${f.lugar}/${f.variante} (${f.ambiente || 'neutro'})`).join('\n')}
${fondosDisponibles.length > 20 ? `... y ${fondosDisponibles.length - 20} fondos más` : ''}

⚠️ REGLAS TÉCNICAS:
- SIEMPRE analiza el prompt para entender qué tipo de historia es
- NO apliques filtros rígidos - deja que el contexto decida
- Para dramas íntimos, los apartamentos son PERFECTOS
- Para aventuras épicas, los exteriores son IDEALES
- Considera el movimiento de cámara de Kling

RESPONDE ÚNICAMENTE con este JSON:
{
  "fondo_seleccionado": "nombre_exacto_del_fondo_seleccionado",
  "justificacion": "por qué este fondo es perfecto para este contexto narrativo específico",
  "ambiente": "descripción del ambiente según el género (íntimo, épico, misterioso, etc)",
  "epoca": "época temporal (moderno, clásico, futurista, etc)",
  "estilo_visual": "estilo cinematográfico según contexto",
  "paleta_colores": "paleta apropiada para el género y tono",
  "iluminacion": "tipo de iluminación que refuerza el género"
}`;

    const contextoUsuario = `
NARRATIVA: ${narrativa.historia}
TONO: ${narrativa.tono}
GÉNERO: ${narrativa.genero}
MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
PROMPT ORIGINAL: "${prompt}"

CONTINUIDAD VISUAL PLANIFICADA:
${narrativa.continuidad ? `
- Paleta de colores: ${narrativa.continuidad.paletaColores}
- Iluminación: ${narrativa.continuidad.iluminacion}
- Ambiente: ${narrativa.continuidad.ambiente}
- Locación: ${narrativa.continuidad.locacion}
- Estilo general: ${narrativa.continuidad.estiloGeneral}
` : 'Sin plan de continuidad específico'}

${tomaInfo ? `
INFORMACIÓN DE TOMA:
- Número: ${tomaInfo.numero}
- Duración: ${tomaInfo.duracion}s
- Descripción: ${tomaInfo.descripcion}
- Tipo: ${tomaInfo.tipoToma}
- Movimiento de cámara: ${tomaInfo.movimientoCamara}
- Carryover: ${tomaInfo.carryover || 'ninguno'}
` : ''}

INSTRUCCIONES CRÍTICAS:
- Si es toma 2 o 3, MANTÉN continuidad visual con tomas anteriores
- RECHAZA categóricamente fondos domésticos (apartamentos, baños) para aventuras
- PRIORIZA exteriores épicos y locaciones de aventura
- CONSIDERA cómo el movimiento de cámara afectará la selección

Selecciona el fondo más apropiado y define el estilo visual para esta ${tomaInfo ? 'toma' : 'escena'}.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionArte, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', 
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const decision = extractFirstJsonBlock(response as string, { returnParsed: true }) as DecisionArte;
    
    if (decision && typeof decision === 'object' && 'fondo_seleccionado' in decision) {
      // ✅ EXTRAER NOMBRE Y CONTEXTO ADICIONAL (no descartar información valiosa)
      let nombreLimpio = decision.fondo_seleccionado.trim();
      let contextoAdicional = '';
      
      // Extraer contexto después de : (ej: "aerea.png: desierto_montañoso/amanecer")
      if (nombreLimpio.includes(':')) {
        const partes = nombreLimpio.split(':');
        nombreLimpio = partes[0].trim();
        contextoAdicional = partes[1].trim().toLowerCase();
      }
      
      // Remover descripciones en paréntesis del nombre (pero mantener contexto)
      if (nombreLimpio.includes('(')) {
        const nombrePartes = nombreLimpio.split('(');
        nombreLimpio = nombrePartes[0].trim();
        if (!contextoAdicional && nombrePartes[1]) {
          contextoAdicional += ' ' + nombrePartes[1].replace(')', '').trim().toLowerCase();
        }
      }
      
      console.log(`[Arte Cinematic] 🧹 Limpiando nombre: "${decision.fondo_seleccionado}" → "${nombreLimpio}"`);
      if (contextoAdicional) {
        console.log(`[Arte Cinematic] 📝 Contexto adicional detectado: "${contextoAdicional}"`);
      }
      
      // ✅ BÚSQUEDA ANTI-COLISIÓN: Buscar fondos candidatos con mismo nombre en lista filtrada
      const fondosCandidatos = fondosDisponibles.filter(f => f.nombre === nombreLimpio);
      
      console.log(`[Arte Cinematic] 🔍 Buscando "${nombreLimpio}" - Encontrados ${fondosCandidatos.length} candidatos`);
      fondosCandidatos.forEach((f, idx) => {
        console.log(`  [${idx + 1}] ${f.ruta} (lugar: ${f.lugar}, variante: ${f.variante})`);
      });
      
      if (fondosCandidatos.length > 0) {
        let fondoSeleccionado = fondosCandidatos[0]; // Default: primer candidato
        
        // Si hay múltiples candidatos, aplicar selección inteligente CON CONTEXTO
        if (fondosCandidatos.length > 1) {
          console.log('[Arte Cinematic] 🧠 Múltiples candidatos, aplicando selección inteligente...');
          
          // 🔥 NUEVA ESTRATEGIA: Usar contexto adicional de la IA para selección precisa
          if (contextoAdicional) {
            console.log(`[Arte Cinematic] 🎯 Usando contexto para selección: "${contextoAdicional}"`);
            
            // Buscar coincidencias en el contexto adicional
            for (const candidato of fondosCandidatos) {
              const rutaBaja = candidato.ruta.toLowerCase();
              const lugarBajo = candidato.lugar?.toLowerCase() || '';
              const varianteBaja = candidato.variante?.toLowerCase() || '';
              
              // Verificar si el contexto coincide con la ruta, lugar o variante
              if (rutaBaja.includes(contextoAdicional) || 
                  contextoAdicional.includes(lugarBajo) || 
                  contextoAdicional.includes(varianteBaja) ||
                  lugarBajo.includes(contextoAdicional.split('/')[0]) ||
                  varianteBaja.includes(contextoAdicional.split('/')[0])) {
                fondoSeleccionado = candidato;
                console.log(`[Arte Cinematic] 🎯 Seleccionado por contexto específico "${contextoAdicional}": ${candidato.ruta}`);
                break;
              }
            }
          }
          
          // Si no se encontró por contexto, usar lógica de lugares preferidos
          if (fondoSeleccionado === fondosCandidatos[0]) {
            // Preferir por lugar épico
            const lugaresPreferidos = ['naturaleza', 'ciudad', 'templo'];
            for (const lugar of lugaresPreferidos) {
              const candidatoPorLugar = fondosCandidatos.find(f => f.lugar?.toLowerCase() === lugar);
              if (candidatoPorLugar) {
                fondoSeleccionado = candidatoPorLugar;
                console.log(`[Arte Cinematic] 🎯 Seleccionado por lugar épico "${lugar}": ${candidatoPorLugar.ruta}`);
                break;
              }
            }
          }
          
          // Si no encontró por lugar, preferir por variante épica
          if (fondoSeleccionado === fondosCandidatos[0]) {
            const variantesPreferidas = ['desierto', 'montaña', 'acantilado', 'plaza', 'campo', 'bosque', 'entrada'];
            for (const variante of variantesPreferidas) {
              const candidatoPorVariante = fondosCandidatos.find(f => f.variante?.toLowerCase() === variante);
              if (candidatoPorVariante) {
                fondoSeleccionado = candidatoPorVariante;
                console.log(`[Arte Cinematic] 🎯 Seleccionado por variante épica "${variante}": ${candidatoPorVariante.ruta}`);
                break;
              }
            }
          }
        }
        
        console.log('[Arte Cinematic] ✅ Decisión artística IA exitosa');
        console.log(`- Fondo final: ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
        console.log(`- Contexto: lugar="${fondoSeleccionado.lugar}", variante="${fondoSeleccionado.variante}"`);
        console.log(`- Ambiente: ${decision.ambiente}`);
        
        return {
          ...decision,
          fondo_seleccionado: fondoSeleccionado.nombre,
          _fondoSeleccionadoCompleto: fondoSeleccionado // Asset completo para referencia exacta
        };
      } else {
        console.warn(`[Arte Cinematic] ❌ IA seleccionó fondo no encontrado en lista filtrada: ${nombreLimpio}`);
        console.warn(`[Arte Cinematic] 📋 Fondos épicos disponibles:`);
        fondosDisponibles.slice(0, 5).forEach((f, idx) => {
          console.warn(`  [${idx + 1}] ${f.nombre} → ${f.ruta} (${f.lugar}/${f.variante})`);
        });
        
        // ✅ CRÍTICO: Usar fallback inmediato cuando IA falla
        console.log('[Arte Cinematic] 🔄 IA falló, aplicando fallback inmediato...');
        const fondoFallbackInmediato = seleccionarFondoPorMomento(fondosDisponibles, momentoNarrativo, segundoActual);
        
        if (fondoFallbackInmediato) {
          console.log(`[Arte Cinematic] ✅ Fallback inmediato: ${fondoFallbackInmediato.nombre} → ${fondoFallbackInmediato.ruta}`);
          return {
            ...decision,
            fondo_seleccionado: fondoFallbackInmediato.nombre,
            _fondoSeleccionadoCompleto: fondoFallbackInmediato // ✅ Asset completo
          };
        }
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
    iluminacion: 'natural',
    _fondoSeleccionadoCompleto: fondoFallback // ✅ CRÍTICO: Incluir asset completo
  };
}

export async function seleccionarFondoCinematico(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt?: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<SeleccionFondo> {
  console.log(`[Arte Cinematic] Seleccionando fondo para ${momentoNarrativo} - segundo ${segundoActual}`);
  
  // ✅ Usar información de toma si está disponible
  if (tomaInfo) {
    console.log(`[Arte Cinematic] 🎬 Procesando toma ${tomaInfo.numero}: ${tomaInfo.descripcion} (${tomaInfo.duracion}s)`);
  }
  
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
    const decisionIA = await decidirArteConIA(
      fondosDisponibles, 
      narrativa, 
      momentoNarrativo, 
      segundoActual, 
      prompt,
      tomaInfo // ✅ Pasar información de toma a la IA
    );
    
    // 🔍 DEBUG: Verificar qué retornó decidirArteConIA
    console.log(`[Arte Cinematic] 🔍 DEBUG - decisionIA recibida:`, {
      fondo_seleccionado: decisionIA?.fondo_seleccionado,
      _fondoSeleccionadoCompleto: decisionIA?._fondoSeleccionadoCompleto ? 'PRESENTE' : 'UNDEFINED',
      _fondoSeleccionadoCompleto_nombre: decisionIA?._fondoSeleccionadoCompleto?.nombre,
      _fondoSeleccionadoCompleto_ruta: decisionIA?._fondoSeleccionadoCompleto?.ruta
    });
    
    // ✅ CRÍTICO: Usar el asset completo si está disponible (evita confusiones con duplicados)
    let fondoSeleccionado: AssetIndexItem | undefined;
    
    if (decisionIA._fondoSeleccionadoCompleto) {
      // Tenemos el asset completo - usar directamente
      fondoSeleccionado = decisionIA._fondoSeleccionadoCompleto;
      console.log(`[Arte Cinematic] ✅ IA seleccionó fondo (asset completo): ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
    } else {
      // Buscar por nombre (puede haber duplicados)
      fondoSeleccionado = fondosDisponibles.find(f => f.nombre === decisionIA.fondo_seleccionado);
      if (fondoSeleccionado) {
        console.log(`[Arte Cinematic] ✅ IA seleccionó fondo (por nombre): ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
      } else {
        console.warn(`[Arte Cinematic] ⚠️ IA seleccionó fondo no encontrado: ${decisionIA.fondo_seleccionado}`);
      }
    }
    
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
    console.log(`[Arte Cinematic] ✅ Lógica tradicional seleccionó: ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
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
  console.log(`[Arte Cinematic] ⚠️ Usando fallback por rotación: ${fondoFallback?.nombre} → ${fondoFallback?.ruta}`);
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
  console.log(`[Arte] 🔍 SELECCIÓN CONTEXTUAL - Momento: ${momento}, Fondos disponibles: ${fondos.length}`);
  
  // ✅ Sin filtros rígidos - todos los fondos están disponibles para decisión contextual
  
  if (fondos.length === 0) {
    console.log(`[Arte] ❌ ALERTA: NO HAY FONDOS DISPONIBLES`);
    return null;
  }
  
  // Log de diversidad de fondos disponibles
  const lugaresDisponibles = [...new Set(fondos.map(f => f.lugar).filter(Boolean))];
  const variantesDisponibles = [...new Set(fondos.map(f => f.variante).filter(Boolean))];
  
  console.log(`[Arte] 📍 Lugares disponibles: ${lugaresDisponibles.join(', ')}`);
  console.log(`[Arte] 🏗️ Variantes disponibles: ${variantesDisponibles.slice(0, 10).join(', ')}${variantesDisponibles.length > 10 ? '...' : ''}`);
  
  // Usar todos los fondos para máxima flexibilidad
  const fondosParaSeleccion = fondos;
  
  // Lógica de selección mejorada por momento narrativo usando campos JSON
  const preferencias = {
    setup: {
      lugares: ['ciudad', 'naturaleza'],
      variantes: ['entrada', 'frontal', 'calle', 'plaza', 'acantilado'],
      angulos: ['frontal', 'aerea']
    },
    desarrollo: {
      lugares: ['naturaleza', 'ciudad'],
      variantes: ['bosque', 'campo', 'río', 'parque', 'calle'],
      angulos: ['lateral', 'frontal']
    },
    climax: {
      lugares: ['naturaleza', 'templo'],
      variantes: ['montaña', 'acantilado', 'altar', 'torre'],
      angulos: ['aerea', 'frontal']
    },
    cierre: {
      lugares: ['naturaleza', 'ciudad'],
      variantes: ['campo', 'valle', 'plaza', 'parque'],
      angulos: ['frontal', 'aerea']
    }
  };

  const pref = preferencias[momento as keyof typeof preferencias] || preferencias.desarrollo;
  console.log(`[Arte] 🎯 Buscando fondos para momento '${momento}' con preferencias:`, pref);
  
  // Buscar por lugar preferido primero
  for (const lugar of pref.lugares) {
    const fondoPorLugar = fondosParaSeleccion.find(f => f.lugar?.toLowerCase() === lugar);
    if (fondoPorLugar) {
      console.log(`[Arte] 🎯 FONDO SELECCIONADO POR LUGAR: ${fondoPorLugar.nombre} (lugar: ${fondoPorLugar.lugar}) → ${fondoPorLugar.ruta}`);
      return fondoPorLugar;
    }
  }
  
  // Buscar por variante preferida
  for (const variante of pref.variantes) {
    const fondoPorVariante = fondosParaSeleccion.find(f => f.variante?.toLowerCase() === variante);
    if (fondoPorVariante) {
      console.log(`[Arte] 🎯 FONDO SELECCIONADO POR VARIANTE: ${fondoPorVariante.nombre} (variante: ${fondoPorVariante.variante}) → ${fondoPorVariante.ruta}`);
      return fondoPorVariante;
    }
  }
  
  // Si no encuentra coincidencia específica, tomar el primer fondo épico
  const fondoFallback = fondosParaSeleccion[0];
  console.log(`[Arte] � FONDO FALLBACK ÉPICO: ${fondoFallback.nombre} → ${fondoFallback.ruta}`);
  return fondoFallback;
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
    lighting: 'natural' // Valor por defecto, ya que limitaciones.lighting no existe
  }));
}
