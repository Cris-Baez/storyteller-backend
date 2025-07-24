/**
 * Endpoint seguro para consultar logs de feedback y errores.
 *
 * Uso:
 *   curl -H "x-admin-token: TU_TOKEN" http://localhost:3000/admin/logs
 *
 * El token se define por la variable de entorno ADMIN_TOKEN (por defecto: admin123).
 *
 * Seguridad:
 *   - No expongas este endpoint en producción sin protección fuerte.
 *   - Cambia el token por uno seguro y mantenlo fuera del código fuente.
 *   - Limita el acceso por IP/firewall si es posible.
 */
import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Devuelve los últimos N logs de feedback y errores (solo para admins/desarrollo)
// Middleware de autenticación por token simple
router.use((req, res, next) => {
  const adminToken = process.env.ADMIN_TOKEN || 'admin123';
  const token = req.headers['x-admin-token'];
  if (token !== adminToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});

router.get('/logs', async (req, res) => {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    const feedbackLog = path.join(logsDir, 'all.log');
    const errorLog = path.join(logsDir, 'error.log');
    const [feedback, errors] = await Promise.all([
      fs.readFile(feedbackLog, 'utf8').catch(() => ''),
      fs.readFile(errorLog, 'utf8').catch(() => '')
    ]);
    // Devuelve los últimos 200 eventos de feedback y errores
    const lastFeedback = feedback.split('\n').filter(l => l.includes('[FEEDBACK]')).slice(-200);
    const lastErrors = errors.split('\n').slice(-200);
    res.json({
      feedback: lastFeedback,
      errors: lastErrors
    });
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron leer los logs', details: e instanceof Error ? e.message : e });
  }
});

export default router;
