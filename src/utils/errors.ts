/**
 * Error personalizado de la aplicación
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Mantener el stack trace
    Error.captureStackTrace(this, this.constructor);
    
    // Asegurar que el nombre sea correcto
    this.name = this.constructor.name;
  }
}

/**
 * Error de validación
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * Error de autorización
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

/**
 * Error de recurso no encontrado
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

/**
 * Error de conflicto
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Error de rate limiting
 */
export class RateLimitError extends AppError {
  constructor(message = 'Demasiadas solicitudes') {
    super(message, 429);
  }
}

/**
 * Error de servicio externo
 */
export class ExternalServiceError extends AppError {
  constructor(message: string, statusCode = 502) {
    super(message, statusCode);
  }
}

/**
 * Verificar si un error es operacional (manejable)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
