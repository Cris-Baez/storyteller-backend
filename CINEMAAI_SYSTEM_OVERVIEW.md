# 🎬 CINEMAAI SYSTEM OVERVIEW - Documentación Técnica Completa

**Versión:** 1.0.0  
**Fecha:** 31 de julio de 2025  
**Autor:** Documentación Técnica CinemaAI Backend  
**Audiencia:** Ingenieros de Software y Desarrolladores

---

## 📋 TABLA DE CONTENIDOS

1. [Visión General del Sistema](#visión-general-del-sistema)
2. [Arquitectura Principal](#arquitectura-principal)
3. [Flujo de Ejecución Completo](#flujo-de-ejecución-completo)
4. [Sistema de Estilos Visuales](#sistema-de-estilos-visuales)
5. [Sistema de Cerebros Cinematográficos](#sistema-de-cerebros-cinematográficos)
6. [Gestión de Assets](#gestión-de-assets)
7. [Pipeline de Renderizado](#pipeline-de-renderizado)
8. [Servicios de Audio](#servicios-de-audio)
9. [Servicios de Video](#servicios-de-video)
10. [Sistema de Jobs](#sistema-de-jobs)
11. [APIs y Rutas](#apis-y-rutas)
12. [Análisis de Problemas y Mejoras](#análisis-de-problemas-y-mejoras)

---

## 1. VISIÓN GENERAL DEL SISTEMA

CinemaAI es un backend Node.js/TypeScript que genera videos cinematográficos automáticamente a partir de prompts de texto. El sistema utiliza múltiples servicios de IA para crear narrativas, seleccionar assets visuales, generar audio sincronizado y ensamblar el video final.

### Tecnologías Principales

- **Runtime:** Node.js 16+ con TypeScript
- **Framework:** Express.js con middlewares de seguridad
- **Base de Datos:** Prisma ORM (configurado pero no utilizado activamente)
- **Storage:** Google Cloud Storage (CDN)
- **IA Externa:** 
  - OpenRouter/OpenAI (narrativa y planificación)
  - Kling AI via Fal.ai (generación de video)
  - Murf.ai (síntesis de voz)
  - Freesound (música de fondo)
  - SadTalker/Wav2Lip (sincronización labial)

### Directorio Principal

```
storyteller-backend/
├── src/
│   ├── index.ts                 # Punto de entrada del servidor
│   ├── routes/                  # Endpoints HTTP
│   ├── pipelines/               # Pipeline principal de renderizado
│   ├── services/                # Servicios especializados
│   ├── jobs/                    # Sistema de cola de trabajos
│   ├── types/                   # Definiciones de tipos
│   ├── utils/                   # Utilidades compartidas
│   └── config/                  # Configuraciones
├── assets/                      # Assets locales (imágenes)
├── templates/                   # Plantillas de prompts
├── tests/                       # Scripts de prueba
└── dist/                        # Código compilado
```

---

## 2. ARQUITECTURA PRINCIPAL

### Patrón Arquitectónico

CinemaAI sigue un patrón **Pipeline + Microservicios** donde:

1. **Pipeline Central:** `renderPipeline.ts` orquesta todo el proceso
2. **Dispatcher:** Enruta solicitudes a equipos especializados por estilo
3. **Cerebros Cinematográficos:** Sistemas de IA especializados por estilo visual
4. **Servicios:** Componentes especializados (audio, video, assets, etc.)
5. **Jobs:** Sistema asíncrono para trabajos de larga duración

### Diagrama de Componentes

```
[Cliente HTTP] 
    ↓
[Express Routes] → [Validación Zod] → [Job Queue]
    ↓
[Render Pipeline] → [Sistema de Cerebros] → [Dispatcher]
    ↓                      ↓
[Asset Manager]    [Cerebros por Estilo]
    ↓                      ↓
[Servicios Audio]  [Director → Arte → Actores → Fotografía → Sonido → Editor]
    ↓                      ↓
[Servicios Video]  [Timeline Cinematográfico]
    ↓
[FFmpeg Assembly] → [CDN Upload] → [Respuesta Final]
```

---

## 3. FLUJO DE EJECUCIÓN COMPLETO

### Paso a Paso desde Request hasta Video

#### FASE 1: Recepción y Validación (routes/render.ts)

```typescript
POST /api/render
{
  "prompt": "Un joven samurái camina hacia un templo al atardecer",
  "visualStyle": "cinematic", 
  "duration": 15
}
```

**Procesos:**

1. **Middleware de Seguridad:** Helmet, CORS, Rate Limiting
2. **Validación Zod:** Esquema `renderRequestSchema`
3. **Sanitización:** Limpieza de caracteres especiales en prompt
4. **Normalización de Estilo:** Conversión de alias (`realistic` → `cinematic`)
5. **Creación de Job:** UUID único y encolado asíncrono

**Resultado:** Job ID retornado inmediatamente (HTTP 202)

#### FASE 2: Sistema de Jobs (jobs/jobQueue.ts)

```typescript
const jobStates: Record<string, JobState> = {};
const jobResults: Record<string, any> = {};
```

**Procesos:**

1. **Inicialización:** Estado `pending` con metadata
2. **Ejecución Asíncrona:** Llamada a `renderCinemaAI()`
3. **Tracking de Progreso:** 7 pasos monitoreados
4. **Manejo de Errores:** Estados `error` con mensajes detallados
5. **Almacenamiento:** Resultados persistidos en memoria

#### FASE 3: Pipeline Principal (pipelines/renderPipeline.ts)

##### Subpaso 3.1: Orquestación de Cerebros

```typescript
const planCinematografico = await dispatchCerebros({
  prompt,
  duracion: duration,
  estilo: visualStyle
});
```

**Cerebros Invocados según Estilo:**
- `cinematic` → `orquestarEquipoCinematico()`
- `anime` → `orquestarEquipoAnime()`
- `cartoon` → `orquestarEquipoCartoon()`
- `commercial` → `orquestarEquipoCommercial()`

##### Subpaso 3.2: Generación de Timeline

El dispatcher retorna:

```typescript
interface ResponseGeneracion {
  videoPlan: TimelineSecond[];      // Timeline segundo a segundo
  tomasReales: TomaCinematograficaPlan[]; // Tomas cinematográficas 
  metadata: MetadataCinematica;     // Información narrativa
  configuracion: ConfiguracionGlobalCinematica;
  restricciones: any;
}
```

##### Subpaso 3.3: Procesamiento de Tomas

Para cada `TomaCinematograficaPlan`:

1. **Selección de Assets:**
   - Fondo: AssetManager filtra por estilo/contexto
   - Actor: Selección inteligente basada en descripción
   - Auto-corrección: Fallbacks si assets no encontrados

2. **Generación de Video (Kling AI):**
   ```typescript
   await generateKlingClip({
     prompt: tomaDescripcion,
     input_image_urls: [fondoUrl, actorUrl],
     duration: tomaDuracion
   });
   ```

3. **Procesamiento de Audio:**
   ```typescript
   const audio = await generateUnifiedAudioForPipeline({
     toma: tomaIndex,
     descripcion: tomaDescripcion,
     duracion: tomaDuracion,
     vozConfig: metadata.voz,
     musicaConfig: metadata.musica
   });
   ```

4. **Sincronización Labial:**
   - `cinematic` → Wav2Lip (realista)
   - `anime/cartoon` → SadTalker (animado)

##### Subpaso 3.4: Ensamblaje Final

```typescript
const videoFinal = await assembleVideo({
  clips: videosGenerados,
  audios: audiosGenerados,
  duracionTotal: duration,
  metadata: metadataFinal
});
```

##### Subpaso 3.5: Upload y Finalización

```typescript
const urlFinal = await uploadToCDN(videoFinal);
```

---

## 4. SISTEMA DE ESTILOS VISUALES

### Tipos Unificados (types/estilos.ts)

#### Estilos Principales

```typescript
type EstiloVisualPrincipal = 
  | 'cinematic'     // Cinematográfico profesional
  | 'anime'         // Anime/manga japonés  
  | 'cartoon'       // Cartoon occidental
  | 'commercial';   // Comercial/publicitario
```

#### Sistema de Alias

```typescript
const MAPEO_ESTILOS = {
  'realistic': 'cinematic',
  'realista': 'cinematic', 
  'comic': 'cartoon',
  'comercial': 'commercial'
};
```

#### Configuración por Estilo

```typescript
const CONFIGURACION_ESTILOS = {
  cinematic: {
    duracionMaximaToma: 10,
    usaLipSync: true,
    tecnologiaLipSync: 'wav2lip'
  },
  anime: {
    duracionMaximaToma: 8,
    usaLipSync: true,
    tecnologiaLipSync: 'sadtalker'
  },
  cartoon: {
    duracionMaximaToma: 6,
    usaLipSync: true,
    tecnologiaLipSync: 'sadtalker'  
  },
  commercial: {
    duracionMaximaToma: 5,
    usaLipSync: false,
    tecnologiaLipSync: null
  }
};
```

---

## 5. SISTEMA DE CEREBROS CINEMATOGRÁFICOS

### Arquitectura de Cerebros

El sistema implementa **equipos especializados de IA** que trabajan como un estudio cinematográfico virtual.

#### Dispatcher (services/llmService/dispatcher.ts)

**Función:** Enrutador principal que selecciona el equipo especializado

```typescript
export async function dispatchCerebros(request: RequestGeneracion) {
  switch (request.estilo) {
    case 'cinematic':
      return await orquestarEquipoCinematico(prompt, duracion);
    case 'anime': 
      return await orquestarEquipoAnime(prompt, duracion);
    // ... otros estilos
  }
}
```

#### Estructura de un Equipo de Cerebros

Cada estilo tiene un directorio completo: `services/llmService/estilos/{estilo}/`

**Componentes:**

1. **Orquestador** (`orquestador.ts`)
   - Coordina todo el equipo
   - Maneja timeline y metadatos
   - Valida resultados

2. **Director** (`director.ts`)  
   - Genera narrativa principal
   - Crea plan de tomas cinematográficas
   - Define estructura narrativa

3. **Arte** (`arte.ts`)
   - Selecciona fondos apropiados
   - Aplica contexto visual
   - Gestiona coherencia artística

4. **Actores** (`actores.ts`)
   - Selecciona personajes
   - Maneja expresiones y gestos
   - Coherencia de casting

5. **Fotografía** (`fotografia.ts`)
   - Configuración de cámara
   - Movimientos cinematográficos
   - Composición visual

6. **Sonido** (`sonido.ts`)
   - Diseño de audio
   - Efectos sonoros
   - Ambiente acústico

7. **Editor** (`editor.ts`)
   - Ritmo y timing
   - Transiciones
   - Estructura final

### Ejemplo: Equipo Cinematográfico

#### Orquestador Cinematográfico

```typescript
export async function orquestarEquipoCinematico(
  prompt: string,
  duracionTotal: number
): Promise<VideoPlanCinematico> {
  
  // 1. Cargar assets
  const assets = await AssetManager.cargarPorEstilo('cinematic');
  
  // 2. Director genera narrativa
  const narrativa = await generarNarrativaCinematica(prompt);
  
  // 3. Procesar cada toma
  const timeline = [];
  for (const toma of narrativa.tomas) {
    const fondoSeleccionado = await seleccionarFondoCinematico(toma);
    const actorSeleccionado = await seleccionarActorCinematico(toma);
    const camaraConfig = await configurarCamaraCinematica(toma);
    // ... otros cerebros
    
    timeline.push({
      segundo: toma.inicioSegundo,
      fondo: fondoSeleccionado,
      actor: actorSeleccionado,
      camara: camaraConfig
    });
  }
  
  return {
    timeline,
    tomasReales: narrativa.tomas,
    metadata: narrativa.metadata
  };
}
```

#### Director Cinematográfico

```typescript
export async function generarNarrativaCinematica(prompt: string) {
  const systemPrompt = `Eres un director cinematográfico experto...`;
  
  const response = await callOpenRouter({
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  });
  
  return {
    tomas: [
      {
        numero: 1,
        descripcion: "Vista aérea de la sala...",
        duracion: 10,
        tipoToma: 'setup',
        movimientoCamara: 'slow_zoom_in',
        fondo: 'apartamento/sala/día (aerea.png)',
        actor: 'jovenmasculinosorprendidocasual'
      }
    ],
    metadata: {
      genero: 'aventura',
      tono: 'épico',
      estructura: ['setup', 'desarrollo', 'climax']
    }
  };
}
```

---

## 6. GESTIÓN DE ASSETS

### AssetManager (services/assetManager.ts)

**Función:** Servicio unificado para gestión de recursos visuales

#### Estructura de Assets

```typescript
interface AssetItem {
  nombre: string;        // "frontal.png"
  ruta: string;         // "escenas/realista/casa/sala/día/frontal.png"
  tipo: 'fondo' | 'actor';
  lugar?: string;       // "casa", "ciudad", "naturaleza"
  variante?: string;    // "sala", "cocina", "baño"
  angulo?: string;      // "frontal", "lateral", "aerea"
  ambiente?: string;    // "día", "noche", "atardecer"
  url?: string;         // URL completa del CDN
}
```

#### Flujo de Carga

1. **Cache:** Sistema de cache de 5 minutos para `assets_index.json`
2. **Normalización:** Conversión a formato estándar
3. **Enriquecimiento:** Agregado de URLs del CDN
4. **Filtrado:** Por estilo visual y criterios específicos

#### CDN Integration

```typescript
const CDN_CONFIG = {
  baseUrl: 'https://storage.googleapis.com/storyteller-ai-cdn',
  cacheDuration: 5 * 60 * 1000
};

static convertirRutaAURL(ruta: string): string {
  return `${CDN_CONFIG.baseUrl}/${ruta}`;
}
```

#### Selección Inteligente

```typescript
static async obtenerFondosPorEstilo(estilo: string): Promise<AssetItem[]> {
  const todosLosAssets = await this.cargarTodosLosAssets();
  return todosLosAssets.filter(asset => 
    asset.tipo === 'fondo' && 
    asset.ruta.includes(estilo)
  );
}
```

### Auto-corrección de Assets

El sistema incluye auto-corrección cuando assets especificados por el Director no existen:

```typescript
// Si el Director especifica: "apartamento/sala/día (aerea.png)"
// Pero no existe, el sistema:

1. Extrae componentes: lugar="apartamento", variante="sala", ambiente="día"
2. Busca alternativas con mismos criterios
3. Aplica fallbacks progresivos:
   - Mismo lugar + variante diferente
   - Lugar similar + misma variante  
   - Asset genérico del mismo estilo
```

---

## 7. PIPELINE DE RENDERIZADO

### RenderPipeline (pipelines/renderPipeline.ts)

**Función:** Orquestador principal que coordina todo el proceso de generación

#### Fases del Pipeline

##### Fase 1: Validación

```typescript
const requestValidado = validarRenderRequest(request);
if (!requestValidado.esValido) {
  throw new Error(requestValidado.errores.join(', '));
}
```

##### Fase 2: Sistema de Cerebros

```typescript
const planCompleto = await dispatchCerebros({
  prompt: request.prompt,
  duracion: request.duration,
  estilo: request.visualStyle
});
```

##### Fase 3: Procesamiento de Tomas

```typescript
for (const toma of planCompleto.tomasReales) {
  // Auto-corrección de assets
  const fondoCorregido = await corregirFondosActoresInvalidos(
    toma.fondo, 
    'fondo', 
    request.visualStyle
  );
  
  // Generación de video con Kling
  const videoClip = await generateKlingClip({
    prompt: toma.descripcion,
    input_image_urls: [fondoCorregido.url, actorCorregido.url],
    duration: toma.duracion
  });
  
  videosGenerados.push(videoClip);
}
```

##### Fase 4: Audio Unificado

```typescript
const audioUnificado = await generateUnifiedAudioForPipeline({
  tomas: planCompleto.tomasReales,
  duracionTotal: request.duration,
  configuracionVoz: planCompleto.metadata.voz,
  configuracionMusica: planCompleto.metadata.musica
});
```

##### Fase 5: Sincronización Labial

```typescript
for (let i = 0; i < videosGenerados.length; i++) {
  const config = CONFIGURACION_ESTILOS[request.visualStyle];
  
  if (config.usaLipSync) {
    if (config.tecnologiaLipSync === 'wav2lip') {
      videosGenerados[i] = await applyWav2Lip(
        videosGenerados[i], 
        audioUnificado.segmentos[i]
      );
    } else if (config.tecnologiaLipSync === 'sadtalker') {
      videosGenerados[i] = await applySadTalker(
        videosGenerados[i], 
        audioUnificado.segmentos[i]
      );
    }
  }
}
```

##### Fase 6: Ensamblaje y Upload

```typescript
const videoFinal = await assembleVideo({
  videoSegments: videosGenerados,
  audioSegments: audioUnificado.segmentos,
  metadata: {
    duracion: request.duration,
    estilo: request.visualStyle,
    carryoverUsado: planCompleto.metadata.carryover,
    vozManual: !!request.voice,
    musicaManual: !!request.music,
    fechaCreacion: new Date(),
    expiraEn: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48h
  }
});

const urlFinal = await uploadToCDN(videoFinal);
```

#### Validación de Duración

```typescript
async function obtenerDuracionVideo(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration', 
      '-of', 'csv=p=0',
      videoPath
    ]);
    // ... manejo de resultado
  });
}
```

---

## 8. SERVICIOS DE AUDIO

### AudioEngine (services/audioEngine.ts)

**Función:** Motor centralizado para música y efectos de sonido

#### Configuración de Audio

```typescript
interface AudioEngineOptions {
  musicaAvanzada?: string;
  music?: string;
  mezclaAudio?: string;
  emotion?: string;
  region?: string;
  idioma?: string;
  style?: string;
}
```

#### Música Avanzada

```typescript
export async function getAdvancedMusic(options: AudioEngineOptions): Promise<Buffer> {
  // Construir estilo combinando campos
  let style = options.musicaAvanzada || options.music || 'cinematic';
  if (options.emotion) style += ` ${options.emotion}`;
  if (options.region) style += ` ${options.region}`;
  
  // Usar servicio de música con Freesound
  const { getBackgroundMusic } = await import('./musicService.js');
  return await getBackgroundMusic(style, 30, options.emotion || 'neutral');
}
```

### VoiceService (services/voiceService.ts)

**Función:** Síntesis de voz usando Murf.ai

#### Generación de Voz

```typescript
export async function createVoiceBuffer(
  text: string, 
  voiceConfig: CharacterVoiceSpec
): Promise<Buffer> {
  
  const response = await fetch('https://api.murf.ai/v1/speech/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MURF_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      voice: voiceConfig.voiceId,
      format: 'mp3'
    })
  });
  
  return Buffer.from(await response.arrayBuffer());
}
```

### SceneAudioService (services/sceneAudioService.ts)

**Función:** Integración unificada de audio por escena

#### Audio Unificado

```typescript
export async function generateUnifiedAudioForPipeline(options: {
  tomas: TomaCinematograficaPlan[];
  duracionTotal: number;
  configuracionVoz?: any;
  configuracionMusica?: any;
}) {
  
  const segmentosAudio = [];
  
  for (const toma of options.tomas) {
    // Generar voz para la toma
    const vozSegmento = await createVoiceBuffer(
      toma.descripcion,
      options.configuracionVoz || { voiceId: 'default' }
    );
    
    // Generar música de fondo
    const musicaSegmento = await getAdvancedMusic({
      music: toma.musica || 'cinematic',
      emotion: toma.emocion || 'neutral'
    });
    
    // Combinar voz y música
    const audioMezclado = await combinarAudio(vozSegmento, musicaSegmento);
    
    segmentosAudio.push(audioMezclado);
  }
  
  return {
    segmentos: segmentosAudio,
    duracionTotal: options.duracionTotal
  };
}
```

---

## 9. SERVICIOS DE VIDEO

### KlingService (services/klingService.ts)

**Función:** Generación de clips de video usando Kling AI via Fal.ai

#### Parámetros de Kling

```typescript
interface KlingClipParams {
  prompt: string;
  input_image_urls: string[];
  duration: number | DurationType;
  aspect_ratio?: string | AspectRatioType;
  negative_prompt?: string;
}
```

#### Conversión de Imágenes

```typescript
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  let mimeType = 'image/jpeg';
  if (url.toLowerCase().includes('.png')) mimeType = 'image/png';
  
  return `data:${mimeType};base64,${base64}`;
}
```

#### Generación de Clip

```typescript
export async function generateKlingClip(params: KlingClipParams): Promise<string> {
  // Validación de URLs públicas
  for (const url of params.input_image_urls) {
    if (url.includes('localhost')) {
      throw new Error('URL no pública detectada');
    }
  }
  
  // Conversión a base64
  const input_images_base64 = [];
  for (const url of params.input_image_urls) {
    const base64 = await urlToBase64(url);
    input_images_base64.push(base64);
  }
  
  // Llamada a Fal.ai
  const result = await fal.subscribe('fal-ai/kling-video/v1/standard/image-to-video', {
    input: {
      prompt: params.prompt,
      input_images: input_images_base64,
      duration: params.duration,
      aspect_ratio: params.aspect_ratio || '16:9'
    }
  });
  
  return result.data.video.url;
}
```

### FFmpegService (services/ffmpegService.ts)

**Función:** Ensamblaje final de video usando FFmpeg

#### Ensamblaje de Video

```typescript
export async function assembleVideo(options: {
  videoSegments: string[];
  audioSegments: Buffer[];
  metadata: any;
}): Promise<string> {
  
  const outputPath = path.join(os.tmpdir(), `final_${Date.now()}.mp4`);
  
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', [
      // Inputs de video
      ...options.videoSegments.flatMap(video => ['-i', video]),
      
      // Inputs de audio  
      ...options.audioSegments.flatMap(audio => ['-i', audio]),
      
      // Filtros de concatenación
      '-filter_complex', 
      `[0:v][1:v]concat=n=${options.videoSegments.length}:v=1:a=0[outv]`,
      
      // Mapeo de outputs
      '-map', '[outv]',
      '-map', '1:a',
      
      // Configuración de output
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'medium',
      '-crf', '23',
      
      outputPath
    ]);
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });
  });
}
```

### SadTalkerService y Wav2LipService

**Función:** Sincronización labial para diferentes estilos

#### SadTalker (Anime/Cartoon)

```typescript
export async function applySadTalker(
  videoPath: string, 
  audioPath: string
): Promise<string> {
  
  const outputPath = path.join(os.tmpdir(), `sadtalker_${Date.now()}.mp4`);
  
  return new Promise((resolve, reject) => {
    const python = spawn('python', [
      'SadTalker/inference.py',
      '--driven_audio', audioPath,
      '--source_image', videoPath,
      '--result_dir', path.dirname(outputPath)
    ]);
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`SadTalker failed with code ${code}`));
      }
    });
  });
}
```

#### Wav2Lip (Cinematográfico)

```typescript
export async function applyWav2Lip(
  videoPath: string,
  audioPath: string  
): Promise<string> {
  
  const outputPath = path.join(os.tmpdir(), `wav2lip_${Date.now()}.mp4`);
  
  return new Promise((resolve, reject) => {
    const python = spawn('python', [
      'Wav2Lip/inference.py',
      '--checkpoint_path', 'Wav2Lip/checkpoints/wav2lip_gan.pth',
      '--face', videoPath,
      '--audio', audioPath,
      '--outfile', outputPath
    ]);
    
    python.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`Wav2Lip failed with code ${code}`));
      }
    });
  });
}
```

---

## 10. SISTEMA DE JOBS

### JobQueue (jobs/jobQueue.ts)

**Función:** Sistema asíncrono para trabajos de larga duración

#### Estados de Job

```typescript
interface JobState {
  status: 'pending' | 'processing' | 'done' | 'error';
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  errorMessage?: string;
  startTime: number;
  endTime?: number;
  metadata?: any;
}
```

#### Almacenamiento en Memoria

```typescript
const jobStates: Record<string, JobState> = {};
const jobResults: Record<string, any> = {};
```

#### Pasos de Generación

```typescript
const GENERATION_STEPS = [
  'Analizando prompt',
  'Orquestando cerebros', 
  'Generando plan cinematográfico',
  'Seleccionando assets',
  'Configurando render',
  'Procesando video',
  'Finalizando'
];
```

#### Función de Inicio

```typescript
export async function startJob(requestData: any): Promise<string> {
  const jobId = randomUUID();
  
  // Inicializar estado
  jobStates[jobId] = {
    status: 'pending',
    currentStep: 'Iniciando',
    progress: 0,
    totalSteps: GENERATION_STEPS.length,
    startTime: Date.now(),
    metadata: requestData
  };
  
  // Ejecutar asíncronamente
  setImmediate(async () => {
    try {
      updateJobState(jobId, { 
        status: 'processing',
        currentStep: GENERATION_STEPS[0],
        progress: 5 
      });
      
      const result = await renderCinemaAI(
        requestData,
        (step: string, progress: number) => {
          updateJobState(jobId, { 
            currentStep: step,
            progress: Math.min(progress, 95) 
          });
        }
      );
      
      // Éxito
      updateJobState(jobId, {
        status: 'done',
        currentStep: 'Completado', 
        progress: 100,
        endTime: Date.now()
      });
      
      jobResults[jobId] = result;
      
    } catch (error) {
      // Error
      updateJobState(jobId, {
        status: 'error',
        currentStep: 'Error',
        errorMessage: error.message,
        endTime: Date.now()
      });
    }
  });
  
  return jobId;
}
```

#### Funciones de Consulta

```typescript
export function getJobStatus(jobId: string): string {
  return jobStates[jobId]?.status || 'not_found';
}

export function getJobProgress(jobId: string): JobState {
  return jobStates[jobId] || null;
}

export function getJobResult(jobId: string): any {
  return jobResults[jobId] || null;
}
```

---

## 11. APIS Y RUTAS

### Express Server (index.ts)

#### Configuración del Servidor

```typescript
const app = express();

// Seguridad
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Rate limiting  
const limiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { error: 'Too many requests, please slow down.' }
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) }
}));
```

#### Rutas Principales

```typescript
app.use('/api/render', renderRouter);
app.use('/api/templates', templatesRouter);
app.use('/admin', adminRouter);

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});
```

### Render Routes (routes/render.ts)

#### POST /api/render

**Entrada:**
```typescript
{
  prompt: string;
  visualStyle: EstiloVisualAPI;
  duration: number;
}
```

**Proceso:**
1. Validación con Zod
2. Sanitización de prompt
3. Normalización de estilo
4. Creación de job asíncrono
5. Respuesta inmediata con Job ID

**Respuesta:**
```typescript
{
  success: true,
  message: 'Video generation started',
  data: {
    jobId: string,
    estado: 'pendiente',
    estimadoTiempo: 1800,
    urlResultado: string
  },
  statusUrl: string,
  estimatedTime: string
}
```

#### GET /api/render/status/:jobId

**Respuesta:**
```typescript
{
  status: 'pending' | 'processing' | 'done' | 'error'
}
```

#### GET /api/render/progress/:jobId

**Respuesta:**
```typescript
{
  status: string,
  currentStep?: string,
  progress?: number,
  totalSteps?: number,
  errorMessage?: string,
  startTime: number,
  endTime?: number
}
```

#### GET /api/render/result/:jobId

**Respuesta:**
```typescript
{
  url: string,
  metadata: {
    duracion: number,
    estilo: string,
    carryoverUsado: boolean,
    vozManual: boolean,
    musicaManual: boolean,
    fechaCreacion: Date,
    expiraEn: Date
  },
  scenes: any[]
}
```

### Templates Routes (routes/templates.ts)

#### GET /api/templates

**Función:** Obtener plantillas predefinidas de prompts

**Respuesta:**
```typescript
{
  templates: [
    {
      id: string,
      name: string,
      prompt: string,
      visualStyle: string,
      duration: number,
      description: string
    }
  ]
}
```

---

## 12. ANÁLISIS DE PROBLEMAS Y MEJORAS

### Problemas Detectados

#### 1. **Validación de Plan Cinematográfico Defectuosa**

**Ubicación:** `services/llmService/dispatcher.ts`

**Problema:**
```typescript
// Validación rota que rechaza planes válidos
if (momentosNarrativos.length !== videoPlan.timeline.length) {
  throw new Error('Plan cinematográfico generado es inválido');
}
```

**Impacto:** Rechazo de planes cinematográficos válidos generados por el Director

**Solución Propuesta:**
```typescript
// Validación mejorada
const validadorMejorado = {
  hasTimeline: !!videoPlan.timeline,
  timelineValid: Array.isArray(videoPlan.timeline) && videoPlan.timeline.length > 0,
  hasMetadata: !!videoPlan.metadata,
  hasConfig: !!videoPlan.configuracionGlobal
};

const esValido = validadorMejorado.hasTimeline && 
                validadorMejorado.timelineValid && 
                validadorMejorado.hasMetadata &&
                validadorMejorado.hasConfig;
```

#### 2. **Assets por Defecto Rotos**

**Ubicación:** `services/assetManager.ts`

**Problema:**
```typescript
// URL rota que causa errores 404
const defaultUrl = 'https://storage.googleapis.com/.../default_background.jpg';
```

**Impacto:** Fallos en generación cuando assets especificados no existen

**Solución Propuesta:**
```typescript
// Fallbacks robustos por estilo
private getAssetFallback(estilo: string): string {
  const fallbacks = {
    'cinematic': 'escenas/realista/casa/sala/día/frontal.png',
    'anime': 'escenas/anime/casa/sala/día/frontal.png',
    'cartoon': 'escenas/comic/casa/sala/día/frontal.png', 
    'commercial': 'escenas/realista/ciudad/oficina/día/frontal.png'
  };
  return fallbacks[estilo] || fallbacks['cinematic'];
}
```

#### 3. **Sistema de Jobs en Memoria**

**Problema:** Estado de jobs se pierde al reiniciar servidor

**Solución Propuesta:**
- Implementar persistencia con Redis/Database
- Sistema de cleanup para jobs antiguos
- Timeouts para jobs que cuelguen

#### 4. **Manejo de Errores Inconsistente**

**Problema:** Diferentes formatos de error entre servicios

**Solución Propuesta:**
```typescript
// Estructura estándar de errores
interface CinemaAIError {
  code: string;
  message: string;
  service: string;
  timestamp: Date;
  details?: any;
  recoverable: boolean;
}
```

### Mejoras Recomendadas

#### 1. **Sistema de Cache Redis**

```typescript
// Cache distribuido para assets y resultados
const redis = new Redis(process.env.REDIS_URL);

class CacheManager {
  static async getAssets(estilo: string): Promise<AssetItem[]> {
    const cacheKey = `assets:${estilo}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const assets = await AssetManager.obtenerFondosPorEstilo(estilo);
    await redis.setex(cacheKey, 300, JSON.stringify(assets)); // 5 min
    
    return assets;
  }
}
```

#### 2. **Métricas y Monitoreo**

```typescript
// Sistema de métricas detallado
interface GenerationMetrics {
  jobId: string;
  estilo: string;
  duracion: number;
  tiempoTotal: number;
  tiempoPorFase: {
    cerebros: number;
    assets: number;
    kling: number;
    audio: number;
    ensamblaje: number;
  };
  errores: string[];
  assets: {
    fondosUsados: number;
    actoresUsados: number;
    fallbacksUsados: number;
  };
}
```

#### 3. **Validaciones Más Robustas**

```typescript
// Validador de prompt mejorado
class PromptValidator {
  static validate(prompt: string): ValidationResult {
    const issues = [];
    
    if (prompt.length < 10) {
      issues.push('Prompt demasiado corto');
    }
    
    if (prompt.length > 1000) {
      issues.push('Prompt demasiado largo');
    }
    
    if (!/[a-zA-Z]/.test(prompt)) {
      issues.push('Prompt debe contener letras');
    }
    
    const toxicWords = ['violencia', 'hate', 'explicit'];
    if (toxicWords.some(word => prompt.toLowerCase().includes(word))) {
      issues.push('Contenido inapropiado detectado');
    }
    
    return {
      esValido: issues.length === 0,
      errores: issues,
      promptSanitizado: this.sanitize(prompt)
    };
  }
}
```

#### 4. **Sistema de Retry Inteligente**

```typescript
// Retry con backoff exponencial
class RetryManager {
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn(`Intento ${attempt} falló, reintentando en ${delay}ms`);
      }
    }
  }
}
```

#### 5. **Optimización de Assets**

```typescript
// Pre-carga inteligente de assets
class AssetPreloader {
  private static cache = new Map<string, AssetItem[]>();
  
  static async preloadCommonAssets(): Promise<void> {
    const estilos = ['cinematic', 'anime', 'cartoon', 'commercial'];
    
    await Promise.all(estilos.map(async estilo => {
      const assets = await AssetManager.obtenerFondosPorEstilo(estilo);
      this.cache.set(estilo, assets);
      logger.info(`Pre-cargados ${assets.length} assets para ${estilo}`);
    }));
  }
  
  static getFromCache(estilo: string): AssetItem[] | null {
    return this.cache.get(estilo) || null;
  }
}
```

### Redundancias Detectadas

1. **Múltiples Validadores:** Tanto en routes como en pipeline
2. **Conversión de Estilos:** Se hace en varios lugares
3. **Logging Duplicado:** Diferentes formatos entre servicios
4. **Manejo de Assets:** Lógica dispersa entre servicios

### Ciclos Innecesarios

1. **Re-carga de Assets:** Se cargan múltiples veces por request
2. **Validación Repetida:** Mismos datos validados en diferentes capas
3. **Conversión Base64:** Se hace cada vez sin cache

---

## CONCLUSIONES

CinemaAI es un sistema complejo pero bien estructurado que implementa un patrón de **Pipeline + Cerebros Especializados**. Su fortaleza radica en la modularidad y la especialización por estilos visuales.

### Fortalezas

1. **Arquitectura Modular:** Cada componente tiene responsabilidades claras
2. **Sistema de Cerebros:** Innovador enfoque de IA especializada
3. **Manejo de Estilos:** Sistema robusto de normalización y configuración
4. **Pipeline Asíncrono:** Manejo eficiente de trabajos de larga duración

### Debilidades

1. **Validaciones Defectuosas:** Rechazan planes válidos
2. **Assets Rotos:** URLs por defecto causan errores 404
3. **Memoria Volátil:** Jobs se pierden al reiniciar
4. **Manejo de Errores:** Inconsistente entre servicios

### Recomendaciones Prioritarias

1. **Corregir Validadores:** Implementar validación robusta de planes
2. **Arreglar Assets:** Implementar fallbacks funcionales
3. **Implementar Persistencia:** Redis/Database para jobs
4. **Estandarizar Errores:** Formato unificado de errores
5. **Añadir Métricas:** Sistema de monitoreo detallado

El sistema está listo para producción con las correcciones mencionadas y tiene potencial para escalar significativamente con las mejoras propuestas.

---

**Documento generado el 31 de julio de 2025**  
**Versión: 1.0.0**  
**Autor: Análisis Técnico CinemaAI Backend**
