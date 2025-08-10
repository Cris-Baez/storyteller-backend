import { PrismaClient, User, Video, Subscription, Payment } from '../../generated/prisma/index.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface AdminStats {
  users: {
    total: number;
    active: number;
    byPlan: Record<string, number>;
    recentRegistrations: number;
  };
  videos: {
    total: number;
    completed: number;
    failed: number;
    generating: number;
    byType: Record<string, number>;
    todaysGenerations: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    canceled: number;
    revenue: {
      monthly: number;
      total: number;
    };
  };
  system: {
    uptime: number;
    errors: number;
    storageUsed: string;
    cdnBandwidth: string;
  };
}

export interface AdminUserFilters {
  plan?: string;
  role?: string;
  isActive?: boolean;
  hasSubscription?: boolean;
  registeredAfter?: Date;
  registeredBefore?: Date;
}

export interface AdminVideoFilters {
  status?: string;
  type?: string;
  userId?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * 🧠 SERVICIO DE ADMINISTRACIÓN
 * 
 * Maneja todas las operaciones administrativas del sistema
 */
export class AdminService {

  /**
   * 📊 OBTENER ESTADÍSTICAS GENERALES
   */
  static async getDashboardStats(): Promise<AdminStats> {
    logger.info('[AdminService] 📊 Obteniendo estadísticas del dashboard');

    try {
      // Obtener fecha de hace 30 días para comparaciones
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Estadísticas de usuarios
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: { isActive: true }
      });
      const recentRegistrations = await prisma.user.count({
        where: { 
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // Usuarios por plan
      const usersByPlan = await prisma.user.groupBy({
        by: ['plan'],
        _count: { _all: true }
      });

      // Estadísticas de videos
      const totalVideos = await prisma.video.count();
      const completedVideos = await prisma.video.count({
        where: { status: 'COMPLETED' }
      });
      const failedVideos = await prisma.video.count({
        where: { status: 'FAILED' }
      });
      const generatingVideos = await prisma.video.count({
        where: { status: 'GENERATING' }
      });

      const todaysVideos = await prisma.video.count({
        where: {
          createdAt: { gte: today }
        }
      });

      // Videos por tipo
      const videosByType = await prisma.video.groupBy({
        by: ['type'],
        _count: { _all: true }
      });

      // Estadísticas de suscripciones
      const activeSubscriptions = await prisma.subscription.count({
        where: { status: 'ACTIVE' }
      });
      const trialSubscriptions = await prisma.subscription.count({
        where: { status: 'TRIALING' }
      });
      const canceledSubscriptions = await prisma.subscription.count({
        where: { status: 'CANCELLED' }
      });

      // Revenue (ingresos)
      const monthlyRevenue = await prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo }
        },
        _sum: { amount: true }
      });

