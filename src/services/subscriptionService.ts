import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { paypalService } from './paypalService.js';
import { PLAN_CONFIGS, getPlanConfig, getPlanLimits } from '../config/plans.js';

const prisma = new PrismaClient();

export type SubscriptionPlan = 'STARTER' | 'CREATOR' | 'STUDIO_PRO';
export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'UNPAID';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface CreateSubscriptionData {
  userId: number;
  plan: SubscriptionPlan;
}

export interface SubscriptionWithPayments {
  id: number;
  userId: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  paypalSubscriptionId: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  payments: Array<{
    id: number;
    amount: number;
    currency: string;
    status: PaymentStatus;
    paypalPaymentId: string | null;
    paypalOrderId: string | null;
    failureReason: string | null;
    createdAt: Date;
  }>;
}

class SubscriptionService {
  /**
   * Crear una nueva suscripción
   */
  async createSubscription(data: CreateSubscriptionData): Promise<SubscriptionWithPayments> {
    const { userId, plan } = data;

    // Verificar si el usuario ya tiene una suscripción activa
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'TRIALING', 'PAST_DUE']
        }
      }
    });

    if (existingSubscription) {
      throw new AppError('Usuario ya tiene una suscripción activa', 400);
    }

    // Obtener datos reales del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Calcular fechas del período
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // Todos los planes son mensuales

    try {
      // Crear suscripción en PayPal con datos reales del usuario
      const paypalSubscription = await paypalService.createSubscription({
        plan_id: this.getPayPalPlanId(plan),
        subscriber: {
          name: { 
            given_name: user.name.split(' ')[0] || 'Usuario',
            surname: user.name.split(' ').slice(1).join(' ') || 'Storyteller'
          },
          email_address: user.email
        }
      });

      // Crear suscripción en la base de datos
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
          status: 'PENDING',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          paypalSubscriptionId: paypalSubscription.id,
          cancelAtPeriodEnd: false
        },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return subscription as SubscriptionWithPayments;
    } catch (error) {
      console.error('Error creando suscripción:', error);
      throw new AppError('Error al crear la suscripción', 500);
    }
  }

  /**
   * Obtener suscripción por ID
   */
  async getSubscription(subscriptionId: number): Promise<SubscriptionWithPayments | null> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return subscription as SubscriptionWithPayments | null;
  }

  /**
   * Obtener suscripción activa del usuario
   */
  async getUserActiveSubscription(userId: number): Promise<SubscriptionWithPayments | null> {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'TRIALING', 'PAST_DUE']
        }
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return subscription as SubscriptionWithPayments | null;
  }

  /**
   * Listar suscripciones del usuario
   */
  async getUserSubscriptions(userId: number): Promise<SubscriptionWithPayments[]> {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return subscriptions as SubscriptionWithPayments[];
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(subscriptionId: number, immediate = false): Promise<SubscriptionWithPayments> {
    const subscription = await this.getSubscription(subscriptionId);
    
    if (!subscription) {
      throw new AppError('Suscripción no encontrada', 404);
    }

    if (!['ACTIVE', 'TRIALING'].includes(subscription.status)) {
      throw new AppError('La suscripción no está activa', 400);
    }

    try {
      // Cancelar en PayPal
      if (subscription.paypalSubscriptionId) {
        await paypalService.cancelSubscription(subscription.paypalSubscriptionId, immediate);
      }

      // Actualizar en la base de datos
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: immediate ? 'CANCELLED' : subscription.status as any,
          cancelAtPeriodEnd: !immediate,
          canceledAt: immediate ? new Date() : null
        },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return updatedSubscription as SubscriptionWithPayments;
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      throw new AppError('Error al cancelar la suscripción', 500);
    }
  }

  /**
   * Actualizar estado de suscripción desde webhook
   */
  async updateSubscriptionStatus(
    paypalSubscriptionId: string,
    status: SubscriptionStatus
  ): Promise<SubscriptionWithPayments | null> {
    const subscription = await prisma.subscription.findFirst({
      where: { paypalSubscriptionId }
    });

    if (!subscription) {
      console.error(`Suscripción no encontrada para PayPal ID: ${paypalSubscriptionId}`);
      return null;
    }

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: status as any,
        canceledAt: status === 'CANCELLED' ? new Date() : null
      },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return updatedSubscription as SubscriptionWithPayments;
  }

  /**
   * Registrar un pago
   */
  async recordPayment(
    subscriptionId: number,
    paymentData: {
      amount: number;
      currency: string;
      status: PaymentStatus;
      paypalPaymentId?: string;
      paypalOrderId?: string;
      failureReason?: string;
    }
  ): Promise<void> {
    await prisma.payment.create({
      data: {
        subscriptionId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        status: paymentData.status as any,
        paypalPaymentId: paymentData.paypalPaymentId,
        paypalOrderId: paymentData.paypalOrderId,
        failureReason: paymentData.failureReason
      }
    });

    // Si el pago fue exitoso, actualizar el período de la suscripción
    if (paymentData.status === 'COMPLETED') {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (subscription) {
        // Calcular período correctamente - todos los planes son mensuales
        const now = new Date();
        const baseDate = subscription.currentPeriodEnd || now;
        const newPeriodStart = new Date(baseDate);
        const newPeriodEnd = new Date(baseDate);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: newPeriodStart,
            currentPeriodEnd: newPeriodEnd,
            updatedAt: now
          }
        });
      }
    }
  }

  /**
   * Obtener ID del plan de PayPal según el plan local
   */
  private getPayPalPlanId(plan: SubscriptionPlan): string {
    switch (plan) {
      case 'STARTER':
        return process.env.PAYPAL_STARTER_PLAN_ID || 'P-STARTER';
      case 'CREATOR':
        return process.env.PAYPAL_CREATOR_PLAN_ID || 'P-CREATOR';
      case 'STUDIO_PRO':
        return process.env.PAYPAL_STUDIO_PRO_PLAN_ID || 'P-STUDIO-PRO';
      default:
        throw new AppError(`Plan no válido: ${plan}`, 400);
    }
  }

  /**
   * Verificar si el usuario puede usar una función específica
   */
  async canUseFeature(userId: number, feature: string): Promise<boolean> {
    const subscription = await this.getUserActiveSubscription(userId);
    
    if (!subscription) {
      return false;
    }

    const featureLimits = {
      'STARTER': PLAN_CONFIGS.STARTER.features,
      'CREATOR': PLAN_CONFIGS.CREATOR.features,
      'STUDIO_PRO': PLAN_CONFIGS.STUDIO_PRO.features
    };

    return featureLimits[subscription.plan]?.includes(feature) || false;
  }

  /**
   * Obtener límites del plan del usuario
   */
  async getUserPlanLimits(userId: number): Promise<any> {
    const subscription = await this.getUserActiveSubscription(userId);
    
    if (!subscription) {
      return {
        videosPerMonth: 5,
        maxDuration: 30,
        quality: 'standard'
      };
    }

    // Usar configuración centralizada de planes
    const planConfig = getPlanConfig(subscription.plan);
    return {
      videosPerWeek: planConfig.videosPerWeek,
      maxDuration: planConfig.maxDuration,
      quality: planConfig.quality,
      watermark: planConfig.watermark,
      aiActor: planConfig.aiActor,
      editorPro: planConfig.editorPro
    };
  }
}

export const subscriptionService = new SubscriptionService();
