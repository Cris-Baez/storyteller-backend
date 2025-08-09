import { Request, Response } from 'express';
import { TemplateService, TemplateCreateData, TemplateUpdateData, TemplateFilters } from '../services/templateService.js';
import { logger } from '../utils/logger.js';
import { body, query, validationResult } from 'express-validator';

/**
 * 📄 CONTROLADOR DE PLANTILLAS DE MARKETING
 */
export class TemplateController {

  /**
   * 📋 OBTENER TODAS LAS PLANTILLAS
   */
  async getAllTemplates(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[TemplateController] 📋 Obteniendo plantillas [${requestId}]`);

    try {
      // Construir filtros desde query parameters
      const filters: TemplateFilters = {};
      
      if (req.query.businessType) filters.businessType = req.query.businessType as string;
      if (req.query.category) filters.category = req.query.category as string;
      if (req.query.style) filters.style = req.query.style as string;
      if (req.query.tone) filters.tone = req.query.tone as string;
      if (req.query.duration) filters.duration = parseInt(req.query.duration as string);
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
      if (req.query.isPublic !== undefined) filters.isPublic = req.query.isPublic === 'true';
      
      // Filtro por tags
      if (req.query.tags) {
        const tagsParam = req.query.tags as string;
        filters.tags = tagsParam.split(',').map(tag => tag.trim());
      }

      const templates = await TemplateService.getAllTemplates(filters);

      // Parsear JSON fields para el frontend
      const response = templates.map(template => ({
        ...template,
        structure: typeof template.structure === 'string' ? JSON.parse(template.structure) : template.structure,
        tags: template.tags ? JSON.parse(template.tags) : []
      }));

      res.json({
        success: true,
        data: response,
        count: response.length,
        filters: filters,
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error obteniendo plantillas [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🔍 OBTENER PLANTILLA POR ID
   */
  async getTemplateById(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const templateId = parseInt(req.params.id);
    
    logger.info(`[TemplateController] 🔍 Obteniendo plantilla ID: ${templateId} [${requestId}]`);

    try {
      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'ID de plantilla inválido',
          requestId
        });
        return;
      }

      const template = await TemplateService.getTemplateById(templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada',
          requestId
        });
        return;
      }

      // Parsear JSON fields
      const response = {
        ...template,
        structure: typeof template.structure === 'string' ? JSON.parse(template.structure) : template.structure,
        tags: template.tags ? JSON.parse(template.tags) : []
      };

      res.json({
        success: true,
        data: response,
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error obteniendo plantilla [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * ➕ CREAR NUEVA PLANTILLA (Solo Admin)
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[TemplateController] ➕ Creando plantilla [${requestId}]`);

