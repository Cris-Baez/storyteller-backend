import { Schema, model, Document } from 'mongoose';

export interface IMarketingVideo extends Document {
  userId: string;
  title: string;
  description: string;
  businessType: 'restaurant' | 'spa' | 'retail' | 'fitness' | 'beauty' | 'tech' | 'services' | 'other';
  videoType: 'promotional' | 'brand_story' | 'product_showcase' | 'testimonial' | 'event_announcement' | 'social_media';
  style: 'professional' | 'casual' | 'energetic' | 'emotional' | 'luxury' | 'minimalist';
  duration: 15 | 30 | 45 | 60;
  
  // Input del usuario
  userImages: string[];
  userPrompt?: string;
  brandName?: string;
  callToAction?: string;
  
  // Configuración de video
  useAIActor: boolean;
  actorType?: 'young_male' | 'young_female' | 'mature_male' | 'mature_female' | 'professional' | 'casual';
  voiceEnabled: boolean;
  voiceType?: 'male' | 'female' | 'neutral';
  musicStyle: 'upbeat' | 'corporate' | 'emotional' | 'energetic' | 'minimal' | 'none';
  
  // Contenido generado
  aiGeneratedScript?: string;
  marketingTomas: IMarketingToma[];
  
  // Assets generados
  voiceAudioUrl?: string;
  backgroundMusicUrl?: string;
  soundEffectsUrls?: string[];
  finalVideoUrl?: string;
  thumbnailUrl?: string;
  
  // Estado y configuración  
  status: 'creado' | 'en_cola' | 'procesando_tomas' | 'procesando_audio' | 'montando' | 'renderizando' | 'subiendo' | 'completado' | 'fallido';
  isAgentMode: boolean; // Si fue generado automáticamente
  scheduledFor?: Date;
  
  // Modo agente
  agentSettings?: {
    weeklyFrequency: number;
    preferredDays: number[];
    autoPublish: boolean;
    learningEnabled: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarketingToma {
  index: number;
  type: 'hero_shot' | 'product_closeup' | 'lifestyle' | 'testimonial' | 'call_to_action' | 'brand_reveal';
  description: string;
  visualPrompt: string;
  duration: number;
  
  // Si usa actor IA
  hasActor: boolean;
  actorPrompt?: string;
  actorDialogue?: string;
  
  // Si usa imágenes del usuario
  useUserImage: boolean;
  userImageIndex?: number;
  
  // Efectos y transiciones
  cameraMovement: 'static' | 'slow_zoom' | 'pan_right' | 'pan_left' | 'dolly_in' | 'dolly_out';
  transition: 'cut' | 'fade' | 'slide' | 'zoom' | 'wipe';
  
  // Text overlay
  textOverlay?: string;
  textStyle: 'bold' | 'elegant' | 'modern' | 'minimal' | 'playful';
  textPosition: 'center' | 'bottom' | 'top' | 'left' | 'right';
  
  // Assets generados
  generatedVideoUrl?: string;
  generatedImageUrl?: string;
  
  startTime: number;
  endTime: number;
}

const marketingTomaSchema = new Schema<IMarketingToma>({
  index: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['hero_shot', 'product_closeup', 'lifestyle', 'testimonial', 'call_to_action', 'brand_reveal'],
    required: true 
  },
  description: { type: String, required: true },
  visualPrompt: { type: String, required: true },
  duration: { type: Number, required: true },
  
  hasActor: { type: Boolean, default: false },
  actorPrompt: { type: String },
  actorDialogue: { type: String },
  
  useUserImage: { type: Boolean, default: false },
  userImageIndex: { type: Number },
  
  cameraMovement: { 
    type: String, 
    enum: ['static', 'slow_zoom', 'pan_right', 'pan_left', 'dolly_in', 'dolly_out'],
    default: 'static'
  },
  transition: { 
    type: String, 
    enum: ['cut', 'fade', 'slide', 'zoom', 'wipe'],
    default: 'cut'
  },
  
  textOverlay: { type: String },
  textStyle: { 
    type: String, 
    enum: ['bold', 'elegant', 'modern', 'minimal', 'playful'],
    default: 'modern'
  },
  textPosition: { 
    type: String, 
    enum: ['center', 'bottom', 'top', 'left', 'right'],
    default: 'center'
  },
  
  generatedVideoUrl: { type: String },
  generatedImageUrl: { type: String },
  
  startTime: { type: Number, required: true },
  endTime: { type: Number, required: true }
});

const marketingVideoSchema = new Schema<IMarketingVideo>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  businessType: { 
    type: String, 
    enum: ['restaurant', 'spa', 'retail', 'fitness', 'beauty', 'tech', 'services', 'other'],
    required: true 
  },
  videoType: { 
    type: String, 
    enum: ['promotional', 'brand_story', 'product_showcase', 'testimonial', 'event_announcement', 'social_media'],
    required: true 
  },
  style: { 
    type: String, 
    enum: ['professional', 'casual', 'energetic', 'emotional', 'luxury', 'minimalist'],
    required: true 
  },
  duration: { 
    type: Number, 
    enum: [15, 30, 45, 60],
    required: true 
  },
  
  userImages: [{ type: String, required: true }],
  userPrompt: { type: String },
  brandName: { type: String },
  callToAction: { type: String },
  
  useAIActor: { type: Boolean, default: false },
  actorType: { 
    type: String, 
    enum: ['young_male', 'young_female', 'mature_male', 'mature_female', 'professional', 'casual']
  },
  voiceEnabled: { type: Boolean, default: true },
  voiceType: { 
    type: String, 
    enum: ['male', 'female', 'neutral'],
    default: 'neutral'
  },
  musicStyle: { 
    type: String, 
    enum: ['upbeat', 'corporate', 'emotional', 'energetic', 'minimal', 'none'],
    default: 'upbeat'
  },
  
  aiGeneratedScript: { type: String },
  marketingTomas: [marketingTomaSchema],
  
  voiceAudioUrl: { type: String },
  backgroundMusicUrl: { type: String },
  soundEffectsUrls: [{ type: String }],
  finalVideoUrl: { type: String },
  thumbnailUrl: { type: String },
  
  status: { 
    type: String, 
    enum: ['creado', 'en_cola', 'procesando_tomas', 'procesando_audio', 'montando', 'renderizando', 'subiendo', 'completado', 'fallido'],
    default: 'creado'
  },
  isAgentMode: { type: Boolean, default: false },
  scheduledFor: { type: Date },
  
  agentSettings: {
    weeklyFrequency: { type: Number, min: 1, max: 7 },
    preferredDays: [{ type: Number, min: 0, max: 6 }],
    autoPublish: { type: Boolean, default: false },
    learningEnabled: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  collection: 'marketing_videos'
});

// Índices para optimización
marketingVideoSchema.index({ userId: 1, createdAt: -1 });
marketingVideoSchema.index({ status: 1 });
marketingVideoSchema.index({ isAgentMode: 1, scheduledFor: 1 });

export const MarketingVideo = model<IMarketingVideo>('MarketingVideo', marketingVideoSchema);
