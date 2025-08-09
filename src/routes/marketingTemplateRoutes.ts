/**
 * 🎯 RUTAS DE PLANTILLAS DE MARKETING - SEGÚN FLUJO.TXT
 */

import { Router } from 'express';
import { marketingTemplateController, validateTemplateQuery } from '../controllers/marketingTemplateController.js';
import { authenticate } from '../middleware/auth.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

/**
 * 📋 CATÁLOGO DE PLANTILLAS
 * GET /api/marketing/templates?industry=ecommerce
 * GET /api/marketing/templates?objective=product_launch
 */
router.get(
  '/',
  authenticate,
  validateTemplateQuery,
  validateRequest,
  marketingTemplateController.getCatalog.bind(marketingTemplateController)
);

/**
 * 📊 INDUSTRIAS DISPONIBLES
 * GET /api/marketing/templates/industries
 */
router.get(
  '/industries',
  authenticate,
  marketingTemplateController.getIndustries.bind(marketingTemplateController)
);

/**
 * 🎯 SELECCIONAR Y PERSONALIZAR PLANTILLA
 * POST /api/marketing/templates/:templateId/select
 */
router.post(
  '/:templateId/select',
  authenticate,
  [
    body('customParams').optional().isObject(),
  ],
  validateRequest,
  marketingTemplateController.selectTemplate.bind(marketingTemplateController)
);

/**
 * 🎬 EJECUTAR PIPELINE CON PLANTILLA
 * POST /api/marketing/templates/:templateId/execute
 */
router.post(
  '/:templateId/execute',
  authenticate,
  [
    body('customParams').optional().isObject(),
    body('assets').optional().isArray(),
  ],
  validateRequest,
  marketingTemplateController.executeWithTemplate.bind(marketingTemplateController)
);

export default router;
