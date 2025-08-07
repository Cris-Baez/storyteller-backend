import { callOpenRouter } from '../services/llmService/openRouterUtil.js';
import { findBestAsset } from '../services/searchAsset.js';
import { VideoPlan, TimelineSecond } from '../utils/types.js';
import { EstiloVisualPrincipal, normalizarEstilo } from '../types/estilos.js';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Configuración CDN
const CDN_BASE_URL = 'https://storage.googleapis.com';
const CDN_BUCKET = process.env.GCP_BUCKET_NAME || 'mi-bucket';

/**
 * Mapea estilos principales a nombres de carpetas de assets
 */
function mapearEstiloACarpetaAssets(estilo: EstiloVisualPrincipal): string {
  const mapeoAssets: Record<EstiloVisualPrincipal, string> = {
    'cinematic': 'realista',
    'anime': 'anime',
    'cartoon': 'comic',
    'commercial': 'realista'
  };
  return mapeoAssets[estilo] || 'realista';
}

function assetToCDNUrl(asset: AssetIndexItem): string {
  // assets van bajo la carpeta raíz del repo, por ejemplo: escenas/realista/casa/baño/día/aerea.png
  return `${CDN_BASE_URL}/${CDN_BUCKET}/${asset.ruta}`;
}

export const AssetIndexSchema = z.object({
  tipo: z.string(),
  ruta: z.string(),
  nombre: z.string(),
  completitud: z.string(),
  estilo: z.string(),
  lugar: z.string().optional(),
  variante: z.string().optional(),
  ambiente: z.string().optional(),
  angulo: z.string().optional(),
  size: z.number().optional(),
  fecha: z.string().optional(),
});
export type AssetIndexItem = z.infer<typeof AssetIndexSchema>;

/**
 * Usa OpenRouter para sugerir el fondo y actor más coherente según el contexto narrativo
 */
export async function sugerirFondoActorLLM({
  prompt,
  escena,
  fondos,
  actores,
  modelo = 'openai/chatgpt-4o-latest',
  timeout = 30000
}: {
  prompt: string;
  escena: TimelineSecond;
  fondos: AssetIndexItem[];
  actores: AssetIndexItem[];
  modelo?: string;
  timeout?: number;
}): Promise<{ fondo: AssetIndexItem | null; actor: AssetIndexItem | null; razon?: string; raw?: string; }> {
  const systemPrompt = `Eres un experto en dirección de arte y narrativa audiovisual. Tu tarea es elegir el fondo y actor más coherente para una escena, considerando el contexto narrativo, el prompt, el estilo, la emoción, el ambiente y los assets disponibles. Devuelve solo un JSON con los campos: fondoRuta, actorRuta, razon.`;
  const fondosList = fondos.map(a => `- ${a.nombre}: ${a.ruta} (${a.estilo}, ${a.ambiente || ''}, ${a.angulo || ''})`).join('\n');
  const actoresList = actores.map(a => `- ${a.nombre}: ${a.ruta} (${a.estilo}, ${a.ambiente || ''}, ${a.angulo || ''})`).join('\n');
  const userPrompt = `Prompt narrativo: ${prompt}\n\nEscena: ${JSON.stringify(escena)}\n\nFondos disponibles:\n${fondosList}\n\nActores disponibles:\n${actoresList}\n\nElige el fondo y actor más coherente y explica brevemente la razón.`;
  try {
    const respuesta = await callOpenRouter(systemPrompt, userPrompt, modelo, timeout);
    const match = respuesta && typeof respuesta === 'string' ? respuesta.match(/\{[\s\S]*\}/) : null;
    if (match) {
      const json = JSON.parse(match[0]);
      const fondo = fondos.find(a => a.ruta === json.fondoRuta) || null;
      const actor = actores.find(a => a.ruta === json.actorRuta) || null;
      return { fondo, actor, razon: json.razon, raw: respuesta };
    }
    return { fondo: null, actor: null, razon: 'No se pudo parsear respuesta LLM', raw: respuesta };
  } catch (e) {
    return { fondo: null, actor: null, razon: 'Error LLM: ' + String(e) };
  }
}

