// Modelo simplificado para Marketing AI (sin mongoose por ahora)

export interface IMarketingVideo {
  userId: string;
  title: string;
  description: string;
  businessType: 'restaurant' | 'spa' | 'retail' | 'fitness' | 'beauty' | 'tech' | 'services' | 'other';
  videoType: 'promotional' | 'brand_story' | 'product_showcase' | 'testimonial' | 'event_announcement' | 'social_media';
  style: 'professional' | 'casual' | 'energetic' | 'emotional' | 'luxury' | 'minimalist';
  duration: 15 | 30 | 45 | 60;
  
  userImages: string[];
  userPrompt?: string;
  brandName?: string;
  callToAction?: string;
  
  useAIActor: boolean;
  voiceEnabled: boolean;
  voiceType?: 'male' | 'female' | 'neutral';
  musicStyle: 'upbeat' | 'corporate' | 'emotional' | 'energetic' | 'minimal' | 'none';
  
  aiGeneratedScript?: string;
  marketingTomas: IMarketingToma[];
  
  voiceAudioUrl?: string;
  backgroundMusicUrl?: string;
  soundEffectsUrls?: string[];
  finalVideoUrl?: string;
  thumbnailUrl?: string;
  
  status: 'creado' | 'en_cola' | 'procesando_tomas' | 'procesando_audio' | 'montando' | 'renderizando' | 'subiendo' | 'completado' | 'fallido';
  isAgentMode: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketingToma {
  index: number;
  type: 'hero_shot' | 'product_closeup' | 'lifestyle' | 'testimonial' | 'call_to_action' | 'brand_reveal';
  description: string;
  visualPrompt: string;
  duration: number;
  
  hasActor: boolean;
  actorPrompt?: string;
  actorDialogue?: string;
  
  useUserImage: boolean;
  userImageIndex?: number;
  
  cameraMovement: 'static' | 'slow_zoom' | 'pan_right' | 'pan_left' | 'dolly_in' | 'dolly_out';
  transition: 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe';
  
  textOverlay?: string;
  textStyle: 'bold' | 'elegant' | 'modern' | 'minimal' | 'playful';
  textPosition: 'center' | 'bottom' | 'top' | 'left' | 'right';
  
  generatedVideoUrl?: string;
  generatedImageUrl?: string;
  
  startTime: number;
  endTime: number;
}

// Simulación de base de datos en memoria para desarrollo
export class MarketingVideoStore {
  private static videos: Map<string, IMarketingVideo> = new Map();

  static save(video: IMarketingVideo): IMarketingVideo {
    const id = Date.now().toString();
    this.videos.set(id, { ...video, updatedAt: new Date() });
    return video;
  }

  static findByUserId(userId: string): IMarketingVideo[] {
    return Array.from(this.videos.values()).filter(v => v.userId === userId);
  }

  static findById(id: string): IMarketingVideo | undefined {
    return this.videos.get(id);
  }
}
