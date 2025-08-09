import { Router, Request, Response, NextFunction } from 'express';
import { marketingConfigController, validateUpdateConfig } from '../controllers/marketingConfigController.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

/**
 * 📋 GET /api/marketing-config
 * Obtener configuración personalizada del usuario
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[MarketingConfigRoutes] 📋 GET /api/marketing-config');
  marketingConfigController.getConfig(req, res).catch(next);
});

/**
 * ✏️ PUT /api/marketing-config
 * Actualizar configuración personalizada
 */
router.put('/', validateUpdateConfig, (req: Request, res: Response, next: NextFunction) => {
  logger.info('[MarketingConfigRoutes] ✏️ PUT /api/marketing-config');
  marketingConfigController.updateConfig(req, res).catch(next);
});

/**
 * 🏢 GET /api/marketing-config/options
 * Obtener opciones disponibles para configuración
 */
router.get('/options', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[MarketingConfigRoutes] 🏢 GET /api/marketing-config/options');
  marketingConfigController.getOptions(req, res).catch(next);
});

/**
 * 🗑️ DELETE /api/marketing-config/reset
 * Resetear configuración a valores por defecto
 */
router.delete('/reset', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[MarketingConfigRoutes] 🗑️ DELETE /api/marketing-config/reset');
  marketingConfigController.resetConfig(req, res).catch(next);
});

/**
 * 📊 GET /api/marketing-config/stats
 * Obtener estadísticas de configuración (Solo Admin)
 */
router.get('/stats', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[MarketingConfigRoutes] 📊 GET /api/marketing-config/stats');
  marketingConfigController.getStats(req, res).catch(next);
});

export default router;
