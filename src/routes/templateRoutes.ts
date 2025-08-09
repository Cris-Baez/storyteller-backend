import { Router, Request, Response, NextFunction } from 'express';
import { templateController, validateCreateTemplate, validateUpdateTemplate } from '../controllers/templateController.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticate);

/**
 * 📋 GET /api/templates
 * Obtener todas las plantillas con filtros opcionales
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 📋 GET /api/templates');
  templateController.getAllTemplates(req, res).catch(next);
});

/**
 * 🏷️ GET /api/templates/options
 * Obtener opciones disponibles para plantillas
 */
router.get('/options', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 🏷️ GET /api/templates/options');
  templateController.getTemplateOptions(req, res).catch(next);
});

/**
 * 🎯 GET /api/templates/popular
 * Obtener plantillas más populares
 */
router.get('/popular', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 🎯 GET /api/templates/popular');
  templateController.getPopularTemplates(req, res).catch(next);
});

/**
 * 📈 GET /api/templates/stats
 * Obtener estadísticas de plantillas (Solo Admin)
 */
router.get('/stats', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 📈 GET /api/templates/stats');
  templateController.getTemplateStats(req, res).catch(next);
});

/**
 * 🏢 GET /api/templates/business/:businessType
 * Obtener plantillas por tipo de negocio
 */
router.get('/business/:businessType', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 🏢 GET /api/templates/business/:businessType');
  templateController.getTemplatesByBusinessType(req, res).catch(next);
});

/**
 * 🔍 GET /api/templates/:id
 * Obtener plantilla específica por ID
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 🔍 GET /api/templates/:id');
  templateController.getTemplateById(req, res).catch(next);
});

/**
 * ➕ POST /api/templates
 * Crear nueva plantilla (Solo Admin)
 */
router.post('/', validateCreateTemplate, (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] ➕ POST /api/templates');
  templateController.createTemplate(req, res).catch(next);
});

/**
 * ✏️ PUT /api/templates/:id
 * Actualizar plantilla existente (Solo Admin)
 */
router.put('/:id', validateUpdateTemplate, (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] ✏️ PUT /api/templates/:id');
  templateController.updateTemplate(req, res).catch(next);
});

/**
 * 📊 POST /api/templates/:id/use
 * Marcar plantilla como usada (incrementa contador)
 */
router.post('/:id/use', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 📊 POST /api/templates/:id/use');
  templateController.useTemplate(req, res).catch(next);
});

/**
 * 🗑️ DELETE /api/templates/:id
 * Eliminar plantilla (Solo Admin)
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  logger.info('[TemplateRoutes] 🗑️ DELETE /api/templates/:id');
  templateController.deleteTemplate(req, res).catch(next);
});

export default router;
