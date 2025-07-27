# 🎬 CinemaAI - Flujo Completo Integrado

## ✅ FLUJO FINAL CORRECTO (Actualizado)

### 📋 **Resumen del Flujo**

```
Usuario → RenderRequest → Sistema de Cerebros → VideoPlan → Distribución de Servicios → Video Final
   ↓           ↓                ↓                ↓              ↓
Prompt     Adaptador       Cerebros         Kling+Murf    FFmpeg Render
                          Cinematic         +Freesound
```

---

## 🔧 **1. ENTRADA: RenderRequest**

```typescript
{
  prompt: "Un samurái camina bajo la lluvia hacia un templo",
  visualStyle: "cinematic",
  duration: 30,
  metadata: { llmModel: "openai/chatgpt-4o-latest" }
}
```

---

## 🧠 **2. SISTEMA DE CEREBROS (Nuevo)**

### **Dispatcher** (`dispatcher.ts`)
- Recibe `RequestGeneracion`
- Selecciona equipo de cerebros por estilo
- Coordina generación segundo a segundo

### **Cerebros Cinematográficos** (`estilos/cinematic/`)
1. **Director** → Narrativa y estructura emocional
2. **Arte** → Selección de fondos por momento narrativo  
3. **Actores** → Casting por emoción + configuración vocal
4. **Fotografía** → Shots cinematográficos profesionales
5. **Sonido** → Audio orquestal + lip-sync estratégico
6. **Editor** → Edición fluida con carryover inteligente
7. **Orquestador** → Coordinación segundo a segundo

### **Adaptador** (`adaptador-cerebros.ts`)
- Convierte formato de cerebros → VideoPlan legacy
- Mantiene compatibilidad con pipeline existente
- Mapea campos específicos para cada servicio

---

## 📤 **3. DISTRIBUCIÓN A SERVICIOS**

### **VideoPlan Unificado**
```typescript
{
  timeline: [
    {
      t: 0,
      segundo: 0,
      visual: "Samurái camina determinado bajo lluvia intensa",
      background: "escenas/templo_noche.jpg",    // → KLING
      character: "actores/samurai_01.png",       // → KLING  
      camera: { shot: "medium", movement: "dolly-in" }, // → KLING
      music: { mood: "orchestral-dark" },        // → FREESOUND
      dialogo: "El honor me guía hacia mi destino", // → MURF
      lipSync: true,                             // → MURF
      transition: "fade-in",                     // → FFMPEG
      carryover: false                           // → FFMPEG
    }
    // ... resto del timeline
  ]
}
```

---

## 🎥 **4. SERVICIOS ESPECIALIZADOS**

### **KlingService** (`klingService.ts`)
**Recibe:** `background`, `character`, `camera`, `lighting`, `visual`
**Genera:** 🎥 Clips de video sin audio
```typescript
{
  prompt: "Samurái camina determinado bajo lluvia intensa",
  input_image_urls: ["templo_noche.jpg", "samurai_01.png"],
  camera: { shot: "medium", movement: "dolly-in" },
  duration: 5,
  aspect_ratio: "16:9"
}
```

### **MurfService** (`voiceService.ts`)  
**Recibe:** `dialogo`, `lipSync`, `characters`
**Genera:** 🎙️ Voz sincronizada con lip-sync
```typescript
{
  text: "El honor me guía hacia mi destino",
  voice: "narrator-male-serious",
  lipSync: true,
  emotion: "determined"
}
```

### **FreesoundService** (`musicService.ts` + `sceneAudioService.ts`)
**Recibe:** `music`, `soundCue`, `atmosphere`
**Genera:** 🔊 Música orquestal + efectos ambientales
```typescript
{
  mood: "orchestral-dark",
  ambient: ["rain", "wind", "temple-bells"],
  duration: 30
}
```

### **FFmpegService** (`ffmpegService.ts`)
**Recibe:** Todo el VideoPlan completo
**Genera:** 🎬 Video final con todo sincronizado
```typescript
{
  clips: [video1.mp4, video2.mp4, ...],
  voiceOver: voice.wav,
  music: [orchestral.mp3],
  sfx: [rain.wav, wind.wav],
  transitions: ["fade-in", "dissolve", "cut"],
  colorGrading: "cinematic-lut",
  resolution: "1920x1080",
  frameRate: 24
}
```

