
// Storyteller AI · Contract Types (LIMPIO Y UNIFICADO)

export type AllowedDuration = 10 | 15 | 30 | 45 | 60;

export interface RenderRequest {
  prompt: string;
  visualStyle: string;
  duration: AllowedDuration;
  metadata?: any;
  demoMode?: boolean;
  previewMode?: boolean;
}

export interface MusicSpec {
  mood: string;
  trackId: string;
}

export interface CharacterVoiceSpec {
  name: string;
  voiceId: string;
  gender: 'male' | 'female';
  age: number;
  language: string;
}

export interface TimelineSecond {
  t: number;
  visual?: string;
  backgroundPrompt?: string;
  actorPrompt?: string;
  transition?: string;
  camera?: { shot?: string; movement?: string } | string;
  movement?: string;
  lighting?: string;
  colorPalette?: string;
  composition?: string;
  atmosphere?: string;
  effects?: string;
  emotion?: string;
  music?: MusicSpec;
  dialogo?: string;
  lipSync?: string;
  overlays?: Array<{ path: string; x?: number; y?: number; opacity?: number }>;
  luts?: Array<{ path: string; intensity?: number }>;
  soundCue?: string;
  [key: string]: any;
}

export interface VideoPlan {
  visualStyle?: string;
  timeline: TimelineSecond[];
  metadata: {
    visualStyle: string;
    duration: AllowedDuration;
    prompt?: string;
    modelOrder?: string[];
    characterLora?: string | null;
    backgroundLora?: string | null;
    lora?: string | null;
    loraScale?: number;
    seed?: number | string;
    characters?: CharacterVoiceSpec[];
    music?: MusicSpec;
    demoMode?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface RenderResponse {
  url: string;
  storyboardUrls: string[];
}

export interface CameraSpec {
  shot: string;
  movement: string;
}

export interface Metadata {
  characters?: CharacterVoiceSpec[];
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
  // ...existing code...
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
