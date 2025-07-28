import express from 'express';
import { startJob, getJobStatus, getJobResult } from '../jobs/jobQueue.js';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { logFeedback } from '../services/feedbackService.js';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máx por imagen
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Formato de imagen no soportado'));
    } else {
      cb(null, true);
    }
  }
});

export const renderRouter = express.Router();

// Esquema de validación
const renderRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').transform(val => 
    val.replace(/[^\x20-\x7E\u00C0-\u017F]/g, "").trim() || "Create a cinematic story"
  ),
  visualStyle: z.enum(['realistic', 'anime', 'cartoon', 'cinematic', 'comercial', 'commercial']),
  duration: z.number().min(1).max(300, 'Duration must be between 1 and 300 seconds'),
});

// Endpoint principal para renderizar videos
renderRouter.post('/', upload.fields([
  { name: 'userImage', maxCount: 2 },
  { name: 'localImage', maxCount: 1 },
  { name: 'productImage', maxCount: 1 }
]), async (req, res) => {
  try {
    logger.info('[API] Nueva solicitud de renderizado recibida');
    console.log('Datos recibidos:', req.body);

    // Sanitizar el prompt
    if (req.body.prompt) {
      req.body.prompt = req.body.prompt
        .replace(/[^\x20-\x7E\u00C0-\u017F]/g, "") // Mantener ASCII + acentos básicos
        .replace(/\s+/g, " ") // Normalizar espacios
        .trim();
      
      if (req.body.prompt.length < 10) {
        logger.warn('Prompt demasiado corto, usando prompt por defecto.');
        req.body.prompt = "Create a cinematic story about a character's journey through an epic adventure";
      }
    }

    console.log('Prompt sanitizado:', req.body.prompt);

    // Preparar datos para validación
    const requestBody = {
      prompt: req.body.prompt || "Create a cinematic story",
      visualStyle: req.body.visualStyle || 'cinematic',
      duration: parseInt(req.body.duration) || 30,
    };

    // Validar con Zod
    const validatedBody = renderRequestSchema.parse(requestBody);

    logger.info('Request validado:', validatedBody);

    // Procesar imágenes subidas si las hay
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let actorCustomPath: string | undefined;
    
    if (files?.userImage?.[0]) {
      actorCustomPath = files.userImage[0].path;
      logger.info('[API] Imagen personalizada detectada:', actorCustomPath);
    }

    // Log de feedback para métricas
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: true,
      params: { visualStyle: validatedBody.visualStyle, duration: validatedBody.duration }
    });

    // Crear trabajo en la cola
    const jobData = {
      ...validatedBody,
      actorCustomPath,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    };

    const jobId = await startJob(jobData);
    
    logger.info('[API] Trabajo creado exitosamente:', { jobId });

    res.status(202).json({ 
      success: true,
      jobId,
      status: 'queued',
      message: 'Video generation started',
      estimatedTime: '20-30 minutes',
      statusUrl: `/api/render/status/${jobId}`,
      resultUrl: `/api/render/result/${jobId}`
    });

  } catch (error: any) {
    logger.error('Error procesando request:', error);
    
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: false,
      error: error.message,
      params: req.body
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message || 'Error desconocido'
    });
  }
});

// Endpoint para verificar estado del trabajo
renderRouter.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  logger.info('[API] Consultando estado del trabajo:', { jobId });
  
  try {
    const status = getJobStatus(jobId);
    res.json(status);
  } catch (error) {
    logger.error('[API] Error consultando estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error consultando estado del trabajo'
    });
  }
});

// Endpoint para obtener resultado final
renderRouter.get('/result/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  logger.info('[API] Consultando resultado del trabajo:', { jobId });
  
  try {
    const result = getJobResult(jobId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Trabajo no encontrado o no completado'
      });
    }
    
    res.json(result);
  } catch (error) {
    logger.error('[API] Error consultando resultado:', error);
    res.status(500).json({
      success: false,
      error: 'Error consultando resultado del trabajo'
    });
  }
});

// Health check específico para renderizado
renderRouter.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'render',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: {
      lipSync: true,
      cerebros: true,
      styles: ['cinematic', 'anime', 'cartoon', 'realistic']
    }
  });
});

export default renderRouter;
