import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { logger, safeLog } from '../utils/logger.js';

/**
 * 📊 MARKETING AGENT LOGGING MIDDLEWARE
 * Middleware específico para logging de actividades del Marketing Agent
 */

interface MarketingLogData {
  userId: number;
  userPlan: string;
  action: string;
  endpoint: string;
  method: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
  responseTime?: number;
  statusCode?: number;
  error?: any;
  metadata?: any;
}

/**
 * Middleware para logging de requests del Marketing Agent
 */
export const marketingAgentLogger = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Datos básicos del request
  const logData: Partial<MarketingLogData> = {
    userId: req.user?.id,
    userPlan: req.user?.plan,
    endpoint: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    timestamp
  };

  // Determinar la acción basada en el endpoint
  logData.action = determineAction(req.originalUrl, req.method);

  // Log del request entrante
  safeLog(`[MarketingAgent] ${logData.action} iniciado por usuario ${logData.userId} (${logData.userPlan})`);
  
  // Interceptar la respuesta para logging
  const originalSend = res.send;
  res.send = function(body: any) {
    const responseTime = Date.now() - startTime;
    
    // Completar datos del log
    const completeLogData: MarketingLogData = {
      ...logData,
      responseTime,
      statusCode: res.statusCode,
      timestamp
    } as MarketingLogData;

    // Log basado en el código de estado
    if (res.statusCode >= 400) {
      // Error responses
      try {
        const errorData = typeof body === 'string' ? JSON.parse(body) : body;
        completeLogData.error = errorData.error || errorData.message;
      } catch (e) {
        completeLogData.error = 'Error parsing response body';
      }
      
      logger.error(`[MarketingAgent] ${logData.action} falló`, completeLogData);
    } else {
      // Success responses
      logger.info(`[MarketingAgent] ${logData.action} completado en ${responseTime}ms`, {
        userId: completeLogData.userId,
        action: completeLogData.action,
        responseTime: completeLogData.responseTime,
        statusCode: completeLogData.statusCode
      });
    }

    // Enviar respuesta original
    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware para logging de actividades específicas
 */
export const logMarketingActivity = (activity: string, metadata?: any) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const logData = {
      userId: req.user?.id,
      userPlan: req.user?.plan,
      activity,
      metadata,
      timestamp: new Date().toISOString()
    };

    logger.info(`[MarketingAgent] Actividad: ${activity}`, logData);
    next();
  };
};

/**
 * Middleware para logging de errores del Marketing Agent
 */
export const logMarketingError = (error: any, req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const errorLogData = {
    userId: req.user?.id,
    userPlan: req.user?.plan,
    endpoint: req.originalUrl,
    method: req.method,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    timestamp: new Date().toISOString()
  };

  logger.error('[MarketingAgent] Error no manejado', errorLogData);
  
  // Respuesta de error estándar
  res.status(500).json({
    success: false,
    error: 'Error interno del Marketing Agent',
    code: 'MARKETING_AGENT_ERROR'
  });
};

/**
 * Middleware para logging de métricas de uso
 */
export const logUsageMetrics = (feature: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // Log de métricas de uso
    const metricsData = {
      userId: req.user?.id,
      userPlan: req.user?.plan,
      feature,
      timestamp: new Date().toISOString(),
      endpoint: req.originalUrl
    };

    logger.info(`[MarketingAgent] Uso de funcionalidad: ${feature}`, metricsData);
    
    // Aquí se podría integrar con un sistema de métricas como Analytics
    // trackFeatureUsage(metricsData);
    
    next();
  };
};

/**
 * Middleware para logging de integraciones externas
 */
export const logExternalIntegration = (service: string, action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const integrationData = {
      userId: req.user?.id,
      service,
      action,
      timestamp: new Date().toISOString()
    };

    logger.info(`[MarketingAgent] Integración externa: ${service} - ${action}`, integrationData);
    next();
  };
};

/**
 * Determinar la acción basada en el endpoint y método
 */
function determineAction(url: string, method: string): string {
  const path = url.toLowerCase();
  
  // Instagram endpoints
  if (path.includes('/instagram/sync')) return 'Instagram Sync';
  if (path.includes('/instagram/posts')) return 'Get Instagram Posts';
  if (path.includes('/instagram/analytics')) return 'Get Instagram Analytics';
  if (path.includes('/instagram/account')) return 'Get Instagram Account';
  
  // Marketing Agent endpoints
  if (path.includes('/scorecard')) return 'Get Marketing Scorecard';
  if (path.includes('/daily-brief')) return 'Get Daily Brief';
  if (path.includes('/insights')) return 'Get Marketing Insights';
  if (path.includes('/weekly-report')) return 'Generate Weekly Report';
  if (path.includes('/optimize-content')) return 'Optimize Content';
  
  // Generic action based on method
  switch (method.toUpperCase()) {
    case 'GET': return 'Get Data';
    case 'POST': return 'Create Data';
    case 'PUT': return 'Update Data';
    case 'DELETE': return 'Delete Data';
    default: return 'Unknown Action';
  }
}

/**
 * Configuraciones de logging por endpoint
 */
export const LOGGING_CONFIG = {
  enableDetailedLogging: process.env.MARKETING_AGENT_DETAILED_LOGGING === 'true',
  enableMetricsLogging: process.env.MARKETING_AGENT_METRICS_LOGGING === 'true',
  enableErrorLogging: true, // Siempre habilitado
  logLevel: process.env.MARKETING_AGENT_LOG_LEVEL || 'info'
} as const;

/**
 * Aplicar logging completo al Marketing Agent
 */
export const applyMarketingAgentLogging = [
  marketingAgentLogger,
  // Aquí se pueden agregar más middlewares de logging si es necesario
];
