/**
 * 🎬 SERVICIO DE PROGRESO ESPECÍFICO PARA CINEMA AI
 * Según flujo.txt línea 73: Estados específicos de Cinema AI
 */

import { logger } from '../utils/logger.js';
import { CinemaProjectStore } from '../models/CinemaProject.js';

export type CinemaEstado = 'creado' | 'en_cola' | 'procesando_tomas' | 'procesando_audio' | 'montando' | 'renderizando' | 'subiendo' | 'completado' | 'fallido';

export class CinemaProgressService {
  
  /**
   * 🎯 REPORTAR PROGRESO CON ESTADOS ESPECÍFICOS DE CINEMA AI
   */
  static async reportProgress(
    projectId: string,
    estado: CinemaEstado,
    message: string,
    progress: number
  ): Promise<void> {
    try {
      // Actualizar estado en el proyecto
      await CinemaProjectStore.updateEstado(projectId, estado);
      
      // Log estructurado para el frontend
      logger.info(`[CinemaProgress] ${projectId}: ${estado} - ${message} (${progress}%)`);
      
      // Aquí se puede integrar con WebSockets si es necesario
      // this.notifyFrontend(projectId, estado, message, progress);
      
    } catch (error) {
      logger.error(`[CinemaProgress] Error reportando progreso para ${projectId}:`, error);
    }
  }

  /**
   * 🎬 WRAPPER PARA EL RENDERIZADOR EXISTENTE
   * Adapta los reportProgress existentes a estados específicos
   */
  static createProgressReporter(projectId: string) {
    return (message: string, progress: number, status?: string) => {
      let estado: CinemaEstado;

      // Mapear mensajes existentes a estados específicos
      if (message.includes('Planificando') || message.includes('Generando plan')) {
        estado = 'procesando_tomas';
      } else if (message.includes('Generando voz') || message.includes('audio') || message.includes('música')) {
        estado = 'procesando_audio';
      } else if (message.includes('Montando') || message.includes('Ensamblando')) {
        estado = 'montando';
      } else if (message.includes('Renderizando') || message.includes('Generando video')) {
        estado = 'renderizando';
      } else if (message.includes('Subiendo') || message.includes('Upload')) {
        estado = 'subiendo';
      } else if (message.includes('Completado') || progress >= 100) {
        estado = 'completado';
      } else if (message.includes('Error') || message.includes('Fallo')) {
        estado = 'fallido';
      } else {
        estado = 'en_cola';
      }

      this.reportProgress(projectId, estado, message, progress);
    };
  }

  /**
   * 📊 OBTENER ESTADO ACTUAL DEL PROYECTO
   */
  static async getProjectStatus(projectId: string): Promise<{
    estado: CinemaEstado;
    mensaje: string;
    progreso: number;
    fechaActualizacion: Date;
  } | null> {
    try {
      const project = await CinemaProjectStore.findById(projectId);
      if (!project) return null;

      return {
        estado: project.estado,
        mensaje: this.getEstadoMessage(project.estado),
        progreso: this.getEstadoProgress(project.estado),
        fechaActualizacion: project.fechaActualizacion
      };
    } catch (error) {
      logger.error(`[CinemaProgress] Error obteniendo estado de ${projectId}:`, error);
      return null;
    }
  }

  private static getEstadoMessage(estado: CinemaEstado): string {
    const messages = {
      'creado': 'Proyecto creado exitosamente',
      'en_cola': 'En cola para procesamiento',
      'procesando_tomas': 'Planificando tomas cinematográficas',
      'procesando_audio': 'Generando audio y efectos sonoros',
      'montando': 'Montando secuencias y aplicando transiciones',
      'renderizando': 'Renderizando video final',
      'subiendo': 'Subiendo a almacenamiento',
      'completado': 'Video completado exitosamente',
      'fallido': 'Error en el procesamiento'
    };
    return messages[estado];
  }

  private static getEstadoProgress(estado: CinemaEstado): number {
    const progressMap = {
      'creado': 5,
      'en_cola': 10,
      'procesando_tomas': 30,
      'procesando_audio': 50,
      'montando': 70,
      'renderizando': 85,
      'subiendo': 95,
      'completado': 100,
      'fallido': 0
    };
    return progressMap[estado];
  }
}
