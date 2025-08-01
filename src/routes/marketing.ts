// src/routes/marketing.ts - API Routes para Marketing AI

import express from 'express';
import { z } from 'zod';
import { generateMarketingClip, validarImagenesMarketing } from '../services/marketingService.js';
import { logger, safeLog } from '../utils/logger.js';
import { logFeedback } from '../services/feedbackService.js';
import { ESTILOS_VALIDOS, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
import multer from 'multer';

export const marketingRouter = express.Router();

// Configuración de multer para imágenes de productos
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo por imagen
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Formato de imagen no soportado'));
    } else {
      cb(null, true);
    }
  }
});

// Esquema de validación para marketing
const marketingRequestSchema = z.object({
  imagenes: z.array(z.string().url()).min(1, 'Al menos una imagen es requerida').max(5, 'Máximo 5 imágenes'),
  descripcion: z.string().min(10, 'Descripción debe tener al menos 10 caracteres').max(200, 'Descripción muy larga'),
  estilo: z.enum(ESTILOS_VALIDOS as [EstiloVisualAPI, ...EstiloVisualAPI[]]).optional(),
  duracion: z.number().min(5).max(30).optional(),
  textoVoz: z.string().max(500).optional()
});

/**
 * POST /api/marketing
 * Genera un clip de marketing automático con imágenes, voz y música
 */
marketingRouter.post('/', upload.array('imagenes', 5), async (req, res) => {
  try {
    safeLog('[MarketingAPI] Nueva solicitud de marketing', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      filesCount: req.files ? (req.files as Express.Multer.File[]).length : 0
    });

    // Procesar imágenes subidas
    let imagenes: string[] = [];
    
    if (req.files && Array.isArray(req.files)) {
      // Convertir archivos subidos a URLs (aquí deberías subirlos a tu CDN)
      imagenes = req.files.map(file => {
        // Por ahora usamos rutas locales, pero deberías implementar subida a CDN
        return `${process.env.CDN_BUCKET_URL}/uploads/${file.filename}`;
      });
    }
    
    // También aceptar URLs directas en el body
    if (req.body.imagenes) {
      const imagenesBody = Array.isArray(req.body.imagenes) ? req.body.imagenes : [req.body.imagenes];
      imagenes = imagenes.concat(imagenesBody);
    }

    // Validar que tenemos al menos una imagen
    if (imagenes.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'IMAGENES_REQUERIDAS',
        message: 'Se requiere al menos una imagen para generar el clip de marketing',
        timestamp: new Date().toISOString(),
        source: 'MarketingAPI'
      });
    }

    // Preparar datos para validación
    const requestData = {
      imagenes,
      descripcion: req.body.descripcion || '',
      estilo: req.body.estilo || 'commercial',
      duracion: parseInt(req.body.duracion) || 15,
      textoVoz: req.body.textoVoz
    };

    // Validar con Zod
    const validatedData = marketingRequestSchema.parse(requestData);
    
    // Normalizar estilo visual
    const estiloNormalizado = normalizarEstilo(validatedData.estilo || 'commercial');

    // Validar URLs de imágenes
    if (!validarImagenesMarketing(validatedData.imagenes)) {
      return res.status(400).json({
        success: false,
        code: 'IMAGENES_INVALIDAS',
        message: 'Una o más URLs de imágenes no son válidas',
        timestamp: new Date().toISOString(),
        source: 'MarketingAPI'
      });
    }

    logger.info('[MarketingAPI] Request validado exitosamente', {
      imagenes: validatedData.imagenes.length,
      descripcionLength: validatedData.descripcion.length,
      estilo: estiloNormalizado,
      duracion: validatedData.duracion
    });

    // Log de feedback para métricas
    logFeedback({
      service: 'MarketingAPI',
      action: 'requestReceived',
      success: true,
      params: {
        imagenes: validatedData.imagenes.length,
        estilo: estiloNormalizado,
        duracion: validatedData.duracion
      }
    });

    // Generar clip de marketing
    const resultado = await generateMarketingClip({
      imagenes: validatedData.imagenes,
      descripcion: validatedData.descripcion,
      estilo: estiloNormalizado,
      duracion: validatedData.duracion,
      textoVoz: validatedData.textoVoz
    });

    // Log de éxito
    logFeedback({
      service: 'MarketingAPI',
      action: 'clipGenerated',
      success: true,
      params: {
        videoUrl: resultado.videoUrl,
        duracion: resultado.metadata.duracion,
        estilo: resultado.metadata.estilo
      }
    });

    logger.info('[MarketingAPI] Clip de marketing generado exitosamente', {
      videoUrl: resultado.videoUrl,
      duracion: resultado.metadata.duracion
    });

    // Respuesta exitosa
    const respuesta = {
      success: true,
      message: 'Clip de marketing generado exitosamente',
      data: {
        videoUrl: resultado.videoUrl,
        duracion: resultado.metadata.duracion,
        estilo: resultado.metadata.estilo,
        tipo: 'marketing',
        metadata: resultado.metadata,
        plan: {
          imagenes: validatedData.imagenes.length,
          descripcion: validatedData.descripcion,
          textoVoz: resultado.planUsed.textoVoz,
          prompt: resultado.planUsed.prompt
        }
      },
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    };

    res.status(200).json(respuesta);

  } catch (error: any) {
    logger.error('[MarketingAPI] Error procesando request de marketing:', error);
    
    logFeedback({
      service: 'MarketingAPI',
      action: 'requestReceived',
      success: false,
      error: error.message,
      params: req.body
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        code: 'PARAMETROS_INVALIDOS',
        message: 'Datos de entrada inválidos para marketing',
        error: error.errors,
        timestamp: new Date().toISOString(),
        source: 'MarketingAPI'
      });
    }

    res.status(500).json({
      success: false,
      code: 'ERROR_GENERACION_MARKETING',
      message: error.message || 'Error interno generando clip de marketing',
      error: error,
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });
  }
});

