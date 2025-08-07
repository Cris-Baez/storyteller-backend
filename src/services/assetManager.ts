// src/services/assetManager.ts - Servicio unificado para gestión de assets

import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

/**
 * Interfaz unificada para assets del CDN
 */
export interface AssetItem {
  nombre: string;
  ruta: string;
  tipo: 'fondo' | 'actor';
  lugar?: string;
  variante?: string;
  angulo?: string;
  ambiente?: string;
  url?: string; // URL completa del CDN
}

/**
 * Configuración del CDN
 */
const CDN_CONFIG = {
  baseUrl: process.env.CDN_BUCKET_URL || 'https://storage.googleapis.com/storyteller-ai-cdn',
  cacheDuration: 5 * 60 * 1000, // 5 minutos
};

/**
 * Cache para evitar lecturas repetidas del assets_index.json
 */
let assetsCache: AssetItem[] | null = null;
let cacheTimestamp: number = 0;

/**
 * Servicio unificado para gestión de assets
 */
export class AssetManager {
  
  /**
   * Assets por defecto para fallback cuando no hay conexión al CDN
   */
  private static getDefaultAssets(): AssetItem[] {
    return [
      // Fondos por defecto
      {
        nombre: 'campo_frontal.png',
        ruta: 'escenas/realista/naturaleza/campo/día/frontal.png',
        tipo: 'fondo',
        lugar: 'naturaleza',
        variante: 'campo',
        angulo: 'frontal',
        ambiente: 'día',
        url: `${CDN_CONFIG.baseUrl}/escenas/realista/naturaleza/campo/día/frontal.png`
      },
      {
        nombre: 'ciudad_lateral.png',
        ruta: 'escenas/realista/ciudad/calle/día/lateral.png',
        tipo: 'fondo',
        lugar: 'ciudad',
        variante: 'calle',
        angulo: 'lateral',
        ambiente: 'día',
        url: `${CDN_CONFIG.baseUrl}/escenas/realista/ciudad/calle/día/lateral.png`
      },
      // Actores por defecto
      {
        nombre: 'joven_aventurero.png',
        ruta: 'actores/realista/naturaleza/campo/día/jovenmasculinoaventureroexplorador.png',
        tipo: 'actor',
        lugar: 'naturaleza',
        variante: 'campo',
        ambiente: 'día',
        url: `${CDN_CONFIG.baseUrl}/actores/realista/naturaleza/campo/día/jovenmasculinoaventureroexplorador.png`
      },
      {
        nombre: 'mujer_ciudad.png',
        ruta: 'actores/realista/ciudad/calle/día/mujerfemeninaseguraurbana.png',
        tipo: 'actor',
        lugar: 'ciudad',
        variante: 'calle',
        ambiente: 'día',
        url: `${CDN_CONFIG.baseUrl}/actores/realista/ciudad/calle/día/mujerfemeninaseguraurbana.png`
      }
    ];
  }
  
  /**
   * Cargar todos los assets desde assets_index.json con cache
   */
  static async cargarTodosLosAssets(): Promise<AssetItem[]> {
    const ahora = Date.now();
    
    // Usar cache si está vigente
    if (assetsCache && (ahora - cacheTimestamp) < CDN_CONFIG.cacheDuration) {
      logger.debug('[AssetManager] Usando assets desde cache');
      return assetsCache;
    }
    
    try {
      const assetsPath = path.join(process.cwd(), 'assets_index.json');
      
      if (!fs.existsSync(assetsPath)) {
        logger.warn('[AssetManager] assets_index.json no encontrado, usando assets por defecto');
        const defaultAssets = this.getDefaultAssets();
        assetsCache = defaultAssets;
        cacheTimestamp = ahora;
        return defaultAssets;
      }
      
      const contenido = fs.readFileSync(assetsPath, 'utf-8');
      const assetsRaw = JSON.parse(contenido);
      
      // Validar que el JSON tenga datos válidos
      if (!Array.isArray(assetsRaw) || assetsRaw.length === 0) {
        logger.warn('[AssetManager] assets_index.json vacío o inválido, usando assets por defecto');
        const defaultAssets = this.getDefaultAssets();
        assetsCache = defaultAssets;
        cacheTimestamp = ahora;
        return defaultAssets;
      }
      
      // Normalizar y enriquecer assets
      const assetsNormalizados = assetsRaw.map((asset: any) => ({
        nombre: asset.nombre,
        ruta: asset.ruta,
        tipo: asset.tipo === 'actores' ? 'actor' : 'fondo', // ✅ ARREGLO: Usar la propiedad 'tipo' del JSON
        lugar: asset.lugar,
        variante: asset.variante,
        angulo: asset.angulo,
        ambiente: asset.ambiente,
        url: this.convertirRutaAURL(asset.ruta)
      })) as AssetItem[];
      
      // Mezclar con assets por defecto para garantizar que siempre hay fallbacks
      const defaultAssets = this.getDefaultAssets();
      const assetsCombinados = [...assetsNormalizados, ...defaultAssets];
      
      // Actualizar cache
      assetsCache = assetsCombinados;
      cacheTimestamp = ahora;
      
      logger.info(`[AssetManager] Cargados ${assetsCombinados.length} assets (${assetsNormalizados.length} del índice + ${defaultAssets.length} por defecto)`);
      return assetsCombinados;
      
    } catch (error) {
      logger.error('[AssetManager] Error cargando assets:', error);
      logger.warn('[AssetManager] Usando assets por defecto como fallback');
      const defaultAssets = this.getDefaultAssets();
      assetsCache = defaultAssets;
      cacheTimestamp = ahora;
      return defaultAssets;
    }
  }
  
