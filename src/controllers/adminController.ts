import { Request, Response } from 'express';
import { AdminService, AdminUserFilters, AdminVideoFilters } from '../services/adminService.js';
import { logger } from '../utils/logger.js';
import { query, param, body, validationResult } from 'express-validator';

/**
 * 🧠 CONTROLADOR DE ADMINISTRACIÓN
 */
export class AdminController {

  /**
   * 📊 OBTENER ESTADÍSTICAS DEL DASHBOARD
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[AdminController] 📊 Obteniendo estadísticas del dashboard [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      const stats = await AdminService.getDashboardStats();

      res.json({
        success: true,
        data: stats,
        requestId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error obteniendo estadísticas [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 👥 OBTENER LISTA DE USUARIOS
   */
  async getUsers(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[AdminController] 👥 Obteniendo usuarios [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      // Construir filtros
      const filters: AdminUserFilters = {};
      if (req.query.plan) filters.plan = req.query.plan as string;
      if (req.query.role) filters.role = req.query.role as string;
      if (req.query.isActive !== undefined) filters.isActive = req.query.isActive === 'true';
      if (req.query.registeredAfter) filters.registeredAfter = new Date(req.query.registeredAfter as string);
      if (req.query.registeredBefore) filters.registeredBefore = new Date(req.query.registeredBefore as string);

      // Paginación
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await AdminService.getUsers(filters, page, limit);

      res.json({
        success: true,
        data: result,
        filters,
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error obteniendo usuarios [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 👤 OBTENER DETALLES DE USUARIO
   */
  async getUserDetails(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const userId = parseInt(req.params.userId);

    logger.info(`[AdminController] 👤 Obteniendo detalles del usuario ${userId} [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido',
          requestId
        });
        return;
      }

      const user = await AdminService.getUserDetails(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
          requestId
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error obteniendo detalles del usuario [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * ✏️ CAMBIAR PLAN DE USUARIO
   */
  async changeUserPlan(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const userId = parseInt(req.params.userId);

    logger.info(`[AdminController] ✏️ Cambiando plan del usuario ${userId} [${requestId}]`);

    try {
      // Verificar validación
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

      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido',
          requestId
        });
        return;
      }

      const { plan } = req.body;
      const updatedUser = await AdminService.changeUserPlan(userId, plan);

      res.json({
        success: true,
        data: updatedUser,
        message: `Plan cambiado a ${plan} exitosamente`,
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error cambiando plan [${requestId}]:`, error);
      
      if (error instanceof Error && error.message === 'Usuario no encontrado') {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
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
   * 🔒 ACTIVAR/DESACTIVAR USUARIO
   */
  async toggleUserStatus(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const userId = parseInt(req.params.userId);

    logger.info(`[AdminController] 🔒 Cambiando estado del usuario ${userId} [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      if (isNaN(userId)) {
        res.status(400).json({
          success: false,
          error: 'ID de usuario inválido',
          requestId
        });
        return;
      }

      const result = await AdminService.toggleUserStatus(userId);
      const status = result.isActive ? 'activado' : 'desactivado';

      res.json({
        success: true,
        data: result,
        message: `Usuario ${status} exitosamente`,
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error cambiando estado del usuario [${requestId}]:`, error);
      
      if (error instanceof Error && error.message === 'Usuario no encontrado') {
        res.status(404).json({
          success: false,
          error: 'Usuario no encontrado',
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
   * 🎬 OBTENER LISTA DE VIDEOS
   */
  async getVideos(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[AdminController] 🎬 Obteniendo videos [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      // Construir filtros
      const filters: AdminVideoFilters = {};
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.type) filters.type = req.query.type as string;
      if (req.query.userId) filters.userId = parseInt(req.query.userId as string);
      if (req.query.createdAfter) filters.createdAfter = new Date(req.query.createdAfter as string);
      if (req.query.createdBefore) filters.createdBefore = new Date(req.query.createdBefore as string);

      // Paginación
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await AdminService.getVideos(filters, page, limit);

      res.json({
        success: true,
        data: result,
        filters,
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error obteniendo videos [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🔄 REINTENTAR VIDEO FALLIDO
   */
  async retryFailedVideo(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const videoId = parseInt(req.params.videoId);

    logger.info(`[AdminController] 🔄 Reintentando video ${videoId} [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      if (isNaN(videoId)) {
        res.status(400).json({
          success: false,
          error: 'ID de video inválido',
          requestId
        });
        return;
      }

      const updatedVideo = await AdminService.retryFailedVideo(videoId);

      res.json({
        success: true,
        data: updatedVideo,
        message: 'Video marcado para reintento exitosamente',
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error reintentando video [${requestId}]:`, error);
      
      if (error instanceof Error && error.message.includes('no encontrado')) {
        res.status(404).json({
          success: false,
          error: error.message,
          requestId
        });
      } else if (error instanceof Error && error.message.includes('Solo se pueden')) {
        res.status(400).json({
          success: false,
          error: error.message,
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
   * 🗑️ ELIMINAR VIDEO CORRUPTO
   */
  async deleteCorruptedVideo(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    const videoId = parseInt(req.params.videoId);

    logger.info(`[AdminController] 🗑️ Eliminando video corrupto ${videoId} [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      if (isNaN(videoId)) {
        res.status(400).json({
          success: false,
          error: 'ID de video inválido',
          requestId
        });
        return;
      }

      await AdminService.deleteCorruptedVideo(videoId);

      res.json({
        success: true,
        message: 'Video corrupto eliminado exitosamente',
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error eliminando video corrupto [${requestId}]:`, error);
      
      if (error instanceof Error && error.message === 'Video no encontrado') {
        res.status(404).json({
          success: false,
          error: 'Video no encontrado',
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
   * 📊 OBTENER HISTORIAL DE PAGOS
   */
  async getPaymentHistory(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[AdminController] 📊 Obteniendo historial de pagos [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      // Paginación
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      const result = await AdminService.getPaymentHistory(page, limit);

      res.json({
        success: true,
        data: result,
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error obteniendo historial de pagos [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 📝 OBTENER LOGS DE ERRORES
   */
  async getRecentErrors(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[AdminController] 📝 Obteniendo logs de errores [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
      const errors = await AdminService.getRecentErrors(limit);

      res.json({
        success: true,
        data: errors,
        count: errors.length,
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error obteniendo logs de errores [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }

  /**
   * 🧹 EJECUTAR LIMPIEZA DE MANTENIMIENTO
   */
  async performMaintenance(req: Request, res: Response): Promise<void> {
    const requestId = Date.now().toString();
    logger.info(`[AdminController] 🧹 Ejecutando limpieza de mantenimiento [${requestId}]`);

    try {
      // Verificar que sea admin
      const userRole = (req as any).user?.role;
      if (userRole !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores',
          requestId
        });
        return;
      }

      const result = await AdminService.performMaintenanceCleanup();

      res.json({
        success: true,
        data: result,
        message: 'Limpieza de mantenimiento completada exitosamente',
        requestId
      });

    } catch (error) {
      logger.error(`[AdminController] ❌ Error en limpieza de mantenimiento [${requestId}]:`, error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        requestId
      });
    }
  }
}

/**
 * 🔍 VALIDADORES PARA LOS ENDPOINTS DE ADMIN
 */
export const validateChangeUserPlan = [
  body('plan')
    .isIn(['STARTER', 'CREATOR', 'STUDIO_PRO'])
    .withMessage('Plan inválido. Debe ser STARTER, CREATOR o STUDIO_PRO')
];

export const validateUserIdParam = [
  param('userId')
    .isInt({ min: 1 })
    .withMessage('ID de usuario debe ser un número entero positivo')
];

export const validateVideoIdParam = [
  param('videoId')
    .isInt({ min: 1 })
    .withMessage('ID de video debe ser un número entero positivo')
];

// Instancia del controlador
export const adminController = new AdminController();
