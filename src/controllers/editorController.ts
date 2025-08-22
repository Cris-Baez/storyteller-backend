import { Request, Response } from 'express';
import EditorService from '../services/editorService.js';

class EditorController {
  // Crear proyecto manual
  async createProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const project = await EditorService.createProject(userId, req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error creating project' });
    }
  }

  // Crear proyecto desde el agente
  async createProjectFromAgent(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const project = await EditorService.createProjectFromAgent(userId, req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error creating project from agent' });
    }
  }

  // Listar proyectos
  async listProjects(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const filters = {
        createdAfter: req.query.createdAfter
          ? new Date(req.query.createdAfter as string)
          : undefined,
        createdBefore: req.query.createdBefore
          ? new Date(req.query.createdBefore as string)
          : undefined,
      };
      const projects = await EditorService.listProjects(userId, filters);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: 'Error listing projects' });
    }
  }

  // Obtener proyecto
  async getProjectById(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const project = await EditorService.getProjectById(userId, projectId);
      if (!project) return res.status(404).json({ error: 'Project not found' });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error getting project' });
    }
  }

  // Actualizar proyecto
  async updateProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const updated = await EditorService.updateProject(userId, projectId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error updating project' });
    }
  }

  // Borrar proyecto
  async deleteProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      await EditorService.deleteProject(userId, projectId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Error deleting project' });
    }
  }

  // Duplicar proyecto
  async duplicateProject(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const project = await EditorService.duplicateProject(userId, projectId);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: 'Error duplicating project' });
    }
  }

  // Timeline: añadir clip
  async addClip(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const { trackId, clip } = req.body;
      const updated = await EditorService.addClipToTimeline(userId, projectId, trackId, clip);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error adding clip' });
    }
  }

  // Timeline: mover clip
  async moveClip(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const { clipId, newStart } = req.body;
      const updated = await EditorService.moveClip(userId, projectId, clipId, newStart);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error moving clip' });
    }
  }

  // Timeline: remover clip
  async removeClip(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const { clipId } = req.body;
      const updated = await EditorService.removeClip(userId, projectId, clipId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error removing clip' });
    }
  }

  // Listar assets
  async listAssets(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const assets = await EditorService.listAssets(userId);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: 'Error listing assets' });
    }
  }

  // Agregar asset
  async addAsset(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const asset = await EditorService.addAsset(userId, req.body);
      res.status(201).json(asset);
    } catch (error) {
      res.status(500).json({ error: 'Error adding asset' });
    }
  }

  // Borrar asset
  async deleteAsset(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const assetId = parseInt(req.params.id, 10);
      await EditorService.deleteAsset(userId, assetId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: 'Error deleting asset' });
    }
  }

  // Stats
  async getEditorStats(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const stats = await EditorService.getEditorStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Error getting stats' });
    }
  }

  // Regenerar voz
  async regenerateVoice(req: Request, res: Response) {
    try {
      const { projectId, text, voice } = req.body;
      const userId = (req as any).user?.id as number;
      const updated = await EditorService.regenerateVoice(
        userId,
        Number(projectId),
        text,
        voice
      );
      if (!updated) return res.status(404).json({ error: 'Project not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error regenerating voice' });
    }
  }

  // Actualizar mezcla de audio
  async updateAudioMix(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const updated = await EditorService.updateAudioMix(userId, projectId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error updating audio mix' });
    }
  }

  // Agregar efecto de sonido
  async addSoundEffect(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id as number;
      const projectId = parseInt(req.params.id, 10);
      const updated = await EditorService.addSoundEffect(userId, projectId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Error adding sound effect' });
    }
  }
}

export default new EditorController();
