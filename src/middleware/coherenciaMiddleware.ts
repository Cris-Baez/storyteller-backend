// src/middleware/coherenciaMiddleware.ts
/**
 * 🎯 MIDDLEWARE DE COHERENCIA
 * ==========================
 * 
 * Intercepta y mejora diálogos/videos sin tocar servicios existentes
 * ✅ Preserva funcionamiento original
 * ✅ Mejora coherencia automáticamente
 * ✅ Logs detallados para debugging
 */

import { mejorarCoherenciaDialogo, mejorarCoherenciaVisual, mapearVocesExistentes, validarCoherenciaPlan } from '../utils/coherenciaVideoDialogo.js';
import { logger } from '../utils/logger.js';

export class CoherenciaMiddleware {
  private dialogosAnteriores: Map<string, string> = new Map();
  private promptsAnteriores: Map<string, string> = new Map();
  
  /**
   * ✅ INTERCEPTAR Y MEJORAR DIÁLOGOS
   * Se aplica ANTES de enviar a voiceService
   */
  mejorarDialogo(
    videoId: string,
    segmentoIndex: number,
    dialogoOriginal: string,
    opciones: {
      sceneContext: string;
      emotion: string;
      characterName?: string;
      duration: number;
    }
  ): string {
    
    logger.info(`[Coherencia] 📝 Mejorando diálogo para video ${videoId}, segmento ${segmentoIndex}`);
    
    const keyAnterior = `${videoId}_${segmentoIndex - 1}`;
    const dialogoAnterior = this.dialogosAnteriores.get(keyAnterior);
    
    const dialogoMejorado = mejorarCoherenciaDialogo(dialogoOriginal, {
      previousDialogue: dialogoAnterior,
      ...opciones
    });
    
    // Guardar para próximo segmento
    const key = `${videoId}_${segmentoIndex}`;
    this.dialogosAnteriores.set(key, dialogoMejorado);
    
    logger.info(`[Coherencia] ✅ Diálogo mejorado: "${dialogoOriginal}" → "${dialogoMejorado}"`);
    return dialogoMejorado;
  }

  /**
   * ✅ INTERCEPTAR Y MEJORAR PROMPTS VISUALES  
   * Se aplica ANTES de enviar a klingService/fal.ai
   */
  mejorarPromptVisual(
    videoId: string,
    segmentoIndex: number,
    promptOriginal: string,
    opciones: {
      sceneTransition: 'cut' | 'fade' | 'dissolve';
      visualStyle: string;
      emotionalArc: string;
      timeOfDay?: string;
      location?: string;
    }
  ): string {
    
    logger.info(`[Coherencia] 🎬 Mejorando prompt visual para video ${videoId}, segmento ${segmentoIndex}`);
    
    const keyAnterior = `${videoId}_${segmentoIndex - 1}`;
    const promptAnterior = this.promptsAnteriores.get(keyAnterior);
    
    const promptMejorado = mejorarCoherenciaVisual(promptOriginal, {
      previousPrompt: promptAnterior,
      ...opciones
    });
    
    // Guardar para próximo segmento
    const key = `${videoId}_${segmentoIndex}`;
    this.promptsAnteriores.set(key, promptMejorado);
    
    logger.info(`[Coherencia] ✅ Prompt mejorado: "${promptOriginal}" → "${promptMejorado}"`);
    return promptMejorado;
  }

  /**
   * ✅ SELECCIONAR VOCES EXISTENTES EXITOSAS
   * Mapea a voces que ya sabes que funcionan bien
   */
  seleccionarVozOptima(
    personaje: string,
    genero: 'male' | 'female',
    estilo: string
  ): { voiceId: string; provider: 'murf' | 'elevenlabs' } {
    
    logger.info(`[Coherencia] 🎤 Seleccionando voz óptima para ${personaje} (${genero}, ${estilo})`);
    
    const vozSeleccionada = mapearVocesExistentes(personaje, genero, estilo);
    
    logger.info(`[Coherencia] ✅ Voz seleccionada: ${vozSeleccionada.voiceId} via ${vozSeleccionada.provider}`);
    return vozSeleccionada;
  }

