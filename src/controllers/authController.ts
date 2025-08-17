import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService.js';
import { UserService } from '../models/User.js';
import { logger } from '../utils/logger.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const authService = new AuthService();

/**
 * 📝 REGISTRO DE USUARIO
 */
export const register = [
  // Validaciones
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres'),

  // Controlador
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array()
        });
        return;
      }

      const { email, password, name } = req.body;

      const result = await authService.register({ email, password, name });
      const user = result.user as any; // Type assertion para resolver errores de tipos

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
            subscription: user.subscription,
            usage: user.usage,
            emailVerified: user.emailVerified
          },
          tokens: result.tokens
        }
      });

    } catch (error) {
      logger.error('[AuthController] Error en registro:', error);
      
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const statusCode = message.includes('ya está registrado') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
];

/**
 * 🔑 LOGIN DE USUARIO
 */
export const login = [
  // Validaciones
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida'),

  // Controlador
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array()
        });
        return;
      }

      const { email, password } = req.body;

      const result = await authService.login({ email, password });
      const user = result.user as any; // Type assertion para resolver errores de tipos

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            plan: user.plan,
            subscription: user.subscription,
            usage: user.usage,
            emailVerified: user.emailVerified
          },
          tokens: result.tokens
        }
      });

    } catch (error) {
      logger.error('[AuthController] Error en login:', error);
      
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const statusCode = message.includes('Credenciales inválidas') ? 401 : 500;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
];

/**
 * 🔄 REFRESCAR TOKEN
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: 'Token de refresco requerido'
      });
      return;
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refrescado exitosamente',
      data: { tokens }
    });

  } catch (error) {
    logger.error('[AuthController] Error refrescando token:', error);
    
    res.status(401).json({
      success: false,
      error: 'Token de refresco inválido'
    });
  }
};

/**
 * 👤 OBTENER PERFIL DE USUARIO
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        subscription: user.subscription,
        usage: user.usage,
        profile: user.profile,
        preferences: user.preferences,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('[AuthController] Error obteniendo perfil:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * 📝 ACTUALIZAR PERFIL
 */
export const updateProfile = [
  // Validaciones
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres'),
  body('profile.company')
    .optional()
    .trim(),
  body('profile.phone')
    .optional()
    .trim(),
  body('preferences.emailNotifications')
    .optional()
    .isBoolean(),
  body('preferences.marketingEmails')
    .optional()
    .isBoolean(),

  // Controlador
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array()
        });
        return;
      }

      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      const updates = req.body;

      // Validar que al menos hay algo que actualizar
      if (!updates.name && !updates.profile && !updates.preferences) {
        res.status(400).json({
          success: false,
          error: 'No hay datos para actualizar'
        });
        return;
      }

      // Preparar datos de actualización para Prisma
      const updateData: any = {};
      
      // Actualizar nombre directamente
      if (updates.name) {
        updateData.name = updates.name;
      }

      // Actualizar perfil con upsert (crear si no existe, actualizar si existe)
      if (updates.profile) {
        updateData.profile = {
          upsert: {
            where: { userId: user.id },
            create: { ...updates.profile, userId: user.id },
            update: updates.profile
          }
        };
      }

      // Actualizar preferencias con upsert
      if (updates.preferences) {
        updateData.preferences = {
          upsert: {
            where: { userId: user.id },
            create: { ...updates.preferences, userId: user.id },
            update: updates.preferences
          }
        };
      }

      // Actualizar usuario usando UserService
      const updatedUser = await UserService.updateUser(user.id, updateData);
      const userWithTypes = updatedUser as any; // Type assertion para resolver errores de tipos

      res.json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: {
          id: userWithTypes.id,
          email: userWithTypes.email,
          name: userWithTypes.name,
          profile: userWithTypes.profile,
          preferences: userWithTypes.preferences
        }
      });

    } catch (error) {
      logger.error('[AuthController] Error actualizando perfil:', error);
      
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
];

/**
 * 🔒 SOLICITAR RESET DE CONTRASEÑA
 */
export const requestPasswordReset = [
  // Validaciones
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),

  // Controlador
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Email inválido'
        });
        return;
      }

      const { email } = req.body;

      await authService.requestPasswordReset(email);

      res.json({
        success: true,
        message: 'Si el email existe, se enviará un link de recuperación'
      });

    } catch (error) {
      logger.error('[AuthController] Error en solicitud de reset:', error);
      
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
];

/**
 * 🔑 RESETEAR CONTRASEÑA
 */
export const resetPassword = [
  // Validaciones
  body('token')
    .notEmpty()
    .withMessage('Token requerido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),

  // Controlador
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Datos de entrada inválidos',
          details: errors.array()
        });
        return;
      }

      const { token, password } = req.body;

      await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: 'Contraseña reseteada exitosamente'
      });

    } catch (error) {
      logger.error('[AuthController] Error en reset de contraseña:', error);
      
      const message = error instanceof Error ? error.message : 'Error interno del servidor';
      const statusCode = message.includes('inválido') || message.includes('expirado') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: message
      });
    }
  }
];

/**
 * ✉️ VERIFICAR EMAIL
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token de verificación requerido'
      });
      return;
    }

    await authService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verificado exitosamente'
    });

  } catch (error) {
    logger.error('[AuthController] Error verificando email:', error);
    
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    
    res.status(400).json({
      success: false,
      error: message
    });
  }
};

/**
 * 🚪 LOGOUT (opcional - principalmente del lado cliente)
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // En JWT no necesitamos invalidar tokens del lado servidor
    // Esto se maneja del lado cliente eliminando el token
    
    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    logger.error('[AuthController] Error en logout:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};
