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
  assets?: string[];         // props/elementos visuales (opcional)
  highlight: boolean;        // resaltar este segundo
  sceneMood?: string;        // estado de ánimo de la escena
  transition: string;        // tipo de transición
  // Extensiones pipeline avanzado:
  lora?: string | null;
  loraScale?: number;
  seed?: number | string;
  modelOrder?: string[];
}

/* → Plan completo que genera llmService */

// Contrato avanzado para VideoPlan (pipeline v7+)
export interface VideoPlan {
  timeline: TimelineSecond[];  // length === duration
  metadata: {
    mode: string;              // modo de renderizado
    visualStyle: string;       // estilo visual
    duration: AllowedDuration; // duración del video
    modelOrder?: string[];     // orden de preferencia de modelos IA
    lora?: string | null;      // url o id de LoRA a usar (opcional)
    loraScale?: number;        // escala LoRA (opcional)
    seed?: number | string;    // semilla global (opcional)
    characters?: CharacterVoiceSpec[];
    music?: MusicSpec | string;
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
