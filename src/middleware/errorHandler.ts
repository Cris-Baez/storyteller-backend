import { Request, Response, NextFunction } from 'express';
import { AppError, isOperationalError } from '../utils/errors.js';

/**
 * Middleware para manejar errores de la aplicación
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log del error
  console.error('Error capturado:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id
  });

  // Si ya se envió una respuesta, delegar al manejador por defecto
  if (res.headersSent) {
    return next(error);
  }

  // Errores operacionales (conocidos)
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.name,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
    return;
  }

  // Errores de validación de Prisma
  if (error.name === 'PrismaClientValidationError') {
    res.status(400).json({
      success: false,
      message: 'Error de validación de datos',
      code: 'VALIDATION_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
    return;
  }

  // Errores de conexión de Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    
    switch (prismaError.code) {
      case 'P2002':
        res.status(409).json({
          success: false,
          message: 'Ya existe un registro con esos datos',
          code: 'DUPLICATE_RECORD'
        });
        return;
      
      case 'P2025':
        res.status(404).json({
          success: false,
          message: 'Registro no encontrado',
          code: 'RECORD_NOT_FOUND'
        });
        return;
      
      default:
        res.status(500).json({
          success: false,
          message: 'Error de base de datos',
          code: 'DATABASE_ERROR',
          ...(process.env.NODE_ENV === 'development' && { details: prismaError.message })
        });
        return;
    }
  }

  // Errores de PayPal
  if (error.message?.includes('PayPal') || error.name?.includes('PayPal')) {
    res.status(502).json({
      success: false,
      message: 'Error del servicio de pagos. Inténtalo más tarde.',
      code: 'PAYMENT_SERVICE_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
    return;
  }

  // Errores de JWT
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token de acceso inválido',
      code: 'INVALID_TOKEN'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token de acceso expirado',
      code: 'EXPIRED_TOKEN'
    });
    return;
  }

  // Errores de SyntaxError (JSON malformado)
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      message: 'JSON malformado en la solicitud',
      code: 'MALFORMED_JSON'
    });
    return;
  }

  // Error genérico del servidor
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    code: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error.message 
    })
  });
}

/**
 * Middleware para capturar rutas no encontradas
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new AppError(`Ruta no encontrada: ${req.method} ${req.path}`, 404);
  next(error);
}

/**
 * Middleware para validar que el usuario sea propietario de un recurso
 */
export function validateResourceOwnership(resourceUserIdField: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentUserId = req.user?.id;
    const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

    if (!currentUserId) {
      next(new AppError('Usuario no autenticado', 401));
      return;
    }

    if (resourceUserId && resourceUserId !== currentUserId) {
      next(new AppError('No tienes permisos para acceder a este recurso', 403));
      return;
    }

    next();
  };
}
