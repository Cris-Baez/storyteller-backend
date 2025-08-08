import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserService, UserWithRelations } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Extender el tipo Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: UserWithRelations;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: UserWithRelations;
}

/**
 * 🔐 MIDDLEWARE DE AUTENTICACIÓN
 * Verifica el token JWT y carga el usuario en req.user
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token de acceso requerido',
        code: 'NO_TOKEN'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    const JWT_SECRET = env.JWT_SECRET || 'fallback_jwt_secret';

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Buscar usuario
    const user = await UserService.findById(parseInt(decoded.userId));
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verificar que el email esté verificado (opcional, comentado por ahora)
    // if (!user.emailVerified) {
    //   res.status(401).json({
    //     success: false,
    //     error: 'Email no verificado',
    //     code: 'EMAIL_NOT_VERIFIED'
    //   });
    //   return;
    // }

    req.user = user;
    next();

  } catch (error) {
    logger.error('[Auth] Error en autenticación:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }
};

/**
 * 🛡️ MIDDLEWARE DE AUTORIZACIÓN POR ROL
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para esta acción',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      return;
    }

    next();
  };
};

/**
 * 💳 MIDDLEWARE PARA VERIFICAR SUSCRIPCIÓN ACTIVA
 */
export const requireActiveSubscription = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'No autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  if (!UserService.isSubscriptionActive(req.user)) {
    res.status(403).json({
      success: false,
      error: 'Suscripción inactiva o expirada',
      code: 'SUBSCRIPTION_INACTIVE',
      details: {
        currentPlan: req.user.plan,
        subscriptionStatus: req.user.subscription?.status || 'INACTIVE'
      }
    });
    return;
  }

  next();
};

/**
 * 🎬 MIDDLEWARE PARA VERIFICAR LÍMITES DE CREACIÓN DE VIDEOS
 */
export const checkVideoCreationLimits = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'No autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  const canCreate = await UserService.canCreateVideo(req.user.id);
  if (!canCreate) {
    const limits = {
      STARTER: 1,
      CREATOR: 5,
      STUDIO_PRO: 'Ilimitado'
    };

    res.status(403).json({
      success: false,
      error: 'Límite de videos alcanzado para esta semana',
      code: 'VIDEO_LIMIT_EXCEEDED',
      details: {
        currentPlan: req.user.plan,
        weeklyLimit: limits[req.user.plan],
        videosThisWeek: req.user.usage?.videosThisWeek || 0,
        resetDate: req.user.usage?.weekResetDate
      }
    });
    return;
  }

  next();
};

/**
 * 🎨 MIDDLEWARE PARA FUNCIONES EXCLUSIVAS DE STUDIO PRO
 */
export const requireStudioPro = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'No autenticado',
      code: 'NOT_AUTHENTICATED'
    });
    return;
  }

  if (req.user.plan !== 'STUDIO_PRO') {
    res.status(403).json({
      success: false,
      error: 'Esta función es exclusiva del plan Studio Pro',
      code: 'STUDIO_PRO_REQUIRED',
      details: {
        currentPlan: req.user.plan,
        requiredPlan: 'studio_pro'
      }
    });
    return;
  }

  next();
};

/**
 * 👤 MIDDLEWARE OPCIONAL DE AUTENTICACIÓN
 * Carga el usuario si hay token, pero no falla si no lo hay
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const JWT_SECRET = env.JWT_SECRET || 'fallback_jwt_secret';

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await UserService.findById(parseInt(decoded.userId));
      
      if (user) {
        req.user = user;
      }
    }

    next();

  } catch (error) {
    // En modo opcional, simplemente continúa sin usuario
    next();
  }
};