    try {
      // Validar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: errors.array(),
          requestId
        });
        return;
      }

      // Verificar que el usuario sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      const templateData: TemplateCreateData = req.body;

      // Validar datos con el servicio
      const validation = TemplateService.validateTemplateData(templateData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Datos de plantilla inválidos',
          details: validation.errors,
          requestId
        });
        return;
      }

      const template = await TemplateService.createTemplate(templateData);

      // Parsear JSON fields para la respuesta
      const response = {
        ...template,
        structure: typeof template.structure === 'string' ? JSON.parse(template.structure) : template.structure,
        tags: template.tags ? JSON.parse(template.tags) : []
      };

      res.status(201).json({
        success: true,
        data: response,
        message: 'Plantilla creada correctamente',
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error creando plantilla [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * ✏️ ACTUALIZAR PLANTILLA (Solo Admin)
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const templateId = parseInt(req.params.id);
    
    logger.info(`[TemplateController] ✏️ Actualizando plantilla ID: ${templateId} [${requestId}]`);

    try {
      // Validar errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: errors.array(),
          requestId
        });
        return;
      }

      // Verificar que el usuario sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'ID de plantilla inválido',
          requestId
        });
        return;
      }

      const updateData: TemplateUpdateData = req.body;
      const template = await TemplateService.updateTemplate(templateId, updateData);

      // Parsear JSON fields para la respuesta
      const response = {
        ...template,
        structure: typeof template.structure === 'string' ? JSON.parse(template.structure) : template.structure,
        tags: template.tags ? JSON.parse(template.tags) : []
      };

      res.json({
        success: true,
        data: response,
        message: 'Plantilla actualizada correctamente',
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error actualizando plantilla [${requestId}]:`, error);
      
      if (error instanceof Error && error.message === 'Plantilla no encontrada') {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada',
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
          requestId
        });
      }
    }
  }

  /**
   * 🗑️ ELIMINAR PLANTILLA (Solo Admin)
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const templateId = parseInt(req.params.id);
    
    logger.info(`[TemplateController] 🗑️ Eliminando plantilla ID: ${templateId} [${requestId}]`);

    try {
      // Verificar que el usuario sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'ID de plantilla inválido',
          requestId
        });
        return;
      }

      await TemplateService.deleteTemplate(templateId);

      res.json({
        success: true,
        message: 'Plantilla eliminada correctamente',
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error eliminando plantilla [${requestId}]:`, error);
      
      if (error instanceof Error && error.message === 'Plantilla no encontrada') {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada',
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Error interno del servidor',
          requestId
        });
      }
    }
  }

  /**
   * 🏢 OBTENER PLANTILLAS POR TIPO DE NEGOCIO
   */
  async getTemplatesByBusinessType(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const businessType = req.params.businessType;
    
    logger.info(`[TemplateController] 🏢 Obteniendo plantillas para negocio: ${businessType} [${requestId}]`);

    try {
      const templates = await TemplateService.getTemplatesByBusinessType(businessType);

      const response = templates.map(template => ({
        ...template,
        structure: typeof template.structure === 'string' ? JSON.parse(template.structure) : template.structure,
        tags: template.tags ? JSON.parse(template.tags) : []
      }));

      res.json({
        success: true,
        data: response,
        businessType,
        count: response.length,
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error obteniendo plantillas por negocio [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🎯 OBTENER PLANTILLAS POPULARES
   */
  async getPopularTemplates(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const limit = parseInt(req.query.limit as string) || 10;
    
    logger.info(`[TemplateController] 🎯 Obteniendo ${limit} plantillas populares [${requestId}]`);

    try {
      const templates = await TemplateService.getPopularTemplates(limit);

      const response = templates.map(template => ({
        ...template,
        structure: typeof template.structure === 'string' ? JSON.parse(template.structure) : template.structure,
        tags: template.tags ? JSON.parse(template.tags) : []
      }));

      res.json({
        success: true,
        data: response,
        limit,
        count: response.length,
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error obteniendo plantillas populares [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 📊 USAR PLANTILLA (Incrementar contador)
   */
  async useTemplate(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const templateId = parseInt(req.params.id);
    
    logger.info(`[TemplateController] 📊 Usando plantilla ID: ${templateId} [${requestId}]`);

    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
          requestId
        });
        return;
      }

      if (isNaN(templateId)) {
        res.status(400).json({
          success: false,
          error: 'ID de plantilla inválido',
          requestId
        });
        return;
      }

      // Verificar que la plantilla existe
      const template = await TemplateService.getTemplateById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Plantilla no encontrada',
          requestId
        });
        return;
      }

      // Incrementar contador de uso
      await TemplateService.incrementUseCount(templateId);

      // Parsear JSON fields para la respuesta
      const response = {
        ...template,
        structure: typeof template.structure === 'string' ? JSON.parse(template.structure) : template.structure,
        tags: template.tags ? JSON.parse(template.tags) : []
      };

      res.json({
        success: true,
        data: response,
        message: 'Plantilla lista para usar',
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error usando plantilla [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🏷️ OBTENER OPCIONES DISPONIBLES
   */
  async getTemplateOptions(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[TemplateController] 🏷️ Obteniendo opciones de plantillas [${requestId}]`);

    try {
      const options = TemplateService.getTemplateOptions();

      res.json({
        success: true,
        data: options,
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error obteniendo opciones [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 📈 OBTENER ESTADÍSTICAS (Solo Admin)
   */
  async getTemplateStats(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[TemplateController] 📈 Obteniendo estadísticas de plantillas [${requestId}]`);

    try {
      // Verificar que el usuario sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      const stats = await TemplateService.getTemplateStats();

      res.json({
        success: true,
        data: stats,
        requestId
      });

    } catch (error) {
      logger.error(`[TemplateController] ❌ Error obteniendo estadísticas [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }
}

/**
 * 🔍 VALIDADORES PARA LOS ENDPOINTS
 */
export const validateCreateTemplate = [
  body('title')
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('businessType')
    .isIn(['restaurant', 'spa', 'retail', 'fitness', 'beauty', 'tech', 'services', 'education', 'real_estate', 'automotive', 'other'])
    .withMessage('Tipo de negocio inválido'),
  
  body('category')
    .isIn(['promotional', 'product', 'service', 'seasonal', 'testimonial', 'brand', 'educational', 'event'])
    .withMessage('Categoría inválida'),
  
  body('structure')
    .isObject()
    .withMessage('La estructura debe ser un objeto JSON válido'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('La duración debe estar entre 15 y 120 segundos'),
  
  body('style')
    .optional()
    .isIn(['professional', 'casual', 'energetic', 'emotional', 'luxury', 'minimalist'])
    .withMessage('Estilo inválido'),
  
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'authoritative', 'playful', 'inspirational', 'urgent'])
    .withMessage('Tono inválido'),
  
  body('musicStyle')
    .optional()
    .isIn(['upbeat', 'corporate', 'emotional', 'energetic', 'minimal', 'none'])
    .withMessage('Estilo de música inválido'),
  
  body('voiceType')
    .optional()
    .isIn(['male', 'female', 'neutral'])
    .withMessage('Tipo de voz inválido'),
  
  body('effectsEnabled')
    .optional()
    .isBoolean()
    .withMessage('effectsEnabled debe ser un booleano'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Máximo 10 tags permitidos'),
  
  body('tags.*')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Cada tag debe tener entre 1 y 50 caracteres')
];

export const validateUpdateTemplate = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 200 })
    .withMessage('El título debe tener entre 3 y 200 caracteres'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),
  
  body('businessType')
    .optional()
    .isIn(['restaurant', 'spa', 'retail', 'fitness', 'beauty', 'tech', 'services', 'education', 'real_estate', 'automotive', 'other'])
    .withMessage('Tipo de negocio inválido'),
  
  body('category')
    .optional()
    .isIn(['promotional', 'product', 'service', 'seasonal', 'testimonial', 'brand', 'educational', 'event'])
    .withMessage('Categoría inválida'),
  
  body('structure')
    .optional()
    .isObject()
    .withMessage('La estructura debe ser un objeto JSON válido'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 120 })
    .withMessage('La duración debe estar entre 15 y 120 segundos'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser un booleano'),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic debe ser un booleano')
];

// Instancia del controlador
export const templateController = new TemplateController();
