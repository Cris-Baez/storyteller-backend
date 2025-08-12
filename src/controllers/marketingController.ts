import { Request, Response } from 'express';
import { MarketingPipeline, MarketingGenerationResult } from '../pipelines/marketingPipeline.js';
import { MarketingIntelligenceService, MarketingPromptInput } from '../services/marketingIntelligenceService.js';
import { IMarketingVideo } from '../models/Marketing.js';
import { UserService } from '../models/User.js';
import { PlanLimitService } from '../services/planLimitService.js';
import { PrismaClient } from '@prisma/client'; // ✅ CRÍTICO: Para guardar videos
import { marketingAgent, AgentConfig } from '../services/marketingAgentService.js'; // ✅ NUEVO: Agente completo
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient(); // ✅ CRÍTICO

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
   * 🤖 ACTIVAR AGENTE AUTOMÁTICO COMPLETO
   */
  async activateAgent(req: Request, res: Response): Promise<void> {
    logger.info(`[MarketingController] 🤖 Activando agente automático completo`);

    try {
      // Obtener userId del middleware de auth o del body (para compatibilidad)
      const userId = (req as any).user?.id || parseInt(req.body.userId);
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const {
        frequency = 'weekly',
        preferredDays = ['monday'],
        preferredHours = [9],
        categories = ['promotion'],
        defaultStyle = 'moderno',
        defaultVoice = 'commercial',
        seasonalAdaptation = true,
        maxVideosPerWeek = 5,
        businessType // Para compatibilidad con la API anterior
      } = req.body;

      // 🔒 VALIDAR USUARIO Y PLAN
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado'
        });
        return;
      }

      // Verificar plan requerido
      if (user.plan === 'STARTER') {
        res.status(403).json({
          success: false,
          error: 'El Agente Automático requiere plan Creator ($29) o superior',
          code: 'PLAN_UPGRADE_REQUIRED',
          requiredPlan: 'CREATOR'
        });
        return;
      }

      // 🚀 CONFIGURAR Y ACTIVAR AGENTE AUTOMÁTICO
      const agentConfig: AgentConfig = {
        userId,
        isActive: true,
        frequency,
        preferredDays,
        preferredHours,
        categories,
        defaultStyle,
        defaultVoice,
        seasonalAdaptation,
        maxVideosPerWeek
      };

      // Activar agente con programación automática
      await marketingAgent.activateAgent(agentConfig);

      logger.info(`[MarketingController] ✅ Agente activado exitosamente para usuario ${userId}`);

      // Respuesta compatible con ambas APIs (antigua y nueva)
      res.json({
        success: true,
        message: 'Agente Automático activado correctamente',
        agentConfig: {
          frequency,
          preferredDays,
          categories,
          defaultStyle,
          seasonalAdaptation,
          weeklyFrequency: frequency === 'weekly' ? maxVideosPerWeek : 
                          frequency === 'biweekly' ? Math.ceil(maxVideosPerWeek / 2) : 
                          Math.ceil(maxVideosPerWeek / 4), // Para compatibilidad
          autoPublish: false,
          learningEnabled: true
        },
        automation: {
          cronScheduled: true,
          nextExecution: 'Próximo lunes 9:00 AM',
          maxVideosPerWeek
        }
      });

    } catch (error) {
      logger.error(`[MarketingController] ❌ Error activando agente:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno activando el Agente Automático',
        details: (error as Error).message
      });
    }
  }

  /**
   * ⏹️ DESACTIVAR AGENTE AUTOMÁTICO
   */
  async deactivateAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || parseInt(req.body.userId);
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      await marketingAgent.deactivateAgent(userId);

      res.json({
        success: true,
        message: 'Agente Automático desactivado correctamente'
      });

    } catch (error) {
      logger.error(`[MarketingController] Error desactivando agente:`, error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno desactivando el Agente Automático' 
      });
    }
  }

  /**
   * ⚡ EJECUCIÓN FORZADA DEL AGENTE
   */
  async forceAgentExecution(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || parseInt(req.body.userId);
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      // Verificar plan
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || user.plan === 'STARTER') {
        res.status(403).json({ 
          success: false,
          error: 'La ejecución manual requiere plan Creator ($29) o superior',
          requiredPlan: 'CREATOR'
        });
        return;
      }

      // Ejecutar en background
      marketingAgent.forceExecution(userId).catch(error => {
        logger.error(`[MarketingController] Error en ejecución forzada para usuario ${userId}:`, error);
      });

      res.json({
        success: true,
        message: 'Ejecución del Agente iniciada. El video se generará automáticamente.',
        estimatedTime: '3-5 minutos'
      });

    } catch (error) {
      logger.error(`[MarketingController] Error en ejecución forzada:`, error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno ejecutando el Agente Automático' 
      });
    }
  }

  /**
   * 📊 ESTADO COMPLETO DEL AGENTE
   */
  async getAgentStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || parseInt(req.body.userId);
      
      if (!userId) {
        res.status(401).json({ success: false, error: 'Usuario no autenticado' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        return;
      }

      // Obtener videos automáticos recientes
      const recentVideos = await prisma.video.findMany({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      const automaticVideos = recentVideos.filter(video => {
        try {
          const metadata = video.metadata as any;
          return metadata && metadata.isAutomated === true;
        } catch {
          return false;
        }
      }).slice(0, 10);

      const isAgentAvailable = user.plan !== 'STARTER';
      const isActive = automaticVideos.length > 0;

      res.json({
        success: true,
        agent: {
          isAvailable: isAgentAvailable,
          isActive,
          requiredPlan: isAgentAvailable ? user.plan : 'CREATOR',
          recentGenerations: automaticVideos.length,
          lastGeneration: automaticVideos[0]?.createdAt || null,
          nextScheduled: isActive ? 'Próximo lunes 9:00 AM' : null
        },
        recentVideos: automaticVideos.map(video => ({
          id: video.id,
          title: video.title,
          createdAt: video.createdAt,
          status: video.status,
          finalVideoUrl: video.finalVideoUrl,
          thumbnailUrl: video.thumbnailUrl
        }))
      });

    } catch (error) {
      logger.error(`[MarketingController] Error obteniendo estado del agente:`, error);
      res.status(500).json({ 
        success: false, 
        error: 'Error interno obteniendo estado del Agente' 
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

        // 🎬 GUARDAR VIDEO EN BASE DE DATOS - CRÍTICO PARA HISTORIAL
        try {
          const videoRecord = await prisma.video.create({
            data: {
              userId: parseInt(requestData.userId),
              title: requestData.title,
              description: requestData.userPrompt || `Video de marketing ${requestData.videoType}`,
              type: 'MARKETING',
              status: 'COMPLETED',
              finalVideoUrl: result.finalVideoUrl || '',
              duration: result.duration,
              prompt: requestData.userPrompt,
              style: requestData.style,
              businessType: requestData.businessType,
              metadata: {
                requestId: requestId,
                marketingData: {
                  videoType: requestData.videoType,
                  brandName: requestData.brandName,
                  callToAction: requestData.callToAction,
                  voiceType: requestData.voiceType,
                  musicStyle: requestData.musicStyle,
                  userImages: requestData.userImages
                },
                pipelineResult: JSON.parse(JSON.stringify(result)), // Serializar para JSON
                fechaCreacion: new Date().toISOString()
              } as any
            }
          });

          logger.info(`[MarketingController] ✅ Video marketing guardado en BD: ${videoRecord.id}`);
        } catch (dbError) {
          logger.error(`[MarketingController] ❌ Error guardando video marketing en BD:`, dbError);
        }

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
