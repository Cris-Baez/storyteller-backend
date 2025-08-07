// src/services/lipSyncService.ts
/**
 * 👄 SERVICIO UNIFICADO DE LIP-SYNC
 * ================================
 * 
 * Integra SadTalker y Wav2Lip según el estilo visual:
 * - Cinematic/Realistic → Wav2Lip (más preciso para estilos fotorrealísticos)
 * - Anime/Cartoon → SadTalker (mejor para estilos estilizados)
 * - Commercial → Wav2Lip (profesional y limpio)
 * 
 * Características:
 * ✅ Auto-detección de estilo para elegir tecnología
 * ✅ Fallback system si una tecnología falla
 * ✅ Procesamiento batch de múltiples clips
 * ✅ Validación de archivos antes del procesamiento
 * ✅ Logging detallado para debugging
 * ✅ Integración con el pipeline de renderizado
 */

import { applySadTalker } from './sadtalkerService.js';
import { applyWav2Lip } from './wav2lipService.js';
import { logger } from '../utils/logger.js';
import { EstiloVisualPrincipal } from '../types/estilos.js';
import { VideoPlan } from '../utils/types.js';
import path from 'path';
import fs from 'fs/promises';

export interface LipSyncOptions {
  clips: string[];
  audioPath: string;
  visualStyle: EstiloVisualPrincipal;
  forceTechnology?: 'sadtalker' | 'wav2lip';
  skipValidation?: boolean;
}

export interface LipSyncResult {
  processedClips: string[];
  originalClips: string[];
  technology: 'sadtalker' | 'wav2lip';
  successful: number;
  failed: number;
  metadata: {
    processingTime: number;
    errors: string[];
    warnings: string[];
  };
}

/**
 * Determina qué tecnología de lip-sync usar según el estilo visual
 */
function selectLipSyncTechnology(visualStyle: EstiloVisualPrincipal, forceTechnology?: string): 'sadtalker' | 'wav2lip' {
  if (forceTechnology) {
    return forceTechnology as 'sadtalker' | 'wav2lip';
  }

  switch (visualStyle) {
    case 'cinematic':
    case 'commercial':
      return 'wav2lip'; // Mejor para estilos fotorrealísticos y profesionales
    
    case 'anime':
    case 'cartoon':
      return 'sadtalker'; // Mejor para estilos estilizados y animados
    
    default:
      return 'wav2lip'; // Por defecto usar Wav2Lip
  }
}

/**
 * Valida que los archivos de entrada existan y sean válidos
 */
async function validateInputs(clips: string[], audioPath: string, skipValidation = false): Promise<void> {
  if (skipValidation) return;

  // Validar audio
  try {
    await fs.access(audioPath);
    const audioStats = await fs.stat(audioPath);
    if (audioStats.size < 1000) {
      throw new Error(`Archivo de audio muy pequeño: ${audioStats.size} bytes`);
    }
  } catch (error) {
    throw new Error(`Audio inválido: ${audioPath} - ${error}`);
  }

  // Validar clips
  for (const [index, clip] of clips.entries()) {
    try {
      // Soporte para URLs y archivos locales
      if (clip.startsWith('http')) {
        logger.info(`[LipSync] Clip ${index + 1} es URL remota, omitiendo validación local`);
        continue;
      }

      await fs.access(clip);
      const clipStats = await fs.stat(clip);
      if (clipStats.size < 10000) {
        throw new Error(`Clip muy pequeño: ${clipStats.size} bytes`);
      }
    } catch (error) {
      throw new Error(`Clip ${index + 1} inválido: ${clip} - ${error}`);
    }
  }
}

/**
 * Aplica lip-sync a un clip individual
 */
async function processIndividualClip(
  clipPath: string, 
  audioPath: string, 
  technology: 'sadtalker' | 'wav2lip',
  clipIndex: number
): Promise<string> {
  
  logger.info(`[LipSync] Procesando clip ${clipIndex + 1} con ${technology}...`);
  
  try {
    let processedClip: string;
    
    if (technology === 'sadtalker') {
      processedClip = await applySadTalker(clipPath, audioPath);
    } else {
      processedClip = await applyWav2Lip(clipPath, audioPath);
    }
    
    // Verificar que el archivo se generó correctamente
    await fs.access(processedClip);
    const stats = await fs.stat(processedClip);
    
    if (stats.size < 10000) {
      throw new Error('Archivo de salida muy pequeño, posible error en procesamiento');
    }
    
    logger.info(`[LipSync] ✅ Clip ${clipIndex + 1} procesado exitosamente: ${processedClip}`);
    return processedClip;
    
  } catch (error) {
    logger.error(`[LipSync] ❌ Error procesando clip ${clipIndex + 1}:`, error);
    throw error;
  }
}

/**
 * Aplica lip-sync con fallback a tecnología alternativa
 */
async function processWithFallback(
  clipPath: string,
  audioPath: string,
  primaryTech: 'sadtalker' | 'wav2lip',
  clipIndex: number
): Promise<{ result: string; technology: string }> {
  
  try {
    // Intentar con tecnología primaria
    const result = await processIndividualClip(clipPath, audioPath, primaryTech, clipIndex);
    return { result, technology: primaryTech };
    
  } catch (primaryError) {
    logger.warn(`[LipSync] ⚠️  ${primaryTech} falló para clip ${clipIndex + 1}, intentando fallback...`);
    
    // Intentar con tecnología alternativa
    const fallbackTech = primaryTech === 'sadtalker' ? 'wav2lip' : 'sadtalker';
    
    try {
      const result = await processIndividualClip(clipPath, audioPath, fallbackTech, clipIndex);
      logger.info(`[LipSync] ✅ Fallback exitoso con ${fallbackTech} para clip ${clipIndex + 1}`);
      return { result, technology: fallbackTech };
      
    } catch (fallbackError) {
      logger.error(`[LipSync] ❌ Ambas tecnologías fallaron para clip ${clipIndex + 1}`);
      const primaryMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(`Lip-sync falló: ${primaryTech}: ${primaryMsg}, ${fallbackTech}: ${fallbackMsg}`);
    }
  }
}

