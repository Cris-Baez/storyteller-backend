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
  mode:   'cinematic' | 'videogame' | 'anime' | 'cartoon' | 'story' | 'commercial';
  visualStyle: 'realistic' | 'anime' | 'cartoon';
  duration: AllowedDuration;

  audio?: {
    voice?: VoiceSpec;      // narrador / diálogo
    music?: MusicSpec;      // mood + exact timing
  };
}

/* → Especificación de voz (opcional) */
export interface VoiceSpec {
  character: string;         // nombre (“Ryuu”)
  gender: 'male' | 'female';
  age: number;               // años
  language: string;          // “es-MX”, “en-US”, etc.
}

/* → Qué música queremos y si debe durar EXACTO */
export interface MusicSpec {
  mood: string;              // “orchestral-adventure”
  exactDuration?: boolean;   // default = false → fade-out
}

/* -------------------------------------------------------------------------
 * TimelineSecond – unidad mínima de planificación (por segundo)
 * ----------------------------------------------------------------------- */
export interface TimelineSecond {
  t: number;                 // segundo 0…N-1
  visual: string;            // qué se ve exactamente (descripción)
  camera: CameraSpec;        // Unificar tipo como CameraSpec
  emotion: string;           // sentimiento dominante
  dialogue?: string;         // texto en pantalla (≤15 palabras)
  voiceLine?: string;        // narración VO en ese segundo
  soundCue: 'quiet' | 'rise' | 'climax' | 'fade';    // volumen música

  highlight?: boolean;
  sceneMood?: string;
  transition?: string;
  effects?: string[];
}

/* → Plan completo que genera llmService */
export interface VideoPlan {
  timeline: TimelineSecond[];  // length === duration
  metadata: {
    mode: RenderRequest['mode'];
    visualStyle: RenderRequest['visualStyle'];
    duration: AllowedDuration;
    voice?: VoiceSpec;
    music?: MusicSpec;
    characters?: CharacterVoiceSpec[]; // Agregar personajes al metadata
  };
  storyboard?: string[]; // Agregar propiedad para imágenes generadas por storyboardService
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
  gender?: 'male' | 'female'; // género del personaje
  age?: number;              // edad del personaje
  language?: string;         // idioma del personaje
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
