
import fs from 'fs/promises';

export interface AssetMeta {
  tipo: string;
  ruta: string;
  nombre: string;
  completitud: string;
  estilo?: string;
  lugar?: string;
  variante?: string;
  ambiente?: string;
  angulo?: string;
  size?: number;
  fecha?: string;
  [key: string]: any;
}

export async function getAssetFromIndex(tipo: string, nombre: string): Promise<AssetMeta | null> {
  try {
    const raw = await fs.readFile('./assets_index.json', 'utf-8');
    const index: AssetMeta[] = JSON.parse(raw);
    return index.find((a) => a.tipo === tipo && a.nombre === nombre) || null;
  } catch (e) {
    console.error('[getAssetFromIndex] Error leyendo assets_index.json:', e);
    return null;
  }
}

// Busca el asset más parecido en el índice según los campos clave
// IA: función real usando OpenRouter embeddings para similitud semántica
// Utilidad para obtener embeddings desde OpenRouter
import fetch from 'node-fetch';
async function callOpenRouter(task: 'embedding', text: string): Promise<number[]> {
  // Ajusta la URL y el API key según tu configuración de OpenRouter
  const apiUrl = 'https://openrouter.ai/api/embeddings';
  const apiKey = process.env.OPENROUTER_API_KEY;
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: text })
  });
  const data = await res.json();
  // Ajusta el path según la respuesta real de OpenRouter
  // Compatibilidad con respuesta estándar OpenRouter
  try {
    if (data && typeof data === 'object') {
      if ('embedding' in data && Array.isArray(data.embedding)) {
        return data.embedding;
      }
      if ('data' in data && Array.isArray(data.data) && data.data[0] && Array.isArray(data.data[0].embedding)) {
        return data.data[0].embedding;
      }
    }
  } catch {}
  return [];
}
async function getSemanticSimilarity(aPrompt: string, bPrompt: string): Promise<number> {
  if (!aPrompt || !bPrompt) return 0;
  // Obtener embeddings de ambos textos usando OpenRouter
  const [aEmbedding, bEmbedding] = await Promise.all([
    callOpenRouter('embedding', aPrompt),
    callOpenRouter('embedding', bPrompt)
  ]);
  // Calcular similitud coseno entre los embeddings
  function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dot = vecA.reduce((sum, v, i) => sum + v * vecB[i], 0);
    const normA = Math.sqrt(vecA.reduce((sum, v) => sum + v * v, 0));
    const normB = Math.sqrt(vecB.reduce((sum, v) => sum + v * v, 0));
    return dot / (normA * normB);
  }
  if (Array.isArray(aEmbedding) && Array.isArray(bEmbedding)) {
    return cosineSimilarity(aEmbedding, bEmbedding);
  }
  return 0;
}

export async function findBestAsset(params: {
  tipo: string;
  estilo?: string;
  lugar?: string;
  variante?: string;
  ambiente?: string;
  angulo?: string;
  nombre?: string;
  prompt?: string; // Nuevo: prompt semántico
}): Promise<AssetMeta | null> {
  try {
    const raw = await fs.readFile('./assets_index.json', 'utf-8');
    const index: AssetMeta[] = JSON.parse(raw);
    const candidates = index.filter((a) => a.tipo === params.tipo);
    // Matching exacto por todos los campos
    const best = candidates.find((a) =>
      a.estilo === params.estilo &&
      a.lugar === params.lugar &&
      a.variante === params.variante &&
      a.ambiente === params.ambiente &&
      (a.angulo === params.angulo || a.nombre === params.nombre)
    );
    if (best) return best;
    // Matching parcial: suma coincidencias
    let maxScore = 0;
    let bestPartial: AssetMeta | null = null;
    for (const a of candidates) {
      let score = 0;
      if (a.estilo === params.estilo) score++;
      if (a.lugar === params.lugar) score++;
      if (a.variante === params.variante) score++;
      if (a.ambiente === params.ambiente) score++;
      if (a.angulo === params.angulo || a.nombre === params.nombre) score++;
      if (score > maxScore) {
        maxScore = score;
        bestPartial = a;
      }
    }
    if (bestPartial) return bestPartial;
    // IA: ranking semántico si no hay coincidencia suficiente
    if (params.prompt) {
      let bestSim = 0;
      let bestSimAsset: AssetMeta | null = null;
      for (const a of candidates) {
        const sim = await getSemanticSimilarity(params.prompt, a.nombre + ' ' + (a.lugar || '') + ' ' + (a.estilo || ''));
        if (sim > bestSim) {
          bestSim = sim;
          bestSimAsset = a;
        }
      }
      if (bestSimAsset && bestSim > 0.1) return bestSimAsset;
    }
    return null;
  } catch (e) {
    console.error('[findBestAsset] Error leyendo assets_index.json:', e);
    return null;
  }
}
