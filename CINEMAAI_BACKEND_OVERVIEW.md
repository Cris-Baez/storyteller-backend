# CinemaAI Backend - Documentación Técnica Completa

## Índice General
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Sistema de Cerebros (LLM)](#sistema-de-cerebros-llm)
3. [Pipeline de Generación de Videos](#pipeline-de-generación-de-videos)
4. [Integración de APIs Externas](#integración-de-apis-externas)
5. [Gestión de Assets](#gestión-de-assets)
6. [Configuración y Despliegue](#configuración-y-despliegue)
7. [Monitoreo y Logs](#monitoreo-y-logs)
8. [Testing y Calidad](#testing-y-calidad)
9. [Escalabilidad y Rendimiento](#escalabilidad-y-rendimiento)
10. [Mantenimiento y Troubleshooting](#mantenimiento-y-troubleshooting)

---

## 🎬 Visión General

**CinemaAI** es un sistema backend avanzado de generación de videos cinematográficos que utiliza **Inteligencia Artificial distribuida** mediante un innovador sistema de "cerebros" especializados. El sistema transforma prompts de texto en videos cinematográficos de alta calidad utilizando múltiples servicios de IA y un pipeline de renderizado complejo.

### Arquitectura Conceptual

```
Prompt del Usuario → Cerebros IA → Assets CDN → Video Pipeline → Video Final
     ↓                  ↓            ↓            ↓              ↓
   [Texto]         [Narrativa]   [Fondos +    [Kling +      [MP4 con
                   [Tomas]       Actores]     Audio +       voz, música
                   [Audio]                    FFmpeg]       y efectos]
```

---

## Arquitectura del Sistema

### Stack Tecnológico Principal
- **Runtime**: Node.js 18+ con TypeScript
- **Framework**: Express.js con middleware de seguridad
- **ORM**: Prisma con PostgreSQL
- **Storage**: Google Cloud Storage
- **Queue**: Sistema de jobs interno basado en memoria
- **Logs**: Winston con rotación automática
- **Video Processing**: FFmpeg + Kling AI (Fal.ai)
- **Audio**: Murf.ai + Freesound API
- **LLM**: OpenRouter con múltiples modelos

### Estructura de Directorios
```
src/
├── index.ts                 # Servidor principal Express
├── config/                  # Configuración del sistema
│   ├── env.ts              # Variables de entorno validadas con Zod
│   ├── cinemaConfig.ts     # Configuración cinematográfica
│   ├── actorDescs.json     # Descriptores de actores
│   └── fondoDescs.json     # Descriptores de fondos
├── pipelines/              # Pipelines de procesamiento
│   └── renderPipeline.ts   # Pipeline principal de render (955 líneas)
├── services/               # Servicios especializados
│   ├── llmService/         # Sistema de cerebros LLM
│   ├── klingService.ts     # Integración con Kling AI
│   ├── audioEngine.ts      # Motor de audio centralizado
│   ├── assetManager.ts     # Gestión unificada de assets
│   └── feedbackService.ts  # Sistema de feedback y métricas
├── routes/                 # Controladores REST
│   ├── render.ts           # Endpoints de renderizado
│   └── templates.ts        # Gestión de plantillas
├── jobs/                   # Sistema de trabajos
│   └── jobQueue.ts         # Cola de jobs con estado
├── utils/                  # Utilidades compartidas
│   ├── logger.ts           # Sistema de logging avanzado
│   └── audioUtils.ts       # Utilidades de audio
└── types/                  # Definiciones TypeScript
    ├── estilos.ts          # Tipos de estilos visuales
    ├── AudioTypes.ts       # Interfaces de audio
    └── respuestas.ts       # Tipos de respuesta
```

### Servidor Principal (`src/index.ts`)
```typescript
// Middlewares de seguridad y configuración
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100
});

// Rutas principales
app.use('/api/render', renderRouter);
app.use('/api/templates', templatesRouter);
```

---

## Sistema de Cerebros (LLM)

### Arquitectura del Sistema de Cerebros
El sistema de cerebros es el núcleo de CinemaAI, implementando un enfoque modular donde cada "cerebro" es un especialista en un aspecto específico de la producción audiovisual.

#### Dispatcher Central (`src/services/llmService/dispatcher.ts`)
```typescript
export async function dispatchCerebros(visualStyle: string, prompt: string, duration: number) {
  const estiloNormalizado = normalizarEstilo(visualStyle);
  
  switch (estiloNormalizado) {
    case 'cinematic':
      return await cinematicOrquestador(prompt, duration, estiloNormalizado);
    case 'anime':
      return await animeOrquestador(prompt, duration, estiloNormalizado);
    case 'cartoon':
      return await cartoonOrquestador(prompt, duration, estiloNormalizado);
    case 'commercial':
      return await commercialOrquestador(prompt, duration, estiloNormalizado);
    default:
      throw new Error(`Estilo visual no soportado: ${estiloNormalizado}`);
  }
}
```

### Estilos Visuales Disponibles

#### 1. **Cinematic** - Producción Cinematográfica Profesional
- **Localización**: `src/services/llmService/estilos/cinematic/`
- **Cerebros especializados**:
  - `director.ts` - Narrativa y estructura cinematográfica
  - `arte.ts` - Dirección artística y fondos
  - `actores.ts` - Casting y actuación
  - `fotografia.ts` - Cinematografía y cámara
  - `sonido.ts` - Diseño sonoro cinematográfico
  - `editor.ts` - Montaje y post-producción
  - `orquestador.ts` - Coordinación general (510 líneas)

#### 2. **Anime** - Estilo Japonés
- **Localización**: `src/services/llmService/estilos/anime/`
- **Especialización**: Técnicas de animación japonesa, efectos especiales anime, diseño de personajes manga

#### 3. **Cartoon** - Animación Occidental
- **Localización**: `src/services/llmService/estilos/cartoon/`
- **Especialización**: Estilo Disney/Pixar, humor visual, animación familiar

#### 4. **Commercial** - Contenido Publicitario
- **Localización**: `src/services/llmService/estilos/commercial/`
- **Especialización**: Marketing visual, call-to-action, branding corporativo

### Flujo de Procesamiento del Orquestador
```typescript
export async function orquestarEquipoCinematico(prompt: string, duracionTotal: number): Promise<VideoPlanCinematico> {
  // 1. Cargar assets usando AssetManager
  const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual);
  const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual);
  
  // 2. Director: Establecer narrativa y plan de tomas
  const narrativaGeneral = await generarNarrativaCinematica(prompt);
  
  // 3. Procesar cada toma cinematográfica
  for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
    const configuracionToma = await coordinarCerebros({
      segundo: segundoActual,
      duracionTotal,
      toma: toma,
      narrativaGeneral,
      assets
    });
  }
  
  // 4. Aplicar estructura de edición
  const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
  
  // 5. Optimizar flujo cinematográfico
  const timelineOptimizado = optimizarFlujoCinematico(timelineConEdicion);
  
  return videoPlan;
}
```

---

## Pipeline de Generación de Videos

### Pipeline Principal (`src/pipelines/renderPipeline.ts`)
El pipeline de renderizado es el corazón del sistema, coordinando todos los servicios para generar videos completos.

**Características principales**:
- **955 líneas** de código optimizado
- **Progress callbacks** en tiempo real
- **Gestión de assets** unificada
- **Integración con servicios IA** múltiples
- **Upload automático** a CDN

### Flujo de Procesamiento
```typescript
export async function renderCinemaAI(params: RenderParams): Promise<RenderResult> {
  // 1. Análisis y validación del prompt
  progressCallback?.({ step: 'Analizando prompt', progress: 10 });
  
  // 2. Orquestación de cerebros
  progressCallback?.({ step: 'Orquestando cerebros', progress: 20 });
  const videoPlan = await dispatchCerebros(visualStyle, prompt, duration);
  
  // 3. Análisis de assets
  progressCallback?.({ step: 'Analizando assets', progress: 30 });
  const assets = await analizarAssets(videoPlan);
  
  // 4. Generación de prompts optimizados
  progressCallback?.({ step: 'Generando prompts', progress: 40 });
  const promptsOptimizados = generarPromptsKling(videoPlan, assets);
  
  // 5. Generación de video con Kling AI
  progressCallback?.({ step: 'Procesando video', progress: 50 });
  const videoResult = await klingService.generateClip(promptOptimizado);
  
  // 6. Procesamiento de audio
  progressCallback?.({ step: 'Procesando audio', progress: 70 });
  const audioBuffer = await audioEngine.getAdvancedMusic(audioOptions);
  
  // 7. Composición final
  progressCallback?.({ step: 'Composición final', progress: 85 });
  const videoFinal = await componerVideoFinal(videoResult, audioBuffer);
  
  // 8. Upload a CDN
  progressCallback?.({ step: 'Subiendo a CDN', progress: 95 });
  const cdnUrl = await uploadToCDN(videoFinal);
  
  return { videoUrl: cdnUrl, metadata: videoPlan };
}
```

### Sistema de Jobs (`src/jobs/jobQueue.ts`)
```typescript
export interface JobState {
  status: 'pending' | 'processing' | 'done' | 'error';
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  errorMessage?: string;
  startTime: number;
  endTime?: number;
  metadata?: any;
}

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

---

## Integración de APIs Externas

### 1. Kling AI - Generación de Video (`src/services/klingService.ts`)
```typescript
export interface KlingClipParams {
  prompt: string;
  input_image_urls: string[];
  duration: number | DurationType;
  aspect_ratio?: string | AspectRatioType;
  negative_prompt?: string;
}

// Conversión segura de URLs a base64
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  
  let mimeType = 'image/jpeg';
  if (url.toLowerCase().includes('.png')) mimeType = 'image/png';
  
  return `data:${mimeType};base64,${base64}`;
}
```

### 2. Audio Engine (`src/services/audioEngine.ts`)
**Motor centralizado** que integra múltiples servicios de audio:

#### Murf.ai - Text-to-Speech
- **Voces profesionales** en múltiples idiomas
- **Emociones personalizables** (alegre, dramático, misterioso)
- **Velocidad y tono ajustables**

#### Freesound - Efectos Sonoros
- **Biblioteca masiva** de efectos gratuitos
- **Búsqueda semántica** por descripción
- **Filtros por duración y calidad**

#### Audio Avanzado
```typescript
export async function getAdvancedMusic(options: AudioEngineOptions): Promise<Buffer> {
  let style = options.musicaAvanzada || options.music || options.style || 'cinematic';
  if (options.emotion) style += ` ${options.emotion}`;
  if (options.motivoVisual) style += ` ${options.motivoVisual}`;
  if (options.sonidoAmbiente) style += ` ${options.sonidoAmbiente}`;
  
  // Lógica de selección de audio basada en contexto
  // Integración con múltiples servicios
  // Procesamiento y normalización
}
```

### 3. OpenRouter - LLM Multiple (`src/config/env.ts`)
```typescript
const schema = z.object({
  OPENROUTER_API_KEY: z.string(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_X_TITLE: z.string().optional(),
});
```

---

## Gestión de Assets

### AssetManager Unificado (`src/services/assetManager.ts`)

#### Características Principales
- **Cache inteligente** con TTL de 5 minutos
- **Normalización automática** de formatos
- **URL del CDN** auto-generadas
- **Filtrado por estilo visual**

```typescript
export interface AssetItem {
  nombre: string;
  ruta: string;
  tipo: 'fondo' | 'actor';
  lugar?: string;
  variante?: string;
  angulo?: string;
  ambiente?: string;
  url?: string; // URL completa del CDN
}

static async cargarTodosLosAssets(): Promise<AssetItem[]> {
  // Cache con TTL
  if (assetsCache && (ahora - cacheTimestamp) < CDN_CONFIG.cacheDuration) {
    return assetsCache;
  }
  
  // Cargar desde assets_index.json
  const assetsRaw = JSON.parse(contenido);
  
  // Normalizar y enriquecer
  const assetsNormalizados = assetsRaw.map((asset: any) => ({
    nombre: asset.nombre,
    ruta: asset.ruta,
    tipo: asset.tipo === 'actores' ? 'actor' : 'fondo',
    url: this.convertirRutaAURL(asset.ruta)
  }));
  
  return assetsNormalizados;
}
```

### CDN y Storage
```typescript
const CDN_CONFIG = {
  baseUrl: process.env.CDN_BUCKET_URL || 'https://storage.googleapis.com/storyteller-ai-cdn',
  cacheDuration: 5 * 60 * 1000, // 5 minutos
};
```

### Estructura de Assets
```
assets/
├── actores/
│   ├── actor_joven.png
│   └── actor_prueba_1.jpg
├── branding/
│   └── watermark_free.png
└── escenas/
    ├── escenario_japon_aerea.jpg
    ├── escenario_japon_entrada.jpg
    ├── escenario_japon_frontal.jpg
    ├── escenario_japon_interior.jpg
    ├── escenario_japon_lateral.jpg
    ├── escenario_japon_noche.jpg
    ├── escenario_japon_suelo.jpg
    └── escenario_japon_ventana.jpg
```

---
];
```

---

**Flujo de trabajo**:
1. Valida el request de entrada
2. Despacha al equipo especializado según `estilo`
3. Coordina la generación del plan cinematográfico
4. Valida el plan generado
5. Retorna el resultado estructurado

### 🎬 Orquestador Cinematográfico (`orquestador.ts`)

**Responsabilidad**: Coordinar el equipo de cerebros especializados para el estilo cinematográfico.

**Pipeline de Orquestación**:
```typescript
1. Cargar assets del CDN (fondos + actores) → AssetManager
2. Consultar al Director → generarNarrativaCinematica()
3. Procesar cada toma cinematográfica → coordinarCerebros()
4. Aplicar estructura de edición → aplicarEstructuraEdicion()
5. Optimizar flujo cinematográfico → optimizarFlujoCinematico()
6. Generar metadata y configuración global
```

**Interface del Video Plan**:
```typescript
export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];      // Timeline segundo a segundo
  metadata: MetadataCinematica;       // Metadata del proyecto
  restricciones: any;                 // Limitaciones técnicas
  configuracionGlobal: ConfiguracionGlobalCinematica; // Config de renderizado
  tomasReales?: TomaCinematograficaPlan[]; // Plan original de tomas
}
```

### 🎭 Cerebro Director (`director.ts`)

**Responsabilidad**: Crear la narrativa cinematográfica y planificar las tomas.

**Características**:
- Utiliza LLM especializado vía OpenRouter
- Genera estructura narrativa profesional (setup → desarrollo → clímax → cierre)
- Planifica tomas específicas con continuidad visual
- Asigna assets específicos del CDN a cada toma

**Flujo de Generación**:
```typescript
1. Cargar system prompt especializado
2. Analizar prompt del usuario
3. Generar plan de 3 tomas de 10 segundos c/u
4. Asegurar continuidad visual entre tomas
5. Especificar movimientos de cámara para Kling
6. Retornar narrativa estructurada
```

**Estructura de Toma Cinematográfica**:
```typescript
export interface TomaCinematograficaPlan {
  numero: number;
  duracion: number;
  tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  descripcion: string;
  movimientoCamara: string;
  estiloVisual: string;
  emocion: string;
  fondo: string;           // Asset específico del CDN
  actor: string;           // Actor específico
  vozMurf: string;         // Voz Murf.ai
  musica: string;          // Música/emoción
  efectosSonoros: string;  // Efectos sonoros
  carryover: string;       // Conexión con toma anterior
}
```

### 🎨 Cerebros Especializados

Cada cerebro tiene una responsabilidad específica:

- **Arte** (`arte.ts`): Selección de fondos y escenarios
- **Actores** (`actores.ts`): Selección y configuración de personajes
- **Fotografía** (`fotografia.ts`): Configuración de cámara y movimientos
- **Sonido** (`sonido.ts`): Música, efectos sonoros y ambiente
- **Editor** (`editor.ts`): Transiciones, timing y optimización

## 🔧 Pipeline de Renderizado

### 🚀 Flujo Principal (`renderPipeline.ts`)

El pipeline principal coordina todo el proceso de generación:

```typescript
export async function renderCinemaAI(
  prompt: string,
  duracion: number,
  estilo: string,
  configuracion?: any
): Promise<string>
```

**Pasos del Pipeline**:

1. **Normalización de Estilo**
   ```typescript
   const estiloNormalizado = normalizarEstilo(estilo);
   const estiloOriginal = estilo; // Preservar para assets
   ```

2. **Despacho de Cerebros**
   ```typescript
   const response = await dispatchCerebros({
     prompt,
     duracion,
     estilo: estiloNormalizado,
     estiloOriginal
   });
   ```

3. **Análisis de Assets**
   ```typescript
   const rutasAssets = await analizarRutasAssets(response.videoPlan);
   ```

4. **Generación de Videos con Kling**
   ```typescript
   for (const toma of tomasReales) {
     const videoUrl = await klingService.generateKlingClip({
       prompt: toma.descripcion,
       input_image_urls: [fondoUrl, actorUrl],
       duration: toma.duracion
     });
   }
   ```

5. **Integración de Audio**
   ```typescript
   const vozBuffer = await voiceService.generarVoz(texto, vozConfig);
   const musicaBuffer = await audioEngine.getAdvancedMusic(audioConfig);
   ```

6. **Ensamblaje Final con FFmpeg**
   ```typescript
   const videoFinal = await ensamblarConFFmpeg(videosClips, audios);
   ```

## 🎵 Sistema de Audio

### 🎤 Motor de Audio (`audioEngine.ts`)

Centraliza toda la lógica de procesamiento de audio:

```typescript
export interface AudioEngineOptions {
  musicaAvanzada?: string;
  music?: string;
  mezclaAudio?: string;
  balanceSonido?: string;
  motivoVisual?: string;
  sonidoAmbiente?: string;
  emotion?: string;
  region?: string;
  idioma?: string;
  style?: string;
  subtitulos?: string;
}
```

**Servicios de Audio**:
- **Música**: Integración con Freesound.org para música de fondo
- **Voz**: Murf.ai para text-to-speech profesional
- **Efectos**: Biblioteca de efectos sonoros contextuales
- **Mezcla**: Ducking automático, crossfade y normalización

### 🎶 Servicio de Música (`musicService.ts`)

Integra con Freesound.org para obtener música contextual:

```typescript
export async function getBackgroundMusic(
  style: string,
  duration: number,
  mood: string
): Promise<Buffer>
```

## 📁 Gestión de Assets

### 🏗️ AssetManager (`assetManager.ts`)

Sistema unificado para gestión de recursos visuales:

```typescript
export interface AssetItem {
  nombre: string;
  ruta: string;
  tipo: 'fondo' | 'actor';
  lugar?: string;
  variante?: string;
  angulo?: string;
  ambiente?: string;
  url?: string; // URL completa del CDN
}
```

**Funcionalidades**:
- Cache inteligente de assets (5 minutos)
- Filtrado por estilo visual
- Búsqueda semántica por criterios
- Conversión automática de rutas a URLs del CDN

**Métodos Principales**:
```typescript
AssetManager.obtenerFondosPorEstilo(estilo: string): Promise<AssetItem[]>
AssetManager.obtenerActoresPorEstilo(estilo: string): Promise<AssetItem[]>
AssetManager.buscarAssetPorNombre(nombre: string): Promise<AssetItem | null>
AssetManager.buscarAssets(criterios: object): Promise<AssetItem[]>
```

## 🎥 Servicio Kling

### 🎬 Generación de Video (`klingService.ts`)

Integra con Kling Elements (Fal.ai) para animar imágenes estáticas:

```typescript
export interface KlingClipParams {
  prompt: string;
  input_image_urls: string[];  // [fondo, actor]
  duration: number | '5' | '10';
  aspect_ratio?: '16:9' | '1:1' | '9:16';
  negative_prompt?: string;
}
```

**Proceso de Generación**:
1. Validar URLs públicas (no localhost)
2. Convertir imágenes a base64 (requerimiento de Fal.ai)
3. Enviar request a Kling Elements
4. Polling para obtener resultado
5. Retornar URL del video generado

**Validaciones Críticas**:
- URLs deben ser públicamente accesibles
- Mínimo 2 imágenes (fondo + actor)
- Prompts descriptivos para mejor calidad
- Manejo de timeouts y errores de red

## 🔗 API REST

### 🚪 Endpoint Principal (`/routes/render.ts`)

**POST /render/**

Endpoint principal para generar videos:

```typescript
const renderRequestSchema = z.object({
  prompt: z.string().min(1, "El prompt es requerido"),
  duracion: z.number().min(1).max(60),
  estilo: z.string().optional(),
  voice: z.string().optional(),
  music: z.string().optional(),
  configuracion: z.any().optional()
});
```

**Respuesta**:
```json
{
  "jobId": "uuid-generado",
  "status": "started",
  "message": "Trabajo iniciado correctamente"
}
```

### 📊 Endpoints de Estado

**GET /render/status/:jobId**
```json
{
  "status": "processing" | "completed" | "failed",
  "progress": 75,
  "currentStep": "Generando audio..."
}
```

**GET /render/result/:jobId**
```json
{
  "status": "completed",
  "videoUrl": "https://cdn.example.com/video.mp4",
  "generatedAt": "2024-01-01T12:00:00Z"
}
```

## ⚡ Sistema de Jobs

### 🔄 Cola de Trabajos (`jobQueue.ts`)

Sistema simple en memoria para procesar trabajos de forma asíncrona:

```typescript
interface Job {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
```

**Funciones Principales**:
```typescript
startJob(prompt, duracion, estilo, configuracion): Promise<string>
getJobStatus(jobId: string): Job | null
getJobResult(jobId: string): any
```

## 🌍 Variables de Entorno

### 🔐 Configuración Crítica (`env.ts`)

Variables obligatorias:
```env
# IA Services
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-...
FAL_KEY=...
MURF_API_KEY=...

# Cloud Storage
GCP_PROJECT_ID=proyecto-id
GCP_CREDENTIALS_JSON=./keys/gcp-service-account.json
GCP_BUCKET_NAME=storyteller-ai-cdn
CDN_BUCKET_URL=https://storage.googleapis.com/storyteller-ai-cdn

# APIs Adicionales
FREESOUND_API_KEY=...
REPLICATE_API_TOKEN=...
ELEVENLABS_API_KEY=... (opcional)
```

Variables opcionales para optimización:
```env
GEN2_CONCURRENCY=3
GEN2_TIMEOUT_MS=300000
FFMPEG_TIMEOUT_MS=120000
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

## 🔒 Seguridad y Autenticación

### 🛡️ Medidas de Seguridad

**Middlewares aplicados**:
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso entre dominios
- **Rate Limiting**: 60 requests/minuto por IP
- **Validación**: Zod schemas para todos los inputs

**Endpoint Admin**:
```typescript
// /admin/logs - Requiere token de administrador
GET /admin/logs
Headers: x-admin-token: ADMIN_TOKEN
```

**Validación de Assets**:
- URLs deben ser públicamente accesibles
- No se permiten URLs localhost/127.0.0.1
- Validación de tipos MIME para imágenes

## 📁 Estructura de Proyecto

```
src/
├── index.ts                 # Punto de entrada de la aplicación
├── config/
│   ├── env.ts              # Configuración de variables de entorno
│   ├── actorDescs.json     # Descripciones de actores
│   └── fondoDescs.json     # Descripciones de fondos
├── routes/
│   ├── render.ts           # API principal de renderizado
│   └── admin.ts            # Rutas administrativas
├── jobs/
│   └── jobQueue.ts         # Sistema de cola de trabajos
├── pipelines/
│   └── renderPipeline.ts   # Pipeline principal de renderizado
├── services/
│   ├── klingService.ts     # Integración con Kling Elements
│   ├── assetManager.ts     # Gestión de assets del CDN
│   ├── audioEngine.ts      # Motor de audio centralizado
│   ├── musicService.ts     # Servicio de música (Freesound)
│   ├── voiceService.ts     # Servicio de voz (Murf.ai)
│   ├── feedbackService.ts  # Sistema de feedback y logging
│   └── llmService/
│       ├── dispatcher.ts   # Dispatcher principal de cerebros
│       ├── estilos/
│       │   └── cinematic/
│       │       ├── orquestador.ts  # Orquestador cinematográfico
│       │       ├── director.ts     # Cerebro director
│       │       ├── arte.ts         # Cerebro de arte
│       │       ├── actores.ts      # Cerebro de actores
│       │       ├── fotografia.ts   # Cerebro de fotografía
│       │       ├── sonido.ts       # Cerebro de sonido
│       │       └── editor.ts       # Cerebro de edición
│       ├── openRouterUtil.js
│       ├── extractJsonUtil.js
│       └── prompts/
│           └── promptUtils.js
├── types/
│   └── estilos.ts          # Tipos de estilos visuales
└── utils/
    └── logger.ts           # Sistema de logging
```

## 🔧 Instalación y Configuración

### 📦 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd storyteller-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Iniciar en desarrollo
npm run dev

# Compilar para producción
npm run build
npm start
```

### 🔑 Configuración de Servicios

1. **Fal.ai (Kling Elements)**:
   - Registrarse en fal.ai
   - Obtener FAL_KEY
   - Configurar créditos para Kling

2. **OpenRouter**:
   - Crear cuenta en openrouter.ai
   - Obtener OPENROUTER_API_KEY
   - Configurar modelos LLM

3. **Murf.ai**:
   - Cuenta empresarial en murf.ai
   - Obtener MURF_API_KEY
   - Configurar voces disponibles

4. **Google Cloud Storage**:
   - Crear proyecto GCP
   - Crear bucket para CDN
   - Configurar service account
   - Descargar credenciales JSON

5. **Freesound.org**:
   - Registrarse en freesound.org
   - Obtener FREESOUND_API_KEY
   - Configurar para uso comercial

## 🚀 Testing y Debugging

### 🧪 Tests

```bash
# Ejecutar tests
npm test

# Tests específicos (cuando se configuren)
npm run test:unit
npm run test:integration
```

### 🔍 Debugging

**Logs Estructurados**:
- Winston logger con niveles (error, warn, info, debug)
- Logs específicos por servicio
- Feedback tracking para analizar performance

**Endpoint de Logs**:
```bash
curl -H "x-admin-token: ADMIN_TOKEN" http://localhost:3000/admin/logs
```

**Debugging de Assets**:
```bash
# Verificar assets cargados
curl http://localhost:3000/admin/assets

# Verificar configuración
curl http://localhost:3000/admin/config
```

## ⚡ Performance y Escalabilidad

### 📊 Optimizaciones Actuales

- **Cache de Assets**: 5 minutos TTL
- **Rate Limiting**: 60 req/min por IP
- **Timeout Configuration**: Configurables vía ENV
- **Connection Pooling**: Para servicios externos
- **Async Processing**: Jobs no bloquean la API

### 🚀 Recomendaciones de Escalabilidad

1. **Sistema de Cola Robusto**:
   - Migrar a Redis/BullMQ
   - Múltiples workers
   - Job priorities y retry policies

2. **Cache Distribuido**:
   - Redis para cache de assets
   - CDN para assets estáticos
   - Cache de respuestas LLM

3. **Monitoreo**:
   - Prometheus + Grafana
   - Health checks automatizados
   - Alerting por Slack/email

4. **Base de Datos**:
   - PostgreSQL para jobs persistentes
   - Prisma ORM ya configurado
   - Backup automatizado

## 🐛 Troubleshooting Común

### ❌ Problemas Frecuentes

**Error: "URLs must be publicly accessible"**
```bash
# Verificar que las URLs del CDN sean públicas
curl -I https://storage.googleapis.com/tu-bucket/asset.jpg
```

**Error: "Kling timeout"**
```bash
# Incrementar timeout en .env
GEN2_TIMEOUT_MS=600000
```

**Error: "Asset not found"**
```bash
# Verificar assets_index.json
cat assets_index.json | jq '.[] | select(.nombre == "nombre-asset")'
```

**Error: "LLM request failed"**
```bash
# Verificar créditos OpenRouter
curl -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  https://openrouter.ai/api/v1/auth/key
```

### 🔧 Comandos de Diagnóstico

```bash
# Verificar configuración
npm run check-config

# Test de conectividad a servicios
npm run test-services

# Limpiar cache
npm run clear-cache

# Verificar logs de error
tail -f logs/error.log
```

## 🔮 Roadmap Técnico

### 🎯 Próximas Funcionalidades

1. **Múltiples Estilos**:
   - Completar cerebros para anime, cartoon, commercial
   - Sistema de templates personalizables
   - Mixing de estilos

2. **IA Avanzada**:
   - Integración con GPT-4 Vision para análisis de assets
   - Computer Vision para detección de objetos
   - Generación de assets dinámicos

3. **Audio Avanzado**:
   - Síntesis de voz con emociones
   - Música generativa con IA
   - Sincronización labial automática

4. **Performance**:
   - Streaming de video en tiempo real
   - Cache predictivo de assets
   - Generación paralela de clips

### 🏗️ Arquitectura Objetivo

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Load Balancer │────│   API Gateway │────│   Microservices │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │                       │
                              │                       │
                    ┌─────────────────┐      ┌─────────────────┐
                    │   Redis Cache   │      │   Event Bus     │
                    └─────────────────┘      └─────────────────┘
                              │                       │
                              │                       │
                    ┌─────────────────┐      ┌─────────────────┐
                    │   PostgreSQL    │      │   Cloud Storage │
                    └─────────────────┘      └─────────────────┘
```

---

## 📝 Conclusión

CinemaAI representa un sistema backend avanzado que combina múltiples servicios de IA para crear videos cinematográficos de forma automatizada. Su arquitectura modular basada en "cerebros" especializados permite escalabilidad y mantenibilidad, mientras que la integración con servicios líderes en IA garantiza resultados de alta calidad.

El sistema está diseñado para evolucionar y soportar nuevos estilos visuales, tecnologías de IA y requerimientos de performance a medida que la plataforma crezca.

**Características Clave**:
- ✅ Arquitectura de microservicios modular
- ✅ Sistema de cerebros IA especializados
- ✅ Pipeline de renderizado robusto
- ✅ Integración con múltiples proveedores de IA
- ✅ Gestión inteligente de assets
- ✅ API REST completa con validación
- ✅ Sistema de jobs asíncronos
- ✅ Logging y monitoring comprehensivo
- ✅ Configuración flexible por variables de entorno
- ✅ Preparado para escalabilidad empresarial

---

*Documentación generada para la versión actual del sistema. Para actualizaciones y cambios, consultar el changelog del proyecto.*
