/**
 * 🚀 RUNWAY SERVICE - Wrapper para runwayCommercial.ts
 * Integra el sistema de generación Runway Gen-4 Turbo con el pipeline principal
 */

import { 
  buildRunwayCommercialPrompt, 
  submitRunwayRequest, 
  waitForRunwayCompletion,
  RUNWAY_BUSINESS_TEMPLATES,
  createAdvancedRunwayRequest,
  RunwayRequest 
} from './videoGeneration/runwayCommercial.js';
import { ConceptoVisual } from './llmService/estilos/marketing/creativeDirector.js';
import { logger } from '../utils/logger.js';

export interface RunwayGenerationRequest {
  userImage: string;
  concept: ConceptoVisual;
  businessAnalysis: any;
  advanced?: {
    enhanceQuality?: boolean;
    prioritizeSpeed?: boolean;
    customSeed?: number;
    extendDuration?: boolean;
  };
}

export class RunwayService {
  private static instance: RunwayService;

  private constructor() {}

  public static getInstance(): RunwayService {
    if (!RunwayService.instance) {
      RunwayService.instance = new RunwayService();
    }
    return RunwayService.instance;
  }

  /**
   * 🎬 GENERAR VIDEO COMERCIAL CON RUNWAY GEN-4 TURBO
   */
  async generateCommercialVideo(request: RunwayGenerationRequest): Promise<string> {
    logger.info(`[RunwayService] 🚀 Iniciando generación comercial con Runway Gen-4 Turbo`);

    try {
      // 1. Construir prompt optimizado para Runway
      const runwayRequest = buildRunwayCommercialPrompt(
        request.userImage,
        request.concept,
        request.businessAnalysis
      );

      // 2. Aplicar configuraciones avanzadas si se proporcionan
      const finalRequest = request.advanced 
        ? createAdvancedRunwayRequest(runwayRequest, request.advanced)
        : runwayRequest;

      logger.info(`[RunwayService] 📝 Prompt generado: ${finalRequest.promptText.substring(0, 100)}...`);

      // 3. Verificar API key
      if (!process.env.RUNWAY_API_KEY) {
        throw new Error('RUNWAY_API_KEY no configurada');
      }

      // 4. Enviar solicitud a Runway
      const taskId = await submitRunwayRequest(finalRequest);
      logger.info(`[RunwayService] ⏳ Tarea enviada: ${taskId}`);

      // 5. Esperar completación
      const videoUrl = await waitForRunwayCompletion(taskId, 300); // 5 minutos max
      logger.info(`[RunwayService] ✅ Video generado: ${videoUrl.substring(0, 50)}...`);

      return videoUrl;

    } catch (error) {
      logger.error('[RunwayService] ❌ Error en generación:', error);
      throw error;
    }
  }

  /**
   * 🎯 GENERAR CON TEMPLATE DE NEGOCIO ESPECÍFICO
   */
  async generateWithBusinessTemplate(
    businessType: 'concierge' | 'restaurant' | 'boutique' | 'product',
    userImage: string,
    customPrompt?: string
  ): Promise<string> {
    logger.info(`[RunwayService] 🏢 Generando para tipo de negocio: ${businessType}`);

    const template = RUNWAY_BUSINESS_TEMPLATES[businessType];
    
    // Crear concepto basado en template
    const concept: ConceptoVisual = {
      transformacionesImagen: {
        movimientoCamara: template.preferredMovements[0] as any,
        estilo: 'commercial',
        transiciones: 'smooth',
        efectosVisuales: [template.specialElements],
        iluminacion: 'corporate',
        anguloCamara: 'medium-shot'
      },
      musicaRecomendada: {
        genero: 'corporate',
        intensidad: 'media',
        duracion: 10
      },
      palettaColores: ['#000000', '#FFFFFF', '#CCCCCC'],
      overlayTextos: [],
      engineRecommendation: {
        preferredEngine: 'runway',
        reason: 'Business template optimized for Runway Gen-4 Turbo',
        confidence: 0.9
      },
      requiresActors: false,
      visualComplexity: 'simple'
    };

    const businessAnalysis = {
      businessType: businessType,
      brandPersonality: 'professional',
      preferredPlatforms: ['instagram', 'linkedin']
    };

    return this.generateCommercialVideo({
      userImage,
      concept,
      businessAnalysis,
      advanced: {
        enhanceQuality: true,
        prioritizeSpeed: false
      }
    });
  }

  /**
   * 📊 VALIDAR CONFIGURACIÓN
   */
  validateConfiguration(): boolean {
    const hasApiKey = !!process.env.RUNWAY_API_KEY;
    
    if (!hasApiKey) {
      logger.error('[RunwayService] ❌ RUNWAY_API_KEY no configurada');
      return false;
    }

    logger.info('[RunwayService] ✅ Configuración válida');
    return true;
  }

  /**
   * 🧪 TEST CONNECTION
   */
  async testConnection(): Promise<boolean> {
    try {
      // Simple test to check if API is accessible
      const response = await fetch('https://api.runwayml.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const isValid = response.ok;
      logger.info(`[RunwayService] 🔌 Conexión: ${isValid ? '✅ OK' : '❌ FALLO'}`);
      
      return isValid;

    } catch (error) {
      logger.error('[RunwayService] ❌ Error probando conexión:', error);
      return false;
    }
  }
}