/**
 * GET /api/marketing/estilos
 * Devuelve los estilos disponibles para marketing
 */
marketingRouter.get('/estilos', (req, res) => {
  try {
    const estilosMarketing = [
      {
        id: 'commercial',
        nombre: 'Comercial',
        descripcion: 'Estilo profesional y corporativo, ideal para productos y servicios',
        duracionRecomendada: 15,
        caracteristicas: ['Profesional', 'Limpio', 'Corporativo', 'Moderno']
      },
      {
        id: 'cinematic',
        nombre: 'Cinematográfico',
        descripcion: 'Estilo premium y dramático, perfecto para productos de lujo',
        duracionRecomendada: 20,
        caracteristicas: ['Premium', 'Dramático', 'Elegante', 'Sofisticado']
      },
      {
        id: 'cartoon',
        nombre: 'Animado',
        descripcion: 'Estilo divertido y colorido, ideal para productos juveniles',
        duracionRecomendada: 15,
        caracteristicas: ['Divertido', 'Colorido', 'Energético', 'Juvenil']
      },
      {
        id: 'anime',
        nombre: 'Anime',
        descripcion: 'Estilo dinámico y vibrante, perfecto para productos innovadores',
        duracionRecomendada: 15,
        caracteristicas: ['Dinámico', 'Vibrante', 'Innovador', 'Moderno']
      }
    ];

    res.json({
      success: true,
      data: estilosMarketing,
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });

  } catch (error: any) {
    logger.error('[MarketingAPI] Error obteniendo estilos:', error);
    
    res.status(500).json({
      success: false,
      code: 'ERROR_OBTENIENDO_ESTILOS',
      message: 'Error interno obteniendo estilos de marketing',
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });
  }
});

/**
 * GET /api/marketing/estadisticas
 * Devuelve estadísticas de uso del servicio de marketing
 */
marketingRouter.get('/estadisticas', async (req, res) => {
  try {
    // En el futuro esto podría leer de base de datos real
    const estadisticas = {
      totalClipsGenerados: 0,
      estilosMasUsados: ['commercial', 'cinematic'],
      duracionPromedio: 15,
      tiempoPromedioGeneracion: 120, // segundos
      satisfaccionPromedio: 4.5,
      ultimaActualizacion: new Date().toISOString()
    };

    res.json({
      success: true,
      data: estadisticas,
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });

  } catch (error: any) {
    logger.error('[MarketingAPI] Error obteniendo estadísticas:', error);
    
    res.status(500).json({
      success: false,
      code: 'ERROR_OBTENIENDO_ESTADISTICAS',
      message: 'Error interno obteniendo estadísticas',
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });
  }
});

export default marketingRouter;
