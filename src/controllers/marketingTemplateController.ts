/**
 * 🎯 CONTROLADOR DE PLANTILLAS DE MARKETING - SEGÚN FLUJO.TXT
 */

import { Request, Response } from 'express';
import { MarketingTemplateService } from '../services/marketingTemplateService.js';
import { MarketingConfigService } from '../services/marketingConfigService.js';
import { logger } from '../utils/logger.js';
import { query } from 'express-validator';

export class MarketingTemplateController {

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

      // TODO: Integrar con el pipeline de marketing existente
      // Aquí se llamaría al marketingPipeline.ts con la plantilla personalizada
      
      // Por ahora, devolver la configuración que se usaría
      const pipelineConfig = {
        templateId: template.id,
        duration: template.duration,
        visualStyle: template.visualStyle,
        tone: template.tone,
        script: personalizedTemplate.script,
        userAssets: assets || [],
        userProfile: {
          industry: userProfile.businessType || 'servicios',
          businessType: userProfile.businessType,
          targetAudience: userProfile.tone || 'general',
          brandColors: userProfile.colors ? JSON.parse(userProfile.colors) : []
        }
      };

      logger.info(`[MarketingTemplateController] Iniciando pipeline con plantilla ${templateId} para usuario ${userId}`);

      res.json({
        success: true,
        data: {
          message: 'Pipeline de marketing iniciado',
          config: pipelineConfig,
          estimatedTime: `${template.duration + 30} segundos`,
          template: personalizedTemplate
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
