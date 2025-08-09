import { Request, Response } from 'express';
import { EditorService, ProjectCreateData, ProjectUpdateData, AssetUploadData } from '../services/editorService.js';
import { logger } from '../utils/logger.js';

/**
 * 🎬 CONTROLADOR DE EDITOR VISUAL
 * 
 * Maneja las operaciones de proyectos y assets del editor visual
 */
export class EditorController {

  /**
   * 📁 CREAR NUEVO PROYECTO
   */
  static createProject = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 📁 Creando proyecto');
      
      const { title, description, data } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      const projectData: ProjectCreateData = {
        title: title.trim(),
        description: description?.trim(),
        data: data || {}
      };

      const project = await EditorService.createProject(userId, projectData);

      res.status(201).json({
        message: 'Proyecto creado exitosamente',
        data: project
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error creando proyecto:', error);
      
      if (error.message === 'Se requiere plan Studio Pro para crear proyectos') {
        res.status(403).json({
          error: error.message,
          code: 'PLAN_REQUIRED'
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 📋 OBTENER PROYECTOS DEL USUARIO
   */
  static getUserProjects = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 📋 Obteniendo proyectos del usuario');
      
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const createdAfter = req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined;
      const createdBefore = req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined;

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      const filters = {
        status,
        createdAfter,
        createdBefore
      };

      const result = await EditorService.getUserProjects(userId, filters, page, limit);

      res.status(200).json({
        message: 'Proyectos obtenidos exitosamente',
        data: result
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error obteniendo proyectos:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 👁️ OBTENER DETALLES DE PROYECTO
   */
  static getProjectById = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 👁️ Obteniendo detalles del proyecto');
      
      const userId = req.user?.id;
      const projectId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      if (!projectId || isNaN(projectId)) {
        res.status(400).json({
          error: 'ID de proyecto inválido',
          code: 'INVALID_PROJECT_ID'
        });
        return;
      }

      const project = await EditorService.getProjectById(userId, projectId);

      if (!project) {
        res.status(404).json({
          error: 'Proyecto no encontrado',
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      res.status(200).json({
        message: 'Proyecto obtenido exitosamente',
        data: project
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error obteniendo proyecto:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * ✏️ ACTUALIZAR PROYECTO
   */
  static updateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] ✏️ Actualizando proyecto');
      
      const userId = req.user?.id;
      const projectId = parseInt(req.params.id);
      const { title, description, data } = req.body;

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      if (!projectId || isNaN(projectId)) {
        res.status(400).json({
          error: 'ID de proyecto inválido',
          code: 'INVALID_PROJECT_ID'
        });
        return;
      }

      const updateData: ProjectUpdateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim();
      if (data !== undefined) updateData.data = data;

      const project = await EditorService.updateProject(userId, projectId, updateData);

      res.status(200).json({
        message: 'Proyecto actualizado exitosamente',
        data: project
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error actualizando proyecto:', error);
      
      if (error.message === 'Proyecto no encontrado o sin permisos') {
        res.status(404).json({
          error: error.message,
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 🗑️ ELIMINAR PROYECTO
   */
  static deleteProject = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 🗑️ Eliminando proyecto');
      
      const userId = req.user?.id;
      const projectId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      if (!projectId || isNaN(projectId)) {
        res.status(400).json({
          error: 'ID de proyecto inválido',
          code: 'INVALID_PROJECT_ID'
        });
        return;
      }

      await EditorService.deleteProject(userId, projectId);

      res.status(200).json({
        message: 'Proyecto eliminado exitosamente'
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error eliminando proyecto:', error);
      
      if (error.message === 'Proyecto no encontrado o sin permisos') {
        res.status(404).json({
          error: error.message,
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 🔄 DUPLICAR PROYECTO
   */
  static duplicateProject = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 🔄 Duplicando proyecto');
      
      const userId = req.user?.id;
      const projectId = parseInt(req.params.id);
      const { newTitle } = req.body;

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      if (!projectId || isNaN(projectId)) {
        res.status(400).json({
          error: 'ID de proyecto inválido',
          code: 'INVALID_PROJECT_ID'
        });
        return;
      }

      const duplicatedProject = await EditorService.duplicateProject(userId, projectId, newTitle.trim());

      res.status(201).json({
        message: 'Proyecto duplicado exitosamente',
        data: duplicatedProject
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error duplicando proyecto:', error);
      
      if (error.message === 'Proyecto no encontrado o sin permisos') {
        res.status(404).json({
          error: error.message,
          code: 'PROJECT_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 📎 SUBIR ASSET (Versión simplificada sin multer por ahora)
   */
  static addAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 📎 Agregando asset');
      
      const userId = req.user?.id;
      const { filename, type, url, size } = req.body;

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      if (!filename || !type || !url || !size) {
        res.status(400).json({
          error: 'Faltan datos requeridos del asset',
          code: 'VALIDATION_ERROR'
        });
        return;
      }

      const assetData: AssetUploadData = {
        filename: filename.trim(),
        type,
        url,
        size: parseInt(size)
      };

      const asset = await EditorService.addAsset(userId, assetData);

      res.status(201).json({
        message: 'Asset agregado exitosamente',
        data: asset
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error agregando asset:', error);
      
      if (error.message === 'Se requiere plan Studio Pro para subir assets') {
        res.status(403).json({
          error: error.message,
          code: 'PLAN_REQUIRED'
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 🗂️ OBTENER ASSETS DEL USUARIO
   */
  static getUserAssets = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 🗂️ Obteniendo assets del usuario');
      
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      const result = await EditorService.getUserAssets(userId, page, limit);

      res.status(200).json({
        message: 'Assets obtenidos exitosamente',
        data: result
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error obteniendo assets:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 🗑️ ELIMINAR ASSET
   */
  static deleteAsset = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 🗑️ Eliminando asset');
      
      const userId = req.user?.id;
      const assetId = parseInt(req.params.id);

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      if (!assetId || isNaN(assetId)) {
        res.status(400).json({
          error: 'ID de asset inválido',
          code: 'INVALID_ASSET_ID'
        });
        return;
      }

      await EditorService.deleteAsset(userId, assetId);

      res.status(200).json({
        message: 'Asset eliminado exitosamente'
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error eliminando asset:', error);
      
      if (error.message === 'Asset no encontrado o sin permisos') {
        res.status(404).json({
          error: error.message,
          code: 'ASSET_NOT_FOUND'
        });
        return;
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };

  /**
   * 📊 OBTENER ESTADÍSTICAS DEL EDITOR
   */
  static getEditorStats = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info('[EditorController] 📊 Obteniendo estadísticas del editor');
      
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          error: 'Usuario no autenticado',
          code: 'UNAUTHORIZED'
        });
        return;
      }

      const stats = await EditorService.getEditorStats(userId);

      res.status(200).json({
        message: 'Estadísticas obtenidas exitosamente',
        data: stats
      });

    } catch (error: any) {
      logger.error('[EditorController] ❌ Error obteniendo estadísticas:', error);
      
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

export default EditorController;
