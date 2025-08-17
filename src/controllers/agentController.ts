/**
 * 🤖 CONTROLADOR DEL AGENTE AUTOMÁTICO
 * Interfaz REST para el sistema de automatización semanal
 */

import { Request, Response } from 'express';
import { marketingAgent, AgentConfig } from '../services/marketingAgentService.js';
import { logger } from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentController {
  
  /**
   * 🚀 ACTIVAR AGENTE AUTOMÁTICO
   * POST /api/agent/activate
   */
  static async activateAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const {
        frequency = 'weekly',
        preferredDays = ['monday'],
        preferredHours = [9],
        categories = ['promotion'],
        defaultStyle = 'moderno',
        defaultVoice = 'commercial',
        seasonalAdaptation = true,
        maxVideosPerWeek = 5
      } = req.body;

      // Verificar plan del usuario
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      if (user.plan === 'STARTER') {
        res.status(403).json({ 
          error: 'El Agente Automático requiere plan Creator ($29) o superior',
          requiredPlan: 'CREATOR'
        });
        return;
      }

      const agentConfig: AgentConfig = {
        userId,
        isActive: true,
        frequency,
        preferredDays,
        preferredHours,
        categories,
        defaultStyle,
        defaultVoice,
        seasonalAdaptation,
        maxVideosPerWeek
      };

      await marketingAgent.activateAgent(agentConfig);

      logger.info(`[AgentController] Agente activado exitosamente para usuario ${userId}`);

      res.json({
        success: true,
        message: 'Agente Automático activado correctamente',
        config: {
          frequency,
          preferredDays,
          categories,
          defaultStyle,
          seasonalAdaptation
        }
      });

    } catch (error) {
      logger.error('[AgentController] Error activando agente:', error);
      res.status(500).json({ 
        error: 'Error interno activando el Agente Automático',
        details: (error as Error).message
      });
    }
  }

  /**
   * ⏹️ DESACTIVAR AGENTE AUTOMÁTICO
   * POST /api/agent/deactivate
   */
  static async deactivateAgent(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      await marketingAgent.deactivateAgent(userId);

      logger.info(`[AgentController] Agente desactivado para usuario ${userId}`);

      res.json({
        success: true,
        message: 'Agente Automático desactivado correctamente'
      });

    } catch (error) {
      logger.error('[AgentController] Error desactivando agente:', error);
      res.status(500).json({ 
        error: 'Error interno desactivando el Agente Automático',
        details: (error as Error).message
      });
    }
  }

  /**
   * ⚡ EJECUCIÓN FORZADA DEL AGENTE
   * POST /api/agent/force-run
   */
  static async forceExecution(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      // Verificar plan
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || user.plan === 'STARTER') {
        res.status(403).json({ 
          error: 'La ejecución manual requiere plan Creator ($29) o superior',
          requiredPlan: 'CREATOR'
        });
        return;
      }

      logger.info(`[AgentController] Iniciando ejecución forzada para usuario ${userId}`);

      // Ejecutar en background para no bloquear la respuesta
      marketingAgent.forceExecution(userId).catch(error => {
        logger.error(`[AgentController] Error en ejecución forzada para usuario ${userId}:`, error);
      });

      res.json({
        success: true,
        message: 'Ejecución del Agente iniciada. El video se generará automáticamente.',
        estimatedTime: '3-5 minutos'
      });

    } catch (error) {
      logger.error('[AgentController] Error en ejecución forzada:', error);
      res.status(500).json({ 
        error: 'Error interno ejecutando el Agente Automático',
        details: (error as Error).message
      });
    }
  }

  /**
   * 📊 ESTADO DEL AGENTE
   * GET /api/agent/status
   */
  static async getAgentStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Obtener videos recientes del usuario (filtraremos manualmente)
      const recentVideos = await prisma.video.findMany({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 días
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Obtener más para poder filtrar
      });

      // Filtrar videos generados automáticamente
      const automaticVideos = recentVideos.filter(video => {
        try {
          const metadata = video.metadata as any;
          return metadata && metadata.isAutomated === true;
        } catch {
          return false;
        }
      }).slice(0, 10); // Limitar a 10

      const isAgentAvailable = user.plan !== 'STARTER';
      const isActive = automaticVideos.length > 0; // Simplificado - en producción podrías guardar el estado en BD

      res.json({
        success: true,
        agent: {
          isAvailable: isAgentAvailable,
          isActive,
          requiredPlan: isAgentAvailable ? user.plan : 'CREATOR',
          recentGenerations: automaticVideos.length,
          lastGeneration: automaticVideos[0]?.createdAt || null,
          nextScheduled: isActive ? 'Próximo lunes 9:00 AM' : null // Simplificado
        },
        recentVideos: automaticVideos.map(video => ({
          id: video.id,
          title: video.title,
          createdAt: video.createdAt,
          status: video.status,
          finalVideoUrl: video.finalVideoUrl,
          thumbnailUrl: video.thumbnailUrl
        }))
      });

    } catch (error) {
      logger.error('[AgentController] Error obteniendo estado:', error);
      res.status(500).json({ 
        error: 'Error interno obteniendo estado del Agente',
        details: (error as Error).message
      });
    }
  }

  /**
   * ⚙️ CONFIGURAR AGENTE
   * PUT /api/agent/config
   */
  static async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Usuario no autenticado' });
        return;
      }

      const {
        frequency,
        preferredDays,
        preferredHours,
        categories,
        defaultStyle,
        defaultVoice,
        seasonalAdaptation,
        maxVideosPerWeek
      } = req.body;

      const agentConfig: AgentConfig = {
        userId,
        isActive: true,
        frequency: frequency || 'weekly',
        preferredDays: preferredDays || ['monday'],
        preferredHours: preferredHours || [9],
        categories: categories || ['promotion'],
        defaultStyle: defaultStyle || 'moderno',
        defaultVoice: defaultVoice || 'commercial',
        seasonalAdaptation: seasonalAdaptation !== false,
        maxVideosPerWeek: maxVideosPerWeek || 5
      };

      await marketingAgent.activateAgent(agentConfig);

      logger.info(`[AgentController] Configuración actualizada para usuario ${userId}`);

      res.json({
        success: true,
        message: 'Configuración del Agente actualizada correctamente',
        config: agentConfig
      });

    } catch (error) {
      logger.error('[AgentController] Error actualizando configuración:', error);
      res.status(500).json({ 
        error: 'Error interno actualizando configuración',
        details: (error as Error).message
      });
    }
  }
}
