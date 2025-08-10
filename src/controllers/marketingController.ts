import { Request, Response } from 'express';
import { MarketingPipeline, MarketingGenerationResult } from '../pipelines/marketingPipeline.js';
import { MarketingIntelligenceService, MarketingPromptInput } from '../services/marketingIntelligenceService.js';
import { IMarketingVideo } from '../models/Marketing.js';
import { UserService } from '../models/User.js';
import { PlanLimitService } from '../services/planLimitService.js';
import { logger } from '../utils/logger.js';

export interface CreateMarketingVideoRequest {
  userId: string;
  title: string;
  description?: string;
  businessType: 'restaurant' | 'spa' | 'retail' | 'fitness' | 'beauty' | 'tech' | 'services' | 'other';
  videoType: 'promotional' | 'brand_story' | 'product_showcase' | 'testimonial' | 'event_announcement' | 'social_media';
  style: 'professional' | 'casual' | 'energetic' | 'emotional' | 'luxury' | 'minimalist';
  duration: 15 | 30 | 45 | 60;
  userImages: string[];
  userPrompt?: string;
  brandName?: string;
  callToAction?: string;
  useAIActor?: boolean;
  voiceEnabled?: boolean;
  voiceType?: 'male' | 'female' | 'neutral';
  musicStyle?: 'upbeat' | 'corporate' | 'emotional' | 'energetic' | 'minimal' | 'none';
}

export class MarketingController {
  private marketingPipeline: MarketingPipeline;
  private marketingIntelligence: MarketingIntelligenceService;

  constructor() {
    this.marketingPipeline = new MarketingPipeline();
    this.marketingIntelligence = new MarketingIntelligenceService();
  }

  /**
   * 🎯 CREAR VIDEO MARKETING MANUAL
   */
  async createMarketingVideo(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[MarketingController] 🎯 Creando video marketing [${requestId}]`);

    try {
      const requestData: CreateMarketingVideoRequest = req.body;

      // Validar datos básicos
      if (!requestData.userId || !requestData.title || !requestData.businessType || !requestData.videoType) {
        res.status(400).json({
          success: false,
          error: 'Faltan datos requeridos: userId, title, businessType, videoType',
          requestId
        });
        return;
      }

      // 🔒 VALIDAR USUARIO Y LÍMITES
      const user = await UserService.findById(parseInt(requestData.userId));
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          requestId
        });
        return;
      }

      // Validar suscripción activa
      if (!UserService.isSubscriptionActive(user)) {
        res.status(403).json({
          success: false,
          error: 'Suscripción inactiva o expirada',
          code: 'SUBSCRIPTION_INACTIVE',
          details: {
            currentPlan: user.plan,
            subscriptionStatus: user.subscription?.status || 'INACTIVE'
          },
          requestId
        });
        return;
      }

      // Validar límites de videos con PlanLimitService
      const planValidation = await PlanLimitService.validateVideoCreation(parseInt(requestData.userId));
      if (!planValidation.canCreate) {
        res.status(403).json({
          success: false,
          error: planValidation.reason || 'Límite de plan alcanzado',
          code: 'PLAN_LIMIT_EXCEEDED',
          details: {
            currentPlan: user.plan,
            videosCreated: planValidation.currentUsage,
            weeklyLimit: planValidation.maxAllowed,
            resetDate: planValidation.resetDate
          },
          requestId
        });
        return;
      }

      // Validar límites de videos (legacy)
      const canCreate = await UserService.canCreateVideo(parseInt(requestData.userId));
      if (!canCreate) {
        const limits = await UserService.getPlanLimits(user.plan);
        res.status(403).json({
          success: false,
          error: 'Límite de videos alcanzado para esta semana',
          code: 'VIDEO_LIMIT_EXCEEDED',
          details: {
            currentPlan: user.plan,
            weeklyLimit: limits.videosPerWeek,
            videosThisWeek: user.usage?.videosThisWeek || 0,
            resetDate: user.usage?.weekResetDate
          },
          requestId
        });
        return;
      }

      // Preparar input para el pipeline
      const pipelineInput: MarketingPromptInput = {
        businessType: requestData.businessType,
        videoType: requestData.videoType,
        style: requestData.style,
        duration: requestData.duration,
        userPrompt: requestData.userPrompt,
        brandName: requestData.brandName,
        callToAction: requestData.callToAction,
        userImages: requestData.userImages,
        useAIActor: requestData.useAIActor || false
      };

      // Respuesta inmediata al cliente
      res.status(202).json({
        success: true,
        message: 'Video marketing iniciado',
        requestId,
        estimatedTime: this.calculateEstimatedTime(requestData.duration),
        status: 'generating'
      });

      // Generar video de forma asíncrona
      this.generateVideoAsync(requestData, pipelineInput, requestId);

    } catch (error) {
      logger.error(`[MarketingController] ❌ Error creando video [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🤖 ACTIVAR MODO AGENTE
   */
  async activateAgent(req: Request, res: Response): Promise<void> {
    logger.info(`[MarketingController] 🤖 Activando modo agente`);

    try {
      const { userId, businessType, weeklyFrequency = 3 } = req.body;

      if (!userId || !businessType) {
        res.status(400).json({
          success: false,
          error: 'userId y businessType son requeridos'
        });
        return;
      }

      // 🔒 VALIDAR USUARIO Y LÍMITES  
      const user = await UserService.findById(parseInt(userId));
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
        return;
      }

      // Validar suscripción activa
      if (!UserService.isSubscriptionActive(user)) {
        res.status(403).json({
          success: false,
          error: 'Suscripción inactiva o expirada',
          code: 'SUBSCRIPTION_INACTIVE',
          details: {
            currentPlan: user.plan,
            subscriptionStatus: user.subscription?.status || 'INACTIVE'
          }
        });
        return;
      }

      // Generar ideas automáticas
      const businessData = {
        businessType,
        brandName: req.body.brandName,
        userImages: req.body.userImages || []
      };

      const weeklyIdeas = await this.marketingIntelligence.generateWeeklyIdeas(userId, businessData);

      res.json({
        success: true,
        message: 'Modo agente activado exitosamente',
        agentConfig: {
          weeklyFrequency,
          autoPublish: false,
          learningEnabled: true
        },
        weeklyIdeas: weeklyIdeas.map(idea => ({
          title: `Video ${idea.videoType}`,
          videoType: idea.videoType,
          style: idea.style,
          duration: idea.duration,
          userPrompt: idea.userPrompt,
          callToAction: idea.callToAction
        }))
      });

    } catch (error) {
      logger.error(`[MarketingController] ❌ Error activando agente:`, error);
      res.status(500).json({
        success: false,
        error: 'Error activando modo agente'
      });
    }
  }

  /**
   * 📊 OBTENER ESTADO DE VIDEO
   */
  async getVideoStatus(req: Request, res: Response): Promise<void> {
    const { requestId } = req.params;
    
    try {
      res.json({
        success: true,
        requestId,
        status: 'generating',
        progress: 65,
        estimatedTimeRemaining: 45,
        currentStep: 'Generando clips de video...',
        totalSteps: 5,
        currentStepNumber: 3
      });

    } catch (error) {
      logger.error(`[MarketingController] ❌ Error obteniendo estado:`, error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estado del video'
      });
    }
  }

