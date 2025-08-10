/**
 * 🎯 CONTROLADOR DE PLANTILLAS DE MARKETING - SEGÚN FLUJO.TXT
 */

import { Request, Response } from 'express';
import { MarketingTemplateService } from '../services/marketingTemplateService.js';
import { MarketingConfigService } from '../services/marketingConfigService.js';
import { MarketingPipeline } from '../pipelines/marketingPipeline.js'; // ✅ INTEGRACIÓN REAL
import { PlanLimitService } from '../services/planLimitService.js'; // ✅ LÍMITES
import { MarketingVideo } from '../models/Marketing.js'; // ✅ USAR MODELO MONGOOSE CORRECTO
import { logger } from '../utils/logger.js';
import { query } from 'express-validator';

export class MarketingTemplateController {
  private marketingPipeline: MarketingPipeline;

  constructor() {
    this.marketingPipeline = new MarketingPipeline();
  }

  /**
   * 📋 OBTENER CATÁLOGO DE PLANTILLAS FILTRADO
   * Según flujo.txt: Usuario solicita catálogo filtrado por industria/objetivo
   */
  async getCatalog(req: Request, res: Response): Promise<void> {
    try {
      const { industry, objective } = req.query as { industry?: string; objective?: string };
      let templates;

      if (industry) {
        templates = MarketingTemplateService.getTemplatesByIndustry(industry);
      } else if (objective) {
        templates = MarketingTemplateService.getTemplatesByObjective(objective);
      } else {
        // Devolver todas las industrias disponibles
        const industries = MarketingTemplateService.getAvailableIndustries();
        res.json({
          success: true,
          data: {
            industries,
            message: 'Especifica ?industry=nombre o ?objective=tipo para ver plantillas'
          }
        });
        return;
      }

      // Formatear respuesta según flujo.txt: plantillas con guion base, tono, duración, estilo, CTA
      const formattedTemplates = templates.map(template => ({
        id: template.id,
        name: template.name,
        industry: template.industry,
        objective: template.objective,
        duration: template.duration,
        tone: template.tone,
        visualStyle: template.visualStyle,
        preview: {
          apertura: template.script.apertura,
          cta: template.script.cta
        },
        assets: template.assets
      }));

      res.json({
        success: true,
        data: formattedTemplates,
        count: formattedTemplates.length
      });

    } catch (error) {
      logger.error('[MarketingTemplateController] Error obteniendo catálogo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * 🎯 SELECCIONAR Y PERSONALIZAR PLANTILLA
   * Según flujo.txt: Usuario elige una y opcionalmente ajusta parámetros
   */
  async selectTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const { customParams = {} } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      // Obtener plantilla
      const template = MarketingTemplateService.getTemplateById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada'
        });
        return;
      }

      // Obtener perfil de marketing del usuario
      const userProfile = await MarketingConfigService.getOrCreateConfig(userId);

      // Personalizar plantilla con perfil del usuario
      const personalizedTemplate = MarketingTemplateService.personalizeTemplate(
        template,
        userProfile,
        customParams
      );

      logger.info(`[MarketingTemplateController] Usuario ${userId} seleccionó plantilla ${templateId}`);

