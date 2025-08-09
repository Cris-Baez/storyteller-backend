import { Router } from 'express';
import { adminController, validateChangeUserPlan, validateUserIdParam, validateVideoIdParam } from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { query } from 'express-validator';

/**
 * 🧠 RUTAS DE ADMINISTRACIÓN
 */
const router = Router();

// Middleware de autenticación para todas las rutas de admin
router.use(authenticate);

/**
 * 📊 ESTADÍSTICAS Y DASHBOARD
 */
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * 👥 GESTIÓN DE USUARIOS
 */
// Obtener lista de usuarios con filtros
router.get('/users', 
  [
    query('plan').optional().isIn(['STARTER', 'CREATOR', 'STUDIO_PRO']).withMessage('Plan inválido'),
    query('role').optional().isIn(['USER', 'ADMIN', 'STUDIO_PRO']).withMessage('Rol inválido'),
    query('isActive').optional().isBoolean().withMessage('isActive debe ser booleano'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
    query('registeredAfter').optional().isISO8601().withMessage('registeredAfter debe ser una fecha válida'),
    query('registeredBefore').optional().isISO8601().withMessage('registeredBefore debe ser una fecha válida')
  ],
  adminController.getUsers
);

// Obtener detalles de usuario específico
router.get('/users/:userId', 
  validateUserIdParam,
  adminController.getUserDetails
);

// Cambiar plan de usuario
router.patch('/users/:userId/plan',
  validateUserIdParam,
  validateChangeUserPlan,
  adminController.changeUserPlan
);

// Activar/Desactivar usuario
router.patch('/users/:userId/status',
  validateUserIdParam,
  adminController.toggleUserStatus
);

/**
 * 🎬 GESTIÓN DE VIDEOS
 */
// Obtener lista de videos con filtros
router.get('/videos',
  [
    query('status').optional().isIn(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).withMessage('Estado inválido'),
    query('type').optional().isIn(['AVATAR', 'PRODUCT', 'MARKETING', 'SOCIAL']).withMessage('Tipo inválido'),
    query('userId').optional().isInt({ min: 1 }).withMessage('userId debe ser un número positivo'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
    query('createdAfter').optional().isISO8601().withMessage('createdAfter debe ser una fecha válida'),
    query('createdBefore').optional().isISO8601().withMessage('createdBefore debe ser una fecha válida')
  ],
  adminController.getVideos
);

// Reintentar video fallido
router.post('/videos/:videoId/retry',
  validateVideoIdParam,
  adminController.retryFailedVideo
);

// Eliminar video corrupto
router.delete('/videos/:videoId/corrupted',
  validateVideoIdParam,
  adminController.deleteCorruptedVideo
);

/**
 * 💰 HISTORIAL DE PAGOS
 */
router.get('/payments',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número positivo'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100')
  ],
  adminController.getPaymentHistory
);

/**
 * 📝 LOGS Y ERRORES
 */
router.get('/errors',
  [
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('Límite debe ser entre 1 y 200')
  ],
  adminController.getRecentErrors
);

/**
 * 🧹 MANTENIMIENTO DEL SISTEMA
 */
router.post('/maintenance/cleanup', adminController.performMaintenance);

export default router;
