// src/index.ts
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { renderRouter } from './routes/render.js';
import { marketingRoutes } from './routes/marketingRoutes.js';  // ✨ NUEVO: Marketing AI
import { authRouter } from './routes/auth.js';  // ✨ NUEVO: Autenticación
import subscriptionRouter from './routes/subscriptionRoutes.js';  // ✨ NUEVO: Suscripciones
import marketingConfigRouter from './routes/marketingConfigRoutes.js';  // ✨ NUEVO: Configuración Marketing
import templateRouter from './routes/templateRoutes.js';  // ✨ NUEVO: Plantillas
import adminRouter from './routes/admin.js';  // ✨ NUEVO: Panel de administración
import editorRouter from './routes/editor.js';  // ✨ NUEVO: Editor Visual
import cleanupRouter from './routes/cleanup.js';  // ✨ NUEVO: Servicio de limpieza
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';  // ✨ NUEVO: Manejo de errores
import { logger } from './utils/logger.js';
import { CleanupService } from './services/cleanupService.js';  // ✨ NUEVO: Servicio de limpieza
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Carga SIEMPRE el .env desde la raíz, sin importar el directorio de ejecución
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".." );
dotenv.config({ path: path.join(projectRoot, ".env") });

const app = express();

// Manejo global de errores no capturados y promesas no manejadas
process.on('uncaughtException', (err) => {
  logger.error(`[FATAL] Excepción no capturada: ${err.message}\n${err.stack}`);
  // Opcional: salir para que un orquestador reinicie el proceso
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error(`[FATAL] Promesa no manejada: ${reason}`);
  // Opcional: salir para que un orquestador reinicie el proceso
  process.exit(1);
});

// Seguridad HTTP headers
app.use(helmet());
// Rutas de administración y monitoreo (solo para admins/desarrollo)
app.use('/admin', adminRouter);

// CORS (ajusta origin según tu frontend)
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Body parser con mayor límite
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
  })
);

// Rate limiter: max 60 requests/minuto por IP
const limiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { error: 'Too many requests, please slow down.' }
});
app.use(limiter);

// Health check - debe ser lo más simple posible
app.get('/healthz', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mode: process.env.NODE_ENV || 'development',
    apis: {
      fal: !!process.env.FAL_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      replicate: !!process.env.REPLICATE_API_TOKEN
    }
  });
});

// ✅ RUTA DE TEST SIMPLE
app.get('/api/test', (_req, res) => {
  res.json({
    message: 'Storyteller AI Backend funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas principales
app.use('/api/auth', authRouter);  // ✨ NUEVO: Rutas de autenticación
app.use('/api/subscriptions', subscriptionRouter);  // ✨ NUEVO: Rutas de suscripciones
app.use('/api/marketing-config', marketingConfigRouter);  // ✨ NUEVO: Configuración de marketing
app.use('/api/templates', templateRouter);  // ✨ NUEVO: Plantillas de marketing
app.use('/api/admin', adminRouter);  // ✨ NUEVO: Panel de administración
app.use('/api/editor', editorRouter);  // ✨ NUEVO: Editor Visual (Studio Pro)
app.use('/api/cleanup', cleanupRouter);  // ✨ NUEVO: Servicio de limpieza (Solo Admins)
app.use('/api/render', renderRouter);
app.use('/api/marketing', marketingRoutes);  // ✨ NUEVO: Marketing AI Routes
// Nueva ruta para compilar el video final
app.post('/api/compile', async (req, res) => {
  try {
    const { videoSegments, audioSegments, soundEffects } = req.body;

    // Simulación de compilación
    logger.info('Compilando video final con segmentos proporcionados...');
    const compiledVideoUrl = 'https://cdn.example.com/final-video.mp4';

    res.json({ url: compiledVideoUrl });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    logger.error(`Error en compilación: ${errorMessage}`);
    res.status(500).json({ error: 'Error al compilar el video final' });
  }
});

// Comentado: Ruta antigua que simula respuesta
// app.post('/api/render', (req, res) => {
//   const { prompt, style, type, duration } = req.body;
//   console.log('Prompt recibido:', { prompt, style, type, duration });
//   res.json({ url: 'https://video-demo.com/video-generado.mp4' });
// });

// Handler de errores
app.use(notFoundHandler);
app.use(errorHandler);

// Levanta servidor y gestiona shutdown
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`🚀  Storyteller AI backend listening on port ${PORT}`);
  
  // ✨ NUEVO: Inicializar servicio de limpieza automática
  CleanupService.scheduleAutomaticCleanup();
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — closing server');
  server.close(() => {
    logger.info('Server closed, exiting process');
    process.exit(0);
  });
});
