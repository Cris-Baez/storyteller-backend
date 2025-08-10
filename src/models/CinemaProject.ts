/**
 * 🎬 MODELO DE PROYECTOS CINEMATOGRÁFICOS
 * Según flujo.txt línea 19: "Backend registra un proyecto con tipo: cinematográfico"
 */

export interface CinemaProject {
  id: string;
  userId: number;
  tipo: 'cinematográfico';
  parametros: {
    prompt: string;
    visualStyle: string;
    duration: number;
    voiceEnabled?: boolean;
    actorVisible?: boolean;
  };
  estado: 'creado' | 'en_cola' | 'procesando_tomas' | 'procesando_audio' | 'montando' | 'renderizando' | 'subiendo' | 'completado' | 'fallido';
  contadoresUsoPendientes: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  jobId?: string; // Vinculación con el sistema de jobs existente
  videoUrl?: string;
  metadata?: any;
}

// Store en memoria para no tocar la base de datos existente
export class CinemaProjectStore {
  private static projects: Map<string, CinemaProject> = new Map();

  static async create(data: Omit<CinemaProject, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): Promise<CinemaProject> {
    const id = `cinema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const project: CinemaProject = {
      ...data,
      id,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date()
    };

    this.projects.set(id, project);
    return project;
  }

  static async findById(id: string): Promise<CinemaProject | null> {
    return this.projects.get(id) || null;
  }

  static async updateEstado(id: string, estado: CinemaProject['estado']): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      project.estado = estado;
      project.fechaActualizacion = new Date();
      this.projects.set(id, project);
    }
  }

  static async updateJobId(id: string, jobId: string): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      project.jobId = jobId;
      project.fechaActualizacion = new Date();
      this.projects.set(id, project);
    }
  }

  static async complete(id: string, videoUrl: string, metadata: any): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      project.estado = 'completado';
      project.videoUrl = videoUrl;
      project.metadata = metadata;
      project.contadoresUsoPendientes = false;
      project.fechaActualizacion = new Date();
      this.projects.set(id, project);
    }
  }

  static async findByUserId(userId: number): Promise<CinemaProject[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }
}
