import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';
import { paypalService } from './paypalService.js';

const prisma = new PrismaClient();

export type SubscriptionPlan = 'BASIC' | 'PRO' | 'PREMIUM' | 'ANNUAL';
export type SubscriptionStatus = 'PENDING' | 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED' | 'UNPAID';
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

    // Calcular fechas del período
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + (plan === 'ANNUAL' ? 12 : 1));

    try {
      // Crear suscripción en PayPal
      const paypalSubscription = await paypalService.createSubscription({
        plan_id: this.getPayPalPlanId(plan),
        subscriber: {
          name: { given_name: 'User', surname: 'Name' },
          email_address: 'user@example.com' // Se debería obtener del usuario
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
          status: immediate ? 'CANCELED' : subscription.status as any,
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
        canceledAt: status === 'CANCELED' ? new Date() : null
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
        const newPeriodEnd = new Date(subscription.currentPeriodEnd || new Date());
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + (subscription.plan === 'ANNUAL' ? 12 : 1));

        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: subscription.currentPeriodEnd || new Date(),
            currentPeriodEnd: newPeriodEnd
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
      case 'BASIC':
        return process.env.PAYPAL_BASIC_PLAN_ID || 'P-BASIC';
      case 'PRO':
        return process.env.PAYPAL_PRO_PLAN_ID || 'P-PRO';
      case 'PREMIUM':
        return process.env.PAYPAL_PREMIUM_PLAN_ID || 'P-PREMIUM';
      case 'ANNUAL':
        return process.env.PAYPAL_ANNUAL_PLAN_ID || 'P-ANNUAL';
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
      'BASIC': ['basic_generation', 'standard_quality'],
      'PRO': ['basic_generation', 'standard_quality', 'advanced_generation', 'hd_quality'],
      'PREMIUM': ['basic_generation', 'standard_quality', 'advanced_generation', 'hd_quality', 'premium_features', '4k_quality'],
      'ANNUAL': ['basic_generation', 'standard_quality', 'advanced_generation', 'hd_quality', 'premium_features', '4k_quality', 'annual_bonus']
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

    const limits = {
      'BASIC': {
        videosPerMonth: 20,
        maxDuration: 60,
        quality: 'standard'
      },
      'PRO': {
        videosPerMonth: 50,
        maxDuration: 120,
        quality: 'hd'
      },
      'PREMIUM': {
        videosPerMonth: 200,
        maxDuration: 300,
        quality: '4k'
      },
      'ANNUAL': {
        videosPerMonth: 500,
        maxDuration: 600,
        quality: '4k'
      }
    };

    return limits[subscription.plan] || limits['BASIC'];
  }
}

export const subscriptionService = new SubscriptionService();