  /**
   * Filtrar fondos por estilo visual
   */
  static async obtenerFondosPorEstilo(estilo: string): Promise<AssetItem[]> {
    try {
      // ✅ USAR EL SISTEMA DE FILTRADO CORRECTO
      const { filtrarFondos, cargarAssetsIndex } = await import('./llmService/helpers/assetUtils.js');
      const todosLosAssets = await cargarAssetsIndex();
      
      const fondosFiltrados = filtrarFondos(todosLosAssets, estilo);
      
      // Convertir a formato AssetItem
      const fondosConvertidos = fondosFiltrados.map(asset => ({
        nombre: asset.nombre,
        ruta: asset.ruta,
        tipo: 'fondo' as const,
        lugar: asset.lugar,
        variante: asset.variante,
        angulo: asset.angulo,
        ambiente: asset.ambiente,
        url: `${CDN_CONFIG.baseUrl}/${asset.ruta}`
      }));
      
      logger.info(`[AssetManager] ✅ Obtenidos ${fondosConvertidos.length} fondos para estilo '${estilo}' (filtrado correcto)`);
      return fondosConvertidos;
    } catch (error) {
      logger.warn(`[AssetManager] ⚠️ Error filtrando fondos por estilo '${estilo}', usando fallback:`, error);
      
      // Fallback al sistema anterior
      const todosLosAssets = await this.cargarTodosLosAssets();
      const fondos = todosLosAssets.filter(asset => asset.tipo === 'fondo');
      logger.info(`[AssetManager] Obtenidos ${fondos.length} fondos (fallback sin filtro de estilo)`);
      return fondos;
    }
  }
  
  /**
   * Filtrar actores por estilo visual
   */
  static async obtenerActoresPorEstilo(estilo: string): Promise<AssetItem[]> {
    try {
      // ✅ USAR EL SISTEMA DE FILTRADO CORRECTO
      const { filtrarActores, cargarAssetsIndex } = await import('./llmService/helpers/assetUtils.js');
      const todosLosAssets = await cargarAssetsIndex();
      
      const actoresFiltrados = filtrarActores(todosLosAssets, estilo);
      
      // Convertir a formato AssetItem
      const actoresConvertidos = actoresFiltrados.map(asset => ({
        nombre: asset.nombre,
        ruta: asset.ruta,
        tipo: 'actor' as const,
        lugar: asset.lugar,
        variante: asset.variante,
        angulo: asset.angulo,
        ambiente: asset.ambiente,
        url: `${CDN_CONFIG.baseUrl}/${asset.ruta}`
      }));
      
      logger.info(`[AssetManager] ✅ Obtenidos ${actoresConvertidos.length} actores para estilo '${estilo}' (filtrado correcto)`);
      return actoresConvertidos;
    } catch (error) {
      logger.warn(`[AssetManager] ⚠️ Error filtrando actores por estilo '${estilo}', usando fallback:`, error);
      
      // Fallback al sistema anterior
      const todosLosAssets = await this.cargarTodosLosAssets();
      const actores = todosLosAssets.filter(asset => asset.tipo === 'actor');
      logger.info(`[AssetManager] Obtenidos ${actores.length} actores (fallback sin filtro de estilo)`);
      return actores;
    }
  }
  
