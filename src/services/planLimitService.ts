/**
 * 🚨 SERVICIO COMPLETO DE VALIDACIÓN DE LÍMITES
 * Centraliza toda la lógica de límites según flujo.txt con control granular
 * DEBE ser llamado antes de usar cualquier funcionalidad premium
 */

import { PrismaClient } from '../../generated/prisma/index.js';
import { getPlanConfig, getPlanLimits } from '../config/plans.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface LimitValidationResult {
  canCreate: boolean;
  reason?: string;
  currentUsage: number;
  maxAllowed: number;
  planName: string;
  resetDate: Date;
  feature?: string;
}

export interface FeatureLimits {
  videoGeneration: LimitValidationResult;
  editorAccess: LimitValidationResult;
  agentAutomation: LimitValidationResult;
  exportQuality: LimitValidationResult;
  storageLimit: LimitValidationResult;
  templateAccess: LimitValidationResult;
}

export interface UsageStats {
  videosThisWeek: number;
  videosThisMonth: number;
  storageUsedMB: number;
  editorUsage: number;
  agentGenerations: number;
  lastReset: Date;
}

export class PlanLimitService {
  
  /**
   * 🚨 VALIDACIÓN CRÍTICA ANTES DE CREAR VIDEO
   * Según flujo.txt: Backend verifica plan y contador (límite por semana)
   */
  static async validateVideoCreation(userId: number): Promise<LimitValidationResult> {
    logger.info(`[PlanLimitService] Validando límites para usuario ${userId}`);

    try {
      // Obtener usuario con suscripción y uso actual
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          usage: true
        }
      });

      if (!user) {
        return {
          canCreate: false,
          reason: 'Usuario no encontrado',
          currentUsage: 0,
          maxAllowed: 0,
          planName: 'NONE',
          resetDate: new Date()
        };
      }

      // Determinar plan actual - usar plan del usuario directamente
      const currentPlan = user.plan || 'STARTER';
      const planConfig = getPlanConfig(currentPlan);
      
      // Crear usage si no existe
      if (!user.usage) {
        await this.createInitialUsage(userId);
        // Después de crear usage inicial, el usuario siempre puede crear su primer video
        return {
          canCreate: true, 
          reason: undefined,
          currentUsage: 0,
          maxAllowed: planConfig.videosPerWeek,
          planName: currentPlan,
          resetDate: this.getNextWeekReset()
        };
      }

      // Verificar si necesita reset semanal
      const now = new Date();
      if (now >= user.usage.weekResetDate) {
        await this.resetWeeklyUsage(userId);
        // Después del reset, el usuario puede crear videos
        return {
          canCreate: true,
          currentUsage: 0,
          maxAllowed: planConfig.videosPerWeek,
          planName: currentPlan,
          resetDate: this.getNextWeekReset()
        };
      }

      // Verificar límite actual
      const canCreate = planConfig.videosPerWeek === Infinity || 
                       user.usage.videosThisWeek < planConfig.videosPerWeek;

      return {
        canCreate,
        reason: !canCreate ? `Límite semanal alcanzado (${planConfig.videosPerWeek} videos)` : undefined,
        currentUsage: user.usage.videosThisWeek,
        maxAllowed: planConfig.videosPerWeek,
        planName: currentPlan,
        resetDate: user.usage.weekResetDate
      };

    } catch (error) {
      logger.error('[PlanLimitService] Error validando límites:', error);
      return {
        canCreate: false,
        reason: 'Error interno validando límites',
        currentUsage: 0,
        maxAllowed: 0,
        planName: 'ERROR',
        resetDate: new Date()
      };
    }
  }

  /**
   * 📊 REGISTRAR USO DESPUÉS DE COMPLETAR VIDEO
   * Según flujo.txt: Backend actualiza uso del plan
   */
  static async recordVideoCreation(userId: number): Promise<void> {
    logger.info(`[PlanLimitService] Registrando uso de video para usuario ${userId}`);

    try {
      await prisma.usage.upsert({
        where: { userId },
        update: {
          videosThisWeek: { increment: 1 }
        },
        create: {
          userId,
          videosThisWeek: 1,
          weekResetDate: this.getNextWeekReset()
        }
      });

      logger.info(`[PlanLimitService] ✅ Uso registrado exitosamente para usuario ${userId}`);

    } catch (error) {
      logger.error(`[PlanLimitService] Error registrando uso:`, error);
      throw error;
    }
  }

  /**
   * 🔄 RESET SEMANAL DE CONTADORES
   */
  private static async resetWeeklyUsage(userId: number): Promise<void> {
    logger.info(`[PlanLimitService] Reseteando contadores semanales para usuario ${userId}`);

    await prisma.usage.update({
      where: { userId },
      data: {
        videosThisWeek: 0,
        weekResetDate: this.getNextWeekReset()
      }
    });
  }

  /**
   * 📅 CREAR USAGE INICIAL
   */
  private static async createInitialUsage(userId: number): Promise<void> {
    await prisma.usage.create({
      data: {
        userId,
        videosThisWeek: 0,
        weekResetDate: this.getNextWeekReset()
      }
    });
  }

  /**
   * 📅 OBTENER PRÓXIMA FECHA DE RESET (LUNES A LAS 00:00)
   */
  private static getNextWeekReset(): Date {
    const now = new Date();
    const nextMonday = new Date(now);
    
    // Obtener días hasta el próximo lunes
    const daysUntilMonday = (8 - now.getDay()) % 7;
    
    nextMonday.setDate(now.getDate() + (daysUntilMonday || 7));
    nextMonday.setHours(0, 0, 0, 0);
    
    return nextMonday;
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE USO ACTUAL
   */
  static async getUserUsageStats(userId: number): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        usage: true
      }
    });

    if (!user) return null;

    // Usar el plan directamente del usuario
    const currentPlan = user.plan;
    const planConfig = getPlanConfig(currentPlan);

    return {
      currentUsage: user.usage?.videosThisWeek || 0,
      maxAllowed: planConfig.videosPerWeek,
      resetDate: user.usage?.weekResetDate || this.getNextWeekReset(),
      planName: currentPlan
    };
  }

  /**
   * 🎬 VALIDAR ACCESO AL EDITOR PROFESIONAL
   */
  static async validateEditorAccess(userId: number): Promise<LimitValidationResult> {
    logger.info(`[PlanLimitService] Validando acceso al Editor para usuario ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          canCreate: false,
          reason: 'Usuario no encontrado',
          currentUsage: 0,
          maxAllowed: 0,
          planName: 'NONE',
          resetDate: new Date(),
          feature: 'editor'
        };
      }

      const hasEditorAccess = user.plan === 'STUDIO_PRO';

      return {
        canCreate: hasEditorAccess,
        reason: hasEditorAccess ? undefined : 'El Editor Profesional requiere plan Studio Pro ($99/mes)',
        currentUsage: 0,
        maxAllowed: hasEditorAccess ? 999 : 0,
        planName: user.plan,
        resetDate: new Date(),
        feature: 'editor'
      };

    } catch (error) {
      logger.error(`[PlanLimitService] Error validando acceso al Editor:`, error);
      return {
        canCreate: false,
        reason: 'Error interno validando acceso',
        currentUsage: 0,
        maxAllowed: 0,
        planName: 'ERROR',
        resetDate: new Date(),
        feature: 'editor'
      };
    }
  }

  /**
   * 🤖 VALIDAR ACCESO AL AGENTE AUTOMÁTICO
   */
  static async validateAgentAccess(userId: number): Promise<LimitValidationResult> {
    logger.info(`[PlanLimitService] Validando acceso al Agente para usuario ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { usage: true }
      });

      if (!user) {
        return {
          canCreate: false,
          reason: 'Usuario no encontrado',
          currentUsage: 0,
          maxAllowed: 0,
          planName: 'NONE',
          resetDate: new Date(),
          feature: 'agent'
        };
      }

      const hasAgentAccess = user.plan === 'CREATOR' || user.plan === 'STUDIO_PRO';

      return {
        canCreate: hasAgentAccess,
        reason: hasAgentAccess ? undefined : 'El Agente Automático requiere plan Creator ($29/mes) o superior',
        currentUsage: user.usage?.agentGenerations || 0,
        maxAllowed: hasAgentAccess ? (user.plan === 'STUDIO_PRO' ? 20 : 10) : 0,
        planName: user.plan,
        resetDate: user.usage?.weekResetDate || this.getNextWeekReset(),
        feature: 'agent'
      };

    } catch (error) {
      logger.error(`[PlanLimitService] Error validando acceso al Agente:`, error);
      return {
        canCreate: false,
        reason: 'Error interno validando acceso',
        currentUsage: 0,
        maxAllowed: 0,
        planName: 'ERROR',
        resetDate: new Date(),
        feature: 'agent'
      };
    }
  }

  /**
   * 📥 VALIDAR CALIDAD DE EXPORTACIÓN
   */
  static async validateExportQuality(userId: number, requestedQuality: string): Promise<LimitValidationResult> {
    logger.info(`[PlanLimitService] Validando calidad de exportación ${requestedQuality} para usuario ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          canCreate: false,
          reason: 'Usuario no encontrado',
          currentUsage: 0,
          maxAllowed: 0,
          planName: 'NONE',
          resetDate: new Date(),
          feature: 'export_quality'
        };
      }

      let maxQuality = '720p';
      let canExport = false;

      switch (user.plan) {
        case 'STARTER':
          maxQuality = '720p';
          canExport = requestedQuality === '720p';
          break;
        case 'CREATOR':
          maxQuality = '1080p';
          canExport = ['720p', '1080p'].includes(requestedQuality);
          break;
        case 'STUDIO_PRO':
          maxQuality = '4K';
          canExport = ['720p', '1080p', '4K'].includes(requestedQuality);
          break;
      }

      return {
        canCreate: canExport,
        reason: canExport ? undefined : `Tu plan ${user.plan} solo permite exportar hasta ${maxQuality}`,
        currentUsage: 0,
        maxAllowed: 999,
        planName: user.plan,
        resetDate: new Date(),
        feature: 'export_quality'
      };

    } catch (error) {
      logger.error(`[PlanLimitService] Error validando calidad de exportación:`, error);
      return {
        canCreate: false,
        reason: 'Error interno validando calidad',
        currentUsage: 0,
        maxAllowed: 0,
        planName: 'ERROR',
        resetDate: new Date(),
        feature: 'export_quality'
      };
    }
  }

  /**
   * 💾 VALIDAR LÍMITE DE ALMACENAMIENTO
   */
  static async validateStorageLimit(userId: number, requiredSpaceMB: number): Promise<LimitValidationResult> {
    logger.info(`[PlanLimitService] Validando almacenamiento para usuario ${userId}: ${requiredSpaceMB}MB requeridos`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { usage: true }
      });

      if (!user) {
        return {
          canCreate: false,
          reason: 'Usuario no encontrado',
          currentUsage: 0,
          maxAllowed: 0,
          planName: 'NONE',
          resetDate: new Date(),
          feature: 'storage'
        };
      }

      let maxStorageGB = 0;
      switch (user.plan) {
        case 'STARTER':
          maxStorageGB = 1; // 1GB
          break;
        case 'CREATOR':
          maxStorageGB = 10; // 10GB
          break;
        case 'STUDIO_PRO':
          maxStorageGB = 100; // 100GB
          break;
      }

      const maxStorageMB = maxStorageGB * 1024;
      const currentUsageMB = user.usage?.storageUsedMB || 0;
      const willExceed = (currentUsageMB + requiredSpaceMB) > maxStorageMB;

      return {
        canCreate: !willExceed,
        reason: willExceed ? `Límite de almacenamiento excedido. Tu plan ${user.plan} permite ${maxStorageGB}GB` : undefined,
        currentUsage: currentUsageMB,
        maxAllowed: maxStorageMB,
        planName: user.plan,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        feature: 'storage'
      };

    } catch (error) {
      logger.error(`[PlanLimitService] Error validando límite de almacenamiento:`, error);
      return {
        canCreate: false,
        reason: 'Error interno validando almacenamiento',
        currentUsage: 0,
        maxAllowed: 0,
        planName: 'ERROR',
        resetDate: new Date(),
        feature: 'storage'
      };
    }
  }

  /**
   * 🎨 VALIDAR ACCESO A PLANTILLAS PREMIUM
   */
  static async validateTemplateAccess(userId: number, templateTier: string): Promise<LimitValidationResult> {
    logger.info(`[PlanLimitService] Validando acceso a plantilla ${templateTier} para usuario ${userId}`);

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return {
          canCreate: false,
          reason: 'Usuario no encontrado',
          currentUsage: 0,
          maxAllowed: 0,
          planName: 'NONE',
          resetDate: new Date(),
          feature: 'template_access'
        };
      }

      let canAccess = false;
      let reason: string | undefined;

      switch (templateTier) {
        case 'free':
          canAccess = true;
          break;
        case 'creator':
          canAccess = user.plan === 'CREATOR' || user.plan === 'STUDIO_PRO';
          reason = canAccess ? undefined : 'Plantillas Creator requieren plan Creator ($29/mes) o superior';
          break;
        case 'studio_pro':
          canAccess = user.plan === 'STUDIO_PRO';
          reason = canAccess ? undefined : 'Plantillas Studio Pro requieren plan Studio Pro ($99/mes)';
          break;
      }

      return {
        canCreate: canAccess,
        reason,
        currentUsage: 0,
        maxAllowed: canAccess ? 999 : 0,
        planName: user.plan,
        resetDate: new Date(),
        feature: 'template_access'
      };

    } catch (error) {
      logger.error(`[PlanLimitService] Error validando acceso a plantillas:`, error);
      return {
        canCreate: false,
        reason: 'Error interno validando plantillas',
        currentUsage: 0,
        maxAllowed: 0,
        planName: 'ERROR',
        resetDate: new Date(),
        feature: 'template_access'
      };
    }
  }

  /**
   * 📊 OBTENER TODAS LAS LIMITACIONES DE UNA VEZ
   */
  static async getAllFeatureLimits(userId: number): Promise<FeatureLimits> {
    logger.info(`[PlanLimitService] Obteniendo todos los límites para usuario ${userId}`);

    const [video, editor, agent, exportQuality, storage, template] = await Promise.all([
      this.validateVideoCreation(userId),
      this.validateEditorAccess(userId),
      this.validateAgentAccess(userId),
      this.validateExportQuality(userId, '1080p'), // Verificar calidad media
      this.validateStorageLimit(userId, 0),
      this.validateTemplateAccess(userId, 'creator')
    ]);

    return {
      videoGeneration: video,
      editorAccess: editor,
      agentAutomation: agent,
      exportQuality,
      storageLimit: storage,
      templateAccess: template
    };
  }

  /**
   * 📈 OBTENER ESTADÍSTICAS DETALLADAS DE USO
   */
  static async getDetailedUsageStats(userId: number): Promise<UsageStats | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { usage: true }
      });

      if (!user) return null;

      const startOfWeek = this.getStartOfWeek();
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

      const [videosThisWeek, videosThisMonth] = await Promise.all([
        prisma.video.count({
          where: {
            userId,
            createdAt: { gte: startOfWeek }
          }
        }),
        prisma.video.count({
          where: {
            userId,
            createdAt: { gte: startOfMonth }
          }
        })
      ]);

      return {
        videosThisWeek,
        videosThisMonth,
        storageUsedMB: user.usage?.storageUsedMB || 0,
        editorUsage: user.usage?.editorUsage || 0,
        agentGenerations: user.usage?.agentGenerations || 0,
        lastReset: user.usage?.weekResetDate || this.getStartOfWeek()
      };

    } catch (error) {
      logger.error(`[PlanLimitService] Error obteniendo estadísticas detalladas:`, error);
      return null;
    }
  }

  /**
   * 🔄 ACTUALIZAR USO DE FEATURES ESPECÍFICAS
   */
  static async recordFeatureUsage(userId: number, feature: string, amount: number = 1): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { usage: true }
      });

      if (!user) return;

      let updateData: any = {};

      switch (feature) {
        case 'editor':
          updateData.editorUsage = (user.usage?.editorUsage || 0) + amount;
          break;
        case 'agent':
          updateData.agentGenerations = (user.usage?.agentGenerations || 0) + amount;
          break;
        case 'storage':
          updateData.storageUsedMB = (user.usage?.storageUsedMB || 0) + amount;
          break;
      }

      if (user.usage) {
        await prisma.usage.update({
          where: { userId },
          data: updateData
        });
      } else {
        await prisma.usage.create({
          data: {
            userId,
            weekResetDate: this.getNextWeekReset(),
            ...updateData
          }
        });
      }

      logger.info(`[PlanLimitService] Uso registrado para usuario ${userId}: ${feature} +${amount}`);

    } catch (error) {
      logger.error(`[PlanLimitService] Error registrando uso de ${feature}:`, error);
    }
  }

  /**
   * 🗓️ OBTENER INICIO DE SEMANA
   */
  private static getStartOfWeek(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }
}
