import { Router } from 'express';
import {
  createSubscription,
  getUserActiveSubscription,
  getUserSubscriptions,
  getSubscription,
  cancelSubscription,
  getUserPlanLimits,
  checkFeatureAccess,
  handlePayPalWebhook,
  getSubscriptionApprovalUrl
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import { body, param } from 'express-validator';

const router = Router();

// Webhook de PayPal (sin autenticación) - debe ir antes del middleware de auth
router.post('/webhook/paypal', handlePayPalWebhook);

// Aplicar autenticación a todas las rutas excepto webhooks
router.use(authenticate);

// ✅ NUEVA RUTA: Cambio de plan directo
router.post('/change-plan', [
  body('newPlan')
    .isIn(['STARTER', 'CREATOR', 'STUDIO_PRO'])
    .withMessage('Plan debe ser uno de: STARTER, CREATOR, STUDIO_PRO')
], validateRequest, async (req: any, res: any) => {
  try {
    const { newPlan } = req.body;
    const userId = req.user.id;
    
    // Actualizar plan del usuario directamente
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { plan: newPlan }
    });
    
    await prisma.$disconnect();
    
    res.json({ 
      success: true, 
      message: `Plan actualizado a ${newPlan}`,
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Validaciones
const createSubscriptionValidation = [
  body('plan')
    .isIn(['STARTER', 'CREATOR', 'STUDIO_PRO'])
    .withMessage('Plan debe ser uno de: STARTER, CREATOR, STUDIO_PRO')
];

const cancelSubscriptionValidation = [
  param('id')
    .isNumeric()
    .withMessage('ID de suscripción debe ser un número válido'),
  body('immediate')
    .optional()
    .isBoolean()
    .withMessage('immediate debe ser un valor booleano')
];

const subscriptionIdValidation = [
  param('id')
    .isNumeric()
    .withMessage('ID de suscripción debe ser un número válido')
];

const featureValidation = [
  param('feature')
    .notEmpty()
    .withMessage('Función es requerida')
    .isString()
    .withMessage('Función debe ser una cadena de texto')
];

// Rutas protegidas (requieren autenticación)
// router.use(authenticate); // Ya aplicado arriba

// ✅ NUEVA RUTA: Cambio de plan directo
router.post('/change-plan', [
  body('newPlan')
    .isIn(['STARTER', 'CREATOR', 'STUDIO_PRO'])
    .withMessage('Plan debe ser uno de: STARTER, CREATOR, STUDIO_PRO')
], validateRequest, async (req: any, res: any) => {
  try {
    const { newPlan } = req.body;
    const userId = req.user.id;
    
    // Actualizar plan del usuario directamente
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { plan: newPlan }
    });
    
    await prisma.$disconnect();
    
    res.json({ 
      success: true, 
      message: `Plan actualizado a ${newPlan}`,
      user: updatedUser 
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Crear nueva suscripción
router.post(
  '/',
  createSubscriptionValidation,
  validateRequest,
  createSubscription
);

// Obtener suscripción activa del usuario
router.get('/active', getUserActiveSubscription);

// Obtener todas las suscripciones del usuario
router.get('/my-subscriptions', getUserSubscriptions);

// Obtener límites del plan del usuario
router.get('/plan-limits', getUserPlanLimits);

// Verificar acceso a una función específica
router.get(
  '/feature/:feature',
  featureValidation,
  validateRequest,
  checkFeatureAccess
);

// Obtener detalles de una suscripción específica
router.get(
  '/:id',
  subscriptionIdValidation,
  validateRequest,
  getSubscription
);

// Obtener URL de aprobación para PayPal
router.get(
  '/:id/approval-url',
  subscriptionIdValidation,
  validateRequest,
  getSubscriptionApprovalUrl
);

// Cancelar suscripción
router.post(
  '/:id/cancel',
  cancelSubscriptionValidation,
  validateRequest,
  cancelSubscription
);

export default router;
