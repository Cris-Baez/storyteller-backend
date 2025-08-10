import express from 'express';
import { startJob, getJobStatus, getJobResult, getJobProgress, getJobState } from '../jobs/jobQueue.js';
import { z } from 'zod';
import { logger, safeLog } from '../utils/logger.js';
import { logFeedback } from '../services/feedbackService.js';
import { ESTILOS_VALIDOS, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
import { authenticate, checkVideoCreationLimits, AuthenticatedRequest } from '../middleware/auth.js';
import { PlanLimitService } from '../services/planLimitService.js'; // ✅ NUEVO SERVICIO CRÍTICO
import { CinemaProjectStore } from '../models/CinemaProject.js'; // ✅ NUEVO: Sistema de proyectos
import { CinemaProgressService } from '../services/cinemaProgressService.js'; // ✅ NUEVO: Estados específicos
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

// Configuración de multer para manejo de imágenes
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo por imagen
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Formato de imagen no soportado'));
    } else {
      cb(null, true);
    }
  }
});

export const renderRouter = express.Router();

// ✅ APLICAR AUTENTICACIÓN A TODAS LAS RUTAS
renderRouter.use(authenticate);

// Esquema de validación con Zod - UNIFICADO con tipos de estilos
const renderRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').transform(val => 
    val.replace(/[^\x20-\x7E\u00C0-\u017F]/g, "").trim() || "Create a cinematic story"
  ),
  visualStyle: z.enum(ESTILOS_VALIDOS as [EstiloVisualAPI, ...EstiloVisualAPI[]]),
  duration: z.number().min(15).max(60, 'Duration must be 15, 30, 45, or 60 seconds').refine(val => [15, 30, 45, 60].includes(val), 'Duration must be exactly 15, 30, 45, or 60 seconds'),
});