      res.json({
        success: true,
        data: personalizedTemplate,
        message: 'Plantilla personalizada lista para usar'
      });

    } catch (error) {
      logger.error('[MarketingTemplateController] Error seleccionando plantilla:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * 🎬 EJECUTAR PIPELINE DE MARKETING CON PLANTILLA
   * Según flujo.txt: Backend crea proyecto con esa plantilla y ejecuta pipeline de marketing
   */
  async executeWithTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const { customParams = {}, assets } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      // 🚨 VALIDAR LÍMITES ANTES DE EJECUTAR
      const limitValidation = await PlanLimitService.validateVideoCreation(userId);
      if (!limitValidation.canCreate) {
        res.status(403).json({
          success: false,
          error: 'Límite de videos alcanzado',
          code: 'VIDEO_LIMIT_EXCEEDED',
          data: {
            currentUsage: limitValidation.currentUsage,
            maxAllowed: limitValidation.maxAllowed,
            planName: limitValidation.planName,
            resetDate: limitValidation.resetDate,
            reason: limitValidation.reason
          }
        });
        return;
      }

      // Obtener y personalizar plantilla
      const template = MarketingTemplateService.getTemplateById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada'
        });
        return;
      }

      const userProfile = await MarketingConfigService.getOrCreateConfig(userId);
      const personalizedTemplate = MarketingTemplateService.personalizeTemplate(
        template,
        userProfile,
        customParams
      );

      // 🚀 CREAR DOCUMENTO MARKETING VIDEO EN BD
      const marketingVideo = new MarketingVideo({
        userId: userId.toString(),
        title: `Video desde plantilla: ${template.name}`,
        description: personalizedTemplate.script.apertura,
        businessType: userProfile.businessType || 'services',
        videoType: 'promotional' as const,
        style: personalizedTemplate.tone,
        duration: personalizedTemplate.duration as 15 | 30 | 45 | 60,
        userImages: assets?.filter((asset: any) => asset.type === 'image') || [],
        userPrompt: Object.values(personalizedTemplate.script).join(' '),
        brandName: 'Mi Empresa',
        callToAction: personalizedTemplate.script.cta,
        useAIActor: true,
        voiceEnabled: true,
        voiceType: 'neutral' as const,
        musicStyle: 'upbeat' as const,
        // Campos generados dinámicamente
        aiGeneratedScript: '',
        marketingTomas: [],
        status: 'generating' as const,
        isAgentMode: false
      });

      // Guardar en BD antes de procesar
      await marketingVideo.save();

      // Input para el pipeline
      const pipelineInput = {
        businessType: userProfile.businessType || 'services',
        videoType: 'promotional' as const,
        style: personalizedTemplate.tone,
        duration: personalizedTemplate.duration,
        userPrompt: Object.values(personalizedTemplate.script).join(' '),
        brandName: 'Mi Empresa',
        callToAction: personalizedTemplate.script.cta,
        userImages: assets?.filter((asset: any) => asset.type === 'image') || [],
        useAIActor: true
      };

      // Ejecutar pipeline de marketing real
      const result = await this.marketingPipeline.generateMarketingVideo(marketingVideo, pipelineInput);
      
      // Registrar uso exitoso
      if (result && result.success) {
        await PlanLimitService.recordVideoCreation(userId);
        logger.info(`[MarketingTemplateController] ✅ Video marketing generado y uso registrado para usuario ${userId}`);
      }

      res.json({
        success: true,
        data: {
          message: 'Pipeline de marketing completado',
          result: result,
          template: personalizedTemplate,
          estimatedTime: `${template.duration} segundos`,
          usage: {
            currentUsage: limitValidation.currentUsage + 1,
            maxAllowed: limitValidation.maxAllowed,
            planName: limitValidation.planName
          }
        }
      });

    } catch (error) {
      logger.error('[MarketingTemplateController] Error ejecutando pipeline:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * 📊 OBTENER INDUSTRIAS DISPONIBLES
   */
  async getIndustries(req: Request, res: Response): Promise<void> {
    try {
      const industries = MarketingTemplateService.getAvailableIndustries();
      
      res.json({
        success: true,
        data: industries
      });
    } catch (error) {
      logger.error('[MarketingTemplateController] Error obteniendo industrias:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}

/**
 * 🎯 VALIDADORES PARA RUTAS
 */
export const validateTemplateQuery = [
  query('industry').optional().isString().isLength({ min: 2, max: 50 }),
  query('objective').optional().isString().isLength({ min: 2, max: 50 })
];

export const marketingTemplateController = new MarketingTemplateController();