  /**
   * 📱 OBTENER HISTORIAL DE VIDEOS
   */
  async getVideoHistory(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    try {
      const videos = [
        {
          id: '1',
          title: 'Promoción Restaurante',
          businessType: 'restaurant',
          videoType: 'promotional',
          status: 'completed',
          finalVideoUrl: 'https://cdn.example.com/video1.mp4',
          duration: 30,
          createdAt: new Date(Date.now() - 86400000),
          isAgentMode: false
        }
      ];

      res.json({
        success: true,
        videos,
        total: videos.length
      });

    } catch (error) {
      logger.error(`[MarketingController] ❌ Error obteniendo historial:`, error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo historial de videos'
      });
    }
  }

  /**
   * 🎨 OBTENER PLANTILLAS/PRESETS
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const templates = [
        {
          id: 'restaurant_promo',
          name: 'Promoción Restaurante',
          businessType: 'restaurant',
          videoType: 'promotional',
          style: 'energetic',
          duration: 30,
          description: 'Video promocional para mostrar platos y atraer clientes'
        },
        {
          id: 'spa_relaxing',
          name: 'Spa Relajante',
          businessType: 'spa',
          videoType: 'brand_story',
          style: 'emotional',
          duration: 45,
          description: 'Video relajante para mostrar experiencia de bienestar'
        }
      ];

      res.json({
        success: true,
        templates
      });

    } catch (error) {
      logger.error(`[MarketingController] ❌ Error obteniendo plantillas:`, error);
      res.status(500).json({
        success: false,
        error: 'Error obteniendo plantillas'
      });
    }
  }

  /**
   * ⚡ GENERACIÓN ASÍNCRONA DE VIDEO
   */
  private async generateVideoAsync(
    requestData: CreateMarketingVideoRequest,
    pipelineInput: MarketingPromptInput,
    requestId: string
  ): Promise<void> {
    
    try {
      logger.info(`[MarketingController] ⚡ Iniciando generación asíncrona [${requestId}]`);

      // Crear objeto marketingVideo con propiedades esenciales
      const marketingVideo = {
        title: requestData.title,
        businessType: requestData.businessType,
        style: requestData.style,
        voiceType: requestData.voiceType || 'neutral',
        voiceEnabled: requestData.voiceEnabled || false,
        musicStyle: requestData.musicStyle || 'upbeat',
        actorType: 'professional', // Default
        brandName: requestData.brandName || '',
        callToAction: requestData.callToAction || 'Contacta ahora',
        targetDuration: requestData.duration,
        
        // Campos que se llenarán durante la generación
        marketingTomas: [],
        status: 'generating',
        aiGeneratedScript: '',
        finalVideoUrl: '',
        thumbnailUrl: '',
        voiceAudioUrl: '',
        backgroundMusicUrl: '',
        soundEffectsUrls: []
      } as any; // Usar any temporalmente para evitar problemas de tipos

      const result: MarketingGenerationResult = await this.marketingPipeline.generateMarketingVideo(
        marketingVideo,
        pipelineInput
      );

      if (result.success) {
        logger.info(`[MarketingController] ✅ Video marketing completado [${requestId}]`, {
          finalUrl: result.finalVideoUrl,
          duration: result.duration
        });
      } else {
        logger.error(`[MarketingController] ❌ Falló generación [${requestId}]:`, result.error);
      }

    } catch (error) {
      logger.error(`[MarketingController] ❌ Error en generación asíncrona [${requestId}]:`, error);
    }
  }

  /**
   * ⏱️ CALCULAR TIEMPO ESTIMADO
   */
  private calculateEstimatedTime(duration: number): number {
    const baseTime = 120;
    const additionalTime = (duration - 15) * 2;
    return Math.max(baseTime + additionalTime, 60);
  }
}
