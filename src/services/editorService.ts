import { PrismaClient, Project, Asset } from '../../generated/prisma/index.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export interface ProjectCreateData {
  title: string;
  description?: string;
  data?: any;
}

export interface ProjectUpdateData {
  title?: string;
  description?: string;
  data?: any;
}

export interface AssetUploadData {
  filename: string;
  type: string;
  url: string;
  size: number;
}

export interface ProjectFilters {
  status?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * 🎬 SERVICIO DE EDITOR VISUAL
 * 
 * Maneja proyectos y assets para usuarios Studio Pro
 */
export class EditorService {

  /**
   * 📁 CREAR NUEVO PROYECTO
   */
  static async createProject(userId: number, data: ProjectCreateData): Promise<Project> {
    logger.info(`[EditorService] 📁 Creando proyecto para usuario ${userId}: ${data.title}`);

    try {
      // Verificar que el usuario tenga plan Studio Pro
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true, email: true }
      });

      if (!user || user.plan !== 'STUDIO_PRO') {
        throw new Error('Se requiere plan Studio Pro para crear proyectos');
      }

      // Crear proyecto
      const project = await prisma.project.create({
        data: {
          userId,
          title: data.title,
          description: data.description,
          status: 'DRAFT',
          data: data.data || {}
        }
      });

