import { Request, Response, NextFunction } from 'express';
import { subscriptionService, SubscriptionPlan } from '../services/subscriptionService.js';
import { paypalService } from '../services/paypalService.js';
import { PrismaClient } from '../../generated/prisma/index.js';
import { AppError, ValidationError, NotFoundError } from '../utils/errors.js';

const prisma = new PrismaClient();

/**
 * Crear una nueva suscripción
 */
export async function createSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const { plan } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    if (!plan || !Object.values(['BASIC', 'PRO', 'PREMIUM', 'ANNUAL']).includes(plan)) {
      throw new ValidationError('Plan de suscripción no válido');
    }

    const subscription = await subscriptionService.createSubscription({
      userId,
      plan: plan as SubscriptionPlan
    });

    res.status(201).json({
      success: true,
      message: 'Suscripción creada exitosamente',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener suscripción activa del usuario
 */
export async function getUserActiveSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const subscription = await subscriptionService.getUserActiveSubscription(userId);

    if (!subscription) {
      return res.json({
        success: true,
        message: 'No hay suscripción activa',
        data: null
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener todas las suscripciones del usuario
 */
export async function getUserSubscriptions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const subscriptions = await subscriptionService.getUserSubscriptions(userId);

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener detalles de una suscripción específica
 */
export async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const subscriptionId = parseInt(id, 10);
    if (isNaN(subscriptionId)) {
      throw new ValidationError('ID de suscripción inválido');
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);

    if (!subscription) {
      throw new NotFoundError('Suscripción no encontrada');
    }

    // Verificar que la suscripción pertenece al usuario
    if (subscription.userId !== userId) {
      throw new AppError('No tienes permisos para ver esta suscripción', 403);
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancelar una suscripción
 */
export async function cancelSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { immediate = false } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const subscriptionId = parseInt(id, 10);
    if (isNaN(subscriptionId)) {
      throw new ValidationError('ID de suscripción inválido');
    }

    // Verificar que la suscripción pertenece al usuario
    const subscription = await subscriptionService.getSubscription(subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Suscripción no encontrada');
    }

    if (subscription.userId !== userId) {
      throw new AppError('No tienes permisos para cancelar esta suscripción', 403);
    }

    const canceledSubscription = await subscriptionService.cancelSubscription(subscriptionId, immediate);

    res.json({
      success: true,
      message: immediate 
        ? 'Suscripción cancelada inmediatamente'
        : 'Suscripción programada para cancelación al final del período',
      data: canceledSubscription
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener los límites del plan del usuario
 */
export async function getUserPlanLimits(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const limits = await subscriptionService.getUserPlanLimits(userId);

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verificar si el usuario puede usar una función específica
 */
export async function checkFeatureAccess(req: Request, res: Response, next: NextFunction) {
  try {
    const { feature } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    if (!feature) {
      throw new ValidationError('Función no especificada');
    }

    const canUse = await subscriptionService.canUseFeature(userId, feature);

    res.json({
      success: true,
      data: {
        feature,
        canUse,
        hasAccess: canUse
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Webhook de PayPal para eventos de suscripciones
 */
export async function handlePayPalWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const headers = req.headers;
    const body = JSON.stringify(req.body);
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!webhookId) {
      throw new AppError('Webhook ID no configurado', 500);
    }

    // Verificar la firma del webhook
    const isValid = await paypalService.verifyWebhookSignature(
      headers as Record<string, string>,
      body,
      webhookId
    );

    if (!isValid) {
      throw new AppError('Webhook signature no válida', 400);
    }

    const event = req.body;
    console.log('PayPal webhook recibido:', event.event_type, event.id);

    // Manejar diferentes tipos de eventos
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handleSubscriptionPaymentFailed(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED':
        await handleSubscriptionPaymentCompleted(event);
        break;
      
      default:
        console.log('Evento PayPal no manejado:', event.event_type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando webhook PayPal:', error);
    next(error);
  }
}

/**
 * Manejar activación de suscripción
 */
async function handleSubscriptionActivated(event: any) {
  const paypalSubscriptionId = event.resource.id;
  
  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findFirst({
      where: { paypalSubscriptionId }
    });

    if (!subscription) {
      throw new Error(`Suscripción no encontrada para PayPal ID: ${paypalSubscriptionId}`);
    }

    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date()
      }
    });
  });
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionCancelled(event: any) {
  const paypalSubscriptionId = event.resource.id;
  
  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findFirst({
      where: { paypalSubscriptionId }
    });

    if (!subscription) {
      throw new Error(`Suscripción no encontrada para PayPal ID: ${paypalSubscriptionId}`);
    }

    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        updatedAt: new Date()
      }
    });
  });
}

/**
 * Manejar suspensión de suscripción
 */
async function handleSubscriptionSuspended(event: any) {
  const paypalSubscriptionId = event.resource.id;
  
  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findFirst({
      where: { paypalSubscriptionId }
    });

    if (!subscription) {
      throw new Error(`Suscripción no encontrada para PayPal ID: ${paypalSubscriptionId}`);
    }

    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
        updatedAt: new Date()
      }
    });
  });
}

