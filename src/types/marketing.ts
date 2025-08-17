/**
 * 🎯 TIPOS ESPECÍFICOS PARA MARKETING PIPELINE
 * Arregla el uso de any[] y tipos indefinidos
 */

export interface VideoAsset {
  id: string;
  url: string;
  videoUrl?: string; // Para compatibilidad
  duration: number;
  engine: 'runway' | 'kling';
  engineUsed?: string; // Para compatibilidad 
  prompt: string;
  metadata?: any;
}

export interface AudioAssets {
  voice?: any; // MurfVoiceResponse con audioBuffer
  music?: any; // Buffer
  sfx?: any; // Buffer
}

export interface TomaVideo {
  id: string;
  prompt: string;
  imageRef?: string;
  duration: number;
  sequence: number;
  style: string;
}

export interface MarketingVideoRequest {
  conceptosVisuales: ConceptoVisual[];
  copyProfesional: CopyProfesional[];
  audioAssets: AudioAssets;
  templateId?: string;
  duration?: number;
  // Propiedades existentes del sistema
  videoType: string;
  platform: string;
  businessDescription: string;
  businessImages: string[];
  useAIActor?: boolean;
}

export interface ConceptoVisual {
  id: string;
  titulo: string;
  descripcion: string;
  prompt: string;
  imageRef?: string;
  style: string;
  sequence: number;
}

export interface CopyProfesional {
  id: string;
  tipo: 'hook' | 'body' | 'cta';
  texto: string;
  timing: number;
  emotion: string;
}

export interface MarketingVideoResult {
  success: boolean;
  videoUrl?: string;
  duration?: number;
  assets: VideoAsset[];
  metadata: {
    engine: string;
    processingTime: number;
    quality: string;
  };
}

export interface DualEngineConfig {
  runway: {
    enabled: boolean;
    priority: number;
    model: string;
  };
  kling: {
    enabled: boolean;
    priority: number;
    model: string;
  };
}
