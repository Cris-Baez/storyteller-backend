# CinemaAI MVP - API Documentation

## Descripción General

CinemaAI MVP soporta 4 estilos visuales cinematográficos:
- **Cinematic**: Estilo cinematográfico profesional (30s clips, movimientos dramáticos)
- **Anime**: Estilo anime vibrante (5s clips, emociones exageradas) 
- **Cartoon**: Estilo cartoon familiar (8s clips, colores brillantes)
- **Commercial**: Estilo comercial profesional (6s clips, enfoque en marca)

## Nuevos Endpoints

### Templates Predefinidos

#### GET `/api/templates/estilos`
Listar todos los estilos disponibles.

**Respuesta:**
```json
{
  "estilos": ["cinematic", "anime", "cartoon", "commercial"]
}
```

#### GET `/api/templates/estilos/{estilo}/categorias`
Listar categorías disponibles para un estilo específico.

**Ejemplo:** `/api/templates/estilos/anime/categorias`

**Respuesta:**
```json
{
  "estilo": "anime",
  "categorias": ["batalla", "escuela", "fantasia"]
}
```

#### GET `/api/templates/estilos/{estilo}/{categoria}`
Obtener un template específico.

**Ejemplo:** `/api/templates/estilos/anime/batalla`

**Respuesta:**
```json
{
  "estilo": "anime",
  "categoria": "batalla",
  "template": {
    "title": "Batalla Épica Anime",
    "description": "Combate anime con poderes especiales y efectos dinámicos",
    "prompt": "Una batalla épica al estilo anime con poderes especiales...",
    "duracion": 30,
    "tono": "épico"
  }
}
```

#### GET `/api/templates/buscar?q={termino}`
Buscar templates por término en título, descripción o prompt.

**Ejemplo:** `/api/templates/buscar?q=batalla`

**Respuesta:**
```json
{
  "termino": "batalla",
  "resultados": [
    {
      "estilo": "anime",
      "categoria": "batalla",
      "template": { ... }
    }
  ]
}
```

#### GET `/api/templates/aleatorio?estilo={estilo}`
Obtener un template aleatorio (opcionalmente filtrado por estilo).

**Respuesta:**
```json
{
  "estilo": "cartoon",
  "categoria": "aventura",
  "template": { ... }
}
```

### Seguimiento de Progreso Mejorado

#### GET `/api/render/progress/{jobId}`
Obtener progreso detallado en tiempo real del trabajo.

**Respuesta:**
```json
{
  "status": "processing",
  "currentStep": "Generando clip 2/3",
  "progress": 65,
  "totalSteps": 7,
  "errorMessage": null
}
```

#### GET `/api/render/state/{jobId}`
Obtener estado completo del trabajo con metadata.

**Respuesta:**
```json
{
  "status": "processing",
  "currentStep": "Generando audio de voz",
  "progress": 45,
  "totalSteps": 7,
  "startTime": 1722372000000,
  "metadata": {
    "prompt": "Una aventura épica...",
    "visualStyle": "anime",
    "duration": 30
  }
}
```

## Endpoints Actualizados

### POST `/api/render`
Endpoint principal de renderizado actualizado para soportar todos los estilos.

**Body:**
```json
{
  "prompt": "Una aventura épica en estilo anime",
  "visualStyle": "anime",
  "duration": 30
}
```

**Estilos válidos:** `"cinematic"`, `"anime"`, `"cartoon"`, `"commercial"`

### GET `/api/render/status/{jobId}`
Estado básico del trabajo (actualizado).

**Respuesta:**
```json
{
  "status": "processing"
}
```

## Arquitectura de Cerebros por Estilo

Cada estilo tiene su propio equipo de 6 cerebros especializados:

### Cinematic
- **Director**: Narrativa cinematográfica profesional
- **Arte**: Fondos dramáticos y realistas  
- **Actores**: Casting cinematográfico
- **Fotografía**: Movimientos de cámara profesionales
- **Sonido**: Audio cinematográfico orquestal
- **Editor**: Transiciones profesionales

### Anime  
- **Director**: Narrativa anime con 6 tomas de 5s
- **Arte**: Fondos vibrantes estilo anime japonés
- **Actores**: Personajes anime expresivos
- **Fotografía**: Movimientos dinámicos (quick_zoom, dynamic_pan)
- **Sonido**: J-pop y efectos anime
- **Editor**: Cortes rápidos estilo anime

### Cartoon
- **Director**: Narrativa familiar con 4 tomas de 8s  
- **Arte**: Fondos coloridos estilo cartoon
- **Actores**: Personajes cartoon entrañables
- **Fotografía**: Movimientos suaves (smooth_pan, gentle_zoom)
- **Sonido**: Música alegre y efectos cartoon
- **Editor**: Transiciones suaves y familiares

### Commercial
- **Director**: Narrativa comercial con 5 tomas de 6s
- **Arte**: Fondos profesionales de marca
- **Actores**: Casting comercial profesional  
- **Fotografía**: Movimientos elegantes y profesionales
- **Sonido**: Audio corporativo y profesional
- **Editor**: Cortes profesionales y brand-focused

## Compatibilidad

- ✅ Sistema de assets CDN existente
- ✅ renderPipeline compatible con todos los estilos
- ✅ jobQueue con tracking detallado de progreso
- ✅ Templates predefinidos para cada estilo
- ✅ Validación y normalización de estilos

## Flujo de Uso Típico

1. **Explorar templates:** `GET /api/templates/estilos/anime`
2. **Seleccionar template:** `GET /api/templates/estilos/anime/batalla`  
3. **Iniciar render:** `POST /api/render` con prompt del template
4. **Monitorear progreso:** `GET /api/render/progress/{jobId}`
5. **Obtener resultado:** `GET /api/render/result/{jobId}`

## Notas de Implementación

- Todos los estilos usan la misma interfaz `VideoPlanCinematico`
- El dispatcher enruta automáticamente según el `visualStyle`
- Cada estilo genera clips con duraciones optimizadas
- Sistema de progreso en tiempo real con 7 pasos principales
- Templates incluyen prompts optimizados para cada estilo
