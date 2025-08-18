import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { logger } from '../utils/logger.js';

/**
 * 🚦 RATE LIMITING PARA MARKETING AGENT
 * Configuraciones de límites de requests por funcionalidad
 */

// Configuración base para rate limiting
const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: options.message,
      code: 'RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: options.keyGenerator || ((req: Request) => {
      const authReq = req as AuthenticatedRequest;
      return authReq.user?.id?.toString() || req.ip || 'anonymous';
    }),
    handler: (req: Request, res: Response) => {
      logger.warn(`[RateLimit] Rate limit exceeded for user ${(req as AuthenticatedRequest).user?.id || 'anonymous'}`);
      res.status(429).json({
        success: false,
        error: options.message,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

/**
 * Rate limiting para sincronización de Instagram
 * Límite: 10 requests por hora por usuario
 */
export const instagramSyncRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: 'Límite de sincronización de Instagram excedido. Máximo 10 sincronizaciones por hora.'
});

/**
 * Rate limiting para análisis de posts
 * Límite: 50 requests por hora por usuario
 */
export const postAnalyticsRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50,
  message: 'Límite de análisis de posts excedido. Máximo 50 análisis por hora.'
});

/**
 * Rate limiting para generación de reportes
 * Límite: 5 reportes por día por usuario
 */
export const reportGenerationRateLimit = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 horas
  max: 5,
  message: 'Límite de generación de reportes excedido. Máximo 5 reportes por día.'
});

/**
 * Rate limiting para insights y recomendaciones
 * Límite: 30 requests por hora por usuario
 */
export const insightsRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 30,
  message: 'Límite de insights excedido. Máximo 30 requests por hora.'
});

/**
 * Rate limiting para optimización de contenido
 * Límite: 20 requests por hora por usuario
 */
export const contentOptimizationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  message: 'Límite de optimización de contenido excedido. Máximo 20 requests por hora.'
});

/**
 * Rate limiting general para APIs del Marketing Agent
 * Límite: 100 requests por hora por usuario
 */
export const marketingAgentRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100,
  message: 'Límite de requests del Marketing Agent excedido. Máximo 100 requests por hora.'
});

/**
 * Rate limiting para usuarios STARTER (más restrictivo)
 * Límite: 10 requests por hora por usuario
 */
export const starterPlanRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  message: 'Límite de requests excedido para plan Starter. Considera actualizar a Creator para más requests.'
});

/**
 * Rate limiting dinámico basado en el plan del usuario
 */
export const dynamicPlanRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const userPlan = authReq.user?.plan;

  // Configurar límites según el plan
  let maxRequests = 10; // STARTER por defecto
  let windowMs = 60 * 60 * 1000; // 1 hora

  switch (userPlan) {
    case 'CREATOR':
      maxRequests = 50;
      break;
    case 'STUDIO_PRO':
      maxRequests = 200;
      break;
    default:
      maxRequests = 10;
  }

  // Crear rate limiter dinámico
  const dynamicLimiter = createRateLimiter({
    windowMs,
    max: maxRequests,
    message: `Límite de requests excedido para plan ${userPlan}. Máximo ${maxRequests} requests por hora.`
  });

  dynamicLimiter(req, res, next);
};

/**
 * Configuraciones de rate limiting por endpoint
 */
export const RATE_LIMIT_CONFIG = {
  // Instagram endpoints
  '/instagram/sync': instagramSyncRateLimit,
  '/instagram/posts': postAnalyticsRateLimit,
  '/instagram/analytics': postAnalyticsRateLimit,
  
  // Marketing Agent endpoints
  '/scorecard': insightsRateLimit,
  '/daily-brief': insightsRateLimit,
  '/insights': insightsRateLimit,
  '/weekly-report': reportGenerationRateLimit,
  '/optimize-content': contentOptimizationRateLimit,
  
  // General Marketing Agent
  '/marketing-agent/*': marketingAgentRateLimit
} as const;

/**
 * Aplicar rate limiting a todas las rutas del Marketing Agent
 */
export const applyMarketingAgentRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Por defecto aplicar rate limit general
  marketingAgentRateLimit(req, res, next);
};
