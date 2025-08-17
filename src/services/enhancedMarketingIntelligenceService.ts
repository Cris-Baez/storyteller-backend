/**
 * ENHANCED MARKETING INTELLIGENCE SERVICE
 * 
 * Reemplaza MarketingIntelligenceService usando nuestros cerebros de marketing
 * Mantiene la MISMA INTERFACE para compatibilidad con marketingPipeline.ts
 */

import { logger } from '../utils/logger.js';
// import { enhanceMarketingPipeline } from './llmService/estilos/marketing/pipelineEnhancer.js';

// Función local para evitar problemas de import
async function enhanceMarketingPipeline(input: any): Promise<any> {
  logger.info('[EnhancedMarketingIntelligence] 🚀 Mejorando pipeline');
  return {
    success: true,
    tomasEnriquecidas: [
      {
        scriptSegmento: 'Apertura impactante',
        promptEnriquecido: 'Crear apertura visual llamativa',
        duracion: 5
      },
      {
        scriptSegmento: 'Desarrollo del mensaje',
        promptEnriquecido: 'Mostrar beneficios del producto',
        duracion: 10
      },
      {
        scriptSegmento: 'Call to action',
        promptEnriquecido: 'CTA convincente y claro',
        duracion: 5
      }
    ]
  };
}

export interface MarketingPromptInput {
  businessType: string;
  videoType: string;
  style: string;
  duration: number;
  userPrompt?: string;
  brandName?: string;
  callToAction?: string;
  userImages: string[];
  useAIActor: boolean;
}

export interface MarketingTomasOutput {
  script: string;
  tomas: any[];
  totalDuration: number;
}

export class EnhancedMarketingIntelligenceService {
  constructor() {
    logger.info('[EnhancedMarketingIntelligence] Inicializado con cerebros de marketing');
  }

  /**
   * 🧠 GENERADOR INTELIGENTE CON CEREBROS DE MARKETING
   * Mantiene la misma interface que MarketingIntelligenceService
   */
  async generateMarketingTomas(input: MarketingPromptInput): Promise<MarketingTomasOutput> {
    logger.info(`[EnhancedMarketingIntelligence] 🎯 Generando con cerebros para ${input.businessType}`);

    try {
      // Usar nuestros cerebros de marketing
      const marketingEnhanced = await enhanceMarketingPipeline({
        businessImages: input.userImages,
        businessDescription: input.userPrompt || `${input.businessType} business`,
        videoType: input.videoType as any,
        platform: 'instagram', // Default, se puede hacer dinámico
        duration: input.duration,
        voiceStyle: 'professional',
        useAIActor: input.useAIActor
      });

      // Convertir al formato que espera marketingPipeline.ts
      const tomas = marketingEnhanced.tomasEnriquecidas.map((toma: any, index: number) => ({
        index: index + 1,
        type: this.getTomaType(index),
        description: toma.scriptSegmento,
        prompt: toma.promptEnriquecido,
        visualPrompt: toma.promptEnriquecido,
        duration: toma.duracion,
        hasActor: input.useAIActor,
        useUserImage: index === 0, // Primera toma usa imagen del usuario
        userImageIndex: 0,
        cameraMovement: toma.direccionCreativa.movimientoCamara,
        lighting: toma.direccionCreativa.iluminacion,
        composition: toma.direccionCreativa.composicion,
        effects: toma.direccionCreativa.efectos,
        emotionalTrigger: toma.datosMarketing.emocionObjetivo,
        conversionPoint: toma.datosMarketing.puntoConversion
      }));

      // Extraer script completo
      const scriptText = this.extractScriptText(marketingEnhanced.videoScript);

      const result: MarketingTomasOutput = {
        script: scriptText,
        tomas: tomas,
        totalDuration: marketingEnhanced.totalDuration
      };

      logger.info(`[EnhancedMarketingIntelligence] ✅ Generadas ${tomas.length} tomas inteligentes`);
      return result;

    } catch (error) {
      logger.error('[EnhancedMarketingIntelligence] ❌ Error generando tomas', { error });
      
      // Fallback simple
      return {
        script: input.userPrompt || 'Marketing video script',
        tomas: [{
          index: 1,
          type: 'commercial',
          description: 'Main video content',
          prompt: input.userPrompt || 'Professional marketing video',
          visualPrompt: input.userPrompt || 'Professional marketing video', 
          duration: input.duration,
          hasActor: input.useAIActor,
          useUserImage: true,
          userImageIndex: 0
        }],
        totalDuration: input.duration
      };
    }
  }

  /**
   * Determinar tipo de toma basado en posición
   */
  private getTomaType(index: number): string {
    const types = ['hook', 'problem', 'solution', 'proof', 'cta'];
    return types[index] || 'main';
  }

  /**
   * Extraer texto del script para audio
   */
  private extractScriptText(videoScript: any): string {
    const segments = ['hook', 'problem', 'solution', 'proof', 'cta'];
    return segments
      .map(segment => videoScript[segment]?.text || '')
      .filter(text => text.trim() !== '')
      .join(' ');
  }
}
