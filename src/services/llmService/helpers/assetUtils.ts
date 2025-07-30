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
  // Mapear estilos que pueden compartir assets
  const estilosCompatibles = getEstilosCompatibles(estilo);
  
  console.log(`[AssetUtils] 🔍 Filtrando fondos para estilo '${estilo}' → estilos compatibles: [${estilosCompatibles.join(', ')}]`);
  
  const fondosFiltrados = assets.filter(asset => 
    asset.tipo === 'escenas' && 
    asset.completitud === 'completa' && 
    (estilosCompatibles.includes(asset.estilo) || asset.estilo === 'universal')
  );
  
  console.log(`[AssetUtils] 📊 Fondos encontrados: ${fondosFiltrados.length}/${assets.length}`);
  
  // Log de muestra de los primeros 5 fondos encontrados
  fondosFiltrados.slice(0, 5).forEach((fondo, idx) => {
    console.log(`  [${idx + 1}] ${fondo.nombre} (estilo: ${fondo.estilo}) → ${fondo.ruta}`);
  });
  
  return fondosFiltrados;
}

/**
 * Filtra actores por estilo y completitud
 */
export function filtrarActores(assets: AssetIndexItem[], estilo: string = 'cinematic'): AssetIndexItem[] {
  // Mapear estilos que pueden compartir assets
  const estilosCompatibles = getEstilosCompatibles(estilo);
  
  return assets.filter(asset => 
    asset.tipo === 'actores' && 
    asset.completitud === 'completa' && 
    (estilosCompatibles.includes(asset.estilo) || asset.estilo === 'universal')
  );
}

/**
 * Obtiene estilos compatibles para compartir assets
 */
function getEstilosCompatibles(estilo: string): string[] {
  const mapeosCompatibilidad: Record<string, string[]> = {
    // ✅ MAPEO CORRECTO: Usar los estilos exactos que existen en assets_index.json
    'cinematic': ['realista', 'anime', 'comic'], // cinematic compatible con estilos reales
    'realistic': ['realista', 'anime'], // realistic → realista (exacto)
    'anime': ['anime', 'realista'], // anime sigue siendo compatible
    'cartoon': ['comic', 'anime'], // cartoon → comic (exacto)
    'commercial': ['realista', 'anime', 'comic'],
    
    // Mapeos directos para los estilos que existen exactamente
    'realista': ['realista', 'anime', 'comic'], // realista puede usar todos
    'comic': ['comic', 'anime', 'realista'], // comic puede usar todos
    'pixelart': ['pixelart', 'anime'] // pixelart limitado
  };
  
  const estilosEncontrados = mapeosCompatibilidad[estilo] || ['realista', 'anime', 'comic']; // fallback amplio
  console.log(`[AssetUtils] 🎨 Mapeo de estilos '${estilo}' → [${estilosEncontrados.join(', ')}]`);
  return estilosEncontrados;
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
 * Los diferentes ángulos (aerea, frontal, lateral) son assets únicos para continuidad cinematográfica
 */
export function buscarAssetPorNombre(assets: AssetIndexItem[], nombre: string): AssetIndexItem | null {
  if (!assets || assets.length === 0 || !nombre) return null;
  
  const nombreLower = nombre.toLowerCase();
  
  // Búsqueda exacta por nombre
  let found = assets.find(asset => asset.nombre?.toLowerCase() === nombreLower);
  if (found) return found;
  
  // Búsqueda parcial por nombre
  found = assets.find(asset => asset.nombre?.toLowerCase().includes(nombreLower));
  if (found) return found;
  
  // Búsqueda por ambiente si existe
  found = assets.find(asset => asset.ambiente?.toLowerCase().includes(nombreLower));
  if (found) return found;
  
  return null;
}