  /**
   * ✅ VALIDAR PLAN COMPLETO ANTES DE PROCESARLO
   * Verifica coherencia general del plan de video
   */
  validarPlan(plan: any): {
    planValidado: any;
    esValido: boolean;
    problemas: string[];
    sugerencias: string[];
  } {
    
    logger.info(`[Coherencia] 📋 Validando plan completo...`);
    
    const validacion = validarCoherenciaPlan(plan);
    
    if (validacion.esCoherente) {
      logger.info('[Coherencia] ✅ Plan completamente coherente');
      return {
        planValidado: plan,
        esValido: true,
        problemas: [],
        sugerencias: []
      };
    } else {
      logger.warn(`[Coherencia] ⚠️ Plan con ${validacion.problemas.length} problemas:`);
      validacion.problemas.forEach(problema => logger.warn(`  - ${problema}`));
      
      return {
        planValidado: plan, // Por ahora no modificamos el plan, solo reportamos
        esValido: false,
        problemas: validacion.problemas,
        sugerencias: validacion.sugerencias
      };
    }
  }

  /**
   * ✅ LIMPIAR CACHE DE COHERENCIA
   * Útil entre videos para evitar interferencia
   */
  limpiarCache(videoId?: string): void {
    if (videoId) {
      // Limpiar solo un video específico
      for (const [key] of this.dialogosAnteriores) {
        if (key.startsWith(videoId)) {
          this.dialogosAnteriores.delete(key);
        }
      }
      for (const [key] of this.promptsAnteriores) {
        if (key.startsWith(videoId)) {
          this.promptsAnteriores.delete(key);
        }
      }
      logger.info(`[Coherencia] 🧹 Cache limpiado para video ${videoId}`);
    } else {
      // Limpiar todo
      this.dialogosAnteriores.clear();
      this.promptsAnteriores.clear();
      logger.info('[Coherencia] 🧹 Cache completo limpiado');
    }
  }

  /**
   * ✅ ESTADÍSTICAS DE COHERENCIA
   * Para debugging y métricas
   */
  obtenerEstadisticas(): {
    videosEnCache: number;
    dialogosCacheados: number;
    promptsCacheados: number;
    mejorAsRecientes: string[];
  } {
    
    const videosUnicos = new Set(
      [...this.dialogosAnteriores.keys(), ...this.promptsAnteriores.keys()]
        .map(key => key.split('_')[0])
    );

    return {
      videosEnCache: videosUnicos.size,
      dialogosCacheados: this.dialogosAnteriores.size,
      promptsCacheados: this.promptsAnteriores.size,
      mejorAsRecientes: Array.from(videosUnicos).slice(-5)
    };
  }
}

// Instancia singleton para usar en toda la aplicación
export const coherenciaMiddleware = new CoherenciaMiddleware();

/**
 * ✅ FUNCIÓN HELPER PARA INTEGRACIÓN FÁCIL
 * Aplica todas las mejoras de coherencia de una vez
 */
export function aplicarMejorAsCoherencia(
  videoId: string,
  segmentos: Array<{
    index: number;
    dialogo?: string;
    prompt?: string;
    duracion: number;
    emotion?: string;
    personaje?: string;
    genero?: 'male' | 'female';
  }>,
  configGeneral: {
    visualStyle: string;
    emotionalArc: string;
    timeOfDay?: string;
    location?: string;
  }
): Array<{
  index: number;
  dialogoMejorado?: string;
  promptMejorado?: string;
  vozRecomendada?: { voiceId: string; provider: 'murf' | 'elevenlabs' };
  duracion: number;
}> {
  
  logger.info(`[Coherencia] 🔄 Aplicando mejoras completas a ${segmentos.length} segmentos del video ${videoId}`);
  
  return segmentos.map(segmento => {
    const resultado: any = { index: segmento.index, duracion: segmento.duracion };
    
    // Mejorar diálogo si existe
    if (segmento.dialogo) {
      resultado.dialogoMejorado = coherenciaMiddleware.mejorarDialogo(
        videoId,
        segmento.index,
        segmento.dialogo,
        {
          sceneContext: `Segmento ${segmento.index} del video`,
          emotion: segmento.emotion || 'neutral',
          characterName: segmento.personaje,
          duration: segmento.duracion
        }
      );
    }
    
    // Mejorar prompt visual si existe
    if (segmento.prompt) {
      resultado.promptMejorado = coherenciaMiddleware.mejorarPromptVisual(
        videoId,
        segmento.index,
        segmento.prompt,
        {
          sceneTransition: segmento.index === 0 ? 'cut' : 'fade',
          ...configGeneral
        }
      );
    }
    
    // Recomendar voz óptima si hay personaje
    if (segmento.personaje && segmento.genero) {
      resultado.vozRecomendada = coherenciaMiddleware.seleccionarVozOptima(
        segmento.personaje,
        segmento.genero,
        configGeneral.visualStyle
      );
    }
    
    return resultado;
  });
}
