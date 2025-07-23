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
  overlays?: Array<{ path: string; x?: number; y?: number; opacity?: number }>;
  luts?: Array<{ path: string; intensity?: number }>;
  soundCue?: string;
    t: number;
    faseNarrativa?: string;
    visual?: string;
    backgroundPrompt?: string;
    actorPrompt?: string;
    camera?: {
        shot?: string;
        movement?: string;
    } | string;
    movement?: string;
    lighting?: string;
    colorPalette?: string;
    composition?: string;
    atmosphere?: string;
    effects?: string;
    variedadVisual?: string;
    continuidad?: string;
    efectosAvanzados?: string;
    musicaAvanzada?: string;
    emotion?: string;
  music?: MusicSpec;
    multitude?: string;
    arcoPersonaje?: string;
    simbolismo?: string;
    dialogo?: string;
    accionEncadenada?: string;
    ubicacion?: string;
    voz?: string;
    lipSync?: string;
    parametrosVoz?: string;
    imagenUsuario?: string;
    productoReferencia?: string;
    localReferencia?: string;
    presentador?: string;
    miradaACamara?: string;
    expresionFacial?: string;
    textoNoticia?: string;
    capasVisuales?: string;
    filtros?: string;
    subtitulos?: string;
    transicionesEditor?: string;
    resolucion?: string;
    formato?: string;
    marcaAgua?: string;
    plan?: string;
    limitesPlan?: string;
    metricaDuracion?: string;
    metricaEstilo?: string;
    metricaPopularidad?: string;
    blenderHook?: string;
    loraCustom?: string;
    controlTotal?: string;
    detalleGestual?: string;
    reaccionEmocional?: string;
    cambioLuz?: string;
    expresionFacialActor?: string;
    ritmoEdicion?: string;
    duracionPlano?: string;
    tipoTransicion?: string;
    convencionGenero?: string;
    feedbackUsuario?: string;
    idioma?: string;
    region?: string;
    localizacionDialogo?: string;
    animacionTexto?: string;
    efectoEntrada?: string;
    layoutSubtitulos?: string;
    mezclaAudio?: string;
    balanceSonido?: string;
    efectoSonoro?: string;
    perfilUsuario?: string;
    validacionFinal?: string;
    // Nuevos campos avanzados para coherencia, dirección de arte y edición
    lente?: string;
    texturaRealismo?: string;
    direccionArte?: string;
    movimientoCamara?: string;
    animacionSutil?: string;
    climaAtmosferico?: string;
    corteEdicion?: string;
    sonidoAmbiente?: string;
    microaccion?: string;
    motivoVisual?: string;
}

export interface VideoPlan {
  transition?: string;
  ambientSound?: string;
  soundEffects?: string[];
  voiceLine?: string;
  storyboard?: boolean;
    timeline: TimelineSecond[];
    metadata: {
      mode: string;
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

  // ...existing code...
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
