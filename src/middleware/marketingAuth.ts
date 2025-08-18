import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { logger } from '../utils/logger.js';

/**
 * 🎯 MARKETING AGENT MIDDLEWARE
 * Middleware específico para funcionalidades del Marketing Agent
 */

// Tipos de planes disponibles
export type PlanType = 'STARTER' | 'CREATOR' | 'STUDIO_PRO';

// Mapeo de funcionalidades por plan
export const PLAN_FEATURES = {
  STARTER: {
    dailyBrief: false,
    weeklyReports: false,
    instagramAnalytics: false,
    contentOptimization: false,
    competitorAnalysis: false,
    maxSocialAccounts: 0
  },
  CREATOR: {
    dailyBrief: true,
    weeklyReports: true,
    instagramAnalytics: true,
    contentOptimization: true,
    competitorAnalysis: false,
    maxSocialAccounts: 2
  },
  STUDIO_PRO: {
    dailyBrief: true,
    weeklyReports: true,
    instagramAnalytics: true,
    contentOptimization: true,
    competitorAnalysis: true,
    maxSocialAccounts: 10
  }
} as const;

/**
 * Middleware para verificar que el usuario tiene acceso al Marketing Agent
 */
export const requireMarketingAgent = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    // Verificar que el usuario tiene un plan que permite Marketing Agent
    if (user.plan === 'STARTER') {
      res.status(403).json({
        success: false,
        error: 'Marketing Agent requiere plan Creator o Studio Pro',
        code: 'PLAN_UPGRADE_REQUIRED',
        requiredPlan: 'CREATOR'
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('[MarketingAgent] Error en middleware requireMarketingAgent:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware para verificar funcionalidades específicas por plan
 */
export const requirePlanFeature = (feature: keyof typeof PLAN_FEATURES.CREATOR) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado',
          code: 'NOT_AUTHENTICATED'
        });
        return;
      }

      const userPlan = user.plan as PlanType;
      const planFeatures = PLAN_FEATURES[userPlan];

      if (!planFeatures[feature]) {
        // Determinar qué plan se necesita para esta funcionalidad
        let requiredPlan: PlanType = 'CREATOR';
        if (feature === 'competitorAnalysis') {
          requiredPlan = 'STUDIO_PRO';
        }

        res.status(403).json({
          success: false,
          error: `Esta funcionalidad requiere plan ${requiredPlan}`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature,
          currentPlan: userPlan,
          requiredPlan
        });
        return;
      }

      next();
    } catch (error) {
      logger.error(`[MarketingAgent] Error en middleware requirePlanFeature(${feature}):`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Middleware para verificar límites de cuentas sociales
 */
export const checkSocialAccountLimit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    const userPlan = user.plan as PlanType;
    const maxAccounts = PLAN_FEATURES[userPlan].maxSocialAccounts;

    // Si es STARTER, no puede conectar cuentas
    if (maxAccounts === 0) {
      res.status(403).json({
        success: false,
        error: 'Conectar cuentas sociales requiere plan Creator o Studio Pro',
        code: 'PLAN_UPGRADE_REQUIRED',
        requiredPlan: 'CREATOR'
      });
      return;
    }

    // Verificar si ya alcanzó el límite (esto se podría hacer con Prisma)
    // Por ahora solo verificamos el límite teórico
    next();
  } catch (error) {
    logger.error('[MarketingAgent] Error en middleware checkSocialAccountLimit:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Obtener las funcionalidades disponibles para un plan
 */
export const getPlanFeatures = (plan: PlanType) => {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.STARTER;
};

/**
 * Verificar si un plan tiene una funcionalidad específica
 */
export const hasPlanFeature = (plan: PlanType, feature: keyof typeof PLAN_FEATURES.CREATOR): boolean => {
  const planFeatures = PLAN_FEATURES[plan] || PLAN_FEATURES.STARTER;
  return planFeatures[feature] as boolean;
};
