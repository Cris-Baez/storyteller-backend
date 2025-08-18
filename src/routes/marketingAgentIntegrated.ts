import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

/**
 * 🛣️ RUTAS INTEGRADAS DEL MARKETING AGENT
 * Configuración completa de rutas con middlewares aplicados
 * NOTA: Este archivo servirá como base para la integración completa
 */

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * � RUTAS BÁSICAS DEL MARKETING AGENT
 */

// GET /marketing-agent/status - Estado del Marketing Agent
router.get('/status', 
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          enabled: true,
          timestamp: new Date().toISOString(),
          message: 'Marketing Agent integration ready'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo estado del Marketing Agent',
        code: 'STATUS_ERROR'
      });
    }
  }
);

// GET /marketing-agent/config - Configuración básica
router.get('/config',
  async (req, res) => {
    try {
      const authReq = req as any;
      const userPlan = authReq.user?.plan || 'STARTER';
      
      res.json({
        success: true,
        data: {
          plan: userPlan,
          enabled: true,
          message: 'Marketing Agent configuration ready'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo configuración',
        code: 'CONFIG_ERROR'
      });
    }
  }
);

/**
 * 🔍 RUTA DE INFORMACIÓN PARA DESARROLLO
 */
router.get('/info',
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          version: '1.0.0',
          phase: 'Integration Ready',
          features: [
            'Authentication middleware',
            'Rate limiting',
            'Logging system',
            'Validation schemas',
            'Job scheduling',
            'Database models',
            'Service layers'
          ],
          readyToIntegrate: true,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Error obteniendo información',
        code: 'INFO_ERROR'
      });
    }
  }
);

/**
 * 🚨 MIDDLEWARE DE MANEJO DE ERRORES
 */
router.use((error: any, req: any, res: any, next: any) => {
  console.error('[MarketingAgent] Error en rutas integradas:', error);
  res.status(500).json({
    success: false,
    error: 'Error interno del Marketing Agent',
    code: 'INTEGRATION_ERROR'
  });
});

export default router;