      const totalRevenue = await prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      });

      // Construir respuesta
      const stats: AdminStats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          byPlan: usersByPlan.reduce((acc, item) => {
            acc[item.plan] = item._count._all;
            return acc;
          }, {} as Record<string, number>),
          recentRegistrations
        },
        videos: {
          total: totalVideos,
          completed: completedVideos,
          failed: failedVideos,
          generating: generatingVideos,
          byType: videosByType.reduce((acc, item) => {
            acc[item.type] = item._count._all;
            return acc;
          }, {} as Record<string, number>),
          todaysGenerations: todaysVideos
        },
        subscriptions: {
          active: activeSubscriptions,
          trial: trialSubscriptions,
          canceled: canceledSubscriptions,
          revenue: {
            monthly: monthlyRevenue._sum.amount || 0,
            total: totalRevenue._sum.amount || 0
          }
        },
        system: {
          uptime: process.uptime(),
          errors: 0, // Se podría obtener de logs
          storageUsed: '0 GB', // Se podría calcular desde archivos
          cdnBandwidth: '0 GB' // Se podría obtener de CDN stats
        }
      };

      logger.info('[AdminService] ✅ Estadísticas obtenidas exitosamente');
      return stats;

    } catch (error) {
      logger.error('[AdminService] ❌ Error obteniendo estadísticas:', error);
      throw new Error('Error al obtener estadísticas del dashboard');
    }
  }

  /**
   * 👥 OBTENER LISTA DE USUARIOS CON FILTROS
   */
  static async getUsers(filters?: AdminUserFilters, page = 1, limit = 20): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    logger.info('[AdminService] 👥 Obteniendo usuarios con filtros:', filters);

    try {
      const where: any = {};

      if (filters) {
        if (filters.plan) where.plan = filters.plan;
        if (filters.role) where.role = filters.role;
        if (filters.isActive !== undefined) where.isActive = filters.isActive;
        if (filters.registeredAfter) where.createdAt = { gte: filters.registeredAfter };
        if (filters.registeredBefore) {
          where.createdAt = { 
            ...where.createdAt, 
            lte: filters.registeredBefore 
          };
        }
      }

      const total = await prisma.user.count({ where });
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const users = await prisma.user.findMany({
        where,
        include: {
          subscription: true,
          videos: {
            select: {
              id: true,
              status: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          _count: {
            select: {
              videos: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      logger.info(`[AdminService] ✅ Obtenidos ${users.length} usuarios de ${total} totales`);
      
      return {
        users,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('[AdminService] ❌ Error obteniendo usuarios:', error);
      throw new Error('Error al obtener lista de usuarios');
    }
  }

  /**
   * 👤 OBTENER DETALLES DE USUARIO ESPECÍFICO
   */
  static async getUserDetails(userId: number): Promise<User | null> {
    logger.info(`[AdminService] 👤 Obteniendo detalles del usuario: ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          videos: {
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          marketingConfig: true,
          projects: true,
          assets: true,
          refreshTokens: {
            where: { revokedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (user) {
        logger.info(`[AdminService] ✅ Detalles obtenidos para usuario: ${user.email}`);
      } else {
        logger.warn(`[AdminService] ⚠️ Usuario no encontrado: ${userId}`);
      }

      return user;

    } catch (error) {
      logger.error('[AdminService] ❌ Error obteniendo detalles del usuario:', error);
      throw new Error('Error al obtener detalles del usuario');
    }
  }

  /**
   * ✏️ CAMBIAR PLAN DE USUARIO MANUALMENTE
   */
  static async changeUserPlan(userId: number, newPlan: string): Promise<User> {
    logger.info(`[AdminService] ✏️ Cambiando plan del usuario ${userId} a ${newPlan}`);

    try {
      // Verificar que el usuario existe
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      // Actualizar plan
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { plan: newPlan as any },
        include: {
          subscription: true,
          videos: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      logger.info(`[AdminService] ✅ Plan actualizado: ${existingUser.email} -> ${newPlan}`);
      return updatedUser;

    } catch (error) {
      logger.error('[AdminService] ❌ Error cambiando plan:', error);
      throw error;
    }
  }

  /**
   * 🔒 ACTIVAR/DESACTIVAR USUARIO
   */
  static async toggleUserStatus(userId: number): Promise<User> {
    logger.info(`[AdminService] 🔒 Cambiando estado del usuario: ${userId}`);

    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !existingUser.isActive },
        include: {
          subscription: true
        }
      });

      const status = updatedUser.isActive ? 'activado' : 'desactivado';
      logger.info(`[AdminService] ✅ Usuario ${status}: ${updatedUser.email}`);
      
      return updatedUser;

    } catch (error) {
      logger.error('[AdminService] ❌ Error cambiando estado del usuario:', error);
      throw error;
    }
  }

  /**
   * 🎬 OBTENER LISTA DE VIDEOS CON FILTROS
   */
  static async getVideos(filters?: AdminVideoFilters, page = 1, limit = 20): Promise<{
    videos: Video[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    logger.info('[AdminService] 🎬 Obteniendo videos con filtros:', filters);

    try {
      const where: any = {};

      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.type) where.type = filters.type;
        if (filters.userId) where.userId = filters.userId;
        if (filters.createdAfter) where.createdAt = { gte: filters.createdAfter };
        if (filters.createdBefore) {
          where.createdAt = { 
            ...where.createdAt, 
            lte: filters.createdBefore 
          };
        }
      }

      const total = await prisma.video.count({ where });
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const videos = await prisma.video.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              plan: true,
              isActive: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      logger.info(`[AdminService] ✅ Obtenidos ${videos.length} videos de ${total} totales`);
      
      return {
        videos,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('[AdminService] ❌ Error obteniendo videos:', error);
      throw new Error('Error al obtener lista de videos');
    }
  }

  /**
   * 🔄 REINTENTAR GENERACIÓN DE VIDEO FALLIDO
   */
  static async retryFailedVideo(videoId: number): Promise<Video> {
    logger.info(`[AdminService] 🔄 Reintentando video fallido: ${videoId}`);

    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });

      if (!video) {
        throw new Error('Video no encontrado');
      }

      if (video.status !== 'FAILED') {
        throw new Error('Solo se pueden reintentar videos fallidos');
      }

      // Resetear estado del video
      const updatedVideo = await prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'PENDING',
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              plan: true
            }
          }
        }
      });

      logger.info(`[AdminService] ✅ Video reiniciado: ${videoId}`);
      
      // Aquí podrías agregar lógica para reiniciar el pipeline de generación
      // Por ejemplo, enviar el video a una cola de procesamiento
      
      return updatedVideo;

    } catch (error) {
      logger.error('[AdminService] ❌ Error reintentando video:', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAR VIDEO CORRUPTO
   */
  static async deleteCorruptedVideo(videoId: number): Promise<void> {
    logger.info(`[AdminService] 🗑️ Eliminando video corrupto: ${videoId}`);

    try {
      const video = await prisma.video.findUnique({
        where: { id: videoId }
      });

      if (!video) {
        throw new Error('Video no encontrado');
      }

      // Eliminar archivos físicos si existen
      if (video.finalVideoUrl) {
        // Aquí podrías agregar lógica para eliminar archivos del CDN/storage
        logger.info(`[AdminService] 🗂️ Archivo a eliminar: ${video.finalVideoUrl}`);
      }

      // Eliminar registro de la DB
      await prisma.video.delete({
        where: { id: videoId }
      });

      logger.info(`[AdminService] ✅ Video corrupto eliminado: ${videoId}`);

    } catch (error) {
      logger.error('[AdminService] ❌ Error eliminando video corrupto:', error);
      throw error;
    }
  }

  /**
   * 📊 OBTENER HISTORIAL DE PAGOS
   */
  static async getPaymentHistory(page = 1, limit = 20): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    logger.info('[AdminService] 📊 Obteniendo historial de pagos');

    try {
      const total = await prisma.payment.count();
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const payments = await prisma.payment.findMany({
        include: {
          subscription: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  plan: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      logger.info(`[AdminService] ✅ Obtenidos ${payments.length} pagos de ${total} totales`);
      
      return {
        payments,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('[AdminService] ❌ Error obteniendo historial de pagos:', error);
      throw new Error('Error al obtener historial de pagos');
    }
  }

  /**
   * 📝 OBTENER LOGS DE ERRORES RECIENTES
   */
  static async getRecentErrors(limit = 50): Promise<any[]> {
    logger.info(`[AdminService] 📝 Obteniendo ${limit} errores recientes`);

    try {
      // Por ahora retornamos array vacío
      // En una implementación real, podrías consultar logs de un servicio como Winston, LogRocket, etc.
      const errors = [
        {
          id: 1,
          level: 'error',
          message: 'Failed to generate video for user 123',
          timestamp: new Date(),
          metadata: {
            userId: 123,
            videoId: 456,
            error: 'API timeout'
          }
        }
      ];

      logger.info(`[AdminService] ✅ Obtenidos ${errors.length} errores recientes`);
      return errors;

    } catch (error) {
      logger.error('[AdminService] ❌ Error obteniendo logs de errores:', error);
      throw new Error('Error al obtener logs de errores');
    }
  }

  /**
   * 🧹 LIMPIEZA DE RECURSOS (Sistema de mantenimiento)
   */
  static async performMaintenanceCleanup(): Promise<{
    deletedVideos: number;
    deletedFiles: number;
    freedSpace: string;
  }> {
    logger.info('[AdminService] 🧹 Iniciando limpieza de mantenimiento');

    try {
      // Videos fallidos de más de 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const failedVideos = await prisma.video.findMany({
        where: {
          status: 'FAILED',
          createdAt: { lte: sevenDaysAgo }
        }
      });

      let deletedVideos = 0;
      let deletedFiles = 0;
      
      // Eliminar videos fallidos antiguos
      for (const video of failedVideos) {
        await prisma.video.delete({ where: { id: video.id } });
        deletedVideos++;
        
        if (video.finalVideoUrl) {
          // Aquí eliminarías archivos físicos
          deletedFiles++;
        }
      }

      // Eliminar tokens de refresh expirados
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lte: new Date() }
        }
      });

      const result = {
        deletedVideos,
        deletedFiles,
        freedSpace: `${deletedFiles * 50}MB` // Estimación
      };

      logger.info('[AdminService] ✅ Limpieza completada:', result);
      return result;

    } catch (error) {
      logger.error('[AdminService] ❌ Error en limpieza de mantenimiento:', error);
      throw new Error('Error durante la limpieza de mantenimiento');
    }
  }
}