// Endpoint principal para renderizar videos
renderRouter.post('/', upload.fields([
  { name: 'userImage', maxCount: 2 },
  { name: 'localImage', maxCount: 1 },
  { name: 'productImage', maxCount: 1 }
]), async (req: any, res, next) => {
  // Verificar límites de creación
  await checkVideoCreationLimits(req as AuthenticatedRequest, res, next);
}, async (req: any, res) => {
  try {
    safeLog('[API] Nueva solicitud de renderizado', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      userId: req.user?.id
    });

    // Sanitizar el prompt
    if (req.body.prompt) {
      req.body.prompt = req.body.prompt
        .replace(/[^\x20-\x7E\u00C0-\u017F]/g, "") // Mantener ASCII + acentos básicos
        .replace(/\s+/g, " ") // Normalizar espacios
        .trim();
      
      if (req.body.prompt.length < 10) {
        logger.warn('[API] Prompt demasiado corto, usando prompt por defecto');
        req.body.prompt = "Create a cinematic story about a character's journey through an epic adventure";
      }
    }

    safeLog('[API] Prompt sanitizado', { promptLength: req.body.prompt?.length || 0 });

    // Preparar datos para validación
    const requestBody = {
      prompt: req.body.prompt || "Create a cinematic story",
      visualStyle: req.body.visualStyle || 'cinematic',
      duration: parseInt(req.body.duration) || 30,
    };

    // Validar con Zod
    const validatedBody = renderRequestSchema.parse(requestBody);
    
    // ✅ NORMALIZAR ESTILO: Convertir alias a estilo principal
    const estiloNormalizado = normalizarEstilo(validatedBody.visualStyle);

    console.log('[API] Request validado exitosamente', { 
      estiloOriginal: validatedBody.visualStyle,
      estiloNormalizado,
      duracion: validatedBody.duration
    });

    // Procesar imágenes subidas si las hay
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let actorCustomPath: string | undefined;
    
    if (files?.userImage?.[0]) {
      actorCustomPath = files.userImage[0].path;
      console.log('[API] Imagen personalizada detectada', { path: actorCustomPath });
    }

    // Log de feedback para métricas
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: true,
      params: { 
        visualStyle: validatedBody.visualStyle,
        estiloNormalizado,
        duration: validatedBody.duration 
      }
    });

    // 🚨 VALIDACIÓN CRÍTICA DE LÍMITES ANTES DE CREAR VIDEO
    // Según flujo.txt: Backend verifica plan y contador (límite por semana)
    const userId = (req as AuthenticatedRequest).user?.id;
    if (userId) {
      const limitValidation = await PlanLimitService.validateVideoCreation(userId);
      
      if (!limitValidation.canCreate) {
        logger.warn(`[API] Usuario ${userId} alcanzó límite:`, limitValidation);
        
        return res.status(403).json({
          success: false,
          error: 'Límite de videos alcanzado',
          code: 'VIDEO_LIMIT_EXCEEDED',
          data: {
            currentUsage: limitValidation.currentUsage,
            maxAllowed: limitValidation.maxAllowed,
            planName: limitValidation.planName,
            resetDate: limitValidation.resetDate,
            reason: limitValidation.reason
          }
        });
      }

      logger.info(`[API] Límites verificados OK para usuario ${userId}:`, {
        plan: limitValidation.planName,
        usage: `${limitValidation.currentUsage}/${limitValidation.maxAllowed}`
      });
    }

    // 🎬 CREAR PROYECTO CINEMATOGRÁFICO ESPECÍFICO
    // Según flujo.txt línea 19: "Backend registra un proyecto con tipo: cinematográfico"
    const project = await CinemaProjectStore.create({
      userId: userId!,
      tipo: 'cinematográfico',
      parametros: {
        prompt: validatedBody.prompt,
        visualStyle: estiloNormalizado,
        duration: validatedBody.duration,
        voiceEnabled: true, // Por defecto habilitado
        actorVisible: true  // Por defecto visible
      },
      estado: 'creado',
      contadoresUsoPendientes: true
    });

    logger.info(`[API] Proyecto Cinema creado: ${project.id}`);

    // Crear trabajo en la cola con estilo normalizado
    const jobData = {
      ...validatedBody,
      visualStyle: estiloNormalizado, // ✅ Usar estilo normalizado
      estiloOriginal: validatedBody.visualStyle, // Preservar para logs
      userId: (req as AuthenticatedRequest).user?.id, // ✅ CRÍTICO: Pasar userId
      projectId: project.id, // ✅ NUEVO: Vincular con proyecto
      actorCustomPath,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    };

    const jobId = await startJob(jobData);
    
    // ✅ VINCULAR PROYECTO CON JOB
    await CinemaProjectStore.updateJobId(project.id, jobId);
    await CinemaProjectStore.updateEstado(project.id, 'en_cola');
    
    console.log('[API] Trabajo creado exitosamente', { jobId, projectId: project.id });

    // ✅ RESPUESTA UNIFICADA CON PROYECTO
    const respuesta = {
      success: true,
      message: 'Cinema AI project created successfully',
      data: {
        jobId,
        projectId: project.id, // ✅ NUEVO: ID del proyecto para consultas
        estado: 'en_cola' as const,
        estimadoTiempo: 1800, // 30 minutos en segundos
        urlResultado: `/api/render/result/${jobId}`,
        urlProyecto: `/api/cinema/project/${project.id}` // ✅ NUEVO: Endpoint específico
      },
      timestamp: new Date().toISOString(),
      source: 'API'
    };

    res.status(202).json({
      ...respuesta,
      statusUrl: `/api/render/status/${jobId}`,
      estimatedTime: '20-30 minutes' // Compatibilidad
    });

  } catch (error: any) {
    console.error('[API] Error procesando request', error);
    
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: false,
      error: error.message,
      params: req.body
    });

    if (error instanceof z.ZodError) {
      const respuestaError = {
        success: false,
        code: 'PARAMETROS_FALTANTES',
        message: 'Datos de entrada inválidos',
        error: error.errors,
        timestamp: new Date().toISOString(),
        source: 'API'
      };
      return res.status(400).json(respuestaError);
    }

    const respuestaError = {
      success: false,
      code: 'ERROR_INTERNO',
      message: error.message || 'Error desconocido',
      error: error,
      timestamp: new Date().toISOString(),
      source: 'API'
    };
    res.status(500).json(respuestaError);
  }
});

// Endpoint para verificar estado de trabajo
renderRouter.get('/status/:jobId', async (req, res) => {
  try {
    const status = getJobStatus(req.params.jobId);
    res.json({ status });
  } catch (error: any) {
    logger.error('Error obteniendo estado:', error);
    res.status(404).json({ error: 'Job not found' });
  }
});

// Endpoint para obtener progreso detallado del trabajo
renderRouter.get('/progress/:jobId', async (req, res) => {
  try {
    const progress = getJobProgress(req.params.jobId);
    res.json(progress);
  } catch (error: any) {
    logger.error('Error obteniendo progreso:', error);
    res.status(404).json({ error: 'Job not found' });
  }
});

// Endpoint para obtener estado completo del trabajo
renderRouter.get('/state/:jobId', async (req, res) => {
  try {
    const state = getJobState(req.params.jobId);
    if (!state) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(state);
  } catch (error: any) {
    logger.error('Error obteniendo estado completo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint para obtener resultado
renderRouter.get('/result/:jobId', async (req, res) => {
  try {
    const result = getJobResult(req.params.jobId);
    res.json(result);
  } catch (error: any) {
    logger.error('Error obteniendo resultado:', error);
    res.status(404).json({ error: 'Result not found' });
  }
});

export default renderRouter;
