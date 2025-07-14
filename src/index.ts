// src/index.ts
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { renderRouter } from './routes/render.js';
import { logger } from './utils/logger.js';

const app = express();

// Seguridad HTTP headers
app.use(helmet());

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

// Health check
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Rutas principales
app.use('/api/render', renderRouter);

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
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Unhandled Error: ${err.message}\n${err.stack}`);
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Levanta servidor y gestiona shutdown
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`🚀  Storyteller AI backend listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — closing server');
  server.close(() => {
    logger.info('Server closed, exiting process');
    process.exit(0);
  });
});
