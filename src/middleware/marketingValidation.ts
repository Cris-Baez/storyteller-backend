import { body, param, query, ValidationChain } from 'express-validator';
import { validateRequest } from './validation.js';

/**
 * 🔍 VALIDACIONES ESPECÍFICAS PARA MARKETING AGENT
 * Esquemas de validación para endpoints del Marketing Agent
 */

/**
 * Validaciones para endpoints de Instagram
 */
export const instagramValidations = {
  // Validación para sincronización de Instagram
  syncAccount: [
    body('accountId')
      .isInt({ min: 1 })
      .withMessage('ID de cuenta de Instagram válido requerido'),
    body('fullSync')
      .optional()
      .isBoolean()
      .withMessage('fullSync debe ser un valor booleano'),
    validateRequest
  ],

  // Validación para obtener posts
  getPosts: [
    param('accountId')
      .isInt({ min: 1 })
      .withMessage('ID de cuenta válido requerido'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Límite debe ser entre 1 y 50'),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset debe ser mayor o igual a 0'),
    query('dateFrom')
      .optional()
      .isISO8601()
      .withMessage('Fecha de inicio debe ser una fecha válida'),
    query('dateTo')
      .optional()
      .isISO8601()
      .withMessage('Fecha de fin debe ser una fecha válida'),
    validateRequest
  ],

  // Validación para análisis de posts
  getAnalytics: [
    param('accountId')
      .isInt({ min: 1 })
      .withMessage('ID de cuenta válido requerido'),
    query('postId')
      .optional()
      .isString()
      .withMessage('ID de post debe ser una cadena'),
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Período debe ser 7d, 30d o 90d'),
    validateRequest
  ]
};

/**
 * Validaciones para Marketing Agent
 */
