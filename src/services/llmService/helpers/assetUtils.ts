// helpers/assetUtils.ts - Utilidades para cargar y filtrar assets

import { readFile } from 'fs/promises';
import { resolve } from 'path';

export interface AssetIndexItem {
  nombre: string;
  ruta: string;
  tipo: 'escenas' | 'actores';
  estilo: string;
  completitud: 'completa' | 'parcial';
  lugar?: string;
  variante?: string;
  ambiente?: string;
  angulo?: string;
}

export async function cargarAssetsIndex(): Promise<AssetIndexItem[]> {
  try {
    const assetsRaw = await readFile(resolve(process.cwd(), 'assets_index.json'), 'utf-8');
    return JSON.parse(assetsRaw);
  } catch (e) {
    console.error('[AssetUtils] Error cargando assets_index.json:', e);
    return [];
  }
}

export function filtrarFondos(assets: AssetIndexItem[], estilo: string): AssetIndexItem[] {
  return assets.filter(a => 
    a.tipo === 'escenas' && 
    a.completitud === 'completa' && 
    a.estilo === estilo
  );
}

export function filtrarActores(assets: AssetIndexItem[], estilo: string): AssetIndexItem[] {
  return assets.filter(a => 
    a.tipo === 'actores' && 
    a.completitud === 'completa' && 
    a.estilo === estilo
  );
}

export function seleccionarAssetPorIndice<T>(assets: T[], indice: number): T | null {
  if (assets.length === 0) return null;
  return assets[indice % assets.length];
}

export function generarListaAssets(assets: AssetIndexItem[]): string {
  return assets.map(a => `- ${a.nombre}: ${a.ruta}`).join('\n');
}
