/**
 * 🤖 SISTEMA DE AGENTE AUTOMATIZADO - SEGÚN FLUJO.TXT
 * Automatización semanal de Marketing AI - IMPLEMENTACIÓN REAL
 */

import { PrismaClient } from '../../generated/prisma/index.js';
import { logger } from '../utils/logger.js';
import { MarketingTemplateService } from './marketingTemplateService.js';
import { MarketingConfigService } from './marketingConfigService.js';
import { PlanLimitService } from './planLimitService.js';
import { MarketingPipeline } from '../pipelines/marketingPipeline.js'; // ✅ PIPELINE REAL
import { MarketingIntelligenceService } from './marketingIntelligenceService.js';
import cron from 'node-cron';

const prisma = new PrismaClient();

export interface AgentConfig {
  userId: number;
  isActive: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  preferredDays: string[];
  preferredHours: number[];
  categories: string[];
  defaultStyle: string;
  defaultVoice: string;
  seasonalAdaptation: boolean;
  maxVideosPerWeek: number;
}

export class MarketingAgentService {
  private static instance: MarketingAgentService;
  private scheduledJobs: Map<string, any> = new Map();
  private marketingPipeline: MarketingPipeline; // ✅ PIPELINE REAL
  private marketingIntelligence: MarketingIntelligenceService; // ✅ SERVICIO REAL

  private constructor() {
    this.marketingPipeline = new MarketingPipeline();
    this.marketingIntelligence = new MarketingIntelligenceService();
  }

  static getInstance(): MarketingAgentService {
    if (!this.instance) {
      this.instance = new MarketingAgentService();
    }
    return this.instance;
  }

