import { Request, Response } from 'express';
import { MarketingConfigService, MarketingConfigData } from '../services/marketingConfigService.js';
import { logger } from '../utils/logger.js';
import { body, validationResult } from 'express-validator';

/**
 * 🎯 CONTROLADOR DE CONFIGURACIÓN PERSONALIZADA DE MARKETING AI
 */
export class MarketingConfigController {

  /**
   * 📋 OBTENER CONFIGURACIÓN DEL USUARIO
   */
  async getConfig(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[MarketingConfigController] 📋 Obteniendo configuración [${requestId}]`);

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

      const config = await MarketingConfigService.getOrCreateConfig(userId);

      // Parsear JSON fields para el frontend
      const response = {
        ...config,
        brandColors: config.colors ? JSON.parse(config.colors) : [],
        publishDays: [] // Campo no disponible en el esquema actual
      };

      res.json({
        success: true,
        data: response,
        requestId
      });

    } catch (error) {
      logger.error(`[MarketingConfigController] ❌ Error obteniendo configuración [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * ✏️ ACTUALIZAR CONFIGURACIÓN
   */
  async updateConfig(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[MarketingConfigController] ✏️ Actualizando configuración [${requestId}]`);

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

      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
          requestId
        });
        return;
      }

      const configData: MarketingConfigData = req.body;

      // Validar configuración
      const validation = MarketingConfigService.validateConfig(configData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: 'Configuración inválida',
          details: validation.errors,
          requestId
        });
        return;
      }

      const updatedConfig = await MarketingConfigService.updateConfig(userId, configData);

      // Preparar respuesta parseando JSON fields
      const response = {
        ...updatedConfig,
        brandColors: updatedConfig.colors ? JSON.parse(updatedConfig.colors) : [],
        publishDays: [] // Campo no disponible en el esquema actual
      };

      res.json({
        success: true,
        data: response,
        message: 'Configuración actualizada correctamente',
        requestId
      });

    } catch (error) {
      logger.error(`[MarketingConfigController] ❌ Error actualizando configuración [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🏢 OBTENER OPCIONES DE CONFIGURACIÓN
   */
  async getOptions(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[MarketingConfigController] 🏢 Obteniendo opciones [${requestId}]`);

    try {
      const options = {
        businessTypes: MarketingConfigService.getBusinessTypeOptions(),
        styles: MarketingConfigService.getStyleOptions(),
        musicStyles: MarketingConfigService.getMusicStyleOptions(),
        voiceOptions: MarketingConfigService.getVoiceOptions(),
        durations: [
          { value: 15, label: '15 segundos', description: 'Video corto y directo' },
          { value: 30, label: '30 segundos', description: 'Equilibrio perfecto' },
          { value: 45, label: '45 segundos', description: 'Contenido más detallado' },
          { value: 60, label: '60 segundos', description: 'Historia completa' }
        ],
        frequencies: [
          { value: 'daily', label: 'Diario', description: '1 video por día' },
          { value: 'weekly', label: 'Semanal', description: '1-2 videos por semana' },
          { value: 'monthly', label: 'Mensual', description: '2-4 videos por mes' }
        ],
        tones: [
          { value: 'professional', label: 'Profesional', description: 'Formal y corporativo' },
          { value: 'friendly', label: 'Amigable', description: 'Cercano y personal' },
          { value: 'authoritative', label: 'Autoritativo', description: 'Experto y confiable' },
          { value: 'playful', label: 'Divertido', description: 'Casual y entretenido' },
          { value: 'inspirational', label: 'Inspirador', description: 'Motivador y positivo' }
        ]
      };

      res.json({
        success: true,
        data: options,
        requestId
      });

    } catch (error) {
      logger.error(`[MarketingConfigController] ❌ Error obteniendo opciones [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🗑️ RESETEAR CONFIGURACIÓN
   */
  async resetConfig(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[MarketingConfigController] 🗑️ Reseteando configuración [${requestId}]`);

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

      // Eliminar configuración actual
      await MarketingConfigService.deleteConfig(userId);

      // Crear nueva configuración por defecto
      const newConfig = await MarketingConfigService.getOrCreateConfig(userId);

      const response = {
        ...newConfig,
        brandColors: newConfig.colors ? JSON.parse(newConfig.colors) : [],
        publishDays: [] // Campo no disponible en el esquema actual
      };

      res.json({
        success: true,
        data: response,
        message: 'Configuración reseteada a valores por defecto',
        requestId
      });

    } catch (error) {
      logger.error(`[MarketingConfigController] ❌ Error reseteando configuración [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS (Solo Admin)
   */
  async getStats(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[MarketingConfigController] 📊 Obteniendo estadísticas [${requestId}]`);

    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      const stats = await MarketingConfigService.getConfigStats();

      res.json({
        success: true,
        data: stats,
        requestId
      });

    } catch (error) {
      logger.error(`[MarketingConfigController] ❌ Error obteniendo estadísticas [${requestId}]:`, error);
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
export const validateUpdateConfig = [
  body('businessName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre del negocio debe tener entre 1 y 100 caracteres'),
  
  body('businessType')
    .optional()
    .isIn(['restaurant', 'spa', 'retail', 'fitness', 'beauty', 'tech', 'services', 'education', 'real_estate', 'automotive', 'other'])
    .withMessage('Tipo de negocio inválido'),
  
  body('style')
    .optional()
    .isIn(['professional', 'casual', 'energetic', 'emotional', 'luxury', 'minimalist'])
    .withMessage('Estilo inválido'),
  
  body('voiceType')
    .optional()
    .isIn(['male', 'female', 'neutral'])
    .withMessage('Tipo de voz inválido'),
  
  body('musicStyle')
    .optional()
    .isIn(['upbeat', 'corporate', 'emotional', 'energetic', 'minimal', 'none'])
    .withMessage('Estilo de música inválido'),
  
  body('videoDuration')
    .optional()
    .isInt({ min: 15, max: 60 })
    .withMessage('Duración debe ser entre 15 y 60 segundos'),
  
  body('colors')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Máximo 5 colores de marca'),
  
  body('colors.*')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Los colores deben estar en formato hexadecimal (#RRGGBB)'),
  
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frecuencia inválida'),
  
  body('tone')
    .optional()
    .isIn(['professional', 'friendly', 'authoritative', 'playful', 'inspirational'])
    .withMessage('Tono inválido')
  
  // Nota: Campos como businessName, targetAudience, businessDescription
  // no están en el esquema actual de MarketingConfig
];

// Instancia del controlador
export const marketingConfigController = new MarketingConfigController();