/**
 * FUNCIÓN PRINCIPAL: Aplica lip-sync a múltiples clips
 */
export async function applyLipSyncToClips(options: LipSyncOptions): Promise<LipSyncResult> {
  const startTime = Date.now();
  const { clips, audioPath, visualStyle, forceTechnology, skipValidation = false } = options;
  
  logger.info(`[LipSync] 👄 Iniciando procesamiento de ${clips.length} clips con estilo ${visualStyle}`);
  
  // Validar entradas
  await validateInputs(clips, audioPath, skipValidation);
  
  // Seleccionar tecnología
  const selectedTechnology = selectLipSyncTechnology(visualStyle, forceTechnology);
  logger.info(`[LipSync] 🔧 Tecnología seleccionada: ${selectedTechnology}`);
  
  const processedClips: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let successful = 0;
  let failed = 0;
  
  // Procesar clips secuencialmente para evitar saturar el sistema
  for (const [index, clipPath] of clips.entries()) {
    try {
      const { result, technology } = await processWithFallback(
        clipPath, 
        audioPath, 
        selectedTechnology, 
        index
      );
      
      processedClips.push(result);
      successful++;
      
      if (technology !== selectedTechnology) {
        warnings.push(`Clip ${index + 1} procesado con tecnología de fallback: ${technology}`);
      }
      
    } catch (error) {
      logger.error(`[LipSync] ❌ Falló completamente el clip ${index + 1}:`, error);
      
      // En caso de fallo completo, mantener clip original
      processedClips.push(clipPath);
      failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`Clip ${index + 1}: ${errorMsg}`);
      warnings.push(`Clip ${index + 1} mantenido sin lip-sync debido a errores`);
    }
  }
  
  const processingTime = Date.now() - startTime;
  
  logger.info(`[LipSync] 🎯 Procesamiento completado: ${successful}/${clips.length} exitosos en ${processingTime}ms`);
  
  if (failed > 0) {
    logger.warn(`[LipSync] ⚠️  ${failed} clips fallaron y se mantuvieron originales`);
  }
  
  return {
    processedClips,
    originalClips: clips,
    technology: selectedTechnology,
    successful,
    failed,
    metadata: {
      processingTime,
      errors,
      warnings
    }
  };
}

/**
 * Integración directa con VideoPlan
 */
export async function applyLipSyncToPlan(
  plan: VideoPlan, 
  clips: string[], 
  audioPath: string
): Promise<LipSyncResult> {
  
  const visualStyle = (plan.metadata?.visualStyle || 'cinematic') as EstiloVisualPrincipal;
  
  // Verificar si el plan requiere lip-sync
  const requiresLipSync = plan.timeline?.some(sec => 
    sec.lipSync && sec.lipSync !== 'none' && sec.lipSync !== ''
  ) || false;
  
  if (!requiresLipSync) {
    logger.info('[LipSync] Plan no requiere lip-sync, omitiendo procesamiento');
    return {
      processedClips: clips, // Devolver clips originales
      originalClips: clips,
      technology: selectLipSyncTechnology(visualStyle),
      successful: clips.length,
      failed: 0,
      metadata: {
        processingTime: 0,
        errors: [],
        warnings: ['Lip-sync omitido por configuración del plan']
      }
    };
  }
  
  return await applyLipSyncToClips({
    clips,
    audioPath,
    visualStyle,
    skipValidation: false
  });
}

/**
 * Utilidad para verificar disponibilidad de tecnologías
 */
export async function checkLipSyncAvailability(): Promise<{
  sadtalker: boolean;
  wav2lip: boolean;
  recommendation: string;
}> {
  
  let sadtalkerAvailable = false;
  let wav2lipAvailable = false;
  
  try {
    // Verificar SadTalker
    await fs.access(path.join(process.cwd(), 'SadTalker', 'inference.py'));
    sadtalkerAvailable = true;
  } catch {
    logger.warn('[LipSync] SadTalker no disponible');
  }
  
  try {
    // Verificar Wav2Lip
    await fs.access(path.join(process.cwd(), 'Wav2Lip', 'inference.py'));
    wav2lipAvailable = true;
  } catch {
    logger.warn('[LipSync] Wav2Lip no disponible');
  }
  
  let recommendation = '';
  if (sadtalkerAvailable && wav2lipAvailable) {
    recommendation = 'Ambas tecnologías disponibles - sistema óptimo';
  } else if (sadtalkerAvailable) {
    recommendation = 'Solo SadTalker disponible - limitado a estilos anime/cartoon';
  } else if (wav2lipAvailable) {
    recommendation = 'Solo Wav2Lip disponible - limitado a estilos cinematic/commercial';
  } else {
    recommendation = 'Ninguna tecnología disponible - lip-sync deshabilitado';
  }
  
  return {
    sadtalker: sadtalkerAvailable,
    wav2lip: wav2lipAvailable,
    recommendation
  };
}
