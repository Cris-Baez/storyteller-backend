/**
 * 🎬 RUTAS ESPECÍFICAS PARA PROYECTOS CINEMA AI
 * Según flujo.txt: Sistema independiente de consulta de proyectos cinematográficos
 */

import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { CinemaProjectStore } from '../models/CinemaProject.js';
import { CinemaProgressService } from '../services/cinemaProgressService.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ✅ APLICAR AUTENTICACIÓN A TODAS LAS RUTAS
router.use(authenticate);

/**
 * 📊 OBTENER ESTADO DE PROYECTO CINEMA ESPECÍFICO
 * GET /api/cinema/project/:projectId
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = (req as AuthenticatedRequest).user?.id;

    const project = await CinemaProjectStore.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Proyecto no encontrado'
      });
    }

    // Verificar propiedad
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado'
      });
    }

    // Obtener estado detallado
    const status = await CinemaProgressService.getProjectStatus(projectId);

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          tipo: project.tipo,
          parametros: project.parametros,
          estado: project.estado,
          fechaCreacion: project.fechaCreacion,
          fechaActualizacion: project.fechaActualizacion,
          videoUrl: project.videoUrl,
          jobId: project.jobId
        },
        status: status ? {
          estado: status.estado,
          mensaje: status.mensaje,
          progreso: status.progreso,
          fechaActualizacion: status.fechaActualizacion
        } : null
      }
    });

  } catch (error) {
    logger.error('[CinemaRoutes] Error obteniendo proyecto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

/**
 * 📋 OBTENER HISTORIAL DE PROYECTOS CINEMA DEL USUARIO
 * GET /api/cinema/projects
 */
router.get('/projects', async (req, res) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    const projects = await CinemaProjectStore.findByUserId(userId);
    
    // Ordenar por fecha de creación descendente
    projects.sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());

    res.json({
      success: true,
      data: {
        projects: projects.map(project => ({
          id: project.id,
          tipo: project.tipo,
          parametros: {
            prompt: project.parametros.prompt,
            visualStyle: project.parametros.visualStyle,
            duration: project.parametros.duration
          },
          estado: project.estado,
          fechaCreacion: project.fechaCreacion,
          fechaActualizacion: project.fechaActualizacion,
          videoUrl: project.videoUrl
        })),
        total: projects.length
      }
    });

  } catch (error) {
    logger.error('[CinemaRoutes] Error obteniendo proyectos:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
