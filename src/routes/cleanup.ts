import { Router } from 'express';
import { CleanupController } from '../controllers/cleanupController.js';
import { authenticate } from '../middleware/auth.js';

/**
 * 🧹 RUTAS DEL SERVICIO DE LIMPIEZA (Solo Administradores)
 */
const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

/**
 * 🗑️ RUTAS DE LIMPIEZA
 */

// POST /api/cleanup/full - Ejecutar limpieza completa del sistema
router.post('/full', CleanupController.performFullCleanup);

// POST /api/cleanup/failed-videos - Limpiar videos fallidos antiguos
router.post('/failed-videos', CleanupController.cleanupFailedVideos);

// POST /api/cleanup/expired-tokens - Limpiar tokens expirados
router.post('/expired-tokens', CleanupController.cleanupExpiredTokens);

// POST /api/cleanup/temp-files - Limpiar archivos temporales
router.post('/temp-files', CleanupController.cleanupTempFiles);

/**
 * 📊 RUTAS DE INFORMACIÓN Y ESTADÍSTICAS
 */

// GET /api/cleanup/storage-info - Obtener información de almacenamiento
router.get('/storage-info', CleanupController.getStorageInfo);

// GET /api/cleanup/system-stats - Obtener estadísticas del sistema
router.get('/system-stats', CleanupController.getSystemStats);

/**
 * ⚡ RUTAS DE OPTIMIZACIÓN
 */

// POST /api/cleanup/optimize-db - Optimizar base de datos
router.post('/optimize-db', CleanupController.optimizeDatabase);

export default router;
