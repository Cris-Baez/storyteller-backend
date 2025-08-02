// VideoSegment type para sistema de segmentos de video
export interface VideoSegment {
  id: string;
  prompt: string;
  duration: number;
  backgroundUrl?: string;
  actorUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Resultado de generación de segmento
export interface SegmentGenerationResult {
  success: boolean;
  segment?: VideoSegment;
  error?: string;
}

// Configuración para generación de segmento
export interface SegmentConfig {
  prompt: string;
  duration: number;
  backgroundUrl?: string;
  actorUrl?: string;
  aspectRatio?: string;
  quality?: 'draft' | 'standard' | 'high';
}
