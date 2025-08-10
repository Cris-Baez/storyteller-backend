/**
 * 🚨 SERVICIO CRÍTICO DE VALIDACIÓN DE LÍMITES
 * Centraliza toda la lógica de límites según flujo.txt
 * DEBE ser llamado antes de crear cualquier video
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
}