      logger.info(`[EditorService] ✅ Proyecto creado: ${project.id} - ${project.title}`);
      return project;

    } catch (error) {
      logger.error('[EditorService] ❌ Error creando proyecto:', error);
      throw error;
    }
  }

  /**
   * 📋 OBTENER PROYECTOS DEL USUARIO
   */
  static async getUserProjects(userId: number, filters?: ProjectFilters, page = 1, limit = 20): Promise<{
    projects: Project[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    logger.info(`[EditorService] 📋 Obteniendo proyectos del usuario ${userId}`);

    try {
      const where: any = { userId };

      if (filters) {
        if (filters.status) where.status = filters.status;
        if (filters.createdAfter) where.createdAt = { gte: filters.createdAfter };
        if (filters.createdBefore) {
          where.createdAt = { 
            ...where.createdAt, 
            lte: filters.createdBefore 
          };
        }
      }

      const total = await prisma.project.count({ where });
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const projects = await prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      });

      logger.info(`[EditorService] ✅ Obtenidos ${projects.length} proyectos de ${total} totales`);
      
      return {
        projects,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('[EditorService] ❌ Error obteniendo proyectos:', error);
      throw new Error('Error al obtener proyectos del usuario');
    }
  }

  /**
   * 👁️ OBTENER DETALLES DE PROYECTO
   */
  static async getProjectById(userId: number, projectId: number): Promise<Project | null> {
    logger.info(`[EditorService] 👁️ Obteniendo proyecto ${projectId} del usuario ${userId}`);

    try {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId // Verificar que el proyecto pertenece al usuario
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              plan: true
            }
          }
        }
      });

      if (project) {
        logger.info(`[EditorService] ✅ Proyecto encontrado: ${project.title}`);
      } else {
        logger.warn(`[EditorService] ⚠️ Proyecto no encontrado o sin acceso: ${projectId}`);
      }

      return project;

    } catch (error) {
      logger.error('[EditorService] ❌ Error obteniendo proyecto:', error);
      throw new Error('Error al obtener detalles del proyecto');
    }
  }

  /**
   * ✏️ ACTUALIZAR PROYECTO
   */
  static async updateProject(userId: number, projectId: number, data: ProjectUpdateData): Promise<Project> {
    logger.info(`[EditorService] ✏️ Actualizando proyecto ${projectId} del usuario ${userId}`);

    try {
      // Verificar que el proyecto existe y pertenece al usuario
      const existingProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId
        }
      });

      if (!existingProject) {
        throw new Error('Proyecto no encontrado o sin permisos');
      }

      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      logger.info(`[EditorService] ✅ Proyecto actualizado: ${updatedProject.title}`);
      return updatedProject;

    } catch (error) {
      logger.error('[EditorService] ❌ Error actualizando proyecto:', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAR PROYECTO
   */
  static async deleteProject(userId: number, projectId: number): Promise<void> {
    logger.info(`[EditorService] 🗑️ Eliminando proyecto ${projectId} del usuario ${userId}`);

    try {
      // Verificar que el proyecto existe y pertenece al usuario
      const existingProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId
        }
      });

      if (!existingProject) {
        throw new Error('Proyecto no encontrado o sin permisos');
      }

      // Eliminar proyecto
      await prisma.project.delete({
        where: { id: projectId }
      });

      logger.info(`[EditorService] ✅ Proyecto eliminado: ${existingProject.title}`);

    } catch (error) {
      logger.error('[EditorService] ❌ Error eliminando proyecto:', error);
      throw error;
    }
  }

  /**
   * 📎 AGREGAR ASSET DEL USUARIO
   */
  static async addAsset(userId: number, data: AssetUploadData): Promise<Asset> {
    logger.info(`[EditorService] 📎 Agregando asset para usuario ${userId}`);

    try {
      // Verificar que el usuario tenga plan Studio Pro
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { plan: true }
      });

      if (!user || user.plan !== 'STUDIO_PRO') {
        throw new Error('Se requiere plan Studio Pro para subir assets');
      }

      const asset = await prisma.asset.create({
        data: {
          userId,
          filename: data.filename,
          type: data.type as any,
          url: data.url,
          size: data.size
        }
      });

      logger.info(`[EditorService] ✅ Asset agregado: ${asset.id} - ${asset.filename}`);
      return asset;

    } catch (error) {
      logger.error('[EditorService] ❌ Error agregando asset:', error);
      throw error;
    }
  }

  /**
   * 🗂️ OBTENER ASSETS DEL USUARIO
   */
  static async getUserAssets(userId: number, page = 1, limit = 50): Promise<{
    assets: Asset[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    logger.info(`[EditorService] 🗂️ Obteniendo assets del usuario ${userId}`);

    try {
      const total = await prisma.asset.count({
        where: { userId }
      });
      
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      const assets = await prisma.asset.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      logger.info(`[EditorService] ✅ Obtenidos ${assets.length} assets de ${total} totales`);
      
      return {
        assets,
        total,
        page,
        totalPages
      };

    } catch (error) {
      logger.error('[EditorService] ❌ Error obteniendo assets:', error);
      throw error;
    }
  }

  /**
   * 🗑️ ELIMINAR ASSET
   */
  static async deleteAsset(userId: number, assetId: number): Promise<void> {
    logger.info(`[EditorService] 🗑️ Eliminando asset ${assetId}`);

    try {
      // Verificar que el asset existe y pertenece al usuario
      const asset = await prisma.asset.findFirst({
        where: {
          id: assetId,
          userId
        }
      });

      if (!asset) {
        throw new Error('Asset no encontrado o sin permisos');
      }

      // Eliminar archivo físico
      if (asset.url) {
        try {
          // Aquí podrías eliminar del CDN/storage
          logger.info(`[EditorService] 🗂️ Archivo a eliminar: ${asset.url}`);
        } catch (fileError) {
          logger.warn(`[EditorService] ⚠️ Error eliminando archivo:`, fileError);
        }
      }

      // Eliminar asset de la base de datos
      await prisma.asset.delete({
        where: { id: assetId }
      });

      logger.info(`[EditorService] ✅ Asset eliminado: ${asset.filename}`);

    } catch (error) {
      logger.error('[EditorService] ❌ Error eliminando asset:', error);
      throw error;
    }
  }

  /**
   * 🔄 DUPLICAR PROYECTO
   */
  static async duplicateProject(userId: number, projectId: number, newTitle: string): Promise<Project> {
    logger.info(`[EditorService] 🔄 Duplicando proyecto ${projectId} como "${newTitle}"`);

    try {
      // Obtener proyecto original
      const originalProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId
        }
      });

      if (!originalProject) {
        throw new Error('Proyecto no encontrado o sin permisos');
      }

      // Crear proyecto duplicado
      const duplicatedProject = await prisma.project.create({
        data: {
          userId,
          title: newTitle,
          description: `Copia de ${originalProject.title}`,
          status: 'DRAFT',
          data: originalProject.data as any
        }
      });

      logger.info(`[EditorService] ✅ Proyecto duplicado: ${duplicatedProject.id} - ${duplicatedProject.title}`);
      return duplicatedProject;

    } catch (error) {
      logger.error('[EditorService] ❌ Error duplicando proyecto:', error);
      throw error;
    }
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DEL EDITOR
   */
  static async getEditorStats(userId: number): Promise<{
    projects: { total: number; drafts: number; published: number; };
    assets: { total: number; totalSize: number; byType: Record<string, number>; };
    videos: { total: number; totalDuration: number; };
    storage: { used: string; available: string; };
  }> {
    logger.info(`[EditorService] 📊 Obteniendo estadísticas del editor para usuario ${userId}`);

    try {
      // Estadísticas de proyectos
      const totalProjects = await prisma.project.count({
        where: { userId }
      });
      
      const draftProjects = await prisma.project.count({
        where: { userId, status: 'DRAFT' }
      });
      
      const publishedProjects = await prisma.project.count({
        where: { userId, status: 'PUBLISHED' }
      });

      // Estadísticas de assets
      const totalAssets = await prisma.asset.count({
        where: { userId }
      });

      const assetsSizeSum = await prisma.asset.aggregate({
        where: { userId },
        _sum: { size: true }
      });

      const assetsByType = await prisma.asset.groupBy({
        where: { userId },
        by: ['type'],
        _count: { _all: true }
      });

      // Estadísticas de videos
      const totalVideos = await prisma.video.count({
        where: { userId }
      });

      const videosDurationSum = await prisma.video.aggregate({
        where: { userId, duration: { not: null } },
        _sum: { duration: true }
      });

      const stats = {
        projects: {
          total: totalProjects,
          drafts: draftProjects,
          published: publishedProjects
        },
        assets: {
          total: totalAssets,
          totalSize: assetsSizeSum._sum.size || 0,
          byType: assetsByType.reduce((acc, item) => {
            acc[item.type] = item._count._all;
            return acc;
          }, {} as Record<string, number>)
        },
        videos: {
          total: totalVideos,
          totalDuration: videosDurationSum._sum.duration || 0
        },
        storage: {
          used: `${Math.round((assetsSizeSum._sum.size || 0) / (1024 * 1024))} MB`,
          available: '1 GB' // Esto se podría calcular según el plan
        }
      };

      logger.info(`[EditorService] ✅ Estadísticas obtenidas para usuario ${userId}`);
      return stats;

    } catch (error) {
      logger.error('[EditorService] ❌ Error obteniendo estadísticas:', error);
      throw new Error('Error al obtener estadísticas del editor');
    }
  }
}
