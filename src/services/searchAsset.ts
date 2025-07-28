// searchAsset.ts - Servicio de búsqueda de assets

import { logger } from '../utils/logger.js';

export interface AssetItem {
  tipo: string;
  ruta: string;
  nombre: string;
  completitud: string;
  estilo: string;
  lugar?: string;
  variante?: string;
  ambiente?: string;
  angulo?: string;
  score?: number;
}

/**
 * Busca el mejor asset según criterios específicos
 */
export async function findBestAsset(
  assets: AssetItem[], 
  criteria: {
    tipo?: string;
    estilo?: string;
    ambiente?: string;
    query?: string;
  }
): Promise<AssetItem | null> {
  
  logger.info(`[SearchAsset] Buscando asset con criterios:`, criteria);
  
  if (!assets || assets.length === 0) {
    logger.warn('[SearchAsset] No hay assets disponibles');
    return null;
  }
  
  let filteredAssets = [...assets];
  
  // Filtrar por tipo
  if (criteria.tipo) {
    filteredAssets = filteredAssets.filter(asset => 
      asset.tipo.toLowerCase() === criteria.tipo!.toLowerCase()
    );
  }
  
  // Filtrar por estilo
  if (criteria.estilo) {
    filteredAssets = filteredAssets.filter(asset => 
      asset.estilo.toLowerCase() === criteria.estilo!.toLowerCase() ||
      asset.estilo.toLowerCase() === 'universal'
    );
  }
  
  // Filtrar por ambiente
  if (criteria.ambiente) {
    filteredAssets = filteredAssets.filter(asset => 
      asset.ambiente?.toLowerCase().includes(criteria.ambiente!.toLowerCase())
    );
  }
  
  // Búsqueda por query general
  if (criteria.query) {
    const query = criteria.query.toLowerCase();
    filteredAssets = filteredAssets.filter(asset => 
      asset.nombre.toLowerCase().includes(query) ||
      asset.ambiente?.toLowerCase().includes(query) ||
      asset.lugar?.toLowerCase().includes(query)
    );
  }
  
  // Solo assets completos
  filteredAssets = filteredAssets.filter(asset => 
    asset.completitud === 'completa'
  );
  
  if (filteredAssets.length === 0) {
    logger.warn('[SearchAsset] No se encontraron assets que coincidan');
    return null;
  }
  
  // Scoring y selección del mejor
  const scoredAssets = filteredAssets.map(asset => ({
    ...asset,
    score: calculateAssetScore(asset, criteria)
  }));
  
  // Ordenar por score descendente
  scoredAssets.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const bestAsset = scoredAssets[0];
  logger.info(`[SearchAsset] Mejor asset encontrado: ${bestAsset.nombre} (score: ${bestAsset.score})`);
  
  return bestAsset;
}

/**
 * Calcula el score de relevancia de un asset
 */
function calculateAssetScore(asset: AssetItem, criteria: any): number {
  let score = 0;
  
  // Bonus por coincidencia exacta de tipo
  if (criteria.tipo && asset.tipo.toLowerCase() === criteria.tipo.toLowerCase()) {
    score += 10;
  }
  
  // Bonus por coincidencia exacta de estilo
  if (criteria.estilo && asset.estilo.toLowerCase() === criteria.estilo.toLowerCase()) {
    score += 8;
  }
  
  // Bonus por estilo universal
  if (asset.estilo.toLowerCase() === 'universal') {
    score += 5;
  }
  
  // Bonus por ambiente coincidente
  if (criteria.ambiente && asset.ambiente?.toLowerCase().includes(criteria.ambiente.toLowerCase())) {
    score += 6;
  }
  
  // Bonus por query coincidente
  if (criteria.query) {
    const query = criteria.query.toLowerCase();
    if (asset.nombre.toLowerCase().includes(query)) score += 7;
    if (asset.ambiente?.toLowerCase().includes(query)) score += 4;
    if (asset.lugar?.toLowerCase().includes(query)) score += 3;
  }
  
  // Bonus por completitud
  if (asset.completitud === 'completa') {
    score += 5;
  }
  
  return score;
}

/**
 * Busca múltiples assets con criterios
 */
export async function findAssets(
  assets: AssetItem[], 
  criteria: any,
  limit: number = 5
): Promise<AssetItem[]> {
  
  logger.info(`[SearchAsset] Buscando hasta ${limit} assets`);
  
  const bestAsset = await findBestAsset(assets, criteria);
  if (!bestAsset) return [];
  
  // Buscar assets similares
  const similarAssets = assets
    .filter(asset => asset !== bestAsset)
    .map(asset => ({
      ...asset,
      score: calculateAssetScore(asset, criteria)
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit - 1);
  
  return [bestAsset, ...similarAssets];
}
