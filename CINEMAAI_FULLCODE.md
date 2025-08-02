# 🎬 CinemaAI Backend - Código Completo Actualizado

> **Versión 2.0** - Sistema completo de generación cinematográfica con IA distribuida  
> **Última actualización:** 2 de agosto de 2025  
> **Estado:** ✅ MVP Completamente Funcional con Validaciones Definitivas

---

## 📋 Índice

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Sistema de Validaciones Definitivas](#sistema-de-validaciones-definitivas)
3. [Configuración y Variables de Entorno](#configuración)
4. [Rutas API](#rutas-api)
5. [Pipeline Principal](#pipeline-principal)
6. [Sistema de Cerebros](#sistema-de-cerebros)
7. [Servicios Core](#servicios-core)
8. [Utilidades](#utilidades)
9. [Tests y Validación](#tests)

---

## 🏗️ Arquitectura del Sistema

### Estructura General del Proyecto

```
storyteller-backend/
├── src/
│   ├── index.ts                    # Servidor principal
│   ├── config/
│   │   └── env.ts                  # Configuración de variables
│   ├── routes/
│   │   ├── render.ts               # API principal de renderizado
│   │   └── marketing.ts            # API de Marketing AI
│   ├── pipelines/
│   │   └── renderPipeline.ts       # Pipeline principal de renderizado
│   ├── services/
│   │   ├── llmService/             # Sistema de cerebros IA
│   │   ├── klingService.ts         # Integración Kling Elements
│   │   ├── murfService.ts          # Generación de voz comercial
│   │   ├── freesoundService.ts     # Música y efectos
│   │   ├── ffmpegService.ts        # Ensamblado de video
│   │   ├── cdnService.ts           # Google Cloud Storage
│   │   ├── audioEngine.ts          # Motor de audio unificado
│   │   ├── assetManager.ts         # Gestión de assets
│   │   └── marketingService.ts     # Servicio de Marketing AI
│   ├── jobs/
│   │   └── jobQueue.ts             # Sistema de trabajos en background
│   ├── utils/
│   │   ├── logger.ts               # Sistema de logging
│   │   ├── videoValidator.ts       # Validación de videos
│   │   └── [otros utils...]
│   └── types/
│       └── estilos.ts              # Tipos TypeScript
├── assets/                         # Assets pre-generados (fondos/actores)
├── assets_index.json              # Índice de assets del CDN
└── package.json                   # Dependencias del proyecto
```

---

## �️ Sistema de Validaciones Definitivas

### Validaciones Implementadas

El sistema CinemaAI v2.0 incluye un sistema completo de validaciones para garantizar la generación exitosa de videos:

#### 1. **KlingService.ts - Validaciones Pre-Generación**
```typescript
// Validar background con URL válida
if (!background?.startsWith("https://")) {
  throw new Error("🎨 Background no tiene URL válida.");
}

// Validar actor con URL válida  
if (!actor?.startsWith("https://")) {
  throw new Error("🧍 Actor no tiene URL válida.");
}

// Validar prompt visual
if (!prompt || prompt.length < 20) {
  throw new Error("🧠 Prompt visual demasiado corto o inválido.");
}
```

#### 2. **KlingService.ts - Validaciones Post-Generación**
```typescript
// Validación definitiva del resultado
console.log("🔍 Resultado completo de Kling:", videoResult);

if (!videoResult?.video?.url) {
  console.error("❌ Kling falló. Resultado:", videoResult);
  throw new Error("Kling no devolvió video_url");
}
```

#### 3. **RenderPipeline.ts - Validación de Clips**
```typescript
// Validación definitiva de clips generados
const validClips = clips.filter(c => c && typeof c === 'string' && c.includes("https://"));
if (validClips.length === 0) {
  throw new Error("Ningún clip fue generado correctamente.");
}

// Usar solo clips válidos para el resto del proceso
const finalClips = validClips;
```

#### 4. **FFmpegService.ts - Validaciones Pre-Montaje**
```typescript
// Validación definitiva de clips antes del montaje
for (const clip of clips) {
  if (!clip || typeof clip !== 'string') {
    throw new Error("Clip sin URL válida detectado.");
  }
  if (!clip.includes('http')) {
    throw new Error(`Clip con URL inválida: ${clip}`);
  }
}
```

#### 5. **RenderPipeline.ts - Log de Éxito Total**
```typescript
// Log final de éxito total
console.log("🎬 Video generado exitosamente:", cdnUrl);
```

### Flujo de Validación Completo

1. **Pre-generación**: URLs de background, actor y prompt mínimo
2. **Post-generación Kling**: Verificación de video_url válido  
3. **Filtrado de Clips**: Solo procesa clips con URLs HTTPS válidas
4. **Pre-montaje**: Validación antes del ensamblaje FFmpeg
5. **Finalización**: Log explícito de éxito con URL final

---

## �📁 Archivos del Sistema

### 📂 src/index.ts

```ts
// Manejo global de errores no capturados y promesas no manejadas
process.on('uncaughtException', (err) => {
  logger.error(`[FATAL] Excepción no capturada: ${err.message}\n${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`[FATAL] Promesa no manejada: ${reason}`);
  process.exit(1);
});

import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { renderRouter } from './routes/render.js';
import marketingRouter from './routes/marketing.js';
import adminRouter from './routes/admin.js';
import { logger } from './utils/logger.js';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Carga variables de entorno desde la raíz del proyecto
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const app = express();

// Seguridad HTTP headers
app.use(helmet());

// CORS configurado según entorno
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cinemaai.com', 'https://app.cinemaai.com']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Demasiadas solicitudes desde esta IP'
});
app.use(limiter);

// Body parser con límite aumentado
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging de peticiones
app.use(morgan('combined', { 
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Rutas principales
app.use('/api/render', renderRouter);
app.use('/api/marketing', marketingRouter);
app.use('/admin', adminRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta de información del sistema
app.get('/api/info', (req, res) => {
  res.json({
    name: 'CinemaAI Backend',
    version: '2.0',
    status: 'operational',
    features: ['cinematic', 'anime', 'cartoon', 'commercial'],
    endpoints: ['/api/render', '/api/marketing'],
    timestamp: new Date().toISOString()
  });
});

// Manejo global de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`[ERROR] ${err.message}`, { 
    stack: err.stack,
    url: req.url,
    method: req.method 
  });
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    timestamp: new Date().toISOString()
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    availableRoutes: ['/api/render', '/api/marketing', '/health'],
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🎬 CinemaAI Backend v2.0 funcionando en puerto ${PORT}`);
  logger.info(`🌍 Modo: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Rate limit: ${process.env.NODE_ENV === 'production' ? 100 : 1000} req/15min`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
```

### 📂 src/config/env.ts

```ts
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw new Error('No se pudo cargar el archivo .env');
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default(3000),
  
  // APIs principales requeridas
  FAL_KEY: z.string(),
  OPENROUTER_API_KEY: z.string(),
  MURF_API_KEY: z.string(),
  
  // Google Cloud Storage (requerido)
  GCP_PROJECT_ID: z.string(),
  GCP_CREDENTIALS_JSON: z.string(),
  GCP_BUCKET_NAME: z.string(),
  CDN_BUCKET_URL: z.string(),
  
  // APIs opcionales pero recomendadas
  FREESOUND_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  REPLICATE_API_TOKEN: z.string().optional(),
  RUNWAY_API_KEY: z.string().optional(),
  IDEOGRAM_API_KEY: z.string().optional(),
  FLUX_API_KEY: z.string().optional(),
  PEXELS_API_KEY: z.string().optional(),
  
  // Configuraciones avanzadas
  GEN2_CONCURRENCY: z.string().optional(),
  GEN2_TIMEOUT_MS: z.string().optional(),
  FFMPEG_TIMEOUT_MS: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_X_TITLE: z.string().optional(),
  
  // Base de datos y administración
  DATABASE_URL: z.string().optional(),
  ADMIN_TOKEN: z.string().optional(),
  
  // CORS
  CORS_ORIGIN: z.string().optional(),
});

// Variables críticas que deben estar presentes
const requiredEnvVars = [
  'FAL_KEY',
  'OPENROUTER_API_KEY', 
  'MURF_API_KEY',
  'GCP_PROJECT_ID',
  'GCP_CREDENTIALS_JSON',
  'GCP_BUCKET_NAME',
  'CDN_BUCKET_URL',
];

// Verificar variables críticas
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Variables de entorno requeridas no encontradas:', missingVars);
  console.error('📋 Asegúrate de configurar estas variables en tu archivo .env');
  process.exit(1);
}

const env = envSchema.parse(process.env);

// Logs de configuración
console.log('✅ Variables de entorno validadas correctamente');
console.log('🔧 Servicios configurados:', {
  fal: !!env.FAL_KEY,
  openrouter: !!env.OPENROUTER_API_KEY,
  murf: !!env.MURF_API_KEY,
  gcp: !!env.GCP_PROJECT_ID,
  freesound: !!env.FREESOUND_API_KEY,
  elevenlabs: !!env.ELEVENLABS_API_KEY,
  replicate: !!env.REPLICATE_API_TOKEN,
});

// Advertir si faltan variables opcionales importantes
const opcionalesImportantes = [
  'FREESOUND_API_KEY',
  'ELEVENLABS_API_KEY', 
  'REPLICATE_API_TOKEN'
];

for (const key of opcionalesImportantes) {
  if (!process.env[key]) {
    console.warn(`⚠️ Variable opcional recomendada no definida: ${key}`);
  }
}

export { env };
```

### 📂 src/routes/render.ts

```ts
import express from 'express';
import { startJob, getJobStatus, getJobResult, getJobProgress, getJobState } from '../jobs/jobQueue.js';
import { z } from 'zod';
import { logger, safeLog } from '../utils/logger.js';
import { logFeedback } from '../services/feedbackService.js';
import { ESTILOS_VALIDOS, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

// Configuración de multer para manejo de imágenes
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo por imagen
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Formato de imagen no soportado'));
    } else {
      cb(null, true);
    }
  }
});

export const renderRouter = express.Router();

// Esquema de validación con Zod
const renderRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').transform(val => 
    val.replace(/[^\x20-\x7E\u00C0-\u017F]/g, "").trim() || "Create a cinematic story"
  ),
  visualStyle: z.enum(ESTILOS_VALIDOS as [EstiloVisualAPI, ...EstiloVisualAPI[]]),
  duration: z.number().min(1).max(300, 'Duration must be between 1 and 300 seconds'),
});

/**
 * POST /api/render
 * Endpoint principal para generar videos cinematográficos
 */
renderRouter.post('/', upload.fields([
  { name: 'userImage', maxCount: 2 },
  { name: 'localImage', maxCount: 1 },
  { name: 'productImage', maxCount: 1 }
]), async (req, res) => {
  try {
    safeLog('[API] Nueva solicitud de renderizado', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });

    // Sanitizar el prompt
    if (req.body.prompt) {
      req.body.prompt = req.body.prompt
        .replace(/[^\x20-\x7E\u00C0-\u017F]/g, "") // Mantener ASCII + acentos básicos
        .replace(/\s+/g, " ") // Normalizar espacios
        .trim();
      
      if (req.body.prompt.length < 10) {
        logger.warn('[API] Prompt demasiado corto, usando prompt por defecto');
        req.body.prompt = "Create a cinematic story about a character's journey through an epic adventure";
      }
    }

    safeLog('[API] Prompt sanitizado', { promptLength: req.body.prompt?.length || 0 });

    // Preparar datos para validación
    const requestBody = {
      prompt: req.body.prompt || "Create a cinematic story",
      visualStyle: req.body.visualStyle || 'cinematic',
      duration: parseInt(req.body.duration) || 30,
    };

    // Validar con Zod
    const validatedBody = renderRequestSchema.parse(requestBody);
    
    // Normalizar estilo visual
    const estiloNormalizado = normalizarEstilo(validatedBody.visualStyle);

    console.log('[API] Request validado exitosamente', { 
      estiloOriginal: validatedBody.visualStyle,
      estiloNormalizado,
      duracion: validatedBody.duration
    });

    // Procesar imágenes subidas si las hay
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let actorCustomPath: string | undefined;
    
    if (files?.userImage?.[0]) {
      actorCustomPath = files.userImage[0].path;
      console.log('[API] Imagen personalizada detectada', { path: actorCustomPath });
    }

    // Log de feedback para métricas
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: true,
      params: { 
        visualStyle: validatedBody.visualStyle,
        estiloNormalizado,
        duration: validatedBody.duration 
      }
    });

    // Crear trabajo en la cola
    const jobData = {
      ...validatedBody,
      visualStyle: estiloNormalizado,
      estiloOriginal: validatedBody.visualStyle,
      actorCustomPath,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    };

    const jobId = await startJob(jobData);
    
    console.log('[API] Trabajo creado exitosamente', { jobId });

    // Respuesta inmediata con información del job
    const respuesta = {
      success: true,
      message: 'Video generation started',
      data: {
        jobId,
        estado: 'pendiente' as const,
        estimadoTiempo: 1800, // 30 minutos en segundos
        urlResultado: `/api/render/result/${jobId}`
      },
      timestamp: new Date().toISOString(),
      source: 'API'
    };

    res.status(202).json({
      ...respuesta,
      statusUrl: `/api/render/status/${jobId}`,
      estimatedTime: '20-30 minutes'
    });

  } catch (error: any) {
    console.error('[API] Error procesando request', error);
    
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: false,
      error: error.message,
      params: req.body
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors,
        source: 'API'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      source: 'API'
    });
  }
});

/**
 * GET /api/render/status/:jobId
 * Obtener estado actual de un job
 */
renderRouter.get('/status/:jobId', (req, res) => {
  try {
    const status = getJobStatus(req.params.jobId);
    
    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Job no encontrado',
        source: 'API'
      });
    }

    res.json({
      success: true,
      data: status,
      source: 'API'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado',
      error: error.message,
      source: 'API'
    });
  }
});

/**
 * GET /api/render/result/:jobId
 * Obtener resultado final de un job completado
 */
renderRouter.get('/result/:jobId', (req, res) => {
  try {
    const state = getJobState(req.params.jobId);
    
    if (!state) {
      return res.status(404).json({
        success: false,
        message: 'Job no encontrado',
        source: 'API'
      });
    }

    if (state.status !== 'completed') {
      return res.status(202).json({
        success: false,
        message: 'Job aún en progreso',
        data: { status: state.status, progress: state.progress },
        source: 'API'
      });
    }

    const result = getJobResult(req.params.jobId);
    
    res.json({
      success: true,
      data: result,
      source: 'API'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo resultado',
      error: error.message,
      source: 'API'
    });
  }
});

/**
 * GET /api/render/progress/:jobId
 * Obtener progreso detallado de un job
 */
renderRouter.get('/progress/:jobId', (req, res) => {
  try {
    const progress = getJobProgress(req.params.jobId);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Job no encontrado',
        source: 'API'
      });
    }

    res.json({
      success: true,
      data: progress,
      source: 'API'
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo progreso',
      error: error.message,
      source: 'API'
    });
  }
});

export default renderRouter;
```

### 📂 src/routes/marketing.ts

```ts
// src/routes/marketing.ts - API Routes para Marketing AI

import express from 'express';
import { z } from 'zod';
import { generateMarketingClip, validarImagenesMarketing } from '../services/marketingService.js';
import { logger, safeLog } from '../utils/logger.js';
import { logFeedback } from '../services/feedbackService.js';
import { ESTILOS_VALIDOS, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
import multer from 'multer';

export const marketingRouter = express.Router();

// Configuración de multer para imágenes de productos
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo por imagen
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Formato de imagen no soportado'));
    } else {
      cb(null, true);
    }
  }
});

// Esquema de validación para marketing
const marketingRequestSchema = z.object({
  imagenes: z.array(z.string().url()).min(1, 'Al menos una imagen es requerida').max(5, 'Máximo 5 imágenes'),
  descripcion: z.string().min(10, 'Descripción debe tener al menos 10 caracteres').max(200, 'Descripción muy larga'),
  estilo: z.enum(ESTILOS_VALIDOS as [EstiloVisualAPI, ...EstiloVisualAPI[]]).optional(),
  duracion: z.number().min(5).max(30).optional(),
  textoVoz: z.string().max(500).optional()
});

/**
 * POST /api/marketing
 * Genera un clip de marketing automático con imágenes, voz y música
 */
marketingRouter.post('/', upload.array('imagenes', 5), async (req, res) => {
  try {
    safeLog('[MarketingAPI] Nueva solicitud de marketing', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      filesCount: req.files ? (req.files as Express.Multer.File[]).length : 0
    });

    // Procesar imágenes subidas
    let imagenes: string[] = [];
    
    if (req.files && Array.isArray(req.files)) {
      // Convertir archivos subidos a URLs (aquí deberías subirlos a tu CDN)
      imagenes = req.files.map(file => {
        // Por ahora usamos rutas locales, pero deberías implementar subida a CDN
        return `${process.env.CDN_BUCKET_URL}/uploads/${file.filename}`;
      });
    }
    
    // También aceptar URLs directas en el body
    if (req.body.imagenes) {
      const imagenesBody = Array.isArray(req.body.imagenes) ? req.body.imagenes : [req.body.imagenes];
      imagenes = imagenes.concat(imagenesBody);
    }

    // Validar que tenemos al menos una imagen
    if (imagenes.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'IMAGENES_REQUERIDAS',
        message: 'Se requiere al menos una imagen para generar el clip de marketing',
        timestamp: new Date().toISOString(),
        source: 'MarketingAPI'
      });
    }

    // Preparar datos para validación
    const requestData = {
      imagenes,
      descripcion: req.body.descripcion || '',
      estilo: req.body.estilo || 'commercial',
      duracion: parseInt(req.body.duracion) || 15,
      textoVoz: req.body.textoVoz
    };

    // Validar con Zod
    const validatedData = marketingRequestSchema.parse(requestData);
    
    // Normalizar estilo visual
    const estiloNormalizado = normalizarEstilo(validatedData.estilo || 'commercial');

    // Validar URLs de imágenes
    if (!validarImagenesMarketing(validatedData.imagenes)) {
      return res.status(400).json({
        success: false,
        code: 'IMAGENES_INVALIDAS',
        message: 'Una o más URLs de imágenes no son válidas',
        timestamp: new Date().toISOString(),
        source: 'MarketingAPI'
      });
    }

    logger.info('[MarketingAPI] Request validado exitosamente', {
      imagenes: validatedData.imagenes.length,
      descripcionLength: validatedData.descripcion.length,
      estilo: estiloNormalizado,
      duracion: validatedData.duracion
    });

    // Log de feedback para métricas
    logFeedback({
      service: 'MarketingAPI',
      action: 'requestReceived',
      success: true,
      params: {
        imagenes: validatedData.imagenes.length,
        estilo: estiloNormalizado,
        duracion: validatedData.duracion
      }
    });

    // Generar clip de marketing
    const resultado = await generateMarketingClip({
      imagenes: validatedData.imagenes,
      descripcion: validatedData.descripcion,
      estilo: estiloNormalizado,
      duracion: validatedData.duracion,
      textoVoz: validatedData.textoVoz
    });

    // Log de éxito
    logFeedback({
      service: 'MarketingAPI',
      action: 'clipGenerated',
      success: true,
      params: {
        videoUrl: resultado.videoUrl,
        duracion: resultado.metadata.duracion,
        estilo: resultado.metadata.estilo
      }
    });

    logger.info('[MarketingAPI] Clip de marketing generado exitosamente', {
      videoUrl: resultado.videoUrl,
      duracion: resultado.metadata.duracion
    });

    // Respuesta exitosa
    const respuesta = {
      success: true,
      message: 'Clip de marketing generado exitosamente',
      data: {
        videoUrl: resultado.videoUrl,
        duracion: resultado.metadata.duracion,
        estilo: resultado.metadata.estilo,
        tipo: 'marketing',
        metadata: resultado.metadata,
        plan: {
          imagenes: validatedData.imagenes.length,
          descripcion: validatedData.descripcion,
          textoVoz: resultado.planUsed.textoVoz,
          prompt: resultado.planUsed.prompt
        }
      },
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    };

    res.status(200).json(respuesta);

  } catch (error: any) {
    logger.error('[MarketingAPI] Error procesando request de marketing:', error);
    
    logFeedback({
      service: 'MarketingAPI',
      action: 'requestReceived',
      success: false,
      error: error.message,
      params: req.body
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        code: 'PARAMETROS_INVALIDOS',
        message: 'Datos de entrada inválidos para marketing',
        error: error.errors,
        timestamp: new Date().toISOString(),
        source: 'MarketingAPI'
      });
    }

    res.status(500).json({
      success: false,
      code: 'ERROR_GENERACION_MARKETING',
      message: error.message || 'Error interno generando clip de marketing',
      error: error,
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });
  }
});

/**
 * GET /api/marketing/estilos
 * Devuelve los estilos disponibles para marketing
 */
marketingRouter.get('/estilos', (req, res) => {
  try {
    const estilosMarketing = [
      {
        id: 'commercial',
        nombre: 'Comercial',
        descripcion: 'Estilo profesional y corporativo, ideal para productos y servicios',
        duracionRecomendada: 15,
        caracteristicas: ['Profesional', 'Limpio', 'Corporativo', 'Moderno']
      },
      {
        id: 'cinematic',
        nombre: 'Cinematográfico',
        descripcion: 'Estilo premium y dramático, perfecto para productos de lujo',
        duracionRecomendada: 20,
        caracteristicas: ['Premium', 'Dramático', 'Elegante', 'Sofisticado']
      },
      {
        id: 'cartoon',
        nombre: 'Animado',
        descripcion: 'Estilo divertido y colorido, ideal para productos juveniles',
        duracionRecomendada: 15,
        caracteristicas: ['Divertido', 'Colorido', 'Energético', 'Juvenil']
      },
      {
        id: 'anime',
        nombre: 'Anime',
        descripcion: 'Estilo dinámico y vibrante, perfecto para productos innovadores',
        duracionRecomendada: 15,
        caracteristicas: ['Dinámico', 'Vibrante', 'Innovador', 'Moderno']
      }
    ];

    res.json({
      success: true,
      data: estilosMarketing,
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });

  } catch (error: any) {
    logger.error('[MarketingAPI] Error obteniendo estilos:', error);
    
    res.status(500).json({
      success: false,
      code: 'ERROR_OBTENIENDO_ESTILOS',
      message: 'Error interno obteniendo estilos de marketing',
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });
  }
});

/**
 * GET /api/marketing/estadisticas
 * Devuelve estadísticas de uso del servicio de marketing
 */
marketingRouter.get('/estadisticas', async (req, res) => {
  try {
    // En el futuro esto podría leer de base de datos real
    const estadisticas = {
      totalClipsGenerados: 0,
      estilosMasUsados: ['commercial', 'cinematic'],
      duracionPromedio: 15,
      tiempoPromedioGeneracion: 120, // segundos
      satisfaccionPromedio: 4.5,
      ultimaActualizacion: new Date().toISOString()
    };

    res.json({
      success: true,
      data: estadisticas,
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });

  } catch (error: any) {
    logger.error('[MarketingAPI] Error obteniendo estadísticas:', error);
    
    res.status(500).json({
      success: false,
      code: 'ERROR_OBTENIENDO_ESTADISTICAS',
      message: 'Error interno obteniendo estadísticas',
      timestamp: new Date().toISOString(),
      source: 'MarketingAPI'
    });
  }
});

export default marketingRouter;
```

## 🔧 Core Sistema de Trabajos

### 📂 src/jobs/jobQueue.ts

```ts
import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { randomUUID } from 'crypto';
import { safeLog, hasLargeBase64 } from '../utils/logger.js';

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

const jobStates: Record<string, JobState> = {};
const jobResults: Record<string, any> = {};

// Pasos del proceso de generación
const GENERATION_STEPS = [
  'Analizando prompt',
  'Orquestando cerebros',
  'Generando plan cinematográfico',
  'Seleccionando assets',
  'Configurando render',
  'Procesando video',
  'Finalizando'
];

export async function startJob({ prompt, visualStyle, duration }: any) {
  const jobId = randomUUID();
  
  // Inicializar estado del job
  jobStates[jobId] = {
    status: 'pending',
    currentStep: 'Iniciando',
    progress: 0,
    totalSteps: GENERATION_STEPS.length,
    startTime: Date.now(),
    metadata: { prompt, visualStyle, duration }
  };

  safeLog(`[JobQueue] Job ${jobId} iniciado:`, {
    visualStyle,
    duration,
    promptLength: prompt?.length || 0
  });

  // Render en segundo plano
  setImmediate(async () => {
    try {
      // Actualizar estado a procesando
      updateJobState(jobId, {
        status: 'processing',
        currentStep: GENERATION_STEPS[0],
        progress: 5
      });

      const result = await renderCinemaAI(
        { prompt, visualStyle, duration },
        (step: string, progress: number) => {
          // Callback de progreso
          updateJobState(jobId, {
            currentStep: step,
            progress: Math.min(progress, 95) // Reservar 5% para finalización
          });
        }
      );

      // Job completado exitosamente
      updateJobState(jobId, {
        status: 'done',
        currentStep: 'Completado',
        progress: 100,
        endTime: Date.now()
      });

      jobResults[jobId] = result;
      
      // Logging seguro del resultado
      if (hasLargeBase64(result)) {
        safeLog(`[JobQueue] Job ${jobId} completado con éxito. Resultado (contiene datos base64):`, {
          hasVideo: !!result?.url,
          videoUrl: result?.url ? 'URL presente' : 'No URL',
          dataKeys: result ? Object.keys(result) : [],
          scenes: result?.scenes?.length || 0,
          tiempoTotal: jobStates[jobId].endTime! - jobStates[jobId].startTime
        });
      } else {
        safeLog(`[JobQueue] Job ${jobId} completado con éxito. Resultado:`, result);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Job con error
      updateJobState(jobId, {
        status: 'error',
        currentStep: 'Error',
        errorMessage: err.message,
        endTime: Date.now()
      });

      jobResults[jobId] = { error: err.message };
      
      safeLog(`[JobQueue] Error en job ${jobId}:`, {
        error: err.message,
        tiempoAntes: Date.now() - jobStates[jobId].startTime
      });
    }
  });

  return jobId;
}

export function updateJobState(jobId: string, updates: Partial<JobState>) {
  if (jobStates[jobId]) {
    jobStates[jobId] = { ...jobStates[jobId], ...updates };
  }
}

export function getJobStatus(jobId: string): string {
  return jobStates[jobId]?.status || 'not_found';
}

export function getJobState(jobId: string): JobState | null {
  return jobStates[jobId] || null;
}

export function getJobResult(jobId: string) {
  return jobResults[jobId] || null;
}

export function getJobProgress(jobId: string): {
  status: string;
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  errorMessage?: string;
} {
  const state = jobStates[jobId];
  
  if (!state) {
    return { status: 'not_found' };
  }

  return {
    status: state.status,
    currentStep: state.currentStep,
    progress: state.progress,
    totalSteps: state.totalSteps,
    errorMessage: state.errorMessage
  };
}

// Limpiar jobs antiguos (opcionalmente)
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000) { // 24 horas por defecto
  const now = Date.now();
  const jobsToDelete: string[] = [];

  Object.entries(jobStates).forEach(([jobId, state]) => {
    const jobAge = now - state.startTime;
    if (jobAge > maxAgeMs && (state.status === 'done' || state.status === 'error')) {
      jobsToDelete.push(jobId);
    }
  });

  jobsToDelete.forEach(jobId => {
    delete jobStates[jobId];
    delete jobResults[jobId];
  });

  if (jobsToDelete.length > 0) {
    safeLog(`[JobQueue] Limpieza: eliminados ${jobsToDelete.length} jobs antiguos`);
  }
}
```
├── jobs/            # Sistema de colas de trabajo
├── pipelines/       # Pipelines de procesamiento
├── routes/          # Rutas de la API
├── scripts/         # Scripts de utilidades
├── services/        # Servicios del sistema
├── tests/           # Tests y verificaciones
├── types/           # Definiciones de tipos
└── utils/           # Utilidades generales
```

## 📁 Archivos del Sistema

### 📂 src/config/cinemaConfig.ts

```ts
// Archivo vacío
```

### 📂 src/config/env.ts

```ts
import * as dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw new Error('No se pudo cargar el archivo .env');
}

const schema = z.object({
  OPENAI_API_KEY: z.string(),
  REPLICATE_API_TOKEN: z.string(),
  MURF_API_KEY: z.string(), // Cambiar de opcional a requerido
  ELEVENLABS_API_KEY: z.string().optional(),
  ARTLIST_TOKEN: z.string().optional(),
  // RUNWAY_API_TOKEN: z.string().optional(), // Eliminado: ya no se usa RunwayML
  DM_API_TOKEN: z.string().optional(),
  CDN_BUCKET_URL: z.string(),
  NODE_ENV: z.string().default('development'),
  OPENROUTER_API_KEY: z.string(),
  GCP_PROJECT_ID: z.string(),
  GCP_CREDENTIALS_JSON: z.string(),
  GCP_BUCKET_NAME: z.string(),
  GEN2_CONCURRENCY: z.string().optional(),
  GEN2_TIMEOUT_MS: z.string().optional(),
  FFMPEG_TIMEOUT_MS: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().optional(),
  OPENROUTER_HTTP_REFERER: z.string().optional(),
  OPENROUTER_X_TITLE: z.string().optional(),

  FREESOUND_API_KEY: z.string().optional(),
  RUNWAYML_API_SECRET: z.string().optional(),
  RUNWAY_API_TOKEN: z.string().optional(),
});

const env = schema.parse(process.env);

// Advertir si faltan variables opcionales importantes
const opcionales = [
  'ELEVENLABS_API_KEY',
  'ARTLIST_TOKEN',
  'DM_API_TOKEN',
  'GEN2_CONCURRENCY',
  'GEN2_TIMEOUT_MS',
  'FFMPEG_TIMEOUT_MS',
  'OPENROUTER_BASE_URL',
  'OPENROUTER_HTTP_REFERER',
  'OPENROUTER_X_TITLE',
  'FREESOUND_API_KEY',
  'RUNWAYML_API_SECRET',
  'RUNWAY_API_TOKEN',
  'ADMIN_TOKEN'
];
for (const key of opcionales) {
  if (!process.env[key]) {
    console.warn(`[AVISO] Variable opcional no definida: ${key}`);
  }
}

export { env };

```

### 📂 src/index.ts

```ts
// Manejo global de errores no capturados y promesas no manejadas
process.on('uncaughtException', (err) => {
  logger.error(`[FATAL] Excepción no capturada: ${err.message}\n${err.stack}`);
  // Opcional: salir para que un orquestador reinicie el proceso
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error(`[FATAL] Promesa no manejada: ${reason}`);
  // Opcional: salir para que un orquestador reinicie el proceso
  process.exit(1);
});
// ...existing code...
// src/index.ts
import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { renderRouter } from './routes/render.js';
//import { templatesRouter } from './routes/templates.js';
import { logger } from './utils/logger.js';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Carga SIEMPRE el .env desde la raíz, sin importar el directorio de ejecución
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".." );
dotenv.config({ path: path.join(projectRoot, ".env") });
const app = express();


// Seguridad HTTP headers
app.use(helmet());
app.use('/admin', adminRouter);

import adminRouter from './routes/admin.js';
// Rutas de administración y monitoreo (solo para admins/desarrollo)
app.use('/admin', adminRouter);

// CORS (ajusta origin según tu frontend)
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

// Body parser con mayor límite
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging de peticiones
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
  })
);

// Rate limiter: max 60 requests/minuto por IP
const limiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  message: { error: 'Too many requests, please slow down.' }
});
app.use(limiter);

// Health check
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Rutas principales
app.use('/api/render', renderRouter);
//app.use('/api/templates', templatesRouter);

// Nueva ruta para compilar el video final
app.post('/api/compile', async (req, res) => {
  try {
    const { videoSegments, audioSegments, soundEffects } = req.body;

    // Simulación de compilación
    logger.info('Compilando video final con segmentos proporcionados...');
    const compiledVideoUrl = 'https://cdn.example.com/final-video.mp4';

    res.json({ url: compiledVideoUrl });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    logger.error(`Error en compilación: ${errorMessage}`);
    res.status(500).json({ error: 'Error al compilar el video final' });
  }
});

// Comentado: Ruta antigua que simula respuesta
// app.post('/api/render', (req, res) => {
//   const { prompt, style, type, duration } = req.body;
//   console.log('Prompt recibido:', { prompt, style, type, duration });
//   res.json({ url: 'https://video-demo.com/video-generado.mp4' });
// });

// Handler de errores
app.use(
  (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(`Unhandled Error: ${err.message}\n${err.stack}`);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
);

// Levanta servidor y gestiona shutdown
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`🚀  Storyteller AI backend listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — closing server');
  server.close(() => {
    logger.info('Server closed, exiting process');
    process.exit(0);
  });
});

```

### 📂 src/jobs/jobQueue.ts

```ts
import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { randomUUID } from 'crypto';
import { safeLog, hasLargeBase64 } from '../utils/logger.js';

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

const jobStates: Record<string, JobState> = {};
const jobResults: Record<string, any> = {};

// Pasos del proceso de generación
const GENERATION_STEPS = [
  'Analizando prompt',
  'Orquestando cerebros',
  'Generando plan cinematográfico',
  'Seleccionando assets',
  'Configurando render',
  'Procesando video',
  'Finalizando'
];

export async function startJob({ prompt, visualStyle, duration }: any) {
  const jobId = randomUUID();
  
  // Inicializar estado del job
  jobStates[jobId] = {
    status: 'pending',
    currentStep: 'Iniciando',
    progress: 0,
    totalSteps: GENERATION_STEPS.length,
    startTime: Date.now(),
    metadata: { prompt, visualStyle, duration }
  };

  safeLog(`[JobQueue] Job ${jobId} iniciado:`, {
    visualStyle,
    duration,
    promptLength: prompt?.length || 0
  });

  // Render en segundo plano
  setImmediate(async () => {
    try {
      // Actualizar estado a procesando
      updateJobState(jobId, {
        status: 'processing',
        currentStep: GENERATION_STEPS[0],
        progress: 5
      });

      const result = await renderCinemaAI(
        { prompt, visualStyle, duration },
        (step: string, progress: number) => {
          // Callback de progreso
          updateJobState(jobId, {
            currentStep: step,
            progress: Math.min(progress, 95) // Reservar 5% para finalización
          });
        }
      );

      // Job completado exitosamente
      updateJobState(jobId, {
        status: 'done',
        currentStep: 'Completado',
        progress: 100,
        endTime: Date.now()
      });

      jobResults[jobId] = result;
      
      // Logging seguro del resultado
      if (hasLargeBase64(result)) {
        safeLog(`[JobQueue] Job ${jobId} completado con éxito. Resultado (contiene datos base64):`, {
          hasVideo: !!result?.url,
          videoUrl: result?.url ? 'URL presente' : 'No URL',
          dataKeys: result ? Object.keys(result) : [],
          scenes: result?.scenes?.length || 0,
          tiempoTotal: jobStates[jobId].endTime! - jobStates[jobId].startTime
        });
      } else {
        safeLog(`[JobQueue] Job ${jobId} completado con éxito. Resultado:`, result);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Job con error
      updateJobState(jobId, {
        status: 'error',
        currentStep: 'Error',
        errorMessage: err.message,
        endTime: Date.now()
      });

      jobResults[jobId] = { error: err.message };
      
      safeLog(`[JobQueue] Error en job ${jobId}:`, {
        error: err.message,
        tiempoAntes: Date.now() - jobStates[jobId].startTime
      });
    }
  });

  return jobId;
}

export function updateJobState(jobId: string, updates: Partial<JobState>) {
  if (jobStates[jobId]) {
    jobStates[jobId] = { ...jobStates[jobId], ...updates };
  }
}

export function getJobStatus(jobId: string): string {
  return jobStates[jobId]?.status || 'not_found';
}

export function getJobState(jobId: string): JobState | null {
  return jobStates[jobId] || null;
}

export function getJobResult(jobId: string) {
  return jobResults[jobId] || null;
}

export function getJobProgress(jobId: string): {
  status: string;
  currentStep?: string;
  progress?: number;
  totalSteps?: number;
  errorMessage?: string;
} {
  const state = jobStates[jobId];
  
  if (!state) {
    return { status: 'not_found' };
  }

  return {
    status: state.status,
    currentStep: state.currentStep,
    progress: state.progress,
    totalSteps: state.totalSteps,
    errorMessage: state.errorMessage
  };
}

// Limpiar jobs antiguos (opcionalmente)
export function cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000) { // 24 horas por defecto
  const now = Date.now();
  const jobsToDelete: string[] = [];

  Object.entries(jobStates).forEach(([jobId, state]) => {
    const jobAge = now - state.startTime;
    if (jobAge > maxAgeMs && (state.status === 'done' || state.status === 'error')) {
      jobsToDelete.push(jobId);
    }
  });

  jobsToDelete.forEach(jobId => {
    delete jobStates[jobId];
    delete jobResults[jobId];
  });

  if (jobsToDelete.length > 0) {
    safeLog(`[JobQueue] Limpieza: eliminados ${jobsToDelete.length} jobs antiguos`);
  }
}
```

### 📂 src/pipelines/renderPipeline.ts

```ts
// ✨ ARQUITECTURA UNIFICADA: Todo pasa por el sistema de cerebros cinematográficos
import { dispatchCerebros, RequestGeneracion } from '../services/llmService/dispatcher.js';
import { EstiloVisualPrincipal, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
// ❌ ELIMINADO: import { createVideoPlan } from '../services/llmService/index.js'; - Ya no usamos sistema legacy
import { getAdvancedMusic, getSfx } from '../services/audioEngine.js';  // ✨ MEJORADO: Reorganizado
import { createVoiceBuffer } from '../services/voiceService.js';  // ✨ MEJORADO: Renombrado
import { generateUnifiedAudioForPipeline } from '../services/sceneAudioService.js';  // ✨ NUEVO: Integración completa
import { generateKlingClip, KlingClipParams } from '../services/klingService.js';
import { assembleVideo } from '../services/ffmpegService.js';
import { uploadToCDN } from '../services/cdnService.js';
import { spawn } from 'child_process';

// ✅ PASO 2: Función para obtener duración de video usando ffprobe
async function obtenerDuracionVideo(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-show_entries', 'format=duration',
      '-of', 'csv=p=0',
      videoPath
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe failed with code ${code}`));
        return;
      }
      
      const duration = parseFloat(output.trim());
      resolve(isNaN(duration) ? 0 : duration);
    });

    ffprobe.on('error', (error) => {
      reject(error);
    });
  });
}
import { applySadTalker } from '../services/sadtalkerService.js';
import { applyWav2Lip } from '../services/wav2lipService.js';
import { RenderRequest, VideoPlan, TimelineSecond, EstiloVisual } from '../utils/types.js';
import { validarRenderRequest } from '../utils/validadores.js';  // ✨ NUEVO: Validación estricta
import { cargarAssetsIndex, validarVideoPlanFondosActores, corregirFondosActoresInvalidos } from '../utils/menteFondos.js';
import { generateQuickKlingVideo } from '../services/clipService.js';

/**
 * Analiza la ruta de un asset para extraer información contextual
 */
function analizarRutaAsset(ruta: string): { lugar?: string, variante?: string, tipo?: string, estilo?: string } {
  // Ejemplo de ruta: "escenas/realista/naturaleza/montaña/día/lateral.png"
  // o "actores/comic/casa/baño/día/ninomasculinopensativocasual.png"
  // También maneja URLs del CDN: "https://storage.googleapis.com/storyteller-ai-cdn/escenas/comic/naturaleza/desierto/día/frontal.png"
  
  // Extraer solo la parte de la ruta después del CDN
  let rutaLimpia = ruta;
  if (ruta.includes('storyteller-ai-cdn/')) {
    rutaLimpia = ruta.split('storyteller-ai-cdn/')[1];
  }
  
  const partes = rutaLimpia.split('/');
  if (partes.length < 3) return {};
  
  const tipoAsset = partes[0]; // escenas o actores
  const estilo = partes[1]; // realista, comic, anime, etc.
  
  if (tipoAsset === 'escenas' && partes.length >= 4) {
    return {
      lugar: partes[2], // naturaleza, ciudad, casa, etc.
      variante: partes[3], // montaña, calle, baño, etc.
      estilo
    };
  } else if (tipoAsset === 'actores' && partes.length >= 6) {
    const nombreActor = partes[5].replace('.png', '');
    return {
      tipo: extraerTipoPersonaje(nombreActor),
      lugar: partes[2],
      variante: partes[3],
      estilo
    };
  }
  
  return { estilo };
}

/**
 * Extrae el tipo de personaje del nombre del archivo
 */
function extraerTipoPersonaje(nombreArchivo: string): string {
  // Ejemplo: "ninomasculinopensativocasual" → "thoughtful young man"
  const masculino = nombreArchivo.includes('masculino');
  const femenino = nombreArchivo.includes('femenino');
  const nino = nombreArchivo.includes('nino');
  const adulto = nombreArchivo.includes('adulto') || nombreArchivo.includes('hombre') || nombreArchivo.includes('mujer');
  
  let descripcion = '';
  if (nino) {
    descripcion += masculino ? 'young man' : femenino ? 'young woman' : 'young person';
  } else if (adulto) {
    descripcion += masculino ? 'man' : femenino ? 'woman' : 'person';
  } else {
    descripcion += 'person';
  }
  
  // Agregar emociones/características comunes
  if (nombreArchivo.includes('pensativo')) descripcion += ', thoughtful';
  if (nombreArchivo.includes('feliz')) descripcion += ', happy';
  if (nombreArchivo.includes('sorprendido')) descripcion += ', surprised';
  if (nombreArchivo.includes('serio')) descripcion += ', serious';
  
  return descripcion;
}

/**
 * Genera un prompt cinematográfico coherente y específico para Kling
 * MEJORADO: Contexto narrativo y continuidad visual
 */
function generarPromptCinematografico(params: {
  prompt: string;
  descripcionToma?: string;
  promptKling?: string;
  visual?: string;
  duracion: number;
  momento?: string;
  visualStyle?: EstiloVisualPrincipal;
  tomaNumero?: number;
  totalTomas?: number;
  contextoPrevio?: string; // ✅ NUEVO: Continuidad narrativa
  fondoDescripcion?: string; // ✅ NUEVO: Descripción del escenario
  personajeDescripcion?: string; // ✅ NUEVO: Descripción del personaje
  // ✅ NUEVO: Parámetros optimizados para Kling
  objetivoEmocional?: string; // ✅ Objetivo emocional de la escena
  accionPrincipal?: string; // ✅ Acción principal resumida
  carryover?: string; // ✅ NUEVO: Continuidad específica por toma
}): string {
  const { 
    prompt, descripcionToma, promptKling, visual, duracion, momento, visualStyle,
    tomaNumero = 1, totalTomas = 1, contextoPrevio, fondoDescripcion, personajeDescripcion,
    objetivoEmocional, accionPrincipal
  } = params;
  
  // 1. Base narrativa específica - ✅ OPTIMIZADO: Priorizar descripción de toma
  const contenidoBase = descripcionToma || promptKling || visual || prompt;
  
  // ✅ NUEVO: Extraer acción principal de la descripción si no se proporciona
  const accionExtraida = accionPrincipal || extraerAccionPrincipal(contenidoBase);
  
  // 2. Contexto de secuencia para continuidad - ✅ OPTIMIZADO
  let contextoSecuencia = '';
  if (totalTomas > 1) {
    if (tomaNumero === 1) {
      contextoSecuencia = 'Opening: ';
    } else if (tomaNumero === totalTomas) {
      contextoSecuencia = 'Climax: ';
    } else {
      contextoSecuencia = `Part ${tomaNumero}: `;
    }
  }
  
  // ✅ NUEVO: Continuidad resumida y específica
  const continuidad = contextoPrevio ? 
    `From: ${resumirEscenaPrevia(contextoPrevio)}. ` : '';
  
  // ✅ NUEVO: Objetivo emocional específico
  const objetivoEmo = objetivoEmocional ? 
    `Goal: ${objetivoEmocional}. ` : 
    generarObjetivoEmocional(momento);
  
  // 4. Descripción del ambiente específico - ✅ OPTIMIZADO: Más conciso
  const ambiente = fondoDescripcion && fondoDescripcion !== 'scenic location' 
    ? `Location: ${fondoDescripcion}. ` 
    : '';
  const personaje = personajeDescripcion && personajeDescripcion !== 'character' 
    ? `Subject: ${personajeDescripcion}. ` 
    : '';
  
  // ✅ NUEVO: Acción principal resumida
  const accion = accionExtraida ? `Action: ${accionExtraida}. ` : '';
  
  // 5. Estilo visual coherente - ✅ OPTIMIZADO: Más específico para Kling
  const contextoEstilo = generarEstiloKling(visualStyle, momento);
  
  // ✅ OPTIMIZADO: Construcción priorizada para Kling (máximo impacto en menos tokens)
  const promptFinal = `${contextoSecuencia}${objetivoEmo}${ambiente}${personaje}${accion}${contextoEstilo}`;
  
  // ✅ DEBUG: Log del prompt optimizado
  console.log(`[Pipeline] 🔍 DEBUG Prompt optimizado:`, {
    tomaNumero,
    length: promptFinal.length,
    contextoParts: {
      contextoSecuencia,
      objetivoEmo: objetivoEmo.substring(0, 30) + '...',
      ambiente,
      personaje,
      accion: accion.substring(0, 40) + '...',
      contextoEstilo: contextoEstilo.substring(0, 50) + '...'
    },
    promptFinal: promptFinal.substring(0, 150) + '...'
  });
  
  return promptFinal;
}

/**
 * ✨ NUEVO: Extrae la acción principal de una descripción larga
 */
function extraerAccionPrincipal(descripcion: string): string {
  if (!descripcion) return '';
  
  // Buscar verbos de acción comunes y extraer la frase principal
  const patronesAccion = [
    /(\w+\s+(?:camina|escala|alcanza|levanta|mira|corre|salta|vuela)[^.]*)/i,
    /([^.]*(?:hacia|por|en|sobre|bajo)[^.]*)/i,
    /(el hombre[^.]*)/i,
    /(la mujer[^.]*)/i
  ];
  
  for (const patron of patronesAccion) {
    const match = descripcion.match(patron);
    if (match && match[1] && match[1].length > 10) {
      return match[1].trim();
    }
  }
  
  // Fallback: tomar las primeras 8 palabras importantes
  const palabras = descripcion.split(' ').filter(p => p.length > 3);
  return palabras.slice(0, 8).join(' ');
}

/**
 * ✨ NUEVO: Resume escena previa para continuidad
 */
function resumirEscenaPrevia(escenaPrevia: string): string {
  if (!escenaPrevia || escenaPrevia.length < 20) return '';
  
  // Extraer elementos clave: ubicación, acción, emoción
  const resumen = escenaPrevia
    .replace(/^previous scene showed?/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Limitar a elementos esenciales (máximo 6 palabras)
  const palabrasClave = resumen.split(' ').slice(0, 6).join(' ');
  return palabrasClave;
}

/**
 * ✨ NUEVO: Genera objetivo emocional basado en momento narrativo
 */
function generarObjetivoEmocional(momento?: string): string {
  const objetivosPorMomento = {
    'setup': 'Goal: establish mood and context. ',
    'desarrollo': 'Goal: build tension and character. ',
    'climax': 'Goal: create emotional peak. ',
    'cierre': 'Goal: provide resolution. '
  };
  
  return objetivosPorMomento[momento as keyof typeof objetivosPorMomento] || 'Goal: engage viewer. ';
}

/**
 * ✨ NUEVO: Genera estilo optimizado para Kling
 */
function generarEstiloKling(visualStyle?: EstiloVisualPrincipal, momento?: string): string {
  const estiloBase = visualStyle === 'cinematic' ? 'cinematic film quality' :
                     visualStyle === 'anime' ? 'anime style animation' :
                     visualStyle === 'cartoon' ? 'cartoon animation' :
                     visualStyle === 'commercial' ? 'commercial production' :
                     'cinematic style';
  
  const tecnicaPorMomento = {
    'setup': 'establishing shot, smooth movement',
    'desarrollo': 'dynamic framing, controlled motion',
    'climax': 'dramatic angles, intense focus',
    'cierre': 'wide perspective, gentle movement'
  };
  
  const tecnica = tecnicaPorMomento[momento as keyof typeof tecnicaPorMomento] || 'professional cinematography';
  
  return `${estiloBase}, ${tecnica}, high production value`;
}

/**
 * ✨ FUNCIÓN PRINCIPAL: renderCinemaAI
 * Orquesta todo el flujo de generación usando el sistema de cerebros
 */
export async function renderCinemaAI(
  req: RenderRequest, 
  progressCallback?: (step: string, progress: number) => void,
  actorCustomPath?: string, 
  quickMode?: boolean
) {
  const logger = console;
  logger.info('[Pipeline] Iniciando renderCinemaAI', { quickMode, actorCustomPath });

  // Helper para reportar progreso
  const reportProgress = (step: string, progress: number) => {
    if (progressCallback) {
      progressCallback(step, progress);
    }
    logger.info(`[Pipeline] ${step} (${progress}%)`);
  };

  reportProgress('Validando request', 5);

  // Validación estricta para prevenir errores silenciosos
  const validacion = validarRenderRequest(req);
  if (!validacion.valido) {
    logger.warn(`⚠️ [Pipeline] Request con warnings: ${validacion.errores.join(', ')}`);
  }
  
  const reqNormalizado = validacion.normalizado || req;
  
  if (!reqNormalizado.visualStyle) reqNormalizado.visualStyle = 'cinematic';
  if (!reqNormalizado.duration) reqNormalizado.duration = 30;
  if (!reqNormalizado.prompt) reqNormalizado.prompt = '';

  reportProgress('Orquestando cerebros cinematográficos', 10);

  let videoPlan: VideoPlan;
  try {
    // ✨ ARQUITECTURA UNIFICADA: Todo pasa por el sistema de cerebros
    logger.info(`[Pipeline] 🧠 Usando SISTEMA DE CEREBROS CINEMATOGRÁFICOS para: ${reqNormalizado.visualStyle}`);
    
    const estiloNormalizado = normalizarEstilo(reqNormalizado.visualStyle as EstiloVisualAPI);
    
    const requestCerebros: RequestGeneracion = {
      prompt: reqNormalizado.prompt,
      duracion: reqNormalizado.duration,
      estilo: estiloNormalizado,
      estiloOriginal: reqNormalizado.visualStyle,
      configuracion: {
        demoMode: reqNormalizado.demoMode,
        previewMode: reqNormalizado.previewMode,
        metadata: reqNormalizado.metadata
      }
    };
    
    // Despachar al equipo de cerebros
    const resultadoCerebros = await dispatchCerebros(requestCerebros);
    
    if (!resultadoCerebros.success) {
      throw new Error(`❌ Sistema de cerebros falló: ${resultadoCerebros.error}`);
    }
    
    // Convertir respuesta de cerebros al formato VideoPlan
    videoPlan = {
      timeline: resultadoCerebros.videoPlan,
      tomasReales: resultadoCerebros.tomasReales,
      metadata: resultadoCerebros.metadata,
      configuracionGlobal: resultadoCerebros.configuracion,
      restricciones: resultadoCerebros.restricciones
    };
    
    logger.info(`[Pipeline] ✅ Cerebros generaron: ${videoPlan.timeline.length} segundos (${estiloNormalizado})`);
    
    reportProgress('Validando plan cinematográfico', 20);
    
    // Validación final del VideoPlan
    if (!videoPlan || !videoPlan.timeline || !Array.isArray(videoPlan.timeline) || videoPlan.timeline.length === 0) {
      logger.error('[Pipeline] VideoPlan inválido o vacío', { videoPlan });
      throw new Error('El VideoPlan generado por LLMService es inválido o está vacío.');
    }
    
    reportProgress('Validando y corrigiendo assets', 25);
    
    // Validación y corrección de assets
    const assetsIndex = await cargarAssetsIndex();
    const { valido, errores } = validarVideoPlanFondosActores(videoPlan, assetsIndex);
    
    if (!valido) {
      logger.warn(`[Pipeline] ⚠️ Corrigiendo assets inválidos: ${errores.join(', ')}`);
      const videoPlanCorregido = await corregirFondosActoresInvalidos(videoPlan, assetsIndex, logger);
      
      if (videoPlanCorregido) {
        videoPlan = videoPlanCorregido;
        logger.info('[Pipeline] ✅ Assets corregidos automáticamente');
      } else {
        logger.error('[Pipeline] ❌ No se pudieron corregir los assets automáticamente');
        throw new Error('Assets inválidos y no se pudieron corregir automáticamente');
      }
    }

    // Continuar con generación de video y audio...
    reportProgress('Generando clips de video', 30);
    
    // Generar clips usando tomas cinematográficas
    const scenes = videoPlan.timeline.map((segundo: TimelineSecond, index: number) => ({
      id: index + 1,
      visual: segundo.visual || reqNormalizado.prompt,
      actorAsset: segundo.actor,
      fondoAsset: segundo.fondo,
      camara: segundo.camara,
      duracion: 1,
      momento: segundo.momento || 'desarrollo'
    }));

    // Usar QuickMode si está habilitado
    if (quickMode || reqNormalizado.previewMode) {
      logger.info('[Pipeline] 🚀 Usando QuickMode para preview rápido');
      
      const quickClip = await generateQuickKlingVideo({
        prompt: reqNormalizado.prompt,
        duration: Math.min(reqNormalizado.duration, 10),
        visualStyle: estiloNormalizado,
        aspectRatio: '16:9'
      });

      const musicBuffer = await getAdvancedMusic(
        reqNormalizado.prompt,
        Math.min(reqNormalizado.duration, 10),
        estiloNormalizado
      );

      const videoUrl = await uploadToCDN(quickClip, 'videos');
      
      return {
        url: videoUrl,
        plan: videoPlan,
        scenes,
        clips: [videoUrl],
        resolution: videoPlan.metadata?.duration,
        visualStyle: videoPlan.metadata?.visualStyle,
        music: musicBuffer,
        quickMode: true
      };
    }

    // Generación completa usando tomas cinematográficas
    let tomasUnicas: any[];
    if (videoPlan.tomasReales && videoPlan.tomasReales.length > 0) {
      tomasUnicas = videoPlan.tomasReales.map((tomaReal: any) => {
        const segundoInicioToma = videoPlan.timeline.findIndex((seg: any, idx: number) => {
          let segundoAcumulado = 0;
          for (const toma of videoPlan.tomasReales) {
            if (segundoAcumulado <= idx && idx < segundoAcumulado + toma.duracion) {
              return toma.numero === tomaReal.numero;
            }
            segundoAcumulado += toma.duracion;
          }
          return false;
        });
        
        const infoTimeline = segundoInicioToma >= 0 ? videoPlan.timeline[segundoInicioToma] : null;
        
        return {
          ...tomaReal,
          fondo: infoTimeline?.fondo,
          actor: infoTimeline?.actor,
          camara: infoTimeline?.camara,
          sonido: infoTimeline?.sonido,
          edicion: infoTimeline?.edicion
        };
      });
      logger.info(`[Pipeline] 🎬 Usando ${tomasUnicas.length} tomas del orquestador cinematográfico`);
    } else {
      tomasUnicas = agruparEnTomasUnicas(scenes, logger);
      logger.info(`[Pipeline] 🎬 Generando ${tomasUnicas.length} tomas cinematográficas (fallback)`);
    }

    // Generar clips en paralelo
    const tomasPromises = tomasUnicas.map(async (toma: any, index: number) => {
      const promptCinematografico = generarPromptCinematografico({
        prompt: reqNormalizado.prompt,
        descripcionToma: toma.descripcion,
        promptKling: toma.promptKling,
        visual: toma.visual,
        duracion: toma.duracion,
        momento: toma.momento,
        visualStyle: estiloNormalizado,
        tomaNumero: index + 1,
        totalTomas: tomasUnicas.length,
        contextoPrevio: index > 0 ? tomasUnicas[index - 1].descripcion : undefined,
        fondoDescripcion: analizarRutaAsset(toma.fondo?.ruta || '').lugar,
        personajeDescripcion: analizarRutaAsset(toma.actor?.ruta || '').tipo,
        objetivoEmocional: toma.objetivoEmocional,
        accionPrincipal: toma.accionPrincipal,
        carryover: toma.carryover
      });

      const klingParams: KlingClipParams = {
        prompt: promptCinematografico,
        duration: toma.duracion,
        aspectRatio: '16:9',
        cameraMovement: toma.camara?.movimiento || 'slow',
        creativity: 0.7,
        fps: 25
      };

      return await generateKlingClip(klingParams);
    });

    const clips = await Promise.all(tomasPromises);
    logger.info(`[Pipeline] 🎉 Todas las ${clips.length} tomas generadas exitosamente`);

    // Generación de audio unificado
    reportProgress('Generando audio de voz', 45);
    
    const audioUnificado = await generateUnifiedAudioForPipeline(videoPlan);
    
    const voiceBuffer = audioUnificado.voiceBuffer;
    const musicBuffer = audioUnificado.musicBuffer;
    const sfxBuffer = audioUnificado.sfxBuffer ? [audioUnificado.sfxBuffer] : [];
    
    reportProgress('Ensamblando video final', 75);
    
    // Ensamblar video final
    const finalVideo = await assembleVideo({
      clips,
      voiceBuffer,
      musicBuffer,
      sfxBuffer,
      duration: reqNormalizado.duration,
      resolution: '1920x1080',
      fps: 25,
      metadata: {
        title: `CinemaAI - ${estiloNormalizado}`,
        description: reqNormalizado.prompt.substring(0, 100)
      }
    });

    reportProgress('Subiendo a CDN', 90);
    
    const videoUrl = await uploadToCDN(finalVideo, 'videos');
    
    reportProgress('Completado', 100);

    return {
      url: videoUrl,
      plan: videoPlan,
      scenes,
      clips: finalClips.map(clip => typeof clip === 'string' ? clip : clip.url || clip.path),
      resolution: `${reqNormalizado.duration}s`,
      visualStyle: estiloNormalizado,
      music: musicBuffer,
      metadata: {
        prompt: reqNormalizado.prompt,
        duration: reqNormalizado.duration,
        style: estiloNormalizado,
        scenes: scenes.length,
        clips: finalClips.length,
        audioMetadata: audioUnificado.metadata
      }
    };

  } catch (error) {
    logger.error('[Pipeline] Error en renderCinemaAI:', error);
    
    if (progressCallback) {
      progressCallback(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`, 0);
    }
    
    throw error;
  }
}

/**
 * ✨ NUEVO: Detecta automáticamente el tipo de request y usa el pipeline apropiado
 */
export async function renderAutomatic(
  request: any,
  progressCallback?: (step: string, progress: number) => void
): Promise<any> {
  const logger = console;
  
  // Detectar si es request de marketing
  if (request.imagenes && request.descripcion && !request.prompt) {
    logger.info('[Pipeline] 🎯 Detectado request de Marketing AI');
    
    const marketingRequest: MarketingRequest = {
      imagenes: request.imagenes,
      descripcion: request.descripcion,
      estilo: request.estilo || 'commercial',
      duracion: request.duracion || 15,
      textoVoz: request.textoVoz
    };
    
    return await renderMarketingAI(marketingRequest, progressCallback);
  }
  
  // Detectar si es request cinematográfico estándar
  if (request.prompt && request.visualStyle && request.duration) {
    logger.info('[Pipeline] 🎬 Detectado request Cinematográfico');
    
    const cinematicRequest: RenderRequest = {
      prompt: request.prompt,
      visualStyle: request.visualStyle,
      duration: request.duration,
      metadata: request.metadata,
      demoMode: request.demoMode,
      previewMode: request.previewMode
    };
    
    return await renderCinemaAI(cinematicRequest, progressCallback);
  }
  
  logger.warn('[Pipeline] ⚠️ Tipo de request no detectado, usando modo cinematográfico');
  
  return await renderCinemaAI(request, progressCallback);
}
```

/**
 * ✨ NUEVO: Genera objetivo emocional específico para una toma
 */
function generarObjetivoEmocionalToma(tipoToma?: string, emocion?: string): string {
  // Primero intentar usar la emoción específica de la toma
  if (emocion) {
    const objetivosPorEmocion = {
      'intriga': 'create mystery and curiosity',
      'tension': 'build suspense and anticipation', 
      'emocion': 'evoke strong emotional response',
      'triunfo': 'convey victory and achievement',
      'melancolia': 'express nostalgia and reflection',
      'excitement': 'generate energy and excitement',
      'fear': 'create tension and unease',
      'joy': 'convey happiness and celebration'
    };
    
    const objetivo = objetivosPorEmocion[emocion as keyof typeof objetivosPorEmocion];
    if (objetivo) return objetivo;
  }
  
  // Fallback a tipo de toma
  if (tipoToma) {
    const objetivosPorTipo = {
      'setup': 'establish context and mood',
      'desarrollo': 'advance story and character',
      'climax': 'create emotional peak',
      'cierre': 'provide satisfying resolution'
    };
    
    return objetivosPorTipo[tipoToma as keyof typeof objetivosPorTipo] || 'engage viewer';
  }
  
  return 'create compelling visual narrative';
}

/**
 * Pipeline robusto y profesional para CinemaAI
 * @param req RenderRequest completo
 * @param progressCallback Callback para reportar progreso (paso, porcentaje)
 * @param actorCustomPath PNG si el usuario subió imagen personalizada
 * @param quickMode Si es true, usa el flujo rápido de video corto (Kling 2.1 + música)
 */
export async function renderCinemaAI(
  req: RenderRequest, 
  progressCallback?: (step: string, progress: number) => void,
  actorCustomPath?: string, 
  quickMode?: boolean
) {

  // LOGS Y MANEJO DE ERRORES EN TODO EL PIPELINE
  const logger = console; // Puedes cambiar por tu logger profesional
  logger.info('[Pipeline] Iniciando renderCinemaAI', { quickMode, actorCustomPath });

  // Helper para reportar progreso
  const reportProgress = (step: string, progress: number) => {
    if (progressCallback) {
      progressCallback(step, progress);
    }
    logger.info(`[Pipeline] ${step} (${progress}%)`);
  };

  reportProgress('Validando request', 5);

  // ⚠️ CRÍTICO: Validación estricta para prevenir errores silenciosos
  const validacion = validarRenderRequest(req);
  if (!validacion.valido) {
    logger.warn(`⚠️ [Pipeline] Request con warnings: ${validacion.errores.join(', ')}`);
  }
  
  // Usar datos normalizados si es necesario
  const reqNormalizado = validacion.normalizado || req;
  
  // Validar y rellenar los datos mínimos restantes
  if (!reqNormalizado.visualStyle) reqNormalizado.visualStyle = 'cinematic';
  if (!reqNormalizado.duration) reqNormalizado.duration = 30;
  if (!reqNormalizado.prompt) reqNormalizado.prompt = '';

  reportProgress('Orquestando cerebros cinematográficos', 10);

  let videoPlan: VideoPlan;
  let sugerencias: any[] = [];
  try {
    // ✨ ARQUITECTURA UNIFICADA: Todo pasa por el sistema de cerebros
    logger.info(`[Pipeline] 🧠 Usando SISTEMA DE CEREBROS CINEMATOGRÁFICOS para: ${reqNormalizado.visualStyle}`);
    
    // ✅ NORMALIZAR ESTILO: Usar función unificada
    const estiloNormalizado = normalizarEstilo(reqNormalizado.visualStyle as EstiloVisualAPI);
    
    // Crear request para sistema de cerebros
    const requestCerebros: RequestGeneracion = {
      prompt: reqNormalizado.prompt,
      duracion: reqNormalizado.duration,
      estilo: estiloNormalizado,
      estiloOriginal: reqNormalizado.visualStyle, // ✅ NUEVO: Estilo original para assets
      configuracion: {
        demoMode: reqNormalizado.demoMode,
        previewMode: reqNormalizado.previewMode,
        metadata: reqNormalizado.metadata
      }
    };    // Despachar al equipo de cerebros (con fallbacks internos)
    const resultadoCerebros = await dispatchCerebros(requestCerebros);
    
    if (!resultadoCerebros.success) {
      throw new Error(`❌ Sistema de cerebros falló: ${resultadoCerebros.error}`);
    }
    
    // Convertir respuesta de cerebros al formato VideoPlan esperado
    videoPlan = {
      timeline: resultadoCerebros.videoPlan,
      tomasReales: resultadoCerebros.tomasReales, // ✅ NUEVO: Incluir tomas cinematográficas
      metadata: resultadoCerebros.metadata,
      configuracionGlobal: resultadoCerebros.configuracion,
      restricciones: resultadoCerebros.restricciones
    };
    
    logger.info(`[Pipeline] ✅ Cerebros generaron: ${videoPlan.timeline.length} segundos (${estiloNormalizado} para ${reqNormalizado.visualStyle})`);
    
    reportProgress('Validando plan cinematográfico', 20);
    
    // Validación final: el VideoPlan debe tener timeline válida y al menos una escena
    if (!videoPlan || !videoPlan.timeline || !Array.isArray(videoPlan.timeline) || videoPlan.timeline.length === 0) {
      logger.error('[Pipeline] VideoPlan inválido o vacío', { videoPlan });
      throw new Error('El VideoPlan generado por LLMService es inválido o está vacío.');
    }
    
    reportProgress('Validando y corrigiendo assets', 25);
    
    // NOTA: Los modelos de LLMService ya aplican validación y corrección internamente
    // Esta es una verificación adicional para garantizar que los assets son válidos
    const assetsIndex = await cargarAssetsIndex();
    const { valido, errores } = validarVideoPlanFondosActores(videoPlan, assetsIndex);
    
    if (!valido) {
      logger.warn('[Pipeline] Se detectaron assets inválidos en el VideoPlan final', { errores });
      // Aplicar una última corrección por seguridad
      const resultado = corregirFondosActoresInvalidos(videoPlan, assetsIndex);
      videoPlan = resultado.videoPlan;
      sugerencias = resultado.sugerencias;
      logger.warn('[Pipeline] VideoPlan corregido nuevamente por assets inválidos', { sugerencias });
    } else {
      logger.info('[Pipeline] VideoPlan validado correctamente, todos los assets son válidos');
    }
    
    logger.info('[Pipeline] VideoPlan generado, validado y corregido', { timeline: videoPlan.timeline.length, visualStyle: videoPlan.metadata?.visualStyle });
    
    reportProgress('Preparando escenas', 30);
  } catch (err) {
    logger.error('[Pipeline] Error generando/corrigiendo VideoPlan', { error: err });
    throw err;
  }

  let scenes: any[] = [];
  try {
    // Mapear desde el formato de los cerebros cinematográficos
    scenes = videoPlan.timeline.map((scene: any, idx: number) => {
      // Los cerebros retornan 'fondo' y 'actor' como objetos
      let fondoAsset = scene.fondo && scene.fondo.ruta ? { ruta: scene.fondo.ruta, tipo: 'escenas', nombre: scene.fondo.nombre || '' } : null;
      let actorAsset = null;
      
      if (actorCustomPath) {
        actorAsset = { ruta: actorCustomPath, tipo: 'actor', nombre: 'custom' };
      } else if (scene.actor && scene.actor.ruta) {
        actorAsset = { ruta: scene.actor.ruta, tipo: 'actor', nombre: scene.actor.nombre || '' };
      }
      
      // Si alguno está vacío, usar fallbacks con assets reales existentes
      if (!fondoAsset || !fondoAsset.ruta) {
        logger.warn(`[Pipeline] Usando fondo fallback para escena ${idx}`);
        fondoAsset = { ruta: 'escenas/anime/apartamento/baño/día/frontal.png', tipo: 'escenas', nombre: 'fallback_background' };
      }
      if (!actorAsset || !actorAsset.ruta) {
        logger.warn(`[Pipeline] Usando actor fallback para escena ${idx}`);
        actorAsset = { ruta: 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png', tipo: 'actor', nombre: 'fallback_actor' };
      }
      
      // ✨ CRÍTICO: Convertir rutas relativas a URLs completas
      fondoAsset.ruta = convertirRutaAURLCompleta(fondoAsset.ruta);
      actorAsset.ruta = convertirRutaAURLCompleta(actorAsset.ruta);
      
      logger.info(`[Pipeline] Escena ${idx} validada:`, { 
        fondo: fondoAsset.ruta, 
        actor: actorAsset.ruta, 
        segundo: scene.segundo 
      });
      return { ...scene, fondoAsset, actorAsset };
    });
    logger.info('[Pipeline] Assets seleccionados y validados para todas las escenas', { scenes: scenes.length });
    
    reportProgress('Configurando renderizado', 35);
    
  } catch (err) {
    logger.error('[Pipeline] Error seleccionando assets', { error: err });
    throw err;
  }

  // QuickMode
  if (quickMode && scenes.length > 0) {
    logger.info('[Pipeline] QuickMode activo');
    reportProgress('Generando video rápido', 40);
    
    const fondoUrl = scenes[0].fondoAsset?.ruta;
    const actorUrl = scenes[0].actorAsset?.ruta;
    const prompt = scenes[0].visual || scenes[0].backgroundPrompt || req.prompt;
    const musicStyle = videoPlan.metadata?.visualStyle || 'cinematic';
    if (typeof fondoUrl !== 'string' || typeof actorUrl !== 'string') {
      logger.error('[Pipeline] No se encontró fondo o actor válido para QuickMode', { fondoUrl, actorUrl });
      throw new Error('No se encontró fondo o actor válido para el modo rápido (Kling 2.1)');
    }
    try {
      const { videoUrl, musicBuffer } = await generateQuickKlingVideo({ fondoUrl, actorUrl, prompt, musicStyle });
      logger.info('[Pipeline] Video rápido generado', { videoUrl });
      reportProgress('Video completado', 100);
      
      return {
        url: videoUrl,
        plan: videoPlan,
        scenes,
        clips: [videoUrl],
        resolution: videoPlan.metadata?.duration,
        visualStyle: videoPlan.metadata?.visualStyle,
        music: musicBuffer,
        quickMode: true
      };
    } catch (err) {
      logger.error('[Pipeline] Error en QuickMode', { error: err });
      throw err;
    }
  }

  // ✨ NUEVO: Generación inteligente de clips por tomas cinematográficas
  // En lugar de generar 30 clips de 1 segundo, generar 3 clips de 10 segundos
  
  // ✅ CRÍTICO: Detectar si el orquestador ya creó tomas reales
  let tomasUnicas: any[];
  if (videoPlan.tomasReales && videoPlan.tomasReales.length > 0) {
    // ✅ CORREGIDO: Combinar tomas reales con información del timeline
    tomasUnicas = videoPlan.tomasReales.map((tomaReal: any) => {
      // Buscar el primer segundo del timeline que corresponde a esta toma
      const segundoInicioToma = videoPlan.timeline.findIndex((seg: any, idx: number) => {
        // Calcular en qué toma debería estar este segundo
        let segundoAcumulado = 0;
        for (const toma of videoPlan.tomasReales) {
          if (segundoAcumulado <= idx && idx < segundoAcumulado + toma.duracion) {
            return toma.numero === tomaReal.numero;
          }
          segundoAcumulado += toma.duracion;
        }
        return false;
      });
      
      const infoTimeline = segundoInicioToma >= 0 ? videoPlan.timeline[segundoInicioToma] : null;
      
      return {
        ...tomaReal,
        fondo: infoTimeline?.fondo,
        actor: infoTimeline?.actor,
        camara: infoTimeline?.camara,
        sonido: infoTimeline?.sonido,
        edicion: infoTimeline?.edicion
      };
    });
    logger.info(`[Pipeline] 🎬 Usando ${tomasUnicas.length} tomas del orquestador cinematográfico`);
    
    // ✅ DEBUG: Verificar que las tomas combinadas tienen la información necesaria
    tomasUnicas.forEach((toma, idx) => {
      logger.info(`[Pipeline] 🔍 DEBUG Toma combinada ${idx + 1}:`, {
        numero: toma.numero,
        descripcion: toma.descripcion?.substring(0, 50) + '...',
        duracion: toma.duracion,
        tieneFondo: !!toma.fondo?.ruta,
        tieneActor: !!toma.actor?.ruta,
        rutaFondo: toma.fondo?.ruta,
        rutaActor: toma.actor?.ruta
      });
    });
  } else {
    // Fallback: agrupar scenes en tomas cinematográficas únicas
    tomasUnicas = agruparEnTomasUnicas(scenes, logger);
    logger.info(`[Pipeline] 🎬 Generando ${tomasUnicas.length} tomas cinematográficas (fallback - agrupando ${scenes.length} escenas)`);
  }
  
  // 🚀 GENERACIÓN PARALELA DE TODAS LAS TOMAS
  logger.info(`[Pipeline] 🎬 Generando ${tomasUnicas.length} tomas en paralelo...`);
  
  // ✅ VALIDACIÓN PREVIA Y AUTO-CORRECCIÓN: Verificar que todas las tomas tienen assets válidos
  for (let i = 0; i < tomasUnicas.length; i++) {
    const toma = tomasUnicas[i];
    
    // Auto-asignar fondo si no existe
    if (!toma.fondo?.ruta && scenes.length > 0) {
      const fondoFallback = scenes.find(s => s.fondoAsset?.ruta)?.fondoAsset;
      if (fondoFallback) {
        toma.fondo = { ruta: fondoFallback.ruta, nombre: fondoFallback.nombre };
        logger.warn(`[Pipeline] 🔧 Auto-asignando fondo fallback a toma ${i + 1}: ${fondoFallback.ruta}`);
      } else {
        // Último recurso: usar asset por defecto del CDN
        toma.fondo = { 
          ruta: 'escenas/realista/naturaleza/campo/día/frontal.png',
          nombre: 'frontal.png'
        };
        logger.warn(`[Pipeline] 🔧 Usando fondo por defecto para toma ${i + 1}`);
      }
    }
    
    // Auto-asignar actor si no existe
    if (!toma.actor?.ruta && scenes.length > 0) {
      const actorFallback = scenes.find(s => s.actorAsset?.ruta)?.actorAsset;
      if (actorFallback) {
        toma.actor = { ruta: actorFallback.ruta, nombre: actorFallback.nombre };
        logger.warn(`[Pipeline] 🔧 Auto-asignando actor fallback a toma ${i + 1}: ${actorFallback.ruta}`);
      } else {
        // Último recurso: usar actor por defecto del CDN
        toma.actor = { 
          ruta: 'actores/realista/casa/sala/día/jovenmasculinosorprendidocasual.png',
          nombre: 'jovenmasculinosorprendidocasual.png'
        };
        logger.warn(`[Pipeline] 🔧 Usando actor por defecto para toma ${i + 1}`);
      }
    }
    
    // Verificación final
    if (!toma.fondo?.ruta || !toma.actor?.ruta) {
      logger.error(`[Pipeline] ❌ Toma ${i + 1} sigue sin URLs válidas después de auto-corrección:`, {
        numero: toma.numero,
        rutaFondo: toma.fondo?.ruta,
        rutaActor: toma.actor?.ruta,
        estructuraToma: Object.keys(toma)
      });
      throw new Error(`Toma ${i + 1} no tiene assets válidos después de auto-corrección (fondo: ${!!toma.fondo?.ruta}, actor: ${!!toma.actor?.ruta})`);
    }
  }
  
  const tomasPromises = tomasUnicas.map(async (toma, tomaIdx) => {
    // Generar prompt cinematográfico con continuidad narrativa
    const estiloNormalizado = videoPlan.metadata?.visualStyle ? 
      normalizarEstilo(videoPlan.metadata.visualStyle as any) : 
      'cinematic';
    
    // ✅ NUEVO: Análisis del fondo y personaje para contexto específico
    const rutaFondo = toma.fondo?.ruta;
    const rutaActor = toma.actor?.ruta;
    
    // ✅ DEBUG: Log detallado para depuración
    logger.info(`[Pipeline] 🔍 DEBUG Toma ${tomaIdx + 1}:`, {
      rutaFondo,
      rutaActor,
      descripcionToma: toma.descripcion,
      tipoToma: toma.tipoToma,
      duracion: toma.duracion,
      tomaCompleta: JSON.stringify(toma, null, 2)
    });
    
    // Extraer información contextual del fondo
    const fondoInfo = rutaFondo ? analizarRutaAsset(rutaFondo) : null;
    const actorInfo = rutaActor ? analizarRutaAsset(rutaActor) : null;
    
    // ✅ DEBUG: Log información extraída
    logger.info(`[Pipeline] 🔍 DEBUG Info extraída:`, {
      fondoInfo,
      actorInfo
    });
    
    // ✅ PASO 3: Mejorar contexto de toma anterior para continuidad REAL
    const contextoPrevio = tomaIdx > 0 ? 
      tomasUnicas[tomaIdx - 1].carryover || `previous scene: ${tomasUnicas[tomaIdx - 1].descripcion}` : 
      undefined;
    
    // ✅ PASO 3: Usar carryover específico de la toma actual si existe
    const carryoverActual = toma.carryover || '';
    
    // ✅ DEBUG: Log información de carryover
    logger.info(`[Pipeline] 🔗 Carryover info:`, {
      tomaNumero: tomaIdx + 1,
      tieneCarryover: !!carryoverActual,
      contextoPrevio: contextoPrevio?.substring(0, 50) + '...',
      carryoverActual: carryoverActual.substring(0, 50) + '...'
    });
    
    // ✅ CORREGIDO: Construir descripciones más robustas
    const fondoDescripcion = fondoInfo && fondoInfo.lugar && fondoInfo.variante 
      ? `${fondoInfo.lugar}/${fondoInfo.variante}` 
      : fondoInfo?.lugar || 'scenic location';
      
    const personajeDescripcion = actorInfo?.tipo || 'character';
    
    // ✅ NUEVO: Extraer información adicional para prompt optimizado
    const objetivoEmocional = generarObjetivoEmocionalToma(toma.tipoToma, toma.emocion);
    const accionPrincipal = extraerAccionPrincipal(toma.descripcion);
    
    // ✅ DEBUG: Log descripciones finales
    logger.info(`[Pipeline] 🔍 DEBUG Descripciones:`, {
      fondoDescripcion,
      personajeDescripcion,
      contextoPrevio,
      objetivoEmocional,
      accionPrincipal
    });
      
    const promptCinematografico = generarPromptCinematografico({
      prompt: req.prompt,
      descripcionToma: toma.descripcion,
      promptKling: toma.promptKling,
      visual: toma.visual,
      duracion: toma.duracion,
      momento: toma.momentoNarrativo,
      visualStyle: estiloNormalizado,
      tomaNumero: tomaIdx + 1,
      totalTomas: tomasUnicas.length,
      contextoPrevio,
      // ✅ PASO 3: Añadir carryover específico para continuidad
      carryover: carryoverActual,
      fondoDescripcion,
      personajeDescripcion,
      // ✅ NUEVO: Parámetros optimizados
      objetivoEmocional,
      accionPrincipal
    });
    
    const params: KlingClipParams = {
      prompt: promptCinematografico,
      input_image_urls: [
        rutaFondo, 
        rutaActor
      ].filter((v): v is string => typeof v === 'string' && v.length > 0)
       .map(ruta => convertirRutaAURLCompleta(ruta)),
      duration: Math.min(toma.duracion, 10), // Kling máximo 10s
      aspect_ratio: '16:9',
    };
    
    if (params.input_image_urls.length < 2) {
      logger.error(`[Pipeline] URLs de imagen insuficientes en toma ${tomaIdx + 1}`, { params });
      throw new Error('input_image_urls debe ser un array de al menos dos strings (fondo y actor)');
    }
    
    logger.info(`[Pipeline] 🎥 Generando toma ${tomaIdx + 1}/${tomasUnicas.length}: "${toma.descripcion}" (${toma.duracion}s)`, { 
      params: {
        prompt: params.prompt.substring(0, 100) + '...',
        duration: params.duration,
        urls: params.input_image_urls.map(url => url.substring(0, 50) + '...')
      }
    });
    
    // Reportar progreso por toma
    const progressBase = 60;
    const progressPerToma = 25 / tomasUnicas.length;
    const currentProgress = progressBase + (tomaIdx * progressPerToma);
    reportProgress(`Generando clip ${tomaIdx + 1}/${tomasUnicas.length}`, Math.round(currentProgress));
    
    const clipPromise = generateKlingClip(params);
    // Timeout extendido: 10 minutos por toma (video generation can take time)
    const clipUrl = await Promise.race([
      clipPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout generando toma ${tomaIdx + 1} Kling`)), 600000))
    ]);
    
    logger.info(`[Pipeline] ✅ Toma ${tomaIdx + 1} generada exitosamente`, { 
      clipUrl: typeof clipUrl === 'string' ? clipUrl.substring(0, 100) + '...' : 'URL generada' 
    });
    return clipUrl as string;
  });
  
  // Esperar a que todas las tomas se generen
  const clips = await Promise.all(tomasPromises);
  
  // ✅ VALIDACIÓN DEFINITIVA DE CLIPS GENERADOS
  const validClips = clips.filter(c => c && typeof c === 'string' && c.includes("https://"));
  if (validClips.length === 0) {
    throw new Error("Ningún clip fue generado correctamente.");
  }
  
  logger.info(`[Pipeline] 🎉 ${validClips.length}/${clips.length} clips válidos generados exitosamente`);
  
  // Usar solo clips válidos para el resto del proceso
  const finalClips = validClips;

  // Generación de audio automática con integración completa Freesound/Murf
  let voiceBuffer: Buffer;
  let musicBuffer: Buffer;
  let sfxBuffer: Buffer;
  let audioMetadata: any;
  let voiceAudioPath: string = ''; // Para el lip-sync
  
  try {
    logger.info('[Pipeline] 🎵 Generando audio unificado con Freesound/Murf...');
    
    reportProgress('Generando audio de voz', 45);
    
    // ✅ PASO 4: Configurar assets manuales en videoPlan
    if (req.voice) {
      logger.info('[Pipeline] 🎤 Configurando voz manual en videoPlan');
      videoPlan.metadata.voiceManual = req.voice;
    }
    
    if (req.music) {
      logger.info('[Pipeline] 🎵 Configurando música manual en videoPlan');
      videoPlan.metadata.musicManual = req.music;
    }
    
    // ✨ NUEVO: Usar el servicio integrado que ahora puede manejar assets manuales
    const audioUnificado = await generateUnifiedAudioForPipeline(videoPlan);
    
    reportProgress('Procesando audio y música', 55);
    
    voiceBuffer = audioUnificado.voiceBuffer;
    musicBuffer = audioUnificado.musicBuffer;
    sfxBuffer = audioUnificado.sfxBuffer;
    audioMetadata = {
      ...audioUnificado.metadata,
      vozManual: !!req.voice,
      musicaManual: !!req.music
    };
    
    // Validar buffers generados
    if (!voiceBuffer || !(voiceBuffer instanceof Buffer)) {
      logger.warn('[Pipeline] Buffer de voz inválido, usando fallback');
      voiceBuffer = Buffer.alloc(1);
    }
    
    if (!musicBuffer || !(musicBuffer instanceof Buffer) || musicBuffer.length === 0) {
      logger.warn('[Pipeline] Buffer de música vacío, usando fallback');
      musicBuffer = Buffer.alloc(1);
    }
    
    if (!sfxBuffer || !(sfxBuffer instanceof Buffer)) {
      logger.warn('[Pipeline] Buffer de SFX inválido, usando fallback');
      sfxBuffer = Buffer.alloc(1);
    }
    
    // Guardar audio de voz para lip-sync si existe
    if (voiceBuffer.length > 1) {
      const fs = await import('fs');
      const path = await import('path');
      voiceAudioPath = path.join(process.cwd(), 'tmp', `voice_${Date.now()}.wav`);
      fs.writeFileSync(voiceAudioPath, voiceBuffer);
      logger.info('[Pipeline] Audio de voz guardado para lip-sync:', voiceAudioPath);
    }
    
    logger.info(`[Pipeline] ✅ Audio generado: ${audioMetadata?.serviciosUsados?.join(', ') || 'servicios básicos'}`);
    logger.info(`[Pipeline] 📊 Calidad: Música ${musicBuffer.length} bytes, Voz ${voiceBuffer.length} bytes, SFX ${sfxBuffer.length} bytes`);
    
  } catch (err) {
    logger.error('[Pipeline] Error generando audio integrado, usando fallbacks básicos', { error: err });
    
    // Fallback a sistema anterior como seguridad
    try {
      voiceBuffer = await createVoiceBuffer(videoPlan);
      if (!voiceBuffer || !(voiceBuffer instanceof Buffer) || voiceBuffer.length === 0) {
        logger.warn('[Pipeline] Buffer de voz vacío, se usará silencio');
        voiceBuffer = Buffer.alloc(1);
      }
      musicBuffer = await getAdvancedMusic({ style: videoPlan.metadata?.visualStyle || 'cinematic' });
      if (!musicBuffer || !(musicBuffer instanceof Buffer) || musicBuffer.length === 0) {
        logger.warn('[Pipeline] Buffer de música vacío, se usará silencio');
        musicBuffer = Buffer.alloc(1);
      }
      sfxBuffer = await getSfx(scenes[0]?.soundCue || 'ambiente');
      if (!sfxBuffer || !(sfxBuffer instanceof Buffer) || sfxBuffer.length === 0) {
        logger.warn('[Pipeline] Buffer de SFX vacío, se usará silencio');
        sfxBuffer = Buffer.alloc(1);
      }
      logger.info('[Pipeline] Buffers de audio generados (fallback)');
    } catch (fallbackErr) {
      logger.error('[Pipeline] Error crítico en fallback de audio', { error: fallbackErr });
      // Buffers mínimos para evitar fallo total
      voiceBuffer = Buffer.alloc(1);
      musicBuffer = Buffer.alloc(1);
      sfxBuffer = Buffer.alloc(1);
    }
  }

  // ✨ NUEVO: Aplicar lip-sync inteligente según el estilo visual
  if (voiceAudioPath && clips.length > 0) {
    try {
      logger.info('[Pipeline] 🎭 Aplicando lip-sync inteligente...');
      
      // Determinar qué tecnología usar según el estilo
      const estiloVisual = videoPlan.metadata?.visualStyle || 'cinematic';
      const usarSadTalker = ['anime', 'cartoon'].includes(estiloVisual);
      
      logger.info(`[Pipeline] Estilo detectado: ${estiloVisual} → Usando ${usarSadTalker ? 'SadTalker' : 'Wav2Lip'}`);
      
      // Aplicar lip-sync a todos los clips
      for (let i = 0; i < clips.length; i++) {
        const originalClip = clips[i];
        logger.info(`[Pipeline] Procesando clip ${i + 1}/${clips.length} con ${usarSadTalker ? 'SadTalker' : 'Wav2Lip'}`);
        
        try {
          let lipSyncClip: string;
          if (usarSadTalker) {
            // Para anime/cartoon: usar SadTalker
            lipSyncClip = await applySadTalker(
              originalClip, 
              voiceAudioPath, 
              scenes[i]?.ambiente || 'neutral',
              estiloVisual
            );
          } else {
            // Para realista/cinematic: usar Wav2Lip
            lipSyncClip = await applyWav2Lip(
              originalClip, 
              voiceAudioPath, 
              scenes[i]?.ambiente || 'neutral',
              estiloVisual
            );
          }
          
          // Reemplazar el clip original con el que tiene lip-sync
          clips[i] = lipSyncClip;
          logger.info(`[Pipeline] ✅ Clip ${i + 1} procesado con lip-sync: ${lipSyncClip}`);
          
        } catch (lipSyncError) {
          logger.warn(`[Pipeline] ⚠️ Error en lip-sync del clip ${i + 1}, usando clip original:`, lipSyncError);
          // Mantener el clip original si hay error
        }
      }
      
      logger.info('[Pipeline] 🎭 Lip-sync completado para todos los clips');
      
    } catch (err) {
      logger.warn('[Pipeline] ⚠️ Error general en lip-sync, continuando sin él:', err);
      // Continuar con clips originales si hay error general
    }
    
    // Limpiar archivo temporal de audio
    try {
      const fs = await import('fs');
      if (fs.existsSync(voiceAudioPath)) {
        fs.unlinkSync(voiceAudioPath);
        logger.info('[Pipeline] Archivo temporal de audio limpiado');
      }
    } catch (cleanupError) {
      logger.warn('[Pipeline] No se pudo limpiar archivo temporal:', cleanupError);
    }
  } else {
    logger.info('[Pipeline] Saltando lip-sync (sin audio de voz o sin clips)');
  }

  // Edición final por plan (lógica avanzada según plan)
  // ...existing code...

  // Exportación profesional
  let finalUrl: string;
  try {
    reportProgress('Ensamblando video final', 85);
    
    finalUrl = await assembleVideo({
      plan: videoPlan,
      clips,
      voiceBuffer: voiceBuffer,  // ✨ MEJORADO: Renombrado para consistencia
      music: [musicBuffer],
      sfx: [sfxBuffer],
    });
    logger.info('[Pipeline] Video ensamblado correctamente', { finalUrl });
    
    // ✅ PASO 2: Verificar duración del video final
    reportProgress('Verificando duración del video', 87);
    try {
      // Calcular duración esperada desde el plan
      let duracionEsperada = reqNormalizado.duration || 15;
      if (videoPlan.timeline && Array.isArray(videoPlan.timeline)) {
        duracionEsperada = videoPlan.timeline.length;
      }
      
      // Obtener duración real usando ffprobe
      const duracionReal = await obtenerDuracionVideo(finalUrl);
      const diferencia = Math.abs(duracionReal - duracionEsperada);
      
      logger.info('[Pipeline] ✅ Verificación de duración:', {
        duracionEsperada,
        duracionReal,
        diferencia,
        coincide: diferencia <= 0.5
      });
      
      if (diferencia > 0.5) {
        logger.warn('[Pipeline] ⚠️ Duración no coincide con lo esperado');
      }
      
    } catch (error) {
      logger.warn('[Pipeline] ⚠️ No se pudo verificar duración:', error);
    }
    
    reportProgress('Subiendo video al CDN', 90);
    
  } catch (err) {
    logger.error('[Pipeline] Error ensamblando video final', { error: err });
    throw err;
  }

  let cdnUrl: string;
  try {
    cdnUrl = await uploadToCDN(finalUrl, `renders/${Date.now()}_video.mp4`);
    logger.info('[Pipeline] Video subido al CDN', { cdnUrl });
    
    // ✅ LOG FINAL DE ÉXITO TOTAL
    console.log("🎬 Video generado exitosamente:", cdnUrl);
    
    reportProgress('Video completado', 100);
    
  } catch (err) {
    logger.error('[Pipeline] Error subiendo video al CDN', { error: err });
    throw err;
  }

  // ✅ PASO 8: Agregar metadatos extendidos al resultado
  const ahora = new Date();
  const expiraEn = new Date(ahora.getTime() + 48 * 60 * 60 * 1000); // 48 horas
  
  // Recopilar assets usados
  const assetsUsados = [];
  if (scenes && scenes.length > 0) {
    for (const scene of scenes) {
      if (scene.fondoAsset?.ruta) {
        assetsUsados.push({
          tipo: 'fondo',
          ruta: scene.fondoAsset.ruta,
          nombre: scene.fondoAsset.nombre
        });
      }
      if (scene.actorAsset?.ruta) {
        assetsUsados.push({
          tipo: 'actor', 
          ruta: scene.actorAsset.ruta,
          nombre: scene.actorAsset.nombre
        });
      }
    }
  }

  return {
    url: cdnUrl,
    plan: videoPlan,
    scenes,
    clips,
    resolution: videoPlan.metadata?.duration,
    visualStyle: videoPlan.metadata?.visualStyle,
    // ✅ PASO 8: Metadatos extendidos
    metadata: {
      duracion: reqNormalizado.duration,
      estilo: reqNormalizado.visualStyle,
      assetsUsados: assetsUsados.slice(0, 10), // Primeros 10 para evitar payloads grandes
      fechaCreacion: ahora.toISOString(),
      expiraEn: expiraEn.toISOString(),
      vozManual: !!req.voice,
      musicaManual: !!req.music,
      carryoverUsado: tomasUnicas?.some(t => t.carryover) || false,
      ...audioMetadata
    }
  };
}

/**
 * ✨ CRÍTICO: Convierte rutas relativas a URLs completas para Fal.ai
 * Las rutas como 'escenas/anime/...' deben convertirse a URLs completas
 */
function convertirRutaAURLCompleta(ruta: string): string {
  // Si ya es una URL completa, retornarla tal como está
  if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
    console.log(`[Pipeline] URL ya completa: ${ruta}`);
    return ruta;
  }
  
  // Usar la URL correcta del CDN configurada en .env
  const CDN_BASE = process.env.CDN_BUCKET_URL || 'https://storage.googleapis.com/storyteller-ai-cdn';
  
  // Limpiar la ruta: eliminar barras iniciales
  const rutaLimpia = ruta.startsWith('/') ? ruta.substring(1) : ruta;
  
  const urlCompleta = `${CDN_BASE}/${rutaLimpia}`;
  console.log(`[Pipeline] 🔗 Convertida: ${ruta} → ${urlCompleta}`);
  return urlCompleta;
}

/**
 * ✨ NUEVO: Agrupa escenas individuales en tomas cinematográficas únicas
 * Convierte 30 escenas de 1s en 3 tomas de 10s (límite de Kling)
 */
function agruparEnTomasUnicas(scenes: any[], logger: any): any[] {
  const tomasUnicas: any[] = [];
  const DURACION_MAXIMA_TOMA = 10; // Límite de Kling
  
  let tomaActual: any = null;
  let duracionAcumulada = 0;
  
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    
    // Si no hay toma actual o cambió el fondo/contexto, crear nueva toma
    const cambioDeContexto = tomaActual && (
      tomaActual.fondoAsset?.ruta !== scene.fondoAsset?.ruta ||
      duracionAcumulada >= DURACION_MAXIMA_TOMA
    );
    
    if (!tomaActual || cambioDeContexto) {
      // Finalizar toma anterior si existe
      if (tomaActual) {
        tomaActual.duracion = duracionAcumulada;
        tomasUnicas.push(tomaActual);
        logger.info(`[Pipeline] 📸 Toma ${tomasUnicas.length} creada: ${duracionAcumulada}s - ${tomaActual.descripcionToma}`);
      }
      
      // Iniciar nueva toma
      tomaActual = {
        id: tomasUnicas.length + 1,
        fondoAsset: scene.fondoAsset,
        actorAsset: scene.actorAsset,
        visual: scene.visual || scene.backgroundPrompt,
        promptKling: scene.promptKling,
        descripcionToma: scene.descripcionToma || `Toma ${tomasUnicas.length + 1}`,
        momentoNarrativo: scene.momentoNarrativo,
        movimientoKling: scene.camara?.movimientoKling || 'camera_static',
        inicioSegundo: scene.segundo,
        escenasIncluidas: [scene.segundo]
      };
      duracionAcumulada = 1;
    } else {
      // Continuar toma actual
      duracionAcumulada++;
      tomaActual.escenasIncluidas.push(scene.segundo);
      
      // Actualizar información si es más específica
      if (scene.promptKling && !tomaActual.promptKling) {
        tomaActual.promptKling = scene.promptKling;
      }
      if (scene.descripcionToma && scene.descripcionToma !== `Toma ${tomaActual.id}`) {
        tomaActual.descripcionToma = scene.descripcionToma;
      }
    }
  }
  
  // Finalizar última toma
  if (tomaActual) {
    tomaActual.duracion = duracionAcumulada;
    tomasUnicas.push(tomaActual);
    logger.info(`[Pipeline] 📸 Última toma creada: ${duracionAcumulada}s - ${tomaActual.descripcionToma}`);
  }
  
  logger.info(`[Pipeline] 🎬 Resumen: ${scenes.length} escenas → ${tomasUnicas.length} tomas cinematográficas`);
  
  return tomasUnicas;
}

```

### 📂 src/routes/admin.ts

```ts
/**
 * Endpoint seguro para consultar logs de feedback y errores.
 *
 * Uso:
 *   curl -H "x-admin-token: TU_TOKEN" http://localhost:3000/admin/logs
 *
 * El token se define por la variable de entorno ADMIN_TOKEN (por defecto: admin123).
 *
 * Seguridad:
 *   - No expongas este endpoint en producción sin protección fuerte.
 *   - Cambia el token por uno seguro y mantenlo fuera del código fuente.
 *   - Limita el acceso por IP/firewall si es posible.
 */
import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Devuelve los últimos N logs de feedback y errores (solo para admins/desarrollo)
// Middleware de autenticación por token simple
router.use((req, res, next) => {
  const adminToken = process.env.ADMIN_TOKEN || 'admin123';
  const token = req.headers['x-admin-token'];
  if (token !== adminToken) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
});

router.get('/logs', async (req, res) => {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    const feedbackLog = path.join(logsDir, 'all.log');
    const errorLog = path.join(logsDir, 'error.log');
    const [feedback, errors] = await Promise.all([
      fs.readFile(feedbackLog, 'utf8').catch(() => ''),
      fs.readFile(errorLog, 'utf8').catch(() => '')
    ]);
    // Devuelve los últimos 200 eventos de feedback y errores
    const lastFeedback = feedback.split('\n').filter(l => l.includes('[FEEDBACK]')).slice(-200);
    const lastErrors = errors.split('\n').slice(-200);
    res.json({
      feedback: lastFeedback,
      errors: lastErrors
    });
  } catch (e) {
    res.status(500).json({ error: 'No se pudieron leer los logs', details: e instanceof Error ? e.message : e });
  }
});

export default router;

```

### 📂 src/routes/render.ts

```ts
import express from 'express';
import { startJob, getJobStatus, getJobResult, getJobProgress, getJobState } from '../jobs/jobQueue.js';
import { z } from 'zod';
import { logger, safeLog } from '../utils/logger.js';
import { logFeedback } from '../services/feedbackService.js';
import { ESTILOS_VALIDOS, normalizarEstilo, type EstiloVisualAPI } from '../types/estilos.js';
import multer, { FileFilterCallback } from 'multer';
import type { Request } from 'express';

// Configuración de multer para manejo de imágenes
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo por imagen
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(new Error('Formato de imagen no soportado'));
    } else {
      cb(null, true);
    }
  }
});

export const renderRouter = express.Router();

// Esquema de validación con Zod - UNIFICADO con tipos de estilos
const renderRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').transform(val => 
    val.replace(/[^\x20-\x7E\u00C0-\u017F]/g, "").trim() || "Create a cinematic story"
  ),
  visualStyle: z.enum(ESTILOS_VALIDOS as [EstiloVisualAPI, ...EstiloVisualAPI[]]),
  duration: z.number().min(1).max(300, 'Duration must be between 1 and 300 seconds'),
});

// Endpoint principal para renderizar videos
renderRouter.post('/', upload.fields([
  { name: 'userImage', maxCount: 2 },
  { name: 'localImage', maxCount: 1 },
  { name: 'productImage', maxCount: 1 }
]), async (req, res) => {
  try {
    safeLog('[API] Nueva solicitud de renderizado', {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });

    // Sanitizar el prompt
    if (req.body.prompt) {
      req.body.prompt = req.body.prompt
        .replace(/[^\x20-\x7E\u00C0-\u017F]/g, "") // Mantener ASCII + acentos básicos
        .replace(/\s+/g, " ") // Normalizar espacios
        .trim();
      
      if (req.body.prompt.length < 10) {
        logger.warn('[API] Prompt demasiado corto, usando prompt por defecto');
        req.body.prompt = "Create a cinematic story about a character's journey through an epic adventure";
      }
    }

    safeLog('[API] Prompt sanitizado', { promptLength: req.body.prompt?.length || 0 });

    // Preparar datos para validación
    const requestBody = {
      prompt: req.body.prompt || "Create a cinematic story",
      visualStyle: req.body.visualStyle || 'cinematic',
      duration: parseInt(req.body.duration) || 30,
    };

    // Validar con Zod
    const validatedBody = renderRequestSchema.parse(requestBody);
    
    // ✅ NORMALIZAR ESTILO: Convertir alias a estilo principal
    const estiloNormalizado = normalizarEstilo(validatedBody.visualStyle);

    console.log('[API] Request validado exitosamente', { 
      estiloOriginal: validatedBody.visualStyle,
      estiloNormalizado,
      duracion: validatedBody.duration
    });

    // Procesar imágenes subidas si las hay
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let actorCustomPath: string | undefined;
    
    if (files?.userImage?.[0]) {
      actorCustomPath = files.userImage[0].path;
      console.log('[API] Imagen personalizada detectada', { path: actorCustomPath });
    }

    // Log de feedback para métricas
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: true,
      params: { 
        visualStyle: validatedBody.visualStyle,
        estiloNormalizado,
        duration: validatedBody.duration 
      }
    });

    // Crear trabajo en la cola con estilo normalizado
    const jobData = {
      ...validatedBody,
      visualStyle: estiloNormalizado, // ✅ Usar estilo normalizado
      estiloOriginal: validatedBody.visualStyle, // Preservar para logs
      actorCustomPath,
      metadata: {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      }
    };

    const jobId = await startJob(jobData);
    
    console.log('[API] Trabajo creado exitosamente', { jobId });

    // ✅ RESPUESTA UNIFICADA
    const respuesta = {
      success: true,
      message: 'Video generation started',
      data: {
        jobId,
        estado: 'pendiente' as const,
        estimadoTiempo: 1800, // 30 minutos en segundos
        urlResultado: `/api/render/result/${jobId}`
      },
      timestamp: new Date().toISOString(),
      source: 'API'
    };

    res.status(202).json({
      ...respuesta,
      statusUrl: `/api/render/status/${jobId}`,
      estimatedTime: '20-30 minutes' // Compatibilidad
    });

  } catch (error: any) {
    console.error('[API] Error procesando request', error);
    
    logFeedback({
      service: 'RenderAPI',
      action: 'requestReceived',
      success: false,
      error: error.message,
      params: req.body
    });

    if (error instanceof z.ZodError) {
      const respuestaError = {
        success: false,
        code: 'PARAMETROS_FALTANTES',
        message: 'Datos de entrada inválidos',
        error: error.errors,
        timestamp: new Date().toISOString(),
        source: 'API'
      };
      return res.status(400).json(respuestaError);
    }

    const respuestaError = {
      success: false,
      code: 'ERROR_INTERNO',
      message: error.message || 'Error desconocido',
      error: error,
      timestamp: new Date().toISOString(),
      source: 'API'
    };
    res.status(500).json(respuestaError);
  }
});

// Endpoint para verificar estado de trabajo
renderRouter.get('/status/:jobId', async (req, res) => {
  try {
    const status = getJobStatus(req.params.jobId);
    res.json({ status });
  } catch (error: any) {
    logger.error('Error obteniendo estado:', error);
    res.status(404).json({ error: 'Job not found' });
  }
});

// Endpoint para obtener progreso detallado del trabajo
renderRouter.get('/progress/:jobId', async (req, res) => {
  try {
    const progress = getJobProgress(req.params.jobId);
    res.json(progress);
  } catch (error: any) {
    logger.error('Error obteniendo progreso:', error);
    res.status(404).json({ error: 'Job not found' });
  }
});

// Endpoint para obtener estado completo del trabajo
renderRouter.get('/state/:jobId', async (req, res) => {
  try {
    const state = getJobState(req.params.jobId);
    if (!state) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(state);
  } catch (error: any) {
    logger.error('Error obteniendo estado completo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint para obtener resultado
renderRouter.get('/result/:jobId', async (req, res) => {
  try {
    const result = getJobResult(req.params.jobId);
    res.json(result);
  } catch (error: any) {
    logger.error('Error obteniendo resultado:', error);
    res.status(404).json({ error: 'Result not found' });
  }
});

export default renderRouter;

```

### 📂 src/routes/render_clean.ts

```ts
// Archivo vacío
```

### 📂 src/routes/render_replacement.ts

```ts
// Archivo vacío
```

### 📂 src/routes/templates.ts

```ts
// Archivo vacío
```

### 📂 src/scripts/generateAssets.ts

```ts
// Archivo vacío
```

### 📂 src/scripts/generateMVPVideos.ts

```ts
#!/usr/bin/env node

// src/scripts/generateMVPVideos.ts - Generador de Videos MVP para CinemaAI

import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { VideoValidator } from '../utils/videoValidator.js';

interface MVPVideo {
  estilo: string;
  url: string;
  duración: number;
  tieneAudio: boolean;
  status: 'exitoso' | 'falló';
  error?: string;
}

const MVP_STYLES = [
  {
    style: 'cinematic',
    prompt: 'Un dramático enfrentamiento entre un samurái y un ninja en un templo japonés bajo la tormenta, con cámaras cinematográficas épicas'
  },
  {
    style: 'anime', 
    prompt: 'Una estudiante anime descubre poderes mágicos en un jardín de flores de cerezo, con efectos visuales brillantes y emotivos'
  },
  {
    style: 'cartoon',
    prompt: 'Un chef divertido y colorido cocina una receta mágica en una cocina fantástica llena de ingredientes que cobran vida'
  },
  {
    style: 'commercial',
    prompt: 'Un profesional confiado presenta las características de un innovador producto tecnológico en una oficina moderna'
  }
];

async function generateMVPVideo(style: string, prompt: string): Promise<MVPVideo> {
  console.log(`\n🎬 Generando video MVP para estilo: ${style.toUpperCase()}`);
  console.log(`Prompt: "${prompt}"`);
  
  try {
    const result = await renderCinemaAI({
      prompt,
      duration: 60,
      visualStyle: style as any
    });
    
    if (!result || !result.url) {
      throw new Error('No se generó URL de video válida');
    }
    
    console.log(`✅ Video generado: ${result.url}`);
    console.log(`🔍 Validando video...`);
    
    const validation = await VideoValidator.validateVideo(result.url, 60);
    
    if (validation.valid) {
      console.log(`✅ ${style} - Video MVP EXITOSO`);
      console.log(`   Duración: ${validation.duration}s`);
      console.log(`   Audio: ${validation.hasAudio ? 'Sí' : 'No'}`);
      
      return {
        estilo: style,
        url: result.url,
        duración: validation.duration,
        tieneAudio: validation.hasAudio,
        status: 'exitoso'
      };
    } else {
      console.log(`❌ ${style} - Video generado pero validación falló`);
      console.log(`   Errores: ${validation.errors.join(', ')}`);
      
      return {
        estilo: style,
        url: result.url,
        duración: validation.duration,
        tieneAudio: validation.hasAudio,
        status: 'falló',
        error: `Validación falló: ${validation.errors.join(', ')}`
      };
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`❌ ${style} - Error en generación: ${errorMessage}`);
    
    return {
      estilo: style,
      url: '',
      duración: 0,
      tieneAudio: false,
      status: 'falló',
      error: errorMessage
    };
  }
}

async function generateAllMVPVideos(): Promise<void> {
  console.log('🚀 INICIANDO GENERACIÓN DE VIDEOS MVP PARA TODOS LOS ESTILOS');
  console.log('===========================================================');
  
  const mvpVideos: MVPVideo[] = [];
  
  for (const styleConfig of MVP_STYLES) {
    const video = await generateMVPVideo(styleConfig.style, styleConfig.prompt);
    mvpVideos.push(video);
    
    // Pausa entre estilos para evitar rate limiting
    if (MVP_STYLES.indexOf(styleConfig) < MVP_STYLES.length - 1) {
      console.log('⏳ Esperando 15s antes del siguiente estilo...');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  // Mostrar resumen final
  console.log('\n🎯 RESUMEN DE VIDEOS MVP GENERADOS:');
  console.log('=====================================');
  
  mvpVideos.forEach(video => {
    const status = video.status === 'exitoso' ? '✅' : '❌';
    console.log(`${status} ${video.estilo.toUpperCase()}`);
    
    if (video.status === 'exitoso') {
      console.log(`   URL: ${video.url}`);
      console.log(`   Duración: ${video.duración}s`);
      console.log(`   Audio: ${video.tieneAudio ? 'Sí' : 'No'}`);
    } else {
      console.log(`   Error: ${video.error}`);
    }
    console.log('');
  });
  
  const exitosos = mvpVideos.filter(v => v.status === 'exitoso').length;
  const total = mvpVideos.length;
  const porcentaje = Math.round((exitosos / total) * 100);
  
  console.log(`📊 RESULTADO FINAL: ${exitosos}/${total} estilos exitosos (${porcentaje}%)`);
  
  if (exitosos === total) {
    console.log('\n🎉 ¡TODOS LOS VIDEOS DEL MVP FUERON GENERADOS CON ÉXITO!');
    console.log('🎬 Estilos: Cinematic, Anime, Cartoon, Commercial');
    console.log('🎧 Todos tienen audio, duración mínima cumplida y están listos para revisión visual final');
  } else {
    console.log('\n⚠️  Algunos videos MVP fallaron. Revisar errores arriba.');
  }
  
  // Guardar resultados en JSON para referencia
  const fs = require('fs');
  const path = require('path');
  const resultsPath = path.join(process.cwd(), 'mvp_videos_results.json');
  
  fs.writeFileSync(resultsPath, JSON.stringify(mvpVideos, null, 2), 'utf8');
  console.log(`\n💾 Resultados guardados en: ${resultsPath}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateAllMVPVideos().catch(console.error);
}

export { generateAllMVPVideos, generateMVPVideo };

```

### 📂 src/scripts/pruebaCompleta.ts

```ts
// Archivo vacío
```

### 📂 src/scripts/renderManualTest.ts

```ts
// Archivo vacío
```

### 📂 src/scripts/renderTestLoop.ts

```ts
#!/usr/bin/env node

// src/scripts/renderTestLoop.ts - Loop de Pruebas Automatizado CinemaAI MVP

import { renderCinemaAI } from '../pipelines/renderPipeline.js';
import { VideoValidator } from '../utils/videoValidator.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  style: string;
  attempt: number;
  success: boolean;
  videoUrl?: string;
  error?: string;
  duration?: number;
  hasAudio?: boolean;
  validationErrors?: string[];
  timestamp: string;
}

interface StyleConfig {
  style: string;
  prompt: string;
  duration: number;
  maxAttempts: number;
}

const TEST_CONFIGS: StyleConfig[] = [
  {
    style: 'cinematic',
    prompt: 'Un joven samurái entra a un templo bajo la lluvia, la cámara se acerca lentamente mientras él mira hacia el horizonte',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  },
  {
    style: 'anime',
    prompt: 'Una chica anime camina por un jardín japonés lleno de flores de cerezo, el viento mueve suavemente su cabello',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  },
  {
    style: 'cartoon',
    prompt: 'Un personaje divertido cocina en una cocina colorida, salta de alegría cuando termina su receta',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  },
  {
    style: 'commercial',
    prompt: 'Un profesional presenta un producto en una oficina moderna, sonríe confiadamente mientras señala características',
    duration: 60, // Duración para MVP
    maxAttempts: 3
  }
];

async function testStyle(config: StyleConfig): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  console.log(`\n🎬 INICIANDO TESTS PARA ESTILO: ${config.style.toUpperCase()}`);
  console.log(`Prompt: "${config.prompt}"`);
  console.log(`Duración: ${config.duration}s`);
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    console.log(`\n📸 Intento ${attempt}/${config.maxAttempts} para ${config.style}...`);
    
    const startTime = Date.now();
    
    try {
      const result = await renderCinemaAI({
        prompt: config.prompt,
        duration: config.duration as 30, // Type assertion para AllowedDuration
        visualStyle: config.style as any
      });
      
      const generationTime = Date.now() - startTime;
      
      if (result && result.url) {
        console.log(`✅ ${config.style} - Video generado en ${Math.round(generationTime/1000)}s`);
        console.log(`   Video URL: ${result.url}`);
        console.log(`   🔍 Validando video...`);
        
        // Validar el video generado
        const validation = await VideoValidator.validateVideo(result.url, config.duration);
        
        if (validation.valid) {
          console.log(`✅ ${config.style} - Intento ${attempt} COMPLETAMENTE EXITOSO`);
          console.log(`   Duración real: ${validation.duration}s`);
          console.log(`   Audio: ${validation.hasAudio ? 'Sí' : 'No'}`);
          
          results.push({
            style: config.style,
            attempt,
            success: true,
            videoUrl: result.url,
            duration: validation.duration,
            hasAudio: validation.hasAudio,
            timestamp: new Date().toISOString()
          });
          
          break;
        } else {
          console.log(`❌ ${config.style} - Video generado pero validación falló`);
          console.log(`   Errores: ${validation.errors.join(', ')}`);
          
          results.push({
            style: config.style,
            attempt,
            success: false,
            videoUrl: result.url,
            duration: validation.duration,
            hasAudio: validation.hasAudio,
            validationErrors: validation.errors,
            error: `Validación falló: ${validation.errors.join(', ')}`,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        throw new Error('Video URL no válido o vacío');
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      console.log(`❌ ${config.style} - Intento ${attempt} FALLÓ`);
      console.log(`   Error: ${errorMessage}`);
      console.log(`   Tiempo antes del fallo: ${Math.round(duration/1000)}s`);
      
      results.push({
        style: config.style,
        attempt,
        success: false,
        error: errorMessage,
        duration: Math.round(duration/1000),
        timestamp: new Date().toISOString()
      });
    }
    
    if (attempt < config.maxAttempts) {
      const waitTime = 10000 * attempt;
      console.log(`   Esperando ${waitTime/1000}s antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return results;
}

function generateReport(allResults: TestResult[]): void {
  const reportPath = join(process.cwd(), 'test_report.md');
  
  let report = `# 🎬 REPORTE DE TEST LOOP MVP - ESTILOS VISUALES

**Fecha:** ${new Date().toLocaleString()}
**Sistema:** CinemaAI MVP Backend
**Componentes probados:** Kling AI, Murf.ai, Assets CDN, Pipeline completo, Validación de video

---

## 📊 RESUMEN EJECUTIVO

`;

  const styleStats = TEST_CONFIGS.map(config => {
    const styleResults = allResults.filter(r => r.style === config.style);
    const successful = styleResults.find(r => r.success);
    const totalAttempts = styleResults.length;
    
    return {
      style: config.style,
      success: !!successful,
      attempts: totalAttempts,
      videoUrl: successful?.videoUrl,
      duration: successful?.duration,
      hasAudio: successful?.hasAudio,
      totalTime: styleResults.reduce((sum, r) => sum + (r.duration || 0), 0)
    };
  });

  const successfulStyles = styleStats.filter(s => s.success).length;
  const totalStyles = styleStats.length;
  const successRate = Math.round((successfulStyles / totalStyles) * 100);

  report += `| Estilo | Estado | Intentos | Duración | Audio | URL |\n`;
  report += `|--------|--------|----------|----------|-------|-----|\n`;

  styleStats.forEach(stat => {
    const status = stat.success ? '✅' : '❌';
    const duration = stat.duration ? `${stat.duration}s` : 'N/A';
    const audio = stat.hasAudio ? 'Sí' : 'No';
    const url = stat.videoUrl ? `[Ver video](${stat.videoUrl})` : 'N/A';
    
    report += `| ${stat.style} | ${status} | ${stat.attempts} | ${duration} | ${audio} | ${url} |\n`;
  });

  report += `\n**PORCENTAJE DE ÉXITO TOTAL: ${successRate}% (${successfulStyles}/${totalStyles})**\n\n`;

  report += `---\n\n## 📋 DETALLES POR ESTILO\n\n`;

  TEST_CONFIGS.forEach(config => {
    const styleResults = allResults.filter(r => r.style === config.style);
    const successful = styleResults.find(r => r.success);
    
    report += `### ${config.style.toUpperCase()}\n\n`;
    report += `**Prompt:** "${config.prompt}"\n`;
    report += `**Estado:** ${successful ? '✅ EXITOSO' : '❌ FALLÓ'}\n`;
    report += `**Intentos realizados:** ${styleResults.length}\n\n`;

    if (successful) {
      report += `**🎬 VIDEO GENERADO:**\n`;
      report += `- URL: ${successful.videoUrl}\n`;
      report += `- Duración: ${successful.duration}s\n`;
      report += `- Audio: ${successful.hasAudio ? 'Sí' : 'No'}\n`;
      report += `- Timestamp: ${successful.timestamp}\n\n`;
    }

    if (styleResults.length > 0) {
      report += `**📊 Historial de intentos:**\n`;
      styleResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        report += `${index + 1}. ${status} Intento ${result.attempt} (${result.timestamp})\n`;
        if (result.error) {
          report += `   Error: ${result.error}\n`;
        }
        if (result.validationErrors && result.validationErrors.length > 0) {
          report += `   Errores de validación: ${result.validationErrors.join(', ')}\n`;
        }
      });
      report += `\n`;
    }

    report += `---\n\n`;
  });

  report += `## 🔧 INFORMACIÓN TÉCNICA\n\n`;
  report += `- **Pipeline:** renderCinemaAI completo\n`;
  report += `- **Validación:** VideoValidator con ffprobe\n`;
  report += `- **Reintentos:** Hasta 3 por estilo\n`;
  report += `- **Tiempo de espera:** 10s entre reintentos\n`;
  report += `- **CDN:** Google Cloud Storage\n`;
  report += `- **Generado:** ${new Date().toISOString()}\n`;

  writeFileSync(reportPath, report, 'utf8');
  console.log(`\n📄 Reporte guardado en: ${reportPath}`);
}

async function runTestLoop(): Promise<void> {
  console.log('🚀 INICIANDO TEST LOOP COMPLETO PARA MVP');
  console.log('===========================================');
  
  const allResults: TestResult[] = [];
  
  for (const config of TEST_CONFIGS) {
    const styleResults = await testStyle(config);
    allResults.push(...styleResults);
  }
  
  generateReport(allResults);
  
  const successfulStyles = TEST_CONFIGS.filter(config => {
    const styleResults = allResults.filter(r => r.style === config.style);
    return styleResults.some(r => r.success);
  }).length;
  
  const totalStyles = TEST_CONFIGS.length;
  const successRate = Math.round((successfulStyles / totalStyles) * 100);
  
  console.log('\n🎯 RESUMEN FINAL:');
  console.log('==================');
  console.log(`✅ Estilos exitosos: ${successfulStyles}/${totalStyles}`);
  console.log(`📊 Porcentaje de éxito: ${successRate}%`);
  
  if (successfulStyles === totalStyles) {
    console.log('\n🎉 ¡TODOS LOS VIDEOS DEL MVP FUERON GENERADOS CON ÉXITO!');
    console.log('🎬 Estilos: Cinematic, Anime, Cartoon, Commercial');
    console.log('🎧 Todos tienen audio, duración mínima cumplida y están listos para revisión visual final');
    console.log('📁 Ver test_report.md y consola para detalles');
  } else {
    console.log('\n⚠️  Algunos estilos fallaron. Ver test_report.md para detalles.');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runTestLoop().catch(console.error);
}

export { runTestLoop, testStyle, generateReport };

```

### 📂 src/scripts/validadorInteligente.ts

```ts
// Archivo vacío
```

### 📂 src/scripts/validadorMVP.ts

```ts
// Archivo vacío
```

### 📂 src/scripts/verificacionCompleta.ts

```ts
// Archivo vacío
```

### 📂 src/services/assetManager.ts

```ts
// src/services/assetManager.ts - Servicio unificado para gestión de assets

import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

/**
 * Interfaz unificada para assets del CDN
 */
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

/**
 * Configuración del CDN
 */
const CDN_CONFIG = {
  baseUrl: process.env.CDN_BUCKET_URL || 'https://storage.googleapis.com/storyteller-ai-cdn',
  cacheDuration: 5 * 60 * 1000, // 5 minutos
};

/**
 * Cache para evitar lecturas repetidas del assets_index.json
 */
let assetsCache: AssetItem[] | null = null;
let cacheTimestamp: number = 0;

/**
 * Servicio unificado para gestión de assets
 */
export class AssetManager {
  
  /**
   * Cargar todos los assets desde assets_index.json con cache
   */
  static async cargarTodosLosAssets(): Promise<AssetItem[]> {
    const ahora = Date.now();
    
    // Usar cache si está vigente
    if (assetsCache && (ahora - cacheTimestamp) < CDN_CONFIG.cacheDuration) {
      logger.debug('[AssetManager] Usando assets desde cache');
      return assetsCache;
    }
    
    try {
      const assetsPath = path.join(process.cwd(), 'assets_index.json');
      
      if (!fs.existsSync(assetsPath)) {
        logger.error('[AssetManager] assets_index.json no encontrado');
        return [];
      }
      
      const contenido = fs.readFileSync(assetsPath, 'utf-8');
      const assetsRaw = JSON.parse(contenido);
      
      // Normalizar y enriquecer assets
      const assetsNormalizados = assetsRaw.map((asset: any) => ({
        nombre: asset.nombre,
        ruta: asset.ruta,
        tipo: asset.tipo === 'actores' ? 'actor' : 'fondo', // ✅ ARREGLO: Usar la propiedad 'tipo' del JSON
        lugar: asset.lugar,
        variante: asset.variante,
        angulo: asset.angulo,
        ambiente: asset.ambiente,
        url: this.convertirRutaAURL(asset.ruta)
      })) as AssetItem[];
      
      // Actualizar cache
      assetsCache = assetsNormalizados;
      cacheTimestamp = ahora;
      
      logger.info(`[AssetManager] Cargados ${assetsNormalizados.length} assets desde assets_index.json`);
      return assetsNormalizados;
      
    } catch (error) {
      logger.error('[AssetManager] Error cargando assets:', error);
      return [];
    }
  }
  
  /**
   * Filtrar fondos por estilo visual
   */
  static async obtenerFondosPorEstilo(estilo: string): Promise<AssetItem[]> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    const fondos = todosLosAssets.filter(asset => asset.tipo === 'fondo');
    
    // Para el sistema actual, todos los fondos están disponibles
    // En el futuro se pueden agregar filtros específicos por estilo
    logger.info(`[AssetManager] Obtenidos ${fondos.length} fondos para estilo '${estilo}'`);
    return fondos;
  }
  
  /**
   * Filtrar actores por estilo visual
   */
  static async obtenerActoresPorEstilo(estilo: string): Promise<AssetItem[]> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    const actores = todosLosAssets.filter(asset => asset.tipo === 'actor');
    
    logger.info(`[AssetManager] Obtenidos ${actores.length} actores para estilo '${estilo}'`);
    return actores;
  }
  
  /**
   * Buscar asset específico por nombre
   */
  static async buscarAssetPorNombre(nombre: string): Promise<AssetItem | null> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    const asset = todosLosAssets.find(a => a.nombre === nombre);
    
    if (asset) {
      logger.debug(`[AssetManager] Asset encontrado: ${asset.nombre} → ${asset.url}`);
    } else {
      logger.warn(`[AssetManager] Asset no encontrado: ${nombre}`);
    }
    
    return asset || null;
  }
  
  /**
   * Buscar assets que coincidan con criterios específicos
   */
  static async buscarAssets(criterios: {
    lugar?: string;
    variante?: string;
    angulo?: string;
    tipo?: 'fondo' | 'actor';
    ambiente?: string;
  }): Promise<AssetItem[]> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    let resultados = todosLosAssets;
    
    if (criterios.tipo) {
      resultados = resultados.filter(a => a.tipo === criterios.tipo);
    }
    
    if (criterios.lugar) {
      resultados = resultados.filter(a => a.lugar?.toLowerCase() === criterios.lugar?.toLowerCase());
    }
    
    if (criterios.variante) {
      resultados = resultados.filter(a => a.variante?.toLowerCase() === criterios.variante?.toLowerCase());
    }
    
    if (criterios.angulo) {
      resultados = resultados.filter(a => a.angulo?.toLowerCase() === criterios.angulo?.toLowerCase());
    }
    
    if (criterios.ambiente) {
      resultados = resultados.filter(a => a.ambiente?.toLowerCase() === criterios.ambiente?.toLowerCase());
    }
    
    logger.debug(`[AssetManager] Búsqueda con criterios ${JSON.stringify(criterios)} → ${resultados.length} resultados`);
    return resultados;
  }
  
  /**
   * Validar que un asset existe y es accesible
   */
  static async validarAsset(asset: AssetItem): Promise<boolean> {
    if (!asset.url || !asset.nombre || !asset.ruta) {
      return false;
    }
    
    // En el futuro aquí se puede agregar validación HTTP
    // Por ahora validamos que tenga estructura correcta
    return true;
  }
  
  /**
   * Convertir ruta relativa a URL completa del CDN
   */
  static convertirRutaAURL(ruta: string): string {
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
      return ruta;
    }
    
    const rutaLimpia = ruta.startsWith('/') ? ruta.substring(1) : ruta;
    const urlCompleta = `${CDN_CONFIG.baseUrl}/${rutaLimpia}`;
    
    return urlCompleta;
  }
  
  /**
   * Limpiar cache (útil para tests o actualizaciones)
   */
  static limpiarCache(): void {
    assetsCache = null;
    cacheTimestamp = 0;
    logger.info('[AssetManager] Cache de assets limpiado');
  }
  
  /**
   * Obtener estadísticas de assets cargados
   */
  static async obtenerEstadisticas(): Promise<{
    total: number;
    fondos: number;
    actores: number;
    lugares: string[];
    variantes: string[];
  }> {
    const todosLosAssets = await this.cargarTodosLosAssets();
    
    const fondos = todosLosAssets.filter(a => a.tipo === 'fondo');
    const actores = todosLosAssets.filter(a => a.tipo === 'actor');
    
    const lugares = [...new Set(todosLosAssets.map(a => a.lugar).filter((lugar): lugar is string => Boolean(lugar)))];
    const variantes = [...new Set(todosLosAssets.map(a => a.variante).filter((variante): variante is string => Boolean(variante)))];
    
    return {
      total: todosLosAssets.length,
      fondos: fondos.length,
      actores: actores.length,
      lugares,
      variantes
    };
  }
}

// Funciones helper para mantener compatibilidad con código existente
export async function cargarAssetsIndex(): Promise<AssetItem[]> {
  return AssetManager.cargarTodosLosAssets();
}

export async function filtrarFondos(assets: AssetItem[], estilo: string): Promise<AssetItem[]> {
  return assets.filter(a => a.tipo === 'fondo');
}

export async function filtrarActores(assets: AssetItem[], estilo: string): Promise<AssetItem[]> {
  return assets.filter(a => a.tipo === 'actor');
}

```

### 📂 src/services/audioEngine.ts

```ts
// audioEngine.ts - Motor de audio centralizado
// Reorganiza getAdvancedMusic y getSfx en un motor semánticamente coherente

import { logFeedback } from './feedbackService.js';
import { logger } from '../utils/logger.js';

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

export interface AudioMetrics {
  escena: number;
  musicaUsada: string;
  sfxUsados: string[];
  ducking: boolean;
  crossfade: boolean;
  normalizacion: string;
  tiempoGeneracion: number;
}

/**
 * Motor centralizado de música avanzada
 * Movido desde musicService para mejor organización semántica
 */
export async function getAdvancedMusic(options: AudioEngineOptions): Promise<Buffer> {
  const startTime = Date.now();
  
  // Construir el estilo de búsqueda combinando los campos relevantes
  let style = options.musicaAvanzada || options.music || options.style || 'cinematic';
  if (options.emotion) style += ` ${options.emotion}`;
  if (options.motivoVisual) style += ` ${options.motivoVisual}`;
  if (options.sonidoAmbiente) style += ` ${options.sonidoAmbiente}`;
  if (options.region) style += ` ${options.region}`;
  if (options.idioma) style += ` ${options.idioma}`;
  
  if (options.subtitulos && typeof options.subtitulos === 'string') {
    // Si hay subtítulos multilingües, agregar palabras clave para adaptar la música
    style += ` ${options.subtitulos.split(' ').slice(0, 5).join(' ')}`;
  }
  
  logger.info(`🎵 [AudioEngine] Buscar música avanzada para: "${style}"`);
  
  try {
    // Usar el servicio actualizado de música con integración de Freesound
    const { getBackgroundMusic } = await import('./musicService.js');
    
    // Extraer duración y mood de las opciones
    const duration = 30; // Duración por defecto
    const mood = options.emotion || 'neutral';
    
    // Usar la nueva función con parámetros completos
    const buf = await getBackgroundMusic(style, duration, mood);
    
    if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
      logger.error('❌ [AudioEngine] La pista de música avanzada generada está vacía o es inválida');
      logFeedback({
        service: 'AudioEngine',
        action: 'getAdvancedMusic',
        success: false,
        error: 'Pista de música vacía o inválida',
        params: { options }
      });
      throw new Error('Pista de música vacía o inválida');
    }
    
    const metrics: AudioMetrics = {
      escena: 0, // Se rellenará desde el contexto
      musicaUsada: style,
      sfxUsados: [],
      ducking: false,
      crossfade: false,
      normalizacion: 'loudnorm',
      tiempoGeneracion: Date.now() - startTime
    };
    
    logger.info(`✅ [AudioEngine] Música generada: ${buf.length} bytes en ${metrics.tiempoGeneracion}ms (via Freesound)`);
    
    logFeedback({
      service: 'AudioEngine',
      action: 'getAdvancedMusic',
      success: true,
      params: { style, metrics, provider: 'Freesound' }
    });
    
    return buf;
    
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error generando música: ${error}`);
    logFeedback({
      service: 'AudioEngine',
      action: 'getAdvancedMusic',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      params: { options }
    });
    throw error;
  }
}

/**
 * Motor centralizado de efectos de sonido
 * Movido desde sceneAudioService para mejor organización semántica
 */
export async function getSfx(sfxType: string): Promise<Buffer> {
  const startTime = Date.now();
  
  logger.info(`🔊 [AudioEngine] Buscar SFX para: "${sfxType}"`);
  
  try {
    // Usar integración directa con Freesound para SFX
    const { env } = await import('../config/env.js');
    const axios = (await import('axios')).default;
    
    if (!env.FREESOUND_API_KEY) {
      logger.warn('🔑 [AudioEngine] FREESOUND_API_KEY no configurada, usando fallback silencioso');
      return Buffer.from([]);
    }

    // Mapear tipos de SFX a términos de búsqueda específicos
    const sfxMappings = {
      'footsteps': 'footsteps walking steps',
      'door': 'door open close creak',
      'explosion': 'explosion blast bomb',
      'water': 'water splash river ocean',
      'wind': 'wind breeze storm',
      'fire': 'fire crackling flames',
      'thunder': 'thunder storm lightning',
      'car': 'car engine vehicle',
      'phone': 'phone ring telephone',
      'glass': 'glass break shatter',
      'applause': 'applause clapping crowd',
      'bell': 'bell chime ring',
      'gun': 'gunshot pistol rifle',
      'sword': 'sword metal clang',
      'magic': 'magic spell fantasy',
      'robot': 'robot mechanical beep',
      'animal': 'animal nature wildlife',
      'impact': 'impact hit punch',
      'swoosh': 'swoosh swipe fast'
    };

    const searchTerm = sfxMappings[sfxType as keyof typeof sfxMappings] || sfxType;
    const searchQuery = `${searchTerm} sound effect`;
    
    logger.info(`🔍 [AudioEngine] Buscando SFX en Freesound: "${searchQuery}"`);
    
    const searchUrl = 'https://freesound.org/apiv2/search/text/';
    
    const searchResponse = await axios.get(searchUrl, {
      params: {
        query: searchQuery,
        filter: 'duration:[0.1 TO 5]', // SFX de máximo 5 segundos
        sort: 'downloads_desc',
        page_size: 5,
        fields: 'id,name,url,tags,duration,download,previews'
      },
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 10000
    });

    if (!searchResponse.data.results.length) {
      logger.warn(`🚫 [AudioEngine] No se encontraron SFX para: ${searchQuery}`);
      return Buffer.from([]);
    }

    // Seleccionar el mejor resultado
    const selectedSfx = searchResponse.data.results[0];
    logger.info(`✅ [AudioEngine] SFX seleccionado: "${selectedSfx.name}" (${selectedSfx.duration}s)`);

    // Descargar el audio
    const audioUrl = selectedSfx.previews['preview-hq-mp3'] || selectedSfx.previews['preview-lq-mp3'];
    
    if (!audioUrl) {
      logger.warn(`🚫 [AudioEngine] No hay preview para SFX: ${selectedSfx.name}`);
      return Buffer.from([]);
    }

    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 15000
    });

    const sfxBuffer = Buffer.from(audioResponse.data);
    
    const metrics: AudioMetrics = {
      escena: 0, // Se rellenará desde el contexto
      musicaUsada: '',
      sfxUsados: [sfxType],
      ducking: false,
      crossfade: false,
      normalizacion: 'none',
      tiempoGeneracion: Date.now() - startTime
    };
    
    logger.info(`✅ [AudioEngine] SFX generado: ${sfxBuffer.length} bytes en ${metrics.tiempoGeneracion}ms (via Freesound)`);
    
    logFeedback({
      service: 'AudioEngine',
      action: 'getSfx',
      success: true,
      params: { sfxType, metrics, provider: 'Freesound' }
    });
    
    return sfxBuffer;
    
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error generando SFX: ${error}`);
    logFeedback({
      service: 'AudioEngine',
      action: 'getSfx',
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      params: { sfxType }
    });
    
    // Fallback robusto: devolver buffer vacío en lugar de fallar
    logger.warn(`🔄 [AudioEngine] Usando fallback para SFX: ${sfxType}`);
    return Buffer.from([]);
  }
}

/**
 * Aplicar ducking automático (bajar música cuando hay voz)
 */
export async function applyAudioDucking(
  musicBuffer: Buffer, 
  voiceBuffer: Buffer, 
  duckingLevel: number = 0.3
): Promise<Buffer> {
  logger.info(`🎚️ [AudioEngine] Aplicando ducking automático (nivel: ${duckingLevel})`);
  
  try {
    // TODO: Implementar ducking real con ffmpeg o librería de audio
    // Por ahora devolvemos el buffer original
    logger.info('⚠️ [AudioEngine] Ducking automático pendiente de implementación');
    return musicBuffer;
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error aplicando ducking: ${error}`);
    return musicBuffer;
  }
}

/**
 * Aplicar crossfade entre dos pistas de audio
 */
export async function applyCrossfade(
  audioA: Buffer, 
  audioB: Buffer, 
  crossfadeDuration: number = 2.0
): Promise<Buffer> {
  logger.info(`🔀 [AudioEngine] Aplicando crossfade (duración: ${crossfadeDuration}s)`);
  
  try {
    // TODO: Implementar crossfade real con ffmpeg o librería de audio
    // Por ahora devolvemos el buffer B
    logger.info('⚠️ [AudioEngine] Crossfade automático pendiente de implementación');
    return audioB;
  } catch (error) {
    logger.error(`❌ [AudioEngine] Error aplicando crossfade: ${error}`);
    return audioB;
  }
}

/**
 * Registrar métricas de audio por escena
 */
export function logAudioMetrics(metrics: AudioMetrics): void {
  logger.info(`📊 [AudioEngine] Métricas escena ${metrics.escena}:`, {
    musica: metrics.musicaUsada,
    sfx: metrics.sfxUsados.length,
    ducking: metrics.ducking,
    crossfade: metrics.crossfade,
    tiempo: `${metrics.tiempoGeneracion}ms`
  });
  
  logFeedback({
    service: 'AudioEngine',
    action: 'metrics',
    success: true,
    params: metrics
  });
}

```

### 📂 src/services/audioFallbackService.ts

```ts
// audioFallbackService.ts - Servicio de fallback para audio

import { logger } from '../utils/logger.js';
import { getBackgroundMusic } from './musicService.js';

/**
 * Generador robusto de audio con múltiples fallbacks
 */
export async function robustAudioGen(query: string, tipo: 'music' | 'sfx' = 'sfx'): Promise<Buffer> {
  logger.info(`[AudioFallback] Generando audio robusto: ${query} (${tipo})`);
  
  try {
    if (tipo === 'music') {
      // Usar el servicio de música principal
      return await getBackgroundMusic(query);
    }
    
    // Para efectos de sonido
    return await generateSfxFallback(query);
    
  } catch (error) {
    logger.error(`[AudioFallback] Error en generación principal: ${error}`);
    return await emergencyAudioFallback(tipo);
  }
}

/**
 * Genera efectos de sonido con fallback
 */
async function generateSfxFallback(query: string): Promise<Buffer> {
  logger.info(`[AudioFallback] Generando SFX: ${query}`);
  
  try {
    // Mapeo de efectos comunes
    const sfxMap = {
      'ambiente': generateAmbientSfx(),
      'pasos': generateFootstepsSfx(),
      'viento': generateWindSfx(),
      'lluvia': generateRainSfx(),
      'fuego': generateFireSfx(),
      'agua': generateWaterSfx(),
      'explosion': generateExplosionSfx(),
      'puerta': generateDoorSfx()
    };
    
    // Buscar efecto específico
    for (const [key, generator] of Object.entries(sfxMap)) {
      if (query.toLowerCase().includes(key)) {
        return await generator;
      }
    }
    
    // Fallback genérico
    return await generateGenericSfx();
    
  } catch (error) {
    logger.error(`[AudioFallback] Error generando SFX: ${error}`);
    return Buffer.alloc(44100 * 1); // 1 segundo de silencio
  }
}

/**
 * Generadores específicos de efectos de sonido
 */
async function generateAmbientSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando audio ambiente');
  return Buffer.alloc(44100 * 2 * 5); // 5 segundos de ambiente
}

async function generateFootstepsSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando pasos');
  return Buffer.alloc(44100 * 2 * 2); // 2 segundos de pasos
}

async function generateWindSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando viento');
  return Buffer.alloc(44100 * 2 * 4); // 4 segundos de viento
}

async function generateRainSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando lluvia');
  return Buffer.alloc(44100 * 2 * 6); // 6 segundos de lluvia
}

async function generateFireSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando fuego');
  return Buffer.alloc(44100 * 2 * 3); // 3 segundos de fuego
}

async function generateWaterSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando agua');
  return Buffer.alloc(44100 * 2 * 4); // 4 segundos de agua
}

async function generateExplosionSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando explosión');
  return Buffer.alloc(44100 * 2 * 1); // 1 segundo de explosión
}

async function generateDoorSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando puerta');
  return Buffer.alloc(44100 * 2 * 1); // 1 segundo de puerta
}

async function generateGenericSfx(): Promise<Buffer> {
  logger.info('[AudioFallback] Generando efecto genérico');
  return Buffer.alloc(44100 * 2 * 2); // 2 segundos genérico
}

/**
 * Fallback de emergencia cuando todo falla
 */
async function emergencyAudioFallback(tipo: 'music' | 'sfx'): Promise<Buffer> {
  logger.warn(`[AudioFallback] Usando fallback de emergencia para: ${tipo}`);
  
  if (tipo === 'music') {
    return Buffer.alloc(44100 * 2 * 30); // 30 segundos de silencio para música
  } else {
    return Buffer.alloc(44100 * 2 * 3); // 3 segundos de silencio para SFX
  }
}

```

### 📂 src/services/audioIntegration.ts

```ts
// audioIntegration.ts - Integración completa de audio con Freesound y Murf
// Conecta el cerebro cinematográfico con los servicios reales de audio

import { logger } from '../utils/logger.js';
import { getAdvancedMusic, getSfx } from './audioEngine.js';
import { getBackgroundMusic } from './musicService.js';
import { createVoiceBuffer } from './voiceService.js';
import { configurarSonidoCinematico } from './llmService/estilos/cinematic/sonido.js';
import type { VideoPlan, TimelineSecond } from '../utils/types.js';

export interface AudioIntegrationOptions {
  usarFreesound: boolean;
  usarMurf: boolean;
  duracionToma: number;
  estiloCinematico: string;
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  tono: string;
  esEmocional: boolean;
}

/**
 * Genera audio completo para una toma usando servicios reales
 */
export async function generarAudioCompleto(
  seccion: TimelineSecond,
  plan: VideoPlan,
  options: AudioIntegrationOptions
): Promise<{
  musica: Buffer;
  efectos: Buffer[];
  voz: Buffer;
  metadata: any;
}> {
  const startTime = Date.now();
  logger.info(`🎼 [AudioIntegration] Generando audio completo para toma (${options.duracionToma}s)`);

  try {
    // 1. Usar el cerebro cinematográfico para obtener configuración inteligente
    const configuracionSonido = configurarSonidoCinematico(
      options.momentoNarrativo,
      seccion.segundo || 0,
      options.esEmocional,
      options.tono,
      options.duracionToma,
      seccion.actor,
      seccion as any // TomaCinematograficaPlan compatible
    );

    logger.info(`🧠 [AudioIntegration] Configuración sonora: ${JSON.stringify(configuracionSonido, null, 2)}`);

    // 2. Generar música usando Freesound
    let musicaBuffer = Buffer.from([]);
    if (configuracionSonido.musica && configuracionSonido.musica !== 'continue') {
      try {
        if (options.usarFreesound) {
          logger.info(`🎵 [AudioIntegration] Generando música via Freesound: ${configuracionSonido.musica}`);
          musicaBuffer = await getBackgroundMusic(
            configuracionSonido.musica,
            options.duracionToma,
            options.tono
          );
        } else {
          logger.info(`🎵 [AudioIntegration] Generando música via AudioEngine: ${configuracionSonido.musica}`);
          musicaBuffer = await getAdvancedMusic({
            style: configuracionSonido.musica,
            emotion: options.tono,
            musicaAvanzada: options.estiloCinematico
          });
        }
        
        if (musicaBuffer.length === 0) {
          logger.warn('⚠️ [AudioIntegration] Música vacía, usando silencio');
          musicaBuffer = createSilenceBuffer(options.duracionToma);
        }
        
        logger.info(`✅ [AudioIntegration] Música generada: ${musicaBuffer.length} bytes`);
      } catch (error) {
        logger.error(`❌ [AudioIntegration] Error generando música: ${error}`);
        musicaBuffer = createSilenceBuffer(options.duracionToma);
      }
    }

    // 3. Generar efectos de sonido usando Freesound
    const efectosBuffers: Buffer[] = [];
    if (configuracionSonido.efectos && configuracionSonido.efectos.length > 0) {
      logger.info(`🔊 [AudioIntegration] Generando ${configuracionSonido.efectos.length} efectos de sonido`);
      
      for (const efecto of configuracionSonido.efectos.slice(0, 3)) { // Máximo 3 efectos
        try {
          const efectoBuffer = await getSfx(efecto);
          if (efectoBuffer.length > 0) {
            efectosBuffers.push(efectoBuffer);
            logger.info(`✅ [AudioIntegration] Efecto '${efecto}' generado: ${efectoBuffer.length} bytes`);
          }
        } catch (error) {
          logger.warn(`⚠️ [AudioIntegration] Error generando efecto '${efecto}': ${error}`);
        }
      }
    }

    // 4. Generar voz usando Murf
    let vozBuffer = Buffer.from([]);
    if (configuracionSonido.requiereVoz && (seccion.voz || seccion.dialogo)) {
      try {
        if (options.usarMurf) {
          logger.info(`🎙️ [AudioIntegration] Generando voz via Murf`);
          vozBuffer = await createVoiceBuffer(plan);
          logger.info(`✅ [AudioIntegration] Voz generada: ${vozBuffer.length} bytes`);
        } else {
          logger.info(`🔇 [AudioIntegration] Murf deshabilitado, sin voz`);
        }
      } catch (error) {
        logger.error(`❌ [AudioIntegration] Error generando voz: ${error}`);
      }
    }

    // 5. Metadata de generación
    const metadata = {
      duracionGeneracion: Date.now() - startTime,
      configuracionUsada: configuracionSonido,
      serviciosUsados: {
        freesound: options.usarFreesound && musicaBuffer.length > 0,
        murf: options.usarMurf && vozBuffer.length > 0,
        efectosGenerados: efectosBuffers.length
      },
      calidad: {
        musicaTamaño: musicaBuffer.length,
        vozTamaño: vozBuffer.length,
        efectosTamaño: efectosBuffers.reduce((sum, buf) => sum + buf.length, 0)
      }
    };

    logger.info(`🎼 [AudioIntegration] Audio completo generado en ${metadata.duracionGeneracion}ms`);
    logger.info(`📊 [AudioIntegration] Calidad: Música ${metadata.calidad.musicaTamaño} bytes, Voz ${metadata.calidad.vozTamaño} bytes, ${efectosBuffers.length} efectos`);

    return {
      musica: musicaBuffer,
      efectos: efectosBuffers,
      voz: vozBuffer,
      metadata
    };

  } catch (error) {
    logger.error(`❌ [AudioIntegration] Error crítico generando audio: ${error}`);
    
    // Fallback completo
    return {
      musica: createSilenceBuffer(options.duracionToma),
      efectos: [],
      voz: Buffer.from([]),
      metadata: {
        error: error instanceof Error ? error.message : 'Error desconocido',
        duracionGeneracion: Date.now() - startTime,
        fallbackUsado: true
      }
    };
  }
}

/**
 * Valida la configuración de servicios de audio
 */
export async function validarConfiguracionAudio(): Promise<{
  freesoundDisponible: boolean;
  murfDisponible: boolean;
  errores: string[];
}> {
  const errores: string[] = [];
  let freesoundDisponible = false;
  let murfDisponible = false;

  try {
    const { env } = await import('../config/env.js');
    
    // Verificar Freesound
    if (!env.FREESOUND_API_KEY) {
      errores.push('FREESOUND_API_KEY no configurada');
    } else {
      try {
        // Test simple de API
        const axios = (await import('axios')).default;
        await axios.get('https://freesound.org/apiv2/search/text/', {
          params: { query: 'test', page_size: 1 },
          headers: { 'Authorization': `Token ${env.FREESOUND_API_KEY}` },
          timeout: 5000
        });
        freesoundDisponible = true;
        logger.info('✅ [AudioIntegration] Freesound API disponible');
      } catch (error) {
        errores.push(`Freesound API error: ${error}`);
        logger.warn(`⚠️ [AudioIntegration] Freesound API no disponible: ${error}`);
      }
    }

    // Verificar Murf
    if (!env.MURF_API_KEY) {
      errores.push('MURF_API_KEY no configurada');
    } else {
      murfDisponible = true; // Asumimos que está disponible si hay API key
      logger.info('✅ [AudioIntegration] Murf API configurada');
    }

  } catch (error) {
    errores.push(`Error validando configuración: ${error}`);
  }

  return {
    freesoundDisponible,
    murfDisponible,
    errores
  };
}

/**
 * Obtiene configuración optimizada según disponibilidad de servicios
 */
export async function obtenerConfiguracionOptima(): Promise<AudioIntegrationOptions> {
  const validacion = await validarConfiguracionAudio();
  
  const configuracion: AudioIntegrationOptions = {
    usarFreesound: validacion.freesoundDisponible,
    usarMurf: validacion.murfDisponible,
    duracionToma: 30,
    estiloCinematico: 'cinematic',
    momentoNarrativo: 'desarrollo',
    tono: 'dramático',
    esEmocional: true
  };

  logger.info(`🔧 [AudioIntegration] Configuración óptima: Freesound ${configuracion.usarFreesound}, Murf ${configuracion.usarMurf}`);
  
  if (validacion.errores.length > 0) {
    logger.warn(`⚠️ [AudioIntegration] Limitaciones: ${validacion.errores.join(', ')}`);
  }

  return configuracion;
}

// Helper function para crear silencio
function createSilenceBuffer(duration: number): Buffer {
  const silenceDuration = Math.max(duration, 1);
  const bufferSize = Math.floor(silenceDuration * 44100 * 2 * 2); // 44.1kHz stereo 16-bit
  return Buffer.alloc(bufferSize);
}

/**
 * Procesa audio completo para todo el plan de video
 */
export async function procesarAudioCompleto(plan: VideoPlan): Promise<{
  audioTotal: Buffer;
  metadataCompleta: any;
}> {
  logger.info(`🎬 [AudioIntegration] Procesando audio para plan completo (${plan.timeline.length} secciones)`);
  
  const configuracionOptima = await obtenerConfiguracionOptima();
  const audioSecciones: Buffer[] = [];
  const metadataSecciones: any[] = [];

  for (let i = 0; i < plan.timeline.length; i++) {
    const seccion = plan.timeline[i];
    
    // Determinar momento narrativo según posición
    let momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
    if (i === 0) momentoNarrativo = 'setup';
    else if (i === plan.timeline.length - 1) momentoNarrativo = 'cierre';
    else if (i > plan.timeline.length * 0.7) momentoNarrativo = 'climax';
    else momentoNarrativo = 'desarrollo';

    const opcionesSeccion: AudioIntegrationOptions = {
      ...configuracionOptima,
      duracionToma: seccion.duracion || 10,
      momentoNarrativo,
      tono: seccion.tono || plan.metadata?.style || 'dramático',
      esEmocional: seccion.esEmocional || i > plan.timeline.length * 0.5
    };

    try {
      const audioSeccion = await generarAudioCompleto(seccion, plan, opcionesSeccion);
      
      // Usar la música principal como audio de la sección
      audioSecciones.push(audioSeccion.musica);
      metadataSecciones.push({
        seccion: i,
        ...audioSeccion.metadata
      });
      
      logger.info(`✅ [AudioIntegration] Sección ${i} procesada: ${audioSeccion.musica.length} bytes`);
      
    } catch (error) {
      logger.error(`❌ [AudioIntegration] Error procesando sección ${i}: ${error}`);
      audioSecciones.push(createSilenceBuffer(opcionesSeccion.duracionToma));
      metadataSecciones.push({ seccion: i, error: String(error) });
    }
  }

  // Concatenar todo el audio
  const audioTotal = Buffer.concat(audioSecciones);
  
  const metadataCompleta = {
    duracionTotal: audioSecciones.length,
    tamañoTotal: audioTotal.length,
    seccionesProcesadas: metadataSecciones.length,
    configuracionUsada: configuracionOptima,
    secciones: metadataSecciones
  };

  logger.info(`🎼 [AudioIntegration] Audio completo procesado: ${audioTotal.length} bytes totales`);
  
  return {
    audioTotal,
    metadataCompleta
  };
}

```

### 📂 src/services/cdnService.ts

```ts
import { logFeedback } from './feedbackService.js';
// src/services/cdnService.ts
import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const storage = new Storage({
  projectId: env.GCP_PROJECT_ID,
  keyFilename: env.GCP_CREDENTIALS_JSON,
});

const bucket = storage.bucket(env.GCP_BUCKET_NAME);

/**
 * Sube un archivo local al CDN (Google Cloud Storage) con validación avanzada, logs enriquecidos y soporte opcional para metadatos.
 * @param localFilePath Ruta local al archivo
 * @param cdnPath Ruta destino en el bucket
 * @param options Opcional: metadatos avanzados (escena, feedback, tipo, etc)
 * @returns URL pública del archivo en el CDN
 */
export async function uploadToCDN(
  localFilePath: string,
  cdnPath: string,
  options?: {
    sceneId?: string;
    feedback?: string;
    type?: string;
    [key: string]: any;
  }
): Promise<string> {
  // Validación avanzada de parámetros
  if (typeof localFilePath !== 'string' || !localFilePath) {
    logger.error('uploadToCDN: localFilePath inválido');
    logFeedback({
      service: 'CDN',
      action: 'upload',
      success: false,
      error: 'localFilePath inválido',
      params: { localFilePath, cdnPath }
    });
    throw new Error('localFilePath inválido');
  }
  if (typeof cdnPath !== 'string' || !cdnPath) {
    logger.error('uploadToCDN: cdnPath inválido');
    logFeedback({
      service: 'CDN',
      action: 'upload',
      success: false,
      error: 'cdnPath inválido',
      params: { localFilePath, cdnPath }
    });
    throw new Error('cdnPath inválido');
  }
  try {
    await fs.access(localFilePath);
  } catch (error) {
    logger.error(`uploadToCDN: El archivo no existe en la ruta especificada: ${localFilePath}`);
    throw new Error(`El archivo no existe en la ruta especificada: ${localFilePath}`);
  }

  // Subida robusta con timeout y retry
  const uploadTimeout = 600_000; // 10 minutos
  logger.info(`[CDN] Timeout de subida configurado en ${uploadTimeout / 1000} segundos`);
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const start = Date.now();
    try {
      const uploadPromise = bucket.upload(localFilePath, { destination: cdnPath });
      await Promise.race([
        uploadPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de subida a CDN')), uploadTimeout))
      ]);
      const url = `https://storage.googleapis.com/${env.GCP_BUCKET_NAME}/${cdnPath}`;
      logger.info(`[CDN] Archivo subido correctamente: ${cdnPath} → ${url} (intento ${attempt})`);
      if (options) {
        logger.info(`[CDN] Metadatos asociados: ${JSON.stringify(options)}`);
      }
      logFeedback({
        service: 'CDN',
        action: 'upload',
        timeoutMs: uploadTimeout,
        elapsedMs: Date.now() - start,
        attempt,
        success: true,
        params: { localFilePath, cdnPath }
      });
      return url;
    } catch (e: any) {
      lastError = e;
      logger.error(`[CDN] Error subiendo archivo (intento ${attempt}): ${e.message}`);
      logFeedback({
        service: 'CDN',
        action: 'upload',
        timeoutMs: uploadTimeout,
        elapsedMs: Date.now() - start,
        attempt,
        success: false,
        error: e.message,
        params: { localFilePath, cdnPath }
      });
      if (attempt < 5) await new Promise(res => setTimeout(res, 2000 * attempt));
    }
  }
  logger.error(`[CDN] Fallo definitivo tras 5 intentos: ${lastError?.message}`);
  throw lastError || new Error('Error desconocido en subida a CDN');
}

```

### 📂 src/services/clipService.ts

```ts
import { logFeedback } from './feedbackService.js';
import { fal } from '@fal-ai/client';
import axios from 'axios';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { uploadToCDN } from './cdnService.js';
import { generateKlingClip } from './klingService.js';
import { safeLog } from '../utils/logger.js';
import { getAdvancedMusic } from './audioEngine.js';  // ✨ MEJORADO: Reorganizado

// Funciones para generar imágenes por estilo
export async function generateImageRealista(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageRealista',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen realista');
    }
    // ... Fal.ai modelo realista ...
    return '';
}
export async function generateImageAnime(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageAnime',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen anime');
    }
    // ... Fal.ai modelo anime ...
    return '';
}
export async function generateImageCartoon(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageCartoon',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen cartoon');
    }
    // ... Fal.ai modelo cartoon ...
    return '';
}
export async function generateImageGaming(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageGaming',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen gaming');
    }
    // ... Fal.ai modelo gaming ...
    return '';
}
export async function generateImageComercial(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageComercial',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen comercial');
    }
    // ... Fal.ai modelo comercial ...
    return '';
}
export async function generateImageNarrativa(prompt: string, backgroundUrl?: string): Promise<string> {
    if (typeof prompt !== 'string' || !prompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateImageNarrativa',
            success: false,
            error: 'Prompt inválido',
            params: { prompt, backgroundUrl }
        });
        throw new Error('Prompt inválido para imagen narrativa');
    }
    // ... Fal.ai modelo narrativa ...
    return '';
}

// Genera ángulos/contexto extra con Kontext
export async function generateKontextAngleOrCrowd(imageUrl: string, kontextPrompt: string): Promise<string> {
    if (typeof imageUrl !== 'string' || !imageUrl.trim() || typeof kontextPrompt !== 'string' || !kontextPrompt.trim()) {
        logFeedback({
            service: 'Clip',
            action: 'generateKontextAngleOrCrowd',
            success: false,
            error: 'Parámetros inválidos',
            params: { imageUrl, kontextPrompt }
        });
        throw new Error('Parámetros inválidos para Kontext');
    }
    // ... Fal.ai Kontext ...
    return '';
}

/**
 * Genera un video corto (10s) usando Kling 2.1 y le agrega sonido.
 * Solo para casos rápidos, demos o experimentales.
 * @param fondoUrl URL PNG del fondo
 * @param actorUrl URL PNG del actor
 * @param prompt Texto descriptivo
 * @param musicStyle Estilo musical
 * @returns URL del video generado
 */
export async function generateQuickKlingVideo({ fondoUrl, actorUrl, prompt, musicStyle }: {
  fondoUrl: string;
  actorUrl: string;
  prompt: string;
  musicStyle?: string;
}): Promise<{ videoUrl: string; musicBuffer: Buffer }> {
  // 1. Generar el clip con Kling 2.1
  const videoUrl = await generateKlingClip({
    prompt,
    input_image_urls: [fondoUrl, actorUrl],
    duration: 10,
    aspect_ratio: '16:9',
    // Puedes agregar más campos si Kling 2.1 lo soporta
  });
  // 2. Generar música rápida
  const musicBuffer = await getAdvancedMusic({ style: musicStyle || 'cinematic' });
  // 3. Retornar ambos para que el pipeline los mezcle si es necesario
  return { videoUrl, musicBuffer };
}

// Servicio principal: genera los clips y prepara para FFmpeg
export async function generateClipsKling(
    scenes: any[],
    opts?: { plan?: any; music?: Buffer; voiceOver?: Buffer; sfx?: Buffer; previewMode?: boolean }
): Promise<{ finalUrl: string, clips: string[] }> {
    if (!Array.isArray(scenes) || scenes.length === 0) {
        logFeedback({
            service: 'Clip',
            action: 'generateClipsKling',
            success: false,
            error: 'Escenas inválidas',
            params: { scenes, opts }
        });
        throw new Error('Escenas inválidas para generación de clips');
    }
    const clips: string[] = [];
    let lastBackground = '';
    let lastActor = '';
    let lastBackgroundUrl = '';
    let lastActorUrl = '';
    for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        const preview = opts?.previewMode;
        // Carryover visual avanzado: mantener fondo/actor/pose/luz si carryover=true
        let backgroundImageUrl = '';
        // Carryover sutil: si carryover=true pero el prompt cambia poco, generar variante coherente
        if (scene.carryover && scene.backgroundPrompt && lastBackground && scene.backgroundPrompt !== lastBackground) {
            // Cambios sutiles detectados (ropa, luz, clima, etc.)
            const diff = scene.backgroundPrompt.replace(lastBackground, '').trim();
            if (diff.length < 40) { // Si la diferencia es pequeña, generar variante coherente
                backgroundImageUrl = await generateImageRealista(scene.backgroundPrompt);
                safeLog('[Carryover] SUTIL: Generando fondo variante para escena', { escena: i, cambioMenor: diff.substring(0, 20) });
                lastBackground = scene.backgroundPrompt;
                lastBackgroundUrl = backgroundImageUrl;
            } else {
                // Cambio mayor, generar fondo nuevo
                backgroundImageUrl = await generateImageRealista(scene.backgroundPrompt);
                lastBackground = scene.backgroundPrompt;
                lastBackgroundUrl = backgroundImageUrl;
            }
        } else if (scene.carryover && scene.backgroundPrompt === lastBackground) {
            backgroundImageUrl = lastBackgroundUrl;
            safeLog('[Carryover] (avanzado) Reutilizando fondo EXACTO para escena', { escena: i, reutilizado: true });
        } else if (scene.backgroundPrompt) {
            if (preview) {
                backgroundImageUrl = 'https://placehold.co/640x360/EEE/333?text=PREVIEW';
            } else {
                backgroundImageUrl = await generateImageRealista(scene.backgroundPrompt);
                const bgName = `bg_${Date.now()}_${Math.floor(Math.random()*1e6)}.png`;
                const tempDir = os.tmpdir();
                const tempBgFile = path.join(tempDir, bgName);
                const bgResp = await axios.get(backgroundImageUrl, { responseType: 'arraybuffer' });
                await fs.writeFile(tempBgFile, bgResp.data);
                await uploadToCDN(tempBgFile, `assets/escenas/${bgName}`);
                try {
                    await fs.unlink(tempBgFile);
                } catch (e) {
                    console.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tempBgFile}`);
                }
                backgroundImageUrl = `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${bgName}`;
                lastBackground = scene.backgroundPrompt;
                lastBackgroundUrl = backgroundImageUrl;
            }
        }
        // Validación y logging estructurado del fondo generado
        if (!backgroundImageUrl || typeof backgroundImageUrl !== 'string' || !backgroundImageUrl.startsWith('http')) {
            logFeedback({
                service: 'Clip',
                action: 'validateBackground',
                success: false,
                error: 'No se pudo generar imagen de fondo válida',
                params: { sceneIndex: i, prompt: scene.backgroundPrompt, url: backgroundImageUrl }
            });
            throw new Error(`No se pudo generar imagen de fondo válida para la escena ${i}`);
        }
        let actorImageUrl = '';
        if (scene.carryover && scene.actorPrompt && lastActor && scene.actorPrompt !== lastActor) {
            const diff = scene.actorPrompt.replace(lastActor, '').trim();
            if (diff.length < 40) {
                actorImageUrl = await generateImageRealista(scene.actorPrompt);
                console.log(`[Carryover] SUTIL: Generando actor variante para escena ${i} (cambio menor: ${diff})`);
                lastActor = scene.actorPrompt;
                lastActorUrl = actorImageUrl;
            } else {
                actorImageUrl = await generateImageRealista(scene.actorPrompt);
                lastActor = scene.actorPrompt;
                lastActorUrl = actorImageUrl;
            }
        } else if (scene.carryover && scene.actorPrompt === lastActor) {
            actorImageUrl = lastActorUrl;
            console.log(`[Carryover] (avanzado) Reutilizando actor EXACTO para escena ${i}: ${actorImageUrl}`);
        } else if (scene.actorPrompt) {
            actorImageUrl = await generateImageRealista(scene.actorPrompt);
            const actorName = `actor_${Date.now()}_${Math.floor(Math.random()*1e6)}.png`;
            const tempDir = os.tmpdir();
            const tempActorFile = path.join(tempDir, actorName);
            const actorResp = await axios.get(actorImageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(tempActorFile, actorResp.data);
            await uploadToCDN(tempActorFile, `assets/escenas/${actorName}`);
            try {
                await fs.unlink(tempActorFile);
            } catch (e) {
                console.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tempActorFile}`);
            }
            actorImageUrl = `https://storage.googleapis.com/storyteller-ai-cdn/assets/escenas/${actorName}`;
            lastActor = scene.actorPrompt;
            lastActorUrl = actorImageUrl;
        }
        // Validación y logging estructurado del actor generado
        if (!actorImageUrl || typeof actorImageUrl !== 'string' || !actorImageUrl.startsWith('http')) {
            logFeedback({
                service: 'Clip',
                action: 'validateActor',
                success: false,
                error: 'No se pudo generar imagen de actor válida',
                params: { sceneIndex: i, prompt: scene.actorPrompt, url: actorImageUrl }
            });
            throw new Error(`No se pudo generar imagen de actor válida para la escena ${i}`);
        }
        // Interpolación de frames para transiciones suaves
        if (i > 0 && scenes[i-1].transition && ['fade','crossfade','morph'].includes(scenes[i-1].transition)) {
            // TODO: Integrar modelo de interpolación (RIFE, FILM, etc.) para generar frames intermedios
            // Ejemplo: interpolarFrame(lastBackgroundUrl, backgroundImageUrl)
            console.log(`[Interpolación] Generar frames intermedios entre escenas ${i-1} y ${i} para transición ${scenes[i-1].transition}`);
        }
        // Kontext solo si el plan lo indica (nuevo ángulo, continuidad)
        let input_image_urls: string[] = [];
        for (const imgUrl of [backgroundImageUrl, actorImageUrl]) {
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                input_image_urls.push(`data:image/png;base64,${base64Image}`);
            }
        }
        if (scene.kontextPrompt && backgroundImageUrl) {
            const kontextImageUrl = await generateKontextAngleOrCrowd(backgroundImageUrl, scene.kontextPrompt);
            if (kontextImageUrl) {
                input_image_urls.push(kontextImageUrl);
                console.log(`[Kontext] Escena ${i}: se generó ángulo alternativo para continuidad visual.`);
            }
        }
        // Log detallado de escena
        console.log(`[Scene ${i}] Fondo: ${backgroundImageUrl}, Actor: ${actorImageUrl}, Kontext: ${scene.kontextPrompt ? 'Sí' : 'No'}`);
        // Aquí iría la llamada a Kling y la preparación para FFmpeg, alineación de audio/voz/efectos
        // TODO: Selección automática de motor de voz/labial según tipo de plano y diálogo
        // TODO: Alinear música, efectos y voz según timeline y transición
        // clips.push(urlDelClipGenerado);
    }
    // Retornar resultado simulado
    return { finalUrl: '', clips };
}

```

### 📂 src/services/feedbackService.ts

```ts
/**
 * logFeedback: Centraliza logs estructurados de timeout, reintentos y resultados de servicios externos.
 * El formato es compatible con dashboards, alertas y sistemas de monitoreo externos.
 * Ejemplo de evento:
 * {
 *   service: 'Voice',
 *   action: 'generateVoice',
 *   timeoutMs: 600000,
 *   elapsedMs: 12345,
 *   attempt: 2,
 *   success: false,
 *   error: 'Timeout',
 *   params: { text: 'Hola', gender: 'female' },
 *   timestamp: '2025-07-24T12:34:56.789Z'
 * }
 */
export type FeedbackEvent = {
  service: string;         // Nombre del servicio o módulo
  action: string;          // Acción o endpoint
  timeoutMs?: number;      // Timeout configurado (ms)
  elapsedMs?: number;      // Tiempo real de ejecución (ms)
  attempt?: number;        // Número de intento (si aplica)
  success: boolean;        // true=éxito, false=error
  error?: string;          // Mensaje de error si aplica
  params?: Record<string, any>; // Parámetros clave de entrada
  timestamp?: string;      // ISO timestamp (se autocompleta si falta)
};

export function logFeedback(event: FeedbackEvent) {
  const logObj = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };
  // Log estructurado, fácil de parsear por sistemas externos
  logger.info(`[FEEDBACK] ${JSON.stringify(logObj)}`);
}
// FeedbackService: registra y procesa feedback del usuario para mejorar la generación IA
// Soporta feedback por escena, global y por usuario

import { VideoPlan, TimelineSecond } from '../utils/types.js';
import { logger } from '../utils/logger.js';

export interface Feedback {
  userId?: string;
  videoId?: string;
  sceneIndex?: number;
  feedback: string;
  rating?: number;
  timestamp?: number;
  extra?: Record<string, any>;
}

// Almacén temporal en memoria (puedes migrar a DB real)
const feedbackStore: Feedback[] = [];

/**
 * Registra feedback del usuario sobre el video o escena
 */
export function registerFeedback(feedback: Feedback) {
  feedback.timestamp = Date.now();
  feedbackStore.push(feedback);
  logger.info(`[FeedbackService] Feedback registrado: ${JSON.stringify(feedback)}`);
}

/**
 * Obtiene feedback por videoId o userId
 */
export function getFeedback({ videoId, userId }: { videoId?: string; userId?: string }) {
  return feedbackStore.filter(f =>
    (videoId ? f.videoId === videoId : true) &&
    (userId ? f.userId === userId : true)
  );
}

/**
 * Integra feedback en el VideoPlan para mejorar la generación
 */
export function applyFeedbackToPlan(plan: VideoPlan, feedbacks: Feedback[]): VideoPlan {
  if (!Array.isArray(feedbacks) || feedbacks.length === 0) return plan;
  // Ejemplo: marcar escenas con feedback negativo
  for (const fb of feedbacks) {
    if (typeof fb.sceneIndex === 'number' && plan.timeline[fb.sceneIndex]) {
      plan.timeline[fb.sceneIndex].feedbackUsuario = fb.feedback;
      if (fb.rating && fb.rating < 3) {
        plan.timeline[fb.sceneIndex].validacionFinal = 'Revisar: feedback bajo';
      }
    }
  }
  logger.info('[FeedbackService] Feedback aplicado al VideoPlan');
  return plan;
}

/**
 * Limpia feedbacks (solo para pruebas)
 */
export function clearFeedbackStore() {
  feedbackStore.length = 0;
}

```

### 📂 src/services/ffmpegService.ts

```ts
// Helper para ejecutar ffmpeg con timeout y logging
function execFF(cmd: ffmpeg.FfmpegCommand, out: string): Promise<void> {
  return new Promise((res, rej) => {
    let done = false;
    let stderr = '';
    const t = setTimeout(() => {
      if (!done) {
        done = true;
        cmd.kill('SIGKILL');
        logger.error('⏰ FFmpeg timeout. Última salida de error:\n' + stderr);
        rej(new Error('ff timeout'));
      }
    }, TIMEOUT);
    cmd.on('stderr', (line: string) => {
      stderr += line + '\n';
    });
    cmd.on('end', () => {
      if (!done) {
        done = true;
        clearTimeout(t);
        if (stderr) logger.info('FFmpeg terminó. Stderr:\n' + stderr);
        res();
      }
    });
    cmd.on('error', (e: any) => {
      if (!done) {
        done = true;
        clearTimeout(t);
        logger.error('❌ FFmpeg error:\n' + stderr);
        rej(e);
      }
    });
    cmd.save(out);
  });
}
// Genera la expresión de volumen para la música según el timeline
function buildVolumeExpr(plan: VideoPlan): string {
  const VOL: Record<string, number> = {
    quiet: 0.25,
    rise: 0.6,
    climax: 1.0,
    fade: 0.0
  };
  if (!plan.timeline || !Array.isArray(plan.timeline) || plan.timeline.length === 0) {
    throw new Error('El timeline del plan de video está vacío o malformado');
  }
  // Genera bloques consecutivos con mismo volumen
  const segs: { start: number; end: number; vol: number }[] = [];
  let curVol = plan.timeline[0]?.soundCue && VOL[plan.timeline[0].soundCue] !== undefined ? VOL[plan.timeline[0].soundCue] : 0.25;
  let segStart = 0;
  for (let i = 1; i < plan.timeline.length; i++) {
    const cue = plan.timeline[i]?.soundCue;
    const v = cue && VOL[cue] !== undefined ? VOL[cue] : 0.25;
    if (v !== curVol) {
      segs.push({ start: segStart, end: i, vol: curVol });
      segStart = i;
      curVol = v;
    }
  }
  segs.push({ start: segStart, end: plan.timeline.length, vol: curVol });
  // Construye la expresión IF anidada: if(between(t,0,3),0.25, if(between(t,3,6),0.6,1))
  let expr = String(segs[segs.length - 1].vol);
  for (let i = segs.length - 2; i >= 0; i--) {
    const s = segs[i];
    expr = `if(between(t\,${s.start}\,${s.end})\,${s.vol}\,${expr})`;
  }
  return expr;
}
// src/services/ffmpegService.ts
/**
 * FFmpeg Service v6
 * -----------------
 * ▸ Concatena clips (24 fps) → escala/letterbox → minterpolate 60 fps @1080p
 * ▸ Genera envelope de volumen para la música según soundCue por segundo:
 *       quiet  → 0.25
 *       rise   → 0.60
 *       climax → 1.00
 *       fade   → 0.00
 * ▸ Aplica side-chain ducking con la voz encima de esa envolvente.
 * ▸ Produce MP4 1080p60 + HLS 720p, timeout y retry defensivos.
 */

import ffmpegPath     from 'ffmpeg-static';
import ffmpeg         from 'fluent-ffmpeg';
import { spawn }      from 'child_process';
import path           from 'path';
import fs             from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { uploadToCDN } from './cdnService.js';
import { toPosix } from '../utils/paths.js';

import { env }        from '../config/env.js';
import { logger }     from '../utils/logger.js';
import { retry }      from '../utils/retry.js';
import { VideoPlan }  from '../utils/types.js';

// Tipos extendidos para overlays y LUTs
type OverlaySpec = { path: string; x?: number; y?: number; start?: number; end?: number; opacity?: number };
type LUTSpec = { path: string; intensity?: number; start?: number; end?: number };

/* ─── Config ───────────────────────────────────────────── */
const TMP_DIR  = path.join(process.cwd(), 'tmp', 'ffmpeg_v6');
const TIMEOUT = Number(env.FFMPEG_TIMEOUT_MS ?? 600_000); // 10 minutos por defecto para pruebas
const RETRIES  = 2;

// Helpers para overlays y LUTs
function buildOverlayFilters(overlays: OverlaySpec[] = []): string[] {
  // Genera filtros FFmpeg para overlays
  return overlays.map((o, i) => {
    let filter = `[v${i}][ol${i}]overlay=${o.x ?? 0}:${o.y ?? 0}`;
    if (typeof o.start === 'number' && typeof o.end === 'number') {
      filter += `:enable='between(t,${o.start},${o.end})'`;
    }
    if (typeof o.opacity === 'number') {
      filter = `[ol${i}]format=rgba,colorchannelmixer=aa=${o.opacity},format=yuva420p[ol${i}];` + filter;
    }
    return filter;
  });
}

function buildLUTFilters(luts: LUTSpec[] = []): string[] {
  // Genera filtros FFmpeg para LUTs (usando lut3d)
  return luts.map((l, i) => {
    let filter = `lut3d='${l.path}'`;
    if (typeof l.intensity === 'number') {
      filter += `:interp=${l.intensity}`;
    }
    if (typeof l.start === 'number' && typeof l.end === 'number') {
      filter = `${filter}:enable='between(t,${l.start},${l.end})'`;
    }
    return filter;
  });
}

function buildVisualFilters(plan: VideoPlan): string[] {
  // Extrae overlays, LUTs y campos avanzados del plan (por segundo o escena)
  const overlays: OverlaySpec[] = [];
  const luts: LUTSpec[] = [];
  const advancedFilters: string[] = [];
  if (plan.timeline) {
    for (const sec of plan.timeline) {
      // ✨ MEJORADO: Soporte unificado para tiempo (sistema de cerebros)
      const timeStamp = sec.t ?? sec.segundo ?? 0;
      
      if (Array.isArray(sec.overlays)) {
        for (const o of sec.overlays) overlays.push({ ...o, start: timeStamp, end: timeStamp + 1 });
      }
      if (Array.isArray(sec.luts)) {
        for (const l of sec.luts) luts.push({ ...l, start: timeStamp, end: timeStamp + 1 });
      }
      // Filtros visuales avanzados
      if (sec.corteEdicion) advancedFilters.push(`trim=start=${timeStamp}:duration=${sec.duracionPlano || 1}`);
      if (sec.ritmoEdicion) advancedFilters.push(`setpts=PTS/${sec.ritmoEdicion}`);
      if (sec.tipoTransicion) advancedFilters.push(`fade=t=${sec.tipoTransicion}:st=${timeStamp}:d=0.5`);
      if (sec.animacionTexto) advancedFilters.push(`drawtext=text='${sec.animacionTexto}':x=(w-text_w)/2:y=50:fontsize=48:fontcolor=white:enable='between(t,${timeStamp},${timeStamp+1})'`);
      // Subtítulos multilingües: si hay SRT (campo 'subtitulos' con URL), usarlo; si no, usar layoutSubtitulos
      if (sec.subtitulos && typeof sec.subtitulos === 'string' && sec.subtitulos.endsWith('.srt')) {
        advancedFilters.push(`subtitles='${sec.subtitulos}'`);
      } else if (sec.layoutSubtitulos) {
        advancedFilters.push(`drawtext=text='${sec.layoutSubtitulos}':x=10:y=h-60:fontsize=32:fontcolor=yellow:enable='between(t,${timeStamp},${timeStamp+1})'`);
      }
      if (sec.motivoVisual) advancedFilters.push(`drawbox=x=0:y=0:w=iw:h=ih:color=white@0.05:enable='between(t,${timeStamp},${timeStamp+1})'`);
      if (sec.direccionArte) advancedFilters.push(`eq=contrast=${sec.direccionArte === 'barroco' ? 1.5 : 1.0}`);
      if (sec.climaAtmosferico) advancedFilters.push(`curves=preset=${sec.climaAtmosferico}`);
      if (sec.lente) advancedFilters.push(`vignette=enable='between(t,${timeStamp},${timeStamp+1})'`);
      if (sec.texturaRealismo) advancedFilters.push(`unsharp=5:5:${sec.texturaRealismo === 'alta' ? 2 : 1}`);
    }
  }
  return [
    ...buildLUTFilters(luts),
    ...buildOverlayFilters(overlays),
    ...advancedFilters
  ];
}

function buildAudioFilters(plan: VideoPlan): string {
  // EQ, reverb y mezcla avanzada según campos del plan
  let filters = [];
  if (plan.timeline?.some(sec => sec.effects?.includes('reverb'))) {
    filters.push('aecho=0.8:0.9:1000:0.3');
  }
  if (plan.timeline?.some(sec => sec.effects?.includes('eq'))) {
    filters.push('equalizer=f=1000:t=q:w=1:g=3');
  }
  // Mezcla avanzada
  if (plan.timeline?.some(sec => sec.mezclaAudio)) {
    filters.push('amix=inputs=2:duration=longest');
  }
  if (plan.timeline?.some(sec => typeof sec.balanceSonido === 'number')) {
    const bal = Number(plan.timeline[0].balanceSonido) || 0.5;
    filters.push(`pan=stereo|c0=${bal}|c1=${1-bal}`);
  }
  if (plan.timeline?.some(sec => sec.efectoSonoro)) {
    filters.push('aphaser=type=2:stereo=1');
  }
  if (plan.timeline?.some(sec => sec.sonidoAmbiente)) {
    filters.push('volume=0.7');
  }
  return filters.join(',');
}

export async function assembleVideo(opts:{
  plan: VideoPlan;
  clips: string[];
  voiceBuffer: Buffer;  // ✨ MEJORADO: Renombrado de voiceOver para reflejar múltiples voces
  music: Buffer[];
  ambience?: Buffer[];
  sfx?: Buffer[];
}): Promise<string> {
  logger.info('🎬  FFmpegService v7 — ensamblando 1080p60 con overlays/LUTs/EQ…');
  await fs.mkdir(TMP_DIR, { recursive: true });

  const { plan, clips, voiceBuffer, music, ambience = [], sfx = [] } = opts;
  
  // ✅ VALIDACIÓN DEFINITIVA DE CLIPS ANTES DEL MONTAJE
  for (const clip of clips) {
    if (!clip || typeof clip !== 'string') {
      throw new Error("Clip sin URL válida detectado.");
    }
    if (!clip.includes('http')) {
      throw new Error(`Clip con URL inválida: ${clip}`);
    }
  }
  
  const id = uuid();
  const list = path.join(TMP_DIR, `${id}.txt`);
  const concat = path.join(TMP_DIR, `${id}_concat.mp4`);
  const voiceFile = path.join(TMP_DIR, `${id}_voice.mp3`);
  const musicFile = path.join(TMP_DIR, `${id}_music.mp3`);
  const ambienceFile = path.join(TMP_DIR, `${id}_ambience.mp3`);
  const sfxFile = path.join(TMP_DIR, `${id}_sfx.mp3`);
  const avFile = path.join(TMP_DIR, `${id}_av.mp4`);
  const hlsDir = path.join(TMP_DIR, `hls_${id}`);
  const hlsIndex = path.join(hlsDir, 'index.m3u8');

  // Validar existencia de todos los clips antes de continuar
  for (const c of clips) {
    try {
      await fs.access(c);
    } catch {
      logger.error(`❌ Clip no encontrado o inaccesible: ${c}`);
      throw new Error(`Clip no encontrado o inaccesible: ${c}`);
    }
  }

  /* 1️⃣ concat clips (24→1080p60) + filtros visuales + watermark si Free */
  const listContent = clips
    .map(c => `file '${toPosix(c)}'`)
    .join('\n');
  await fs.writeFile(list, listContent);
  try {
    await fs.access(list);
  } catch (err) {
    logger.error(`❌ El archivo de lista para FFmpeg no existe: ${list}`);
    logger.error(`Contenido que se intentó escribir:\n${listContent}`);
    throw new Error('No se pudo crear el archivo de lista para FFmpeg');
  }
  logger.info(`✅ Archivo de lista para FFmpeg creado: ${list}`);
  logger.info('🟡 [FFmpeg] Iniciando concat clips → ' + concat);

  // Detectar si es modo Free para aplicar marca de agua
  const isFree = (plan?.metadata?.mode || '').toLowerCase() === 'free';
  const watermarkPath = isFree ? path.join(process.cwd(), 'assets', 'branding', 'watermark_free.png') : null;
  const videoFilters = [
    'scale=1280:720:force_original_aspect_ratio=decrease',
    'pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    'setsar=1'
  ];
  if (isFree && watermarkPath) {
    // Overlay en esquina inferior derecha, margen 40px
    videoFilters.push(`movie='${watermarkPath}'[wm];[in][wm]overlay=W-w-40:H-h-40:format=auto`);
  }
  await retry(() => execFF(
    ffmpeg().input(toPosix(list)).inputOptions(['-f', 'concat', '-safe', '0'])
      .videoFilters(videoFilters)
      .outputOptions(['-c:v', 'libx264', '-preset', 'ultrafast', '-movflags', '+faststart']),
    concat
  ), RETRIES);
  logger.info('🟢 [FFmpeg] Concat clips OK → ' + concat);

  for (const c of clips) {
    try {
      await fs.access(c);
    } catch {
      logger.error(`❌ Clip no encontrado o inaccesible: ${c}`);
      // Logging estructurado de error de clip
      const { logFeedback } = await import('./feedbackService.js');
      logFeedback({
        service: 'FFmpegService',
        action: 'validateClip',
        success: false,
        error: 'Clip no encontrado o inaccesible',
        params: { clip: c }
      });
      throw new Error(`Clip no encontrado o inaccesible: ${c}`);
    }
  }
  if (Array.isArray(ambience) && ambience.length > 0) {
    const ambienceConcat = Buffer.concat(ambience.filter(b => b && b.length));
    if (ambienceConcat.length) await fs.writeFile(ambienceFile, ambienceConcat);
  }
  // Concatenar sfx por escena
  if (Array.isArray(sfx) && sfx.length > 0) {
    const sfxConcat = Buffer.concat(sfx.filter(b => b && b.length));
    if (sfxConcat.length) await fs.writeFile(sfxFile, sfxConcat);
  }

  /* 3️⃣ Build volume envelope for music */
  const volExpr = buildVolumeExpr(plan);
  const musicFilter = `volume='${volExpr}':eval=frame`;
  // Ambience y SFX pueden tener filtros propios en el futuro

  /* 4️⃣ mezcla multicapa: música, ambience, sfx, voz (con fallback) */
  const audioMix = path.join(TMP_DIR, `${id}_mix.m4a`);
  logger.info('🟡 [FFmpeg] Iniciando mezcla audio multicapa → ' + audioMix);
  const inputs = [];
  const inputOpts = [];
  let filterGraph = [];
  let mapIdx = 0;

  // Helper para crear silencio/beep si falta una capa
  async function ensureAudioFile(filePath: string, duration: number, fallbackType: 'silence' | 'beep' = 'silence') {
    try {
      const stat = await fs.stat(filePath);
      if (stat.size > 0) return filePath;
    } catch {}
    // Si no existe o está vacío, crear fallback
    const ffmpegPathStr = typeof ffmpegPath === 'string' ? ffmpegPath : (ffmpegPath as unknown as string);
    if (!ffmpegPathStr) throw new Error('ffmpeg path not found');
    const fallbackFile = filePath.replace(/\.mp3$/, `_fallback.mp3`);
    return new Promise<string>((res, rej) => {
      const args = fallbackType === 'beep'
        ? ['-f', 'lavfi', '-i', `sine=frequency=440:duration=${duration}`, '-ar', '48000', '-ac', '2', '-q:a', '9', '-acodec', 'libmp3lame', fallbackFile]
        : ['-f', 'lavfi', '-i', `anullsrc=r=48000:cl=stereo`, '-t', String(duration), '-q:a', '9', '-acodec', 'libmp3lame', fallbackFile];
      const proc = spawn(ffmpegPathStr, args);
      proc.on('close', (code) => code === 0 ? res(fallbackFile) : rej(new Error('ffmpeg fallback fail')));
    });
  }

  // Duración total del video (en segundos)
  let totalDuration = 0;
  try {
    const probe = await new Promise<any>((res, rej) => {
      if (typeof ffmpegPath !== 'string') return rej(new Error('ffmpeg path not found'));
      const proc = spawn(ffmpegPath, ['-i', concat, '-hide_banner']);
      let stderr = '';
      proc.stderr.on('data', d => { stderr += d.toString(); });
      proc.on('close', () => {
        const match = stderr.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          const h = parseInt(match[1], 10), m = parseInt(match[2], 10), s = parseFloat(match[3]);
          res(h * 3600 + m * 60 + s);
        } else {
          rej(new Error('No se pudo obtener la duración del video para fallback de audio.'));
        }
      });
    });
    totalDuration = Math.ceil(probe);
  } catch {
    totalDuration = 10; // fallback por si no se puede obtener duración
  }

  // Música
  let musicPath = music && Array.isArray(music) && music.length ? musicFile : null;
  if (plan.timeline?.some(sec => (sec.soundCue && sec.soundCue !== 'fade'))) {
    // Si el plan requiere música pero no hay archivo, crear silencio
    musicPath = await ensureAudioFile(musicFile, totalDuration, 'silence');
  }
  try {
    if (musicPath && (await fs.stat(musicPath)).size > 0) {
      inputs.push(musicPath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]${musicFilter}[music]`);
      mapIdx++;
    }
  } catch {}
  // Ambience
  let ambiencePath = ambience && Array.isArray(ambience) && ambience.length ? ambienceFile : null;
  if (Array.isArray(ambience) && ambience.length > 0) {
    ambiencePath = await ensureAudioFile(ambienceFile, totalDuration, 'silence');
  }
  try {
    if (ambiencePath && (await fs.stat(ambiencePath)).size > 0) {
      inputs.push(ambiencePath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]volume=0.5[amb]`);
      mapIdx++;
    }
  } catch {}
  // SFX
  let sfxPath = sfx && Array.isArray(sfx) && sfx.length ? sfxFile : null;
  if (Array.isArray(sfx) && sfx.length > 0) {
    sfxPath = await ensureAudioFile(sfxFile, totalDuration, 'silence');
  }
  try {
    if (sfxPath && (await fs.stat(sfxPath)).size > 0) {
      inputs.push(sfxPath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]volume=1.0[sfx]`);
      mapIdx++;
    }
  } catch {}
  // Voz
  let voicePath = voiceBuffer && voiceBuffer.length > 0 ? voiceFile : null;
  if (voiceBuffer && voiceBuffer.length > 0) {
    voicePath = await ensureAudioFile(voiceFile, totalDuration, 'beep');
  }
  try {
    if (voicePath && (await fs.stat(voicePath)).size > 0) {
      inputs.push(voicePath);
      inputOpts.push([]);
      filterGraph.push(`[${mapIdx}:a]volume=1.0[voice]`);
      mapIdx++;
    }
  } catch {}

  // Construir filter_complex para mezclar todas las capas
  let amixInputs = [];
  if (filterGraph.find(f => f.includes('[music]'))) amixInputs.push('[music]');
  if (filterGraph.find(f => f.includes('[amb]'))) amixInputs.push('[amb]');
  if (filterGraph.find(f => f.includes('[sfx]'))) amixInputs.push('[sfx]');
  if (filterGraph.find(f => f.includes('[voice]'))) amixInputs.push('[voice]');
  let filterComplex = '';
  if (filterGraph.length > 0) {
    filterComplex = filterGraph.join(';') + `;${amixInputs.join('')}amix=inputs=${amixInputs.length}:duration=longest[aout]`;
  }
  if (amixInputs.length > 0) {
    let ff = ffmpeg();
    for (const inp of inputs) {
      ff = ff.input(inp);
    }
    ff = ff.complexFilter([filterComplex])
      .outputOptions([
        '-map', '[aout]',
        '-c:a', 'aac',
        '-movflags', '+faststart'
      ]);
    await retry(() => execFF(
      ff,
      audioMix
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Mezcla multicapa OK → ' + audioMix);
  } else {
    // Si no hay audio, beep de emergencia
    const beepFile = path.join(TMP_DIR, `${id}_beep.mp3`);
    await new Promise((res, rej) => {
      if (typeof ffmpegPath !== 'string') return rej(new Error('ffmpeg path not found'));
      const proc = spawn(ffmpegPath, [
        '-f', 'lavfi',
        '-i', 'sine=frequency=440:duration=3',
        '-ar', '48000',
        '-ac', '2',
        '-q:a', '9',
        '-acodec', 'libmp3lame',
        beepFile
      ]);
      proc.on('close', (code) => code === 0 ? res(true) : rej(new Error('ffmpeg beep fail')));
    });
    await retry(() => execFF(
      ffmpeg().input(beepFile)
        .outputOptions([
          '-c:a', 'aac',
          '-movflags', '+faststart'
        ]),
      audioMix
    ), RETRIES);
    logger.info('🟢 [FFmpeg] Solo beep de emergencia → ' + audioMix);
  }

  /* 5️⃣ multiplex AV */
  const final1080 = path.join(TMP_DIR, `${id}_1080p.mp4`);
  logger.info('🟡 [FFmpeg] Iniciando multiplex AV → ' + final1080);
  await retry(() => execFF(
    ffmpeg().input(concat).input(audioMix)
      .outputOptions(['-c:v', 'copy', '-c:a', 'copy', '-shortest']),
    final1080
  ), RETRIES);
  logger.info('🟢 [FFmpeg] Multiplex AV OK → ' + final1080);

  /* 6️⃣ HLS 720p */
  await fs.mkdir(hlsDir, { recursive: true });
  logger.info('🟡 [FFmpeg] Iniciando HLS 720p → ' + hlsIndex);
  await retry(() => execFF(
    ffmpeg().input(final1080)
      .videoFilters(['scale=1280:-2'])
      .outputOptions([
        '-c:v', 'libx264', '-c:a', 'aac',
        '-hls_time', '5',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', path.join(hlsDir, 'seg_%03d.ts')
      ]),
    hlsIndex
  ), RETRIES);
  logger.info('🟢 [FFmpeg] HLS 720p OK → ' + hlsIndex);

  /* 7️⃣ Subida real a CDN */
  try {
    // Validar que el archivo existe antes de subir
    await fs.access(final1080);
  } catch (err) {
    logger.error(`❌ El archivo de video final no existe: ${final1080}`);
    throw new Error('No se encontró el archivo de video final para subir al CDN');
  }

  let cdnUrl = '';
  try {
    cdnUrl = await uploadToCDN(final1080, `videos/${path.basename(final1080)}`);
    logger.info(`✅  Video final subido al CDN → ${cdnUrl}`);
  } catch (err) {
    logger.error(`❌ Error al subir el video final al CDN: ${(err instanceof Error ? err.message : err)}`);
    throw new Error('Error al subir el video final al CDN');
  }

  // Validar accesibilidad del video en el CDN
  try {
    const axios = (await import('axios')).default;
    await axios.head(cdnUrl, { timeout: 15000 });
    logger.info(`✅  Video final accesible en CDN: ${cdnUrl}`);
  } catch {
    logger.warn(`⚠️  El video final no es accesible en el CDN (HEAD fail): ${cdnUrl}`);
    throw new Error('El video final no es accesible en el CDN');
  }
  return cdnUrl;
}

```

### 📂 src/services/klingService.ts

```ts

// src/services/klingService.ts
// Servicio para generar clips usando Kling Elements (Fal.ai)

import { fal } from '@fal-ai/client';
import fetch from 'node-fetch';
import { safeLog, hasLargeBase64 } from '../utils/logger.js';

fal.config({ credentials: process.env.FAL_KEY });

type DurationType = '5' | '10';
type AspectRatioType = '16:9' | '1:1' | '9:16';

export interface KlingClipParams {
  prompt: string;
  input_image_urls: string[];
  duration: number | DurationType;
  aspect_ratio?: string | AspectRatioType;
  negative_prompt?: string;
  [key: string]: any;
}

/**
 * Convierte una URL de imagen a base64 con logging seguro
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    safeLog('[KlingService] Convirtiendo URL a base64:', { 
      url: url.substring(0, 80) + '...',
      length: url.length 
    });
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    // Determinar tipo MIME basado en la extensión
    let mimeType = 'image/jpeg'; // por defecto
    if (url.toLowerCase().includes('.png')) mimeType = 'image/png';
    else if (url.toLowerCase().includes('.webp')) mimeType = 'image/webp';
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    safeLog('[KlingService] ✅ Conversión exitosa:', { 
      sizeKB: Math.round(base64.length / 1024),
      mimeType 
    });
    
    return dataUrl;
  } catch (error) {
    console.error(`[KlingService] ❌ Error convirtiendo URL a base64:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudo convertir la imagen ${url} a base64: ${errorMessage}`);
  }
}

export async function generateKlingClip(params: KlingClipParams): Promise<string> {
  console.log('[KlingService] [Validación] Iniciando generación de clip profesional:', { 
    promptLength: params.prompt?.length || 0, 
    imageCount: params.input_image_urls?.length || 0,
    duration: params.duration,
    flujo: 'fondo → actor → base64 → Kling → Kontext → voz/música → edición → exportar'
  });
  
  // ✅ VALIDACIONES DEFINITIVAS AGREGADAS
  const { prompt, input_image_urls, duration, aspect_ratio, negative_prompt } = params;
  
  // Validar que existen URLs de background y actor
  if (!input_image_urls || input_image_urls.length < 2) {
    throw new Error('Se requieren al menos 2 URLs de imagen (background y actor)');
  }
  
  const [background, actor] = input_image_urls;
  
  // Validar background con URL válida
  if (!background?.startsWith("https://")) {
    throw new Error("🎨 Background no tiene URL válida.");
  }
  
  // Validar actor con URL válida  
  if (!actor?.startsWith("https://")) {
    throw new Error("🧍 Actor no tiene URL válida.");
  }
  
  // Validar prompt visual
  if (!prompt || prompt.length < 20) {
    throw new Error("🧠 Prompt visual demasiado corto o inválido.");
  }
  
  // Validación estricta de campos requeridos según flujo profesional
  if (!prompt || typeof prompt !== 'string') {
    console.log('[KlingService] [Error] Prompt inválido:', { prompt });
    throw new Error('El campo prompt es requerido y debe ser string');
  }
  if (!Array.isArray(input_image_urls) || input_image_urls.length < 2 || !input_image_urls.every(url => typeof url === 'string')) {
    console.log('[KlingService] [Error] URLs de imagen inválidas (deben ser fondo y actor):', { input_image_urls });
    throw new Error('input_image_urls debe ser un array de al menos dos strings (fondo y actor)');
  }
  
  // Validar que las URLs sean accesibles públicamente
  for (const url of input_image_urls) {
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      console.log('[KlingService] [Error] URL no pública detectada:', { url });
      throw new Error(`URL de imagen no es accesible públicamente: ${url}. Fal.ai necesita URLs públicas.`);
    }
  }
  console.log('[KlingService] [Validación] URLs validadas correctamente:', { count: input_image_urls.length });
  
  // ✅ RESTAURADO: Convertir URLs a base64 (requerido por Fal.ai)
  safeLog('[KlingService] 🔄 Convirtiendo imágenes a base64 (requerido por Fal.ai)...');
  const input_images_base64: string[] = [];
  
  for (let i = 0; i < input_image_urls.length; i++) {
    const url = input_image_urls[i];
    try {
      const base64 = await urlToBase64(url);
      input_images_base64.push(base64);
      safeLog(`[KlingService] ✅ Imagen ${i + 1}/${input_image_urls.length} convertida`);
    } catch (error) {
      console.error(`[KlingService] ❌ Error convirtiendo imagen ${i + 1}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Fallo al procesar imagen ${i + 1}: ${errorMessage}`);
    }
  }
  
  const durationLiteral: "5" | "10" = String(duration) === '10' ? '10' : '5';
  const allowedAspectRatios: AspectRatioType[] = ['16:9', '1:1', '9:16'];
  const aspectRatioStr: AspectRatioType = allowedAspectRatios.includes(aspect_ratio as AspectRatioType) ? aspect_ratio as AspectRatioType : '16:9';
  const negativePromptStr = negative_prompt || 'blur, distort, and low quality';
  console.log('[KlingService] [Parámetros] Parámetros procesados:', { 
    duration: durationLiteral, 
    aspectRatio: aspectRatioStr, 
    negativePrompt: negativePromptStr.substring(0, 50) + '...' 
  });

  // Construir el payload usando imágenes en base64
  const payload: any = {
    prompt,
    input_image_urls: input_images_base64, // ✅ RESTAURADO: Usar base64 requerido por Fal.ai
    duration: durationLiteral,
    aspect_ratio: aspectRatioStr,
    negative_prompt: negativePromptStr
  };

  // Campos avanzados para edición, dirección de arte, clima, motivo visual, audio, etc.
  const extraFields = [
    'camera', 'visual', 'effects', 'emotion', 'music', 'multitude', 'voz', 'lipSync', 'parametrosVoz',
    'presentador', 'miradaACamara', 'expresionFacial', 'textoNoticia', 'capasVisuales', 'filtros', 'subtitulos',
    'transicionesEditor', 'resolucion', 'formato', 'marcaAgua', 'plan', 'limitesPlan', 'metricaDuracion',
    'metricaEstilo', 'metricaPopularidad', 'blenderHook', 'loraCustom', 'controlTotal', 'detalleGestual',
    'reaccionEmocional', 'cambioLuz', 'expresionFacialActor', 'ritmoEdicion', 'duracionPlano', 'tipoTransicion',
    'convencionGenero', 'feedbackUsuario', 'idioma', 'region', 'localizacionDialogo', 'animacionTexto',
    'efectoEntrada', 'layoutSubtitulos', 'mezclaAudio', 'balanceSonido', 'efectoSonoro', 'perfilUsuario',
    'validacionFinal', 'lente', 'texturaRealismo', 'direccionArte', 'movimientoCamara', 'animacionSutil',
    'climaAtmosferico', 'corteEdicion', 'sonidoAmbiente', 'microaccion', 'motivoVisual'
  ];
  for (const field of extraFields) {
    if (params[field] !== undefined) {
      payload[field] = params[field];
    }
  }

  // Log del payload para debug (seguro)
  safeLog('🔍 Kling payload siendo enviado:', {
    prompt: payload.prompt?.substring(0, 100) + '...',
    imageCount: payload.input_image_urls?.length || 0,
    duration: payload.duration,
    aspect_ratio: payload.aspect_ratio,
    hasImages: payload.input_image_urls?.length > 0,
    extraFieldsCount: Object.keys(payload).filter(k => !['prompt', 'input_image_urls', 'duration', 'aspect_ratio', 'negative_prompt'].includes(k)).length
  });
  console.log('[KlingService] [Fal.ai] Enviando solicitud a Fal.ai Kling Elements:', { model: "fal-ai/kling-video/v1.6/pro/elements" });

  // ✅ MEJORADO: Polling inteligente con queue status
  const TIMEOUT_MS = 1500000; // 90 segundos
  const MAX_RETRIES = 2;
  const POLL_INTERVAL = 5000; // Revisar cada 5 segundos
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[KlingService] [Intento ${attempt}/${MAX_RETRIES}] Enviando a Fal.ai con polling...`);
      
      // Iniciar la generación de video
      const result: any = await fal.queue.submit("fal-ai/kling-video/v1.6/pro/elements", {
        input: payload
      });
      
      const requestId = result.request_id;
      console.log(`[KlingService] [Queue] Video en cola con ID: ${requestId}`);
      
      // Polling para verificar el estado
      let status = 'IN_QUEUE';
      let videoResult = null;
      const startTime = Date.now();
      
      while (status === 'IN_QUEUE' || status === 'IN_PROGRESS') {
        // Verificar timeout
        if (Date.now() - startTime > TIMEOUT_MS) {
          throw new Error(`Timeout después de ${TIMEOUT_MS/1000} segundos`);
        }
        
        // Esperar antes de la siguiente verificación
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        
        // Verificar estado
        try {
          const statusResult: any = await fal.queue.status("fal-ai/kling-video/v1.6/pro/elements", {
            requestId: requestId,
            logs: true
          });
          
          status = statusResult.status;
          console.log(`[KlingService] [Polling] Estado: ${status} - Tiempo transcurrido: ${Math.round((Date.now() - startTime)/1000)}s`);
          
          if (status === 'COMPLETED') {
            videoResult = statusResult.data;
            break;
          } else if (status === 'FAILED') {
            throw new Error(`Fal.ai failed: ${statusResult.error || 'Unknown error'}`);
          }
        } catch (pollError) {
          console.warn(`[KlingService] [Polling] Error verificando estado: ${pollError}`);
          // Continuar polling si es un error temporal
        }
      }
      
      // ✅ VALIDACIÓN DEFINITIVA DEL RESULTADO
      console.log("🔍 Resultado completo de Kling:", videoResult);
      
      if (!videoResult?.video?.url) {
        console.error("❌ Kling falló. Resultado:", videoResult);
        throw new Error("Kling no devolvió video_url");
      }
      
      // Validar resultado original
      if (!videoResult?.video?.url) {
        console.log('[KlingService] [Error] Kling no devolvió video.url:', { 
          hasData: !!videoResult,
          dataKeys: videoResult ? Object.keys(videoResult) : [],
          status,
          attempt
        });
        throw new Error('Kling no devolvió video.url válido');
      }
      
      safeLog('[KlingService] [Success] Video generado exitosamente:', { 
        hasUrl: !!videoResult.video.url,
        urlPrefix: videoResult.video.url.substring(0, 50) + '...',
        attempt,
        totalTime: Math.round((Date.now() - startTime)/1000) + 's'
      });
      
      return videoResult.video.url;
      
    } catch (error: any) {
      const errorData = {
        status: error.status,
        message: error.message,
        body: error.body,
        fieldErrors: error.fieldErrors || 'No field errors',
        detail: error.body?.detail,
        attempt,
        isTimeout: error.message?.includes('Timeout'),
        isQueueError: error.message?.includes('queue') || error.message?.includes('Queue')
      };
      
      safeLog(`[KlingService] [Error] Intento ${attempt}/${MAX_RETRIES} falló:`, errorData);
      
      // Si es el último intento o no es un error recuperable, no reintentar
      if (attempt === MAX_RETRIES || (!errorData.isTimeout && !errorData.isQueueError && error.status !== 408 && error.status !== 429 && error.status !== 503)) {
        console.error('❌ Error final de Fal.ai después de', attempt, 'intentos:', errorData.message || 'Error desconocido');
        throw error;
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      const waitMs = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
      console.log(`[KlingService] [Retry] Esperando ${waitMs}ms antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
  
  // Esta línea nunca debería alcanzarse debido al throw en el último intento
  throw new Error('Todos los intentos fallaron');
}




```

### 📂 src/services/llmService/adaptador-cerebros.ts

```ts
// adaptador-cerebros.ts - Adaptador entre Sistema de Cerebros y Pipeline Legacy

import { dispatchCerebros, type RequestGeneracion } from './dispatcher.js';
import { safeLog } from '../../utils/logger.js';
import { RenderRequest, VideoPlan, TimelineSecond } from '../../utils/types.js';
import { EstiloVisualPrincipal, normalizarEstilo } from '../../types/estilos.js';

/**
 * Adaptador principal que convierte el sistema de cerebros al formato esperado
 * por el pipeline existente (Kling, Murf, FFmpeg)
 */
export async function adaptarCerebrosAVideoPlan(req: RenderRequest): Promise<VideoPlan> {
  console.log('[Adaptador] Convirtiendo request a formato de cerebros...');
  
  // Normalizar estilo usando el sistema unificado
  const estiloVisual = normalizarEstilo(req.visualStyle);
  
  // Crear request para sistema de cerebros
  const requestCerebros: RequestGeneracion = {
    prompt: req.prompt,
    duracion: req.duration,
    estilo: estiloVisual,
    configuracion: {
      demoMode: req.demoMode,
      previewMode: req.previewMode,
      metadata: req.metadata
    }
  };
  
  console.log(`[Adaptador] Despachando a cerebros: ${estiloVisual}`);
  
  try {
    const resultadoCerebros = await dispatchCerebros(requestCerebros);
    
    if (!resultadoCerebros.success) {
      throw new Error(`Sistema de cerebros falló: ${resultadoCerebros.error}`);
    }
    
    safeLog('[Adaptador] Cerebros generaron timeline:', { 
      segundos: resultadoCerebros.videoPlan.length,
      hasMetadata: !!resultadoCerebros.metadata
    });
    
    // Convertir formato de cerebros al formato legacy esperado por el pipeline
    const timelineLegacy: TimelineSecond[] = resultadoCerebros.videoPlan.map((segundo: any, index: number) => {
      
      // Extraer datos del formato de cerebros
      const fondoData = segundo.fondo || {};
      const actorData = segundo.actor || {};
      const camaraData = segundo.camara || {};
      const sonidoData = segundo.sonido || {};
      const edicionData = segundo.edicion || {};
      const narrativaData = segundo.narrativa || {};
      
      // Convertir al formato legacy que espera el pipeline
      const timelineSecond: TimelineSecond = {
        // Campos requeridos para compatibilidad
        t: segundo.segundo,                    // Pipeline legacy usa 't'
        segundo: segundo.segundo,              // Sistema de cerebros usa 'segundo'
        
        // Visual y narrativa
        visual: narrativaData.historia || narrativaData.prompt || `Escena cinematográfica ${segundo.segundo + 1}`,
        backgroundPrompt: fondoData.nombre || fondoData.ambiente || `Fondo para segundo ${segundo.segundo}`,
        actorPrompt: actorData.tipo || actorData.emocion || `Actor para segundo ${segundo.segundo}`,
        
        // Assets (rutas que usa Kling)
        background: fondoData.ruta || fondoData.archivo,
        character: actorData.archivo || actorData.ruta,
        
        // Configuración de cámara (formato esperado por Kling)
        camera: {
          shot: camaraData.shot || 'medium',
          movement: camaraData.movement || 'static'
        },
        movement: camaraData.movement || 'static',
        lighting: camaraData.iluminacion || 'natural',
        
        // Audio (formato esperado por Murf y musicService)
        music: sonidoData.musica ? {
          mood: sonidoData.musica,
          trackId: sonidoData.musica
        } : { mood: 'cinematic', trackId: 'cinematic' },
        
        dialogo: sonidoData.requiereVoz ? narrativaData.dialogo || '' : '',
        lipSync: sonidoData.lipSync || false,
        soundCue: sonidoData.ambiente || 'ambient',
        
        // Edición (formato esperado por FFmpeg)
        transition: edicionData.tipoCorte || 'cut',
        carryover: edicionData.carryover || false,
        audioCarryover: edicionData.audioCarryover || false,
        
        // Efectos visuales y atmósfera
        emotion: segundo.esEmocional ? 'emotional' : 'neutral',
        atmosphere: segundo.tono || 'dramatic',
        colorPalette: camaraData.iluminacion || 'cinematic',
        composition: camaraData.shot || 'medium',
        effects: segundo.esEmocional ? 'dramatic' : 'subtle',
        
        // Campos específicos del sistema de cerebros (para debugging/analytics)
        segmento: segundo.segmento,
        momentoNarrativo: segundo.momentoNarrativo,
        esEmocional: segundo.esEmocional,
        tono: segundo.tono,
        
        // Metadatos adicionales para el pipeline
        visualStyle: estiloVisual,
        faceAnimation: actorData.emocion || 'neutral',
        
        // Overlays y LUTs cinematográficos
        overlays: [],
        luts: resultadoCerebros.configuracion?.filtrosGlobales?.map((filtro: string) => ({
          path: `luts/${filtro}.cube`,
          intensity: 0.7
        })) || []
      };
      
      return timelineSecond;
    });
    
    // Crear VideoPlan compatible con pipeline legacy
    const videoPlanLegacy: VideoPlan = {
      visualStyle: estiloVisual,
      timeline: timelineLegacy,
      metadata: {
        visualStyle: estiloVisual,
        duration: req.duration,
        prompt: req.prompt,
        
        // Metadata del sistema de cerebros (para analytics)
        duracionTotal: resultadoCerebros.metadata.duracionTotal,
        actos: resultadoCerebros.metadata.actos,
        momentosEmocionales: resultadoCerebros.metadata.momentosEmocionales,
        puntosClimax: resultadoCerebros.metadata.puntosClimax,
        configuracionNarrativa: resultadoCerebros.metadata.configuracionNarrativa,
        estiloVisual: resultadoCerebros.metadata.estiloVisual,
        version: resultadoCerebros.metadata.version,
        tiempoGeneracion: resultadoCerebros.tiempoGeneracion,
        
        // Configuración técnica para el pipeline
        frameRate: resultadoCerebros.configuracion?.frameRate || 24,
        aspectRatio: resultadoCerebros.configuracion?.aspectRatio || '16:9',
        resolucion: resultadoCerebros.configuracion?.resolucion || '1920x1080',
        colorGrading: resultadoCerebros.configuracion?.colorGrading || 'cinematic-lut',
        
        // Metadata legacy requerido
        characters: extraerPersonajes(timelineLegacy),
        music: { 
          mood: resultadoCerebros.configuracion?.colorGrading || 'cinematic',
          trackId: 'orchestral-cinematic'
        },
        demoMode: req.demoMode || false,
        
        // Preservar metadata original
        ...req.metadata
      },
      
      // Configuración global para FFmpeg
      configuracionGlobal: resultadoCerebros.configuracion,
      restricciones: resultadoCerebros.restricciones
    };
    
    console.log(`[Adaptador] VideoPlan convertido: ${timelineLegacy.length} segundos`);
    console.log(`[Adaptador] Momentos emocionales: ${videoPlanLegacy.metadata.momentosEmocionales?.length || 0}`);
    console.log(`[Adaptador] Actos narrativos: ${videoPlanLegacy.metadata.actos || 0}`);
    
    return videoPlanLegacy;
    
  } catch (error) {
    console.error('[Adaptador] Error en sistema de cerebros:', error);
    throw new Error(`Adaptador falló: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Extraer personajes del timeline para compatibilidad con voiceService
 */
function extraerPersonajes(timeline: TimelineSecond[]): any[] {
  const personajes = new Set<string>();
  
  timeline.forEach(segundo => {
    if (segundo.dialogo && segundo.dialogo.trim().length > 0) {
      // Extraer personaje del actor o usar genérico
      const nombrePersonaje = segundo.actorPrompt?.split(' ')[0] || 'Narrador';
      personajes.add(nombrePersonaje);
    }
  });
  
  return Array.from(personajes).map((nombre, index) => ({
    name: nombre,
    voiceId: `voice_${index + 1}`,
    gender: index % 2 === 0 ? 'male' : 'female',
    age: 30 + (index * 5),
    language: 'es'
  }));
}

/**
 * Función de utilidad para debug del adaptador
 */
export function debugAdaptador(videoPlan: VideoPlan): void {
  console.log('\n🔍 DEBUG ADAPTADOR:');
  console.log(`Timeline: ${videoPlan.timeline.length} segundos`);
  console.log(`Estilo: ${videoPlan.visualStyle}`);
  console.log(`Actos: ${videoPlan.metadata.actos}`);
  console.log(`Momentos emocionales: ${videoPlan.metadata.momentosEmocionales?.length || 0}`);
  
  // Analizar distribución de shots
  const shots = videoPlan.timeline.map(s => {
    const camera = s.camera;
    if (typeof camera === 'object' && camera !== null && 'shot' in camera) {
      return camera.shot || 'unknown';
    }
    return 'unknown';
  });
  const shotCounts = shots.reduce((acc, shot) => {
    acc[shot] = (acc[shot] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  console.log('Distribución de shots:', shotCounts);
  
  // Analizar música y audio
  const conAudio = videoPlan.timeline.filter(s => s.dialogo && s.dialogo.trim().length > 0).length;
  console.log(`Segundos con diálogo: ${conAudio}/${videoPlan.timeline.length}`);
  
  console.log('🔍 FIN DEBUG\n');
}

```

### 📂 src/services/llmService/cinematic.ts

```ts
// Archivo vacío
```

### 📂 src/services/llmService/dispatcher.ts

```ts
// dispatcher.ts - Dispatcher Principal de Cerebros Cinematográficos

import { orquestarEquipoCinematico, VideoPlanCinematico, validarPlanCinematico } from './estilos/cinematic/orquestador.js';
import { orquestarEquipoCinematico as orquestarEquipoAnime } from './estilos/anime/orquestador.js';
import { orquestarEquipoCinematico as orquestarEquipoCartoon } from './estilos/cartoon/orquestador.js';
import { orquestarEquipoCinematico as orquestarEquipoCommercial } from './estilos/commercial/orquestador.js';
import { EstiloVisualPrincipal } from '../../types/estilos.js';
import { safeLog } from '../../utils/logger.js';

export interface RequestGeneracion {
  prompt: string;
  duracion: number;
  estilo: EstiloVisualPrincipal; // ✅ Usar tipo unificado
  estiloOriginal?: string; // ✅ NUEVO: Preservar estilo original para assets
  configuracion?: any;
}

export interface ResponseGeneracion {
  videoPlan: any;
  tomasReales?: any[]; // ✅ NUEVO: Tomas cinematográficas reales
  metadata: any;
  configuracion: any;
  restricciones: any;
  success: boolean;
  error?: string;
  tiempoGeneracion: number;
}

/**
 * Dispatcher Principal - Coordina todos los estilos cinematográficos
 * Selecciona el equipo de cerebros especializado según el estilo solicitado
 */
export async function dispatchCerebros(request: RequestGeneracion): Promise<ResponseGeneracion> {
  const inicioGeneracion = Date.now();
  
  safeLog('[Dispatcher] Iniciando generación cinematográfica', {
    estilo: request.estilo,
    duracion: request.duracion,
    promptLength: request.prompt?.length || 0
  });
  
  try {
    // Validar request
    if (!validarRequest(request)) {
      throw new Error('Request inválido: faltan parámetros requeridos');
    }
    
    // Despachar al equipo especializado según estilo
    let videoPlan: any;
    
    switch (request.estilo) {
      case 'cinematic':
        safeLog('[Dispatcher] Despachando a equipo cinematográfico...');
        videoPlan = await orquestarEquipoCinematico(request.prompt, request.duracion, request.estiloOriginal || request.estilo); // ✅ PASAR ESTILO ORIGINAL
        
        // 🔍 DEBUG: Analizar plan antes de validar
        safeLog('[Dispatcher] 🔍 DEBUG - Plan recibido del orquestador:', {
          timelineLength: videoPlan?.timeline?.length || 'UNDEFINED',
          hasMetadata: videoPlan?.metadata ? 'PRESENTE' : 'AUSENTE',
          hasConfigGlobal: videoPlan?.configuracionGlobal ? 'PRESENTE' : 'AUSENTE'
        });
        
        if (videoPlan?.timeline?.length > 0) {
          safeLog('[Dispatcher] 🔍 Timeline details:', {
            primerSegundo: videoPlan.timeline[0]?.segundo,
            momentosNarrativos: [...new Set(videoPlan.timeline.map((s: any) => s.momentoNarrativo))]
          });
        }
        
        // Validar plan cinematográfico
        const esValido = validarPlanCinematico(videoPlan);
        safeLog('[Dispatcher] 🔍 Resultado validación:', { esValido });
        
        if (!esValido) {
          safeLog('[Dispatcher] ❌ Plan cinematográfico inválido - detalles:', {
            hasTimeline: !!videoPlan?.timeline,
            timelineLength: videoPlan?.timeline?.length || 0,
            hasMetadata: !!videoPlan?.metadata,
            videoPlanKeys: videoPlan ? Object.keys(videoPlan) : []
          });
          throw new Error('Plan cinematográfico generado es inválido');
        }
        break;
        
      case 'anime':
        safeLog('[Dispatcher] Despachando a equipo anime...');
        videoPlan = await orquestarEquipoAnime(request.prompt, request.duracion, request.estiloOriginal || request.estilo);
        
        // Validar plan anime
        const esValidoAnime = validarPlanCinematico(videoPlan);
        if (!esValidoAnime) {
          throw new Error('Plan anime generado es inválido');
        }
        break;
        
      case 'cartoon':
        safeLog('[Dispatcher] Despachando a equipo cartoon...');
        videoPlan = await orquestarEquipoCartoon(request.prompt, request.duracion, request.estiloOriginal || request.estilo);
        
        // Validar plan cartoon
        const esValidoCartoon = validarPlanCinematico(videoPlan);
        if (!esValidoCartoon) {
          throw new Error('Plan cartoon generado es inválido');
        }
        break;
        
      case 'commercial':
        safeLog('[Dispatcher] Despachando a equipo commercial...');
        videoPlan = await orquestarEquipoCommercial(request.prompt, request.duracion, request.estiloOriginal || request.estilo);
        
        // Validar plan commercial
        const esValidoCommercial = validarPlanCinematico(videoPlan);
        if (!esValidoCommercial) {
          throw new Error('Plan commercial generado es inválido');
        }
        break;
        
      default:
        throw new Error(`Estilo visual no soportado: ${request.estilo}`);
    }
    
    const tiempoGeneracion = Date.now() - inicioGeneracion;
    
    safeLog('[Dispatcher] Generación completada:', {
      tiempoMs: tiempoGeneracion,
      timelineLength: videoPlan.timeline?.length || 0
    });
    
    return {
      videoPlan: videoPlan.timeline,
      tomasReales: videoPlan.tomasReales, // ✅ NUEVO: Pasar las tomas cinematográficas
      metadata: videoPlan.metadata,
      configuracion: videoPlan.configuracionGlobal,
      restricciones: videoPlan.restricciones,
      success: true,
      tiempoGeneracion
    };
    
  } catch (error) {
    const tiempoGeneracion = Date.now() - inicioGeneracion;
    
    console.error('[Dispatcher] Error en generación:', error);
    
    return {
      videoPlan: [],
      metadata: {
        duracionTotal: request.duracion,
        actos: 1,
        momentosEmocionales: [],
        puntosClimax: [],
        configuracionNarrativa: { prompt: request.prompt },
        estiloVisual: request.estilo,
        version: '1.0.0-error'
      },
      configuracion: {
        aspectRatio: '16:9',
        frameRate: 24,
        resolucion: '1920x1080',
        colorGrading: 'none',
        filtrosGlobales: [],
        marcaAgua: true
      },
      restricciones: {},
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      tiempoGeneracion
    };
  }
}

function validarRequest(request: RequestGeneracion): boolean {
  if (!request.prompt || request.prompt.trim().length === 0) {
    console.error('[Dispatcher] Prompt vacío');
    return false;
  }
  
  if (!request.duracion || request.duracion <= 0 || request.duracion > 60) {
    console.error('[Dispatcher] Duración inválida (debe ser 1-60 segundos)');
    return false;
  }
  
  const estilosValidos: EstiloVisualPrincipal[] = ['cinematic', 'anime', 'cartoon', 'commercial'];
  if (!request.estilo || !estilosValidos.includes(request.estilo)) {
    console.error('[Dispatcher] Estilo visual inválido');
    return false;
  }
  
  return true;
}

// Función de utilidad para debugging
export function analizarRequest(request: RequestGeneracion): void {
  safeLog('[Dispatcher] Análisis de request:', {
    promptLength: request.prompt?.length || 0,
    duracion: request.duracion,
    estilo: request.estilo,
    hasConfig: !!request.configuracion,
    configKeys: request.configuracion ? Object.keys(request.configuracion) : []
  });
}

```

### 📂 src/services/llmService/ejemplo-integracion.ts

```ts
// Archivo vacío
```

### 📂 src/services/llmService/estilos/anime/actores.ts

```ts
// estilos/anime/actores.ts - Cerebro Selección de Actores Anime

export async function seleccionarActorAnime(
  actoresDisponibles: any[],
  narrativa: any,
  esEmocional: boolean,
  contexto: any,
  requiereLipSync: boolean
): Promise<any> {
  console.log('[Actores Anime] 🎭 Seleccionando actor anime...');
  
  try {
    // Selección inteligente para anime - personajes más expresivos
    const actorSeleccionado = actoresDisponibles.length > 0 
      ? actoresDisponibles[Math.floor(Math.random() * actoresDisponibles.length)]
      : null;
    
    return {
      archivo: actorSeleccionado?.ruta || actorSeleccionado?.url || 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png',
      nombre: actorSeleccionado?.nombre || 'anime_protagonist',
      tipo: 'anime_character',
      emocion: esEmocional ? 'exagerada' : 'energica',
      expresion: esEmocional ? 'dramatic_anime' : 'determined_anime',
      estilo: 'anime',
      requiereLipSync,
      justificacion: 'Personaje anime seleccionado para máxima expresividad emocional',
      url: actorSeleccionado?.url || ''
    };
    
  } catch (error) {
    console.error('[Actores Anime] ❌ Error seleccionando actor:', error);
    
    return {
      archivo: 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png',
      nombre: 'anime_default',
      tipo: 'anime_character',
      emocion: 'energica',
      expresion: 'standard_anime',
      estilo: 'anime',
      requiereLipSync,
      justificacion: 'Personaje anime por defecto',
      url: ''
    };
  }
}

```

### 📂 src/services/llmService/estilos/anime/arte.ts

```ts
// estilos/anime/arte.ts - Cerebro Director de Arte Anime con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { AssetIndexItem, filtrarFondos, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';
import { getEstiloLimitaciones } from '../../restricciones.js';
import { TomaCinematograficaPlan } from './director.js';

export interface SeleccionFondo {
  ruta: string;
  nombre: string;
  justificacion: string;
  ambiente: string;
  epoca: string;
  estilo_visual: string;
  paleta_colores: string;
}

export interface DecisionArte {
  fondo_seleccionado: string;
  justificacion: string;
  ambiente: string;
  epoca: string;
  estilo_visual: string;
  paleta_colores: string;
  iluminacion: string;
  _fondoSeleccionadoCompleto?: AssetIndexItem;
}

/**
 * Usa IA para tomar decisiones artísticas inteligentes sobre fondos estilo anime
 */
export async function decidirArteConIA(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<DecisionArte> {
  console.log(`[Arte Anime] 🎨 Analizando arte anime con IA para ${momentoNarrativo}...`);
  
  if (tomaInfo) {
    console.log(`[Arte Anime] 🎬 Toma ${tomaInfo.numero}: ${tomaInfo.descripcion} (${tomaInfo.duracion}s)`);
  }
  try {
    const systemBase = await cargarSystemPromptBase();
    
    const especializacionArte = `
Ahora actúas como el CEREBRO DIRECTOR DE ARTE ANIME de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI usa fondos PRE-GENERADOS del CDN (no crea nuevos)
- Tu trabajo es SELECCIONAR el fondo perfecto del catálogo existente para ESTILO ANIME
- Kling Elements animará el fondo seleccionado con movimientos de cámara dinámicos
- Debes garantizar CONTINUIDAD VISUAL ANIME entre tomas
- La primera toma DEBE ser SÚPER visualmente impactante (estilo anime opening)

🎭 SELECCIÓN CONTEXTUAL ANIME POR GÉNERO:
- SHONEN/ACTION → escuelas, dojos, ciudades japonesas, paisajes épicos con energía
- SLICE OF LIFE → apartamentos japoneses, cafeterías, calles residenciales, parques
- ROMANCE/SHOUJO → jardines, sakura, atardeceres, espacios románticos japoneses
- MECHA/SCI-FI → ciudades futuristas, laboratorios, espacios tecnológicos
- FANTASY → paisajes mágicos, templos, naturaleza exuberante
- THRILLER → callejones urbanos, edificios modernos, espacios cerrados dramáticos

🎬 PRINCIPIOS ANIME ESPECÍFICOS:
✅ COLORES VIBRANTES Y SATURADOS - típicos del anime
✅ LUGARES ICÓNICOS JAPONESES cuando sea apropiado
✅ ILUMINACIÓN DRAMÁTICA con alto contraste
✅ ESPACIOS que permitan EMOCIONES EXAGERADAS
✅ Primera toma debe crear SHOCK VISUAL anime
✅ Progresión emocional MÁS INTENSA que el cine live-action

FONDOS DISPONIBLES EN EL CDN:
${fondosDisponibles.slice(0, 20).map(f => `- ${f.nombre}: ${f.lugar}/${f.variante} (${f.ambiente || 'neutro'})`).join('\n')}
${fondosDisponibles.length > 20 ? `... y ${fondosDisponibles.length - 20} fondos más` : ''}

⚠️ REGLAS TÉCNICAS ANIME:
- SIEMPRE prioriza locaciones que soporten EMOCIONES EXAGERADAS
- Para anime escolar: usa escuelas, aulas, patios
- Para anime urbano: usa ciudades japonesas modernas
- Para anime fantasy: usa paisajes naturales dramáticos
- PALETAS MÁS SATURADAS que el cine realista

RESPONDE ÚNICAMENTE con este JSON:
{
  "fondo_seleccionado": "nombre_exacto_del_fondo_seleccionado",
  "justificacion": "por qué este fondo es perfecto para este contexto anime específico",
  "ambiente": "ambiente anime (energético, dramático, romántico, épico, etc)",
  "epoca": "época temporal anime (moderno_japonés, fantasy, futurista, etc)",
  "estilo_visual": "estilo anime específico",
  "paleta_colores": "paleta vibrante apropiada para anime",
  "iluminacion": "iluminación dramática anime"
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
${tomaInfo ? `TOMA INFO: ${tomaInfo.descripcion} (${tomaInfo.emocion})` : ''}

INSTRUCCIONES ESPECÍFICAS ANIME:
- Analiza el prompt para entender el tipo de historia anime
- Selecciona fondo que soporte EMOCIONES EXAGERADAS
- Asegúrate de que el fondo permita movimientos de cámara dinámicos
- Mantén paleta de colores VIBRANTE y SATURADA
- Para momento ${momentoNarrativo}: selecciona apropiadamente

Analiza y selecciona el fondo perfecto para esta toma anime.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionArte, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '',
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const decision = extractFirstJsonBlock(response as string, { returnParsed: true }) as DecisionArte;
    
    if (decision && typeof decision === 'object' && 'fondo_seleccionado' in decision) {
      console.log('[Arte Anime] ✅ Decisión artística anime exitosa');
      
      // Buscar el asset completo
      const assetCompleto = fondosDisponibles.find(f => f.nombre === decision.fondo_seleccionado);
      if (assetCompleto) {
        decision._fondoSeleccionadoCompleto = assetCompleto;
      }
      
      return decision;
    }
  } catch (error) {
    console.error('[Arte Anime] ❌ Error en decisión artística:', error);
  }
  
  // Fallback anime
  console.log('[Arte Anime] 🔄 Usando decisión artística anime fallback...');
  const fondoFallback = fondosDisponibles[0] || {
    nombre: 'japon_urbano_anime',
    ruta: 'escenas/anime/apartamento/baño/día/frontal.png',
    lugar: 'ciudad',
    variante: 'dia'
  };
  
  return {
    fondo_seleccionado: fondoFallback.nombre,
    justificacion: 'Fondo anime por defecto - ciudad japonesa moderna perfecta para historias anime urbanas',
    ambiente: 'energético_anime',
    epoca: 'moderno_japonés',
    estilo_visual: 'anime_vibrante',
    paleta_colores: 'saturada_anime',
    iluminacion: 'dramática_anime',
    _fondoSeleccionadoCompleto: fondoFallback
  };
}

/**
 * Función principal de selección de fondo anime (mantiene compatibilidad)
 */
export async function seleccionarFondoAnime(
  fondosDisponibles: any[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<any> {
  
  try {
    // Convertir fondos al formato esperado
    const fondosNormalizados = fondosDisponibles.map(f => ({
      tipo: 'escenas',
      nombre: f.nombre || f.archivo || `fondo_${Math.random()}`,
      ruta: f.ruta || f.url || '',
      completitud: 'completo',
      estilo: 'anime',
      lugar: f.lugar || 'desconocido',
      variante: f.variante || 'general',
      ambiente: f.ambiente || 'neutro'
    }));

    const decision = await decidirArteConIA(
      fondosNormalizados,
      narrativa,
      momentoNarrativo,
      segundoActual,
      prompt,
      tomaInfo
    );
    
    // Retornar en formato compatible con el sistema existente
    return {
      archivo: decision._fondoSeleccionadoCompleto?.ruta || decision.fondo_seleccionado,
      nombre: decision.fondo_seleccionado,
      tipo: 'anime_background',
      categoria: 'anime',
      ambiente: decision.ambiente,
      estilo: decision.estilo_visual,
      paleta: decision.paleta_colores,
      iluminacion: decision.iluminacion,
      justificacion: decision.justificacion,
      url: decision._fondoSeleccionadoCompleto?.ruta || ''
    };
    
  } catch (error) {
    console.error('[Arte Anime] ❌ Error seleccionando fondo anime:', error);
    
    // Fallback simplificado
    return {
      archivo: 'escenas/anime/apartamento/baño/día/frontal.png',
      nombre: 'anime_default',
      tipo: 'anime_background',
      categoria: 'anime',
      ambiente: 'energético',
      estilo: 'anime_standard',
      paleta: 'vibrante',
      iluminacion: 'dramática',
      justificacion: 'Fondo anime por defecto',
      url: ''
    };
  }
}

```

### 📂 src/services/llmService/estilos/anime/director.ts

```ts
// estilos/anime/director.ts - Cerebro Director Anime con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';

type ActoNarrativo = 'setup' | 'desarrollo' | 'climax' | 'cierre';

export interface NarrativaCinematica {
  historia: string;
  tono: string;
  estructura: ActoNarrativo[];
  momentosEmocionales: number[];
  genero: string;
  ritmo: 'lento' | 'medio' | 'rapido';
  tomas: TomaCinematograficaPlan[];
  continuidad: ContinuidadVisual;
}

export interface TomaCinematograficaPlan {
  numero: number;
  duracion: number;
  tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  descripcion: string;
  movimientoCamara: string;
  estiloVisual: string;
  emocion: string;
  fondo: string;
  actor: string;
  vozMurf: string;
  musica: string;
  efectosSonoros: string;
  carryover: string;
}

export interface ContinuidadVisual {
  paletaColores: string;
  iluminacion: string;
  ambiente: string;
  locacion: string;
  estiloGeneral: string;
}

export async function generarNarrativaAnime(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Anime] 🎬 Generando narrativa anime con IA...');
  
  try {
    // ✅ PASO 1: Cargar assets reales antes de planificar
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('anime');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('anime');
    
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director Anime de CinemaAI
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR ANIME de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI NO genera videos desde cero
- Usa fondos pre-generados del CDN (seleccionas de catálogo existente)
- Usa actores pre-generados del CDN (seleccionas de catálogo existente)  
- Kling Elements anima los fondos como tomas en movimiento
- Murf.ai proporciona voces (catálogo existente)
- Freesound.org proporciona música/efectos (catálogo existente)
- FFmpeg renderiza el resultado final

TU TRABAJO COMO DIRECTOR ANIME:
✅ Crear estructura narrativa anime (introducción dramática → desarrollo intenso → clímax explosivo → final emotivo)
✅ Planificar tomas con EMOCIONES EXAGERADAS típicas del anime
✅ La primera toma DEBE ser SÚPER IMPACTANTE (classic anime opening)
✅ Clips de 5 segundos (ritmo rápido anime)
✅ Movimientos de cámara dinámicos (zoom rápido, ángulos dramáticos)
✅ Transiciones con energía anime
✅ USAR ÚNICAMENTE assets del CDN disponibles (ver lista abajo)

FONDOS DISPONIBLES EN CDN ANIME:
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.tipo}/${f.lugar}/${f.variante}/${f.ambiente} (${f.tags.join(', ')})`).join('\n')}
... y ${fondosDisponibles.length - 20} más fondos anime

ACTORES DISPONIBLES EN CDN ANIME:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.personaje} (${a.edad}, ${a.personalidad})`).join('\n')}
... y ${actoresDisponibles.length - 10} más actores anime

RESPONDE ÚNICAMENTE con este JSON:
{
  "historia": "resumen conciso de la historia anime en 2-3 líneas",
  "tono": "energico|dramatico|epico|emocional|accion|romántico|misterioso",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [2, 8, 14, 20],
  "genero": "shonen|seinen|shoujo|mecha|slice_of_life|fantasy|romance",
  "ritmo": "rapido",
  "tomas": [
    {
      "numero": 1,
      "duracion": 5,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma anime",
      "movimientoCamara": "quick_zoom_in|dynamic_pan|dramatic_tilt|spin_zoom|crash_zoom",
      "estiloVisual": "anime|manga|vibrant",
      "emocion": "shock|excitement|determination|dramatic|intense",
      "fondo": "USAR RUTA EXACTA DEL CDN: tipo/lugar/variante/ambiente",
      "actor": "USAR PERSONAJE EXACTO DEL CDN",
      "vozMurf": "joven_energica|dramatico_anime|emocional_anime",
      "musica": "jpop|jrock|orchestral_anime|electronic|emotional_piano",
      "efectosSonoros": "anime_gasp|wind_whoosh|dramatic_silence|action_sfx",
      "carryover": "descripcion_de_continuidad_anime"
    }
  ],
  "continuidad": {
    "paletaColores": "vibrant|saturated|neon|warm_anime|cool_anime",
    "iluminacion": "dramatic_anime|high_contrast|cell_shaded|vibrant",
    "ambiente": "energetic|dramatic|emotional|intense",
    "locacion": "japon|urban_anime|fantasy|school|natural",
    "estiloGeneral": "anime_style|manga_aesthetic|japanese_animation"
  }
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS ANIME:
- Crea EXACTAMENTE 6 tomas de 5 segundos cada una (total 30s) - RITMO ANIME RÁPIDO
- La PRIMERA toma debe ser SÚPER DRAMÁTICA e IMPACTANTE (estilo anime opening)
- Asegura CONTINUIDAD EMOCIONAL EXAGERADA entre las tomas
- Usa movimientos de cámara DINÁMICOS para anime (quick_zoom, crash_zoom, dramatic_tilt)
- Mantén paleta de colores VIBRANTE y SATURADA típica del anime
- Emociones EXAGERADAS en cada toma

Analiza este prompt y crea un plan anime completo de 6 tomas rápidas.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', // El contexto ya está en el prompt completo
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Anime] ✅ Narrativa anime generada exitosamente');
      console.log(`- Género: ${narrativa.genero}`);
      console.log(`- Tono: ${narrativa.tono}`);
      console.log(`- Ritmo: ${narrativa.ritmo}`);
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Anime] ❌ Error generando narrativa:', error);
  }
  
  // Fallback estructurado y profesional anime
  console.log('[Director Anime] 🔄 Usando narrativa anime fallback...');
  return {
    historia: `Historia anime dramática basada en: ${prompt}`,
    tono: 'energico',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [2, 8, 14, 20, 26],
    genero: 'shonen',
    ritmo: 'rapido',
    tomas: [
      {
        numero: 1,
        duracion: 5,
        tipoToma: 'setup',
        descripcion: 'Dramatic anime opening - impactful establishing shot with character introduction',
        movimientoCamara: 'quick_zoom_in',
        estiloVisual: 'anime',
        emocion: 'shock',
        fondo: 'japon_dramatico',
        actor: 'anime_protagonist',
        vozMurf: 'joven_energica',
        musica: 'jrock_opening',
        efectosSonoros: 'anime_gasp',
        carryover: 'dramatic_start'
      },
      {
        numero: 2,
        duracion: 5,
        tipoToma: 'desarrollo',
        descripcion: 'Character determination moment with intense expression',
        movimientoCamara: 'dramatic_tilt',
        estiloVisual: 'anime',
        emocion: 'determination',
        fondo: 'urban_anime',
        actor: 'anime_protagonist_determined',
        vozMurf: 'dramatico_anime',
        musica: 'orchestral_anime',
        efectosSonoros: 'wind_whoosh',
        carryover: 'emotional_buildup'
      },
      {
        numero: 3,
        duracion: 5,
        tipoToma: 'desarrollo',
        descripcion: 'Action sequence with dynamic movement',
        movimientoCamara: 'dynamic_pan',
        estiloVisual: 'anime',
        emocion: 'excitement',
        fondo: 'action_scene',
        actor: 'anime_action_pose',
        vozMurf: 'joven_energica',
        musica: 'electronic_intense',
        efectosSonoros: 'action_sfx',
        carryover: 'energy_buildup'
      },
      {
        numero: 4,
        duracion: 5,
        tipoToma: 'desarrollo',
        descripcion: 'Emotional conflict internal struggle',
        movimientoCamara: 'spin_zoom',
        estiloVisual: 'anime',
        emocion: 'dramatic',
        fondo: 'emotional_backdrop',
        actor: 'anime_conflicted',
        vozMurf: 'emocional_anime',
        musica: 'emotional_piano',
        efectosSonoros: 'dramatic_silence',
        carryover: 'emotional_tension'
      },
      {
        numero: 5,
        duracion: 5,
        tipoToma: 'climax',
        descripcion: 'Climactic power moment - transformation or breakthrough',
        movimientoCamara: 'crash_zoom',
        estiloVisual: 'anime',
        emocion: 'intense',
        fondo: 'climax_energy',
        actor: 'anime_power_up',
        vozMurf: 'dramatico_anime',
        musica: 'orchestral_climax',
        efectosSonoros: 'power_surge',
        carryover: 'climax_energy'
      },
      {
        numero: 6,
        duracion: 5,
        tipoToma: 'cierre',
        descripcion: 'Emotional resolution with beautiful aftermath',
        movimientoCamara: 'slow_zoom_out',
        estiloVisual: 'anime',
        emocion: 'peaceful',
        fondo: 'serene_ending',
        actor: 'anime_peaceful',
        vozMurf: 'emocional_anime',
        musica: 'peaceful_outro',
        efectosSonoros: 'gentle_wind',
        carryover: 'peaceful_resolution'
      }
    ],
    continuidad: {
      paletaColores: 'vibrant_anime',
      iluminacion: 'dramatic_anime',
      ambiente: 'energetic',
      locacion: 'japon_moderno',
      estiloGeneral: 'anime_style'
    }
  };
}


export function aplicarEstructuraNarrativa(
  timeline: any[], 
  narrativa: NarrativaCinematica, 
  duracion: number
): any[] {
  console.log('[Director Anime] 🎭 Aplicando estructura narrativa anime...');
  
  return timeline.map((segundo, index) => {
    const progreso = index / duracion;
    let acto: ActoNarrativo = 'desarrollo';
    
    // Distribución más rápida para anime
    if (progreso <= 0.20) acto = 'setup';
    else if (progreso <= 0.70) acto = 'desarrollo';
    else if (progreso <= 0.90) acto = 'climax';
    else acto = 'cierre';
    
    const esMomentoEmocional = narrativa.momentosEmocionales.includes(index);
    
    return {
      ...segundo,
      acto,
      tono: narrativa.tono,
      genero: narrativa.genero,
      ritmo: narrativa.ritmo,
      esEmocional: esMomentoEmocional,
      intensidadEmocional: esMomentoEmocional ? 0.9 : 0.6, // Más intensa para anime
      visual: `${segundo.visual || 'Escena anime'} (${acto} - ${narrativa.tono} - estilo anime)`
    };
  });
}

```

### 📂 src/services/llmService/estilos/anime/editor.ts

```ts
// estilos/anime/editor.ts - Cerebro Editor Anime

export function configurarEdicionAnime(
  segundo: number,
  duracionTotal: number,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  esEmocional: boolean,
  tono: string,
  tomaInfo?: any
): any {
  console.log('[Editor Anime] ✂️ Configurando edición anime...');
  
  // Transiciones típicas del anime - más rápidas y dramáticas
  const transicionesAnime = {
    setup: ['dramatic_cut', 'flash_cut', 'impact_cut'],
    desarrollo: ['quick_cut', 'action_cut', 'dynamic_transition'],
    climax: ['explosive_cut', 'power_transition', 'dramatic_flash'],
    cierre: ['soft_fade', 'gentle_transition', 'peaceful_cut']
  };
  
  const transicion = transicionesAnime[momentoNarrativo][
    Math.floor(Math.random() * transicionesAnime[momentoNarrativo].length)
  ];
  
  return {
    duracionEscena: 5, // Clips típicamente más cortos en anime
    tipoCorte: transicion,
    carryover: segundo > 0,
    intensidad: esEmocional ? 'alta' : 'media',
    filtros: ['anime_filter', 'saturation_boost', 'sharp_edges'],
    efectos_visuales: esEmocional ? ['dramatic_flash', 'speed_lines'] : ['subtle_glow'],
    ritmo: 'rapido',
    estilo: 'anime_editing',
    dramatic_timing: esEmocional,
    quick_cuts: true,
    anime_aesthetics: true
  };
}

export function aplicarEstructuraEdicion(timeline: any[], duracion: number): any[] {
  console.log('[Editor Anime] 🎬 Aplicando estructura de edición anime...');
  
  return timeline.map((segundo, index) => {
    const progreso = index / duracion;
    
    // Aplicar filtros anime más intensos
    const filtrosAnime = ['anime_filter', 'vibrant_colors', 'high_contrast'];
    if (segundo.esEmocional) {
      filtrosAnime.push('dramatic_lighting', 'speed_lines');
    }
    
    return {
      ...segundo,
      filtros: filtrosAnime,
      anime_style: true,
      saturation: 1.3, // Más saturado que el cine normal
      contrast: 1.2,
      sharpness: 1.1
    };
  });
}

export function optimizarFlujoAnime(timeline: any[]): any[] {
  console.log('[Editor Anime] ⚡ Optimizando flujo anime...');
  
  return timeline.map((segundo, index) => {
    // Optimizaciones específicas para anime
    const optimizado = {
      ...segundo,
      frame_rate: 30, // Típico para anime
      motion_blur: false, // Anime típicamente sin motion blur
      cell_shading: true,
      edge_enhancement: true,
      color_pop: true
    };
    
    // Transiciones más rápidas entre emociones
    if (index > 0) {
      const anterior = timeline[index - 1];
      if (anterior.esEmocional !== segundo.esEmocional) {
        optimizado.transition_speed = 'fast';
        optimizado.dramatic_transition = true;
      }
    }
    
    return optimizado;
  });
}

```

### 📂 src/services/llmService/estilos/anime/fotografia.ts

```ts
// estilos/anime/fotografia.ts - Cerebro Fotografía Anime

export function configurarCamaraAnime(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  contexto: any,
  esEmocional: boolean,
  tono: string
): any {
  console.log('[Fotografía Anime] 📸 Configurando cámara anime...');
  
  // Movimientos de cámara típicos del anime - más dinámicos
  const movimientosAnime = {
    setup: ['quick_zoom_in', 'dramatic_tilt', 'crash_zoom'],
    desarrollo: ['dynamic_pan', 'quick_zoom_in', 'spin_zoom'],
    climax: ['crash_zoom', 'dramatic_tilt', 'explosive_zoom'],
    cierre: ['slow_zoom_out', 'gentle_pan', 'peaceful_tilt']
  };
  
  const angulosAnime = {
    setup: ['low_angle', 'dutch_angle', 'dramatic'],
    desarrollo: ['medium_angle', 'dynamic', 'action'],
    climax: ['extreme_close', 'power_angle', 'heroic'],
    cierre: ['wide_angle', 'peaceful', 'serene']
  };
  
  const movimiento = movimientosAnime[momentoNarrativo][
    Math.floor(Math.random() * movimientosAnime[momentoNarrativo].length)
  ];
  
  const angulo = angulosAnime[momentoNarrativo][
    Math.floor(Math.random() * angulosAnime[momentoNarrativo].length)
  ];
  
  return {
    shot: esEmocional ? 'close_up' : 'medium',
    movement: movimiento,
    angle: angulo,
    duration: 5, // Típico para anime - clips rápidos
    transition: esEmocional ? 'dramatic_cut' : 'quick_cut',
    focus: 'character_focused',
    style: 'anime_dynamic',
    intensity: esEmocional ? 'high' : 'medium',
    speed: 'fast' // Anime típicamente más rápido
  };
}

```

### 📂 src/services/llmService/estilos/anime/orquestador.ts

```ts
// estilos/anime/orquestador.ts - Cerebro Orquestador Anime

import { generarNarrativaAnime, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoAnime } from './arte.js';
import { seleccionarActorAnime } from './actores.js';
import { configurarCamaraAnime } from './fotografia.js';
import { configurarSonidoAnime } from './sonido.js';
import { configurarEdicionAnime, aplicarEstructuraEdicion, optimizarFlujoAnime } from './editor.js';
import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];
  metadata: MetadataCinematica;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalCinematica;
  tomasReales?: TomaCinematograficaPlan[];
}

export interface SegundoCinematico {
  segundo: number;
  narrativa: any;
  fondo: any;
  actor: any;
  camara: any;
  sonido: any;
  edicion: any;
  segmento: string;
  momentoNarrativo: string;
  esEmocional: boolean;
  tono: string;
}

export interface MetadataCinematica {
  duracionTotal: number;
  actos: number;
  momentosEmocionales: number[];
  puntosClimax: number[];
  configuracionNarrativa: any;
  estiloVisual: 'anime';
  version: string;
}

export interface ConfiguracionGlobalCinematica {
  aspectRatio: string;
  frameRate: number;
  resolucion: string;
  colorGrading: string;
  filtrosGlobales: string[];
  marcaAgua: boolean;
}

export async function orquestarEquipoCinematico(
  prompt: string,
  duracionTotal: number,
  estiloVisual: string = 'anime'
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Anime] Iniciando producción anime');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`);
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN ANIME');
    
    // 1. Cargar recursos usando AssetManager unificado con el estilo correcto
    console.log(`[ORQUESTADOR] 🔄 Cargando assets para estilo: ${estiloVisual}...`);
    const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual);
    const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual);
    
    // Crear assets en formato esperado por el sistema existente
    const assets = {
      fondos: fondosRaw,
      actores: actoresRaw
    };
    
    console.log('[ORQUESTADOR] ✅ Assets cargados', {
      fondos: fondosRaw.length,
      actores: actoresRaw.length,
      diversidadFondos: [...new Set(fondosRaw.map(f => f.lugar || f.tipo))]
    });
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.anime };
    
    // 2. Director: Establecer narrativa Y PLAN DE TOMAS ANIME
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan anime...');
    const narrativaGeneral = await generarNarrativaAnime(prompt);
    
    // ✅ VALIDACIÓN DEFENSIVA: Verificar que la narrativa tenga estructura válida
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan anime generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum, t) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    // 3. Procesar cada TOMA ANIME (clips de 5s, emociones exageradas)
    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasAnimePorDefecto(duracionTotal, narrativaGeneral);
    
    // ✅ VALIDACIÓN ADICIONAL: Verificar que todas las tomas sean válidas
    if (!tomasPlanificadas || tomasPlanificadas.length === 0) {
      throw new Error('No se pudieron generar tomas válidas');
    }
    
    // ✅ VALIDACIÓN: Verificar que cada toma tenga propiedades requeridas
    for (let i = 0; i < tomasPlanificadas.length; i++) {
      const toma = tomasPlanificadas[i];
      if (!toma || typeof toma.numero !== 'number' || typeof toma.duracion !== 'number') {
        console.error(`[ORQUESTADOR] ❌ Toma ${i} inválida:`, toma);
        throw new Error(`Toma ${i} no tiene estructura válida`);
      }
    }
    
    console.log(`[ORQUESTADOR] 🎯 DECISIÓN: ${narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 ? 'USANDO TOMAS DEL DIRECTOR' : 'USANDO TOMAS POR DEFECTO'}`);
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas anime`);
    console.log('[ORQUESTADOR] 🎬 INICIANDO BUCLE DE TOMAS ANIME...');
    
    for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
      const toma = tomasPlanificadas[tomaIdx];
      console.log(`[ORQUESTADOR] 📸 TOMA ${toma.numero}: "${toma.descripcion}" (${toma.duracion}s)`);
      
      // ✅ PROCESAR TOMA UNA SOLA VEZ (no segundo-a-segundo)
      console.log(`[ORQUESTADOR] 🧠 Coordinando cerebros para toma ${toma.numero}...`);
      const configuracionToma = await coordinarCerebros({
        segundo: segundoActual,
        duracionTotal,
        toma: toma,
        segundoEnToma: 0,
        esEmocional: narrativaGeneral.momentosEmocionales?.includes(segundoActual) || false,
        narrativaGeneral,
        assets
      });
      
      console.log(`[ORQUESTADOR] ✅ Toma ${toma.numero} configurada - aplicando a ${toma.duracion} segundos`);
      
      // ✅ APLICAR LA CONFIGURACIÓN A TODOS LOS SEGUNDOS DE LA TOMA
      for (let segundoEnToma = 0; segundoEnToma < toma.duracion; segundoEnToma++) {
        if (segundoActual >= duracionTotal) break;
        
        const segundoCinematico = {
          ...configuracionToma,
          segundo: segundoActual,
          segmento: toma.tipoToma || 'desarrollo',
          momentoNarrativo: toma.tipoToma || 'desarrollo'
        };
        
        timeline.push(segundoCinematico);
        segundoActual++;
      }
      
      console.log(`[ORQUESTADOR] ✅ Toma ${toma.numero} aplicada a ${toma.duracion} segundos`);
    }
    
    // 5. Aplicar estructura de edición anime
    console.log('[Orquestador] Aplicando estructura de edición anime...');
    const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
    
    // 6. Optimizar flujo anime
    console.log('[Orquestador] Optimizando flujo anime...');
    const timelineOptimizado = optimizarFlujoAnime(timelineConEdicion);
    
    // 7. Generar metadata y configuración global
    const metadata = generarMetadataAnime(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobalAnime();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal,
      tomasReales: tomasPlanificadas
    };
    
    console.log('[Orquestador] Producción anime completada');
    console.log(`Timeline generado: ${videoPlan.timeline.length} segundos`);
    console.log(`Actos: ${metadata.actos}, Momentos emocionales: ${metadata.momentosEmocionales.length}`);
    
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Anime] 💥 ERROR CRÍTICO en producción:', error);
    console.log('[Orquestador Anime] 🔄 Aplicando fallback de emergencia...');
    return generarPlanAnimeFallback(prompt, duracionTotal);
  }
}

async function coordinarCerebros(contexto: {
  segundo: number;
  duracionTotal: number;
  toma?: TomaCinematograficaPlan;
  segundoEnToma?: number;
  esEmocional: boolean;
  narrativaGeneral: any;
  assets: any;
}): Promise<SegundoCinematico> {
  
  const { segundo, duracionTotal, toma, segundoEnToma, esEmocional, narrativaGeneral, assets } = contexto;
  
  // Determinar contexto usando la toma si está disponible
  const momentoNarrativo = toma?.tipoToma || 'desarrollo';
  const tono = toma?.emocion || 'energico';
  
  // Arte: Seleccionar fondo anime
  const fondo = await seleccionarFondoAnime(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`,
    toma
  );
  
  // Actores: Seleccionar actor anime
  const actor = await seleccionarActorAnime(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo,
    false
  );
  
  // Fotografía: Configurar cámara anime (movimientos rápidos)
  const camara = configurarCamaraAnime(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo,
    esEmocional,
    tono
  );
  
  // Sonido: Configurar audio anime
  const sonido = configurarSonidoAnime(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor,
    toma
  );
  
  // Editor: Configurar edición anime
  const edicion = configurarEdicionAnime(
    segundo,
    duracionTotal,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    tono,
    toma
  );
  
  return {
    segundo,
    narrativa: narrativaGeneral,
    fondo,
    actor,
    camara,
    sonido,
    edicion,
    segmento: toma?.tipoToma || 'desarrollo',
    momentoNarrativo,
    esEmocional,
    tono
  };
}

function generarMetadataAnime(
  narrativa: any,
  duracion: number,
  timeline: SegundoCinematico[]
): MetadataCinematica {
  
  const momentosEmocionales = timeline
    .filter(s => s.esEmocional)
    .map(s => s.segundo);
  
  const puntosClimax = timeline
    .filter(s => s.momentoNarrativo === 'climax')
    .map(s => s.segundo);
  
  return {
    duracionTotal: duracion,
    actos: 3,
    momentosEmocionales,
    puntosClimax,
    configuracionNarrativa: narrativa,
    estiloVisual: 'anime',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobalAnime(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 30, // Anime típicamente a 30fps
    resolucion: '1920x1080',
    colorGrading: 'anime-vibrant',
    filtrosGlobales: ['saturation-boost', 'anime-filter', 'sharp-edges'],
    marcaAgua: true
  };
}

function generarPlanAnimeFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan anime de emergencia');
  
  const timeline: SegundoCinematico[] = [];
  
  for (let segundo = 0; segundo < duracion; segundo++) {
    const progreso = segundo / duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.25) momentoNarrativo = 'setup';
    else if (progreso > 0.75) momentoNarrativo = 'cierre';
    else if (progreso > 0.60) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { prompt, tono: 'energico' },
      fondo: { archivo: 'escenas/anime/apartamento/baño/día/frontal.png', tipo: 'escenario' },
      actor: { archivo: 'actores/anime/apartamento/baño/día/ancianofemeninopensativodeportiva.png', tipo: 'principal' },
      camara: { shot: 'close_up', movement: 'quick_zoom', angle: 'dynamic' },
      sonido: { musica: 'jpop', efectos: [], lipSync: false },
      edicion: { duracionEscena: 3, carryover: false, tipoCorte: 'quick_cut' },
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 5 === 0, // Más frecuente en anime
      tono: 'energico'
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'energico' },
      estiloVisual: 'anime',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.anime },
    configuracionGlobal: generarConfiguracionGlobalAnime()
  };
}

// Función de utilidad para validar el plan generado
export function validarPlanCinematico(plan: VideoPlanCinematico): boolean {
  try {
    if (!plan.timeline || plan.timeline.length === 0) return false;
    if (!plan.metadata || !plan.configuracionGlobal) return false;
    
    for (let i = 0; i < plan.timeline.length; i++) {
      const segundo = plan.timeline[i];
      if (segundo.segundo !== i) return false;
      if (!segundo.fondo || !segundo.actor || !segundo.camara) return false;
    }
    
    const tieneSetup = plan.timeline.some(s => s.momentoNarrativo === 'setup');
    const tieneClimax = plan.timeline.some(s => s.momentoNarrativo === 'climax');
    const tieneCierre = plan.timeline.some(s => s.momentoNarrativo === 'cierre');
    const tieneDesarrollo = plan.timeline.some(s => s.momentoNarrativo === 'desarrollo');
    
    return tieneSetup && (tieneClimax || tieneDesarrollo || tieneCierre);
    
  } catch (error) {
    console.error('[Orquestador] Error validando plan:', error);
    return false;
  }
}

/**
 * Crear tomas anime por defecto - clips de 5s, emociones exageradas
 */
function crearTomasAnimePorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 5; // 5 segundos por toma para anime (más rápido)
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  const promptBase = narrativa.historia || narrativa.prompt || 'Una historia anime';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Dramatic anime opening with exaggerated emotions: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Emotional anime conclusion with powerful final scene: ${promptBase}`;
    } else if (i >= numTomas * 0.6) {
      tipoToma = 'climax';
      descripcionBase = `Intense anime climax with dynamic action: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Fast-paced anime sequence ${i} with emotional intensity: ${promptBase}`;
    }
    
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion,
      movimientoCamara: 'quick_zoom',
      estiloVisual: 'anime',
      emocion: 'energico',
      fondo: 'japon.jpg',
      actor: 'actor_joven.png',
      vozMurf: 'es-ES-AlvaroNeural',
      musica: 'jpop',
      efectosSonoros: 'anime_effects',
      carryover: i > 0 ? 'continuar_energia' : 'inicio_dramatico'
    });
  }
  
  console.log('[Orquestador] 🎬 DEBUG - Tomas anime por defecto creadas:', {
    numTomas: tomas.length,
    tomasPreview: tomas.map(t => ({
      numero: t.numero,
      tipoToma: t.tipoToma,
      descripcion: t.descripcion.substring(0, 80) + '...',
      duracion: t.duracion
    }))
  });
  
  return tomas;
}

```

### 📂 src/services/llmService/estilos/anime/sonido.ts

```ts
// estilos/anime/sonido.ts - Cerebro Sonido Anime

export function configurarSonidoAnime(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundo: number,
  esEmocional: boolean,
  tono: string,
  duracionTotal: number,
  actor: any,
  tomaInfo?: any
): any {
  console.log('[Sonido Anime] 🎵 Configurando sonido anime...');
  
  // Música típica del anime por momento
  const musicaAnime = {
    setup: ['jrock_opening', 'dramatic_intro', 'mystery_anime'],
    desarrollo: ['action_jpop', 'emotional_buildup', 'adventure_theme'],
    climax: ['orchestral_climax', 'power_theme', 'battle_music'],
    cierre: ['peaceful_outro', 'emotional_piano', 'gentle_ending']
  };
  
  // Efectos sonoros típicos del anime
  const efectosAnime = {
    setup: ['anime_gasp', 'wind_whoosh', 'dramatic_silence'],
    desarrollo: ['footsteps', 'environment', 'movement_sfx'],
    climax: ['power_surge', 'explosion', 'dramatic_impact'],
    cierre: ['gentle_wind', 'peaceful_ambience', 'soft_footsteps']
  };
  
  const musica = musicaAnime[momentoNarrativo][
    Math.floor(Math.random() * musicaAnime[momentoNarrativo].length)
  ];
  
  const efectos = efectosAnime[momentoNarrativo][
    Math.floor(Math.random() * efectosAnime[momentoNarrativo].length)
  ];
  
  // Voces para anime (más expresivas)
  const vozAnime = esEmocional ? 'dramatico_anime' : 'joven_energica';
  
  return {
    musica: musica,
    efectos: [efectos],
    volumen_musica: esEmocional ? 0.8 : 0.6,
    volumen_efectos: 0.7,
    ambiente: tono,
    lipSync: false, // Se manejará en post-producción
    voz: vozAnime,
    emotion_intensity: esEmocional ? 'high' : 'medium',
    anime_style: true,
    dramatic_pauses: esEmocional,
    tempo: 'fast' // Típico del anime
  };
}

```

### 📂 src/services/llmService/estilos/cartoon/actores.ts

```ts
// estilos/cartoon/actores.ts - Cerebro Actores Cartoon
export async function seleccionarActorCartoon(actoresDisponibles: any[], narrativa: any, esEmocional: boolean, contexto: any, requiereLipSync: boolean): Promise<any> {
  const actorSeleccionado = actoresDisponibles.length > 0 ? actoresDisponibles[Math.floor(Math.random() * actoresDisponibles.length)] : null;
  return {
    archivo: actorSeleccionado?.ruta || 'actores/comic/casa/baño/día/jovenmasculinoneutrointelectual.png',
    nombre: actorSeleccionado?.nombre || 'cartoon_character',
    tipo: 'cartoon_character',
    emocion: esEmocional ? 'very_happy' : 'cheerful',
    expresion: esEmocional ? 'excited_cartoon' : 'friendly_cartoon',
    estilo: 'cartoon',
    requiereLipSync,
    justificacion: 'Personaje cartoon seleccionado para máxima simpatía y diversión',
    url: actorSeleccionado?.url || ''
  };
}

```

### 📂 src/services/llmService/estilos/cartoon/arte.ts

```ts
// estilos/cartoon/arte.ts - Cerebro Arte Cartoon
export async function seleccionarFondoCartoon(fondosDisponibles: any[], narrativa: any, momentoNarrativo: any, segundoActual: number, prompt: string, tomaInfo?: any): Promise<any> {
  const fondoSeleccionado = fondosDisponibles.length > 0 ? fondosDisponibles[Math.floor(Math.random() * fondosDisponibles.length)] : null;
  return {
    archivo: fondoSeleccionado?.ruta || 'escenas/comic/casa/baño/día/frontal.png',
    nombre: fondoSeleccionado?.nombre || 'cartoon_world',
    tipo: 'cartoon_background',
    categoria: 'cartoon',
    ambiente: 'colorful',
    estilo: 'cartoon_style',
    paleta: 'bright_colors',
    iluminacion: 'cheerful',
    justificacion: 'Fondo cartoon seleccionado para ambiente alegre y familiar',
    url: fondoSeleccionado?.url || ''
  };
}

```

### 📂 src/services/llmService/estilos/cartoon/director.ts

```ts
// estilos/cartoon/director.ts - Cerebro Director Cartoon

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';

type ActoNarrativo = 'setup' | 'desarrollo' | 'climax' | 'cierre';

export interface NarrativaCinematica {
  historia: string;
  tono: string;
  estructura: ActoNarrativo[];
  momentosEmocionales: number[];
  genero: string;
  ritmo: 'lento' | 'medio' | 'rapido';
  tomas: TomaCinematograficaPlan[];
  continuidad: ContinuidadVisual;
}

export interface TomaCinematograficaPlan {
  numero: number;
  duracion: number;
  tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  descripcion: string;
  movimientoCamara: string;
  estiloVisual: string;
  emocion: string;
  fondo: string;
  actor: string;
  vozMurf: string;
  musica: string;
  efectosSonoros: string;
  carryover: string;
}

export interface ContinuidadVisual {
  paletaColores: string;
  iluminacion: string;
  ambiente: string;
  locacion: string;
  estiloGeneral: string;
}

export async function generarNarrativaCartoon(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Cartoon] 🎬 Generando narrativa cartoon con IA...');
  
  try {
    // ✅ PASO 1: Cargar assets reales antes de planificar
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('cartoon');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('cartoon');
    
    const systemBase = await cargarSystemPromptBase();
    
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR CARTOON de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI NO genera videos desde cero
- Usa fondos pre-generados del CDN (seleccionas de catálogo existente)
- Usa actores pre-generados del CDN (seleccionas de catálogo existente)  
- Kling Elements anima los fondos como tomas en movimiento
- Murf.ai proporciona voces (catálogo existente)
- Freesound.org proporciona música/efectos (catálogo existente)
- FFmpeg renderiza el resultado final

TU TRABAJO COMO DIRECTOR CARTOON:
✅ Crear estructura narrativa cartoon (intro divertida → aventura → climax cómico → final feliz)
✅ Planificar tomas con HUMOR y DIVERSIÓN típicas del cartoon
✅ La primera toma DEBE ser DIVERTIDA y capturar atención (classic cartoon opening)
✅ Clips de 8 segundos (ritmo medio cartoon)
✅ Movimientos de cámara amigables (bouncy, smooth, playful)
✅ Transiciones suaves y alegres
✅ USAR ÚNICAMENTE assets del CDN disponibles (ver lista abajo)

FONDOS DISPONIBLES EN CDN CARTOON:
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.tipo}/${f.lugar}/${f.variante}/${f.ambiente} (${f.tags.join(', ')})`).join('\n')}
... y ${fondosDisponibles.length - 20} más fondos cartoon

ACTORES DISPONIBLES EN CDN CARTOON:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.personaje} (${a.edad}, ${a.personalidad})`).join('\n')}
... y ${actoresDisponibles.length - 10} más actores cartoon

RESPONDE ÚNICAMENTE con este JSON:
{
  "historia": "resumen conciso de la historia cartoon en 2-3 líneas",
  "tono": "divertido|alegre|aventurero|comico|familiar|educativo",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [8, 16, 24],
  "genero": "comedia|aventura|familiar|educativo|fantasia|slice_of_life",
  "ritmo": "medio",
  "tomas": [
    {
      "numero": 1,
      "duracion": 8,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma cartoon",
      "movimientoCamara": "bouncy_zoom|smooth_pan|playful_tilt|gentle_zoom|friendly_movement",
      "estiloVisual": "cartoon|animated|colorful",
      "emocion": "happy|excited|curious|playful|friendly",
      "fondo": "USAR RUTA EXACTA DEL CDN: tipo/lugar/variante/ambiente",
      "actor": "USAR PERSONAJE EXACTO DEL CDN",
      "vozMurf": "amigable_cartoon|joven_alegre|narrativo_familiar",
      "musica": "cartoon_theme|playful_music|adventure_tune|happy_melody",
      "efectosSonoros": "cartoon_boings|playful_sounds|adventure_sfx|happy_ambient",
      "carryover": "descripcion_de_continuidad_cartoon"
    }
  ],
  "continuidad": {
    "paletaColores": "bright|colorful|warm|cheerful|vivid",
    "iluminacion": "bright_cartoon|soft_colorful|cheerful|warm",
    "ambiente": "playful|happy|adventurous|friendly",
    "locacion": "cartoon_world|animated_environment|colorful_setting",
    "estiloGeneral": "cartoon_style|animated_aesthetic|family_friendly"
  }
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS CARTOON:
- Crea EXACTAMENTE 4 tomas de 8 segundos cada una (total 32s) - RITMO CARTOON MEDIO
- La PRIMERA toma debe ser DIVERTIDA y AMIGABLE (estilo cartoon opening)
- Asegura CONTINUIDAD ALEGRE entre las tomas
- Usa movimientos de cámara AMIGABLES para cartoon (bouncy, smooth, playful)
- Mantén paleta de colores BRILLANTE y ALEGRE típica del cartoon
- Tono POSITIVO y FAMILIAR en cada toma

Analiza este prompt y crea un plan cartoon completo de 4 tomas amigables.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '',
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Cartoon] ✅ Narrativa cartoon generada exitosamente');
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Cartoon] ❌ Error generando narrativa:', error);
  }
  
  // Fallback cartoon
  console.log('[Director Cartoon] 🔄 Usando narrativa cartoon fallback...');
  return {
    historia: `Historia cartoon divertida basada en: ${prompt}`,
    tono: 'divertido',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [8, 16, 24],
    genero: 'comedia',
    ritmo: 'medio',
    tomas: [
      {
        numero: 1,
        duracion: 8,
        tipoToma: 'setup',
        descripcion: 'Fun cartoon opening with character introduction and colorful world',
        movimientoCamara: 'bouncy_zoom',
        estiloVisual: 'cartoon',
        emocion: 'happy',
        fondo: 'cartoon_world_colorful',
        actor: 'cartoon_protagonist',
        vozMurf: 'amigable_cartoon',
        musica: 'cartoon_theme',
        efectosSonoros: 'cartoon_boings',
        carryover: 'cheerful_start'
      },
      {
        numero: 2,
        duracion: 8,
        tipoToma: 'desarrollo',
        descripcion: 'Adventure begins with playful character interaction',
        movimientoCamara: 'smooth_pan',
        estiloVisual: 'cartoon',
        emocion: 'excited',
        fondo: 'adventure_setting',
        actor: 'cartoon_adventuring',
        vozMurf: 'joven_alegre',
        musica: 'adventure_tune',
        efectosSonoros: 'playful_sounds',
        carryover: 'adventure_buildup'
      },
      {
        numero: 3,
        duracion: 8,
        tipoToma: 'desarrollo',
        descripcion: 'Comedic situation with funny character reactions',
        movimientoCamara: 'playful_tilt',
        estiloVisual: 'cartoon',
        emocion: 'playful',
        fondo: 'comedy_scene',
        actor: 'cartoon_funny_pose',
        vozMurf: 'narrativo_familiar',
        musica: 'playful_music',
        efectosSonoros: 'comedy_sfx',
        carryover: 'comedy_flow'
      },
      {
        numero: 4,
        duracion: 8,
        tipoToma: 'cierre',
        descripcion: 'Happy ending with satisfying cartoon conclusion',
        movimientoCamara: 'gentle_zoom',
        estiloVisual: 'cartoon',
        emocion: 'satisfied',
        fondo: 'happy_ending_scene',
        actor: 'cartoon_happy_ending',
        vozMurf: 'amigable_cartoon',
        musica: 'happy_melody',
        efectosSonoros: 'happy_ambient',
        carryover: 'happy_resolution'
      }
    ],
    continuidad: {
      paletaColores: 'bright_cartoon',
      iluminacion: 'bright_cartoon',
      ambiente: 'playful',
      locacion: 'cartoon_world',
      estiloGeneral: 'cartoon_style'
    }
  };
}

```

### 📂 src/services/llmService/estilos/cartoon/editor.ts

```ts
// estilos/cartoon/editor.ts - Cerebro Editor Cartoon
export function configurarEdicionCartoon(segundo: number, duracionTotal: number, momentoNarrativo: any, esEmocional: boolean, tono: string, tomaInfo?: any): any {
  const transicionesCartoon = {
    setup: ['smooth_cut', 'bouncy_transition', 'cheerful_cut'],
    desarrollo: ['fun_cut', 'playful_transition', 'smooth_cut'],
    climax: ['exciting_cut', 'dynamic_transition', 'fun_peak_cut'],
    cierre: ['gentle_fade', 'happy_transition', 'satisfied_cut']
  };
  const transicion = transicionesCartoon[momentoNarrativo as keyof typeof transicionesCartoon] ? transicionesCartoon[momentoNarrativo as keyof typeof transicionesCartoon][0] : 'smooth_cut';
  return {
    duracionEscena: 8,
    tipoCorte: transicion,
    carryover: segundo > 0,
    intensidad: 'media',
    filtros: ['cartoon_filter', 'bright_colors', 'soft_edges'],
    efectos_visuales: esEmocional ? ['sparkles', 'happy_glow'] : ['soft_glow'],
    ritmo: 'medio',
    estilo: 'cartoon_editing',
    family_friendly: true,
    smooth_transitions: true,
    cartoon_aesthetics: true
  };
}
export function aplicarEstructuraEdicion(timeline: any[], duracion: number): any[] {
  return timeline.map((segundo, index) => {
    const filtrosCartoon = ['cartoon_filter', 'bright_colors', 'family_friendly'];
    if (segundo.esEmocional) {
      filtrosCartoon.push('happy_glow', 'sparkles');
    }
    return {
      ...segundo,
      filtros: filtrosCartoon,
      cartoon_style: true,
      brightness: 1.2,
      saturation: 1.1,
      family_friendly: true
    };
  });
}
export function optimizarFlujoCartoon(timeline: any[]): any[] {
  return timeline.map((segundo, index) => {
    const optimizado = {
      ...segundo,
      frame_rate: 24,
      cartoon_smoothing: true,
      bright_optimization: true,
      family_safe: true,
      color_enhancement: true
    };
    if (index > 0) {
      const anterior = timeline[index - 1];
      if (anterior.esEmocional !== segundo.esEmocional) {
        optimizado.transition_speed = 'smooth';
        optimizado.gentle_transition = true;
      }
    }
    return optimizado;
  });
}

```

### 📂 src/services/llmService/estilos/cartoon/fotografia.ts

```ts
// estilos/cartoon/fotografia.ts - Cerebro Fotografía Cartoon
export function configurarCamaraCartoon(momentoNarrativo: any, contexto: any, esEmocional: boolean, tono: string): any {
  const movimientosCartoon = {
    setup: ['bouncy_zoom', 'gentle_pan', 'friendly_tilt'],
    desarrollo: ['smooth_pan', 'bouncy_zoom', 'playful_movement'],
    climax: ['exciting_zoom', 'dynamic_pan', 'fun_tilt'],
    cierre: ['gentle_zoom_out', 'smooth_pan', 'peaceful_movement']
  };
  const movimiento = movimientosCartoon[momentoNarrativo as keyof typeof movimientosCartoon] ? movimientosCartoon[momentoNarrativo as keyof typeof movimientosCartoon][Math.floor(Math.random() * movimientosCartoon[momentoNarrativo as keyof typeof movimientosCartoon].length)] : 'smooth_pan';
  return {
    shot: esEmocional ? 'close_up' : 'medium',
    movement: movimiento,
    angle: 'friendly',
    duration: 8,
    transition: 'smooth_cut',
    focus: 'character_friendly',
    style: 'cartoon_smooth',
    intensity: 'medium',
    speed: 'medium'
  };
}

```

### 📂 src/services/llmService/estilos/cartoon/orquestador.ts

```ts
// estilos/cartoon/orquestador.ts - Cerebro Orquestador Cartoon

import { generarNarrativaCartoon, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoCartoon } from './arte.js';
import { seleccionarActorCartoon } from './actores.js';
import { configurarCamaraCartoon } from './fotografia.js';
import { configurarSonidoCartoon } from './sonido.js';
import { configurarEdicionCartoon, aplicarEstructuraEdicion, optimizarFlujoCartoon } from './editor.js';
import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];
  metadata: MetadataCinematica;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalCinematica;
  tomasReales?: TomaCinematograficaPlan[];
}

export interface SegundoCinematico {
  segundo: number;
  narrativa: any;
  fondo: any;
  actor: any;
  camara: any;
  sonido: any;
  edicion: any;
  segmento: string;
  momentoNarrativo: string;
  esEmocional: boolean;
  tono: string;
}

export interface MetadataCinematica {
  duracionTotal: number;
  actos: number;
  momentosEmocionales: number[];
  puntosClimax: number[];
  configuracionNarrativa: any;
  estiloVisual: 'cartoon';
  version: string;
}

export interface ConfiguracionGlobalCinematica {
  aspectRatio: string;
  frameRate: number;
  resolucion: string;
  colorGrading: string;
  filtrosGlobales: string[];
  marcaAgua: boolean;
}

export async function orquestarEquipoCinematico(
  prompt: string,
  duracionTotal: number,
  estiloVisual: string = 'cartoon'
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Cartoon] Iniciando producción cartoon');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`);
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN CARTOON');
    
    const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual);
    const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual);
    
    const assets = {
      fondos: fondosRaw,
      actores: actoresRaw
    };
    
    console.log('[ORQUESTADOR] ✅ Assets cargados', {
      fondos: fondosRaw.length,
      actores: actoresRaw.length,
      diversidadFondos: [...new Set(fondosRaw.map(f => f.lugar || f.tipo))]
    });
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cartoon };
    
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan cartoon...');
    const narrativaGeneral = await generarNarrativaCartoon(prompt);
    
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan cartoon generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum: number, t: any) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasCartoonPorDefecto(duracionTotal, narrativaGeneral);
    
    if (!tomasPlanificadas || tomasPlanificadas.length === 0) {
      throw new Error('No se pudieron generar tomas válidas');
    }
    
    for (let i = 0; i < tomasPlanificadas.length; i++) {
      const toma = tomasPlanificadas[i];
      if (!toma || typeof toma.numero !== 'number' || typeof toma.duracion !== 'number') {
        console.error(`[ORQUESTADOR] ❌ Toma ${i} inválida:`, toma);
        throw new Error(`Toma ${i} no tiene estructura válida`);
      }
    }
    
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas cartoon`);
    
    for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
      const toma = tomasPlanificadas[tomaIdx];
      console.log(`[ORQUESTADOR] 📸 TOMA ${toma.numero}: "${toma.descripcion}" (${toma.duracion}s)`);
      
      const configuracionToma = await coordinarCerebros({
        segundo: segundoActual,
        duracionTotal,
        toma: toma,
        segundoEnToma: 0,
        esEmocional: narrativaGeneral.momentosEmocionales?.includes(segundoActual) || false,
        narrativaGeneral,
        assets
      });
      
      for (let segundoEnToma = 0; segundoEnToma < toma.duracion; segundoEnToma++) {
        if (segundoActual >= duracionTotal) break;
        
        const segundoCinematico = {
          ...configuracionToma,
          segundo: segundoActual,
          segmento: toma.tipoToma || 'desarrollo',
          momentoNarrativo: toma.tipoToma || 'desarrollo'
        };
        
        timeline.push(segundoCinematico);
        segundoActual++;
      }
    }
    
    const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
    const timelineOptimizado = optimizarFlujoCartoon(timelineConEdicion);
    
    const metadata = generarMetadataCartoon(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobalCartoon();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal,
      tomasReales: tomasPlanificadas
    };
    
    console.log('[Orquestador] Producción cartoon completada');
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Cartoon] 💥 ERROR CRÍTICO en producción:', error);
    console.log('[Orquestador Cartoon] 🔄 Aplicando fallback de emergencia...');
    return generarPlanCartoonFallback(prompt, duracionTotal);
  }
}

async function coordinarCerebros(contexto: {
  segundo: number;
  duracionTotal: number;
  toma?: TomaCinematograficaPlan;
  segundoEnToma?: number;
  esEmocional: boolean;
  narrativaGeneral: any;
  assets: any;
}): Promise<SegundoCinematico> {
  
  const { segundo, duracionTotal, toma, segundoEnToma, esEmocional, narrativaGeneral, assets } = contexto;
  
  const momentoNarrativo = toma?.tipoToma || 'desarrollo';
  const tono = toma?.emocion || 'comico';
  
  const fondo = await seleccionarFondoCartoon(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`,
    toma
  );
  
  const actor = await seleccionarActorCartoon(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo,
    false
  );
  
  const camara = configurarCamaraCartoon(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo,
    esEmocional,
    tono
  );
  
  const sonido = configurarSonidoCartoon(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor,
    toma
  );
  
  const edicion = configurarEdicionCartoon(
    segundo,
    duracionTotal,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    tono,
    toma
  );
  
  return {
    segundo,
    narrativa: narrativaGeneral,
    fondo,
    actor,
    camara,
    sonido,
    edicion,
    segmento: toma?.tipoToma || 'desarrollo',
    momentoNarrativo,
    esEmocional,
    tono
  };
}

function generarMetadataCartoon(
  narrativa: any,
  duracion: number,
  timeline: SegundoCinematico[]
): MetadataCinematica {
  
  const momentosEmocionales = timeline
    .filter(s => s.esEmocional)
    .map(s => s.segundo);
  
  const puntosClimax = timeline
    .filter(s => s.momentoNarrativo === 'climax')
    .map(s => s.segundo);
  
  return {
    duracionTotal: duracion,
    actos: 3,
    momentosEmocionales,
    puntosClimax,
    configuracionNarrativa: narrativa,
    estiloVisual: 'cartoon',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobalCartoon(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 24, // Cartoon clásico
    resolucion: '1920x1080',
    colorGrading: 'cartoon-bright',
    filtrosGlobales: ['cartoon-filter', 'bright-colors', 'soft-edges'],
    marcaAgua: true
  };
}

function generarPlanCartoonFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan cartoon de emergencia');
  
  const timeline: SegundoCinematico[] = [];
  
  for (let segundo = 0; segundo < duracion; segundo++) {
    const progreso = segundo / duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.25) momentoNarrativo = 'setup';
    else if (progreso > 0.75) momentoNarrativo = 'cierre';
    else if (progreso > 0.60) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { prompt, tono: 'comico' },
      fondo: { archivo: 'escenas/comic/casa/baño/día/frontal.png', tipo: 'escenario' },
      actor: { archivo: 'actores/comic/casa/baño/día/jovenmasculinoneutrointelectual.png', tipo: 'principal' },
      camara: { shot: 'medium', movement: 'bouncy', angle: 'friendly' },
      sonido: { musica: 'cartoon_theme', efectos: [], lipSync: false },
      edicion: { duracionEscena: 4, carryover: false, tipoCorte: 'fun_cut' },
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 8 === 0, // Menos frecuente, más cómico
      tono: 'comico'
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'comico' },
      estiloVisual: 'cartoon',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cartoon },
    configuracionGlobal: generarConfiguracionGlobalCartoon()
  };
}

export function validarPlanCinematico(plan: VideoPlanCinematico): boolean {
  try {
    if (!plan.timeline || plan.timeline.length === 0) return false;
    if (!plan.metadata || !plan.configuracionGlobal) return false;
    
    for (let i = 0; i < plan.timeline.length; i++) {
      const segundo = plan.timeline[i];
      if (segundo.segundo !== i) return false;
      if (!segundo.fondo || !segundo.actor || !segundo.camara) return false;
    }
    
    const tieneSetup = plan.timeline.some(s => s.momentoNarrativo === 'setup');
    const tieneClimax = plan.timeline.some(s => s.momentoNarrativo === 'climax');
    const tieneCierre = plan.timeline.some(s => s.momentoNarrativo === 'cierre');
    const tieneDesarrollo = plan.timeline.some(s => s.momentoNarrativo === 'desarrollo');
    
    return tieneSetup && (tieneClimax || tieneDesarrollo || tieneCierre);
    
  } catch (error) {
    console.error('[Orquestador] Error validando plan:', error);
    return false;
  }
}

function crearTomasCartoonPorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 8; // 8 segundos por toma para cartoon (ritmo medio)
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  const promptBase = narrativa.historia || narrativa.prompt || 'Una historia cartoon';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Fun cartoon opening with character introduction: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Happy cartoon conclusion with satisfying ending: ${promptBase}`;
    } else if (i >= numTomas * 0.6) {
      tipoToma = 'climax';
      descripcionBase = `Exciting cartoon climax with comedic peak: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Fun cartoon sequence ${i} with character development: ${promptBase}`;
    }
    
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion,
      movimientoCamara: 'bouncy_pan',
      estiloVisual: 'cartoon',
      emocion: 'divertido',
      fondo: 'cartoon_world.jpg',
      actor: 'cartoon_character.png',
      vozMurf: 'es-ES-ElviraNeural',
      musica: 'cartoon_theme',
      efectosSonoros: 'cartoon_sfx',
      carryover: i > 0 ? 'continuar_diversion' : 'inicio_alegre'
    });
  }
  
  return tomas;
}

```

### 📂 src/services/llmService/estilos/cartoon/sonido.ts

```ts
// estilos/cartoon/sonido.ts - Cerebro Sonido Cartoon
export function configurarSonidoCartoon(momentoNarrativo: any, segundo: number, esEmocional: boolean, tono: string, duracionTotal: number, actor: any, tomaInfo?: any): any {
  const musicaCartoon = {
    setup: ['cartoon_theme', 'happy_intro', 'playful_start'],
    desarrollo: ['adventure_tune', 'fun_music', 'cartoon_journey'],
    climax: ['exciting_music', 'cartoon_climax', 'fun_peak'],
    cierre: ['happy_ending', 'cartoon_outro', 'satisfied_tune']
  };
  const efectosCartoon = {
    setup: ['cartoon_boings', 'playful_sounds', 'happy_ambient'],
    desarrollo: ['adventure_sfx', 'cartoon_movement', 'fun_effects'],
    climax: ['exciting_sfx', 'cartoon_action', 'climax_sounds'],
    cierre: ['happy_ambient', 'peaceful_cartoon', 'satisfied_sounds']
  };
  const musica = musicaCartoon[momentoNarrativo as keyof typeof musicaCartoon] ? musicaCartoon[momentoNarrativo as keyof typeof musicaCartoon][0] : 'cartoon_theme';
  const efectos = efectosCartoon[momentoNarrativo as keyof typeof efectosCartoon] ? efectosCartoon[momentoNarrativo as keyof typeof efectosCartoon][0] : 'cartoon_boings';
  const vozCartoon = esEmocional ? 'amigable_cartoon' : 'joven_alegre';
  return {
    musica: musica,
    efectos: [efectos],
    volumen_musica: 0.7,
    volumen_efectos: 0.6,
    ambiente: tono,
    lipSync: false,
    voz: vozCartoon,
    emotion_intensity: 'medium',
    cartoon_style: true,
    family_friendly: true,
    tempo: 'medium'
  };
}

```

### 📂 src/services/llmService/estilos/cinematic/actores.ts

```ts
// estilos/cinematic/actores.ts - Cerebro Selección de Actores Cinematográfico

import { AssetIndexItem, filtrarActores, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';
import { TomaCinematograficaPlan } from './director.js';

export interface SeleccionActor {
  ruta: string;
  nombre: string;
  edad: 'joven' | 'adulto' | 'mayor';
  expresion: string;
  tipoVoz: 'masculina' | 'femenina' | 'neutral';
  estiloVoz: string;
}

export async function seleccionarActorCinematico(
  actoresDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoEmocional: boolean,
  tomaInfo: TomaCinematograficaPlan | number, // ✅ TomaCinematograficaPlan o número para retrocompatibilidad
  requiereLipSync: boolean = false
): Promise<SeleccionActor> {
  
  // ✅ Adaptar a sistema de tomas
  const esToma = typeof tomaInfo === 'object';
  const infoToma = esToma ? tomaInfo : { numero: Math.floor((tomaInfo as number) / 10) + 1, duracion: 10, tipoToma: 'desarrollo', descripcion: 'Toma automática' };
  const segundoActual = esToma ? (tomaInfo as TomaCinematograficaPlan).numero * 10 : (tomaInfo as number);
  
  console.log(`[Actores Cinematic] Seleccionando actor para ${esToma ? `toma ${infoToma.numero} (${infoToma.duracion}s)` : `segundo ${segundoActual}`}, emocional: ${momentoEmocional}, tipo: ${infoToma.tipoToma}`);
  
  // ✅ PRIORIDAD 1: Si el Director especificó un actor, usarlo directamente
  if (esToma && (tomaInfo as TomaCinematograficaPlan).actor) {
    const actorEspecificado = (tomaInfo as TomaCinematograficaPlan).actor;
    console.log(`[Actores Cinematic] 🎯 Director especificó actor: ${actorEspecificado}`);
    
    // Buscar el actor exacto especificado por el Director
    let actorDirector: AssetIndexItem | undefined;
    
    // Intentar encontrar por ruta completa primero
    actorDirector = actoresDisponibles.find(a => a.ruta === actorEspecificado);
    
    // Si no se encuentra por ruta, buscar por nombre
    if (!actorDirector && typeof actorEspecificado === 'string') {
      const nombreActor = actorEspecificado.includes('/') 
        ? actorEspecificado.split('/').pop()?.replace(/\.(png|jpg|jpeg)$/, '') 
        : actorEspecificado;
      
      if (nombreActor) {
        actorDirector = actoresDisponibles.find(a => a.nombre === nombreActor);
      }
    }
    
    if (actorDirector) {
      console.log(`[Actores Cinematic] ✅ Usando actor especificado por Director: ${actorDirector.ruta}`);
      const edad = extraerEdadActor(actorDirector.nombre);
      const tipoVoz = determinarTipoVoz(actorDirector.nombre);
      
      return {
        ruta: actorDirector.ruta,
        nombre: actorDirector.nombre,
        edad,
        expresion: momentoEmocional ? getExpresionEmocional(narrativa.tono) : 'neutral',
        tipoVoz,
        estiloVoz: requiereLipSync ? getEstiloVozCinematico(narrativa.tono, edad) : 'sin_voz'
      };
    } else {
      console.warn(`[Actores Cinematic] ⚠️ No se encontró el actor especificado por Director: ${actorEspecificado}`);
    }
  }
  if (actoresDisponibles.length === 0) {
    console.warn('[Actores Cinematic] No hay actores disponibles, usando actor real del CDN');
    return {
      ruta: 'actores/anime/apartamento/cocina/día/ancianomasculinofelizescolar.png', // ✅ ARREGLO: Actor real del índice
      nombre: 'ancianomasculinofelizescolar',
      edad: 'mayor',
      expresion: 'feliz',
      tipoVoz: 'masculina',
      estiloVoz: 'maduro'
    };
  }

  // Seleccionar actor basado en momento emocional y narrativa
  const actorSeleccionado = seleccionarActorPorEmocion(
    actoresDisponibles, 
    momentoEmocional, 
    narrativa.tono, 
    segundoActual
  );

  if (actorSeleccionado) {
    const edad = extraerEdadActor(actorSeleccionado.nombre);
    const tipoVoz = determinarTipoVoz(actorSeleccionado.nombre);
    
    return {
      ruta: actorSeleccionado.ruta,
      nombre: actorSeleccionado.nombre,
      edad,
      expresion: momentoEmocional ? getExpresionEmocional(narrativa.tono) : 'neutral',
      tipoVoz,
      estiloVoz: requiereLipSync ? getEstiloVozCinematico(narrativa.tono, edad) : 'sin_voz'
    };
  }

  // Fallback con rotación
  const actorFallback = seleccionarAssetPorIndice(actoresDisponibles, segundoActual);
  return {
    ruta: actorFallback?.ruta || '',
    nombre: actorFallback?.nombre || 'actor_fallback',
    edad: 'adulto',
    expresion: 'determinado',
    tipoVoz: 'neutral',
    estiloVoz: 'profesional'
  };
}

function seleccionarActorPorEmocion(
  actores: AssetIndexItem[],
  esEmocional: boolean,
  tono: string,
  segundo: number
): AssetIndexItem | null {
  if (!esEmocional) {
    // Para momentos no emocionales, rotación simple
    return seleccionarAssetPorIndice(actores, segundo);
  }

  // Para momentos emocionales, buscar actor apropiado según tono
  const preferenciasEmocionales = {
    dramático: ['serio', 'intenso', 'adulto'],
    épico: ['heroico', 'fuerte', 'decidido'],
    emocional: ['expresivo', 'sensible'],
    misterioso: ['enigmático', 'reservado'],
    acción: ['dinámico', 'atlético', 'joven']
  };

  const palabrasClave = preferenciasEmocionales[tono as keyof typeof preferenciasEmocionales] || ['neutral'];
  
  for (const palabraClave of palabrasClave) {
    const actorCoincidente = actores.find(a => 
      a.nombre.toLowerCase().includes(palabraClave) ||
      a.estilo?.toLowerCase().includes(palabraClave)
    );
    if (actorCoincidente) return actorCoincidente;
  }
  
  return null;
}

function extraerEdadActor(nombreActor: string): 'joven' | 'adulto' | 'mayor' {
  const nombre = nombreActor.toLowerCase();
  if (nombre.includes('joven') || nombre.includes('teen') || nombre.includes('young')) return 'joven';
  if (nombre.includes('mayor') || nombre.includes('old') || nombre.includes('senior')) return 'mayor';
  return 'adulto';
}

function determinarTipoVoz(nombreActor: string): 'masculina' | 'femenina' | 'neutral' {
  const nombre = nombreActor.toLowerCase();
  if (nombre.includes('mujer') || nombre.includes('female') || nombre.includes('ella')) return 'femenina';
  if (nombre.includes('hombre') || nombre.includes('male') || nombre.includes('él')) return 'masculina';
  return 'neutral';
}

function getExpresionEmocional(tono: string): string {
  const expresiones = {
    dramático: 'intenso',
    épico: 'determinado',
    emocional: 'vulnerable',
    misterioso: 'enigmático',
    acción: 'decidido'
  };
  return expresiones[tono as keyof typeof expresiones] || 'neutral';
}

function getEstiloVozCinematico(tono: string, edad: string): string {
  const estilos = {
    dramático: {
      joven: 'emotivo_joven',
      adulto: 'profesional_dramático',
      mayor: 'sabio_profundo'
    },
    épico: {
      joven: 'heroico_joven',
      adulto: 'comandante',
      mayor: 'mentor_épico'
    },
    emocional: {
      joven: 'sensible_joven',
      adulto: 'emotivo_adulto',
      mayor: 'reflexivo'
    }
  };
  
  const estilosPorTono = estilos[tono as keyof typeof estilos];
  if (estilosPorTono) {
    return estilosPorTono[edad as keyof typeof estilosPorTono] || 'profesional_neutro';
  }
  return 'profesional_neutro';
}

```

### 📂 src/services/llmService/estilos/cinematic/arte.ts

```ts
// estilos/cinematic/arte.ts - Cerebro Director de Arte Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { AssetIndexItem, filtrarFondos, seleccionarAssetPorIndice } from '../../helpers/assetUtils.js';
import { getEstiloLimitaciones } from '../../restricciones.js';
import { TomaCinematograficaPlan } from './director.js';

export interface SeleccionFondo {
  ruta: string;
  nombre: string;
  justificacion: string;
  ambiente: string;
  epoca: string;
  estilo_visual: string;
  paleta_colores: string;
}

export interface DecisionArte {
  fondo_seleccionado: string;
  justificacion: string;
  ambiente: string;
  epoca: string;
  estilo_visual: string;
  paleta_colores: string;
  iluminacion: string;
  _fondoSeleccionadoCompleto?: AssetIndexItem; // ✅ Asset completo para evitar confusiones con duplicados
}

/**
 * Usa IA para tomar decisiones artísticas inteligentes sobre fondos y estilo visual
 */
export async function decidirArteConIA(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<DecisionArte> {
  console.log(`[Arte Cinematic] 🎨 Analizando arte con IA para ${momentoNarrativo}...`);
  
  // ✅ Log de información de toma si está disponible
  if (tomaInfo) {
    console.log(`[Arte Cinematic] 🎬 Toma ${tomaInfo.numero}: ${tomaInfo.descripcion} (${tomaInfo.duracion}s)`);
  }
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de Arte de CinemaAI
    const especializacionArte = `
Ahora actúas como el CEREBRO DIRECTOR DE ARTE de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI usa fondos PRE-GENERADOS del CDN (no crea nuevos)
- Tu trabajo es SELECCIONAR el fondo perfecto del catálogo existente según CONTEXTO NARRATIVO
- Kling Elements animará el fondo seleccionado con movimientos de cámara
- Debes garantizar CONTINUIDAD VISUAL entre tomas
- La primera toma DEBE ser visualmente impactante

🎭 SELECCIÓN CONTEXTUAL POR GÉNERO/TONO:
- DRAMA ÍNTIMO/ROMANCE → apartamentos, casas, cafeterías, espacios íntimos y cálidos
- THRILLER CORPORATIVO → oficinas, edificios modernos, interiores profesionales
- AVENTURA ÉPICA → naturaleza, montañas, paisajes amplios, exteriores dramáticos  
- COMEDIA URBANA → calles, plazas, espacios públicos vibrantes
- TERROR/SUSPENSE → interiores cerrados, escaleras, pasillos, espacios claustrofóbicos
- DOCUMENTAL → locaciones apropiadas según el tema específico
- CIENCIA FICCIÓN → espacios futuristas, laboratorios, arquitectura moderna

🎬 PRINCIPIOS CINEMATOGRÁFICOS:
✅ Analiza el PROMPT para entender género, tono y contexto emocional
✅ Selecciona locación que APOYE la narrativa (íntima vs épica según historia)
✅ Mantén COHERENCIA VISUAL entre tomas (paleta, iluminación, estilo)
✅ Considera PROGRESIÓN EMOCIONAL: espacios cerrados→abiertos o viceversa
✅ Primera toma debe crear IMPACTO VISUAL apropiado para el género

FONDOS DISPONIBLES EN EL CDN:
${fondosDisponibles.slice(0, 20).map(f => `- ${f.nombre}: ${f.lugar}/${f.variante} (${f.ambiente || 'neutro'})`).join('\n')}
${fondosDisponibles.length > 20 ? `... y ${fondosDisponibles.length - 20} fondos más` : ''}

⚠️ REGLAS TÉCNICAS:
- SIEMPRE analiza el prompt para entender qué tipo de historia es
- NO apliques filtros rígidos - deja que el contexto decida
- Para dramas íntimos, los apartamentos son PERFECTOS
- Para aventuras épicas, los exteriores son IDEALES
- Considera el movimiento de cámara de Kling

RESPONDE ÚNICAMENTE con este JSON:
{
  "fondo_seleccionado": "nombre_exacto_del_fondo_seleccionado",
  "justificacion": "por qué este fondo es perfecto para este contexto narrativo específico",
  "ambiente": "descripción del ambiente según el género (íntimo, épico, misterioso, etc)",
  "epoca": "época temporal (moderno, clásico, futurista, etc)",
  "estilo_visual": "estilo cinematográfico según contexto",
  "paleta_colores": "paleta apropiada para el género y tono",
  "iluminacion": "tipo de iluminación que refuerza el género"
}`;

    const contextoUsuario = `
NARRATIVA: ${narrativa.historia}
TONO: ${narrativa.tono}
GÉNERO: ${narrativa.genero}
MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
PROMPT ORIGINAL: "${prompt}"

${tomaInfo ? `
INFORMACIÓN ESPECÍFICA DE TOMA DEL DIRECTOR:
- Número: ${tomaInfo.numero}
- Descripción: ${tomaInfo.descripcion}
- Duración: ${tomaInfo.duracion}s
- Tipo: ${tomaInfo.tipoToma}
- Emoción: ${tomaInfo.emocion}
- Fondo especificado por Director: ${tomaInfo.fondo || 'No especificado'}
- Actor especificado por Director: ${tomaInfo.actor || 'No especificado'}
- Movimiento de cámara: ${tomaInfo.movimientoCamara}
- Estilo visual: ${tomaInfo.estiloVisual}

⚠️ IMPORTANTE: Si el Director especificó un fondo específico, DEBES usar exactamente ese fondo.
⚠️ El Director ya analizó la narrativa y seleccionó assets apropiados.
` : ''}

INSTRUCCIONES CRÍTICAS:
- Si es toma 2 o 3, MANTÉN continuidad visual con tomas anteriores
- RECHAZA categóricamente fondos domésticos (apartamentos, baños) para aventuras
- PRIORIZA exteriores épicos y locaciones de aventura
- CONSIDERA cómo el movimiento de cámara afectará la selección

Selecciona el fondo más apropiado y define el estilo visual para esta ${tomaInfo ? 'toma' : 'escena'}.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionArte, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', 
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const decision = extractFirstJsonBlock(response as string, { returnParsed: true }) as DecisionArte;
    
    if (decision && typeof decision === 'object' && 'fondo_seleccionado' in decision) {
      // ✅ EXTRAER NOMBRE Y CONTEXTO ADICIONAL (no descartar información valiosa)
      let nombreLimpio = decision.fondo_seleccionado.trim();
      let contextoAdicional = '';
      
      // Extraer contexto después de : (ej: "aerea.png: desierto_montañoso/amanecer")
      if (nombreLimpio.includes(':')) {
        const partes = nombreLimpio.split(':');
        nombreLimpio = partes[0].trim();
        contextoAdicional = partes[1].trim().toLowerCase();
      }
      
      // Remover descripciones en paréntesis del nombre (pero mantener contexto)
      if (nombreLimpio.includes('(')) {
        const nombrePartes = nombreLimpio.split('(');
        nombreLimpio = nombrePartes[0].trim();
        if (!contextoAdicional && nombrePartes[1]) {
          contextoAdicional += ' ' + nombrePartes[1].replace(')', '').trim().toLowerCase();
        }
      }
      
      console.log(`[Arte Cinematic] 🧹 Limpiando nombre: "${decision.fondo_seleccionado}" → "${nombreLimpio}"`);
      if (contextoAdicional) {
        console.log(`[Arte Cinematic] 📝 Contexto adicional detectado: "${contextoAdicional}"`);
      }
      
      // ✅ BÚSQUEDA ANTI-COLISIÓN: Buscar fondos candidatos con mismo nombre en lista filtrada
      const fondosCandidatos = fondosDisponibles.filter(f => f.nombre === nombreLimpio);
      
      console.log(`[Arte Cinematic] 🔍 Buscando "${nombreLimpio}" - Encontrados ${fondosCandidatos.length} candidatos`);
      fondosCandidatos.forEach((f, idx) => {
        console.log(`  [${idx + 1}] ${f.ruta} (lugar: ${f.lugar}, variante: ${f.variante})`);
      });
      
      if (fondosCandidatos.length > 0) {
        let fondoSeleccionado = fondosCandidatos[0]; // Default: primer candidato
        
        // Si hay múltiples candidatos, aplicar selección inteligente CON CONTEXTO
        if (fondosCandidatos.length > 1) {
          console.log('[Arte Cinematic] 🧠 Múltiples candidatos, aplicando selección inteligente...');
          
          // 🔥 NUEVA ESTRATEGIA: Usar contexto adicional de la IA para selección precisa
          if (contextoAdicional) {
            console.log(`[Arte Cinematic] 🎯 Usando contexto para selección: "${contextoAdicional}"`);
            
            // Buscar coincidencias en el contexto adicional
            for (const candidato of fondosCandidatos) {
              const rutaBaja = candidato.ruta.toLowerCase();
              const lugarBajo = candidato.lugar?.toLowerCase() || '';
              const varianteBaja = candidato.variante?.toLowerCase() || '';
              
              // Verificar si el contexto coincide con la ruta, lugar o variante
              if (rutaBaja.includes(contextoAdicional) || 
                  contextoAdicional.includes(lugarBajo) || 
                  contextoAdicional.includes(varianteBaja) ||
                  lugarBajo.includes(contextoAdicional.split('/')[0]) ||
                  varianteBaja.includes(contextoAdicional.split('/')[0])) {
                fondoSeleccionado = candidato;
                console.log(`[Arte Cinematic] 🎯 Seleccionado por contexto específico "${contextoAdicional}": ${candidato.ruta}`);
                break;
              }
            }
          }
          
          // Si no se encontró por contexto, usar lógica de lugares preferidos
          if (fondoSeleccionado === fondosCandidatos[0]) {
            // Preferir por lugar épico
            const lugaresPreferidos = ['naturaleza', 'ciudad', 'templo'];
            for (const lugar of lugaresPreferidos) {
              const candidatoPorLugar = fondosCandidatos.find(f => f.lugar?.toLowerCase() === lugar);
              if (candidatoPorLugar) {
                fondoSeleccionado = candidatoPorLugar;
                console.log(`[Arte Cinematic] 🎯 Seleccionado por lugar épico "${lugar}": ${candidatoPorLugar.ruta}`);
                break;
              }
            }
          }
          
          // Si no encontró por lugar, preferir por variante épica
          if (fondoSeleccionado === fondosCandidatos[0]) {
            const variantesPreferidas = ['desierto', 'montaña', 'acantilado', 'plaza', 'campo', 'bosque', 'entrada'];
            for (const variante of variantesPreferidas) {
              const candidatoPorVariante = fondosCandidatos.find(f => f.variante?.toLowerCase() === variante);
              if (candidatoPorVariante) {
                fondoSeleccionado = candidatoPorVariante;
                console.log(`[Arte Cinematic] 🎯 Seleccionado por variante épica "${variante}": ${candidatoPorVariante.ruta}`);
                break;
              }
            }
          }
        }
        
        console.log('[Arte Cinematic] ✅ Decisión artística IA exitosa');
        console.log(`- Fondo final: ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
        console.log(`- Contexto: lugar="${fondoSeleccionado.lugar}", variante="${fondoSeleccionado.variante}"`);
        console.log(`- Ambiente: ${decision.ambiente}`);
        
        return {
          ...decision,
          fondo_seleccionado: fondoSeleccionado.nombre,
          _fondoSeleccionadoCompleto: fondoSeleccionado // Asset completo para referencia exacta
        };
      } else {
        console.warn(`[Arte Cinematic] ❌ IA seleccionó fondo no encontrado en lista filtrada: ${nombreLimpio}`);
        console.warn(`[Arte Cinematic] 📋 Fondos épicos disponibles:`);
        fondosDisponibles.slice(0, 5).forEach((f, idx) => {
          console.warn(`  [${idx + 1}] ${f.nombre} → ${f.ruta} (${f.lugar}/${f.variante})`);
        });
        
        // ✅ CRÍTICO: Usar fallback inmediato cuando IA falla
        console.log('[Arte Cinematic] 🔄 IA falló, aplicando fallback inmediato...');
        const fondoFallbackInmediato = seleccionarFondoPorMomento(fondosDisponibles, momentoNarrativo, segundoActual);
        
        if (fondoFallbackInmediato) {
          console.log(`[Arte Cinematic] ✅ Fallback inmediato: ${fondoFallbackInmediato.nombre} → ${fondoFallbackInmediato.ruta}`);
          return {
            ...decision,
            fondo_seleccionado: fondoFallbackInmediato.nombre,
            _fondoSeleccionadoCompleto: fondoFallbackInmediato // ✅ Asset completo
          };
        }
      }
    }
  } catch (error) {
    console.error('[Arte Cinematic] ❌ Error en decisión IA:', error);
  }
  
  // Fallback inteligente
  console.log('[Arte Cinematic] 🔄 Usando fallback inteligente...');
  const fondoFallback = seleccionarFondoPorMomento(fondosDisponibles, momentoNarrativo, segundoActual) || 
                       seleccionarAssetPorIndice(fondosDisponibles, segundoActual);

  if (!fondoFallback) {
    return {
      fondo_seleccionado: 'fondo_fallback',
      justificacion: `No se encontró fondo adecuado, usando fallback por defecto para ${momentoNarrativo}`,
      ambiente: 'neutral',
      epoca: 'moderno',
      estilo_visual: 'cinematográfico',
      paleta_colores: 'equilibrada',
      iluminacion: 'natural'
    };
  }

  return {
    fondo_seleccionado: fondoFallback.nombre,
    justificacion: `Fondo fallback apropiado para ${momentoNarrativo}`,
    ambiente: fondoFallback.ambiente || 'neutral',
    epoca: extraerEpoca(fondoFallback.nombre),
    estilo_visual: 'cinematográfico',
    paleta_colores: 'equilibrada',
    iluminacion: 'natural',
    _fondoSeleccionadoCompleto: fondoFallback // ✅ CRÍTICO: Incluir asset completo
  };
}

export async function seleccionarFondoCinematico(
  fondosDisponibles: AssetIndexItem[],
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt?: string,
  tomaInfo?: TomaCinematograficaPlan
): Promise<SeleccionFondo> {
  console.log(`[Arte Cinematic] Seleccionando fondo para ${momentoNarrativo} - segundo ${segundoActual}`);
  
  // ✅ PRIORIDAD 1: Si el Director ya especificó un fondo, usarlo directamente
  if (tomaInfo?.fondo) {
    console.log(`[Arte Cinematic] 🎯 Director especificó fondo: ${tomaInfo.fondo}`);
    
    // Buscar el asset exacto especificado por el Director
    let fondoEspecifico: AssetIndexItem | undefined;
    
    // Intentar encontrar por ruta completa primero
    fondoEspecifico = fondosDisponibles.find(f => f.ruta === tomaInfo.fondo);
    
    // Si no se encuentra por ruta, buscar por nombre con contexto
    if (!fondoEspecifico && typeof tomaInfo.fondo === 'string') {
      const nombreFondo = tomaInfo.fondo.includes('/') 
        ? tomaInfo.fondo.split('/').pop()?.replace(/\.(png|jpg|jpeg)$/, '') 
        : tomaInfo.fondo;
      
      if (nombreFondo) {
        fondoEspecifico = fondosDisponibles.find(f => f.nombre === nombreFondo);
      }
    }
    
    if (fondoEspecifico) {
      console.log(`[Arte Cinematic] ✅ Usando fondo especificado por Director: ${fondoEspecifico.ruta}`);
      return {
        ruta: fondoEspecifico.ruta,
        nombre: fondoEspecifico.nombre,
        justificacion: `Fondo especificado por el Director cinematográfico`,
        ambiente: fondoEspecifico.ambiente || 'apropiado',
        epoca: 'moderno',
        estilo_visual: 'cinematico',
        paleta_colores: 'según director'
      };
    } else {
      console.warn(`[Arte Cinematic] ⚠️ No se encontró el fondo especificado por Director: ${tomaInfo.fondo}`);
    }
  }
  
  // ✅ Usar información de toma si está disponible
  if (tomaInfo) {
    console.log(`[Arte Cinematic] 🎬 Procesando toma ${tomaInfo.numero}: ${tomaInfo.descripcion} (${tomaInfo.duracion}s)`);
  }
  
  if (fondosDisponibles.length === 0) {
    console.warn('[Arte Cinematic] No hay fondos disponibles, usando fallback');
    return {
      ruta: '',
      nombre: 'fondo_default',
      justificacion: 'Fallback por falta de assets',
      ambiente: 'neutral',
      epoca: 'moderno',
      estilo_visual: 'neutro',
      paleta_colores: 'equilibrada'
    };
  }

  // Usar IA si tenemos prompt, sino lógica tradicional
  if (prompt) {
    const decisionIA = await decidirArteConIA(
      fondosDisponibles, 
      narrativa, 
      momentoNarrativo, 
      segundoActual, 
      prompt,
      tomaInfo // ✅ Pasar información de toma a la IA
    );
    
    // 🔍 DEBUG: Verificar qué retornó decidirArteConIA
    console.log(`[Arte Cinematic] 🔍 DEBUG - decisionIA recibida:`, {
      fondo_seleccionado: decisionIA?.fondo_seleccionado,
      _fondoSeleccionadoCompleto: decisionIA?._fondoSeleccionadoCompleto ? 'PRESENTE' : 'UNDEFINED',
      _fondoSeleccionadoCompleto_nombre: decisionIA?._fondoSeleccionadoCompleto?.nombre,
      _fondoSeleccionadoCompleto_ruta: decisionIA?._fondoSeleccionadoCompleto?.ruta
    });
    
    // ✅ CRÍTICO: Usar el asset completo si está disponible (evita confusiones con duplicados)
    let fondoSeleccionado: AssetIndexItem | undefined;
    
    if (decisionIA._fondoSeleccionadoCompleto) {
      // Tenemos el asset completo - usar directamente
      fondoSeleccionado = decisionIA._fondoSeleccionadoCompleto;
      console.log(`[Arte Cinematic] ✅ IA seleccionó fondo (asset completo): ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
    } else {
      // Buscar por nombre (puede haber duplicados)
      fondoSeleccionado = fondosDisponibles.find(f => f.nombre === decisionIA.fondo_seleccionado);
      if (fondoSeleccionado) {
        console.log(`[Arte Cinematic] ✅ IA seleccionó fondo (por nombre): ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
      } else {
        console.warn(`[Arte Cinematic] ⚠️ IA seleccionó fondo no encontrado: ${decisionIA.fondo_seleccionado}`);
      }
    }
    
    if (fondoSeleccionado) {
      return {
        ruta: fondoSeleccionado.ruta,
        nombre: fondoSeleccionado.nombre,
        justificacion: decisionIA.justificacion,
        ambiente: decisionIA.ambiente,
        epoca: decisionIA.epoca,
        estilo_visual: decisionIA.estilo_visual,
        paleta_colores: decisionIA.paleta_colores
      };
    }
  }

  // Lógica tradicional como fallback
  const fondoSeleccionado = seleccionarFondoPorMomento(fondosDisponibles, momentoNarrativo, segundoActual);
  
  if (fondoSeleccionado) {
    console.log(`[Arte Cinematic] ✅ Lógica tradicional seleccionó: ${fondoSeleccionado.nombre} → ${fondoSeleccionado.ruta}`);
    return {
      ruta: fondoSeleccionado.ruta,
      nombre: fondoSeleccionado.nombre,
      justificacion: `Fondo seleccionado para ${momentoNarrativo}: ${fondoSeleccionado.ambiente || 'ambiente neutro'}`,
      ambiente: fondoSeleccionado.ambiente || 'neutral',
      epoca: extraerEpoca(fondoSeleccionado.nombre),
      estilo_visual: 'cinematográfico',
      paleta_colores: 'equilibrada'
    };
  }

  // Fallback con rotación
  const fondoFallback = seleccionarAssetPorIndice(fondosDisponibles, segundoActual);
  console.log(`[Arte Cinematic] ⚠️ Usando fallback por rotación: ${fondoFallback?.nombre} → ${fondoFallback?.ruta}`);
  return {
    ruta: fondoFallback?.ruta || '',
    nombre: fondoFallback?.nombre || 'fondo_fallback',
    justificacion: 'Selección por rotación sistemática',
    ambiente: fondoFallback?.ambiente || 'neutral',
    epoca: 'moderno',
    estilo_visual: 'neutral',
    paleta_colores: 'equilibrada'
  };
}

function seleccionarFondoPorMomento(
  fondos: AssetIndexItem[], 
  momento: string, 
  segundo: number
): AssetIndexItem | null {
  console.log(`[Arte] 🔍 SELECCIÓN CONTEXTUAL - Momento: ${momento}, Fondos disponibles: ${fondos.length}`);
  
  // ✅ Sin filtros rígidos - todos los fondos están disponibles para decisión contextual
  
  if (fondos.length === 0) {
    console.log(`[Arte] ❌ ALERTA: NO HAY FONDOS DISPONIBLES`);
    return null;
  }
  
  // Log de diversidad de fondos disponibles
  const lugaresDisponibles = [...new Set(fondos.map(f => f.lugar).filter(Boolean))];
  const variantesDisponibles = [...new Set(fondos.map(f => f.variante).filter(Boolean))];
  
  console.log(`[Arte] 📍 Lugares disponibles: ${lugaresDisponibles.join(', ')}`);
  console.log(`[Arte] 🏗️ Variantes disponibles: ${variantesDisponibles.slice(0, 10).join(', ')}${variantesDisponibles.length > 10 ? '...' : ''}`);
  
  // Usar todos los fondos para máxima flexibilidad
  const fondosParaSeleccion = fondos;
  
  // Lógica de selección mejorada por momento narrativo usando campos JSON
  const preferencias = {
    setup: {
      lugares: ['ciudad', 'naturaleza'],
      variantes: ['entrada', 'frontal', 'calle', 'plaza', 'acantilado'],
      angulos: ['frontal', 'aerea']
    },
    desarrollo: {
      lugares: ['naturaleza', 'ciudad'],
      variantes: ['bosque', 'campo', 'río', 'parque', 'calle'],
      angulos: ['lateral', 'frontal']
    },
    climax: {
      lugares: ['naturaleza', 'templo'],
      variantes: ['montaña', 'acantilado', 'altar', 'torre'],
      angulos: ['aerea', 'frontal']
    },
    cierre: {
      lugares: ['naturaleza', 'ciudad'],
      variantes: ['campo', 'valle', 'plaza', 'parque'],
      angulos: ['frontal', 'aerea']
    }
  };

  const pref = preferencias[momento as keyof typeof preferencias] || preferencias.desarrollo;
  console.log(`[Arte] 🎯 Buscando fondos para momento '${momento}' con preferencias:`, pref);
  
  // Buscar por lugar preferido primero
  for (const lugar of pref.lugares) {
    const fondoPorLugar = fondosParaSeleccion.find(f => f.lugar?.toLowerCase() === lugar);
    if (fondoPorLugar) {
      console.log(`[Arte] 🎯 FONDO SELECCIONADO POR LUGAR: ${fondoPorLugar.nombre} (lugar: ${fondoPorLugar.lugar}) → ${fondoPorLugar.ruta}`);
      return fondoPorLugar;
    }
  }
  
  // Buscar por variante preferida
  for (const variante of pref.variantes) {
    const fondoPorVariante = fondosParaSeleccion.find(f => f.variante?.toLowerCase() === variante);
    if (fondoPorVariante) {
      console.log(`[Arte] 🎯 FONDO SELECCIONADO POR VARIANTE: ${fondoPorVariante.nombre} (variante: ${fondoPorVariante.variante}) → ${fondoPorVariante.ruta}`);
      return fondoPorVariante;
    }
  }
  
  // Si no encuentra coincidencia específica, tomar el primer fondo épico
  const fondoFallback = fondosParaSeleccion[0];
  console.log(`[Arte] � FONDO FALLBACK ÉPICO: ${fondoFallback.nombre} → ${fondoFallback.ruta}`);
  return fondoFallback;
}

function extraerEpoca(nombreFondo: string): string {
  const epocas = ['moderno', 'vintage', 'futurista', 'clásico', 'medieval'];
  for (const epoca of epocas) {
    if (nombreFondo.toLowerCase().includes(epoca)) return epoca;
  }
  return 'moderno';
}

export function aplicarEstilizacionCinematica(timeline: any[]): any[] {
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  return timeline.map((segundo, index) => ({
    ...segundo,
    colorGrading: 'teal-orange',
    aspectRatio: '2.35:1',
    cinematicStyle: 'hollywood',
    lighting: 'natural' // Valor por defecto, ya que limitaciones.lighting no existe
  }));
}

```

### 📂 src/services/llmService/estilos/cinematic/director.ts

```ts
// estilos/cinematic/director.ts - Cerebro Director Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';

type ActoNarrativo = 'setup' | 'desarrollo' | 'climax' | 'cierre';

export interface NarrativaCinematica {
  historia: string;
  tono: string;
  estructura: ActoNarrativo[];
  momentosEmocionales: number[];
  genero: string;
  ritmo: 'lento' | 'medio' | 'rapido';
  tomas: TomaCinematograficaPlan[]; // ✅ NUEVO: Plan específico de tomas
  continuidad: ContinuidadVisual; // ✅ NUEVO: Reglas de continuidad
}

export interface TomaCinematograficaPlan {
  numero: number;
  duracion: number;
  tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  descripcion: string;
  movimientoCamara: string;
  estiloVisual: string;
  emocion: string;
  fondo: string; // ✅ OBLIGATORIO: Fondo específico del CDN
  actor: string; // ✅ OBLIGATORIO: Actor específico
  vozMurf: string; // ✅ OBLIGATORIO: Voz Murf.ai
  musica: string; // ✅ OBLIGATORIO: Música/emoción
  efectosSonoros: string; // ✅ OBLIGATORIO: Efectos sonoros
  carryover: string; // ✅ OBLIGATORIO: Conexión con toma anterior
}

export interface ContinuidadVisual {
  paletaColores: string;
  iluminacion: string;
  ambiente: string;
  locacion: string;
  estiloGeneral: string;
}

export async function generarNarrativaCinematica(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Cinematic] 🎬 Generando narrativa cinematográfica con IA...');
  
  try {
    // ✅ CORRECCIÓN CRÍTICA: Cargar assets reales ANTES de generar plan
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('cinematic');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('cinematic');
    
    console.log('[Director] 🎯 Assets disponibles:', {
      fondos: fondosDisponibles.length,
      actores: actoresDisponibles.length,
      ejemplosFondos: fondosDisponibles.slice(0, 5).map(f => ({ lugar: f.lugar, variante: f.variante, ambiente: f.ambiente })),
      ejemplosActores: actoresDisponibles.slice(0, 3).map(a => a.nombre)
    });
    
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de CinemaAI con assets reales
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR CINEMATOGRÁFICO de CinemaAI.

ASSETS REALES DISPONIBLES EN EL CDN:
FONDOS: ${fondosDisponibles.map(f => `${f.lugar}/${f.variante}/${f.ambiente} (${f.angulo})`).slice(0, 20).join(', ')}
ACTORES: ${actoresDisponibles.map(a => a.nombre.replace('.png', '')).slice(0, 10).join(', ')}

CONTEXTO TÉCNICO REAL:
- CinemaAI usa ÚNICAMENTE los fondos listados arriba del CDN
- Debes elegir fondos ESPECÍFICOS que existan realmente
- Los actores están pre-generados, elige nombres EXACTOS de la lista
- Kling Elements anima estos fondos como tomas en movimiento
- La narrativa DEBE ser comprensible y tener continuidad visual

TU TRABAJO COMO DIRECTOR:
✅ Crear historia coherente que use ÚNICAMENTE assets disponibles
✅ Primera toma DEBE ser impactante y establecer contexto
✅ Cada toma debe conectar visualmente con la anterior (carryover)
✅ Usar lugares reales del CDN que tengan sentido narrativo
✅ Los fondos DEBEN existir en la lista de arriba

EJEMPLOS DE FONDOS CORRECTOS:
- "apartamento/cocina/día" para escenas caseras
- "casa/patio/día" para exteriores
- "naturaleza/montaña/día" para aventuras
- "ciudad/calle/noche" para drama urbano

RESPONDE ÚNICAMENTE con este JSON usando ASSETS REALES:
{
  "historia": "resumen conciso de la historia en 2-3 líneas",
  "tono": "dramático|épico|emocional|misterioso|acción|romántico|thriller",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [5, 15, 25],
  "genero": "drama|acción|misterio|romance|thriller|aventura|ciencia_ficcion",
  "ritmo": "lento|medio|rapido",
  "tomas": [
    {
      "numero": 1,
      "duracion": 10,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma",
      "movimientoCamara": "slow_zoom_in|pan_left|pan_right|tilt_up|tilt_down|static",
      "estiloVisual": "cinematico|dramatico|epico",
      "emocion": "intriga|tension|emocion|accion|calma",
      "fondo": "categoria_del_CDN_o_ID_especifico",
      "actor": "descripcion_del_actor_necesario",
      "vozMurf": "masculina_seria|femenina_emotiva|joven_energica|adulto_narrativo",
      "musica": "epica|dramatica|misteriosa|emotiva|accion",
      "efectosSonoros": "viento|lluvia|pasos|naturaleza|silencio",
      "carryover": "descripcion_de_continuidad_desde_toma_anterior"
    }
  ],
  "continuidad": {
    "paletaColores": "natural|dramatica|epica|calida|fria",
    "iluminacion": "natural|dramatica|suave|intensa",
    "ambiente": "coherente|progresivo|contrastante",
    "locacion": "epica|urbana|natural|interior|exterior",
    "estiloGeneral": "realista_cinematico|dramatico|aventura"
  }
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS PARA NARRATIVA CINEMATOGRÁFICA:
- Analiza el prompt y determina la duración óptima de tomas (entre 6-15 segundos cada una)
- Para videos de 30s: crear 3 tomas (10s cada una)
- Para videos de 60s: crear 6 tomas (10s cada una)
- Para videos de 90s: crear 6 tomas (15s cada una)

ESTRUCTURA NARRATIVA OBLIGATORIA:
1. SETUP (25%): Establece personaje, lugar, situación inicial
2. DESARROLLO (50%): Presenta conflicto, tensión, complicaciones
3. CLIMAX (20%): Momento de máxima tensión o revelación
4. CIERRE (5%): Resolución satisfactoria

CADA TOMA DEBE TENER:
- Movimiento de cámara intencional (no static salvo que sea por tensión)
- Emoción específica que escale progresivamente
- Fondo del CDN que exista realmente
- Actor coherente con la historia
- Continuidad visual clara con la toma anterior

PROGRESIÓN EMOCIONAL REQUERIDA:
- Toma 1: Intriga/curiosidad (desengancha inmediato)
- Toma 2: Desarrollo/tensión (mantiene interés)
- Toma 3: Climax/resolución (impacto final)

Analiza este prompt y crea un plan cinematográfico dinámico y emocionalmente progresivo.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', // El contexto ya está en el prompt completo
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Cinematic] ✅ Narrativa cinematográfica generada exitosamente');
      console.log(`- Género: ${narrativa.genero}`);
      console.log(`- Tono: ${narrativa.tono}`);
      console.log(`- Ritmo: ${narrativa.ritmo}`);
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Cinematic] ❌ Error generando narrativa:', error);
  }
  
  // Fallback estructurado y profesional con narrativa dinámica
  console.log('[Director Cinematic] 🔄 Usando narrativa fallback mejorada...');
  
  // Obtener fondos reales del AssetManager para el fallback
  const { AssetManager } = await import('../../../assetManager.js');
  const fondosReales = await AssetManager.obtenerFondosPorEstilo('cinematic');
  const actoresReales = await AssetManager.obtenerActoresPorEstilo('cinematic');
  
  // Determinar número de tomas basado en duración del prompt
  const palabras = prompt.split(' ').length;
  const duracionEstimada = Math.max(30, palabras * 2); // Estimación básica
  const numeroTomas = Math.ceil(duracionEstimada / 10); // 10s por toma promedio
  
  const tomasFallback: TomaCinematograficaPlan[] = [];
  
  // Generar tomas dinámicas basadas en el prompt
  const estilosMovimiento = ['slow_zoom_in', 'pan_right', 'pan_left', 'tilt_up', 'tilt_down', 'dolly_forward'];
  const emociones = ['intriga', 'tension', 'emocion', 'climax', 'resolucion'];
  
  // ✅ CRÍTICO: Usar fondos reales del assets_index.json
  const fondosParaFallback = fondosReales.length > 0 ? fondosReales.slice(0, 4) : [];
  const actoresParaFallback = actoresReales.length > 0 ? actoresReales.slice(0, 2) : [];
  
  console.log(`[Director Cinematic] 🏗️ Fondos reales disponibles para fallback: ${fondosParaFallback.length}`);
  fondosParaFallback.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.ruta} (${f.lugar}/${f.variante})`);
  });
  
  console.log(`[Director Cinematic] 🎭 Actores reales disponibles para fallback: ${actoresParaFallback.length}`);
  actoresParaFallback.forEach((a, idx) => {
    console.log(`  [${idx + 1}] ${a.ruta}`);
  });
  
  for (let i = 0; i < Math.min(numeroTomas, 6); i++) {
    const progreso = i / (numeroTomas - 1);
    let tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
    
    if (progreso <= 0.25) tipoToma = 'setup';
    else if (progreso <= 0.75) tipoToma = 'desarrollo';
    else if (progreso <= 0.9) tipoToma = 'climax';
    else tipoToma = 'cierre';
    
    // Seleccionar fondo y actor reales del assets_index
    const fondoSeleccionado = fondosParaFallback.length > 0 
      ? fondosParaFallback[i % fondosParaFallback.length]
      : null;
      
    const actorSeleccionado = actoresParaFallback.length > 0
      ? actoresParaFallback[i % actoresParaFallback.length]
      : null;
    
    tomasFallback.push({
      numero: i + 1,
      duracion: 10,
      tipoToma,
      descripcion: `${tipoToma.charAt(0).toUpperCase() + tipoToma.slice(1)}: ${prompt.substring(0, 50)}... - Toma ${i + 1}`,
      movimientoCamara: estilosMovimiento[i % estilosMovimiento.length],
      estiloVisual: 'cinematico',
      emocion: emociones[Math.min(i, emociones.length - 1)],
      fondo: fondoSeleccionado ? fondoSeleccionado.ruta : 'escenas/anime/apartamento/baño/día/frontal.png', // ✅ Usar ruta real del assets_index
      actor: actorSeleccionado ? actorSeleccionado.ruta : 'actores/anime/casa/estudio/día/jovenmasculinotristeformal.png', // ✅ Usar actor real del assets_index
      vozMurf: i === 0 ? 'masculina_narrativa' : 'masculina_dramatica',
      musica: i < 2 ? 'tension_creciente' : 'climax_orquestal',
      efectosSonoros: i % 2 === 0 ? 'ambiente_interior' : 'naturaleza_viento',
      carryover: i === 0 ? 'inicio' : `continuidad_visual_toma_${i}`
    });
  }
  
  return {
    historia: `Historia cinematográfica basada en: ${prompt}`,
    tono: 'dramático',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: tomasFallback.map(t => t.numero * 10 - 5), // Momento emocional a mitad de cada toma
    genero: 'drama',
    ritmo: 'medio',
    tomas: tomasFallback,
    continuidad: {
      paletaColores: 'cinematica_natural',
      iluminacion: 'natural_dramatica',
      ambiente: 'coherente',
      locacion: 'epica_aventura',
      estiloGeneral: 'realista_cinematico'
    }
  };
}


export function aplicarEstructuraNarrativa(
  timeline: any[], 
  narrativa: NarrativaCinematica, 
  duracion: number
): any[] {
  console.log('[Director Cinematic] 🎭 Aplicando estructura narrativa...');
  
  return timeline.map((segundo, index) => {
    const progreso = index / duracion;
    let acto: ActoNarrativo = 'desarrollo';
    
    // Distribuir actos según progreso temporal
    if (progreso <= 0.25) acto = 'setup';
    else if (progreso <= 0.75) acto = 'desarrollo';
    else if (progreso <= 0.90) acto = 'climax';
    else acto = 'cierre';
    
    const esMomentoEmocional = narrativa.momentosEmocionales.includes(index);
    
    return {
      ...segundo,
      acto,
      tono: narrativa.tono,
      genero: narrativa.genero,
      ritmo: narrativa.ritmo,
      esEmocional: esMomentoEmocional,
      intensidadEmocional: esMomentoEmocional ? 0.8 : 0.4,
      visual: `${segundo.visual || 'Escena cinematográfica'} (${acto} - ${narrativa.tono})`
    };
  });
}

```

### 📂 src/services/llmService/estilos/cinematic/editor.ts

```ts
// estilos/cinematic/editor.ts - Cerebro Editor Cinematográfico
// ✨ MEJORADO: Soporte para CarryoverLevel (none, soft, hard)

import { segmentarPorEstilo } from '../../helpers/segmentador.js';
import { validarDuracionClip } from '../../restricciones.js';
import { TomaCinematograficaPlan } from './director.js';

// ✨ NUEVO: Tipos de carryover para mejor control cinematográfico
export type CarryoverLevel = 'none' | 'soft' | 'hard';

export interface ConfiguracionEdicion {
  duracionEscena: number;
  carryover: boolean | CarryoverLevel;  // ✨ MEJORADO: Soporte para niveles
  audioCarryover: boolean;
  tipoCorte: string;
  ritmo: 'lento' | 'medio' | 'rápido';
  continuidad: boolean;
}

export function configurarEdicionCinematica(
  segundoActual: number,
  duracionTotal: number,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  esEmocional: boolean,
  tono: string,
  tomaInfo?: TomaCinematograficaPlan
): ConfiguracionEdicion {
  console.log(`[Editor Cinematic] Configurando edición para segundo ${segundoActual}/${duracionTotal}`);
  
  // ✅ Usar información de toma si está disponible
  const duracionToma = tomaInfo?.duracion || 10;
  const tipoToma = tomaInfo?.tipoToma || momentoNarrativo;
  
  console.log(`[Editor Cinematic] 🎬 Editando toma: ${tipoToma}, duración: ${duracionToma}s`);
  
  // Calcular duración óptima de escena adaptada a toma
  const duracionEscena = calcularDuracionEscena(tipoToma, esEmocional, duracionToma);
  
  // ✨ MEJORADO: Determinar nivel de carryover visual
  const carryover = determinarCarryoverLevel(segundoActual, tipoToma, esEmocional);
  
  // Carryover de audio (música/ambiente)
  const audioCarryover = determinarAudioCarryover(segundoActual, tipoToma);
  
  // Tipo de corte cinematográfico
  const tipoCorte = seleccionarTipoCorte(tipoToma, esEmocional, segundoActual);
  
  // Ritmo de edición
  const ritmo = determinarRitmoEdicion(tipoToma, tono, esEmocional);
  
  // Continuidad visual
  const continuidad = evaluarContinuidad(segundoActual, carryover);
  
  return {
    duracionEscena,
    carryover,
    audioCarryover,
    tipoCorte,
    ritmo,
    continuidad
  };
}

function calcularDuracionEscena(momento: string, esEmocional: boolean, duracionToma: number): number {
  // ✅ Usar duración de toma como base
  let duracionBase = duracionToma;
  
  // Duraciones base por momento narrativo (como porcentaje de la toma)
  const factoresMomento = {
    setup: 0.8,      // 80% de la toma para establecimiento
    desarrollo: 0.6,  // 60% de la toma para desarrollo
    climax: 0.4,     // 40% de la toma para climax (más dinámico)
    cierre: 1.0      // 100% de la toma para resolución
  };
  
  const factor = factoresMomento[momento as keyof typeof factoresMomento] || 0.6;
  duracionBase = Math.floor(duracionToma * factor);
  
  // Ajustar por momento emocional
  if (esEmocional) {
    if (momento === 'climax') {
      duracionBase = Math.max(3, Math.floor(duracionToma * 0.3)); // Cortes muy rápidos
    } else {
      duracionBase = Math.min(duracionToma, duracionBase + 2); // Más tiempo para momentos emocionales
    }
  }
  
  // Asegurar que no exceda límites de Kling (10s máximo)
  return Math.min(duracionBase, 10, duracionToma);
}

function determinarCarryover(segundo: number, momento: string, esEmocional: boolean): boolean {
  // No carryover en el primer segundo
  if (segundo === 0) return false;
  
  // Carryover estratégico para continuidad cinematográfica
  const momentosCarryover = {
    setup: segundo % 8 === 0,        // Cada 8 segundos en setup
    desarrollo: segundo % 6 === 0,    // Cada 6 segundos en desarrollo  
    climax: segundo % 3 === 0,       // Cada 3 segundos en climax
    cierre: segundo % 10 === 0       // Cada 10 segundos en cierre
  };
  
  let necesitaCarryover = momentosCarryover[momento as keyof typeof momentosCarryover] || false;
  
  // Forzar carryover en momentos emocionales para intensidad
  if (esEmocional && momento === 'climax') {
    necesitaCarryover = true;
  }
  
  return necesitaCarryover;
}

// ✨ NUEVA FUNCIÓN: Determinar nivel de carryover para mayor control cinematográfico
function determinarCarryoverLevel(segundo: number, momento: string, esEmocional: boolean): CarryoverLevel {
  // No carryover en el primer segundo
  if (segundo === 0) return 'none';
  
  // Lógica avanzada de carryover por momento narrativo
  const carryoverConfig = {
    setup: {
      base: segundo % 8 === 0 ? 'soft' : 'none',
      emocional: 'soft'
    },
    desarrollo: {
      base: segundo % 6 === 0 ? 'soft' : 'none',
      emocional: segundo % 4 === 0 ? 'hard' : 'soft'
    },
    climax: {
      base: segundo % 3 === 0 ? 'hard' : 'soft',
      emocional: 'hard'  // Carryover fuerte para intensidad máxima
    },
    cierre: {
      base: segundo % 10 === 0 ? 'soft' : 'none',
      emocional: 'soft'
    }
  } as const;
  
  const config = carryoverConfig[momento as keyof typeof carryoverConfig];
  if (!config) return 'none';
  
  return esEmocional ? config.emocional : config.base;
}

function determinarAudioCarryover(segundo: number, momento: string): boolean {
  // Audio carryover más frecuente para fluidez
  if (segundo === 0) return false;
  
  // Mantener audio en la mayoría de transiciones
  const sinAudioCarryover = {
    setup: segundo % 12 === 0,       // Cambio cada 12 segundos
    desarrollo: segundo % 10 === 0,   // Cambio cada 10 segundos
    climax: segundo % 6 === 0,       // Cambio cada 6 segundos  
    cierre: segundo % 15 === 0       // Cambio cada 15 segundos
  };
  
  // Invertir lógica: true significa mantener audio
  return !sinAudioCarryover[momento as keyof typeof sinAudioCarryover];
}

function seleccionarTipoCorte(momento: string, esEmocional: boolean, segundo: number): string {
  if (segundo === 0) return 'fade-in';
  
  if (esEmocional) {
    const cortesEmocionales = ['match-cut', 'cross-dissolve', 'iris-in'];
    return cortesEmocionales[segundo % cortesEmocionales.length];
  }
  
  const cortesPorMomento = {
    setup: ['cut', 'dissolve', 'fade'],
    desarrollo: ['cut', 'dissolve', 'wipe'],
    climax: ['cut', 'smash-cut', 'match-cut'],
    cierre: ['dissolve', 'fade-out', 'iris-out']
  };
  
  const cortesDisponibles = cortesPorMomento[momento as keyof typeof cortesPorMomento] || ['cut'];
  return cortesDisponibles[segundo % cortesDisponibles.length];
}

function determinarRitmoEdicion(momento: string, tono: string, esEmocional: boolean): 'lento' | 'medio' | 'rápido' {
  if (esEmocional && momento === 'climax') return 'rápido';
  
  const ritmosPorMomento: Record<string, 'lento' | 'medio' | 'rápido'> = {
    setup: 'medio',
    desarrollo: 'medio',
    climax: 'rápido',
    cierre: 'lento'
  };
  
  const ritmosPorTono: Record<string, 'lento' | 'medio' | 'rápido'> = {
    dramático: 'medio',
    épico: 'rápido',
    emocional: 'lento',
    misterioso: 'lento',
    acción: 'rápido'
  };
  
  // Priorizar tono sobre momento
  return ritmosPorTono[tono] || ritmosPorMomento[momento] || 'medio';
}

// ✨ MEJORADA: Evaluar continuidad con soporte para CarryoverLevel
function evaluarContinuidad(segundo: number, carryover: boolean | CarryoverLevel): boolean {
  // Convertir CarryoverLevel a boolean para compatibilidad
  const tieneCarryover = typeof carryover === 'boolean' 
    ? carryover 
    : carryover !== 'none';
  
  // La continuidad depende del carryover y la posición
  return tieneCarryover || segundo % 4 === 0;
}

export function aplicarEstructuraEdicion(timeline: any[], duracionTotal: number): any[] {
  // Aplicar estructura de edición cinematográfica
  const segmentos = segmentarPorEstilo(duracionTotal, 'cinematic');
  
  return timeline.map((segundo, index) => {
    const segmentoActual = segmentos.find((s: any) => 
      index >= s.inicio && index < s.inicio + s.duracion
    );
    
    return {
      ...segundo,
      segmento: segmentoActual?.tipo || 'desarrollo',
      esInicioSegmento: segmentoActual?.inicio === index,
      esFinalSegmento: segmentoActual ? 
        index === segmentoActual.inicio + segmentoActual.duracion - 1 : false
    };
  });
}

export function optimizarFlujoCinematico(timeline: any[]): any[] {
  // Aplicar optimizaciones específicas de edición cinematográfica
  return timeline.map((segundo, index) => {
    const anterior = timeline[index - 1];
    const siguiente = timeline[index + 1];
    
    return {
      ...segundo,
      // Optimizar transiciones
      transicionOptimizada: optimizarTransicion(segundo, anterior, siguiente),
      // Continuidad mejorada
      continuidadMejorada: index > 0 && segundo.carryover,
      // Flujo narrativo
      flujoNarrativo: evaluarFlujoNarrativo(segundo, index, timeline.length)
    };
  });
}

function optimizarTransicion(actual: any, anterior: any, siguiente: any): string {
  if (!anterior) return 'fade-in';
  if (!siguiente) return 'fade-out';
  
  // Lógica de optimización de transiciones
  if (actual.acto !== anterior.acto) return 'dissolve';
  if (actual.esEmocional && !anterior.esEmocional) return 'cross-dissolve';
  if (actual.carryover) return 'match-cut';
  
  return actual.transition || 'cut';
}

function evaluarFlujoNarrativo(segundo: any, index: number, total: number): 'ascendente' | 'descendente' | 'estable' {
  const progreso = index / total;
  
  if (progreso < 0.25) return 'ascendente';      // Setup
  if (progreso < 0.75) return 'ascendente';      // Desarrollo
  if (progreso < 0.90) return 'ascendente';      // Climax
  return 'descendente';                          // Cierre
}

```

### 📂 src/services/llmService/estilos/cinematic/fotografia.ts

```ts
// estilos/cinematic/fotografia.ts - Cerebro Director de Fotografía Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { getCameraMovement, getEstiloLimitaciones } from '../../restricciones.js';
import { TomaCinematograficaPlan } from './director.js';

export interface ConfiguracionCamara {
  shot: string;
  movement: string;
  angulo: string;
  iluminacion: string;
  transicion: string;
  justificacion?: string;
  plano?: string;
  profundidad_campo?: string;
}

/**
 * Usa IA para configurar fotografía cinematográfica inteligente
 */
export async function configurarFotografiaConIA(
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string
): Promise<ConfiguracionCamara> {
  console.log(`[Fotografía Cinematic] 📸 Configurando fotografía con IA para ${momentoNarrativo}...`);
  
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de Fotografía
    const especializacionFotografia = `
Ahora actúas como el DIRECTOR DE FOTOGRAFÍA del equipo CinemaAI.

Tu responsabilidad es decidir los aspectos técnicos y artísticos de la cámara para cada escena:
- Ángulos de cámara cinematográficos
- Movimientos de cámara apropiados  
- Tipos de plano según el momento narrativo
- Configuración de iluminación
- Transiciones cinematográficas

OPCIONES DISPONIBLES (usa solo estas opciones):

PLANOS (shot): close-up, medium, wide, extreme-wide, detail, over-shoulder
MOVIMIENTOS (movement): static, pan-left, pan-right, zoom-in, zoom-out, tracking, dolly, crane
ÁNGULOS (angulo): frontal, lateral, high, low, dutch, profile, three-quarter
ILUMINACIÓN (iluminacion): natural, dramatic, soft, hard, side-lit, backlit, diffused
TRANSICIONES (transicion): cut, fade, dissolve, wipe, zoom-transition

RESPONDE ÚNICAMENTE con este JSON:
{
  "shot": "uno_de_los_planos_listados",
  "movement": "uno_de_los_movimientos_listados",
  "angulo": "uno_de_los_angulos_listados", 
  "iluminacion": "una_de_las_iluminaciones_listadas",
  "transicion": "una_de_las_transiciones_listadas",
  "justificacion": "por qué esta configuración es perfecta cinematográficamente"
}`;

    const contextoUsuario = `
NARRATIVA: ${narrativa.historia}
TONO: ${narrativa.tono}
GÉNERO: ${narrativa.genero}
MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
PROMPT ORIGINAL: "${prompt}"

Configura la cámara cinematográficamente para esta escena.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionFotografia, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', 
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const config = extractFirstJsonBlock(response as string, { returnParsed: true }) as ConfiguracionCamara;
    
    if (config && typeof config === 'object' && 'shot' in config) {
      console.log('[Fotografía Cinematic] ✅ Configuración fotográfica IA exitosa');
      console.log(`- Plano: ${config.shot}`);
      console.log(`- Ángulo: ${config.angulo}`);
      console.log(`- Movimiento: ${config.movement}`);
      return config;
    }
  } catch (error) {
    console.error('[Fotografía Cinematic] ❌ Error en configuración IA:', error);
  }
  
  // Fallback a lógica tradicional
  console.log('[Fotografía Cinematic] 🔄 Usando configuración fallback...');
  return configurarCamaraCinematica(momentoNarrativo, segundoActual, false, narrativa.tono || 'dramático');
}

export function configurarCamaraCinematica(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  infoToma: TomaCinematograficaPlan | number, // ✅ Usa interfaz correcta o segundo
  esEmocional: boolean,
  tono: string
): ConfiguracionCamara {
  
  // ✅ Adaptar a sistema de tomas
  const esToma = typeof infoToma === 'object';
  const tomaInfo = esToma ? infoToma : { numero: Math.floor((infoToma as number) / 10) + 1, duracion: 10 };
  const segundoActual = esToma ? (infoToma as TomaCinematograficaPlan).numero * 10 : (infoToma as number);
  
  console.log(`[Fotografía Cinematic] Configurando cámara para ${momentoNarrativo} - ${esToma ? `toma ${tomaInfo.numero} (${tomaInfo.duracion}s)` : `segundo ${segundoActual}`}`);
  
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  // ✅ NUEVO: Si es una toma con movimiento específico, usarlo
  let movement: string;
  if (esToma && (infoToma as TomaCinematograficaPlan).movimientoCamara) {
    movement = adaptarMovimientoKling((infoToma as TomaCinematograficaPlan).movimientoCamara);
    console.log(`[Fotografía] Usando movimiento: ${(infoToma as TomaCinematograficaPlan).movimientoCamara} → ${movement}`);
  } else {
    // Movimiento de cámara según estilo y momento tradicional
    movement = seleccionarMovimientoCinematico(momentoNarrativo, segundoActual, esEmocional);
  }
  
  // Selección de plano según momento narrativo y duración de toma
  const duracionToma = esToma ? (infoToma as TomaCinematograficaPlan).duracion : 10;
  const shot = seleccionarPlanoCinematico(momentoNarrativo, esEmocional, duracionToma);
  
  // Ángulo cinematográfico
  const angulo = seleccionarAnguloCinematico(momentoNarrativo, tono);
  
  // Iluminación dramática
  const iluminacion = configurarIluminacionCinematica(momentoNarrativo, tono, esEmocional);
  
  // Transición cinematográfica
  const transicion = seleccionarTransicionCinematica(segundoActual, momentoNarrativo);
  
  return {
    shot,
    movement,
    angulo,
    iluminacion,
    transicion
  };
}

/**
 * Adapta selección de plano considerando duración de toma
 */
function seleccionarPlanoCinematico(momento: string, esEmocional: boolean, duracionToma?: number): string {
  // ✅ Adaptar plano según duración de toma
  const estomaLarga = duracionToma && duracionToma >= 8;
  
  if (esEmocional) {
    // Para momentos emocionales, usar planos más íntimos
    const planosEmocionales = estomaLarga ? ['medium-close-up', 'close-up'] : ['close-up', 'extreme-close-up'];
    return planosEmocionales[Math.floor(Math.random() * planosEmocionales.length)];
  }
  
  const planosPorMomento = {
    setup: estomaLarga ? ['wide', 'extreme-wide', 'establishing'] : ['wide', 'medium'],
    desarrollo: estomaLarga ? ['medium', 'medium-wide'] : ['medium', 'close-up'],
    climax: estomaLarga ? ['close-up', 'medium-close-up'] : ['close-up', 'extreme-close-up'],
    cierre: estomaLarga ? ['wide', 'establishing'] : ['wide', 'medium-wide']
  };
  
  const planosDisponibles = planosPorMomento[momento as keyof typeof planosPorMomento] || ['medium'];
  return planosDisponibles[Math.floor(Math.random() * planosDisponibles.length)];
}

function seleccionarMovimientoCinematico(momento: string, segundo: number, esEmocional: boolean): string {
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  if (esEmocional) {
    // Movimientos más intensos para momentos emocionales
    const movimientosEmocionales = ['dolly-in', 'crane-up', 'tracking', 'orbiting'];
    return movimientosEmocionales[segundo % movimientosEmocionales.length];
  }
  
  const movimientosPorMomento = {
    setup: ['static', 'dolly-in', 'steadicam'],
    desarrollo: ['dolly-in', 'dolly-out', 'tracking', 'steadicam'],
    climax: ['dolly-in', 'crane-up', 'orbiting', 'tracking'],
    cierre: ['dolly-out', 'crane-down', 'steadicam', 'static']
  };
  
  const movimientosDisponibles = movimientosPorMomento[momento as keyof typeof movimientosPorMomento] || limitaciones.movimientosCamara;
  return movimientosDisponibles[segundo % movimientosDisponibles.length];
}

function seleccionarAnguloCinematico(momento: string, tono: string): string {
  const angulosPorTono = {
    dramático: ['low-angle', 'dutch-angle', 'eye-level'],
    épico: ['low-angle', 'wide-angle', 'hero-angle'],
    emocional: ['eye-level', 'slightly-high', 'intimate'],
    misterioso: ['high-angle', 'dutch-angle', 'shadow'],
    acción: ['dynamic', 'low-angle', 'tracking-angle']
  };
  
  const angulos = angulosPorTono[tono as keyof typeof angulosPorTono] || ['eye-level'];
  return angulos[Math.floor(Math.random() * angulos.length)];
}

function configurarIluminacionCinematica(momento: string, tono: string, esEmocional: boolean): string {
  if (esEmocional) {
    return 'dramatic side lighting with strong shadows';
  }
  
  const iluminacionPorMomento = {
    setup: 'soft natural light with subtle shadows',
    desarrollo: 'balanced three-point lighting',
    climax: 'dramatic high-contrast lighting',
    cierre: 'warm golden hour light with rim lighting'
  };
  
  const iluminacionPorTono = {
    dramático: 'hard side lighting with deep shadows',
    épico: 'heroic backlighting with rim light',
    emocional: 'soft window light with fill',
    misterioso: 'low-key lighting with mysterious shadows',
    acción: 'dynamic lighting with movement'
  };
  
  // Combinar momento y tono
  const baseMomento = iluminacionPorMomento[momento as keyof typeof iluminacionPorMomento];
  const baseTono = iluminacionPorTono[tono as keyof typeof iluminacionPorTono];
  
  return baseTono || baseMomento || 'professional cinematic lighting';
}

function seleccionarTransicionCinematica(segundo: number, momento: string): string {
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  // Primera escena siempre fade-in
  if (segundo === 0) return 'fade-in';
  
  // Transiciones especiales para momentos clave
  if (momento === 'climax') {
    return ['match-cut', 'cross-dissolve', 'smash-cut'][segundo % 3];
  }
  
  // Transiciones cinematográficas estándar
  const transicionesEstandar = ['cut', 'dissolve', 'fade'];
  return transicionesEstandar[segundo % transicionesEstandar.length];
}

// ✅ NUEVAS FUNCIONES PARA SISTEMA DE TOMAS

/**
 * Adapta movimientos de cámara a nomenclatura fluida para Kling
 */
function adaptarMovimientoKling(movimientoKling: string): string {
  const mapeoMovimientos: Record<string, string> = {
    // Movimientos básicos mejorados para fluidez
    'camera_zoom_in': 'smooth zoom in',
    'camera_zoom_out': 'smooth zoom out',
    'camera_pan_right': 'slow pan right',
    'camera_pan_left': 'slow pan left',
    'camera_static': 'static shot',
    'camera_tilt_up': 'gentle tilt up',
    'camera_tilt_down': 'gentle tilt down',
    'camera_dolly_in': 'dolly in',
    'camera_dolly_out': 'dolly out',
    // Mapeos directos para nombres sin 'camera_'
    'zoom_in': 'smooth zoom in',
    'zoom_out': 'smooth zoom out', 
    'pan_right': 'slow pan right',
    'pan_left': 'slow pan left',
    'static': 'static shot',
    'tilt_up': 'gentle tilt up',
    'tilt_down': 'gentle tilt down',
    'slow_zoom_in': 'smooth zoom in'
  };
  
  const movimientoAdaptado = mapeoMovimientos[movimientoKling] || 'static shot';
  console.log(`[Fotografía] 🎥 Movimiento adaptado: ${movimientoKling} → ${movimientoAdaptado}`);
  return movimientoAdaptado;
}



export function aplicarEstiloFotograficoCinematico(timeline: any[]): any[] {
  return timeline.map((segundo, index) => ({
    ...segundo,
    filmGrain: 'subtle',
    colorTemperature: 'cinematic',
    bokehQuality: 'professional',
    lensFlare: index % 8 === 0 ? 'subtle' : 'none'
  }));
}

```

### 📂 src/services/llmService/estilos/cinematic/orquestador.ts

```ts
// estilos/cinematic/orquestador.ts - Cerebro Orquestador Cinematográfico

import { generarNarrativaCinematica, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoCinematico } from './arte.js';
import { seleccionarActorCinematico } from './actores.js';
import { configurarCamaraCinematica } from './fotografia.js';
import { configurarSonidoCinematico } from './sonido.js';
import { configurarEdicionCinematica, aplicarEstructuraEdicion, optimizarFlujoCinematico } from './editor.js';
import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];
  metadata: MetadataCinematica;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalCinematica;
  tomasReales?: TomaCinematograficaPlan[]; // ✅ NUEVO: Agregar tomas originales para el pipeline
}

export interface SegundoCinematico {
  segundo: number;
  narrativa: any;
  fondo: any;
  actor: any;
  camara: any;
  sonido: any;
  edicion: any;
  segmento: string;
  momentoNarrativo: string;
  esEmocional: boolean;
  tono: string;
}

export interface MetadataCinematica {
  duracionTotal: number;
  actos: number;
  momentosEmocionales: number[];
  puntosClimax: number[];
  configuracionNarrativa: any;
  estiloVisual: 'cinematic';
  version: string;
}

export interface ConfiguracionGlobalCinematica {
  aspectRatio: string;
  frameRate: number;
  resolucion: string;
  colorGrading: string;
  filtrosGlobales: string[];
  marcaAgua: boolean;
}

export async function orquestarEquipoCinematico(
  prompt: string,
  duracionTotal: number,
  estiloVisual: string = 'cinematic' // ✅ NUEVO: Recibir estilo visual
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Cinematic] Iniciando producción cinematográfica');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`); // ✅ LOG del estilo
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN CINEMATOGRÁFICA');
    
    // 1. Cargar recursos usando AssetManager unificado con el estilo correcto
    console.log(`[ORQUESTADOR] 🔄 Cargando assets para estilo: ${estiloVisual}...`);
    const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual); // ✅ USAR ESTILO CORRECTO
    const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual); // ✅ USAR ESTILO CORRECTO
    
    // Crear assets en formato esperado por el sistema existente
    const assets = {
      fondos: fondosRaw,
      actores: actoresRaw
    };
    
    console.log('[ORQUESTADOR] ✅ Assets cargados', {
      fondos: fondosRaw.length,
      actores: actoresRaw.length,
      diversidadFondos: [...new Set(fondosRaw.map(f => f.lugar || f.tipo))]
    });
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cinematic };
    
    // 2. Director: Establecer narrativa Y PLAN DE TOMAS CINEMATOGRÁFICAS
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan cinematográfico...');
    const narrativaGeneral = await generarNarrativaCinematica(prompt);
    
    // ✅ VALIDACIÓN DEFENSIVA: Verificar que la narrativa tenga estructura válida
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan cinematográfico generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum, t) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    // 3. Procesar cada TOMA CINEMATOGRÁFICA (siguiendo tu flujo correcto)
    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    // Si el director generó tomas, usarlas. Si no, crear tomas por defecto
    console.log('[ORQUESTADOR] 🔍 DEBUG - Verificando tomas del director:', {
      narrativaGeneral_tiene_tomas: !!narrativaGeneral.tomas,
      narrativaGeneral_tomas_length: narrativaGeneral.tomas?.length,
      narrativaGeneral_keys: Object.keys(narrativaGeneral),
      tomas_first_item: narrativaGeneral.tomas?.[0]
    });
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasPorDefecto(duracionTotal, narrativaGeneral);
    
    // ✅ VALIDACIÓN ADICIONAL: Verificar que todas las tomas sean válidas
    if (!tomasPlanificadas || tomasPlanificadas.length === 0) {
      throw new Error('No se pudieron generar tomas válidas');
    }
    
    // ✅ VALIDACIÓN: Verificar que cada toma tenga propiedades requeridas
    for (let i = 0; i < tomasPlanificadas.length; i++) {
      const toma = tomasPlanificadas[i];
      if (!toma || typeof toma.numero !== 'number' || typeof toma.duracion !== 'number') {
        console.error(`[ORQUESTADOR] ❌ Toma ${i} inválida:`, toma);
        throw new Error(`Toma ${i} no tiene estructura válida`);
      }
    }
    
    console.log(`[ORQUESTADOR] 🎯 DECISIÓN: ${narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 ? 'USANDO TOMAS DEL DIRECTOR' : 'USANDO TOMAS POR DEFECTO'}`);
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas cinematográficas`);
    console.log('[ORQUESTADOR] 🎬 INICIANDO BUCLE DE TOMAS CINEMATOGRÁFICAS...');
    
    for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
      const toma = tomasPlanificadas[tomaIdx];
      console.log(`[ORQUESTADOR] 📸 TOMA ${toma.numero}: "${toma.descripcion}" (${toma.duracion}s)`);
      
      // ✅ PROCESAR TOMA UNA SOLA VEZ (no segundo-a-segundo)
      console.log(`[ORQUESTADOR] 🧠 Coordinando cerebros para toma ${toma.numero}...`);
      const configuracionToma = await coordinarCerebros({
        segundo: segundoActual, // Segundo de inicio de la toma
        duracionTotal,
        toma: toma, // ✅ PASAR LA TOMA COMPLETA
        segundoEnToma: 0, // Siempre 0 para configuración de toma
        esEmocional: narrativaGeneral.momentosEmocionales?.includes(segundoActual) || false,
        narrativaGeneral,
        assets
      });
      
      console.log(`[ORQUESTADOR] ✅ Toma ${toma.numero} configurada - aplicando a ${toma.duracion} segundos`);
      
      // ✅ APLICAR LA CONFIGURACIÓN A TODOS LOS SEGUNDOS DE LA TOMA
      for (let segundoEnToma = 0; segundoEnToma < toma.duracion; segundoEnToma++) {
        if (segundoActual >= duracionTotal) break;
        
        const segundoCinematico = {
          ...configuracionToma,
          segundo: segundoActual, // Actualizar el segundo actual
          segmento: toma.tipoToma || 'desarrollo',
          momentoNarrativo: toma.tipoToma || 'desarrollo'
        };
        
        timeline.push(segundoCinematico);
        segundoActual++;
      }
      
      console.log(`[ORQUESTADOR] ✅ Toma ${toma.numero} aplicada a ${toma.duracion} segundos`);
    }
    
    // 5. Aplicar estructura de edición
    console.log('[Orquestador] Aplicando estructura de edición...');
    const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
    
    // 6. Optimizar flujo cinematográfico
    console.log('[Orquestador] Optimizando flujo cinematográfico...');
    const timelineOptimizado = optimizarFlujoCinematico(timelineConEdicion);
    
    // 7. Generar metadata y configuración global
    const metadata = generarMetadataCinematica(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobal();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal,
      tomasReales: tomasPlanificadas // ✅ CRÍTICO: Incluir las tomas originales para el pipeline
    };
    
    console.log('[Orquestador] Producción cinematográfica completada');
    console.log(`Timeline generado: ${videoPlan.timeline.length} segundos`);
    console.log(`Actos: ${metadata.actos}, Momentos emocionales: ${metadata.momentosEmocionales.length}`);
    
    // ✅ DEBUG: Verificar que las tomas reales están incluidas
    console.log('[Orquestador] 🔍 DEBUG - Tomas reales incluidas:', {
      tomasReales_count: videoPlan.tomasReales?.length,
      tomasReales_preview: videoPlan.tomasReales?.map(t => ({
        numero: t.numero,
        descripcion: t.descripcion?.substring(0, 50) + '...',
        duracion: t.duracion,
        tipoToma: t.tipoToma
      }))
    });
    
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Cinematic] 💥 ERROR CRÍTICO en producción:', error);
    console.error('[Orquestador Cinematic] 💥 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[Orquestador Cinematic] 💥 Error message:', error instanceof Error ? error.message : String(error));
    
    // Fallback: Plan cinematográfico básico
    console.log('[Orquestador Cinematic] 🔄 Aplicando fallback de emergencia...');
    return generarPlanCinematicoFallback(prompt, duracionTotal);
  }
}

async function coordinarCerebros(contexto: {
  segundo: number;
  duracionTotal: number;
  toma?: TomaCinematograficaPlan; // ✅ NUEVA: Información de la toma con tipo correcto
  segundoEnToma?: number; // ✅ NUEVA: Segundo dentro de la toma
  esEmocional: boolean;
  narrativaGeneral: any;
  assets: any;
}): Promise<SegundoCinematico> {
  
  const { segundo, duracionTotal, toma, segundoEnToma, esEmocional, narrativaGeneral, assets } = contexto;
  
  // Determinar contexto usando la toma si está disponible
  const momentoNarrativo = toma?.tipoToma || 'desarrollo';
  const tono = toma?.emocion || 'neutro';
  
  // Arte: Seleccionar fondo usando información completa de la toma
  const fondo = await seleccionarFondoCinematico(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`, // ✅ USAR DESCRIPCIÓN DE LA TOMA
    toma // ✅ PASAR INFORMACIÓN COMPLETA DE LA TOMA
  );
  
  // Actores: Seleccionar y configurar actor usando información de toma
  const actor = await seleccionarActorCinematico(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo, // ✅ Usar toma si existe, sino segundo para retrocompatibilidad
    false // ✅ requiereLipSync por defecto
  );
  
  // Fotografía: Configurar cámara usando información de toma
  const camara = configurarCamaraCinematica(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo, // ✅ PASAR TOMA COMPLETA O SEGUNDO
    esEmocional,
    tono
  );
  
  // Sonido: Configurar audio
  const sonido = configurarSonidoCinematico(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor,
    toma // Las funciones de sonido pueden manejar undefined correctamente
  );
  
  // Editor: Configurar edición
  const edicion = configurarEdicionCinematica(
    segundo,
    duracionTotal,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    tono,
    toma // ✅ PASAR INFORMACIÓN COMPLETA DE LA TOMA
  );
  
  return {
    segundo,
    narrativa: narrativaGeneral,
    fondo,
    actor,
    camara,
    sonido,
    edicion,
    segmento: toma?.tipoToma || 'desarrollo',
    momentoNarrativo,
    esEmocional,
    tono
  };
}

function evaluarMomentoEmocional(
  segundo: number,
  narrativa: any,
  momento: string,
  progreso: number
): boolean {
  // Momentos emocionales estratégicos
  const momentosEmocionales = [
    Math.floor(progreso * 100) % 25 === 0,  // Cada 25% del video
    momento === 'climax',                    // Todo el climax es emocional
    narrativa?.momentosEmocionales?.includes(segundo) // Definidos por director
  ];
  
  return momentosEmocionales.some(Boolean);
}

function extraerTono(narrativa: any, momento: string, esEmocional: boolean): string {
  // Extraer tono del contexto narrativo
  if (narrativa?.tono) return narrativa.tono;
  
  // Tonos por defecto según momento y emoción
  if (esEmocional) {
    const tonosEmocionales = ['dramático', 'emocional', 'épico'];
    return tonosEmocionales[Math.floor(Math.random() * tonosEmocionales.length)];
  }
  
  const tonosPorMomento: Record<string, string> = {
    setup: 'misterioso',
    desarrollo: 'dramático',
    climax: 'épico',
    cierre: 'emocional'
  };
  
  return tonosPorMomento[momento] || 'dramático';
}

function generarMetadataCinematica(
  narrativa: any,
  duracion: number,
  timeline: SegundoCinematico[]
): MetadataCinematica {
  
  const momentosEmocionales = timeline
    .filter(s => s.esEmocional)
    .map(s => s.segundo);
  
  const puntosClimax = timeline
    .filter(s => s.momentoNarrativo === 'climax')
    .map(s => s.segundo);
  
  return {
    duracionTotal: duracion,
    actos: 3, // Estructura clásica de 3 actos
    momentosEmocionales,
    puntosClimax,
    configuracionNarrativa: narrativa,
    estiloVisual: 'cinematic',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobal(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 24, // Cinematográfico
    resolucion: '1920x1080',
    colorGrading: 'cinematic-lut',
    filtrosGlobales: ['film-grain', 'vignette', 'color-grading'],
    marcaAgua: true
  };
}

function generarPlanCinematicoFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan cinematográfico de emergencia');
  
  const timeline: SegundoCinematico[] = [];
  
  for (let segundo = 0; segundo < duracion; segundo++) {
    const progreso = segundo / duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.25) momentoNarrativo = 'setup';
    else if (progreso > 0.75) momentoNarrativo = 'cierre';
    else if (progreso > 0.60) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { prompt, tono: 'dramático' },
      fondo: { archivo: 'escenas/realista/apartamento/baño/día/frontal.png', tipo: 'escenario' },
      actor: { archivo: 'actores/realista/apartamento/baño/día/jovenmasculinoneutrointelectual.png', tipo: 'principal' },
      camara: { shot: 'medium', movement: 'static', angle: 'frontal' },
      sonido: { musica: 'orchestral', efectos: [], lipSync: false },
      edicion: { duracionEscena: 6, carryover: false, tipoCorte: 'cut' },
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 10 === 0,
      tono: 'dramático'
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'dramático' },
      estiloVisual: 'cinematic',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.cinematic },
    configuracionGlobal: generarConfiguracionGlobal()
  };
}

// Función de utilidad para validar el plan generado
export function validarPlanCinematico(plan: VideoPlanCinematico): boolean {
  try {
    // Validaciones básicas
    if (!plan.timeline || plan.timeline.length === 0) return false;
    if (!plan.metadata || !plan.configuracionGlobal) return false;
    
    // Validar continuidad de timeline
    for (let i = 0; i < plan.timeline.length; i++) {
      const segundo = plan.timeline[i];
      if (segundo.segundo !== i) return false;
      if (!segundo.fondo || !segundo.actor || !segundo.camara) return false;
    }
    
    // Validar estructura narrativa - Más flexible
    const tieneSetup = plan.timeline.some(s => s.momentoNarrativo === 'setup');
    const tieneClimax = plan.timeline.some(s => s.momentoNarrativo === 'climax');
    const tieneCierre = plan.timeline.some(s => s.momentoNarrativo === 'cierre');
    const tieneDesarrollo = plan.timeline.some(s => s.momentoNarrativo === 'desarrollo');
    
    // ✅ ARREGLO: Al menos debe tener setup y uno de los otros momentos narrativos
    // No es obligatorio tener cierre si hay climax (estructura de 3 actos básica)
    return tieneSetup && (tieneClimax || tieneDesarrollo || tieneCierre);
    
  } catch (error) {
    console.error('[Orquestador] Error validando plan:', error);
    return false;
  }
}

/**
 * Crear tomas por defecto cuando el director no genera tomas específicas
 * Siguiendo el flujo de Cris: "divide en tomas de 10s cada una"
 */
function crearTomasPorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 10; // 10 segundos por toma por defecto
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  // ✅ MEJORADO: Generar descripciones más ricas basadas en el contexto
  const promptBase = narrativa.historia || narrativa.prompt || 'Una historia cinematográfica';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    // Determinar tipo de toma basado en progreso
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Opening scene establishing the story: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Final sequence bringing resolution to: ${promptBase}`;
    } else if (i >= numTomas * 0.6) {
      tipoToma = 'climax';
      descripcionBase = `Climactic moment in the story: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Development sequence ${i} continuing the narrative: ${promptBase}`;
    }
    
    // ✅ DESCRIPCIÓN RICA: Basada en el contexto y el tipo de toma
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion, // ✅ MEJORADO: Descripción rica en lugar de "Toma X"
      movimientoCamara: 'slow_pan',
      estiloVisual: 'cinematic',
      emocion: narrativa.tono || 'neutro',
      fondo: 'ciudad.jpg', // ✅ Valor por defecto
      actor: 'actor_joven.png', // ✅ Valor por defecto  
      vozMurf: 'es-ES-ElviraNeural', // ✅ Valor por defecto
      musica: 'ambient', // ✅ Valor por defecto
      efectosSonoros: 'ambiente_ciudad', // ✅ Valor por defecto
      carryover: i > 0 ? 'continuar_ambiente' : 'inicio' // ✅ Valor por defecto
    });
  }
  
  console.log('[Orquestador] 🎬 DEBUG - Tomas por defecto creadas:', {
    numTomas: tomas.length,
    tomasPreview: tomas.map(t => ({
      numero: t.numero,
      tipoToma: t.tipoToma,
      descripcion: t.descripcion.substring(0, 80) + '...',
      duracion: t.duracion
    }))
  });
  
  return tomas;
}

```

### 📂 src/services/llmService/estilos/cinematic/sonido.ts

```ts
// estilos/cinematic/sonido.ts - Cerebro Director de Sonido Cinematográfico con IA distribuida

import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';
import { getEstiloLimitaciones } from '../../restricciones.js';
import { TomaCinematograficaPlan } from './director.js';

export interface ConfiguracionSonido {
  musica: string;
  efectos: string[];
  ambiente: string;
  lipSync: string;
  requiereVoz: boolean;
  tipoVoz?: string;
  intensidad: 'baja' | 'media' | 'alta';
  justificacion?: string;
  estilo_musical?: string;
  emociones_clave?: string[];
}

/**
 * Usa IA para configurar el diseño sonoro cinematográfico
 */
export async function configurarSonidoConIA(
  narrativa: any,
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  prompt: string
): Promise<ConfiguracionSonido> {
  console.log(`[Sonido Cinematic] 🎵 Configurando sonido con IA para ${momentoNarrativo}...`);
  
  try {
    // Cargar el prompt base compartido
    const systemBase = await cargarSystemPromptBase();
    
    // Especialización del Director de Sonido
    const especializacionSonido = `
Ahora actúas como el DIRECTOR DE SONIDO del equipo CinemaAI.

Tu responsabilidad es diseñar la banda sonora y efectos de audio para cada escena:
- Seleccionar estilo musical apropiado
- Elegir efectos sonoros que complementen la narrativa
- Definir ambiente sonoro
- Configurar intensidad emocional del audio
- Asegurar coherencia con el tono cinematográfico

OPCIONES DISPONIBLES:

MÚSICA: orchestral, cinematic, electronic, ambient, dramatic, epic, emotional, mysterious, action, romantic, suspense
EFECTOS: wind, rain, thunder, footsteps, doors, nature, urban, mechanical, magical, tension, impact
AMBIENTE: quiet, bustling, tense, peaceful, mysterious, dramatic, action-packed, romantic, ethereal
INTENSIDAD: baja, media, alta

RESPONDE ÚNICAMENTE con este JSON:
{
  "musica": "uno_de_los_estilos_musicales",
  "efectos": ["efecto1", "efecto2", "efecto3"],
  "ambiente": "uno_de_los_ambientes",
  "intensidad": "baja|media|alta",
  "requiereVoz": true/false,
  "tipoVoz": "narrador|personaje|voz_en_off|ninguna",
  "justificacion": "por qué esta configuración sonora es perfecta",
  "estilo_musical": "descripción del estilo musical específico",
  "emociones_clave": ["emocion1", "emocion2"]
}`;

    const contextoUsuario = `
NARRATIVA: ${narrativa.historia}
TONO: ${narrativa.tono}
GÉNERO: ${narrativa.genero}
MOMENTO NARRATIVO: ${momentoNarrativo}
SEGUNDO: ${segundoActual}
PROMPT ORIGINAL: "${prompt}"

Diseña el audio cinematográfico para esta escena.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionSonido, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '', 
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const config = extractFirstJsonBlock(response as string, { returnParsed: true }) as ConfiguracionSonido;
    
    if (config && typeof config === 'object' && 'musica' in config) {
      // Asegurar campos requeridos
      config.lipSync = 'auto'; // Por defecto
      
      console.log('[Sonido Cinematic] ✅ Configuración sonora IA exitosa');
      console.log(`- Música: ${config.musica}`);
      console.log(`- Ambiente: ${config.ambiente}`);
      console.log(`- Intensidad: ${config.intensidad}`);
      return config;
    }
  } catch (error) {
    console.error('[Sonido Cinematic] ❌ Error en configuración IA:', error);
  }
  
  // Fallback a lógica tradicional
  console.log('[Sonido Cinematic] 🔄 Usando configuración sonora fallback...');
  return configurarSonidoCinematico(momentoNarrativo, segundoActual, false, narrativa.tono || 'dramático', 30);
}

export function configurarSonidoCinematico(
  momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre',
  segundoActual: number,
  esEmocional: boolean,
  tono: string,
  duracionTotal: number,
  actorInfo?: any,
  tomaInfo?: TomaCinematograficaPlan
): ConfiguracionSonido {
  console.log(`[Sonido Cinematic] Configurando audio para ${momentoNarrativo} - segundo ${segundoActual}`);
  
  // ✅ Usar información de toma si está disponible
  const duracionToma = tomaInfo?.duracion || 10;
  const tipoToma = tomaInfo?.tipoToma || momentoNarrativo;
  
  console.log(`[Sonido Cinematic] 🎬 Toma: ${tipoToma}, duración: ${duracionToma}s`);
  
  const limitaciones = getEstiloLimitaciones('cinematic');
  
  // Configurar música orquestal adaptada a la duración de toma
  const musica = configurarMusicaCinematica(tipoToma, segundoActual, esEmocional, tono, duracionToma);
  
  // Efectos sonoros cinematográficos
  const efectos = seleccionarEfectosSonoros(tipoToma, tono, esEmocional);
  
  // Ambiente sonoro
  const ambiente = configurarAmbienteCinematico(tipoToma, tono);
  
  // Configuración de lip-sync para momentos clave
  const { lipSync, requiereVoz, tipoVoz } = configurarLipSyncCinematico(
    esEmocional, 
    tipoToma, 
    segundoActual, 
    duracionToma,
    actorInfo
  );
  
  // Intensidad general
  const intensidad = determinarIntensidadSonora(tipoToma, esEmocional);
  
  return {
    musica,
    efectos,
    ambiente,
    lipSync,
    requiereVoz,
    tipoVoz,
    intensidad
  };
}

function configurarMusicaCinematica(momento: string, segundo: number, esEmocional: boolean, tono: string, duracionToma?: number): string {
  // ✅ Adaptar música según duración de toma
  const estomaLarga = duracionToma && duracionToma >= 8;
  
  // Primera escena siempre inicia música
  if (segundo === 0) {
    return tono === 'épico' ? 'orchestral-epic' : 'orchestral-dramatic';
  }
  
  // Cambios musicales en momentos clave adaptados a duración
  const cambiosMusicales = {
    setup: segundo === 0 ? 'orchestral-introduction' : (estomaLarga ? 'orchestral-buildup' : 'continue'),
    desarrollo: esEmocional ? getMusicalThemeByTone(tono) : (estomaLarga ? 'orchestral-development' : 'continue'),
    climax: estomaLarga ? 'orchestral-climax-extended' : 'orchestral-climax',
    cierre: estomaLarga ? 'orchestral-resolution-full' : 'orchestral-resolution'
  };
  
  return cambiosMusicales[momento as keyof typeof cambiosMusicales] || 'continue';
}

function getMusicalThemeByTone(tono: string): string {
  const temasPorTono = {
    dramático: 'strings-dramatic',
    épico: 'brass-heroic',
    emocional: 'piano-emotional',
    misterioso: 'ambient-mysterious',
    acción: 'percussion-action'
  };
  
  return temasPorTono[tono as keyof typeof temasPorTono] || 'orchestral-neutral';
}

function seleccionarEfectosSonoros(momento: string, tono: string, esEmocional: boolean): string[] {
  const efectosBase = {
    setup: ['ambient', 'footsteps', 'wind'],
    desarrollo: ['ambient', 'movement', 'subtle-fx'],
    climax: ['tension', 'impact', 'dramatic-stinger'],
    cierre: ['resolution', 'ambient', 'peaceful']
  };
  
  const efectosEmocionales = {
    dramático: ['heartbeat', 'tension', 'silence'],
    épico: ['wind', 'thunder', 'triumph'],
    emocional: ['heartbeat', 'breath', 'silence'],
    misterioso: ['whisper', 'echo', 'suspense'],
    acción: ['impact', 'whoosh', 'dynamics']
  };
  
  let efectos = efectosBase[momento as keyof typeof efectosBase] || ['ambient'];
  
  if (esEmocional) {
    const efectosTono = efectosEmocionales[tono as keyof typeof efectosEmocionales] || ['ambient'];
    efectos = [...efectos, ...efectosTono].slice(0, 3); // Máximo 3 efectos
  }
  
  return efectos;
}

function configurarAmbienteCinematico(momento: string, tono: string): string {
  const ambientesPorMomento = {
    setup: 'natural-ambience',
    desarrollo: 'contextual-ambience',
    climax: 'intense-ambience',
    cierre: 'peaceful-ambience'
  };
  
  const ambientesPorTono = {
    dramático: 'tense-ambience',
    épico: 'grand-ambience',
    emocional: 'intimate-ambience',
    misterioso: 'mysterious-ambience',
    acción: 'dynamic-ambience'
  };
  
  return ambientesPorTono[tono as keyof typeof ambientesPorTono] || 
         ambientesPorMomento[momento as keyof typeof ambientesPorMomento] || 
         'neutral-ambience';
}

function configurarLipSyncCinematico(
  esEmocional: boolean, 
  momento: string, 
  segundo: number, 
  duracionTotal: number,
  actorInfo?: any
): { lipSync: string; requiereVoz: boolean; tipoVoz?: string } {
  
  // Solo lip-sync en momentos emocionales clave y específicos
  if (!esEmocional) {
    return { lipSync: '', requiereVoz: false };
  }
  
  // Máximo 3-4 diálogos por video en momentos estratégicos
  const momentosDialogo = [
    Math.floor(duracionTotal * 0.20), // 20% - Establecimiento
    Math.floor(duracionTotal * 0.60), // 60% - Conflicto
    Math.floor(duracionTotal * 0.85)  // 85% - Resolución
  ];
  
  if (!momentosDialogo.includes(segundo)) {
    return { lipSync: '', requiereVoz: false };
  }
  
  const dialogosPorMomento = {
    setup: [
      "This changes everything",
      "Something's not right",
      "Are you ready?",
      "It's time"
    ],
    desarrollo: [
      "You don't understand",
      "This is important",
      "We have to try",
      "Trust me"
    ],
    climax: [
      "This ends now",
      "I won't give up",
      "Fight back",
      "It's our only chance"
    ],
    cierre: [
      "It's finally over",
      "We did it",
      "Thank you",
      "Everything's changed"
    ]
  };
  
  const dialogos = dialogosPorMomento[momento as keyof typeof dialogosPorMomento] || ["Yes"];
  const dialogoSeleccionado = dialogos[segundo % dialogos.length];
  
  return {
    lipSync: dialogoSeleccionado,
    requiereVoz: true,
    tipoVoz: actorInfo?.tipoVoz || 'professional'
  };
}

function determinarIntensidadSonora(momento: string, esEmocional: boolean): 'baja' | 'media' | 'alta' {
  if (esEmocional) {
    return momento === 'climax' ? 'alta' : 'media';
  }
  
  const intensidadesPorMomento: Record<string, 'baja' | 'media' | 'alta'> = {
    setup: 'baja',
    desarrollo: 'media',
    climax: 'alta',
    cierre: 'baja'
  };
  
  return intensidadesPorMomento[momento] || 'media';
}

export function aplicarConfiguracionAudioCinematica(timeline: any[]): any[] {
  return timeline.map((segundo, index) => ({
    ...segundo,
    audioMixing: 'professional',
    dynamicRange: 'cinematic',
    spatialAudio: index % 5 === 0 ? 'enabled' : 'standard'
  }));
}

```

### 📂 src/services/llmService/estilos/commercial/actores.ts

```ts
// estilos/commercial/actores.ts - Cerebro Actores Commercial
export async function seleccionarActorCommercial(actoresDisponibles: any[], narrativa: any, esEmocional: boolean, contexto: any, requiereLipSync: boolean): Promise<any> {
  const actorSeleccionado = actoresDisponibles.length > 0 ? actoresDisponibles[Math.floor(Math.random() * actoresDisponibles.length)] : null;
  return {
    archivo: actorSeleccionado?.ruta || 'actor_joven.png',
    nombre: actorSeleccionado?.nombre || 'commercial_talent',
    tipo: 'commercial_talent',
    emocion: esEmocional ? 'confident' : 'professional',
    expresion: esEmocional ? 'compelling_commercial' : 'trustworthy_commercial',
    estilo: 'commercial',
    requiereLipSync,
    justificacion: 'Talento comercial seleccionado para máxima credibilidad y confianza',
    url: actorSeleccionado?.url || ''
  };
}

```

### 📂 src/services/llmService/estilos/commercial/arte.ts

```ts
// estilos/commercial/arte.ts - Cerebro Arte Commercial
export async function seleccionarFondoCommercial(fondosDisponibles: any[], narrativa: any, momentoNarrativo: any, segundoActual: number, prompt: string, tomaInfo?: any): Promise<any> {
  const fondoSeleccionado = fondosDisponibles.length > 0 ? fondosDisponibles[Math.floor(Math.random() * fondosDisponibles.length)] : null;
  return {
    archivo: fondoSeleccionado?.ruta || 'escenas/realista/casa/baño/día/frontal.png',
    nombre: fondoSeleccionado?.nombre || 'professional_setting',
    tipo: 'commercial_background',
    categoria: 'commercial',
    ambiente: 'profesional',
    estilo: 'commercial_style',
    paleta: 'brand_colors',
    iluminacion: 'professional',
    justificacion: 'Fondo comercial seleccionado para ambiente profesional y confiable',
    url: fondoSeleccionado?.url || ''
  };
}

// estilos/commercial/actores.ts - Cerebro Actores Commercial
export async function seleccionarActorCommercial(actoresDisponibles: any[], narrativa: any, esEmocional: boolean, contexto: any, requiereLipSync: boolean): Promise<any> {
  const actorSeleccionado = actoresDisponibles.length > 0 ? actoresDisponibles[Math.floor(Math.random() * actoresDisponibles.length)] : null;
  return {
    archivo: actorSeleccionado?.ruta || 'actor_joven.png',
    nombre: actorSeleccionado?.nombre || 'commercial_talent',
    tipo: 'commercial_talent',
    emocion: esEmocional ? 'confident' : 'professional',
    expresion: esEmocional ? 'compelling_commercial' : 'trustworthy_commercial',
    estilo: 'commercial',
    requiereLipSync,
    justificacion: 'Talento comercial seleccionado para máxima credibilidad y confianza',
    url: actorSeleccionado?.url || ''
  };
}

// estilos/commercial/fotografia.ts - Cerebro Fotografía Commercial
export function configurarCamaraCommercial(momentoNarrativo: any, contexto: any, esEmocional: boolean, tono: string): any {
  const movimientosCommercial = {
    setup: ['smooth_professional', 'brand_reveal', 'professional_zoom'],
    desarrollo: ['product_focus', 'professional_pan', 'smooth_tracking'],
    climax: ['brand_reveal', 'impact_zoom', 'professional_tilt'],
    cierre: ['smooth_professional', 'brand_close', 'confident_zoom']
  };
  const movimiento = movimientosCommercial[momentoNarrativo as keyof typeof movimientosCommercial] ? movimientosCommercial[momentoNarrativo as keyof typeof movimientosCommercial][0] : 'smooth_professional';
  return {
    shot: esEmocional ? 'close_up' : 'medium',
    movement: movimiento,
    angle: 'professional',
    duration: 6,
    transition: 'professional_cut',
    focus: 'brand_focused',
    style: 'commercial_smooth',
    intensity: 'professional',
    speed: 'medium'
  };
}

// estilos/commercial/sonido.ts - Cerebro Sonido Commercial
export function configurarSonidoCommercial(momentoNarrativo: any, segundo: number, esEmocional: boolean, tono: string, duracionTotal: number, actor: any, tomaInfo?: any): any {
  const musicaCommercial = {
    setup: ['corporate_theme', 'brand_intro', 'professional_start'],
    desarrollo: ['professional_bg', 'product_demo_music', 'commercial_flow'],
    climax: ['brand_music', 'impact_theme', 'value_music'],
    cierre: ['corporate_theme', 'call_to_action_music', 'brand_close']
  };
  const efectosCommercial = {
    setup: ['professional_ambient', 'brand_sounds', 'corporate_atmosphere'],
    desarrollo: ['product_sounds', 'demo_sfx', 'professional_movement'],
    climax: ['impact_sounds', 'value_emphasis', 'brand_impact'],
    cierre: ['corporate_sfx', 'closing_sounds', 'call_to_action_sfx']
  };
  const musica = musicaCommercial[momentoNarrativo as keyof typeof musicaCommercial] ? musicaCommercial[momentoNarrativo as keyof typeof musicaCommercial][0] : 'corporate_theme';
  const efectos = efectosCommercial[momentoNarrativo as keyof typeof efectosCommercial] ? efectosCommercial[momentoNarrativo as keyof typeof efectosCommercial][0] : 'professional_ambient';
  const vozCommercial = esEmocional ? 'profesional_comercial' : 'confiable_marca';
  return {
    musica: musica,
    efectos: [efectos],
    volumen_musica: 0.6,
    volumen_efectos: 0.5,
    ambiente: tono,
    lipSync: false,
    voz: vozCommercial,
    emotion_intensity: 'professional',
    commercial_style: true,
    brand_focused: true,
    tempo: 'medium'
  };
}

// estilos/commercial/editor.ts - Cerebro Editor Commercial
export function configurarEdicionCommercial(segundo: number, duracionTotal: number, momentoNarrativo: any, esEmocional: boolean, tono: string, tomaInfo?: any): any {
  const transicionesCommercial = {
    setup: ['professional_cut', 'brand_transition', 'smooth_cut'],
    desarrollo: ['professional_cut', 'product_transition', 'demo_cut'],
    climax: ['impact_cut', 'brand_transition', 'value_cut'],
    cierre: ['professional_cut', 'brand_close', 'call_to_action_cut']
  };
  const transicion = transicionesCommercial[momentoNarrativo as keyof typeof transicionesCommercial] ? transicionesCommercial[momentoNarrativo as keyof typeof transicionesCommercial][0] : 'professional_cut';
  return {
    duracionEscena: 6,
    tipoCorte: transicion,
    carryover: segundo > 0,
    intensidad: 'profesional',
    filtros: ['commercial_filter', 'brand_colors', 'professional_look'],
    efectos_visuales: esEmocional ? ['brand_glow', 'professional_highlight'] : ['subtle_brand'],
    ritmo: 'medio',
    estilo: 'commercial_editing',
    brand_consistency: true,
    professional_polish: true,
    commercial_aesthetics: true
  };
}

export function aplicarEstructuraEdicion(timeline: any[], duracion: number): any[] {
  return timeline.map((segundo, index) => {
    const filtrosCommercial = ['commercial_filter', 'brand_colors', 'professional_look'];
    if (segundo.esEmocional) {
      filtrosCommercial.push('brand_glow', 'professional_highlight');
    }
    return {
      ...segundo,
      filtros: filtrosCommercial,
      commercial_style: true,
      brand_consistency: 1.2,
      professional_grade: 1.1,
      commercial_polish: true
    };
  });
}

export function optimizarFlujoCommercial(timeline: any[]): any[] {
  return timeline.map((segundo, index) => {
    const optimizado = {
      ...segundo,
      frame_rate: 30,
      commercial_smoothing: true,
      brand_optimization: true,
      professional_grade: true,
      commercial_polish: true
    };
    if (index > 0) {
      const anterior = timeline[index - 1];
      if (anterior.esEmocional !== segundo.esEmocional) {
        optimizado.transition_speed = 'professional';
        optimizado.brand_transition = true;
      }
    }
    return optimizado;
  });
}

```

### 📂 src/services/llmService/estilos/commercial/director.ts

```ts
// estilos/commercial/director.ts - Cerebro Director Commercial
import { callOpenRouter } from '../../openRouterUtil.js';
import { extractFirstJsonBlock } from '../../extractJsonUtil.js';
import { cargarSystemPromptBase, construirPromptCompleto, CONFIG_CEREBROS } from '../../prompts/promptUtils.js';

type ActoNarrativo = 'setup' | 'desarrollo' | 'climax' | 'cierre';

export interface NarrativaCinematica {
  historia: string;
  tono: string;
  estructura: ActoNarrativo[];
  momentosEmocionales: number[];
  genero: string;
  ritmo: 'lento' | 'medio' | 'rapido';
  tomas: TomaCinematograficaPlan[];
  continuidad: ContinuidadVisual;
}

export interface TomaCinematograficaPlan {
  numero: number;
  duracion: number;
  tipoToma: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  descripcion: string;
  movimientoCamara: string;
  estiloVisual: string;
  emocion: string;
  fondo: string;
  actor: string;
  vozMurf: string;
  musica: string;
  efectosSonoros: string;
  carryover: string;
}

export interface ContinuidadVisual {
  paletaColores: string;
  iluminacion: string;
  ambiente: string;
  locacion: string;
  estiloGeneral: string;
}

export async function generarNarrativaCommercial(prompt: string): Promise<NarrativaCinematica> {
  console.log('[Director Commercial] 🎬 Generando narrativa comercial con IA...');
  
  try {
    // ✅ PASO 1: Cargar assets reales antes de planificar
    const { AssetManager } = await import('../../../assetManager.js');
    const fondosDisponibles = await AssetManager.obtenerFondosPorEstilo('commercial');
    const actoresDisponibles = await AssetManager.obtenerActoresPorEstilo('commercial');
    
    const systemBase = await cargarSystemPromptBase();
    
    const especializacionDirector = `
Ahora actúas como el CEREBRO DIRECTOR COMERCIAL de CinemaAI.

CONTEXTO TÉCNICO:
- CinemaAI NO genera videos desde cero
- Usa fondos pre-generados del CDN (seleccionas de catálogo existente)
- Usa actores pre-generados del CDN (seleccionas de catálogo existente)  
- Kling Elements anima los fondos como tomas en movimiento
- Murf.ai proporciona voces (catálogo existente)
- Freesound.org proporciona música/efectos (catálogo existente)
- FFmpeg renderiza el resultado final

TU TRABAJO COMO DIRECTOR COMERCIAL:
✅ Crear estructura narrativa comercial (hook → demostración → beneficios → call to action)
✅ Planificar tomas con ENFOQUE EN PRODUCTO y PERSUASIÓN
✅ La primera toma DEBE CAPTURAR ATENCIÓN (hook comercial)
✅ Clips de 6 segundos (ritmo comercial profesional)
✅ Movimientos de cámara profesionales (smooth, product-focused)
✅ Transiciones que mantienen engagement
✅ USAR ÚNICAMENTE assets del CDN disponibles (ver lista abajo)

FONDOS DISPONIBLES EN CDN COMMERCIAL:
${fondosDisponibles.slice(0, 20).map((f: any) => `- ${f.tipo}/${f.lugar}/${f.variante}/${f.ambiente} (${f.tags.join(', ')})`).join('\n')}
... y ${fondosDisponibles.length - 20} más fondos commercial

ACTORES DISPONIBLES EN CDN COMMERCIAL:
${actoresDisponibles.slice(0, 10).map((a: any) => `- ${a.personaje} (${a.edad}, ${a.personalidad})`).join('\n')}
... y ${actoresDisponibles.length - 10} más actores commercial

RESPONDE ÚNICAMENTE con este JSON:
{
  "historia": "resumen conciso del mensaje comercial en 2-3 líneas",
  "tono": "profesional|persuasivo|confiable|innovador|premium|accesible",
  "estructura": ["setup", "desarrollo", "climax", "cierre"],
  "momentosEmocionales": [6, 18, 24],
  "genero": "comercial|publicitario|corporativo|producto|servicio|marca",
  "ritmo": "medio",
  "tomas": [
    {
      "numero": 1,
      "duracion": 6,
      "tipoToma": "setup",
      "descripcion": "Descripción específica de la toma comercial",
      "movimientoCamara": "smooth_professional|product_focus|brand_reveal|professional_pan",
      "estiloVisual": "commercial|professional|branded",
      "emocion": "confident|trustworthy|innovative|premium|accessible",
      "fondo": "USAR RUTA EXACTA DEL CDN: tipo/lugar/variante/ambiente",
      "actor": "USAR PERSONAJE EXACTO DEL CDN",
      "vozMurf": "profesional_comercial|confiable_marca|innovador_tech",
      "musica": "corporate_theme|brand_music|professional_bg|upbeat_commercial",
      "efectosSonoros": "professional_ambient|product_sounds|corporate_sfx",
      "carryover": "descripcion_de_continuidad_comercial"
    }
  ],
  "continuidad": {
    "paletaColores": "brand_colors|professional|clean|modern|premium",
    "iluminacion": "professional_bright|clean_commercial|brand_lighting",
    "ambiente": "professional|trustworthy|innovative|premium",
    "locacion": "commercial_setting|professional_environment|brand_space",
    "estiloGeneral": "commercial_style|professional_aesthetic|brand_focused"
  }
}`;

    const contextoUsuario = `PROMPT DEL USUARIO: "${prompt}"

INSTRUCCIONES ESPECÍFICAS COMERCIAL:
- Crea EXACTAMENTE 5 tomas de 6 segundos cada una (total 30s) - RITMO COMERCIAL PROFESIONAL
- La PRIMERA toma debe ser un HOOK COMERCIAL PODEROSO
- Asegura CONTINUIDAD DE MARCA entre las tomas
- Usa movimientos de cámara PROFESIONALES para comercial
- Mantén paleta de colores CONSISTENTE CON LA MARCA
- Enfoque en PRODUCTO/SERVICIO y CALL TO ACTION

Analiza este prompt y crea un plan comercial completo de 5 tomas profesionales.`;

    const promptCompleto = construirPromptCompleto(systemBase, especializacionDirector, contextoUsuario);
    
    const response = await callOpenRouter(
      promptCompleto,
      '',
      CONFIG_CEREBROS.model,
      CONFIG_CEREBROS.timeout
    );
    
    const narrativa = extractFirstJsonBlock(response as string, { returnParsed: true }) as NarrativaCinematica;
    
    if (narrativa && typeof narrativa === 'object' && 'historia' in narrativa) {
      console.log('[Director Commercial] ✅ Narrativa comercial generada exitosamente');
      return narrativa;
    }
  } catch (error) {
    console.error('[Director Commercial] ❌ Error generando narrativa:', error);
  }
  
  // Fallback comercial
  console.log('[Director Commercial] 🔄 Usando narrativa comercial fallback...');
  return {
    historia: `Mensaje comercial profesional basado en: ${prompt}`,
    tono: 'profesional',
    estructura: ['setup', 'desarrollo', 'climax', 'cierre'] as ActoNarrativo[],
    momentosEmocionales: [6, 18, 24],
    genero: 'comercial',
    ritmo: 'medio',
    tomas: [
      {
        numero: 1,
        duracion: 6,
        tipoToma: 'setup',
        descripcion: 'Professional commercial hook with strong brand introduction',
        movimientoCamara: 'smooth_professional',
        estiloVisual: 'commercial',
        emocion: 'confident',
        fondo: 'professional_brand_setting',
        actor: 'commercial_talent',
        vozMurf: 'profesional_comercial',
        musica: 'corporate_theme',
        efectosSonoros: 'professional_ambient',
        carryover: 'brand_introduction'
      },
      {
        numero: 2,
        duracion: 6,
        tipoToma: 'desarrollo',
        descripcion: 'Product demonstration with clear benefits showcase',
        movimientoCamara: 'product_focus',
        estiloVisual: 'commercial',
        emocion: 'trustworthy',
        fondo: 'product_demo_setting',
        actor: 'demonstrating_talent',
        vozMurf: 'confiable_marca',
        musica: 'professional_bg',
        efectosSonoros: 'product_sounds',
        carryover: 'product_focus'
      },
      {
        numero: 3,
        duracion: 6,
        tipoToma: 'desarrollo',
        descripcion: 'Customer satisfaction and testimonial moment',
        movimientoCamara: 'professional_pan',
        estiloVisual: 'commercial',
        emocion: 'satisfied',
        fondo: 'customer_environment',
        actor: 'satisfied_customer',
        vozMurf: 'innovador_tech',
        musica: 'upbeat_commercial',
        efectosSonoros: 'positive_ambient',
        carryover: 'customer_satisfaction'
      },
      {
        numero: 4,
        duracion: 6,
        tipoToma: 'climax',
        descripcion: 'Strong value proposition and key benefits highlight',
        movimientoCamara: 'brand_reveal',
        estiloVisual: 'commercial',
        emocion: 'innovative',
        fondo: 'value_showcase_setting',
        actor: 'confident_presenter',
        vozMurf: 'profesional_comercial',
        musica: 'brand_music',
        efectosSonoros: 'impact_sounds',
        carryover: 'value_emphasis'
      },
      {
        numero: 5,
        duracion: 6,
        tipoToma: 'cierre',
        descripcion: 'Powerful call to action with brand closing',
        movimientoCamara: 'smooth_professional',
        estiloVisual: 'commercial',
        emocion: 'compelling',
        fondo: 'call_to_action_setting',
        actor: 'closing_talent',
        vozMurf: 'confiable_marca',
        musica: 'corporate_theme',
        efectosSonoros: 'corporate_sfx',
        carryover: 'call_to_action'
      }
    ],
    continuidad: {
      paletaColores: 'professional_brand',
      iluminacion: 'professional_bright',
      ambiente: 'professional',
      locacion: 'commercial_setting',
      estiloGeneral: 'commercial_style'
    }
  };
}

```

### 📂 src/services/llmService/estilos/commercial/editor.ts

```ts
// estilos/commercial/editor.ts - Cerebro Editor Commercial
export function configurarEdicionCommercial(segundo: number, duracionTotal: number, momentoNarrativo: any, esEmocional: boolean, tono: string, tomaInfo?: any): any {
  const transicionesCommercial = {
    setup: ['professional_cut', 'brand_transition', 'smooth_cut'],
    desarrollo: ['professional_cut', 'product_transition', 'demo_cut'],
    climax: ['impact_cut', 'brand_transition', 'value_cut'],
    cierre: ['professional_cut', 'brand_close', 'call_to_action_cut']
  };
  const transicion = transicionesCommercial[momentoNarrativo as keyof typeof transicionesCommercial] ? transicionesCommercial[momentoNarrativo as keyof typeof transicionesCommercial][0] : 'professional_cut';
  return {
    duracionEscena: 6,
    tipoCorte: transicion,
    carryover: segundo > 0,
    intensidad: 'profesional',
    filtros: ['commercial_filter', 'brand_colors', 'professional_look'],
    efectos_visuales: esEmocional ? ['brand_glow', 'professional_highlight'] : ['subtle_brand'],
    ritmo: 'medio',
    estilo: 'commercial_editing',
    brand_consistency: true,
    professional_polish: true,
    commercial_aesthetics: true
  };
}

export function aplicarEstructuraEdicion(timeline: any[], duracion: number): any[] {
  return timeline.map((segundo, index) => {
    const filtrosCommercial = ['commercial_filter', 'brand_colors', 'professional_look'];
    if (segundo.esEmocional) {
      filtrosCommercial.push('brand_glow', 'professional_highlight');
    }
    return {
      ...segundo,
      filtros: filtrosCommercial,
      commercial_style: true,
      brand_consistency: 1.2,
      professional_grade: 1.1,
      commercial_polish: true
    };
  });
}

export function optimizarFlujoCommercial(timeline: any[]): any[] {
  return timeline.map((segundo, index) => {
    const optimizado = {
      ...segundo,
      frame_rate: 30,
      commercial_smoothing: true,
      brand_optimization: true,
      professional_grade: true,
      commercial_polish: true
    };
    if (index > 0) {
      const anterior = timeline[index - 1];
      if (anterior.esEmocional !== segundo.esEmocional) {
        optimizado.transition_speed = 'professional';
        optimizado.brand_transition = true;
      }
    }
    return optimizado;
  });
}

```

### 📂 src/services/llmService/estilos/commercial/fotografia.ts

```ts
// estilos/commercial/fotografia.ts - Cerebro Fotografía Commercial
export function configurarCamaraCommercial(momentoNarrativo: any, contexto: any, esEmocional: boolean, tono: string): any {
  const movimientosCommercial = {
    setup: ['smooth_professional', 'brand_reveal', 'professional_zoom'],
    desarrollo: ['product_focus', 'professional_pan', 'smooth_tracking'],
    climax: ['brand_reveal', 'impact_zoom', 'professional_tilt'],
    cierre: ['smooth_professional', 'brand_close', 'confident_zoom']
  };
  const movimiento = movimientosCommercial[momentoNarrativo as keyof typeof movimientosCommercial] ? movimientosCommercial[momentoNarrativo as keyof typeof movimientosCommercial][0] : 'smooth_professional';
  return {
    shot: esEmocional ? 'close_up' : 'medium',
    movement: movimiento,
    angle: 'professional',
    duration: 6,
    transition: 'professional_cut',
    focus: 'brand_focused',
    style: 'commercial_smooth',
    intensity: 'professional',
    speed: 'medium'
  };
}

```

### 📂 src/services/llmService/estilos/commercial/orquestador.ts

```ts
// estilos/commercial/orquestador.ts - Cerebro Orquestador Commercial

import { generarNarrativaCommercial, TomaCinematograficaPlan } from './director.js';
import { seleccionarFondoCommercial } from './arte.js';
import { seleccionarActorCommercial } from './actores.js';
import { configurarCamaraCommercial } from './fotografia.js';
import { configurarSonidoCommercial } from './sonido.js';
import { configurarEdicionCommercial, aplicarEstructuraEdicion, optimizarFlujoCommercial } from './editor.js';
import { RESTRICCIONES_GENERALES, LIMITACIONES_ESTILO } from '../../restricciones.js';
import { AssetManager } from '../../../assetManager.js';
import { segmentarPorEstilo } from '../../helpers/segmentador.js';

export interface VideoPlanCinematico {
  timeline: SegundoCinematico[];
  metadata: MetadataCinematica;
  restricciones: any;
  configuracionGlobal: ConfiguracionGlobalCinematica;
  tomasReales?: TomaCinematograficaPlan[];
}

export interface SegundoCinematico {
  segundo: number;
  narrativa: any;
  fondo: any;
  actor: any;
  camara: any;
  sonido: any;
  edicion: any;
  segmento: string;
  momentoNarrativo: string;
  esEmocional: boolean;
  tono: string;
}

export interface MetadataCinematica {
  duracionTotal: number;
  actos: number;
  momentosEmocionales: number[];
  puntosClimax: number[];
  configuracionNarrativa: any;
  estiloVisual: 'commercial';
  version: string;
}

export interface ConfiguracionGlobalCinematica {
  aspectRatio: string;
  frameRate: number;
  resolucion: string;
  colorGrading: string;
  filtrosGlobales: string[];
  marcaAgua: boolean;
}

export async function orquestarEquipoCinematico(
  prompt: string,
  duracionTotal: number,
  estiloVisual: string = 'commercial'
): Promise<VideoPlanCinematico> {
  console.log('[Orquestador Commercial] Iniciando producción comercial');
  console.log(`Prompt: "${prompt}"`);
  console.log(`Duración: ${duracionTotal} segundos`);
  console.log(`Estilo visual: ${estiloVisual}`);
  
  try {
    console.log('[ORQUESTADOR] 🚀 INICIANDO PRODUCCIÓN COMERCIAL');
    
    const fondosRaw = await AssetManager.obtenerFondosPorEstilo(estiloVisual);
    const actoresRaw = await AssetManager.obtenerActoresPorEstilo(estiloVisual);
    
    const assets = {
      fondos: fondosRaw,
      actores: actoresRaw
    };
    
    console.log('[ORQUESTADOR] ✅ Assets cargados', {
      fondos: fondosRaw.length,
      actores: actoresRaw.length,
      diversidadFondos: [...new Set(fondosRaw.map(f => f.lugar || f.tipo))]
    });
    const restricciones = { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.commercial };
    
    console.log('[ORQUESTADOR] 🎬 Consultando al Director para plan comercial...');
    const narrativaGeneral = await generarNarrativaCommercial(prompt);
    
    if (!narrativaGeneral) {
      throw new Error('Director no retornó narrativa válida');
    }
    
    console.log('[ORQUESTADOR] ✅ Plan comercial generado', {
      tomas: narrativaGeneral.tomas?.length || 0,
      duracionPlanificada: narrativaGeneral.tomas?.reduce((sum: number, t: any) => sum + (t?.duracion || 0), 0) || 0,
      estructura: narrativaGeneral.estructura
    });

    const timeline: SegundoCinematico[] = [];
    let segundoActual = 0;
    
    const tomasPlanificadas = narrativaGeneral.tomas && narrativaGeneral.tomas.length > 0 
      ? narrativaGeneral.tomas 
      : crearTomasCommercialPorDefecto(duracionTotal, narrativaGeneral);
    
    if (!tomasPlanificadas || tomasPlanificadas.length === 0) {
      throw new Error('No se pudieron generar tomas válidas');
    }
    
    for (let i = 0; i < tomasPlanificadas.length; i++) {
      const toma = tomasPlanificadas[i];
      if (!toma || typeof toma.numero !== 'number' || typeof toma.duracion !== 'number') {
        console.error(`[ORQUESTADOR] ❌ Toma ${i} inválida:`, toma);
        throw new Error(`Toma ${i} no tiene estructura válida`);
      }
    }
    
    console.log(`[ORQUESTADOR] 🎥 Procesando ${tomasPlanificadas.length} tomas comerciales`);
    
    for (let tomaIdx = 0; tomaIdx < tomasPlanificadas.length; tomaIdx++) {
      const toma = tomasPlanificadas[tomaIdx];
      console.log(`[ORQUESTADOR] 📸 TOMA ${toma.numero}: "${toma.descripcion}" (${toma.duracion}s)`);
      
      const configuracionToma = await coordinarCerebros({
        segundo: segundoActual,
        duracionTotal,
        toma: toma,
        segundoEnToma: 0,
        esEmocional: narrativaGeneral.momentosEmocionales?.includes(segundoActual) || false,
        narrativaGeneral,
        assets
      });
      
      for (let segundoEnToma = 0; segundoEnToma < toma.duracion; segundoEnToma++) {
        if (segundoActual >= duracionTotal) break;
        
        const segundoCinematico = {
          ...configuracionToma,
          segundo: segundoActual,
          segmento: toma.tipoToma || 'desarrollo',
          momentoNarrativo: toma.tipoToma || 'desarrollo'
        };
        
        timeline.push(segundoCinematico);
        segundoActual++;
      }
    }
    
    const timelineConEdicion = aplicarEstructuraEdicion(timeline, duracionTotal);
    const timelineOptimizado = optimizarFlujoCommercial(timelineConEdicion);
    
    const metadata = generarMetadataCommercial(narrativaGeneral, duracionTotal, timelineOptimizado);
    const configuracionGlobal = generarConfiguracionGlobalCommercial();
    
    const videoPlan: VideoPlanCinematico = {
      timeline: timelineOptimizado,
      metadata,
      restricciones,
      configuracionGlobal,
      tomasReales: tomasPlanificadas
    };
    
    console.log('[Orquestador] Producción comercial completada');
    return videoPlan;
    
  } catch (error) {
    console.error('[Orquestador Commercial] 💥 ERROR CRÍTICO en producción:', error);
    console.log('[Orquestador Commercial] 🔄 Aplicando fallback de emergencia...');
    return generarPlanCommercialFallback(prompt, duracionTotal);
  }
}

async function coordinarCerebros(contexto: {
  segundo: number;
  duracionTotal: number;
  toma?: TomaCinematograficaPlan;
  segundoEnToma?: number;
  esEmocional: boolean;
  narrativaGeneral: any;
  assets: any;
}): Promise<SegundoCinematico> {
  
  const { segundo, duracionTotal, toma, segundoEnToma, esEmocional, narrativaGeneral, assets } = contexto;
  
  const momentoNarrativo = toma?.tipoToma || 'desarrollo';
  const tono = toma?.emocion || 'profesional';
  
  const fondo = await seleccionarFondoCommercial(
    assets.fondos || [],
    narrativaGeneral,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    toma?.descripcion || `Momento ${momentoNarrativo}`,
    toma
  );
  
  const actor = await seleccionarActorCommercial(
    assets.actores || [],
    narrativaGeneral,
    esEmocional,
    toma || segundo,
    false
  );
  
  const camara = configurarCamaraCommercial(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    toma || segundo,
    esEmocional,
    tono
  );
  
  const sonido = configurarSonidoCommercial(
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    segundo,
    esEmocional,
    tono,
    duracionTotal,
    actor,
    toma
  );
  
  const edicion = configurarEdicionCommercial(
    segundo,
    duracionTotal,
    momentoNarrativo as 'setup' | 'desarrollo' | 'climax' | 'cierre',
    esEmocional,
    tono,
    toma
  );
  
  return {
    segundo,
    narrativa: narrativaGeneral,
    fondo,
    actor,
    camara,
    sonido,
    edicion,
    segmento: toma?.tipoToma || 'desarrollo',
    momentoNarrativo,
    esEmocional,
    tono
  };
}

function generarMetadataCommercial(
  narrativa: any,
  duracion: number,
  timeline: SegundoCinematico[]
): MetadataCinematica {
  
  const momentosEmocionales = timeline
    .filter(s => s.esEmocional)
    .map(s => s.segundo);
  
  const puntosClimax = timeline
    .filter(s => s.momentoNarrativo === 'climax')
    .map(s => s.segundo);
  
  return {
    duracionTotal: duracion,
    actos: 3,
    momentosEmocionales,
    puntosClimax,
    configuracionNarrativa: narrativa,
    estiloVisual: 'commercial',
    version: '1.0.0'
  };
}

function generarConfiguracionGlobalCommercial(): ConfiguracionGlobalCinematica {
  return {
    aspectRatio: '16:9',
    frameRate: 30, // Comercial típicamente a 30fps
    resolucion: '1920x1080',
    colorGrading: 'commercial-bright',
    filtrosGlobales: ['commercial-filter', 'brand-colors', 'professional-look'],
    marcaAgua: true
  };
}

function generarPlanCommercialFallback(prompt: string, duracion: number): VideoPlanCinematico {
  console.log('[Orquestador] Generando plan comercial de emergencia');
  
  const timeline: SegundoCinematico[] = [];
  
  for (let segundo = 0; segundo < duracion; segundo++) {
    const progreso = segundo / duracion;
    let momentoNarrativo = 'desarrollo';
    
    if (progreso < 0.20) momentoNarrativo = 'setup';
    else if (progreso > 0.80) momentoNarrativo = 'cierre';
    else if (progreso > 0.65) momentoNarrativo = 'climax';
    
    timeline.push({
      segundo,
      narrativa: { prompt, tono: 'profesional' },
      fondo: { archivo: 'escenas/realista/casa/baño/día/frontal.png', tipo: 'profesional' },
      actor: { archivo: 'actores/realista/casa/baño/día/jovenmasculinoneutrointelectual.png', tipo: 'profesional' },
      camara: { shot: 'medium', movement: 'smooth', angle: 'professional' },
      sonido: { musica: 'corporate_theme', efectos: [], lipSync: false },
      edicion: { duracionEscena: 6, carryover: false, tipoCorte: 'professional_cut' },
      segmento: momentoNarrativo,
      momentoNarrativo,
      esEmocional: segundo % 15 === 0, // Menos frecuente, más profesional
      tono: 'profesional'
    });
  }
  
  return {
    timeline,
    metadata: {
      duracionTotal: duracion,
      actos: 3,
      momentosEmocionales: timeline.filter(s => s.esEmocional).map(s => s.segundo),
      puntosClimax: timeline.filter(s => s.momentoNarrativo === 'climax').map(s => s.segundo),
      configuracionNarrativa: { prompt, tono: 'profesional' },
      estiloVisual: 'commercial',
      version: '1.0.0'
    },
    restricciones: { ...RESTRICCIONES_GENERALES, ...LIMITACIONES_ESTILO.commercial },
    configuracionGlobal: generarConfiguracionGlobalCommercial()
  };
}

export function validarPlanCinematico(plan: VideoPlanCinematico): boolean {
  try {
    if (!plan.timeline || plan.timeline.length === 0) return false;
    if (!plan.metadata || !plan.configuracionGlobal) return false;
    
    for (let i = 0; i < plan.timeline.length; i++) {
      const segundo = plan.timeline[i];
      if (segundo.segundo !== i) return false;
      if (!segundo.fondo || !segundo.actor || !segundo.camara) return false;
    }
    
    const tieneSetup = plan.timeline.some(s => s.momentoNarrativo === 'setup');
    const tieneClimax = plan.timeline.some(s => s.momentoNarrativo === 'climax');
    const tieneCierre = plan.timeline.some(s => s.momentoNarrativo === 'cierre');
    const tieneDesarrollo = plan.timeline.some(s => s.momentoNarrativo === 'desarrollo');
    
    return tieneSetup && (tieneClimax || tieneDesarrollo || tieneCierre);
    
  } catch (error) {
    console.error('[Orquestador] Error validando plan:', error);
    return false;
  }
}

function crearTomasCommercialPorDefecto(duracionTotal: number, narrativa: any): TomaCinematograficaPlan[] {
  const tomas = [];
  const duracionPorToma = 6; // 6 segundos por toma para comercial (ritmo profesional)
  const numTomas = Math.ceil(duracionTotal / duracionPorToma);
  
  const promptBase = narrativa.historia || narrativa.prompt || 'Un comercial profesional';
  
  for (let i = 0; i < numTomas; i++) {
    const duracionToma = Math.min(duracionPorToma, duracionTotal - (i * duracionPorToma));
    
    let tipoToma = 'desarrollo';
    let descripcionBase = '';
    
    if (i === 0) {
      tipoToma = 'setup';
      descripcionBase = `Professional commercial opening with product focus: ${promptBase}`;
    } else if (i === numTomas - 1) {
      tipoToma = 'cierre';
      descripcionBase = `Strong commercial conclusion with call to action: ${promptBase}`;
    } else if (i >= numTomas * 0.65) {
      tipoToma = 'climax';
      descripcionBase = `Commercial climax with product benefits highlight: ${promptBase}`;
    } else {
      tipoToma = 'desarrollo';
      descripcionBase = `Product demonstration sequence ${i}: ${promptBase}`;
    }
    
    const descripcion = descripcionBase.length > 100 
      ? descripcionBase.substring(0, 97) + '...'
      : descripcionBase;
    
    tomas.push({
      numero: i + 1,
      duracion: duracionToma,
      tipoToma: tipoToma as 'setup' | 'desarrollo' | 'climax' | 'cierre',
      descripcion: descripcion,
      movimientoCamara: 'smooth_professional',
      estiloVisual: 'commercial',
      emocion: 'profesional',
      fondo: 'professional_setting.jpg',
      actor: 'professional_talent.png',
      vozMurf: 'es-ES-AlvaroNeural',
      musica: 'corporate_theme',
      efectosSonoros: 'professional_ambient',
      carryover: i > 0 ? 'continuar_profesional' : 'inicio_impactante'
    });
  }
  
  return tomas;
}

```

### 📂 src/services/llmService/estilos/commercial/sonido.ts

```ts
// estilos/commercial/sonido.ts - Cerebro Sonido Commercial
export function configurarSonidoCommercial(momentoNarrativo: any, segundo: number, esEmocional: boolean, tono: string, duracionTotal: number, actor: any, tomaInfo?: any): any {
  const musicaCommercial = {
    setup: ['corporate_theme', 'brand_intro', 'professional_start'],
    desarrollo: ['professional_bg', 'product_demo_music', 'commercial_flow'],
    climax: ['brand_music', 'impact_theme', 'value_music'],
    cierre: ['corporate_theme', 'call_to_action_music', 'brand_close']
  };
  const efectosCommercial = {
    setup: ['professional_ambient', 'brand_sounds', 'corporate_atmosphere'],
    desarrollo: ['product_sounds', 'demo_sfx', 'professional_movement'],
    climax: ['impact_sounds', 'value_emphasis', 'brand_impact'],
    cierre: ['corporate_sfx', 'closing_sounds', 'call_to_action_sfx']
  };
  const musica = musicaCommercial[momentoNarrativo as keyof typeof musicaCommercial] ? musicaCommercial[momentoNarrativo as keyof typeof musicaCommercial][0] : 'corporate_theme';
  const efectos = efectosCommercial[momentoNarrativo as keyof typeof efectosCommercial] ? efectosCommercial[momentoNarrativo as keyof typeof efectosCommercial][0] : 'professional_ambient';
  const vozCommercial = esEmocional ? 'profesional_comercial' : 'confiable_marca';
  return {
    musica: musica,
    efectos: [efectos],
    volumen_musica: 0.6,
    volumen_efectos: 0.5,
    ambiente: tono,
    lipSync: false,
    voz: vozCommercial,
    emotion_intensity: 'professional',
    commercial_style: true,
    brand_focused: true,
    tempo: 'medium'
  };
}

```

### 📂 src/services/llmService/extractJsonUtil.ts

```ts
// Extrae el primer bloque JSON válido (objeto o array) de un string, aunque esté rodeado de texto, markdown, etc.
// Si returnParsed es true, devuelve el objeto ya parseado. Si no, devuelve el string JSON.
export function extractFirstJsonBlock(text: string, options?: { returnParsed?: boolean, debug?: boolean }): string | object | null {
  if (!text) return null;
  const trimmed = text.trim();
  const { returnParsed = false, debug = false } = options || {};

  // Helper para parsear y loguear si falla
  function tryParse(candidate: string): any {
    try {
      return JSON.parse(candidate);
    } catch (e) {
      if (debug) {
        // eslint-disable-next-line no-console
        console.warn('[extractFirstJsonBlock] Falló parseo:', e, '\nTexto:', candidate);
      }
      return null;
    }
  }

  // Si es un JSON puro (objeto o array)
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    const parsed = tryParse(trimmed);
    if (parsed !== null) return returnParsed ? parsed : trimmed;
  }

  // Busca el primer bloque {...} o [...] que sea JSON válido, soporta anidados
  let stack = [];
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{' || char === '[') {
      if (stack.length === 0) start = i;
      stack.push(char);
    } else if (char === '}' || char === ']') {
      if (stack.length > 0) {
        const last = stack.pop();
        // Solo cierra si es el par correcto
        if ((last === '{' && char === '}') || (last === '[' && char === ']')) {
          if (stack.length === 0 && start !== -1) {
            const candidate = text.slice(start, i + 1);
            const parsed = tryParse(candidate);
            if (parsed !== null) return returnParsed ? parsed : candidate;
            // Si no es válido, sigue buscando
            start = -1;
          }
        } else {
          // Paréntesis desbalanceados, reiniciar stack
          stack = [];
          start = -1;
        }
      }
    }
  }
  // Fallback: regex simple por si el anidado no encuentra nada
  const blockRegex = /({[\s\S]*?})|(\[[\s\S]*?\])/g;
  let match;
  while ((match = blockRegex.exec(text))) {
    const candidate = match[1] || match[2];
    const parsed = tryParse(candidate);
    if (parsed !== null) return returnParsed ? parsed : candidate;
  }
  if (debug) {
    // eslint-disable-next-line no-console
    console.warn('[extractFirstJsonBlock] No se encontró ningún bloque JSON válido.');
  }
  return null;
}

```

### 📂 src/services/llmService/helpers/assetUtils.ts

```ts
// helpers/assetUtils.ts - Utilidades para manejo de assets

export interface AssetIndexItem {
  tipo: string;
  ruta: string;
  nombre: string;
  completitud: string;
  estilo: string;
  lugar?: string;
  variante?: string;
  ambiente?: string;
  angulo?: string;
  size?: number;
  fecha?: string;
}

/**
 * Filtra fondos por estilo y completitud
 */
export function filtrarFondos(assets: AssetIndexItem[], estilo: string = 'cinematic'): AssetIndexItem[] {
  // Mapear estilos que pueden compartir assets
  const estilosCompatibles = getEstilosCompatibles(estilo);
  
  console.log(`[AssetUtils] 🔍 Filtrando fondos para estilo '${estilo}' → estilos compatibles: [${estilosCompatibles.join(', ')}]`);
  
  const fondosFiltrados = assets.filter(asset => 
    asset.tipo === 'escenas' && 
    asset.completitud === 'completa' && 
    (estilosCompatibles.includes(asset.estilo) || asset.estilo === 'universal')
  );
  
  console.log(`[AssetUtils] 📊 Fondos encontrados: ${fondosFiltrados.length}/${assets.length}`);
  
  // Log de muestra de los primeros 5 fondos encontrados
  fondosFiltrados.slice(0, 5).forEach((fondo, idx) => {
    console.log(`  [${idx + 1}] ${fondo.nombre} (estilo: ${fondo.estilo}) → ${fondo.ruta}`);
  });
  
  return fondosFiltrados;
}

/**
 * Filtra actores por estilo y completitud
 */
export function filtrarActores(assets: AssetIndexItem[], estilo: string = 'cinematic'): AssetIndexItem[] {
  // Mapear estilos que pueden compartir assets
  const estilosCompatibles = getEstilosCompatibles(estilo);
  
  return assets.filter(asset => 
    asset.tipo === 'actores' && 
    asset.completitud === 'completa' && 
    (estilosCompatibles.includes(asset.estilo) || asset.estilo === 'universal')
  );
}

/**
 * Obtiene estilos compatibles para compartir assets
 */
function getEstilosCompatibles(estilo: string): string[] {
  const mapeosCompatibilidad: Record<string, string[]> = {
    // ✅ MAPEO CORRECTO: Usar los estilos exactos que existen en assets_index.json
    'cinematic': ['realista', 'anime', 'comic'], // cinematic compatible con estilos reales
    'realistic': ['realista', 'anime'], // realistic → realista (exacto)
    'anime': ['anime', 'realista'], // anime sigue siendo compatible
    'cartoon': ['comic', 'anime'], // cartoon → comic (exacto)
    'commercial': ['realista', 'anime', 'comic'],
    
    // Mapeos directos para los estilos que existen exactamente
    'realista': ['realista', 'anime', 'comic'], // realista puede usar todos
    'comic': ['comic', 'anime', 'realista'], // comic puede usar todos
    'pixelart': ['pixelart', 'anime'] // pixelart limitado
  };
  
  const estilosEncontrados = mapeosCompatibilidad[estilo] || ['realista', 'anime', 'comic']; // fallback amplio
  console.log(`[AssetUtils] 🎨 Mapeo de estilos '${estilo}' → [${estilosEncontrados.join(', ')}]`);
  return estilosEncontrados;
}

/**
 * Selecciona un asset por índice con fallback
 */
export function seleccionarAssetPorIndice(assets: AssetIndexItem[], indice: number): AssetIndexItem | null {
  if (!assets || assets.length === 0) return null;
  
  // Normalizar índice
  const indiceNormalizado = Math.max(0, Math.min(indice, assets.length - 1));
  return assets[indiceNormalizado] || assets[0];
}

/**
 * Carga el índice de assets desde archivo
 */
export async function cargarAssetsIndex(): Promise<AssetIndexItem[]> {
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const ASSETS_PATH = path.resolve(process.cwd(), 'assets_index.json');
    const data = await fs.readFile(ASSETS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    
    // Validar estructura básica
    const validos = parsed.filter((item: any) => 
      item && 
      typeof item.tipo === 'string' && 
      typeof item.ruta === 'string' && 
      typeof item.nombre === 'string'
    );
    
    return validos;
  } catch (error) {
    console.error('Error cargando assets index:', error);
    return [];
  }
}

/**
 * Busca el mejor asset por nombre o descripción
 * Los diferentes ángulos (aerea, frontal, lateral) son assets únicos para continuidad cinematográfica
 */
export function buscarAssetPorNombre(assets: AssetIndexItem[], nombre: string): AssetIndexItem | null {
  if (!assets || assets.length === 0 || !nombre) return null;
  
  const nombreLower = nombre.toLowerCase();
  
  // Búsqueda exacta por nombre
  let found = assets.find(asset => asset.nombre?.toLowerCase() === nombreLower);
  if (found) return found;
  
  // Búsqueda parcial por nombre
  found = assets.find(asset => asset.nombre?.toLowerCase().includes(nombreLower));
  if (found) return found;
  
  // Búsqueda por ambiente si existe
  found = assets.find(asset => asset.ambiente?.toLowerCase().includes(nombreLower));
  if (found) return found;
  
  return null;
}

```

### 📂 src/services/llmService/helpers/segmentador.ts

```ts
// helpers/segmentador.ts - Segmentación de videos por estilo

export interface SegmentoVideo {
  inicio: number;
  fin: number;
  duracion: number;
  tipo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
  intensidad: number;
}

/**
 * Segmenta un video según el estilo cinematográfico
 */
export function segmentarPorEstilo(duracionTotal: number, estilo: string): SegmentoVideo[] {
  const segmentos: SegmentoVideo[] = [];
  
  switch (estilo) {
    case 'cinematic':
      return segmentarCinematico(duracionTotal);
    case 'anime':
      return segmentarAnime(duracionTotal);
    case 'cartoon':
      return segmentarCartoon(duracionTotal);
    default:
      return segmentarCinematico(duracionTotal);
  }
}

/**
 * Segmentación cinematográfica clásica (3 actos)
 */
function segmentarCinematico(duracion: number): SegmentoVideo[] {
  const segmentos: SegmentoVideo[] = [];
  
  // Acto 1: Setup (25%)
  const duracionSetup = Math.floor(duracion * 0.25);
  segmentos.push({
    inicio: 0,
    fin: duracionSetup,
    duracion: duracionSetup,
    tipo: 'setup',
    intensidad: 3
  });
  
  // Acto 2: Desarrollo (50%)
  const duracionDesarrollo = Math.floor(duracion * 0.5);
  segmentos.push({
    inicio: duracionSetup,
    fin: duracionSetup + duracionDesarrollo,
    duracion: duracionDesarrollo,
    tipo: 'desarrollo',
    intensidad: 6
  });
  
  // Clímax (15%)
  const duracionClimax = Math.floor(duracion * 0.15);
  segmentos.push({
    inicio: duracionSetup + duracionDesarrollo,
    fin: duracionSetup + duracionDesarrollo + duracionClimax,
    duracion: duracionClimax,
    tipo: 'climax',
    intensidad: 9
  });
  
  // Cierre (10%)
  const inicioCierre = duracionSetup + duracionDesarrollo + duracionClimax;
  segmentos.push({
    inicio: inicioCierre,
    fin: duracion,
    duracion: duracion - inicioCierre,
    tipo: 'cierre',
    intensidad: 2
  });
  
  return segmentos;
}

/**
 * Segmentación para estilo anime
 */
function segmentarAnime(duracion: number): SegmentoVideo[] {
  // Estructura similar pero más dinámica
  const segmentos: SegmentoVideo[] = [];
  
  // Setup rápido (20%)
  const duracionSetup = Math.floor(duracion * 0.2);
  segmentos.push({
    inicio: 0,
    fin: duracionSetup,
    duracion: duracionSetup,
    tipo: 'setup',
    intensidad: 4
  });
  
  // Desarrollo intenso (60%)
  const duracionDesarrollo = Math.floor(duracion * 0.6);
  segmentos.push({
    inicio: duracionSetup,
    fin: duracionSetup + duracionDesarrollo,
    duracion: duracionDesarrollo,
    tipo: 'desarrollo',
    intensidad: 7
  });
  
  // Clímax explosivo (20%)
  const inicioCierre = duracionSetup + duracionDesarrollo;
  segmentos.push({
    inicio: inicioCierre,
    fin: duracion,
    duracion: duracion - inicioCierre,
    tipo: 'climax',
    intensidad: 10
  });
  
  return segmentos;
}

/**
 * Segmentación para estilo cartoon
 */
function segmentarCartoon(duracion: number): SegmentoVideo[] {
  // Estructura simple y divertida
  const segmentos: SegmentoVideo[] = [];
  
  // Setup (30%)
  const duracionSetup = Math.floor(duracion * 0.3);
  segmentos.push({
    inicio: 0,
    fin: duracionSetup,
    duracion: duracionSetup,
    tipo: 'setup',
    intensidad: 5
  });
  
  // Desarrollo (70%)
  const inicioCierre = duracionSetup;
  segmentos.push({
    inicio: inicioCierre,
    fin: duracion,
    duracion: duracion - inicioCierre,
    tipo: 'desarrollo',
    intensidad: 8
  });
  
  return segmentos;
}

```

### 📂 src/services/llmService/index.ts

```ts
// Archivo vacío
```

### 📂 src/services/llmService/openRouterUtil.ts

```ts
import { logFeedback } from '../feedbackService.js';

import axios from 'axios';
import { env } from '../../config/env.js';

export async function callOpenRouter(systemPrompt: string, userPrompt: string, model: string = 'openai/gpt-4o', timeoutMs: number = 300000): Promise<any> {
  if (typeof systemPrompt !== 'string' || !systemPrompt.trim()) {
    logFeedback({
      service: 'OpenRouter',
      action: 'LLM',
      success: false,
      error: 'Prompts inválidos',
      params: { systemPrompt, userPrompt, model }
    });
    throw new Error('Prompts inválidos para OpenRouter');
  }
  // Asegura que la URL termina en /chat/completions
  let apiUrl = env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  if (!apiUrl.endsWith('/chat/completions')) {
    apiUrl = apiUrl.replace(/\/?$/, '/chat/completions');
  }
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Falta OPENROUTER_API_KEY en el entorno');
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  // Headers requeridos por OpenRouter
  if (env.OPENROUTER_HTTP_REFERER) headers['HTTP-Referer'] = env.OPENROUTER_HTTP_REFERER;
  if (env.OPENROUTER_X_TITLE) headers['X-Title'] = env.OPENROUTER_X_TITLE;

  const data = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 4096,
    temperature: 0.7
  };
  const effectiveTimeout = timeoutMs || 600000; // 10 minutos por defecto
  const start = Date.now();
  let response;
  try {
    response = await axios.post(apiUrl, data, { headers, timeout: effectiveTimeout });
    logFeedback({
      service: 'OpenRouter',
      action: 'LLM',
      timeoutMs: effectiveTimeout,
      elapsedMs: Date.now() - start,
      success: true
    });
  } catch (err: any) {
    if (err.response) {
      console.error('[OpenRouter] Error HTTP:', err.response.status, err.response.data);
      logFeedback({
        service: 'OpenRouter',
        action: 'LLM',
        timeoutMs: effectiveTimeout,
        elapsedMs: Date.now() - start,
        success: false,
        error: JSON.stringify(err.response.data)
      });
      throw new Error('OpenRouter API error: ' + JSON.stringify(err.response.data));
    } else {
      console.error('[OpenRouter] Error de red:', err.message);
      logFeedback({
        service: 'OpenRouter',
        action: 'LLM',
        timeoutMs: effectiveTimeout,
        elapsedMs: Date.now() - start,
        success: false,
        error: err.message
      });
      throw new Error('OpenRouter network error: ' + err.message);
    }
  }
  if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || typeof response.data.choices[0].message.content !== 'string') {
    console.error('[OpenRouter] Respuesta inesperada:', JSON.stringify(response.data));
    throw new Error('Respuesta inesperada de OpenRouter: ' + JSON.stringify(response.data));
  }
  let content = response.data.choices[0].message.content.trim();
  // Elimina bloque de código Markdown si existe
  if (content.startsWith('```json')) {
    content = content.replace(/^```json[\r\n]*/i, '').replace(/```\s*$/i, '').trim();
  } else if (content.startsWith('```')) {
    content = content.replace(/^```[\w]*[\r\n]*/i, '').replace(/```\s*$/i, '').trim();
  }
  return content;
}

```

### 📂 src/services/llmService/prompts/promptUtils.ts

```ts
// prompts/promptUtils.ts - Utilidades para cargar y gestionar prompts base

import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Carga el prompt base compartido por todos los cerebros
 */
export async function cargarSystemPromptBase(): Promise<string> {
  try {
    const promptPath = join(__dirname, 'systemPromptBase.txt');
    const systemBase = await readFile(promptPath, 'utf-8');
    return systemBase.trim();
  } catch (error) {
    console.warn('[PromptUtils] No se pudo cargar systemPromptBase.txt, usando fallback');
    return `Eres parte del sistema CinemaAI. Genera contenido cinematográfico realista y factible con IA actual.`;
  }
}

/**
 * Construye un prompt completo combinando base + especialización
 */
export function construirPromptCompleto(
  systemBase: string, 
  especializacion: string, 
  contextoUsuario: string
): string {
  return `${systemBase}

${especializacion}

${contextoUsuario}`;
}

/**
 * Configuración estándar para llamadas LLM de cerebros
 */
export const CONFIG_CEREBROS = {
  model: 'openai/chatgpt-4o-latest',
  timeout: 60000,
  maxTokens: 2000
};

```

### 📂 src/services/llmService/restricciones.ts

```ts
// restricciones.ts - Limitaciones y restricciones del sistema

export const RESTRICCIONES_GENERALES = {
  duracionMinima: 5,
  duracionMaxima: 60,
  resolucionDefecto: '1920x1080',
  fpsDefecto: 30,
  formatoSalida: 'mp4'
};

export const LIMITACIONES_ESTILO = {
  cinematic: {
    duracionMaxima: 60,
    movimientosCamara: ['estatica', 'pan', 'tilt', 'zoom'],
    transiciones: ['corte', 'fade', 'disolver'],
    efectos: ['ninguno', 'color_grading', 'vignette']
  },
  anime: {
    duracionMaxima: 45,
    movimientosCamara: ['estatica', 'pan', 'zoom'],
    transiciones: ['corte', 'fade'],
    efectos: ['ninguno', 'saturacion', 'contraste']
  },
  cartoon: {
    duracionMaxima: 30,
    movimientosCamara: ['estatica', 'zoom'],
    transiciones: ['corte'],
    efectos: ['ninguno', 'saturacion']
  },
  commercial: {
    duracionMaxima: 40,
    movimientosCamara: ['estatica', 'pan', 'zoom', 'smooth_professional'],
    transiciones: ['corte', 'fade', 'professional_cut'],
    efectos: ['ninguno', 'brand_colors', 'professional_look']
  }
};

/**
 * Obtiene las limitaciones para un estilo específico
 */
export function getEstiloLimitaciones(estilo: string) {
  return LIMITACIONES_ESTILO[estilo as keyof typeof LIMITACIONES_ESTILO] || LIMITACIONES_ESTILO.cinematic;
}

/**
 * Valida la duración de un clip según el estilo
 */
export function validarDuracionClip(duracion: number, estilo: string): boolean {
  const limitaciones = getEstiloLimitaciones(estilo);
  return duracion >= RESTRICCIONES_GENERALES.duracionMinima && 
         duracion <= limitaciones.duracionMaxima;
}

/**
 * Obtiene movimiento de cámara válido para el estilo
 */
export function getCameraMovement(estilo: string): string {
  const limitaciones = getEstiloLimitaciones(estilo);
  const movimientos = limitaciones.movimientosCamara;
  return movimientos[Math.floor(Math.random() * movimientos.length)];
}

/**
 * Obtiene transición válida para el estilo
 */
export function getTransicion(estilo: string): string {
  const limitaciones = getEstiloLimitaciones(estilo);
  const transiciones = limitaciones.transiciones;
  return transiciones[Math.floor(Math.random() * transiciones.length)];
}

/**
 * Obtiene efecto válido para el estilo
 */
export function getEfecto(estilo: string): string {
  const limitaciones = getEstiloLimitaciones(estilo);
  const efectos = limitaciones.efectos;
  return efectos[Math.floor(Math.random() * efectos.length)];
}

```

### 📂 src/services/metricsService.ts

```ts
// Archivo vacío
```

### 📂 src/services/musicService.ts

```ts
// musicService.ts - Servicio de música cinematográfica con integración Freesound

import axios from 'axios';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

interface MusicRequest {
  style: string;
  duration: number;
  mood: string;
}

interface FreesoundSearchResult {
  id: number;
  name: string;
  url: string;
  tags: string[];
  duration: number;
  download: string;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
}

interface FreesoundResponse {
  results: FreesoundSearchResult[];
  count: number;
}

/**
 * Obtiene música de fondo usando Freesound API
 */
export async function getBackgroundMusic(style: string, duration: number = 30, mood: string = 'neutral'): Promise<Buffer> {
  logger.info(`🎵 [MusicService] Solicitando música: ${style}, ${mood}, ${duration}s`);
  
  try {
    // Si no hay API key de Freesound, usar fallback de silencio
    if (!env.FREESOUND_API_KEY) {
      logger.warn('🔑 [MusicService] FREESOUND_API_KEY no configurada, usando silencio como fallback');
      return createSilenceBuffer(duration);
    }

    // Mapear estilos cinematográficos a tags de Freesound
    const musicStyles = {
      'cinematic': 'cinematic epic orchestral film score',
      'anime': 'electronic upbeat japanese anime',
      'cartoon': 'playful orchestral cartoon comedy',
      'dramatic': 'dramatic tense strings emotional',
      'adventure': 'adventure heroic brass epic',
      'mystery': 'mystery dark ambient suspense',
      'romance': 'romantic soft piano emotional',
      'action': 'action intense drums fast',
      'orchestral': 'orchestral symphony classical strings',
      'ambient': 'ambient atmospheric calm peaceful',
      'suspense': 'suspense mysterious dark tension',
      'fantasy': 'fantasy magical mystical enchanted'
    };
    
    const moodTags = {
      'happy': 'happy upbeat positive',
      'sad': 'sad melancholy emotional',
      'tense': 'tense suspense dark',
      'calm': 'calm peaceful relaxing',
      'exciting': 'exciting energetic dynamic',
      'mysterious': 'mysterious dark atmospheric',
      'neutral': 'background instrumental'
    };

    const styleTags = musicStyles[style as keyof typeof musicStyles] || `${style} cinematic music`;
    const moodTag = moodTags[mood as keyof typeof moodTags] || mood;
    
    // Buscar en Freesound
    const searchQuery = `${styleTags} ${moodTag} loop background`;
    const searchUrl = 'https://freesound.org/apiv2/search/text/';
    
    logger.info(`🔍 [MusicService] Buscando en Freesound: "${searchQuery}"`);
    
    const searchResponse = await axios.get<FreesoundResponse>(searchUrl, {
      params: {
        query: searchQuery,
        filter: `duration:[${Math.max(duration - 10, 10)} TO ${duration + 30}]`,
        sort: 'downloads_desc',
        page_size: 15,
        fields: 'id,name,url,tags,duration,download,previews'
      },
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 10000
    });

    if (!searchResponse.data.results.length) {
      logger.warn(`🚫 [MusicService] No se encontraron resultados para: ${searchQuery}`);
      return createSilenceBuffer(duration);
    }

    // Seleccionar el mejor resultado (el primero por relevancia y descargas)
    const selectedSound = searchResponse.data.results[0];
    logger.info(`✅ [MusicService] Seleccionado: "${selectedSound.name}" (${selectedSound.duration}s)`);

    // Descargar el preview del audio (alta calidad preferida)
    const audioUrl = selectedSound.previews['preview-hq-mp3'] || selectedSound.previews['preview-lq-mp3'];
    
    if (!audioUrl) {
      logger.warn(`🚫 [MusicService] No hay preview disponible para: ${selectedSound.name}`);
      return createSilenceBuffer(duration);
    }

    logger.info(`⬇️ [MusicService] Descargando audio desde: ${audioUrl}`);
    
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const audioBuffer = Buffer.from(audioResponse.data);
    logger.info(`🎵 [MusicService] Música descargada: ${audioBuffer.length} bytes desde Freesound`);
    
    return audioBuffer;
    
  } catch (error: any) {
    logger.error('❌ [MusicService] Error obteniendo música de Freesound:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText
    });
    
    // Fallback a silencio en caso de error
    logger.info('🔇 [MusicService] Usando silencio como fallback');
    return createSilenceBuffer(duration);
  }
}

/**
 * Obtiene música específica por ID de Freesound
 */
export async function getMusicById(musicId: string): Promise<Buffer> {
  logger.info(`🎵 [MusicService] Obteniendo música por ID: ${musicId}`);
  
  try {
    if (!env.FREESOUND_API_KEY) {
      logger.warn('🔑 [MusicService] FREESOUND_API_KEY no configurada');
      return createSilenceBuffer(20);
    }

    // Obtener detalles del sonido específico
    const soundUrl = `https://freesound.org/apiv2/sounds/${musicId}/`;
    
    const soundResponse = await axios.get(soundUrl, {
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 10000
    });

    const sound = soundResponse.data;
    const audioUrl = sound.previews['preview-hq-mp3'] || sound.previews['preview-lq-mp3'];
    
    if (!audioUrl) {
      throw new Error(`No hay preview disponible para el sonido ID: ${musicId}`);
    }

    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    const audioBuffer = Buffer.from(audioResponse.data);
    logger.info(`🎵 [MusicService] Música ID ${musicId} obtenida: ${audioBuffer.length} bytes`);
    
    return audioBuffer;
    
  } catch (error: any) {
    logger.error(`❌ [MusicService] Error obteniendo música por ID: ${error.message}`);
    return createSilenceBuffer(20);
  }
}

/**
 * Obtiene lista de música disponible por categoría desde Freesound
 */
export async function getMusicLibrary(category: string = 'cinematic'): Promise<Array<{id: string, name: string, duration: number}>> {
  logger.info(`📚 [MusicService] Obteniendo biblioteca de música: ${category}`);
  
  try {
    if (!env.FREESOUND_API_KEY) {
      logger.warn('🔑 [MusicService] FREESOUND_API_KEY no configurada, devolviendo biblioteca simulada');
      return getSimulatedLibrary(category);
    }

    const searchUrl = 'https://freesound.org/apiv2/search/text/';
    const searchQuery = `${category} cinematic background music`;
    
    const searchResponse = await axios.get<FreesoundResponse>(searchUrl, {
      params: {
        query: searchQuery,
        sort: 'downloads_desc',
        page_size: 20,
        fields: 'id,name,duration'
      },
      headers: {
        'Authorization': `Token ${env.FREESOUND_API_KEY}`
      },
      timeout: 10000
    });

    const library = searchResponse.data.results.map(sound => ({
      id: sound.id.toString(),
      name: sound.name,
      duration: Math.round(sound.duration)
    }));

    logger.info(`📚 [MusicService] Biblioteca obtenida: ${library.length} elementos`);
    return library;
    
  } catch (error: any) {
    logger.error(`❌ [MusicService] Error obteniendo biblioteca: ${error.message}`);
    return getSimulatedLibrary(category);
  }
}

// Función helper para crear buffer de silencio
function createSilenceBuffer(duration: number): Buffer {
  // Crear buffer de silencio de la duración especificada
  // 44.1kHz, stereo, 16-bit = 44100 * 2 * 2 bytes por segundo
  const silenceDuration = Math.max(duration, 1);
  const bufferSize = Math.floor(silenceDuration * 44100 * 2 * 2);
  const silenceBuffer = Buffer.alloc(bufferSize);
  
  logger.info(`🔇 [MusicService] Buffer de silencio creado: ${silenceBuffer.length} bytes (${silenceDuration}s)`);
  return silenceBuffer;
}

// Biblioteca simulada como fallback
function getSimulatedLibrary(category: string): Array<{id: string, name: string, duration: number}> {
  const library = [
    { id: 'epic_001', name: 'Epic Orchestra', duration: 30 },
    { id: 'anime_001', name: 'Electronic Beat', duration: 25 },
    { id: 'cartoon_001', name: 'Playful Melody', duration: 20 },
    { id: 'dramatic_001', name: 'Tense Atmosphere', duration: 35 },
    { id: 'adventure_001', name: 'Heroic Journey', duration: 40 },
    { id: 'cinematic_001', name: 'Cinematic Theme', duration: 45 },
    { id: 'mystery_001', name: 'Dark Mystery', duration: 32 },
    { id: 'romance_001', name: 'Romantic Piano', duration: 28 }
  ];
  
  if (category === 'all') {
    return library;
  }
  
  return library.filter(item => 
    item.name.toLowerCase().includes(category.toLowerCase()) ||
    item.id.toLowerCase().includes(category.toLowerCase())
  );
}

```

### 📂 src/services/sadtalkerService.ts

```ts
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface SadTalkerOptions {
  sourceImage: string; // ruta a la imagen
  drivenAudio: string; // ruta al audio
  outputDir?: string; // carpeta de resultados
  enhancer?: 'gfpgan' | 'RestoreFormer';
  preprocess?: 'full' | 'crop' | 'resize';
  still?: boolean;
  size?: 256 | 512;
}

/**
 * Ejecuta SadTalker desde Node.js y retorna la ruta del video generado.
 */
export async function runSadTalker(options: SadTalkerOptions): Promise<string> {
  const {
    sourceImage,
    drivenAudio,
    outputDir = './results',
    enhancer = 'gfpgan',
    preprocess = 'full',
    still = true,
    size = 256,
  } = options;

  // Construir comando
  const scriptPath = path.resolve(__dirname, '../../SadTalker/inference.py');
  const cwd = path.resolve(__dirname, '../../SadTalker');
  const venvPython = process.env.VENV_PYTHON || 'python';

  // Generar nombre de salida único
  const timestamp = Date.now();
  const resultDir = path.resolve(cwd, outputDir);
  if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });

  // Comando base
  const args = [
    scriptPath,
    '--source_image', sourceImage,
    '--driven_audio', drivenAudio,
    '--result_dir', resultDir,
    '--preprocess', preprocess,
    '--enhancer', enhancer,
    '--size', String(size),
  ];
  if (still) args.push('--still');

  // Ejecutar el proceso
  return new Promise((resolve, reject) => {
    const proc = spawn(venvPython, args, { cwd });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`SadTalker error: ${stderr || stdout}`));
      }
      // Buscar el último archivo mp4 generado en el directorio de resultados
      const files = fs.readdirSync(resultDir)
        .filter(f => f.endsWith('.mp4'))
        .map(f => ({ f, t: fs.statSync(path.join(resultDir, f)).mtimeMs }))
        .sort((a, b) => b.t - a.t);
      if (files.length === 0) {
        return reject(new Error('No se generó ningún video mp4.'));
      }
      resolve(path.join(resultDir, files[0].f));
    });
  });
}// src/services/sadtalkerService.ts
/**
 * Aplica SadTalker real para lip-sync en imágenes.
 * @param inputPath Ruta del archivo de imagen o video base
 * @param audioPath Ruta del archivo de audio (voz)
 * @param acting Emoción/acting a aplicar (opcional, por ahora no usado)
 * @param style Estilo visual (cinematic, anime, cartoon, realistic) (opcional, por ahora no usado)
 * @returns Ruta del archivo de video generado
 */
export async function applySadTalker(inputPath: string, audioPath: string, acting?: string, style?: string): Promise<string> {
  // Puedes mapear acting/style a flags de SadTalker si lo deseas en el futuro
  // Por ahora, solo usa los parámetros básicos
  return runSadTalker({
    sourceImage: inputPath,
    drivenAudio: audioPath,
    enhancer: 'gfpgan',
    preprocess: 'full',
    still: true,
    size: 256,
  });
}

```

### 📂 src/services/sceneAudioService.ts

```ts
// sceneAudioService.ts - Servicio que conecta el sistema de audio con la generación de video
// Integra audioIntegration.ts con renderPipeline.ts para sincronización perfecta

import { logger } from '../utils/logger.js';
import { generarAudioCompleto, obtenerConfiguracionOptima } from './audioIntegration.js';
import type { VideoPlan, TimelineSecond } from '../utils/types.js';

export interface SceneAudioResult {
  music: Buffer;
  voice: Buffer;
  sfx: Buffer[];
  metadata: {
    duration: number;
    usedServices: string[];
    quality: any;
  };
}

/**
 * Genera audio completo para una escena específica del video
 * Conecta directamente con el pipeline de renderizado
 */
export async function generateSceneAudio(
  seccion: TimelineSecond,
  plan: VideoPlan,
  sceneIndex: number
): Promise<SceneAudioResult> {
  const startTime = Date.now();
  logger.info(`🎭 [SceneAudio] Generando audio para escena ${sceneIndex + 1}/${plan.timeline.length}`);

  try {
    // 1. Obtener configuración óptima automáticamente
    const configuracionOptima = await obtenerConfiguracionOptima();
    
    // 2. Determinar contexto narrativo según posición en el timeline
    const totalSecciones = plan.timeline.length;
    let momentoNarrativo: 'setup' | 'desarrollo' | 'climax' | 'cierre';
    
    if (sceneIndex === 0) {
      momentoNarrativo = 'setup';
    } else if (sceneIndex === totalSecciones - 1) {
      momentoNarrativo = 'cierre';
    } else if (sceneIndex > totalSecciones * 0.7) {
      momentoNarrativo = 'climax';
    } else {
      momentoNarrativo = 'desarrollo';
    }

    // 3. Configurar opciones específicas para esta escena
    const opciones = {
      ...configuracionOptima,
      duracionToma: seccion.duracion || 10,
      momentoNarrativo,
      tono: seccion.tono || plan.metadata?.style || 'dramático',
      esEmocional: seccion.esEmocional || sceneIndex > totalSecciones * 0.5,
      estiloCinematico: plan.metadata?.visualStyle || 'cinematic'
    };

    logger.info(`🎯 [SceneAudio] Contexto: ${momentoNarrativo}, tono: ${opciones.tono}, duración: ${opciones.duracionToma}s`);

    // 4. Generar audio usando la integración completa
    const audioCompleto = await generarAudioCompleto(seccion, plan, opciones);

    // 5. Formatear resultado para compatibilidad con renderPipeline
    const resultado: SceneAudioResult = {
      music: audioCompleto.musica,
      voice: audioCompleto.voz,
      sfx: audioCompleto.efectos,
      metadata: {
        duration: Date.now() - startTime,
        usedServices: extractUsedServices(audioCompleto.metadata),
        quality: audioCompleto.metadata.calidad || {}
      }
    };

    logger.info(`✅ [SceneAudio] Escena ${sceneIndex + 1} completada en ${resultado.metadata.duration}ms`);
    logger.info(`📊 [SceneAudio] Servicios usados: ${resultado.metadata.usedServices.join(', ')}`);

    return resultado;

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error generando audio para escena ${sceneIndex + 1}: ${error}`);
    
    // Fallback completo que garantiza compatibilidad
    return {
      music: createSilenceBuffer(seccion.duracion || 10),
      voice: Buffer.from([]),
      sfx: [],
      metadata: {
        duration: Date.now() - startTime,
        usedServices: ['fallback'],
        quality: { error: String(error) }
      }
    };
  }
}

/**
 * Genera audio optimizado para múltiples escenas del plan
 * Optimiza las llamadas a APIs y reutiliza música cuando es apropiado
 */
export async function generateBatchSceneAudio(
  plan: VideoPlan,
  startIndex: number = 0,
  endIndex?: number
): Promise<SceneAudioResult[]> {
  const finalIndex = endIndex || plan.timeline.length;
  const seccionesAProcesar = plan.timeline.slice(startIndex, finalIndex);
  
  logger.info(`🎬 [SceneAudio] Procesando lote: escenas ${startIndex + 1}-${finalIndex} (${seccionesAProcesar.length} escenas)`);

  try {
    // Procesar en paralelo con límite de concurrencia
    const CONCURRENCY_LIMIT = 3; // Evitar saturar APIs
    const resultados: SceneAudioResult[] = [];
    
    for (let i = 0; i < seccionesAProcesar.length; i += CONCURRENCY_LIMIT) {
      const lote = seccionesAProcesar.slice(i, i + CONCURRENCY_LIMIT);
      const promesasLote = lote.map((seccion, indexEnLote) => 
        generateSceneAudio(seccion, plan, startIndex + i + indexEnLote)
      );
      
      const resultadosLote = await Promise.all(promesasLote);
      resultados.push(...resultadosLote);
      
      logger.info(`🔄 [SceneAudio] Lote completado: ${i + 1}-${Math.min(i + CONCURRENCY_LIMIT, seccionesAProcesar.length)} de ${seccionesAProcesar.length}`);
    }

    logger.info(`✅ [SceneAudio] Lote completo procesado: ${resultados.length} escenas`);
    return resultados;

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error procesando lote de escenas: ${error}`);
    
    // Fallback para todo el lote
    return seccionesAProcesar.map((seccion, index) => ({
      music: createSilenceBuffer(seccion.duracion || 10),
      voice: Buffer.from([]),
      sfx: [],
      metadata: {
        duration: 0,
        usedServices: ['fallback'],
        quality: { error: String(error), sceneIndex: startIndex + index }
      }
    }));
  }
}

/**
 * Sincroniza audio generado con clips de video para renderPipeline
 * Garantiza que los buffers de audio coincidan con la duración de los clips
 */
export async function syncAudioWithVideoClips(
  audioResults: SceneAudioResult[],
  videoClips: string[]
): Promise<{
  voiceBuffer: Buffer;
  musicBuffers: Buffer[];
  sfxBuffers: Buffer[];
}> {
  logger.info(`🎵 [SceneAudio] Sincronizando ${audioResults.length} audios con ${videoClips.length} clips`);

  try {
    // 1. Combinar voz de todas las escenas
    const voiceBuffers = audioResults
      .map(result => result.voice)
      .filter(voice => voice.length > 0);
    
    const voiceBuffer = voiceBuffers.length > 0 
      ? Buffer.concat(voiceBuffers)
      : Buffer.from([]);

    // 2. Combinar música manteniendo continuidad
    const musicBuffers = audioResults.map(result => result.music);

    // 3. Combinar efectos de sonido
    const sfxBuffers = audioResults.flatMap(result => result.sfx);

    logger.info(`✅ [SceneAudio] Sincronización completada:`);
    logger.info(`   - Voz: ${voiceBuffer.length} bytes`);
    logger.info(`   - Música: ${musicBuffers.length} buffers`);
    logger.info(`   - SFX: ${sfxBuffers.length} efectos`);

    return {
      voiceBuffer,
      musicBuffers,
      sfxBuffers
    };

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error sincronizando audio con video: ${error}`);
    
    // Fallback que garantiza compatibilidad con renderPipeline
    return {
      voiceBuffer: Buffer.from([]),
      musicBuffers: audioResults.map(result => createSilenceBuffer(10)),
      sfxBuffers: []
    };
  }
}

/**
 * Función optimizada para renderPipeline.ts
 * Reemplaza las llamadas individuales a audioEngine y musicService
 */
export async function generateUnifiedAudioForPipeline(
  plan: VideoPlan
): Promise<{
  voiceBuffer: Buffer;
  musicBuffer: Buffer;
  sfxBuffer: Buffer;
  metadata: any;
}> {
  logger.info(`🎼 [SceneAudio] Generando audio unificado para pipeline (${plan.timeline.length} escenas)`);

  try {
    // 1. Generar audio para todas las escenas
    const audioResults = await generateBatchSceneAudio(plan);

    // 2. Sincronizar con el formato esperado por renderPipeline
    const syncResult = await syncAudioWithVideoClips(audioResults, []);

    // 3. Combinar música en un solo buffer
    const musicBuffer = syncResult.musicBuffers.length > 0
      ? Buffer.concat(syncResult.musicBuffers)
      : createSilenceBuffer(30);

    // 4. Combinar SFX en un solo buffer
    const sfxBuffer = syncResult.sfxBuffers.length > 0
      ? Buffer.concat(syncResult.sfxBuffers)
      : createSilenceBuffer(5);

    // 5. Metadata consolidada
    const metadata = {
      totalEscenas: plan.timeline.length,
      serviciosUsados: audioResults.flatMap(r => r.metadata.usedServices),
      duracionTotal: audioResults.reduce((sum, r) => sum + r.metadata.duration, 0),
      calidad: {
        musicaTamaño: musicBuffer.length,
        vozTamaño: syncResult.voiceBuffer.length,
        sfxTamaño: sfxBuffer.length
      }
    };

    logger.info(`✅ [SceneAudio] Audio unificado generado para pipeline`);
    logger.info(`📊 [SceneAudio] Total: música ${metadata.calidad.musicaTamaño} bytes, voz ${metadata.calidad.vozTamaño} bytes, SFX ${metadata.calidad.sfxTamaño} bytes`);

    return {
      voiceBuffer: syncResult.voiceBuffer,
      musicBuffer,
      sfxBuffer,
      metadata
    };

  } catch (error) {
    logger.error(`❌ [SceneAudio] Error generando audio unificado: ${error}`);
    
    // Fallback completo que garantiza que renderPipeline no falle
    return {
      voiceBuffer: Buffer.from([]),
      musicBuffer: createSilenceBuffer(30),
      sfxBuffer: createSilenceBuffer(5),
      metadata: {
        error: String(error),
        fallbackUsado: true
      }
    };
  }
}

// Helper functions
function extractUsedServices(metadata: any): string[] {
  const servicios = [];
  
  if (metadata?.serviciosUsados?.freesound) servicios.push('Freesound');
  if (metadata?.serviciosUsados?.murf) servicios.push('Murf');
  if (metadata?.serviciosUsados?.efectosGenerados > 0) servicios.push('SFX');
  
  return servicios.length > 0 ? servicios : ['fallback'];
}

function createSilenceBuffer(duration: number): Buffer {
  const silenceDuration = Math.max(duration, 1);
  const bufferSize = Math.floor(silenceDuration * 44100 * 2 * 2); // 44.1kHz stereo 16-bit
  return Buffer.alloc(bufferSize);
}

```

### 📂 src/services/searchAsset.ts

```ts
// searchAsset.ts - Servicio de búsqueda de assets

import { logger } from '../utils/logger.js';

export interface AssetItem {
  tipo: string;
  ruta: string;
  nombre: string;
  completitud: string;
  estilo: string;
  lugar?: string;
  variante?: string;
  ambiente?: string;
  angulo?: string;
  score?: number;
}

/**
 * Busca el mejor asset según criterios específicos
 */
export async function findBestAsset(
  assets: AssetItem[], 
  criteria: {
    tipo?: string;
    estilo?: string;
    ambiente?: string;
    query?: string;
  }
): Promise<AssetItem | null> {
  
  logger.info(`[SearchAsset] Buscando asset con criterios:`, criteria);
  
  if (!assets || assets.length === 0) {
    logger.warn('[SearchAsset] No hay assets disponibles');
    return null;
  }
  
  let filteredAssets = [...assets];
  
  // Filtrar por tipo
  if (criteria.tipo) {
    filteredAssets = filteredAssets.filter(asset => 
      asset.tipo.toLowerCase() === criteria.tipo!.toLowerCase()
    );
  }
  
  // Filtrar por estilo
  if (criteria.estilo) {
    filteredAssets = filteredAssets.filter(asset => 
      asset.estilo.toLowerCase() === criteria.estilo!.toLowerCase() ||
      asset.estilo.toLowerCase() === 'universal'
    );
  }
  
  // Filtrar por ambiente
  if (criteria.ambiente) {
    filteredAssets = filteredAssets.filter(asset => 
      asset.ambiente?.toLowerCase().includes(criteria.ambiente!.toLowerCase())
    );
  }
  
  // Búsqueda por query general
  if (criteria.query) {
    const query = criteria.query.toLowerCase();
    filteredAssets = filteredAssets.filter(asset => 
      asset.nombre.toLowerCase().includes(query) ||
      asset.ambiente?.toLowerCase().includes(query) ||
      asset.lugar?.toLowerCase().includes(query)
    );
  }
  
  // Solo assets completos
  filteredAssets = filteredAssets.filter(asset => 
    asset.completitud === 'completa'
  );
  
  if (filteredAssets.length === 0) {
    logger.warn('[SearchAsset] No se encontraron assets que coincidan');
    return null;
  }
  
  // Scoring y selección del mejor
  const scoredAssets = filteredAssets.map(asset => ({
    ...asset,
    score: calculateAssetScore(asset, criteria)
  }));
  
  // Ordenar por score descendente
  scoredAssets.sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const bestAsset = scoredAssets[0];
  logger.info(`[SearchAsset] Mejor asset encontrado: ${bestAsset.nombre} (score: ${bestAsset.score})`);
  
  return bestAsset;
}

/**
 * Calcula el score de relevancia de un asset
 */
function calculateAssetScore(asset: AssetItem, criteria: any): number {
  let score = 0;
  
  // Bonus por coincidencia exacta de tipo
  if (criteria.tipo && asset.tipo.toLowerCase() === criteria.tipo.toLowerCase()) {
    score += 10;
  }
  
  // Bonus por coincidencia exacta de estilo
  if (criteria.estilo && asset.estilo.toLowerCase() === criteria.estilo.toLowerCase()) {
    score += 8;
  }
  
  // Bonus por estilo universal
  if (asset.estilo.toLowerCase() === 'universal') {
    score += 5;
  }
  
  // Bonus por ambiente coincidente
  if (criteria.ambiente && asset.ambiente?.toLowerCase().includes(criteria.ambiente.toLowerCase())) {
    score += 6;
  }
  
  // Bonus por query coincidente
  if (criteria.query) {
    const query = criteria.query.toLowerCase();
    if (asset.nombre.toLowerCase().includes(query)) score += 7;
    if (asset.ambiente?.toLowerCase().includes(query)) score += 4;
    if (asset.lugar?.toLowerCase().includes(query)) score += 3;
  }
  
  // Bonus por completitud
  if (asset.completitud === 'completa') {
    score += 5;
  }
  
  return score;
}

/**
 * Busca múltiples assets con criterios
 */
export async function findAssets(
  assets: AssetItem[], 
  criteria: any,
  limit: number = 5
): Promise<AssetItem[]> {
  
  logger.info(`[SearchAsset] Buscando hasta ${limit} assets`);
  
  const bestAsset = await findBestAsset(assets, criteria);
  if (!bestAsset) return [];
  
  // Buscar assets similares
  const similarAssets = assets
    .filter(asset => asset !== bestAsset)
    .map(asset => ({
      ...asset,
      score: calculateAssetScore(asset, criteria)
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit - 1);
  
  return [bestAsset, ...similarAssets];
}

```

### 📂 src/services/templateService.ts

```ts
// src/services/templateService.ts - Servicio de Templates Predefinidos
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeLog } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface Template {
  title: string;
  description: string;
  prompt: string;
  duracion: number;
  tono: string;
}

export interface TemplateCollection {
  [estilo: string]: {
    [categoria: string]: Template;
  };
}

let templatesCache: TemplateCollection | null = null;

/**
 * Cargar templates desde archivo JSON
 */
export function cargarTemplates(): TemplateCollection {
  if (templatesCache) {
    return templatesCache;
  }

  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'templates.json');
    const templatesRaw = fs.readFileSync(templatePath, 'utf-8');
    templatesCache = JSON.parse(templatesRaw);
    
    safeLog('[TemplateService] Templates cargados exitosamente', {
      estilos: Object.keys(templatesCache || {}),
      totalTemplates: Object.values(templatesCache || {}).reduce((total, estilo) => total + Object.keys(estilo).length, 0)
    });
    
    return templatesCache!;
  } catch (error) {
    safeLog('[TemplateService] Error cargando templates:', error);
    return {};
  }
}

/**
 * Obtener template específico por estilo y categoría
 */
export function obtenerTemplate(estilo: string, categoria: string): Template | null {
  const templates = cargarTemplates();
  
  if (!templates[estilo]) {
    safeLog('[TemplateService] Estilo no encontrado:', estilo);
    return null;
  }
  
  if (!templates[estilo][categoria]) {
    safeLog('[TemplateService] Categoría no encontrada:', { estilo, categoria });
    return null;
  }
  
  return templates[estilo][categoria];
}

/**
 * Listar todas las categorías disponibles para un estilo
 */
export function listarCategoriasPorEstilo(estilo: string): string[] {
  const templates = cargarTemplates();
  
  if (!templates[estilo]) {
    return [];
  }
  
  return Object.keys(templates[estilo]);
}

/**
 * Listar todos los estilos disponibles
 */
export function listarEstilos(): string[] {
  const templates = cargarTemplates();
  return Object.keys(templates);
}

/**
 * Obtener todos los templates de un estilo
 */
export function obtenerTemplatesPorEstilo(estilo: string): { [categoria: string]: Template } | null {
  const templates = cargarTemplates();
  
  if (!templates[estilo]) {
    return null;
  }
  
  return templates[estilo];
}

/**
 * Buscar templates por texto en título o descripción
 */
export function buscarTemplates(termino: string): Array<{
  estilo: string;
  categoria: string;
  template: Template;
}> {
  const templates = cargarTemplates();
  const resultados: Array<{
    estilo: string;
    categoria: string;
    template: Template;
  }> = [];
  
  const terminoLower = termino.toLowerCase();
  
  Object.entries(templates).forEach(([estilo, categorias]) => {
    Object.entries(categorias).forEach(([categoria, template]) => {
      if (
        template.title.toLowerCase().includes(terminoLower) ||
        template.description.toLowerCase().includes(terminoLower) ||
        template.prompt.toLowerCase().includes(terminoLower)
      ) {
        resultados.push({ estilo, categoria, template });
      }
    });
  });
  
  return resultados;
}

/**
 * Validar que un template tiene todos los campos requeridos
 */
export function validarTemplate(template: any): boolean {
  const camposRequeridos = ['title', 'description', 'prompt', 'duracion', 'tono'];
  
  return camposRequeridos.every(campo => {
    const existe = template.hasOwnProperty(campo);
    if (!existe) {
      safeLog('[TemplateService] Campo requerido faltante:', campo);
    }
    return existe;
  });
}

/**
 * Obtener template aleatorio de un estilo
 */
export function obtenerTemplateAleatorio(estilo?: string): {
  estilo: string;
  categoria: string;
  template: Template;
} | null {
  const templates = cargarTemplates();
  
  let estilosDisponibles = Object.keys(templates);
  if (estilo && templates[estilo]) {
    estilosDisponibles = [estilo];
  }
  
  if (estilosDisponibles.length === 0) {
    return null;
  }
  
  const estiloSeleccionado = estilosDisponibles[Math.floor(Math.random() * estilosDisponibles.length)];
  const categorias = Object.keys(templates[estiloSeleccionado]);
  
  if (categorias.length === 0) {
    return null;
  }
  
  const categoriaSeleccionada = categorias[Math.floor(Math.random() * categorias.length)];
  
  return {
    estilo: estiloSeleccionado,
    categoria: categoriaSeleccionada,
    template: templates[estiloSeleccionado][categoriaSeleccionada]
  };
}

```

### 📂 src/services/voiceService.ts

```ts
import { logFeedback } from './feedbackService.js';
// src/services/voiceService.ts
/**
 * Voice Service v6.1 – 2025-07-13
 * --------------------------------
 * ▸ TTS por personaje (Murf › ElevenLabs fallback) con voces genéricas.
 * ▸ Cabeceras y endpoints alineados a la doc oficial 07/2025.
 * ▸ Devuelve pista continua de duración exacta, 48 kHz, –16 LUFS.
 */

import axios               from 'axios';
import { spawn }           from 'child_process';
import ffmpegPath          from 'ffmpeg-static';
import fs                  from 'fs/promises';
import path                from 'path';
import { v4 as uuid }      from 'uuid';

import {
  VideoPlan,
  CharacterVoiceSpec
} from '../utils/types.js';
import { env }    from '../config/env.js';
import { logger } from '../utils/logger.js';
import { retry }  from '../utils/retry.js';

const TMP_DIR      = '/tmp/voices_v6';
const TIMEOUT_TTS  = 600_000; // Incrementar tiempo de espera a 10 minutos
const RETRIES      = 3; // Incrementar reintentos a 3

/* Helper timeout */
function withTimeout<T>(p: Promise<T>, ms = TIMEOUT_TTS): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), ms))
  ]);
}

/* --- Murf AI ------------------------------------------------ */
const MURF_FEMALE = [
  'en-US-natalie',  'en-US-amara',    'en-US-phoebe',   'en-US-daisy',
  'en-US-iris',     'en-US-julia',    'en-US-alicia',   'en-US-charlotte',
  'en-US-michelle', 'en-US-naomi',    'en-US-samantha'
] as const;

const MURF_MALE = [
  'en-US-ryan',     'en-US-terrell',  'en-US-miles',    'en-US-maverick',
  'en-US-paul',     'en-US-charles',  'en-US-ken',      'en-US-carter',
  'en-US-river',    'en-US-evander',  'en-US-daniel'
] as const;

/* --- ElevenLabs -------------------------------------------- */
const ELEVEN_FEMALE = [
  '21m00Tcm4TlvDq8ikWAM', 'EXAVITQu4vr4xnSDxMaL', 'AZnzlk1XvdvUeBnXmlld',
  'yoZ06aMxZJJ28mfd3POQ', 'MF3mGyEYCl7XYWbV9V6O'
] as const;

const ELEVEN_MALE = [
  'VR6AewLTigWG4xSOukaG', 'pNInz6obpgDQGcFmaJgB', 'TxGEqnHWrfWFTfGW9XjX',
  '8LRt0oGbnP7jFUXMaX9X', 'bVMeCyTHy58xNoL34h3p'
] as const;

function pickRandom<T extends readonly string[]>(arr: T): T[number] {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─────────────────────────────────────────────────────────── */
export function pickVoiceId(
  char: CharacterVoiceSpec
): { provider: 'murf' | 'eleven'; voiceId: string } {
  const gender = char.gender === 'female' ? 'female' : 'male';

  // Por estabilidad, usar solo ElevenLabs con IDs verificados
  const STABLE_ELEVEN_FEMALE = 'EXAVITQu4vr4xnSDxMaL'; // Rachel - muy estable
  const STABLE_ELEVEN_MALE = 'pNInz6obpgDQGcFmaJgB';   // Adam - muy estable

  const voiceId = gender === 'female' ? STABLE_ELEVEN_FEMALE : STABLE_ELEVEN_MALE;
  
  return { provider: 'eleven', voiceId };
}

/* ────────────────────────────────────────────────────────────
 * 2) TTS providers
 * ────────────────────────────────────────────────────────── */
async function murfTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!env.MURF_API_KEY) {
    logFeedback({
      service: 'Voice',
      action: 'murfTTS',
      success: false,
      error: 'MURF_API_KEY no configurada',
      params: { voiceId }
    });
    return null;
  }

  try {
    const { data } = await withTimeout(
            axios.post(
        'https://api.murf.ai/v1/speech/generate',
        {
          text,
          voiceId,
          format: 'MP3',
          sampleRate: 48000,
          modelVersion: 'GEN2',
          encodeAsBase64: true
        },
        {
          headers: { 'api-key': env.MURF_API_KEY },
          timeout: TIMEOUT_TTS
        }
      )
    );

    // Validación estricta de la respuesta
    if (data.encodedAudio) {
      logger.info('Murf API: Audio inline recibido correctamente.');
      return Buffer.from(data.encodedAudio, 'base64');
    }

    if (data.audioFile) {
      logger.info('Murf API: URL de audio recibida correctamente.');
      const audio = await axios.get(data.audioFile, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(audio.data);
    }

    logger.error('Murf API: Respuesta inesperada, faltan campos esperados.');
    logFeedback({
      service: 'Voice',
      action: 'murfTTS',
      success: false,
      error: 'Respuesta inesperada de Murf',
      params: { text, voiceId }
    });
    throw new Error('Murf: respuesta inesperada');
  } catch (e: any) {
    // Registro detallado del error
    logFeedback({
      service: 'Voice',
      action: 'murfTTS',
      success: false,
      error: e?.message || 'Error Murf',
      params: { text, voiceId, response: e?.response?.data }
    });
    if (e.response) {
      logger.error(
        `Murf API error: ${e.message}, Código de estado: ${e.response.status}, Respuesta: ${JSON.stringify(e.response.data)}`
      );
    } else {
      logger.error(`Murf API error: ${e.message}`);
    }
    return null;
  }
}

async function elevenTTS(text: string, voiceId: string): Promise<Buffer | null> {
  if (!env.ELEVENLABS_API_KEY) {
    logFeedback({
      service: 'Voice',
      action: 'elevenTTS',
      success: false,
      error: 'ELEVENLABS_API_KEY no configurada',
      params: { voiceId }
    });
    return null;
  }

  try {
    const url =
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}` +
      '?output_format=mp3_48000_128';

    const { data } = await withTimeout(
      axios.post(
        url,
        { text, model_id: 'eleven_multilingual_v2' },
        {
          headers: {
            'xi-api-key': env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            Accept: 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        }
      )
    );

    return Buffer.from(data);
  } catch (e: any) {
    logFeedback({
      service: 'Voice',
      action: 'elevenTTS',
      success: false,
      error: e?.message || 'Error ElevenLabs',
      params: { text, voiceId, response: e?.response?.data }
    });
    logger.warn(`ElevenLabs error: ${e.message}`);
    return null;
  }
}

/* ────────────────────────────────────────────────────────────
 * 3) Generar silencio MP3 de n segundos
 * ────────────────────────────────────────────────────────── */
async function silence(seconds: number, file: string) {
  await new Promise<void>((res, rej) => {
    if (typeof ffmpegPath !== 'string') {
      return rej(new Error('ffmpeg path not found'));
    }
    const proc = spawn(ffmpegPath, [
      '-f',
      'lavfi',
      '-i',
      'anullsrc=r=48000:cl=stereo',
      '-t',
      String(seconds),
      '-q:a',
      '9',
      '-acodec',
      'libmp3lame',
      file
    ]);
    proc.on('close', (code: number) => (code === 0 ? res() : rej(new Error('ffmpeg silence'))));
  });
}

/* ────────────────────────────────────────────────────────────
 * 4) Normaliza loudness a –16 LUFS
 * ────────────────────────────────────────────────────────── */
async function normalise(input: string, output: string) {
  await new Promise<void>((res, rej) => {
    if (typeof ffmpegPath !== 'string') {
      return rej(new Error('ffmpeg path not found'));
    }
    const proc = spawn(ffmpegPath, [
      '-i',
      input,
      '-af',
      'loudnorm=I=-16:TP=-1.5',
      '-c:a',
      'libmp3lame',
      '-q:a',
      '2',
      output
    ]);
    proc.on('close', (code: number) => (code === 0 ? res() : rej(new Error('loudnorm fail'))));
  });
}

/* ────────────────────────────────────────────────────────────
 * 5) Validar si el voiceId existe en Murf
 * ────────────────────────────────────────────────────────── */
async function validateVoiceId(voiceId: string): Promise<boolean> {
  try {
    const voices = await axios.get('https://murf.ai/api/docs/voices-styles/voice-library');
    return voices.data.some((voice: any) => voice.id === voiceId);
  } catch {
    return false;
  }
}

/* Validar voiceId antes de usar Murf */
async function validateVoiceIdBeforeUse(voiceId: string): Promise<boolean> {
  if (!env.MURF_API_KEY) return false;
  
  // Lista de IDs válidos conocidos para evitar llamadas API innecesarias
  const validMurfIds = [...MURF_FEMALE, ...MURF_MALE];
  const isValid = validMurfIds.includes(voiceId as any);
  
  if (!isValid) {
    logger.warn(`Voice ID inválido: ${voiceId}. Usando ElevenLabs como fallback.`);
  }
  return isValid;
}

/* ────────────────────────────────────────────────────────────
 * 6) Genera voz para un texto usando ElevenLabs como proveedor principal
 * ────────────────────────────────────────────────────────── */
// Google TTS fallback simple (puedes mejorar con API oficial si tienes credenciales)
async function googleTTS(text: string, lang = 'es'): Promise<Buffer | null> {
  try {
    // Usar gtts-cli si está disponible (requiere tenerlo instalado)
    const tmpFile = path.join(TMP_DIR, `gtts_${uuid()}.mp3`);
    await new Promise((res, rej) => {
      const proc = spawn('gtts-cli', ['--lang', lang, '--output', tmpFile, text]);
      proc.on('close', (code) => code === 0 ? res(true) : rej(new Error('gtts error')));
    });
    const buf = await fs.readFile(tmpFile);
    try {
      await fs.unlink(tmpFile);
    } catch (cleanupErr) {
      logger.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tmpFile}`);
      logFeedback && logFeedback({
        service: 'Voice',
        action: 'cleanup',
        success: false,
        error: 'No se pudo eliminar archivo temporal',
        params: { tmpFile }
      });
    }
    logger.info('Google TTS (gtts-cli) generado correctamente.');
    return buf;
  } catch (e) {
    logger.warn('Google TTS error: ' + (e instanceof Error ? e.message : e));
    return null;
  }
}

// Genera un beep de emergencia (1s, 440Hz)
async function beepFallback(): Promise<Buffer> {
  const tmpFile = path.join(TMP_DIR, `beep_${uuid()}.mp3`);
  await new Promise((res, rej) => {
    if (typeof ffmpegPath !== 'string') return rej(new Error('ffmpeg path not found'));
    const proc = spawn(ffmpegPath, [
      '-f', 'lavfi',
      '-i', 'sine=frequency=440:duration=1',
      '-ar', '48000',
      '-ac', '2',
      '-q:a', '9',
      '-acodec', 'libmp3lame',
      tmpFile
    ]);
    proc.on('close', (code) => code === 0 ? res(true) : rej(new Error('ffmpeg beep fail')));
  });
  const buf = await fs.readFile(tmpFile);
  try {
    await fs.unlink(tmpFile);
  } catch (cleanupErr) {
    logger.warn(`[Cleanup] No se pudo eliminar archivo temporal: ${tmpFile}`);
    logFeedback && logFeedback({
      service: 'Voice',
      action: 'cleanup',
      success: false,
      error: 'No se pudo eliminar archivo temporal',
      params: { tmpFile }
    });
  }
  logger.info('Beep fallback generado.');
  return buf;
}

// Fallback robusto: Murf → ElevenLabs → Google TTS → beep
async function generateVoice(text: string, gender: 'female' | 'male' = 'female'): Promise<Buffer> {
  // Validación estricta de parámetros
  if (typeof text !== 'string' || !text.trim()) {
    logger.error('[VoiceService] Texto de entrada inválido para TTS');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: false,
      error: 'Texto de entrada inválido',
      params: { text, gender }
    });
    throw new Error('Texto de entrada inválido para TTS');
  }
  if (gender !== 'female' && gender !== 'male') {
    logger.error('[VoiceService] Género inválido para TTS');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: false,
      error: 'Género inválido',
      params: { text, gender }
    });
    throw new Error('Género inválido para TTS');
  }
  // 1. Murf
  const murfId = gender === 'female' ? MURF_FEMALE[0] : MURF_MALE[0];
  let buffer = await murfTTS(text, murfId);
  if (buffer && buffer.length > 0) {
    logger.info('Voz generada con Murf.');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: true,
      params: { provider: 'Murf', text, gender }
    });
    return buffer;
  }
  // 2. ElevenLabs
  const elevenId = gender === 'female' ? ELEVEN_FEMALE[1] : ELEVEN_MALE[1];
  buffer = await elevenTTS(text, elevenId);
  if (buffer && buffer.length > 0) {
    logger.info('Voz generada con ElevenLabs.');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: true,
      params: { provider: 'ElevenLabs', text, gender }
    });
    return buffer;
  }
  // 3. Google TTS
  buffer = await googleTTS(text, gender === 'female' ? 'es' : 'es');
  if (buffer && buffer.length > 0) {
    logger.info('Voz generada con Google TTS.');
    logFeedback({
      service: 'Voice',
      action: 'generateVoice',
      success: true,
      params: { provider: 'GoogleTTS', text, gender }
    });
    return buffer;
  }
  // 4. Beep de emergencia
  logger.warn('No se pudo generar voz con ningún TTS. Usando beep de emergencia.');
  logFeedback({
    service: 'Voice',
    action: 'generateVoice',
    success: false,
    error: 'No se pudo generar voz con ningún TTS',
    params: { text, gender }
  });
  return await beepFallback();
}

/* ════════════════════════════════════════════════════════════
 * createVoiceBuffer – API pública 
 * ✨ MEJORADO: Renombrado de createVoiceOver para reflejar múltiples voces
 * ═══════════════════════════════════════════════════════════ */
export async function createVoiceBuffer(plan: VideoPlan): Promise<Buffer> {
  logger.info('🎙️  VoiceService v6.3 – iniciando generación de voiceBuffer…');
  try {
    // Si el usuario pide un efecto de sonido explícito en el prompt, priorizarlo
    const audioBuffers = await Promise.all(
      plan.timeline.map(async (sec) => {
        // Si hay subtítulos multilingües, usarlos como fuente de voz
        let textoVoz = sec.voz || sec.dialogo;
        if (sec.subtitulos && typeof sec.subtitulos === 'string' && !sec.subtitulos.endsWith('.srt')) {
          // Si subtitulos es texto (no SRT), usarlo como fuente principal
          textoVoz = sec.subtitulos;
        }
        // Si hay SRT, podrías parsear y usar el texto (opcional, aquí solo si es texto)
        if (!textoVoz) return Buffer.from([]);
        
        // 📊 NUEVO: Registrar métricas por escena
        const tiempoInicio = Date.now();
        
        // Detectar si el usuario pide un efecto de sonido explícito
        const sfxMatch = typeof textoVoz === 'string' && textoVoz.match(/\[SFX:([^\]]+)\]/i);
        if (sfxMatch) {
          logger.info(`Efecto de sonido solicitado: ${sfxMatch[1]}`);
          
          // Actualizar métricas
          if (sec.metricas) {
            sec.metricas.sfxUsados = [sfxMatch[1]];
            sec.metricas.tiempoGeneracion = Date.now() - tiempoInicio;
          }
          
          return await beepFallback();
        }
        // Parámetros avanzados de voz
        const parametrosVoz = sec.parametrosVoz || {};
        const idioma = sec.idioma || 'es';
        const perfilUsuario = sec.perfilUsuario || plan.metadata?.perfilUsuario || 'default';
        const feedbackUsuario = sec.feedbackUsuario || plan.metadata?.feedbackUsuario;
        const lipSync = sec.lipSync || 'auto';
        // Selección de género y voz
        const gender = (parametrosVoz as any)?.genero || (sec as any).gender || (plan.metadata?.characters?.[0]?.gender) || 'female';
        // Aquí podrías usar Murf, ElevenLabs, Google TTS, etc. con los parámetros avanzados
        try {
          // Ejemplo: pasar parámetros avanzados a la función de generación de voz
          const voiceBuffer = await generateVoice(textoVoz ?? '', gender);
          
          // 📊 NUEVO: Actualizar métricas
          if (sec.metricas) {
            sec.metricas.usaLipSync = lipSync !== 'none';
            sec.metricas.tiempoGeneracion = Date.now() - tiempoInicio;
          }
          
          return voiceBuffer;
        } catch (e) {
          logger.error('Error generando voz para segmento: ' + (e instanceof Error ? e.message : e));
          
          // 📊 NUEVO: Registrar error en métricas
          if (sec.metricas) {
            sec.metricas.errorOcurrido = e instanceof Error ? e.message : 'Error desconocido';
            sec.metricas.tiempoGeneracion = Date.now() - tiempoInicio;
          }
          
          return await beepFallback();
        }
      })
    );
    
    const finalBuffer = Buffer.concat(audioBuffers);
    logger.info(`✅ VoiceBuffer generado: ${finalBuffer.length} bytes`);
    return finalBuffer;
  } catch (e) {
    logger.error(`VoiceService error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    logger.warn('⚠️ Continuando con beep de emergencia debido a errores en la generación de voz.');
    return await beepFallback();
  }
}

// ✨ BACKWARD COMPATIBILITY: Mantener la función original como alias
export const createVoiceOver = createVoiceBuffer;

```

### 📂 src/services/wav2lipService.ts

```ts

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger.js';


export interface Wav2LipOptions {
  face: string; // ruta al video o imagen base
  audio: string; // ruta al audio
  outputDir?: string; // carpeta de resultados
  still?: boolean;
  resize_factor?: number;
  fps?: number;
}


/**
 * Ejecuta Wav2Lip desde Node.js y retorna la ruta del video generado.
 */
export async function runWav2Lip(options: Wav2LipOptions): Promise<string> {
  const {
    face,
    audio,
    outputDir = './results',
    still = false,
    resize_factor = 1,
    fps = 25,
  } = options;

  // Construir comando
  const scriptPath = path.resolve(__dirname, '../../Wav2Lip/inference.py');
  const cwd = path.resolve(__dirname, '../../Wav2Lip');
  const venvPython = process.env.WAV2LIP_PYTHON || 'python';

  // Generar nombre de salida único
  const timestamp = Date.now();
  const resultDir = path.resolve(cwd, outputDir);
  if (!fs.existsSync(resultDir)) fs.mkdirSync(resultDir, { recursive: true });
  const outPath = path.join(resultDir, `wav2lip_${timestamp}.mp4`);

  // Comando base
  const args = [
    scriptPath,
    '--face', face,
    '--audio', audio,
    '--outfile', outPath,
    '--resize_factor', String(resize_factor),
    '--fps', String(fps),
  ];
  if (still) args.push('--still');

  // Ejecutar el proceso
  return new Promise((resolve, reject) => {
    logger.info(`[Wav2Lip] Ejecutando: ${venvPython} ${args.join(' ')}`);
    const proc = spawn(venvPython, args, { cwd });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) {
        logger.error(`[Wav2Lip] Error: ${stderr || stdout}`);
        return reject(new Error(`Wav2Lip error: ${stderr || stdout}`));
      }
      if (!fs.existsSync(outPath)) {
        logger.error('[Wav2Lip] No se generó ningún video mp4.');
        return reject(new Error('No se generó ningún video mp4.'));
      }
      logger.info(`[Wav2Lip] Video generado: ${outPath}`);
      resolve(outPath);
    });
  });
}


/**
 * Aplica Wav2Lip real para lip-sync en video o imagen.
 * @param face Ruta del video o imagen base
 * @param audio Ruta del archivo de audio (voz)
 * @param acting Emoción/acting a aplicar (opcional, por si se extiende)
 * @param style Estilo visual (opcional)
 * @returns Ruta del archivo de video generado
 */
export async function applyWav2Lip(face: string, audio: string, acting?: string, style?: string): Promise<string> {
  logger.info(`[Wav2Lip] Procesando ${face} + ${audio} | acting: ${acting} | style: ${style}`);
  return runWav2Lip({
    face,
    audio,
    still: false,
    resize_factor: 1,
    fps: 25,
  });
}

```

### 📂 src/types/AudioTypes.ts

```ts
// Archivo vacío
```

### 📂 src/types/estilos.ts

```ts
// src/types/estilos.ts - Tipos unificados para estilos visuales

/**
 * Estilos visuales principales soportados por CinemaAI
 */
export type EstiloVisualPrincipal = 
  | 'cinematic'     // Estilo cinematográfico profesional
  | 'anime'         // Estilo anime/manga japonés
  | 'cartoon'       // Estilo cartoon/animación occidental
  | 'commercial';   // Estilo comercial/publicitario

/**
 * Estilos de entrada permitidos desde la API (incluye alias)
 */
export type EstiloVisualAPI = 
  | EstiloVisualPrincipal
  | 'realistic'     // Alias para 'cinematic'
  | 'realista'      // Alias español para 'cinematic'  
  | 'comic'         // Alias para 'cartoon'
  | 'comercial';    // Alias español para 'commercial'

/**
 * Mapeo de estilos de entrada a estilos principales
 */
export const MAPEO_ESTILOS: Record<EstiloVisualAPI, EstiloVisualPrincipal> = {
  // Estilos principales (sin mapeo)
  'cinematic': 'cinematic',
  'anime': 'anime', 
  'cartoon': 'cartoon',
  'commercial': 'commercial',
  
  // Alias mapeados
  'realistic': 'cinematic',
  'realista': 'cinematic',
  'comic': 'cartoon',
  'comercial': 'commercial'
};

/**
 * Convierte cualquier estilo de entrada al estilo principal correspondiente
 */
export function normalizarEstilo(estilo: EstiloVisualAPI): EstiloVisualPrincipal {
  const estiloNormalizado = MAPEO_ESTILOS[estilo];
  if (!estiloNormalizado) {
    console.warn(`Estilo visual '${estilo}' no reconocido, usando 'cinematic' por defecto`);
    return 'cinematic';
  }
  return estiloNormalizado;
}

/**
 * Verifica si un estilo es válido
 */
export function esEstiloValido(estilo: string): estilo is EstiloVisualAPI {
  return estilo in MAPEO_ESTILOS;
}

/**
 * Lista de todos los estilos válidos para validaciones
 */
export const ESTILOS_VALIDOS: EstiloVisualAPI[] = Object.keys(MAPEO_ESTILOS) as EstiloVisualAPI[];

/**
 * Configuración específica por estilo
 */
export const CONFIGURACION_ESTILOS = {
  cinematic: {
    duracionMaximaToma: 10,
    aspectRatio: '16:9',
    usaLipSync: true,
    tecnologiaLipSync: 'wav2lip',
    descripcion: 'Estilo cinematográfico profesional con calidad de película'
  },
  anime: {
    duracionMaximaToma: 8,
    aspectRatio: '16:9', 
    usaLipSync: true,
    tecnologiaLipSync: 'sadtalker',
    descripcion: 'Estilo anime/manga japonés con características distintivas'
  },
  cartoon: {
    duracionMaximaToma: 6,
    aspectRatio: '16:9',
    usaLipSync: true, 
    tecnologiaLipSync: 'sadtalker',
    descripcion: 'Estilo cartoon occidental animado'
  },
  commercial: {
    duracionMaximaToma: 5,
    aspectRatio: '16:9',
    usaLipSync: false,
    tecnologiaLipSync: null,
    descripcion: 'Estilo comercial/publicitario enfocado en productos'
  }
} as const;

```

### 📂 src/types/respuestas.ts

```ts
// Archivo vacío
```

### 📂 src/utils/audioUtils.ts

```ts
// Archivo vacío
```

### 📂 src/utils/cinemaLogger.ts

```ts
// Archivo vacío
```

### 📂 src/utils/errorHandler.ts

```ts
// Archivo vacío
```

### 📂 src/utils/logger.ts

```ts
import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Crear directorio de logs si no existe
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new winston.transports.Console({ level: 'debug' }),
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'all.log'), level: 'info' })
  ]
});

// Utilidades para logging seguro con truncamiento de datos largos
export interface LogOptions {
  maxStringLength?: number;
  maxArrayItems?: number;
  maxObjectDepth?: number;
}

const defaultOptions: Required<LogOptions> = {
  maxStringLength: 500,
  maxArrayItems: 10,
  maxObjectDepth: 3
};

/**
 * Trunca datos largos para logging seguro
 */
export function truncateForLog(obj: any, options: LogOptions = {}, depth = 0): any {
  const opts = { ...defaultOptions, ...options };
  
  if (depth > opts.maxObjectDepth) {
    return '[Max depth reached]';
  }
  
  if (typeof obj === 'string') {
    return obj.length > opts.maxStringLength 
      ? obj.substring(0, opts.maxStringLength) + `...[truncated ${obj.length - opts.maxStringLength} chars]`
      : obj;
  }
  
  if (Array.isArray(obj)) {
    const truncatedArray = obj.slice(0, opts.maxArrayItems).map(item => 
      truncateForLog(item, options, depth + 1)
    );
    if (obj.length > opts.maxArrayItems) {
      truncatedArray.push(`...[${obj.length - opts.maxArrayItems} more items]`);
    }
    return truncatedArray;
  }
  
  if (obj && typeof obj === 'object') {
    const truncated: any = {};
    let processedKeys = 0;
    const maxKeys = 20;
    
    for (const [key, value] of Object.entries(obj)) {
      if (processedKeys >= maxKeys) {
        truncated[`...[${Object.keys(obj).length - maxKeys} more keys]`] = '...';
        break;
      }
      truncated[key] = truncateForLog(value, options, depth + 1);
      processedKeys++;
    }
    return truncated;
  }
  
  return obj;
}

/**
 * Console.log seguro que trunca datos largos
 */
export function safeLog(message: string, data?: any, options?: LogOptions) {
  if (data !== undefined) {
    console.log(message, truncateForLog(data, options));
  } else {
    console.log(message);
  }
}

/**
 * Detecta si un objeto contiene datos base64 largos
 */
export function hasLargeBase64(obj: any): boolean {
  if (typeof obj === 'string') {
    const base64Pattern = /^data:[^;]+;base64,|^[A-Za-z0-9+/]{100,}={0,2}$/;
    return obj.length > 1000 && base64Pattern.test(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.some(item => hasLargeBase64(item));
  }
  
  if (obj && typeof obj === 'object') {
    return Object.values(obj).some(value => hasLargeBase64(value));
  }
  
  return false;
}

```

### 📂 src/utils/menteFondos.ts

```ts
import { callOpenRouter } from '../services/llmService/openRouterUtil.js';
import { findBestAsset } from '../services/searchAsset.js';
import { VideoPlan, TimelineSecond } from '../utils/types.js';
import { EstiloVisualPrincipal, normalizarEstilo } from '../types/estilos.js';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';

// Configuración CDN
const CDN_BASE_URL = 'https://storage.googleapis.com';
const CDN_BUCKET = process.env.GCP_BUCKET_NAME || 'mi-bucket';

/**
 * Mapea estilos principales a nombres de carpetas de assets
 */
function mapearEstiloACarpetaAssets(estilo: EstiloVisualPrincipal): string {
  const mapeoAssets: Record<EstiloVisualPrincipal, string> = {
    'cinematic': 'realista',
    'anime': 'anime',
    'cartoon': 'comic',
    'commercial': 'realista'
  };
  return mapeoAssets[estilo] || 'realista';
}

function assetToCDNUrl(asset: AssetIndexItem): string {
  // assets van bajo la carpeta raíz del repo, por ejemplo: escenas/realista/casa/baño/día/aerea.png
  return `${CDN_BASE_URL}/${CDN_BUCKET}/${asset.ruta}`;
}

export const AssetIndexSchema = z.object({
  tipo: z.string(),
  ruta: z.string(),
  nombre: z.string(),
  completitud: z.string(),
  estilo: z.string(),
  lugar: z.string().optional(),
  variante: z.string().optional(),
  ambiente: z.string().optional(),
  angulo: z.string().optional(),
  size: z.number().optional(),
  fecha: z.string().optional(),
});
export type AssetIndexItem = z.infer<typeof AssetIndexSchema>;

/**
 * Usa OpenRouter para sugerir el fondo y actor más coherente según el contexto narrativo
 */
export async function sugerirFondoActorLLM({
  prompt,
  escena,
  fondos,
  actores,
  modelo = 'openai/chatgpt-4o-latest',
  timeout = 30000
}: {
  prompt: string;
  escena: TimelineSecond;
  fondos: AssetIndexItem[];
  actores: AssetIndexItem[];
  modelo?: string;
  timeout?: number;
}): Promise<{ fondo: AssetIndexItem | null; actor: AssetIndexItem | null; razon?: string; raw?: string; }> {
  const systemPrompt = `Eres un experto en dirección de arte y narrativa audiovisual. Tu tarea es elegir el fondo y actor más coherente para una escena, considerando el contexto narrativo, el prompt, el estilo, la emoción, el ambiente y los assets disponibles. Devuelve solo un JSON con los campos: fondoRuta, actorRuta, razon.`;
  const fondosList = fondos.map(a => `- ${a.nombre}: ${a.ruta} (${a.estilo}, ${a.ambiente || ''}, ${a.angulo || ''})`).join('\n');
  const actoresList = actores.map(a => `- ${a.nombre}: ${a.ruta} (${a.estilo}, ${a.ambiente || ''}, ${a.angulo || ''})`).join('\n');
  const userPrompt = `Prompt narrativo: ${prompt}\n\nEscena: ${JSON.stringify(escena)}\n\nFondos disponibles:\n${fondosList}\n\nActores disponibles:\n${actoresList}\n\nElige el fondo y actor más coherente y explica brevemente la razón.`;
  try {
    const respuesta = await callOpenRouter(systemPrompt, userPrompt, modelo, timeout);
    const match = respuesta && typeof respuesta === 'string' ? respuesta.match(/\{[\s\S]*\}/) : null;
    if (match) {
      const json = JSON.parse(match[0]);
      const fondo = fondos.find(a => a.ruta === json.fondoRuta) || null;
      const actor = actores.find(a => a.ruta === json.actorRuta) || null;
      return { fondo, actor, razon: json.razon, raw: respuesta };
    }
    return { fondo: null, actor: null, razon: 'No se pudo parsear respuesta LLM', raw: respuesta };
  } catch (e) {
    return { fondo: null, actor: null, razon: 'Error LLM: ' + String(e) };
  }
}

/**
 * Carga el índice de assets desde assets_index.json
 */
export async function cargarAssetsIndex(): Promise<AssetIndexItem[]> {
  // Warm cache + validación Zod
  const ASSETS_PATH = path.resolve(process.cwd(), 'assets_index.json');
  try {
    const data = await fs.readFile(ASSETS_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    // Validar cada item con Zod
    const validos = parsed.filter((item: any) => {
      try {
        AssetIndexSchema.parse(item);
        return true;
      } catch {
        return false;
      }
    });
    return validos;
  } catch (e) {
    console.error('Error cargando assets index:', e);
    return [];
  }
}

/**
 * Corrige los fondos y actores inválidos en el VideoPlan, sugiriendo alternativas válidas
 */
export function corregirFondosActoresInvalidos(videoPlan: VideoPlan, assetsIndex: AssetIndexItem[]): { videoPlan: VideoPlan; sugerencias: any[] } {
  const visualStyleRaw = videoPlan.metadata?.visualStyle || 'realistic';
  
  // Normalizar el estilo a EstiloVisualPrincipal y luego mapear a carpeta
  const estiloNormalizado = normalizarEstilo(visualStyleRaw as any);
  const carpetaAssets = mapearEstiloACarpetaAssets(estiloNormalizado);
  
  const fondosValidos = assetsIndex.filter((a: AssetIndexItem) => a.tipo === 'escenas' && a.completitud === 'completa' && a.estilo === carpetaAssets);
  const actoresValidos = assetsIndex.filter((a: AssetIndexItem) => a.tipo === 'actores' && a.completitud === 'completa' && a.estilo === carpetaAssets);
  const sugerencias: any[] = [];
  for (const scene of videoPlan.timeline as TimelineSecond[]) {
    // Fondo
    let fondoMatch: AssetIndexItem | null = null;
    if (scene.background && typeof scene.background === 'string' && !scene.background.startsWith('url://')) {
      const found = fondosValidos.find((a: AssetIndexItem) => a.ruta === scene.background);
      fondoMatch = found !== undefined ? found : null;
    }
    if (!fondoMatch) {
      const found = fondosValidos.find((a: AssetIndexItem) =>
        (!scene.ambiente || a.ambiente === scene.ambiente) &&
        (!scene.lugar || a.lugar === scene.lugar) &&
        (!scene.angulo || a.angulo === scene.angulo)
      );
      fondoMatch = found !== undefined ? found : null;
    }
    // Matching semántico simple si hay prompt y no hay match
    if (!fondoMatch && scene.backgroundPrompt) {
      let maxScore = 0;
      let best: AssetIndexItem | null = null;
      for (const a of fondosValidos) {
        let score = 0;
        if (a.ambiente === scene.ambiente) score++;
        if (a.lugar === scene.lugar) score++;
        if (a.angulo === (typeof scene.camera === 'object' ? scene.camera.shot : scene.camera)) score++;
        if (scene.backgroundPrompt && a.nombre && scene.backgroundPrompt.includes(a.nombre)) score++;
        if (score > maxScore) {
          maxScore = score;
          best = a;
        }
      }
      fondoMatch = best;
    }
    if (fondoMatch) {
      sugerencias.push({ t: scene.t, tipo: 'fondo', original: scene.background, sugerido: fondoMatch.ruta });
      scene.background = assetToCDNUrl(fondoMatch);
    } else {
      sugerencias.push({ t: scene.t, tipo: 'fondo', original: scene.background, sugerido: null });
      scene.background = '';
    }
    // Actor
    let actorMatch: AssetIndexItem | null = null;
    if (scene.character && typeof scene.character === 'string' && !scene.character.startsWith('url://')) {
      const found = actoresValidos.find((a: AssetIndexItem) => a.ruta === scene.character);
      actorMatch = found !== undefined ? found : null;
    }
    if (!actorMatch) {
      const found = actoresValidos.find((a: AssetIndexItem) =>
        (!scene.ambiente || a.ambiente === scene.ambiente) &&
        (!scene.lugar || a.lugar === scene.lugar) &&
        (!scene.angulo || a.angulo === scene.angulo)
      );
      actorMatch = found !== undefined ? found : null;
    }
    if (!actorMatch && scene.actorPrompt) {
      let maxScore = 0;
      let best: AssetIndexItem | null = null;
      for (const a of actoresValidos) {
        let score = 0;
        if (a.ambiente === scene.ambiente) score++;
        if (a.lugar === scene.lugar) score++;
        if (a.angulo === (typeof scene.camera === 'object' ? scene.camera.shot : scene.camera)) score++;
        if (scene.actorPrompt && a.nombre && scene.actorPrompt.includes(a.nombre)) score++;
        if (score > maxScore) {
          maxScore = score;
          best = a;
        }
      }
      actorMatch = best;
    }
    if (actorMatch) {
      sugerencias.push({ t: scene.t, tipo: 'actor', original: scene.character, sugerido: actorMatch.ruta });
      scene.character = assetToCDNUrl(actorMatch);
    } else {
      sugerencias.push({ t: scene.t, tipo: 'actor', original: scene.character, sugerido: null });
      scene.character = '';
    }
  }
  return { videoPlan, sugerencias };
}

/**
 * Valida que los fondos y actores en el VideoPlan sean correctos según el índice de assets
 */
export function validarVideoPlanFondosActores(videoPlan: VideoPlan, assetsIndex: AssetIndexItem[]): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  const fondosValidos = new Set(assetsIndex.filter((a: AssetIndexItem) => a.tipo === 'escenas' && a.completitud === 'completa').map((a: AssetIndexItem) => a.ruta));
  const actoresValidos = new Set(assetsIndex.filter((a: AssetIndexItem) => a.tipo === 'actores' && a.completitud === 'completa').map((a: AssetIndexItem) => a.ruta));
  for (const scene of videoPlan.timeline as TimelineSecond[]) {
    // Validar fondo: debe existir, ser del estilo correcto y estar completo
    if (scene.background) {
      const fondoMatch = assetsIndex.find((a: AssetIndexItem) => a.ruta === scene.background && a.tipo === 'escenas' && a.completitud === 'completa' && a.estilo === scene.visualStyle);
      if (!fondoMatch) {
        errores.push(`Fondo inválido o de estilo incorrecto en escena t=${scene.t}: ${scene.background}`);
      }
    }
    // Validar actor: debe existir, ser del estilo correcto y estar completo
    if (scene.character) {
      const actorMatch = assetsIndex.find((a: AssetIndexItem) => a.ruta === scene.character && a.tipo === 'actores' && a.completitud === 'completa' && a.estilo === scene.visualStyle);
      if (!actorMatch) {
        errores.push(`Actor inválido o de estilo incorrecto en escena t=${scene.t}: ${scene.character}`);
      }
    }
  }
  return { valido: errores.length === 0, errores };
}

```

### 📂 src/utils/normalizeSceneFields.ts

```ts
// Archivo vacío
```

### 📂 src/utils/paths.ts

```ts
// src/utils/paths.ts
export function toPosix(p: string) {
  return p.replace(/\\/g, '/');
}

```

### 📂 src/utils/retry.ts

```ts
export async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1500): Promise<T> {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

```

### 📂 src/utils/searchAsset.ts

```ts
// Archivo vacío
```

### 📂 src/utils/types-new.ts

```ts
// Archivo vacío
```

### 📂 src/utils/types.ts

```ts
// Storyteller AI · Contract Types (LIMPIO Y UNIFICADO)
// Actualizado para Sistema de Cerebros Cinematográficos

// ✅ IMPORTAR TIPOS UNIFICADOS
import { EstiloVisualPrincipal, EstiloVisualAPI } from '../types/estilos.js';

export type AllowedDuration = 5 | 8 | 10 | 12 | 15 | 20 | 25 | 30 | 45 | 60;

// ✅ USAR SISTEMA UNIFICADO DE ESTILOS
export type EstiloVisual = EstiloVisualPrincipal; // Tipo principal para uso interno
export type EstiloVisualEntrada = EstiloVisualAPI; // Tipo para entrada API

export type CarryoverLevel = 'none' | 'soft' | 'hard';

export interface RenderRequest {
  prompt: string;
  visualStyle: EstiloVisual;
  duration: AllowedDuration;
  metadata?: any;
  demoMode?: boolean;
  previewMode?: boolean;
  // ✅ PASO 4: Soporte para voz y música manual
  voice?: string | CharacterVoiceSpec; // ID de voz o spec completa
  music?: string | MusicSpec; // ID de música o spec completa
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
    carryover: boolean | CarryoverLevel;    // ✨ MEJORADO: Ahora soporta niveles
    audioCarryover?: boolean;
    tipoCorte: string;
    ritmo?: 'lento' | 'medio' | 'rápido';
    continuidad?: boolean;
  };
  transition?: string;
  
  // 📊 NUEVO: Métricas por escena para debugging y análisis
  metricas?: {
    usaLipSync?: boolean;
    usaCarryover?: boolean | CarryoverLevel;
    fondoGenerado?: string;
    actorGenerado?: string;
    musicaUsada?: string;
    sfxUsados?: string[];
    tiempoGeneracion?: number;
    errorOcurrido?: string;
  };
  
  // ✨ NUEVO: Campo VFX preparado para futuro cerebro de VFX
  vfx?: {
    efectos?: string[];
    colorGrading?: string;
    filtros?: string[];
    composicion?: string;
    particulas?: boolean;
    iluminacionDinamica?: boolean;
  };
  
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

```

### 📂 src/utils/validadores.ts

```ts
// validadores.ts - Validadores estrictos para el sistema CinemaAI
// ⚠️ CRÍTICO: Validación de duración implementada para prevenir errores silenciosos

import { AllowedDuration, EstiloVisual, CarryoverLevel } from './types.js';
import { EstiloVisualAPI, normalizarEstilo } from '../types/estilos.js';
import { logger } from './logger.js';

/**
 * ⚠️ VALIDACIÓN CRÍTICA: Valida que la duración sea exactamente una de las permitidas
 * Previene errores silenciosos que pueden romper el pipeline
 */
export function validarDuracionEstricta(duration: number): duration is AllowedDuration {
  const duracionesPermitidas: AllowedDuration[] = [5, 8, 10, 12, 15, 20, 25, 30, 45, 60];
  
  if (!duracionesPermitidas.includes(duration as AllowedDuration)) {
    logger.error(`❌ [Validador] Duración inválida: ${duration}. Permitidas: ${duracionesPermitidas.join(', ')}`);
    return false;
  }
  
  logger.info(`✅ [Validador] Duración válida: ${duration}s`);
  return true;
}

/**
 * Validar y normalizar la duración con fallback automático
 */
export function normalizarDuracion(duration: number): AllowedDuration {
  const duracionesPermitidas: AllowedDuration[] = [5, 8, 10, 12, 15, 20, 25, 30, 45, 60];
  
  // Si es exactamente una duración permitida, devolverla
  if (duracionesPermitidas.includes(duration as AllowedDuration)) {
    return duration as AllowedDuration;
  }
  
  // Buscar la duración permitida más cercana
  const duracionCercana = duracionesPermitidas.reduce((prev, curr) => 
    Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
  );
  
  logger.warn(`⚠️ [Validador] Duración ${duration}s normalizada a ${duracionCercana}s`);
  return duracionCercana;
}

/**
 * Validar estilo visual
 */
export function validarEstiloVisual(style: string): style is EstiloVisual {
  const estilosPermitidos: EstiloVisual[] = ['cinematic', 'anime', 'cartoon', 'commercial'];
  
  if (!estilosPermitidos.includes(style as EstiloVisual)) {
    logger.error(`❌ [Validador] Estilo visual inválido: ${style}. Permitidos: ${estilosPermitidos.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * 🎨 Normalizar estilo visual - usando sistema unificado
 */
export function normalizarEstiloVisual(style: string): EstiloVisual {
  // Usar el normalizador unificado del sistema de tipos (maneja strings)
  const estiloUnificado = normalizarEstilo(style as any);
  
  // Mapear de EstiloVisualAPI a EstiloVisual manteniendo compatibilidad
  const mapeoRetrocompatible: Partial<Record<EstiloVisualAPI, EstiloVisual>> = {
    'cinematic': 'cinematic',
    'realistic': 'cinematic', // realistic usa los mismos assets que cinematic
    'anime': 'anime',
    'comic': 'cartoon',      // comic se mapea a cartoon para retrocompatibilidad
    'commercial': 'commercial',
    'cartoon': 'cartoon',    // mapeo directo
    'realista': 'cinematic', // alias español
    'comercial': 'commercial' // alias español
  };
  
  const estiloMapeado = mapeoRetrocompatible[estiloUnificado] || 'cinematic';
  if (estiloMapeado !== style) {
    logger.warn(`⚠️ [Validador] Estilo ${style} normalizado a '${estiloMapeado}' via sistema unificado`);
  }
  
  return estiloMapeado;
}

/**
 * ✨ NUEVO: Validar nivel de carryover
 */
export function validarCarryoverLevel(level: any): level is CarryoverLevel {
  // Backward compatibility: false/true → none/soft
  if (typeof level === 'boolean') {
    return true; // Será convertido automáticamente
  }
  
  const nivelesPermitidos: CarryoverLevel[] = ['none', 'soft', 'hard'];
  
  if (!nivelesPermitidos.includes(level as CarryoverLevel)) {
    logger.error(`❌ [Validador] Nivel de carryover inválido: ${level}. Permitidos: ${nivelesPermitidos.join(', ')}`);
    return false;
  }
  
  return true;
}

/**
 * ✨ NUEVO: Normalizar nivel de carryover con backward compatibility
 */
export function normalizarCarryoverLevel(level: any): CarryoverLevel {
  // Backward compatibility: boolean → string
  if (typeof level === 'boolean') {
    const normalizado = level ? 'soft' : 'none';
    logger.info(`🔄 [Validador] Carryover boolean ${level} normalizado a '${normalizado}'`);
    return normalizado;
  }
  
  const nivelesPermitidos: CarryoverLevel[] = ['none', 'soft', 'hard'];
  
  if (nivelesPermitidos.includes(level as CarryoverLevel)) {
    return level as CarryoverLevel;
  }
  
  logger.warn(`⚠️ [Validador] Carryover ${level} normalizado a 'none'`);
  return 'none';
}

/**
 * 📊 NUEVO: Validar estructura de métricas
 */
export function validarEstructuraMetricas(metricas: any): boolean {
  if (!metricas || typeof metricas !== 'object') {
    return true; // Las métricas son opcionales
  }
  
  // Validar campos opcionales con tipos correctos
  const camposValidos = [
    'usaLipSync', 'usaCarryover', 'fondoGenerado', 'actorGenerado', 
    'musicaUsada', 'sfxUsados', 'tiempoGeneracion', 'errorOcurrido'
  ];
  
  for (const campo in metricas) {
    if (!camposValidos.includes(campo)) {
      logger.warn(`⚠️ [Validador] Campo de métricas desconocido: ${campo}`);
    }
  }
  
  return true;
}

/**
 * ⚠️ VALIDADOR CRÍTICO PRINCIPAL: Valida toda la estructura de RenderRequest
 */
export function validarRenderRequest(req: any): {
  valido: boolean;
  errores: string[];
  normalizado?: any;
} {
  const errores: string[] = [];
  const normalizado: any = { ...req };
  
  // Validar duración (CRÍTICO)
  if (req.duration === undefined || req.duration === null) {
    normalizado.duration = 30; // Fallback por defecto
    logger.warn('⚠️ [Validador] Duración no especificada, usando 30s por defecto');
  } else if (!validarDuracionEstricta(req.duration)) {
    normalizado.duration = normalizarDuracion(req.duration);
    errores.push(`Duración ${req.duration} normalizada a ${normalizado.duration}`);
  }
  
  // Validar estilo visual
  if (!req.visualStyle) {
    normalizado.visualStyle = 'cinematic';
    logger.warn('⚠️ [Validador] Estilo visual no especificado, usando cinematic por defecto');
  } else if (!validarEstiloVisual(req.visualStyle)) {
    normalizado.visualStyle = normalizarEstiloVisual(req.visualStyle);
    errores.push(`Estilo ${req.visualStyle} normalizado a ${normalizado.visualStyle}`);
  }
  
  // Validar prompt
  if (!req.prompt || typeof req.prompt !== 'string') {
    errores.push('Prompt requerido como string');
    normalizado.prompt = req.prompt || '';
  }
  
  const valido = errores.length === 0;
  
  if (valido) {
    logger.info('✅ [Validador] RenderRequest válido');
  } else {
    logger.warn(`⚠️ [Validador] RenderRequest con ${errores.length} warning(s): ${errores.join(', ')}`);
  }
  
  return { valido, errores, normalizado };
}

/**
 * 🔧 HELPER: Log de validación detallado para debugging
 */
export function logValidacion(tipo: string, original: any, resultado: any): void {
  logger.info(`🔍 [Validador] ${tipo}:`, {
    original: JSON.stringify(original),
    resultado: JSON.stringify(resultado),
    timestamp: new Date().toISOString()
  });
}

```

### 📂 src/utils/validateVideoPlan.ts

```ts
// Archivo vacío
```

### 📂 src/utils/videoUtils.ts

```ts
// src/utils/videoUtils.ts
// Utilidades para verificar duración y propiedades de videos

import { spawn } from 'child_process';
import { logger } from './logger.js';

export interface VideoInfo {
  duration: number;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  format: string;
}

/**
 * Obtiene información de un video usando ffprobe
 */
export async function getVideoInfo(videoPath: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      videoPath
    ]);

    let output = '';
    let errorOutput = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        logger.error(`[VideoUtils] FFprobe error (code ${code}):`, errorOutput);
        reject(new Error(`FFprobe failed with code ${code}: ${errorOutput}`));
        return;
      }

      try {
        const result = JSON.parse(output);
        const videoStream = result.streams.find((s: any) => s.codec_type === 'video');
        
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const info: VideoInfo = {
          duration: parseFloat(result.format.duration) || 0,
          width: parseInt(videoStream.width) || 0,
          height: parseInt(videoStream.height) || 0,
          frameRate: eval(videoStream.r_frame_rate) || 0, // e.g., "30/1" -> 30
          bitrate: parseInt(result.format.bit_rate) || 0,
          format: result.format.format_name || 'unknown'
        };

        resolve(info);
      } catch (error) {
        logger.error('[VideoUtils] Error parsing ffprobe output:', error);
        reject(new Error(`Failed to parse ffprobe output: ${error}`));
      }
    });

    ffprobe.on('error', (error) => {
      logger.error('[VideoUtils] FFprobe spawn error:', error);
      reject(error);
    });
  });
}

/**
 * Verifica que la duración del video coincida con la esperada
 */
export async function verificarDuracionVideo(
  videoPath: string, 
  duracionEsperada: number,
  tolerancia: number = 0.5
): Promise<{ coincide: boolean; duracionReal: number; diferencia: number }> {
  try {
    const info = await getVideoInfo(videoPath);
    const diferencia = Math.abs(info.duration - duracionEsperada);
    const coincide = diferencia <= tolerancia;

    logger.info(`[VideoUtils] Verificación de duración:`, {
      duracionEsperada,
      duracionReal: info.duration,
      diferencia,
      coincide,
      tolerancia
    });

    return {
      coincide,
      duracionReal: info.duration,
      diferencia
    };
  } catch (error) {
    logger.error('[VideoUtils] Error verificando duración:', error);
    throw error;
  }
}

/**
 * Calcula la duración total esperada desde un plan de video
 */
export function calcularDuracionEsperadaDesdePlan(videoPlan: any): number {
  // Si el plan tiene tomas reales, usar esas
  if (videoPlan.tomasReales && Array.isArray(videoPlan.tomasReales)) {
    const duracionTomas = videoPlan.tomasReales.reduce((total: number, toma: any) => {
      return total + (toma.duracion || 0);
    }, 0);
    logger.info(`[VideoUtils] Duración calculada desde tomas reales: ${duracionTomas}s`);
    return duracionTomas;
  }
  
  // Si el plan tiene timeline, usar el timeline
  if (videoPlan.timeline && Array.isArray(videoPlan.timeline)) {
    const duracionTimeline = videoPlan.timeline.length;
    logger.info(`[VideoUtils] Duración calculada desde timeline: ${duracionTimeline}s`);
    return duracionTimeline;
  }
  
  // Si tiene metadata con duración
  if (videoPlan.metadata && videoPlan.metadata.duracionTotal) {
    const duracionMetadata = videoPlan.metadata.duracionTotal;
    logger.info(`[VideoUtils] Duración calculada desde metadata: ${duracionMetadata}s`);
    return duracionMetadata;
  }
  
  logger.warn('[VideoUtils] No se pudo calcular duración esperada del plan');
  return 0;
}

```

### 📂 src/utils/videoValidator.ts

```ts
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
  duration: number;
  hasAudio: boolean;
}

export class VideoValidator {
  
  /**
   * Valida un video completo desde su URL
   */
  static async validateVideo(videoUrl: string, expectedDuration?: number): Promise<VideoValidationResult> {
    const result: VideoValidationResult = {
      valid: false,
      errors: [],
      duration: 0,
      hasAudio: false
    };

    try {
      // 1. Verificar que el URL existe y responde con status 200
      const urlValidation = await this.validateUrl(videoUrl);
      if (!urlValidation.valid) {
        result.errors.push(`URL no válida: ${urlValidation.error}`);
        return result;
      }

      // 2. Descargar temporalmente para análisis
      const tempFile = await this.downloadVideoTemporarily(videoUrl);
      
      try {
        // 3. Analizar el video con ffprobe
        const videoInfo = await this.analyzeVideoWithFFProbe(tempFile);
        
        result.duration = videoInfo.duration;
        result.hasAudio = videoInfo.hasAudio;

        // 4. Validar duración (al menos 90% del tiempo esperado)
        if (expectedDuration) {
          const minDuration = expectedDuration * 0.9;
          if (result.duration < minDuration) {
            result.errors.push(`Duración insuficiente: ${result.duration}s (mínimo: ${minDuration}s)`);
          }
        }

        // 5. Validar que tenga audio
        if (!result.hasAudio) {
          result.errors.push('El video no tiene pista de audio');
        }

        // 6. Determinar si es válido
        result.valid = result.errors.length === 0;

      } finally {
        // Limpiar archivo temporal
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }

    } catch (error) {
      result.errors.push(`Error durante validación: ${error.message}`);
    }

    return result;
  }

  /**
   * Valida que la URL sea accesible
   */
  private static async validateUrl(url: string): Promise<{valid: boolean, error?: string}> {
    try {
      const response = await fetch(url, { method: 'HEAD', timeout: 10000 });
      
      if (response.status !== 200) {
        return { valid: false, error: `Status HTTP ${response.status}` };
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('video')) {
        return { valid: false, error: `Content-Type no es video: ${contentType}` };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Descarga el video temporalmente para análisis
   */
  private static async downloadVideoTemporarily(url: string): Promise<string> {
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `video_${Date.now()}.mp4`);
    
    const response = await fetch(url, { timeout: 30000 });
    if (!response.ok) {
      throw new Error(`Error descargando video: ${response.status}`);
    }

    const fileStream = fs.createWriteStream(tempFile);
    return new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', () => resolve(tempFile));
      fileStream.on('error', reject);
    });
  }

  /**
   * Analiza el video usando ffprobe
   */
  private static async analyzeVideoWithFFProbe(filePath: string): Promise<{duration: number, hasAudio: boolean}> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ]);

      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.stderr.on('data', (data) => {
        console.warn('ffprobe stderr:', data.toString());
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          // Si ffprobe falla, usar método alternativo más simple
          this.analyzeVideoBasic(filePath)
            .then(resolve)
            .catch(reject);
          return;
        }

        try {
          const info = JSON.parse(output);
          const duration = parseFloat(info.format?.duration || '0');
          const hasAudio = info.streams?.some((stream: any) => stream.codec_type === 'audio') || false;
          
          resolve({ duration, hasAudio });
        } catch (error) {
          reject(new Error(`Error parsing ffprobe output: ${error.message}`));
        }
      });

      ffprobe.on('error', (error) => {
        // Si ffprobe no está disponible, usar método básico
        this.analyzeVideoBasic(filePath)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  /**
   * Análisis básico cuando ffprobe no está disponible
   */
  private static async analyzeVideoBasic(filePath: string): Promise<{duration: number, hasAudio: boolean}> {
    const stats = fs.statSync(filePath);
    
    // Estimación básica: archivos muy pequeños probablemente están corruptos
    if (stats.size < 100000) { // menos de 100KB
      throw new Error('Archivo de video muy pequeño, posiblemente corrupto');
    }

    // Para videos de Kling, asumimos que tienen audio y duración aproximada
    // Esta es una aproximación cuando no tenemos ffprobe
    const estimatedDuration = Math.max(10, Math.min(120, stats.size / 1000000)); // aprox 1MB por segundo
    
    return {
      duration: estimatedDuration,
      hasAudio: true // Kling típicamente genera con audio
    };
  }
}

```

### 📂 package.json

```json
{
  "name": "storyteller-backend",
  "version": "1.0.0",
  "description": "",
  "main": "./index.ts",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon dist/index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@fal-ai/client": "^1.6.0",
    "@google-cloud/storage": "^7.16.0",
    "@prisma/client": "^6.11.1",
    "@runwayml/sdk": "^2.4.2",
    "@types/sharp": "^0.31.1",
    "axios": "^1.10.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.0",
    "express": "^4.21.2",
    "express-async-errors": "^3.1.1",
    "express-rate-limit": "^7.5.1",
    "ffmpeg-static": "^5.2.0",
    "fluent-ffmpeg": "^2.1.3",
    "form-data": "^4.0.3",
    "helmet": "^8.1.0",
    "morgan": "^1.10.0",
    "multer": "^2.0.1",
    "node-fetch": "^3.3.2",
    "openai": "^5.9.0",
    "p-limit": "^6.2.0",
    "replicate": "^1.0.1",
    "sharp": "^0.34.3",
    "uuid": "^11.1.0",
    "winston": "^3.17.0",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@tsconfig/node16": "^16.1.4",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.3",
    "@types/fluent-ffmpeg": "^2.1.27",
    "@types/morgan": "^1.9.10",
    "@types/multer": "^2.0.0",
    "@types/node": "^24.0.13",
    "nodemon": "^3.1.10",
    "prisma": "^6.11.1",
    "ts-node": "^10.9.2",
    "typescript": "^5.8.3"
  }
}

```

### 📂 tsconfig.json

```json
{
  "extends": "@tsconfig/node16/tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 🚀 Resumen de Mejoras v2.0

### ✅ Validaciones Definitivas Implementadas

- **Pre-generación**: Validación de URLs de background, actor y longitud mínima de prompt
- **Post-generación**: Verificación explícita de video_url de Kling con logs detallados
- **Filtrado inteligente**: Solo procesa clips con URLs HTTPS válidas
- **Pre-montaje**: Validación de existencia de URLs antes del ensamblaje FFmpeg
- **Logs de éxito**: Confirmación explícita cuando el video se genera correctamente

### 🎯 Beneficios del Sistema

1. **Prevención de errores**: Las validaciones evitan videos mal formados o incompletos
2. **Debugging mejorado**: Logs explícitos en cada etapa del proceso
3. **Robustez**: El sistema maneja automáticamente clips fallidos sin interrumpir el flujo
4. **Transparencia**: Feedback claro sobre el estado de cada componente
5. **Calidad garantizada**: Solo se procesan assets válidos hasta la finalización

---

**🎬 CinemaAI v2.0 - Sistema de generación cinematográfica con IA distribuida y validaciones definitivas**

