import { Request, Response } from 'express';
import { CleanupService } from '../services/cleanupService.js';
import { logger } from '../utils/logger.js';

/**
 * 🧹 CONTROLADOR DE SERVICIO DE LIMPIEZA
 * 
 * Maneja las operaciones de limpieza y mantenimiento del sistema
 */
export class CleanupController {

  /**
   * 🗑️ EJECUTAR LIMPIEZA COMPLETA
   */
  static performFullCleanup = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[CleanupController] 🗑️ Iniciando limpieza completa');

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Verificar permisos de administrador
      const user = await CleanupService.getUserById(userId);
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }

      const result = await CleanupService.performFullCleanup();

      res.status(200).json({
        message: 'Limpieza completa ejecutada exitosamente',
        data: result
      });

    } catch (error: any) {
      logger.error('[CleanupController] ❌ Error ejecutando limpieza completa:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  };

  /**
   * 🎬 LIMPIAR VIDEOS FALLIDOS
   */
  static cleanupFailedVideos = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[CleanupController] 🎬 Limpiando videos fallidos');

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Verificar permisos de administrador
      const user = await CleanupService.getUserById(userId);
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }

      const result = await CleanupService.cleanupFailedVideos();

      res.status(200).json({
        message: 'Videos fallidos limpiados exitosamente',
        data: result
      });

    } catch (error: any) {
      logger.error('[CleanupController] ❌ Error limpiando videos fallidos:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  };

  /**
   * 🔑 LIMPIAR TOKENS EXPIRADOS
   */
  static cleanupExpiredTokens = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[CleanupController] 🔑 Limpiando tokens expirados');

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Verificar permisos de administrador
      const user = await CleanupService.getUserById(userId);
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }

      const result = await CleanupService.cleanupExpiredTokens();

      res.status(200).json({
        message: 'Tokens expirados limpiados exitosamente',
        data: result
      });

    } catch (error: any) {
      logger.error('[CleanupController] ❌ Error limpiando tokens:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  };

  /**
   * 📁 LIMPIAR ARCHIVOS TEMPORALES
   */
  static cleanupTempFiles = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[CleanupController] 📁 Limpiando archivos temporales');

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Verificar permisos de administrador
      const user = await CleanupService.getUserById(userId);
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }

      const result = await CleanupService.cleanupTempFiles();

      res.status(200).json({
        message: 'Archivos temporales limpiados exitosamente',
        data: result
      });

    } catch (error: any) {
      logger.error('[CleanupController] ❌ Error limpiando archivos temporales:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  };

  /**
   * 📊 OBTENER INFORMACIÓN DE ALMACENAMIENTO
   */
  static getStorageInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[CleanupController] 📊 Obteniendo información de almacenamiento');

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Verificar permisos de administrador
      const user = await CleanupService.getUserById(userId);
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }

      const storageInfo = await CleanupService.getStorageInfo();

      res.status(200).json({
        message: 'Información de almacenamiento obtenida exitosamente',
        data: storageInfo
      });

    } catch (error: any) {
      logger.error('[CleanupController] ❌ Error obteniendo información de almacenamiento:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  };

  /**
   * ⚡ OPTIMIZAR BASE DE DATOS
   */
  static optimizeDatabase = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[CleanupController] ⚡ Optimizando base de datos');

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Verificar permisos de administrador
      const user = await CleanupService.getUserById(userId);
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }

      const result = await CleanupService.optimizeDatabase();

      res.status(200).json({
        message: 'Base de datos optimizada exitosamente',
        data: result
      });

    } catch (error: any) {
      logger.error('[CleanupController] ❌ Error optimizando base de datos:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  };

  /**
   * 📈 OBTENER ESTADÍSTICAS DE SISTEMA
   */
  static getSystemStats = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[CleanupController] 📈 Obteniendo estadísticas del sistema');

      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      // Verificar permisos de administrador
      const user = await CleanupService.getUserById(userId);
      if (!user || user.role !== 'ADMIN') {
        res.status(403).json({
          error: 'Se requieren permisos de administrador',
          code: 'ADMIN_REQUIRED'
        });
        return;
      }

      const stats = await CleanupService.getSystemStats();

      res.status(200).json({
        message: 'Estadísticas del sistema obtenidas exitosamente',
        data: stats
      });

    } catch (error: any) {
      logger.error('[CleanupController] ❌ Error obteniendo estadísticas:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error.message
      });
    }
  };
}
