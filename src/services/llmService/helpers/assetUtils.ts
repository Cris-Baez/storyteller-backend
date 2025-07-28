// helpers/assetUtils.ts - Utilidades para manejo de assets

export interface AssetIndexItem {
  tipo: string;
  ruta: string;
  nombre: string;
  completitud: string;
  estilo: string;
  lugar?: string;
  variante?: string;
  ambiente?: string;
  angulo?: string;
  size?: number;
  fecha?: string;
}

/**
 * Filtra fondos por estilo y completitud
 */
export function filtrarFondos(assets: AssetIndexItem[], estilo: string = 'cinematic'): AssetIndexItem[] {
  return assets.filter(asset => 
    asset.tipo === 'escenas' && 
    asset.completitud === 'completa' && 
    (asset.estilo === estilo || asset.estilo === 'universal')
  );
}

/**
 * Filtra actores por estilo y completitud
 */
export function filtrarActores(assets: AssetIndexItem[], estilo: string = 'cinematic'): AssetIndexItem[] {
  return assets.filter(asset => 
    asset.tipo === 'actores' && 
    asset.completitud === 'completa' && 
    (asset.estilo === estilo || asset.estilo === 'universal')
  );
}

/**
 * Selecciona un asset por índice con fallback
 */
export function seleccionarAssetPorIndice(assets: AssetIndexItem[], indice: number): AssetIndexItem | null {
  if (!assets || assets.length === 0) return null;
  
  // Normalizar índice
  const indiceNormalizado = Math.max(0, Math.min(indice, assets.length - 1));
  return assets[indiceNormalizado] || assets[0];
}

/**
 * Carga el índice de assets desde archivo
 */
export async function cargarAssetsIndex(): Promise<AssetIndexItem[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const ASSETS_PATH = path.resolve(process.cwd(), 'assets_index.json');
    const data = await fs.readFile(ASSETS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Validar estructura básica
    const validos = parsed.filter((item: any) => 
      item && 
      typeof item.tipo === 'string' && 
      typeof item.ruta === 'string' && 
      typeof item.nombre === 'string'
    );
    
    return validos;
  } catch (error) {
    console.error('Error cargando assets index:', error);
    return [];
  }
}

/**
 * Busca el mejor asset por nombre o descripción
 */
export function buscarAssetPorNombre(assets: AssetIndexItem[], nombre: string): AssetIndexItem | null {
  if (!assets || assets.length === 0 || !nombre) return null;
  
  const nombreLower = nombre.toLowerCase();
  
  // Búsqueda exacta por nombre
  let found = assets.find(asset => asset.nombre.toLowerCase() === nombreLower);
  if (found) return found;
  
  // Búsqueda parcial por nombre
  found = assets.find(asset => asset.nombre.toLowerCase().includes(nombreLower));
  if (found) return found;
  
  // Búsqueda por ambiente si existe
  found = assets.find(asset => asset.ambiente?.toLowerCase().includes(nombreLower));
  if (found) return found;
  
  return null;
}
