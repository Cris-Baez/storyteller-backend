# 🎬 STORYTELLER AI BACKEND - Plataforma Completa de Generación de Videos

**Sistema completo de generación automática de videos cinematográficos y de marketing usando IA**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

---

## � Resumen técnico rápido (endpoints y módulos reales)

- Entrypoint: `src/index.ts` (Express, CORS, Helmet, RateLimit, Morgan)
- Rutas montadas:
  - `/api/auth` → `src/routes/auth.ts`
  - `/api/subscriptions` → `src/routes/subscriptionRoutes.ts`
  - `/api/marketing-config` → `src/routes/marketingConfigRoutes.ts`
  - `/api/marketing/templates` → `src/routes/marketingTemplateRoutes.ts`
  - `/api/admin` → `src/routes/admin.ts`
  - `/api/editor` → `src/routes/editor.ts`
  - `/api/cleanup` → `src/routes/cleanup.ts`
  - `/api/social` → `src/routes/social.ts` (Instagram Analytics incluido)
  - `/api/testing` → `src/routes/testingRoutes.ts`
  - `/api/agent` → `src/routes/marketingAgentRoutes.ts` (Agente conversacional)
  - `/api/copywriter` → `src/routes/copywriterProRoutes.ts`
  - `/api/render` → `src/routes/render.ts`
  - `/api/marketing` → `src/routes/marketingRoutes.ts`
  - `/api/cinema` → `src/routes/cinemaRoutes.ts`
  - `/api/videos` → `src/routes/videoRoutes.ts`

- Servicios clave (selección):
  - `services/InstagramAnalyticsService.ts` (conectar/sync/scorecard/bestTimes/analyzePost)
  - `services/MarketingAgentAnalyticsService.ts` (daily-brief/weekly-report/variants)
  - `services/marketingIntelligenceService.ts` y `services/enhancedMarketingIntelligenceService.ts`
  - `services/renderPipeline.ts` (pipeline de video)
  - `services/klingService.ts`, `services/ffmpegService.ts`, `services/cdnService.ts`
  - `services/authService.ts`, `services/subscriptionService.ts`, `services/paypalService.ts`
  - `jobs/jobQueue.ts`, `services/cleanupService.ts`

- Prisma (DB): `prisma/schema.prisma` incluye modelos Marketing Agent:
  `InstagramMetrics`, `PostAnalytics`, `MarketingInsight`, `ContentOptimization`, `WeeklyReport` con relaciones en `User` y `SocialAccount`.

- Healthcheck: `GET /healthz`

> Nota: El frontend usa baseURL `NEXT_PUBLIC_API_URL` (ej. `http://localhost:5000/api`). Evita doble `/api` cuando declares rutas en el cliente.

### Inventario auto-generado
- Archivo: `AUTO_DOCS_BACKEND.md` (todos los archivos de `src`, exports, endpoints y modelos Prisma)
- Regenerar: `node scripts/generateDocs.cjs`

## �📋 ÍNDICE

