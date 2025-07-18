
// Storyteller AI · Contract Types (LIMPIO)



export interface RenderRequest {
  prompt: string;
  mode: string;
  visualStyle: string;
  duration: AllowedDuration;
  metadata?: any;
  demoMode?: boolean;
}

export interface AudioSpec {
  voice?: VoiceSpec;
  music?: MusicSpec;
  characters?: CharacterVoiceSpec[];
}

export interface VoiceSpec {
  id: string;
  name: string;
}

export interface MusicSpec {
  mood: string;
  trackId: string;
}

export interface TimelineSecond {
  t: number;
  scene?: number;
  sceneStart?: boolean;
  visual: string;
  camera: CameraSpec;
  emotion: string;
  dialogue?: string;
  voiceLine?: string;
  soundCue: string;
  effects?: string;
  sfx?: Array<{
    name: string;
    file: string;
    volume?: number;
    offset?: number;
    duration?: number;
  }>;
  assets?: string[];
  highlight: boolean;
  sceneMood?: string;
  transition: string;
  lipSyncType?: 'none' | 'sadtalker' | 'wav2lip';
  acting?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fear' | 'disgust' | 'contempt' | 'excited';
  contentType?: 'image' | 'video';
  style?: 'cinematic' | 'realistic' | 'anime' | 'cartoon';
  lora?: string | null;
  backgroundLora?: string | null;
  loraScale?: number;
  seed?: number | string;
  modelOrder?: string[];
  overlays?: Array<{
    path: string;
    x?: number;
    y?: number;
    opacity?: number;
  }>;
  luts?: Array<{
    path: string;
    intensity?: number;
  }>;
}

export interface VideoPlan {
  timeline: TimelineSecond[];
  metadata: {
    mode: string;
    visualStyle: string;
    duration: AllowedDuration;
    modelOrder?: string[];
    characterLora?: string | null;
    backgroundLora?: string | null;
    lora?: string | null;
    loraScale?: number;
    seed?: number | string;
    characters?: CharacterVoiceSpec[];
    music?: MusicSpec | string;
    overlays?: Array<{
      path: string;
      x?: number;
      y?: number;
      opacity?: number;
    }>;
    luts?: Array<{
      path: string;
      intensity?: number;
    }>;
    sfx?: Array<{
      name: string;
      file: string;
      volume?: number;
      start?: number;
      end?: number;
    }>;
    scenes?: Array<{
      scene: number;
      start: number;
      end: number;
      description: string;
      lora?: string | null;
      loraScale?: number;
      seed?: number | string;
    }>;
    referenceImages?: string[];
    demoMode?: boolean;
    [key: string]: any;
  };
  storyboard?: string[];
}

export interface RenderResponse {
  url: string;
  storyboardUrls: string[];
}

export interface CameraSpec {
  shot: string;
  movement: string;
}

export interface CharacterVoiceSpec {
  name: string;
  voiceId: string;
  gender: 'male' | 'female';
  age: number;
  language: string;
}

export interface Metadata {
  characters?: CharacterVoiceSpec[];
}



/* ´Duración` solo puede ser 10,15,30,45,60 s */
export type AllowedDuration = 10 | 15 | 30 | 45 | 60;

/* → Petición de render que envía el front */
export interface TimelineSecond {

  voice?: VoiceSpec;      // narrador / diálogo
  music?: MusicSpec;      // mood + exact timing
  characters?: CharacterVoiceSpec[]; // Agregado para incluir personajes
}

/* → Especificación de voz (opcional) */
export interface VoiceSpec {
  id: string;               // identificador de la voz
  name: string;             // nombre (“Ryuu”)
}

/* → Qué música queremos y si debe durar EXACTO */
export interface MusicSpec {
  mood: string;              // “orchestral-adventure”
  trackId: string;           // identificador de la pista musical
}


/* → Plan completo que genera llmService */

// Contrato avanzado para VideoPlan (pipeline v7+)
export interface VideoPlan {
  /**
   * Timeline enriquecido: cada segundo puede tener lipSyncType, acting, contentType y style
   */
  timeline: TimelineSecond[];  // length === duration
  metadata: {
    mode: string;              // modo de renderizado
    visualStyle: string;       // estilo visual
    duration: AllowedDuration; // duración del video
    modelOrder?: string[];     // orden de preferencia de modelos IA
    /**
     * LoRA explícitos para personaje y fondo
     */
    characterLora?: string | null;
    backgroundLora?: string | null;
    lora?: string | null;      // compatibilidad
    loraScale?: number;
    seed?: number | string;
    characters?: CharacterVoiceSpec[];
    music?: MusicSpec | string;
    /**
     * Overlays y LUTs globales para todo el video
     */
    overlays?: Array<{
      path: string;
      x?: number;
      y?: number;
      opacity?: number;
    }>;
    luts?: Array<{
      path: string;
      intensity?: number;
    }>;
    /**
     * SFX globales (ej: viento, ambiente)
     */
    sfx?: Array<{
      name: string;
      file: string;
      volume?: number;
      start?: number;
      end?: number;
    }>;
    scenes?: Array<{
      scene: number;
      start: number;
      end: number;
      description: string;
      lora?: string | null;
      loraScale?: number;
      seed?: number | string;
    }>;
    referenceImages?: string[];
    /**
     * Modo demo: fuerza el uso de los mismos assets y guarda todos los outputs
     */
    demoMode?: boolean;
    [key: string]: any; // para extensibilidad futura
  };
  storyboard?: string[];
}

/* → Respuesta final del backend */
export interface RenderResponse {
  url: string;               // MP4 1080p60 (o HLS index)
  storyboardUrls: string[];  // miniaturas/frames estáticos
}

/* → Especificación de cámara (opcional) */
export interface CameraSpec {
  shot: string;              // tipo de plano (“close-up”, “long shot”, etc.)
  movement: string;          // movimiento de cámara (“pan”, “tilt”, “dolly”, etc.)
}

/* → Especificación de voz de personaje (opcional) */
export interface CharacterVoiceSpec {
  name: string;              // nombre del personaje
  voiceId: string;           // identificador de la voz
  gender: 'male' | 'female'; // género del personaje
  age: number;               // edad del personaje
  language: string;          // idioma del personaje
}

/* → Metadatos adicionales para el VideoPlan */
export interface Metadata {
  characters?: CharacterVoiceSpec[]; // Lista de personajes con especificaciones de voz
}

/* → Clip - segmento de video */
export type Clip = {
  id: string;
  url: string;
  duration: number;
};
