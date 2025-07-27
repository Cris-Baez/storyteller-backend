// Storyteller AI · Contract Types (LIMPIO Y UNIFICADO)
// Actualizado para Sistema de Cerebros Cinematográficos

export type AllowedDuration = 5 | 8 | 10 | 12 | 15 | 20 | 25 | 30 | 45 | 60;
export type EstiloVisual = 'cinematic' | 'anime' | 'cartoon' | 'commercial';

export interface RenderRequest {
  prompt: string;
  visualStyle: EstiloVisual;
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

// TimelineSecond - Unificado con Sistema de Cerebros
export interface TimelineSecond {
  segundo: number;                    // Tiempo en segundos (alineado con cerebros)
  t?: number;                         // Backward compatibility
  
  // Configuración visual
  visual?: string;
  backgroundPrompt?: string;
  actorPrompt?: string;
  fondo?: {
    ruta: string;
    nombre: string;
    ambiente?: string;
    epoca?: string;
  };
  actor?: {
    archivo: string;
    tipo: string;
    voz?: string;
    emocion?: string;
  };
  
  // Configuración de cámara (unificada)
  camara?: {
    shot: string;
    movement: string;
    angulo?: string;
    iluminacion?: string;
    transicion?: string;
  };
  camera?: { shot?: string; movement?: string } | string; // Backward compatibility
  movement?: string;
  lighting?: string;
  
  // Configuración de sonido
  sonido?: {
    musica: string;
    efectos: string[];
    ambiente?: string;
    lipSync?: string;
    requiereVoz?: boolean;
    tipoVoz?: string;
    intensidad?: 'baja' | 'media' | 'alta';
  };
  music?: MusicSpec;
  dialogo?: string;
  lipSync?: string;
  soundCue?: string;
  
  // Configuración de edición
  edicion?: {
    duracionEscena: number;
    carryover: boolean;
    audioCarryover?: boolean;
    tipoCorte: string;
    ritmo?: 'lento' | 'medio' | 'rápido';
    continuidad?: boolean;
  };
  transition?: string;
  
  // Contexto narrativo (del sistema de cerebros)
  segmento?: string;
  momentoNarrativo?: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  esEmocional?: boolean;
  tono?: string;
  narrativa?: any;
  
  // Propiedades visuales adicionales
  colorPalette?: string;
  composition?: string;
  atmosphere?: string;
  effects?: string;
  emotion?: string;
  overlays?: Array<{ path: string; x?: number; y?: number; opacity?: number }>;
  luts?: Array<{ path: string; intensity?: number }>;
  
  [key: string]: any;
}

// VideoPlan - Unificado con Sistema de Cerebros
export interface VideoPlan {
  visualStyle?: EstiloVisual;
  timeline: TimelineSecond[];
  metadata: {
    visualStyle: EstiloVisual;
    duration: AllowedDuration;
    prompt?: string;
    
    // Metadata del sistema de cerebros
    duracionTotal?: number;
    actos?: number;
    momentosEmocionales?: number[];
    puntosClimax?: number[];
    configuracionNarrativa?: any;
    estiloVisual?: EstiloVisual;
    version?: string;
    tiempoGeneracion?: number;
    
    // Metadata técnico existente
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
  
  // Configuración global del sistema de cerebros
  configuracionGlobal?: {
    aspectRatio: string;
    frameRate: number;
    resolucion: string;
    colorGrading: string;
    filtrosGlobales: string[];
    marcaAgua: boolean;
  };
  
  restricciones?: any;
  [key: string]: any;
}

export interface RenderResponse {
  url: string;
  storyboardUrls: string[];
}

// Especificación de cámara unificada
export interface CameraSpec {
  shot: string;              // tipo de plano ("close-up", "medium", "wide", etc.)
  movement: string;          // movimiento ("static", "pan", "tilt", "dolly", etc.)
  angulo?: string;           // ángulo de cámara ("frontal", "lateral", "alto", etc.)
  iluminacion?: string;      // configuración de iluminación
  transicion?: string;       // tipo de transición
}

// Metadatos adicionales
export interface Metadata {
  characters?: CharacterVoiceSpec[];
  configuracionCerebros?: any;
}

// Sistema de Cerebros - Request/Response  
export interface RequestGeneracion {
  prompt: string;
  duracion: number;
  estilo: EstiloVisual;
  configuracion?: any;
}

export interface ResponseGeneracion {
  videoPlan: TimelineSecond[];
  metadata: any;
  configuracion: any;
  restricciones: any;
  success: boolean;
  error?: string;
  tiempoGeneracion: number;
}

// Especificación de voz (backward compatibility)
export interface VoiceSpec {
  id: string;               // identificador de la voz
  name: string;             // nombre ("Ryuu")
}

// Clip - segmento de video
export type Clip = {
  id: string;
  url: string;
  duration: number;
};