/**
 * Carga el índice de assets desde assets_index.json
 */
export async function cargarAssetsIndex(): Promise<AssetIndexItem[]> {
  // Warm cache + validación Zod
  const ASSETS_PATH = path.resolve(process.cwd(), 'assets_index.json');
  try {
    const data = await fs.readFile(ASSETS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    // Validar cada item con Zod
    const validos = parsed.filter((item: any) => {
      try {
        AssetIndexSchema.parse(item);
        return true;
      } catch {
        return false;
      }
    });
    return validos;
  } catch (e) {
    console.error('Error cargando assets index:', e);
    return [];
  }
}

/**
 * Corrige los fondos y actores inválidos en el VideoPlan, sugiriendo alternativas válidas
 */
export function corregirFondosActoresInvalidos(videoPlan: VideoPlan, assetsIndex: AssetIndexItem[]): { videoPlan: VideoPlan; sugerencias: any[] } {
  const visualStyleRaw = videoPlan.metadata?.visualStyle || 'realistic';
  
  // Normalizar el estilo a EstiloVisualPrincipal
  const estiloNormalizado = normalizarEstilo(visualStyleRaw as any);
  
  // ✅ USAR EL MISMO SISTEMA DE COMPATIBILIDAD QUE ASSETUTILS
  const { getEstilosCompatibles } = require('../services/llmService/helpers/assetUtils.js');
  const estilosCompatibles = getEstilosCompatibles(estiloNormalizado);
  
  const fondosValidos = assetsIndex.filter((a: AssetIndexItem) => 
    a.tipo === 'escenas' && 
    a.completitud === 'completa' && 
    (estilosCompatibles.includes(a.estilo) || a.estilo === 'universal')
  );
  
  const actoresValidos = assetsIndex.filter((a: AssetIndexItem) => 
    a.tipo === 'actores' && 
    a.completitud === 'completa' && 
    (estilosCompatibles.includes(a.estilo) || a.estilo === 'universal')
  );
  
  console.log(`[MenteFondos] 🔧 Corrección de assets para estilo '${estiloNormalizado}' → estilos compatibles: [${estilosCompatibles.join(', ')}]`);
  console.log(`[MenteFondos] 📊 Assets disponibles: ${fondosValidos.length} fondos, ${actoresValidos.length} actores`);
  
  const sugerencias: any[] = [];
  for (const scene of videoPlan.timeline as TimelineSecond[]) {
    // Fondo
    let fondoMatch: AssetIndexItem | null = null;
    if (scene.background && typeof scene.background === 'string' && !scene.background.startsWith('url://')) {
      const found = fondosValidos.find((a: AssetIndexItem) => a.ruta === scene.background);
      fondoMatch = found !== undefined ? found : null;
    }
    if (!fondoMatch) {
      const found = fondosValidos.find((a: AssetIndexItem) =>
        (!scene.ambiente || a.ambiente === scene.ambiente) &&
        (!scene.lugar || a.lugar === scene.lugar) &&
        (!scene.angulo || a.angulo === scene.angulo)
      );
      fondoMatch = found !== undefined ? found : null;
    }
    // Matching semántico simple si hay prompt y no hay match
    if (!fondoMatch && scene.backgroundPrompt) {
      let maxScore = 0;
      let best: AssetIndexItem | null = null;
      for (const a of fondosValidos) {
        let score = 0;
        if (a.ambiente === scene.ambiente) score++;
        if (a.lugar === scene.lugar) score++;
        if (a.angulo === (typeof scene.camera === 'object' ? scene.camera.shot : scene.camera)) score++;
        if (scene.backgroundPrompt && a.nombre && scene.backgroundPrompt.includes(a.nombre)) score++;
        if (score > maxScore) {
          maxScore = score;
          best = a;
        }
      }
      fondoMatch = best;
    }
    if (fondoMatch) {
      sugerencias.push({ t: scene.t, tipo: 'fondo', original: scene.background, sugerido: fondoMatch.ruta });
      scene.background = assetToCDNUrl(fondoMatch);
    } else {
      sugerencias.push({ t: scene.t, tipo: 'fondo', original: scene.background, sugerido: null });
      scene.background = '';
    }
    // Actor
    let actorMatch: AssetIndexItem | null = null;
    if (scene.character && typeof scene.character === 'string' && !scene.character.startsWith('url://')) {
      const found = actoresValidos.find((a: AssetIndexItem) => a.ruta === scene.character);
      actorMatch = found !== undefined ? found : null;
    }
    if (!actorMatch) {
      const found = actoresValidos.find((a: AssetIndexItem) =>
        (!scene.ambiente || a.ambiente === scene.ambiente) &&
        (!scene.lugar || a.lugar === scene.lugar) &&
        (!scene.angulo || a.angulo === scene.angulo)
      );
      actorMatch = found !== undefined ? found : null;
    }
    if (!actorMatch && scene.actorPrompt) {
      let maxScore = 0;
      let best: AssetIndexItem | null = null;
      for (const a of actoresValidos) {
        let score = 0;
        if (a.ambiente === scene.ambiente) score++;
        if (a.lugar === scene.lugar) score++;
        if (a.angulo === (typeof scene.camera === 'object' ? scene.camera.shot : scene.camera)) score++;
        if (scene.actorPrompt && a.nombre && scene.actorPrompt.includes(a.nombre)) score++;
        if (score > maxScore) {
          maxScore = score;
          best = a;
        }
      }
      actorMatch = best;
    }
    if (actorMatch) {
      sugerencias.push({ t: scene.t, tipo: 'actor', original: scene.character, sugerido: actorMatch.ruta });
      scene.character = assetToCDNUrl(actorMatch);
    } else {
      sugerencias.push({ t: scene.t, tipo: 'actor', original: scene.character, sugerido: null });
      scene.character = '';
    }
  }
  return { videoPlan, sugerencias };
}

/**
 * Valida que los fondos y actores en el VideoPlan sean correctos según el índice de assets
 */
export function validarVideoPlanFondosActores(videoPlan: VideoPlan, assetsIndex: AssetIndexItem[]): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  const fondosValidos = new Set(assetsIndex.filter((a: AssetIndexItem) => a.tipo === 'escenas' && a.completitud === 'completa').map((a: AssetIndexItem) => a.ruta));
  const actoresValidos = new Set(assetsIndex.filter((a: AssetIndexItem) => a.tipo === 'actores' && a.completitud === 'completa').map((a: AssetIndexItem) => a.ruta));
  for (const scene of videoPlan.timeline as TimelineSecond[]) {
    // Validar fondo: debe existir, ser del estilo correcto y estar completo
    if (scene.background) {
      const fondoMatch = assetsIndex.find((a: AssetIndexItem) => a.ruta === scene.background && a.tipo === 'escenas' && a.completitud === 'completa' && a.estilo === scene.visualStyle);
      if (!fondoMatch) {
        errores.push(`Fondo inválido o de estilo incorrecto en escena t=${scene.t}: ${scene.background}`);
      }
    }
    // Validar actor: debe existir, ser del estilo correcto y estar completo
    if (scene.character) {
      const actorMatch = assetsIndex.find((a: AssetIndexItem) => a.ruta === scene.character && a.tipo === 'actores' && a.completitud === 'completa' && a.estilo === scene.visualStyle);
      if (!actorMatch) {
        errores.push(`Actor inválido o de estilo incorrecto en escena t=${scene.t}: ${scene.character}`);
      }
    }
  }
  return { valido: errores.length === 0, errores };
}