1. [¿Qué es Storyteller AI?](#qué-es-storyteller-ai)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Flujos Principales](#flujos-principales)
4. [Documentación de Archivos](#documentación-de-archivos)
5. [Servicios Principales](#servicios-principales)
6. [APIs y Endpoints](#apis-y-endpoints)
7. [Base de Datos](#base-de-datos)
8. [Configuración y Despliegue](#configuración-y-despliegue)

---

## 🚀 Despliegue rápido

Variables mínimas necesarias:

- DATABASE_URL (PostgreSQL)
- JWT_SECRET (>=16 chars)
- CORS_ORIGIN (ej: https://tu-frontend.com)

Comandos típicos:

```
npm ci
npm run prisma:generate
npm run prisma:migrate
npm run build
npm start
```

Healthcheck: GET /healthz

Las integraciones (OpenAI, FAL, etc.) son opcionales; defínelas solo si usarás esas features.


---

## 🎯 ¿QUÉ ES STORYTELLER AI?

**Storyteller AI** es una plataforma SaaS que convierte texto en videos profesionales usando inteligencia artificial. Ofrece dos modos principales:

### 🎬 **CINEMA AI** - Videos Cinematográficos
- Convierte **prompts de texto** en **videos narrativos cinematográficos**
- Genera automáticamente **guiones, tomas, audio y montaje**
- 6 estilos visuales: `cinematic`, `anime`, `cartoon`, `commercial`, `narrativa`, `noticias`
- Duración: 1-300 segundos
- **Sistema de "cerebros cinematográficos"** especializados por estilo

### 📢 **MARKETING AI** - Videos Comerciales
- Crea **videos promocionales** optimizados para conversión
- **Plantillas especializadas** por tipo de negocio
- **Modo Agente** para generación automática semanal
- Integración con imágenes del usuario
- CTA (Call-to-Action) automático

### 💼 **PLANES DE SUSCRIPCIÓN**
- **Starter** ($0/mes): 1 video/semana con marca de agua
- **Creator** ($29/mes): 5 videos/semana sin marca, actor IA
- **Studio Pro** ($99/mes): Videos ilimitados, Editor Pro, export HD

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **Backend Stack**
```
Node.js + TypeScript + Express.js
├── 🔐 Autenticación JWT + RefreshTokens
├── 💳 Suscripciones PayPal + Webhooks
├── 🎬 Pipeline de Renderizado
├── 🤖 Sistema de Jobs/Queue
├── 🗄️ Base de datos PostgreSQL + Prisma
└── ☁️ Google Cloud Storage (CDN)
```

### **Servicios de IA Integrados**
- **Kling AI** (vía fal.ai): Generación de video
- **OpenAI/OpenRouter**: Cerebros cinematográficos y guiones
- **Murf.ai**: Síntesis de voz comercial
- **ElevenLabs**: Efectos de sonido premium
- **Freesound**: Música de fondo y ambientes
- **SadTalker/Wav2Lip**: Sincronización labial

---

## 🔄 FLUJOS PRINCIPALES

### 🎬 **Flujo Cinema AI**
```mermaid
graph TD
    A[Usuario: Prompt + Estilo] --> B[Validar Plan/Límites]
    B --> C[Crear Job en Cola]
    C --> D[Dispatcher: Seleccionar Cerebro]
    D --> E[Generar Plan Cinematográfico]
    E --> F[Seleccionar Assets visuales]
    F --> G[Generar Videos por Toma]
    G --> H[Generar Audio: Voz + Música + FX]
    H --> I[Montaje Final con FFmpeg]
    I --> J[Subir a CDN]
    J --> K[Marcar Completado + Actualizar Uso]
```

### 📢 **Flujo Marketing AI**
```mermaid
graph TD
    A[Usuario: Brief/Plantilla] --> B[Aplicar Perfil Marketing]
    B --> C[Generar Estructura Comercial]
    C --> D[Procesar Imágenes Usuario]
    D --> E[Generar Tomas Marketing]
    E --> F[Audio Comercial + CTA]
    F --> G[Montaje con Branding]
    G --> H[Export Final]
```

### 🤖 **Flujo Agente Automático**
```mermaid
graph TD
    A[Programación Semanal] --> B[Verificar Límites Plan]
    B --> C[Seleccionar Plantilla]
    C --> D[Ejecutar Pipeline Marketing]
    D --> E[Notificar por Email]
```

---

## 📁 DOCUMENTACIÓN DE ARCHIVOS

### **📂 /src Estructura Principal**

```
src/
├── index.ts                     # 🚀 Punto de entrada del servidor
├── config/                      # ⚙️ Configuración del sistema
│   └── env.ts                   # Variables de entorno
├── controllers/                 # 🎮 Controladores de API
├── services/                    # 🔧 Servicios principales
├── pipelines/                   # 🏭 Pipelines de procesamiento
├── routes/                      # 🛣️ Rutas HTTP
├── middleware/                  # 🛡️ Middlewares
├── models/                      # 🗂️ Modelos de datos
├── utils/                       # 🔧 Utilidades
├── types/                       # 📋 Definiciones TypeScript
└── jobs/                        # 📋 Sistema de trabajos
```

---

## 🎮 **CONTROLLERS** - Lógica de Negocio

### **MarketingController.ts**
**Propósito**: Gestiona creación de videos de marketing
**Funciones**:
- `createMarketingVideo()`: Crear video manual
- `activateAgent()`: Activar modo agente automático  
- `getVideoStatus()`: Consultar progreso
- `getVideoHistory()`: Historial del usuario

### **AuthController.ts**
**Propósito**: Gestión de autenticación y usuarios
**Funciones**:
- `register()`: Registro de usuario
- `login()`: Login con JWT
- `refreshToken()`: Renovar token
- `forgotPassword()`: Reset de contraseña

### **SubscriptionController.ts**
**Propósito**: Gestión de suscripciones PayPal
**Funciones**:
- `createSubscription()`: Crear suscripción
- `cancelSubscription()`: Cancelar plan
- `handleWebhook()`: Procesar webhooks PayPal

### **AdminController.ts**
**Propósito**: Panel de administración
**Funciones**:
- `getUsers()`: Listar usuarios
- `getProjects()`: Ver todos los proyectos
- `retryFailedJob()`: Reintentar trabajos fallidos
- `cleanupOrphans()`: Limpiar archivos huérfanos

### **EditorController.ts**
**Propósito**: Editor visual (solo Studio Pro)
**Funciones**:
- `createProject()`: Crear proyecto editor
- `saveProject()`: Guardar estado
- `renderProject()`: Renderizar desde editor
- `getProjectHistory()`: Historial de versiones

### **CleanupController.ts**
**Propósito**: Mantenimiento del sistema
**Funciones**:
- `cleanupTempFiles()`: Limpiar temporales
- `cleanupExpiredJobs()`: Limpiar trabajos antiguos
- `optimizeStorage()`: Optimizar almacenamiento

### **TemplateController.ts**
**Propósito**: Gestión de plantillas de marketing
**Funciones**:
- `getTemplates()`: Listar plantillas disponibles
- `createTemplate()`: Crear nueva plantilla (admin)
- `updateTemplate()`: Actualizar plantilla
- `deleteTemplate()`: Eliminar plantilla

### **MarketingConfigController.ts**
**Propósito**: Configuración del perfil de marketing
**Funciones**:
- `getConfig()`: Obtener configuración actual
- `updateConfig()`: Actualizar perfil marketing
- `resetConfig()`: Restaurar configuración por defecto

---

## 🔧 **SERVICES** - Servicios Especializados

### **🎬 Generación de Video**

#### **KlingService.ts**
**Propósito**: Integración con Kling AI para generación de video
**Tecnología**: fal.ai API
**Funciones**:
- `generateKlingClip()`: Generar clip desde prompt/imagen
- `downloadClip()`: Descargar video temporal
- Soporte para aspectos: 16:9, 9:16, 1:1
- Control de movimiento de cámara y creatividad

#### **RenderPipeline.ts**
**Propósito**: Pipeline principal de renderizado
**Funciones**:
- `renderVideoSimplificado()`: Pipeline completo
- Integra todos los servicios: LLM, Audio, Video, CDN
- Gestión de progreso y errores
- Coherencia automática de assets

### **🧠 Inteligencia Artificial**

#### **LLM Service (Dispatcher.ts)**
**Propósito**: Sistema de "cerebros cinematográficos"
**Arquitectura**: 
```
dispatcher.ts → Coordina cerebros especializados
├── estilos/cinematic/orquestador.ts    # Videos realistas
├── estilos/anime/orquestador.ts        # Estilo anime
├── estilos/cartoon/orquestador.ts      # Estilo cartoon
├── estilos/commercial/orquestador.ts   # Videos comerciales
├── estilos/narrativa/orquestador.ts    # Documentales
└── estilos/noticias/orquestador.ts     # Presentación directa
```

#### **MarketingIntelligenceService.ts**
**Propósito**: IA especializada en marketing
**Funciones**:
- `generateMarketingTomas()`: Crear estructura comercial
- Adapta contenido según tipo de negocio
- Optimiza para conversión y CTAs

### **🔊 Audio y Voz**

#### **AudioEngine.ts**
**Propósito**: Motor centralizado de audio
**Funciones**:
- `getAdvancedMusic()`: Música por contexto emocional
- `generateSceneAudio()`: Audio por escena
- Integración con Freesound y ElevenLabs
- Fallbacks de audio silencioso

#### **MurfService.ts**
**Propósito**: Síntesis de voz comercial
**Voces Disponibles**:
- Mark (masculino profesional)
- Samantha (femenino energético)  
- David (masculino confiable)
- Lisa (femenino profesional)

#### **VoiceService.ts**
**Propósito**: Servicios de voz unificados
**Funciones**:
- Integración con múltiples proveedores
- Detección automática de idioma
- Cache de audio generado

#### **LipSyncService.ts**
**Propósito**: Sincronización labial
**Tecnologías**: SadTalker, Wav2Lip
**Funciones**:
- `applyLipSyncToPlan()`: Sincronizar audio con video
- Detección facial automática

### **🎞️ Procesamiento de Video**

#### **FFmpegService.ts**
**Propósito**: Montaje y edición de video
**Características**:
- **Audio Ducking Inteligente**: Música se reduce automáticamente durante voz
- Upscaling a 1080p60fps
- Integración de overlays y efectos
- Timeout defensivo (10 min)
- Export múltiples formatos (MP4 + HLS)

#### **AssetManager.ts** 
**Propósito**: Gestión de assets visuales
**Base de Datos**: 45,875+ assets indexados
**Tipos**:
- Fondos por estilo/lugar/ambiente/ángulo
- Actores virtuales con expresiones
- Props y elementos decorativos
- Branding y watermarks

### **☁️ Infraestructura**

#### **CDNService.ts**
**Propósito**: Almacenamiento en Google Cloud
**Funciones**:
- `uploadToCDN()`: Subir archivos con metadatos
- URLs presignadas para seguridad
- Cache y optimización automática

#### **CleanupService.ts**
**Propósito**: Mantenimiento automático
**Funciones**:
- Limpieza de archivos temporales
- Eliminación de proyectos huérfanos
- Optimización de almacenamiento
- Programación automática

### **🔐 Autenticación y Pagos**

#### **AuthService.ts**
**Propósito**: Gestión de autenticación
**Funciones**:
- JWT + RefreshToken system
- Hash de contraseñas con bcryptjs
- Rate limiting de login
- Reset de contraseñas seguro

#### **SubscriptionService.ts**
**Propósito**: Integración PayPal
**Funciones**:
- Crear/cancelar suscripciones
- Procesar webhooks de pago
- Control de límites por plan
- Gestión de ciclos de facturación

#### **PayPalService.ts**
**Propósito**: API PayPal específica
**Funciones**:
- `createSubscription()`: Crear plan
- `cancelSubscription()`: Cancelar
- `verifyWebhook()`: Verificar signatures
- Gestión de estados de pago

---

## 🛣️ **ROUTES** - Endpoints API

### **/api/render** (render.ts)
```javascript
POST /api/render
// Crear video Cinema AI
// Auth: Required | Limits: Plan-based
```

### **/api/marketing** (marketingRoutes.ts)
```javascript
POST /api/marketing/create          // Crear video marketing
POST /api/marketing/agent/activate  // Activar agente
GET /api/marketing/status/:id       // Estado del video
GET /api/marketing/history/:userId  // Historial usuario
```

### **/api/auth** (auth.ts)
```javascript
POST /api/auth/register       // Registro
POST /api/auth/login         // Login  
POST /api/auth/refresh       // Renovar token
POST /api/auth/forgot        // Reset contraseña
```

### **/api/subscriptions** (subscriptionRoutes.ts)
```javascript
POST /api/subscriptions/create     // Crear suscripción
POST /api/subscriptions/cancel     // Cancelar
POST /api/subscriptions/webhook    // Webhook PayPal
GET /api/subscriptions/status      // Estado actual
```

### **/api/templates** (templateRoutes.ts)
```javascript
GET /api/templates                 // Listar plantillas
GET /api/templates/:id            // Plantilla específica
POST /api/templates               // Crear (admin)
PUT /api/templates/:id           // Actualizar (admin)
```

### **/api/editor** (editor.ts)
```javascript
POST /api/editor/project          // Crear proyecto
PUT /api/editor/project/:id      // Guardar estado
POST /api/editor/render/:id      // Renderizar
GET /api/editor/history/:id      // Historial versiones
```

### **/api/admin** (admin.ts)
```javascript
GET /api/admin/users             // Lista usuarios
GET /api/admin/projects          // Todos los proyectos
POST /api/admin/retry/:jobId    // Reintentar job
GET /api/admin/stats            // Estadísticas sistema
```

---

## 🛡️ **MIDDLEWARE** - Seguridad y Validación

### **auth.ts**
**Propósito**: Autenticación JWT
**Funciones**:
- `authenticate()`: Verificar token JWT
- `checkVideoCreationLimits()`: Validar límites por plan
- `requireRole()`: Control de acceso por rol

### **errorHandler.ts**
**Propósito**: Manejo centralizado de errores
**Funciones**:
- `errorHandler()`: Interceptor global
- `notFoundHandler()`: Rutas no encontradas
- Logging estructurado de errores

### **validation.ts**
**Propósito**: Validación de requests
**Funciones**:
- Validación con Zod schemas
- Sanitización de inputs
- Rate limiting inteligente

### **coherenciaMiddleware.ts**
**Propósito**: Mejoras automáticas de coherencia
**Funciones**:
- `coherenciaAutomatica()`: Optimizar assets
- Mantener consistencia visual entre tomas
- Detectar y corregir incoherencias

---

## 🗂️ **MODELS** - Modelos de Datos

### **User.ts**
**Propósito**: Gestión de usuarios
**Campos Principales**:
- Datos personales y autenticación
- Plan de suscripción actual
- Límites de uso y configuraciones
- Relaciones con proyectos y assets

### **Marketing.ts**
**Propósito**: Videos de marketing
**Estructura**:
```typescript
interface IMarketingVideo {
  userId: string;
  title: string;
  businessType: 'restaurant' | 'spa' | 'retail' | 'fitness' | 'beauty' | 'tech' | 'services' | 'other';
  videoType: 'promotional' | 'brand_story' | 'product_showcase' | 'testimonial' | 'event_announcement' | 'social_media';
  style: 'professional' | 'casual' | 'energetic' | 'emotional' | 'luxury' | 'minimalist';
  duration: 15 | 30 | 45 | 60;
  marketingTomas: IMarketingToma[];
  finalVideoUrl?: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  isAgentMode: boolean;
}
```

---

## 📋 **JOBS** - Sistema de Trabajos

### **jobQueue.ts**
**Propósito**: Cola de trabajos asíncronos
**Características**:
- Thread-safe con locks atómicos
- Estados: `pending` → `processing` → `done` / `error`
- Progress tracking por etapas
- Sistema de reintentos automáticos
- Timeout defensivo

**Etapas del Proceso**:
1. Analizando prompt
2. Orquestando cerebros  
3. Generando plan cinematográfico
4. Seleccionando assets
5. Configurando render
6. Procesando video
7. Finalizando

---

## 🔧 **UTILS** - Utilidades

### **logger.ts**
**Propósito**: Sistema de logging
**Características**:
- Logs estructurados JSON
- Niveles: error, warn, info, debug
- Rotación automática de archivos
- Sanitización de datos sensibles

### **errors.ts**
**Propósito**: Clases de error personalizadas
**Tipos**:
- `ValidationError`: Errores de validación
- `UnauthorizedError`: Errores de autenticación
- `ExternalServiceError`: Fallos de servicios externos
- `RateLimitError`: Límites excedidos

### **videoValidator.ts**
**Propósito**: Validaciones específicas de video
**Funciones**:
- Validar formatos soportados
- Verificar duraciones permitidas
- Comprobar límites de tamaño

### **paths.ts**
**Propósito**: Manejo de rutas cross-platform
**Funciones**:
- `toPosix()`: Convertir rutas Windows a Unix
- Resolución segura de paths
- Prevención de directory traversal

---

## 📊 **BASE DE DATOS** - Esquema Prisma

### **Modelos Principales**

#### **User** - Usuarios del sistema
```sql
- id, email, password, name, role, plan
- emailVerified, lastLogin, createdAt, updatedAt
- Relaciones: subscription, usage, profile, videos
```

#### **Subscription** - Suscripciones PayPal
```sql
- userId, plan, status, currentPeriodStart/End
- paypalSubscriptionId, cancelAtPeriodEnd
- Relaciones: user, payments
```

#### **Video** - Videos generados
```sql
- userId, title, type (CINEMA|MARKETING), status
- prompt, visualStyle, duration, finalUrl
- createdAt, completedAt, metadata
```

#### **MarketingConfig** - Perfil de marketing del usuario
```sql
- userId, businessType, targetAudience, brandVoice
- preferredStyles, callToActionTemplates
- agentSettings, weeklyFrequency
```

#### **MarketingTemplate** - Plantillas predefinidas
```sql
- name, description, businessTypes, videoType
- scriptTemplate, duration, style
- isActive, createdBy, version
```

### **Enums Definidos**
```typescript
enum Plan { STARTER, CREATOR, STUDIO_PRO }
enum Role { USER, ADMIN }  
enum VideoType { CINEMA, MARKETING }
enum VideoStatus { PENDING, GENERATING, COMPLETED, FAILED }
enum SubscriptionStatus { PENDING, ACTIVE, CANCELED, EXPIRED }
```

---

## ⚙️ **CONFIGURACIÓN Y DESPLIEGUE**

### **Variables de Entorno**
```bash
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/storyteller"

# Autenticación
JWT_SECRET="tu-jwt-secret-muy-seguro-de-al-menos-32-caracteres"
JWT_REFRESH_SECRET="tu-refresh-secret-diferente-y-seguro"

# APIs de IA
OPENAI_API_KEY="tu-openai-key"
OPENROUTER_API_KEY="tu-openrouter-key"  
FAL_KEY="tu-fal-ai-key"
MURF_API_KEY="tu-murf-key"
ELEVENLABS_API_KEY="tu-elevenlabs-key"
FREESOUND_API_KEY="tu-freesound-key"

# PayPal
PAYPAL_CLIENT_ID="tu-paypal-client-id"
PAYPAL_CLIENT_SECRET="tu-paypal-secret"
PAYPAL_WEBHOOK_ID="tu-webhook-id"
PAYPAL_MODE="sandbox" # o "production"

# Google Cloud Storage  
GCP_PROJECT_ID="tu-proyecto-gcp"
GCP_BUCKET_NAME="storyteller-ai-cdn"
GCP_CREDENTIALS_JSON="./keys/gcp-service-account.json"
CDN_BUCKET_URL="https://storage.googleapis.com/storyteller-ai-cdn"

# Configuración del servidor
PORT=3000
NODE_ENV="development" # o "production"
CORS_ORIGIN="http://localhost:3001" # URL del frontend
```

### **Scripts de Desarrollo**
```bash
# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Desarrollo con recarga automática  
npm run dev

# Producción
npm run prod

# Modo demo (con datos mock)
npm run demo

# Health check
npm run health
```

### **Estructura de Archivos de Configuración**
```
config/
├── nginx.conf          # Configuración Nginx
├── prometheus.yml      # Métricas (opcional)
└── redis.conf         # Redis para cache (opcional)

keys/
└── gcp-service-account.json  # Credenciales GCP

docker-compose.yml      # Docker para desarrollo
docker-compose.dev.yml  # Docker desarrollo completo
Dockerfile             # Imagen de producción
Dockerfile.dev         # Imagen de desarrollo
```

---

## 🚀 **COMANDOS DE DESPLIEGUE**

### **Desarrollo Local**
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/storyteller-backend
cd storyteller-backend

# Instalar dependencias
npm install

# Configurar base de datos
npx prisma migrate dev
npx prisma generate

# Cargar plantillas iniciales
npm run seed:templates

# Iniciar desarrollo
npm run dev
```

### **Producción con Docker**
```bash
# Construir imagen
docker build -t storyteller-backend .

# Ejecutar con compose
docker-compose up -d

# Ver logs
docker-compose logs -f backend
```

### **Despliegue en Cloud**
```bash
# Compilar para producción
npm run build

# Configurar variables de entorno
cp .env.template .env
# Editar .env con valores de producción

# Iniciar servidor
npm run prod
```

---

## 🔍 **FLUJO TÉCNICO DETALLADO**

### **1. Creación de Video Cinema AI**
```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as API
    participant Q as JobQueue  
    participant D as Dispatcher
    participant K as KlingService
    participant A as AudioEngine
    participant F as FFmpegService
    participant C as CDNService

    U->>API: POST /api/render {prompt, style, duration}
    API->>API: Validar límites del plan
    API->>Q: Crear job en cola
    Q->>D: Ejecutar dispatcher
    D->>D: Seleccionar cerebro por estilo
    D->>D: Generar plan cinematográfico
    D->>K: Generar clips por toma
    K-->>D: URLs de video
    D->>A: Generar audio (voz + música + FX)
    A-->>D: Archivos de audio
    D->>F: Montar video final
    F-->>D: Video renderizado
    D->>C: Subir a CDN
    C-->>D: URL pública
    D->>Q: Marcar completado
    Q-->>API: Resultado final
    API-->>U: {success: true, url: "..."}
```

### **2. Gestión de Suscripciones**
```mermaid
sequenceDiagram
    participant U as Usuario
    participant API as Backend
    participant PP as PayPal
    participant WH as Webhook

    U->>API: POST /api/subscriptions/create
    API->>PP: Crear suscripción PayPal
    PP-->>API: {approval_url, subscription_id}
    API-->>U: Redirigir a PayPal
    U->>PP: Aprobar pago
    PP->>WH: BILLING.SUBSCRIPTION.ACTIVATED
    WH->>API: Verificar webhook
    API->>API: Activar plan premium
    API->>API: Actualizar límites usuario
```

---

## 📈 **MÉTRICAS Y MONITOREO**

### **Métricas del Sistema**
- **Videos generados/día**
- **Tiempo promedio de procesamiento**
- **Tasa de éxito vs fallos**
- **Uso de CPU/memoria por job**
- **Almacenamiento utilizado en CDN**

### **Salud de Servicios Externos**
- **Kling AI (fal.ai)**: Latencia y disponibilidad
- **OpenAI**: Límites de rate y tokens  
- **PayPal**: Estado de webhooks
- **Google Cloud Storage**: Latencia de subidas

### **Logs Estructurados**
```json
{
  "timestamp": "2025-08-08T10:30:00Z",
  "level": "info", 
  "service": "KlingService",
  "action": "generateClip",
  "jobId": "job_123",
  "userId": "user_456", 
  "duration": 1847,
  "success": true,
  "metadata": {
    "prompt": "cinematic forest scene",
    "style": "cinematic",
    "aspectRatio": "16:9"
  }
}
```

---

## ⚠️ **PROBLEMAS CONOCIDOS Y LIMITACIONES**

### **Limitaciones Técnicas**
- **Tiempo de procesamiento**: 2-5 minutos por video según duración
- **Concurrencia**: Máximo 10 jobs simultáneos por limitaciones de GPU
- **Almacenamiento**: Videos se mantienen 30 días en CDN
- **Idiomas**: Soporte principal para inglés y español

### **Dependencias Externas**  
- **fal.ai downtime** afecta generación de video
- **PayPal webhooks** pueden tener retrasos
- **Google Cloud Storage** requiere credenciales válidas

### **Mejoras Planificadas**
- **Cache inteligente** de assets frecuentes
- **Compresión automática** de videos por plan
- **API REST completa** para integración externa
- **Dashboard en tiempo real** para administradores

---

## 🤝 **CONTRIBUCIÓN Y DESARROLLO**

### **Estructura de Commits**
```bash
feat: nueva funcionalidad
fix: corrección de bug  
refactor: refactorización de código
docs: actualización de documentación
test: añadir tests
chore: tareas de mantenimiento
```

### **Proceso de Testing**
```bash
# Tests unitarios
npm run test:unit

# Tests de integración  
npm run test:integration

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

---

## 📞 **SOPORTE Y CONTACTO**

- **Documentación técnica**: Ver carpeta `/docs`
- **Logs del sistema**: `./logs/all.log`
- **Errores**: `./logs/error.log`
- **Health check**: `GET /healthz`

---

**¡Storyteller AI - Convierte Ideas en Videos Profesionales! 🎬✨**

*© 2025 Storyteller AI. Todos los derechos reservados.*