  /**
   * Buscar asset específico por nombre
   */
  static async buscarAssetPorNombre(nombre: string): Promise<AssetItem | null> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    const asset = todosLosAssets.find(a => a.nombre === nombre);
    
    if (asset) {
      logger.debug(`[AssetManager] Asset encontrado: ${asset.nombre} → ${asset.url}`);
    } else {
      logger.warn(`[AssetManager] Asset no encontrado: ${nombre}`);
    }
    
    return asset || null;
  }
  
  /**
   * Buscar assets que coincidan con criterios específicos
   */
  static async buscarAssets(criterios: {
    lugar?: string;
    variante?: string;
    angulo?: string;
    tipo?: 'fondo' | 'actor';
    ambiente?: string;
  }): Promise<AssetItem[]> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    let resultados = todosLosAssets;
    
    if (criterios.tipo) {
      resultados = resultados.filter(a => a.tipo === criterios.tipo);
    }
    
    if (criterios.lugar) {
      resultados = resultados.filter(a => a.lugar?.toLowerCase() === criterios.lugar?.toLowerCase());
    }
    
    if (criterios.variante) {
      resultados = resultados.filter(a => a.variante?.toLowerCase() === criterios.variante?.toLowerCase());
    }
    
    if (criterios.angulo) {
      resultados = resultados.filter(a => a.angulo?.toLowerCase() === criterios.angulo?.toLowerCase());
    }
    
    if (criterios.ambiente) {
      resultados = resultados.filter(a => a.ambiente?.toLowerCase() === criterios.ambiente?.toLowerCase());
    }
    
    logger.debug(`[AssetManager] Búsqueda con criterios ${JSON.stringify(criterios)} → ${resultados.length} resultados`);
    return resultados;
  }
  
  /**
   * Validar que un asset existe y es accesible
   */
  static async validarAsset(asset: AssetItem): Promise<boolean> {
    if (!asset.url || !asset.nombre || !asset.ruta) {
      return false;
    }
    
    // En el futuro aquí se puede agregar validación HTTP
    // Por ahora validamos que tenga estructura correcta
    return true;
  }
  
  /**
   * Convertir ruta relativa a URL completa del CDN
   */
  static convertirRutaAURL(ruta: string): string {
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      return ruta;
    }
    
    const rutaLimpia = ruta.startsWith('/') ? ruta.substring(1) : ruta;
    const urlCompleta = `${CDN_CONFIG.baseUrl}/${rutaLimpia}`;
    
    return urlCompleta;
  }
  
  /**
   * Limpiar cache (útil para tests o actualizaciones)
   */
  static limpiarCache(): void {
    assetsCache = null;
    cacheTimestamp = 0;
    logger.info('[AssetManager] Cache de assets limpiado');
  }
  
  /**
   * Obtener estadísticas de assets cargados
   */
  static async obtenerEstadisticas(): Promise<{
    total: number;
    fondos: number;
    actores: number;
    lugares: string[];
    variantes: string[];
  }> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    const fondos = todosLosAssets.filter(a => a.tipo === 'fondo');
    const actores = todosLosAssets.filter(a => a.tipo === 'actor');
    
    const lugares = [...new Set(todosLosAssets.map(a => a.lugar).filter((lugar): lugar is string => Boolean(lugar)))];
    const variantes = [...new Set(todosLosAssets.map(a => a.variante).filter((variante): variante is string => Boolean(variante)))];
    
    return {
      total: todosLosAssets.length,
      fondos: fondos.length,
      actores: actores.length,
      lugares,
      variantes
    };
  }
}

// Funciones helper para mantener compatibilidad con código existente
export async function cargarAssetsIndex(): Promise<AssetItem[]> {
  return AssetManager.cargarTodosLosAssets();
}

export async function filtrarFondos(assets: AssetItem[], estilo: string): Promise<AssetItem[]> {
  return assets.filter(a => a.tipo === 'fondo');
}

export async function filtrarActores(assets: AssetItem[], estilo: string): Promise<AssetItem[]> {
  return assets.filter(a => a.tipo === 'actor');
}
