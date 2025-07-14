import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { renderRouter } from './routes/render.js';
import { logger } from './utils/logger.js';

// Manejo global de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the error but don't exit the process
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Log the error but don't exit the process immediately
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/render', renderRouter);

// Manejo de errores del servidor
app.use((error: any, req: any, res: any, next: any) => {
  logger.error(`Server error: ${error.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`Storyteller AI backend running on ${PORT}`));
