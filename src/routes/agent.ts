/**
 * 🤖 RUTAS DEL AGENTE AUTOMÁTICO
 * Sistema de automatización semanal para Marketing AI
 */

import { Router } from 'express';
import { AgentController } from '../controllers/agentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// 🔒 Todas las rutas requieren autenticación
router.use(authenticate);

// 🚀 Activar Agente Automático (Creator/Studio Pro)
router.post('/activate', AgentController.activateAgent);

// ⏹️ Desactivar Agente Automático
router.post('/deactivate', AgentController.deactivateAgent);

// ⚡ Ejecutar Agente Manualmente (para testing)
router.post('/force-run', AgentController.forceExecution);

// 📊 Estado del Agente y videos recientes
router.get('/status', AgentController.getAgentStatus);

// ⚙️ Actualizar configuración del Agente
router.put('/config', AgentController.updateConfig);

export default router;
