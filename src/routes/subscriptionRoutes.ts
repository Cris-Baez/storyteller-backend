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

// Validaciones
const createSubscriptionValidation = [
  body('plan')
    .isIn(['BASIC', 'PRO', 'PREMIUM', 'ANNUAL'])
    .withMessage('Plan debe ser uno de: BASIC, PRO, PREMIUM, ANNUAL')
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
router.use(authenticate);

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