/**
 * Manejar fallo en el pago
 */
async function handleSubscriptionPaymentFailed(event: any) {
  const resource = event.resource;
  const paypalSubscriptionId = resource.billing_agreement_id || resource.id;
  
  // Usar transacción para operaciones críticas
  await prisma.$transaction(async (tx) => {
    // Buscar suscripción interna por PayPal ID
    const subscription = await tx.subscription.findFirst({
      where: { paypalSubscriptionId }
    });

    if (!subscription) {
      throw new Error(`Suscripción no encontrada para PayPal ID: ${paypalSubscriptionId}`);
    }

    // Registrar el fallo del pago
    await tx.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: parseFloat(resource.amount?.total || '0'),
        currency: resource.amount?.currency || 'USD',
        status: 'FAILED',
        paypalPaymentId: resource.id,
        failureReason: resource.failure_reason || 'Payment failed'
      }
    });

    // Actualizar estado de suscripción
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'PAST_DUE',
        updatedAt: new Date()
      }
    });
  });
}

/**
 * Manejar pago completado
 */
async function handleSubscriptionPaymentCompleted(event: any) {
  const resource = event.resource;
  const paypalSubscriptionId = resource.billing_agreement_id || resource.id;
  
  // Usar transacción para operaciones críticas
  await prisma.$transaction(async (tx) => {
    // Buscar suscripción interna por PayPal ID
    const subscription = await tx.subscription.findFirst({
      where: { paypalSubscriptionId }
    });

    if (!subscription) {
      throw new Error(`Suscripción no encontrada para PayPal ID: ${paypalSubscriptionId}`);
    }

    // Registrar el pago exitoso
    await tx.payment.create({
      data: {
        subscriptionId: subscription.id,
        amount: parseFloat(resource.amount?.total || '0'),
        currency: resource.amount?.currency || 'USD',
        status: 'COMPLETED',
        paypalPaymentId: resource.id
      }
    });

    // Calcular nuevo período correctamente
    const now = new Date();
    const currentPeriodEnd = subscription.currentPeriodEnd || now;
    const newPeriodEnd = new Date(currentPeriodEnd);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + (subscription.plan === 'ANNUAL' ? 12 : 1));

    // Actualizar suscripción con período extendido
    await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart: currentPeriodEnd,
        currentPeriodEnd: newPeriodEnd,
        updatedAt: now
      }
    });
  });
}

/**
 * Obtener URL de aprobación para una suscripción
 */
export async function getSubscriptionApprovalUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Usuario no autenticado', 401);
    }

    const subscriptionId = parseInt(id, 10);
    if (isNaN(subscriptionId)) {
      throw new ValidationError('ID de suscripción inválido');
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);

    if (!subscription) {
      throw new NotFoundError('Suscripción no encontrada');
    }

    if (subscription.userId !== userId) {
      throw new AppError('No tienes permisos para acceder a esta suscripción', 403);
    }

    // Obtener detalles de PayPal
    if (!subscription.paypalSubscriptionId) {
      throw new AppError('Suscripción PayPal no encontrada', 400);
    }

    const paypalSubscription = await paypalService.getSubscription(subscription.paypalSubscriptionId);
    
    // Buscar el enlace de aprobación
    const approvalLink = paypalSubscription.links?.find(
      link => link.rel === 'approve'
    );

    if (!approvalLink) {
      throw new AppError('URL de aprobación no disponible', 400);
    }

    res.json({
      success: true,
      data: {
        approvalUrl: approvalLink.href,
        subscriptionId: subscription.id,
        paypalSubscriptionId: subscription.paypalSubscriptionId
      }
    });
  } catch (error) {
    next(error);
  }
}