---

## 🔄 **5. PIPELINE INTEGRADO** (`renderPipeline.ts`)

```typescript
export async function renderCinemaAI(req: RenderRequest) {
  // 1. Detectar si usar sistema de cerebros
  const usarCerebros = req.visualStyle === 'cinematic';
  
  if (usarCerebros) {
    // 2. Sistema de cerebros → VideoPlan
    videoPlan = await adaptarCerebrosAVideoPlan(req);
  } else {
    // 2. Sistema legacy → VideoPlan  
    videoPlan = await createVideoPlan(req);
  }
  
  // 3. Distribución paralela a servicios
  const [clips, voiceBuffer, musicBuffer, sfxBuffer] = await Promise.all([
    // Kling: Generar clips visuales
    videoPlan.timeline.map(scene => generateKlingClip({
      prompt: scene.visual,
      input_image_urls: [scene.background, scene.character],
      camera: scene.camera
    })),
    
    // Murf: Generar voces  
    createVoiceOver(videoPlan),
    
    // Freesound: Música y efectos
    getAdvancedMusic({ style: videoPlan.metadata.visualStyle }),
    getSfx(videoPlan.timeline[0]?.soundCue)
  ]);
  
  // 4. FFmpeg: Ensamblar todo
  const finalUrl = await assembleVideo({
    plan: videoPlan,
    clips,
    voiceOver: voiceBuffer,
    music: [musicBuffer], 
    sfx: [sfxBuffer]
  });
  
  // 5. CDN y respuesta
  const cdnUrl = await uploadToCDN(finalUrl);
  return { url: cdnUrl, plan: videoPlan };
}
```

---

## 📊 **6. COMPATIBILIDAD Y MIGRACIÓN**

### **Estilos Soportados**
- ✅ **Cinematic**: Sistema de cerebros completo
- 🔄 **Anime**: Fallback a sistema legacy (próximamente cerebros)
- 🔄 **Cartoon**: Fallback a sistema legacy (próximamente cerebros)
- 🔄 **Commercial**: Fallback a sistema legacy (próximamente cerebros)

### **Backward Compatibility**
- Mantiene todos los endpoints existentes
- `TimelineSecond` unificado (campo `t` + `segundo`)
- Servicios existentes funcionan sin cambios
- Gradual migración por estilo visual

### **Monitoreo y Debug**
- Logs detallados en cada etapa
- `debugAdaptador()` para análisis de VideoPlan
- Métricas de calidad automáticas
- Fallbacks robustos en caso de error

---

## 🎯 **7. VENTAJAS DEL NUEVO FLUJO**

### **Profesionalidad**
- ✅ Cerebros especializados por rol cinematográfico
- ✅ Narrativa estructurada en 3 actos
- ✅ Momentos emocionales estratégicos
- ✅ Configuración técnica cinematográfica (24 FPS, color grading)

### **Escalabilidad**
- ✅ Fácil agregar nuevos estilos (anime, cartoon, commercial)
- ✅ Cerebros independientes y reutilizables
- ✅ Pipeline modular y testeable

### **Calidad**
- ✅ Lip-sync estratégico (máximo 3-4 por video)
- ✅ Música orquestal progresiva
- ✅ Transiciones cinematográficas fluidas
- ✅ Assets validados automáticamente

---

## 🚀 **8. PRÓXIMOS PASOS**

1. **Completar otros estilos**: Implementar cerebros para anime, cartoon, commercial
2. **Optimizaciones**: Cache de decisiones LLM, paralelización
3. **Métricas**: A/B testing entre cerebros y sistema legacy
4. **Post-producción**: Cerebro de VFX y color grading avanzado

---

## 🔧 **9. TESTING**

```bash
# Probar flujo completo
npx tsx src/tests/test-flujo-completo.ts

# Probar solo cerebros
npx tsx src/services/llmService/test-cerebros.ts

# Probar adaptador
npx tsx src/services/llmService/ejemplo-integracion.ts
```

---

**✅ FLUJO FINAL CONFIRMADO: User → Cerebros → Kling+Murf+Freesound → FFmpeg → Video** 🎬
