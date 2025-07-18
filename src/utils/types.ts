/* =========================================================================
 * Storyteller AI · Contract Types v5
 * =========================================================================
 *  ❖ RenderRequest  →  lo que llega desde Bubble / API
 *  ❖ VideoPlan      →  guion detallado que devuelve llmService
 *  ❖ TimelineSecond →  detalle frame-a-frame (1 s) para todo el pipeline
 *  ❖ Aux interfaces →  especificaciones de audio, estilo, etc.
 * ------------------------------------------------------------------------- */

/* ´Duración` solo puede ser 10,15,30,45,60 s */
export type AllowedDuration = 10 | 15 | 30 | 45 | 60;

/* → Petición de render que envía el front */
export interface RenderRequest {
  prompt: string;           // idea general (“Tacos voladores…”)
  mode:   string;          // modo de renderizado
  visualStyle: string;     // estilo visual
  duration: AllowedDuration; // duración del video

  audio?: AudioSpec;       // especificaciones de audio (opcional)
}

/* → Especificación de audio (opcional) */
export interface AudioSpec {
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

/* -------------------------------------------------------------------------
 * TimelineSecond – unidad mínima de planificación (por segundo)
 * ----------------------------------------------------------------------- */
export interface TimelineSecond {
  t: number;                 // segundo 0…N-1
  scene?: number;            // número de escena/toma (opcional)
  sceneStart?: boolean;      // true si es el inicio de una nueva escena
  visual: string;            // qué se ve exactamente (descripción)
  camera: CameraSpec;        // Unificar tipo como CameraSpec
  emotion: string;           // sentimiento dominante
  dialogue?: string;         // texto en pantalla (≤15 palabras)
  voiceLine?: string;        // narración VO en ese segundo
  soundCue: string;          // cue de sonido
  effects?: string;          // efectos especiales
  /**
   * SFX avanzados: lista de efectos de sonido a superponer en este segundo
   */
  sfx?: Array<{
    name: string; // ejemplo: "pasos", "viento", "fuego"
    file: string; // ruta o id del asset
    volume?: number; // 0-1
    offset?: number; // ms dentro del segundo
    duration?: number; // ms
  }>;
  assets?: string[];         // props/elementos visuales (opcional)
  highlight: boolean;        // resaltar este segundo
  sceneMood?: string;        // estado de ánimo de la escena
  transition: string;        // tipo de transición
  // Extensiones pipeline avanzado:
  /**
   * Tipo de lip-sync a aplicar en la escena.
   * 'none' = no aplicar, 'sadtalker' = imagen animada, 'wav2lip' = video con labios sincronizados
   */
  lipSyncType?: 'none' | 'sadtalker' | 'wav2lip';
  /**
   * Acting/emoción dominante para la animación facial.
   * Ej: 'neutral', 'happy', 'sad', 'angry', 'surprised', etc.
   */
  acting?: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fear' | 'disgust' | 'contempt' | 'excited';
  /**
   * Tipo de contenido base: 'image' (LoRA, SDXL, etc.) o 'video' (Runway, AnimateDiff, etc.)
   */
  contentType?: 'image' | 'video';
  /**
   * Estilo visual de la escena: 'cinematic', 'realistic', 'anime', 'cartoon'
   */
  style?: 'cinematic' | 'realistic' | 'anime' | 'cartoon';
  lora?: string | null;
  loraScale?: number;
  seed?: number | string;
  modelOrder?: string[];
  /**
   * Overlays visuales (PNG, SVG, etc.) a aplicar en este segundo
   */
  overlays?: Array<{
    path: string;
    x?: number;
    y?: number;
    opacity?: number;
  }>;
  /**
   * LUTs de color a aplicar en este segundo
   */
  luts?: Array<{
    path: string;
    intensity?: number;
  }>;
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
