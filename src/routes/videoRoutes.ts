/**
 * 🎬 RUTAS PARA HISTORIAL DE VIDEOS DEL USUARIO
 * Según flujo.txt: Sistema completo de historial y consulta
 */

import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const router = Router();
const prisma = new PrismaClient();

// ✅ APLICAR AUTENTICACIÓN A TODAS LAS RUTAS
router.use(authenticate);

/**
 * 📱 OBTENER HISTORIAL DE VIDEOS DEL USUARIO
 * GET /api/videos
 */
router.get('/', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const { page = 1, limit = 10, type, status } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Construir filtros
    const where: any = { userId };
    if (type && type !== 'all') {
      where.type = type;
    }
    if (status && status !== 'all') {
      where.status = status;
    }

    // Obtener videos con paginación
    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          status: true,
          finalVideoUrl: true,
          thumbnailUrl: true,
          duration: true,
          prompt: true,
          style: true,
          createdAt: true,
          updatedAt: true,
          metadata: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.video.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('[VideoRoutes] Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 🎬 OBTENER DETALLES DE UN VIDEO ESPECÍFICO
 * GET /api/videos/:videoId
 */
router.get('/:videoId', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    const { videoId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const video = await prisma.video.findUnique({
      where: { 
        id: parseInt(videoId),
        userId: userId // Verificar propiedad
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        finalVideoUrl: true,
        thumbnailUrl: true,
        duration: true,
        prompt: true,
        style: true,
        businessType: true,
        createdAt: true,
        updatedAt: true,
        metadata: true
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video no encontrado'
      });
    }

    res.json({
      success: true,
      data: { video }
    });

  } catch (error) {
    logger.error('[VideoRoutes] Error obteniendo video:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 📊 OBTENER ESTADÍSTICAS DEL USUARIO
 * GET /api/videos/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const stats = await prisma.video.groupBy({
      by: ['type', 'status'],
      where: { userId },
      _count: { id: true }
    });

    // Transformar a formato más amigable
    const result = {
      total: 0,
      byType: {} as any,
      byStatus: {} as any
    };

    stats.forEach(stat => {
      result.total += stat._count.id;
      result.byType[stat.type] = (result.byType[stat.type] || 0) + stat._count.id;
      result.byStatus[stat.status] = (result.byStatus[stat.status] || 0) + stat._count.id;
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('[VideoRoutes] Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
