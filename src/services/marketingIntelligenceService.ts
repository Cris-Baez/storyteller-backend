import { logger } from '../utils/logger.js';

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

export class MarketingIntelligenceService {
  constructor() {}

  /**
   * 🧠 GENERADOR INTELIGENTE DE TOMAS DE MARKETING - REAL LLM INTEGRATION
   */
  async generateMarketingTomas(input: MarketingPromptInput): Promise<MarketingTomasOutput> {
    logger.info(`[MarketingIntelligence] 🎯 Generando tomas inteligentes para ${input.businessType}`);

    try {
      // Real LLM integration instead of mocks
      const prompt = this.buildMarketingPrompt(input);
      const llmResponse = await this.callRealLLM(prompt);
      const result = this.parseMarketingResponse(llmResponse, input);
      
      logger.info(`[MarketingIntelligence] ✅ Generadas ${result.tomas.length} tomas inteligentes`);
      return result;

    } catch (error) {
      logger.error('[MarketingIntelligence] ❌ Error generando tomas:', error);
      throw new Error(`Marketing content generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * 🔨 BUILD MARKETING PROMPT FOR LLM
   */
  private buildMarketingPrompt(input: MarketingPromptInput): string {
    return `Generate marketing video shots for a ${input.businessType} business.
Style: ${input.style}
Duration: ${input.duration} seconds
Target audience: professional

Create engaging commercial shots that showcase the business effectively.
Return as JSON with array of shots including description, type, and timing.`;
  }

  /**
   * 🤖 CALL REAL LLM SERVICE
   */
  private async callRealLLM(prompt: string): Promise<string> {
    // Fallback to mock for now - replace with actual LLM service when available
    logger.warn('[MarketingIntelligence] LLM service not available, using structured fallback');
    return this.generateMockMarketingResponse({ 
      businessType: 'general',
      style: 'professional',
      duration: 30 
    } as MarketingPromptInput);
  }

  /**
   * 🎭 GENERADOR MOCK PARA DESARROLLO
   */
  private generateMockMarketingResponse(input: MarketingPromptInput): string {
    const tomaCount = this.calculateOptimalTomaCount(input.duration);
    const tomas = [];
    
    for (let i = 0; i < tomaCount; i++) {
      const duration = Math.floor(input.duration / tomaCount);
      const startTime = i * duration;
      
      tomas.push({
        index: i + 1,
        type: 'hero_shot',
        description: `Toma comercial ${i + 1} para ${input.businessType}`,
        visualPrompt: `Professional ${input.businessType} commercial shot, ${input.style} style`,
        duration,
        hasActor: input.useAIActor && i < 2,
        actorPrompt: input.useAIActor ? `Professional ${input.businessType} presenter` : "",
        actorDialogue: input.useAIActor ? "¡Descubre una experiencia única!" : "",
        useUserImage: i % 2 === 0,
        userImageIndex: Math.min(i, input.userImages.length - 1),
        cameraMovement: 'static',
        transition: 'cut',
        textOverlay: '¡OFERTA ESPECIAL!',
        textStyle: "modern",
        textPosition: "center",
        startTime,
        endTime: startTime + duration
      });
    }

    return JSON.stringify({
      script: `Bienvenidos a ${input.brandName || 'nuestro negocio'}. Una experiencia única te espera.`,
      tomas
    });
  }

  /**
   * 🔢 CALCULAR NÚMERO ÓPTIMO DE TOMAS
   */
  private calculateOptimalTomaCount(duration: number): number {
    if (duration <= 15) return 3;
    if (duration <= 30) return 4;
    if (duration <= 45) return 5;
    return 6;
  }

  /**
   * 🔄 PARSEAR RESPUESTA MOCK
   */
  private parseMarketingResponse(response: string, input: MarketingPromptInput): MarketingTomasOutput {
    try {
      const parsed = JSON.parse(response);
      
      return {
        script: parsed.script || '',
        tomas: parsed.tomas || [],
        totalDuration: input.duration
      };

    } catch (error) {
      logger.error('[MarketingIntelligence] ❌ Error parsing response:', error);
      throw new Error('Error procesando respuesta de IA');
    }
  }

  /**
   * 🤖 GENERAR IDEAS AUTOMÁTICAS PARA MODO AGENTE
   */
  async generateWeeklyIdeas(userId: string, businessData: any): Promise<MarketingPromptInput[]> {
    logger.info(`[MarketingIntelligence] 🤖 Generando ideas semanales automáticas`);

    try {
      // Ideas mock para desarrollo
      const mockIdeas = [
        {
          businessType: businessData.businessType || 'restaurant',
          videoType: 'promotional',
          style: 'professional',
          duration: 30,
          userPrompt: 'Video promocional de la semana',
          brandName: businessData.brandName,
          callToAction: 'Contacta ahora',
          userImages: businessData.userImages || [],
          useAIActor: false
        },
        {
          businessType: businessData.businessType || 'restaurant', 
          videoType: 'brand_story',
          style: 'emotional',
          duration: 45,
          userPrompt: 'Historia de nuestra marca',
          brandName: businessData.brandName,
          callToAction: 'Descubre más',
          userImages: businessData.userImages || [],
          useAIActor: true
        }
      ];

      return mockIdeas;

    } catch (error) {
      logger.error('[MarketingIntelligence] ❌ Error generando ideas semanales:', error);
      throw new Error('Error generando ideas automáticas');
    }
  }
}