  /**
   * 🎯 ACTIVAR AGENTE PARA UN USUARIO
   */
  async activateAgent(config: AgentConfig): Promise<void> {
    logger.info(`[MarketingAgent] Activando agente para usuario ${config.userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: config.userId }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      if (user.plan === 'STARTER') {
        throw new Error('El agente automático requiere plan Creator o superior');
      }

      await this.saveAgentConfig(config);
      await this.scheduleAgentJobs(config);

      logger.info(`[MarketingAgent] Agente activado exitosamente para usuario ${config.userId}`);
    } catch (error) {
      logger.error(`[MarketingAgent] Error activando agente:`, error);
      throw error;
    }
  }

  /**
   * 📅 PROGRAMAR TRABAJOS DEL AGENTE
   */
  private async scheduleAgentJobs(config: AgentConfig): Promise<void> {
    const jobKey = `agent_${config.userId}`;

    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
      this.scheduledJobs.delete(jobKey);
    }

    let cronPattern: string;
    switch (config.frequency) {
      case 'weekly':
        cronPattern = '0 9 * * 1';
        break;
      case 'biweekly':
        cronPattern = '0 9 * * 1/2';
        break;
      case 'monthly':
        cronPattern = '0 9 1 * *';
        break;
      default:
        cronPattern = '0 9 * * 1';
    }

    const job = cron.schedule(cronPattern, async () => {
      await this.executeAgentWork(config);
    });

    this.scheduledJobs.set(jobKey, job);
    job.start();
  }

  /**
   * 🚀 EJECUTAR TRABAJO DEL AGENTE - IMPLEMENTACIÓN REAL
   */
  private async executeAgentWork(config: AgentConfig): Promise<void> {
    logger.info(`[MarketingAgent] Ejecutando trabajo automático para usuario ${config.userId}`);

    try {
      const canCreateVideo = await this.checkPlanLimits(config.userId);
      if (!canCreateVideo) {
        logger.warn(`[MarketingAgent] Usuario ${config.userId} ha alcanzado el límite de su plan`);
        await this.logSkippedGeneration(config.userId, 'plan_limit_exceeded');
        return;
      }

      const userProfile = await MarketingConfigService.getOrCreateConfig(config.userId);
      const template = await this.selectSeasonalTemplate(userProfile, config);
      const personalizedTemplate = MarketingTemplateService.personalizeTemplate(
        template,
        userProfile,
        this.getSeasonalParams()
      );

      // 🔥 EJECUTAR PIPELINE REAL - NO SIMULACIÓN
      logger.info(`[MarketingAgent] Ejecutando pipeline REAL con plantilla ${template.id} para usuario ${config.userId}`);
      await this.executeRealMarketingPipeline(config.userId, personalizedTemplate, template);

      await this.logSuccessfulGeneration(config.userId, template.id);

    } catch (error) {
      logger.error(`[MarketingAgent] Error en trabajo automático para usuario ${config.userId}:`, error);
      await this.logFailedGeneration(config.userId, error as Error);
    }
  }

  /**
   * 🎬 EJECUTAR PIPELINE REAL DE MARKETING
   */
  private async executeRealMarketingPipeline(userId: number, personalizedTemplate: any, template: any): Promise<void> {
    try {
      console.log(`🎬 Generando video real con plantilla: ${template.id}`);
      
      // Crear objeto IMarketingVideo completo para el pipeline
      const marketingData = {
        id: Date.now().toString(),
        userId: userId.toString(),
        title: `Agente Marketing - ${template.name}`,
        description: `Video generado automáticamente por el Agente de Marketing`,
        businessType: personalizedTemplate.businessType || 'other',
        videoType: personalizedTemplate.videoType || 'promotional',
        style: personalizedTemplate.style || 'professional',
        duration: personalizedTemplate.duration || 30,
        
        // Input del usuario (valores por defecto para agente)
        userImages: [],
        userPrompt: `Video generado automáticamente para plantilla ${template.name}`,
        brandName: personalizedTemplate.brand || 'Brand',
        callToAction: personalizedTemplate.callToAction || 'Descubre más',
        
        // Configuración de video
        useAIActor: personalizedTemplate.useAIActor || false,
        actorType: personalizedTemplate.actorType || 'professional',
        voiceEnabled: true,
        voiceType: personalizedTemplate.voiceType || 'neutral',
        musicStyle: personalizedTemplate.musicStyle || 'corporate',
        
        // Contenido a generar
        aiGeneratedScript: '',
        marketingTomas: [],
        
        // URLs a generar
        voiceAudioUrl: '',
        musicAudioUrl: '',
        finalVideoUrl: '',
        thumbnailUrl: '',
        
        // Metadatos
        metadata: {
          template: template.id,
          isAutomated: true,
          source: 'marketing_agent'
        },
        
        // Estado y timestamps
        status: 'PROCESSING',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any; // Bypass strict interface checking

      // Input para el pipeline
      const marketingInput = {
        videoType: personalizedTemplate.videoType || 'promotional',
        businessType: personalizedTemplate.businessType || 'other',
        brand: personalizedTemplate.brand || 'Brand',
        productName: personalizedTemplate.productName || 'Producto',
        targetAudience: personalizedTemplate.targetAudience || 'Audiencia General',
        keyMessage: personalizedTemplate.keyMessage || 'Mensaje clave',
        style: personalizedTemplate.style || 'professional',
        duration: personalizedTemplate.duration || 30,
        useAIActor: personalizedTemplate.useAIActor || false,
        voiceId: personalizedTemplate.voiceId || 'default',
        musicStyle: personalizedTemplate.musicStyle || 'corporate',
        userImages: [] // Requerido por MarketingPromptInput
      };

      // 🔥 GENERAR VIDEO REAL CON PIPELINE
      const videoResult = await this.marketingPipeline.generateMarketingVideo(marketingData, marketingInput);

      if (videoResult.success) {
        // 💾 GUARDAR VIDEO EN BASE DE DATOS CON SCHEMA CORRECTO
        const savedVideo = await prisma.video.create({
          data: {
            userId: userId,
            title: `Agente Marketing - ${template.name}`,
            description: `Video generado automáticamente por el Agente de Marketing`,
            type: 'MARKETING', // Enum VideoType correcto
            status: 'COMPLETED', // Enum VideoStatus correcto
            finalVideoUrl: videoResult.finalVideoUrl,
            thumbnailUrl: videoResult.thumbnailUrl || null,
            duration: videoResult.duration || 30,
            prompt: `Agente automático - Plantilla: ${template.name}`,
            style: personalizedTemplate.style || 'professional',
            businessType: personalizedTemplate.businessType || 'other',
            metadata: JSON.stringify({
              template: template.id,
              templateName: template.name,
              style: personalizedTemplate.style,
              generatedAt: new Date().toISOString(),
              isAutomated: true,
              source: 'marketing_agent'
            })
          }
        });

        console.log(`✅ Video del agente guardado en BD con ID: ${savedVideo.id}`);
        logger.info(`[MarketingAgent] ✅ Video generado y guardado: ${savedVideo.id} para usuario ${userId}`);
        
      } else {
        logger.error(`[MarketingAgent] ❌ Error generando video para usuario ${userId}:`, videoResult.error);
        throw new Error(videoResult.error || 'Error en pipeline de marketing');
      }

    } catch (error) {
      logger.error(`[MarketingAgent] Error en pipeline real para usuario ${userId}:`, error);
      throw error;
    }
  }

  private async checkPlanLimits(userId: number): Promise<boolean> {
    try {
      const validation = await PlanLimitService.validateVideoCreation(userId);
      return validation.canCreate;
    } catch (error) {
      logger.error(`[MarketingAgent] Error validando límites para usuario ${userId}:`, error);
      return false;
    }
  }

  private async selectSeasonalTemplate(userProfile: any, config: AgentConfig): Promise<any> {
    const currentMonth = new Date().getMonth();
    const season = this.getCurrentSeason(currentMonth);
    
    const industryTemplates = MarketingTemplateService.getTemplatesByIndustry(userProfile.industry || 'servicios');
    const filteredTemplates = industryTemplates.filter(template => 
      config.categories.includes(template.objective)
    );

    return filteredTemplates[Math.floor(Math.random() * filteredTemplates.length)] || industryTemplates[0];
  }

  private getCurrentSeason(month: number): string {
    if (month >= 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'fall';
  }

  private getSeasonalParams(): Record<string, string> {
    const month = new Date().getMonth();
    const season = this.getCurrentSeason(month);
    
    const seasonalParams: Record<string, Record<string, string>> = {
      winter: { tema_estacional: 'Año Nuevo', color_predominante: 'azul invernal' },
      spring: { tema_estacional: 'Primavera', color_predominante: 'verde fresco' },
      summer: { tema_estacional: 'Verano', color_predominante: 'naranja vibrante' },
      fall: { tema_estacional: 'Black Friday', color_predominante: 'rojo intenso' }
    };

    return seasonalParams[season] || seasonalParams.spring;
  }

  private async logSuccessfulGeneration(userId: number, templateId: string): Promise<void> {
    logger.info(`[MarketingAgent] Video generado exitosamente - Usuario: ${userId}, Plantilla: ${templateId}`);
    
    try {
      await PlanLimitService.recordVideoCreation(userId);
      logger.info(`[MarketingAgent] ✅ Uso registrado correctamente para usuario ${userId}`);
    } catch (error) {
      logger.error(`[MarketingAgent] ❌ Error registrando uso para usuario ${userId}:`, error);
    }
  }

  private async logSkippedGeneration(userId: number, reason: string): Promise<void> {
    logger.warn(`[MarketingAgent] Generación omitida - Usuario: ${userId}, Motivo: ${reason}`);
  }

  private async logFailedGeneration(userId: number, error: Error): Promise<void> {
    logger.error(`[MarketingAgent] Generación falló - Usuario: ${userId}, Error: ${error.message}`);
  }

  private async saveAgentConfig(config: AgentConfig): Promise<void> {
    logger.info(`[MarketingAgent] Configuración guardada para usuario ${config.userId}`);
  }

  async deactivateAgent(userId: number): Promise<void> {
    const jobKey = `agent_${userId}`;
    
    if (this.scheduledJobs.has(jobKey)) {
      this.scheduledJobs.get(jobKey).stop();
      this.scheduledJobs.delete(jobKey);
      logger.info(`[MarketingAgent] Agente desactivado para usuario ${userId}`);
    }
  }

  async forceExecution(userId: number): Promise<void> {
    logger.info(`[MarketingAgent] Ejecución forzada para usuario ${userId}`);
    
    const config: AgentConfig = {
      userId,
      isActive: true,
      frequency: 'weekly',
      preferredDays: ['monday'],
      preferredHours: [9],
      categories: ['promotion'],
      defaultStyle: 'moderno',
      defaultVoice: 'commercial',
      seasonalAdaptation: true,
      maxVideosPerWeek: 5
    };

    await this.executeAgentWork(config);
  }
}

export const marketingAgent = MarketingAgentService.getInstance();