export const marketingAgentValidations = {
  // Validación para scorecard
  getScorecard: [
    query('period')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Período debe ser daily, weekly o monthly'),
    query('accountId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID de cuenta debe ser un número válido'),
    validateRequest
  ],

  // Validación para daily brief
  getDailyBrief: [
    query('date')
      .optional()
      .isISO8601()
      .withMessage('Fecha debe ser una fecha válida'),
    query('accountId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID de cuenta debe ser un número válido'),
    validateRequest
  ],

  // Validación para insights
  getInsights: [
    query('type')
      .optional()
      .isIn(['engagement', 'audience', 'content', 'competitors'])
      .withMessage('Tipo debe ser engagement, audience, content o competitors'),
    query('period')
      .optional()
      .isIn(['7d', '30d', '90d'])
      .withMessage('Período debe ser 7d, 30d o 90d'),
    query('accountId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('ID de cuenta debe ser un número válido'),
    validateRequest
  ],

  // Validación para reporte semanal
  generateWeeklyReport: [
    body('weekStart')
      .optional()
      .isISO8601()
      .withMessage('Fecha de inicio debe ser una fecha válida'),
    body('includeCompetitors')
      .optional()
      .isBoolean()
      .withMessage('includeCompetitors debe ser un valor booleano'),
    body('accounts')
      .optional()
      .isArray()
      .withMessage('accounts debe ser un array'),
    body('accounts.*')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Cada ID de cuenta debe ser un número válido'),
    validateRequest
  ],

  // Validación para optimización de contenido
  optimizeContent: [
    body('content')
      .notEmpty()
      .withMessage('Contenido requerido')
      .isLength({ max: 10000 })
      .withMessage('Contenido no puede exceder 10,000 caracteres'),
    body('platform')
      .isIn(['instagram', 'facebook', 'twitter', 'linkedin'])
      .withMessage('Plataforma debe ser instagram, facebook, twitter o linkedin'),
    body('contentType')
      .isIn(['post', 'story', 'reel', 'carousel'])
      .withMessage('Tipo de contenido debe ser post, story, reel o carousel'),
    body('targetAudience')
      .optional()
      .isString()
      .withMessage('Audiencia objetivo debe ser una cadena'),
    body('objectives')
      .optional()
      .isArray()
      .withMessage('Objetivos debe ser un array'),
    body('objectives.*')
      .optional()
      .isIn(['engagement', 'reach', 'conversions', 'brand_awareness'])
      .withMessage('Objetivo inválido'),
    validateRequest
  ]
};

/**
 * Validaciones para cuentas sociales
 */
export const socialAccountValidations = {
  // Validación para conectar cuenta
  connectAccount: [
    body('platform')
      .isIn(['INSTAGRAM', 'FACEBOOK', 'TWITTER', 'LINKEDIN'])
      .withMessage('Plataforma debe ser INSTAGRAM, FACEBOOK, TWITTER o LINKEDIN'),
    body('accessToken')
      .notEmpty()
      .withMessage('Token de acceso requerido'),
    body('username')
      .notEmpty()
      .withMessage('Nombre de usuario requerido')
      .isLength({ min: 1, max: 50 })
      .withMessage('Nombre de usuario debe tener entre 1 y 50 caracteres'),
    body('platformUserId')
      .optional()
      .isString()
      .withMessage('ID de usuario de plataforma debe ser una cadena'),
    validateRequest
  ],

  // Validación para actualizar configuración
  updateSettings: [
    param('accountId')
      .isInt({ min: 1 })
      .withMessage('ID de cuenta válido requerido'),
    body('autoPublish')
      .optional()
      .isBoolean()
      .withMessage('autoPublish debe ser un valor booleano'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive debe ser un valor booleano'),
    body('settings')
      .optional()
      .isObject()
      .withMessage('settings debe ser un objeto'),
    validateRequest
  ]
};

/**
 * Validaciones para configuración del Marketing Agent
 */
export const configValidations = {
  // Validación para actualizar configuración
  updateConfig: [
    body('autoReports')
      .optional()
      .isBoolean()
      .withMessage('autoReports debe ser un valor booleano'),
    body('reportFrequency')
      .optional()
      .isIn(['daily', 'weekly', 'monthly'])
      .withMessage('Frecuencia de reportes debe ser daily, weekly o monthly'),
    body('notifications')
      .optional()
      .isObject()
      .withMessage('notifications debe ser un objeto'),
    body('notifications.email')
      .optional()
      .isBoolean()
      .withMessage('notifications.email debe ser un valor booleano'),
    body('notifications.dashboard')
      .optional()
      .isBoolean()
      .withMessage('notifications.dashboard debe ser un valor booleano'),
    body('targetMetrics')
      .optional()
      .isArray()
      .withMessage('targetMetrics debe ser un array'),
    body('targetMetrics.*')
      .optional()
      .isIn(['engagement_rate', 'reach', 'impressions', 'followers', 'profile_visits'])
      .withMessage('Métrica objetivo inválida'),
    validateRequest
  ]
};

/**
 * Validación para parámetros de paginación comunes
 */
export const paginationValidations: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número mayor a 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  query('sortBy')
    .optional()
    .isString()
    .withMessage('sortBy debe ser una cadena'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Orden debe ser asc o desc')
];

/**
 * Validación para filtros de fecha comunes
 */
export const dateFilterValidations: ValidationChain[] = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio debe ser una fecha válida'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin debe ser una fecha válida')
    .custom((value, { req }) => {
      if (req.query?.startDate && value) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('Fecha de fin debe ser posterior a fecha de inicio');
        }
      }
      return true;
    })
];

/**
 * Combinar múltiples validaciones
 */
export const combineValidations = (...validationGroups: ValidationChain[][]): ValidationChain[] => {
  return validationGroups.flat();
};

/**
 * Exportar todas las validaciones organizadas
 */
export const allValidations = {
  instagram: instagramValidations,
  marketingAgent: marketingAgentValidations,
  socialAccount: socialAccountValidations,
  config: configValidations,
  common: {
    pagination: paginationValidations,
    dateFilter: dateFilterValidations
  }
};
