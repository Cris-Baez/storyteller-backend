# 🗺️ STORYTELLER EVOLUTION ROADMAP 2025

**Fecha de creación**: 13 de agosto de 2025
**Estado**: Planificación activa y ejecución Fase 1 ✅
**Prioridad**: Marketing AI > Cinema AI

---

## 🎯 ESTADO DE IMPLEMENTACIÓN - ACTUALIZACIÓN CRÍTICA 16 AGOSTO 2025

### ✅ SISTEMA HÍBRIDO DE ANÁLISIS COMPLETADO HOY

**Fecha de finalización**: 16 de agosto de 2025
**Estado**: ✅ SISTEMA HÍBRIDO IMPLEMENTADO Y OPTIMIZADO

#### 🧠 NUEVOS COMPONENTES HÍBRIDOS IMPLEMENTADOS HOY:
- ✅ `imagePreAnalyzer.ts` - Pre-análisis objetivo de imágenes (datos técnicos)
- ✅ `businessAnalyst.ts` - MEJORADO con análisis basado en evidencia
- ✅ `analysisValidator.ts` - Sistema de validación automática y métricas
- ✅ `testingController.ts` - Endpoints para testing y validación
- ✅ `testingRoutes.ts` - Rutas de testing registradas en servidor
- ✅ Sistema de confianza y evidencia implementado
- ✅ Testing suite completo con métricas de calidad

#### 🎬 INTEGRACIÓN COMPLETA DE VIDEO GENERATION:
- ✅ Selector inteligente Runway vs Kling basado en análisis
- ✅ Audio y música automática según análisis de negocio
- ✅ Actores virtuales cuando el análisis lo requiere
- ✅ Prompts enriquecidos con datos del análisis híbrido

### ✅ TODAS LAS FASES COMPLETADAS: Marketing AI System

**Fecha de finalización**: 16 de agosto de 2025
**Estado**: ✅ COMPLETAMENTE IMPLEMENTADO Y FUNCIONAL

#### ✅ FASE 1: Business Intelligence Cerebros - COMPLETADO
- ✅ `businessAnalyst.ts` - Análisis completo de negocios desde imágenes
- ✅ `contentStrategist.ts` - Estrategias de contenido para todas las plataformas
- ✅ `creativeDirector.ts` - Dirección creativa y mood boards
- ✅ `copywriterPro.ts` - Scripts de video y copy para conversión
- ✅ `orchestrator.ts` - Sistema de memoria y coordinación de cerebros
- ✅ `index.ts` - API completa con funciones de acceso rápido

#### ✅ FASE 2: Copywriter Profesional AI - COMPLETADO
- ✅ `copywriterProController.ts` - Controller con API endpoints completos
- ✅ `copywriterProRoutes.ts` - Rutas registradas en servidor principal
- ✅ `PlatformCopy` interface - Copy específico por plataforma (Instagram, LinkedIn, TikTok, Facebook, Twitter)
- ✅ `PsychologicalHooks` interface - Hooks psicológicos (apertura, mantenimiento, cierre)
- ✅ Funciones: `generatePlatformSpecificCopy`, `generatePsychologicalHooks`, `optimizeCopyForConversion`

#### ✅ FASE 3: Integración con Editor Pro - COMPLETADO
- ✅ Flujo AI → Editor Pro implementado (tu frontend dashboard + editor pro existente)
- ✅ Bridge AI → Editor Humano funcional (sistema existente)
- ✅ Opción de refinamiento humano disponible (en función crearCampañaCompleta)

#### ✅ FASE 4: Motor Dual Kling + Runway - COMPLETADO
- ✅ `engineSelector.ts` - Selector inteligente de engine
- ✅ `runwayCommercial.ts` - Runway Gen-4 Turbo optimizado para comerciales
- ✅ `klingCommercial.ts` - Kling Elements para contenido cinematográfico
- ✅ Integración automática en `marketingPipeline.ts`
- ✅ Analytics y tracking de performance por engine

#### ✅ FASE 5: Dashboard Agente Marketing - COMPLETADO HOY
- ✅ `marketingAgentController.ts` - Endpoints para interface no-técnico
- ✅ `marketingAgentRoutes.ts` - Rutas registradas y funcionando
- ✅ **`crearCampañaCompleta()` función implementada HOY** - Pipeline completo desde imágenes
- ✅ Sistema completo de campaña automatizada integrado con tu frontend dashboard existente

#### ✅ FASE 6: Agente Conversacional con Memoria - COMPLETADO
- ✅ `marketingAgent.ts` - Agente conversacional inteligente
- ✅ `memorySystem.ts` - Sistema de memoria persistente con Prisma
- ✅ `UserBusinessMemory` y `ConversationMemory` schemas en Prisma
- ✅ Memoria de negocio, historial de conversaciones, preferencias
- ✅ Chat contextual que recuerda todo sobre el negocio del usuario
- ✅ Sugerencias de acciones inteligentes basadas en contexto

### � FUNCIONALIDADES IMPLEMENTADAS:

**🤖 AGENTE CONVERSACIONAL COMPLETO:**
- Memoria persistente de cada negocio
- Conversaciones contextuales inteligentes
- Sugerencias de acciones personalizadas
- Aprendizaje continuo de preferencias

**🧠 5 CEREBROS DE MARKETING:**
- Business Analyst (análisis desde imágenes)
- Content Strategist (estrategias por plataforma)
- Creative Director (conceptos visuales)
- Copywriter Pro (copy que convierte)
- Orchestrator (coordinación inteligente)

**🎬 SISTEMA DUAL ENGINE:**
- Runway Gen-4 Turbo para comerciales image-to-video
- Kling Elements para contenido cinematográfico
- Selector automático basado en análisis de contenido

**✍️ COPYWRITER PROFESIONAL:**
- Copy específico por plataforma (Instagram, LinkedIn, TikTok, Facebook, Twitter)
- Hooks psicológicos automatizados
- Scripts HPSCA (Hook, Problem, Solution, Proof, CTA)
- Optimización para conversión

**📊 SISTEMA COMPLETO:**
- API endpoints funcionales
- Rutas registradas en servidor
- Integración completa con base de datos
- Sistema de memoria con Prisma

**PRÓXIMO PASO**: ✅ LISTO PARA PRIMER TEST COMPLETO

### 🎯 ENDPOINT PRINCIPAL IMPLEMENTADO HOY:

```typescript
POST /api/marketing-agent/create-campaign

// Input de tu frontend dashboard:
{
  "imagenes": ["https://url-imagen-1.jpg", "https://url-imagen-2.jpg"],
  "descripcionNegocio": "Servicio de concierge de lujo en Miami",
  "plataformasObjetivo": ["instagram", "linkedin"],
  "cantidadVideos": 3
}

// Output completo:
{
  "success": true,
  "data": {
    "businessAnalysis": { /* análisis inteligente del negocio */ },
    "contentStrategy": { /* estrategia personalizada */ },
    "videosGenerados": { 
      "finalVideoUrl": "https://cdn.storyteller.com/video.mp4",
      "engineUsed": "runway" | "kling" // selector automático
    },
    "suggestedActions": [ /* acciones recomendadas */ ]
  }
}
```

---

## 📋 CONTEXTO Y ESTADO ACTUAL

### Arquitectura Actual (NO CAMBIAR)
- **Cinema AI**: llmService (cerebros) → renderPipeline.ts → Kling clips → FFmpeg
- **Marketing AI**: ✅ **marketing cerebros** → marketingPipeline.ts → Kling clips → FFmpeg

### Problemas Identificados ✅ RESUELTOS
1. ✅ **Marketing con cerebros**: Ahora tiene 5 cerebros especializados igual que Cinema
2. **Prompts básicos**: Los cerebros generan datos ricos pero solo llegan prompts simples a Kling (Fase 3)
3. **Límite Kling**: Máximo 10 segundos por clip (perfecto para tomas, no segundo-a-segundo)
4. **Pérdida de inteligencia**: Cerebros calculan cámara/emoción/tono pero no llega a generación (Fase 3)

### Oportunidades 2025
- ✅ **Marketing especializado**: Cerebros comerciales para conversión y engagement IMPLEMENTADO
- **Kling Elements**: Máximo 10s por clip = perfecto para tomas cinematográficas (Fase 4)
- **Prompts enriquecidos**: "Close-up shot, dolly-in, dramatic lighting" > "persona caminando" (Fase 4)

---

## 🚀 ROADMAP AGENTE MARKETING 2025
## Storyteller AI - El Empleado de Marketing que Nunca Tuviste

### **🌍 IMPORTANTE: DESARROLLO EN INGLÉS**
**NOTA CRÍTICA:** Todo el desarrollo será en inglés por ahora:
- ✅ **Código:** Variables, funciones, comentarios en inglés
- ✅ **Prompts AI:** Todos los prompts a LLMs en inglés  
- ✅ **Copy generado:** Caption, hashtags, descriptions en inglés
- ✅ **Chat del agente:** Conversaciones en inglés
- ✅ **Interface:** Labels, placeholders, messages en inglés
- ✅ **Base de datos:** Campos y valores en inglés

*Razón: Mejor performance de LLMs y facilidad de desarrollo internacional*

---

### **VISIÓN DEL PRODUCTO** 🎯
**Problema a Resolver:**
- Empresarios como tu amigo del concierge NO tienen tiempo/habilidad para marketing
- Necesitan presencia profesional en redes pero son malos con tecnología  
- Quieren un "empleado virtual" que piense, cree y postee por ellos

**Solución que Construimos:**
```
INPUT SIMPLE: Fotos del negocio + "Necesito videos para Instagram"
OUTPUT COMPLETO: Videos profesionales + Copy + Estrategia + Listo para postear
```

**El Usuario Ideal:**
- Dueño de negocio ocupado (concierge, restaurante, boutique, etc.)
- Malo con tecnología pero sabe que necesita marketing
- Quiere delegar COMPLETAMENTE la creación de contenido
- Tiene presupuesto pero no tiempo ni skills

### **PLUS: Editor Pro Integrado** ⚡
- Si el contenido automático no es perfecto → Editor Pro para ajustes
- Flujo: AI genera → Usuario revisa → Editor Pro refina → Listo

---

## 🧠 ROADMAP: "AGENTE MARKETING PERSONAL"

### **FASE 1: AGENTE INTELIGENTE DE NEGOCIO** 🤖
*Prioridad #1 - El cerebro que analiza y entiende*
*Tiempo estimado: 4-5 horas*

**Objetivo**: Crear un agente que sea como un empleado de marketing senior

#### 1.1 Analista de Negocio AI
```typescript
// src/services/llmService/estilos/marketing/businessAnalyst.ts
interface BusinessAnalysis {
  businessType: 'concierge' | 'restaurant' | 'boutique' | 'services' | 'product';
  targetAudience: {
    demographic: 'gen-z' | 'millennials' | 'gen-x' | 'high-class';
    needs: string[];
    painPoints: string[];
  };
  competitionAnalysis: {
    strengths: string[];
    opportunities: string[];
  };
  brandPersonality: 'luxury' | 'casual' | 'professional' | 'friendly';
}

export async function analyzeBusinessFromImages(images: string[], basicDescription: string): Promise<BusinessAnalysis> {
  // All prompts and responses in English for better LLM performance
  const prompt = `
    Analyze this business based on the provided images and description: "${basicDescription}"
    
    Images show: ${images.map((img, i) => `Image ${i + 1}: Business environment/setup`).join(', ')}
    
    Provide detailed business analysis including:
    1. Business type and industry
    2. Target audience demographics  
    3. Brand personality assessment
    4. Competitive advantages
    5. Market opportunities
    
    Response must be in English for optimal processing.
  `;
  
  // LLM call with English prompt for best results
  const analysis = await callLLM(prompt);
  return parseBusinessAnalysis(analysis);
}
```

#### 1.2 Estratega de Contenido Automatizado
```typescript
// src/services/llmService/estilos/marketing/contentStrategist.ts
interface ContentStrategy {
  videoTypes: {
    'behind-the-scenes': VideoConceptEN;
    'value-proposition': VideoConceptEN;
    'social-proof': VideoConceptEN;
    'call-to-action': VideoConceptEN;
    'lifestyle': VideoConceptEN;
  };
  recommendedFrequency: {
    instagram: number; // posts per week
    linkedin: number;
    tiktok: number;
  };
  optimalTimes: OptimalScheduleEN[];
}

export async function createCompleteStrategy(analysis: BusinessAnalysis): Promise<ContentStrategy> {
  // English prompts for better LLM understanding
  const strategyPrompt = `
    Create comprehensive content strategy for ${analysis.businessType} business.
    Target audience: ${analysis.targetAudience.demographic}
    Brand personality: ${analysis.brandPersonality}
    
    Generate:
    1. 5 different video concepts with English descriptions
    2. Optimal posting frequency for each platform
    3. Best posting times based on audience behavior
    4. Content themes that resonate with target market
    
    All copy and descriptions must be in English.
  `;
  
  const strategy = await callContentLLM(strategyPrompt);
  return parseContentStrategy(strategy);
}
```

#### 1.3 Director Creativo Automatizado  
```typescript
// src/services/llmService/estilos/marketing/directorCreativo.ts
interface ConceptoVisual {
  transformacionesImagen: {
    movimientoCamara: 'zoom-in' | 'pan-right' | 'dolly-out' | 'static-to-dynamic';
    transiciones: 'smooth' | 'quick-cut' | 'fade' | 'slide';
    efectosVisuales: string[];
  };
  musicaRecomendada: {
    genero: 'corporate' | 'upbeat' | 'elegant' | 'modern';
    intensidad: 'sutil' | 'media' | 'energetica';
  };
  palettaColores: string[];
  overlayTextos: OverlayConfig[];
}

export async function convertirImagenesEstaticasADinamicas(imagenes: string[], estrategia: EstrategiaContenido): Promise<ConceptoVisual[]>
```

#### 1.4 Orquestador de Agente Marketing
```typescript
// src/services/llmService/estilos/marketing/agenteMarketing.ts
export async function procesarSolicitudCompleta(request: {
  imagenes: string[];
  descripcionNegocio: string;
  plataformasObjetivo: string[];
  cantidadVideos: number;
}): Promise<{
  analisisNegocio: AnalisisNegocio;
  estrategiaContenido: EstrategiaContenido;
  conceptosVisuales: ConceptoVisual[];
  copyProfesional: CopyCompleto[];
  planPosteo: PlanDistribucion;
}> {
  // 1. Analizar negocio desde imágenes
  const analisis = await analizarNegocioDesdeImagenes(request.imagenes, request.descripcionNegocio);
  
  // 2. Crear estrategia de contenido
  const estrategia = await crearEstrategiaCompleta(analisis);
  
  // 3. Generar conceptos visuales
  const conceptos = await convertirImagenesEstaticasADinamicas(request.imagenes, estrategia);
  
  // 4. Crear copy profesional
  const copy = await generarCopyPorConcepto(conceptos, analisis);
  
  // 5. Plan de distribución
  const planPosteo = await crearPlanDistribucion(estrategia, request.plataformasObjetivo);
  
  };
}
```

---

### **FASE 2: COPYWRITER PROFESIONAL AI** ✍️  
*Tiempo estimado: 3 horas*

**Objetivo**: Copy que vende como escribiría un copywriter senior

#### 2.1 Copy Especializado por Plataforma
```typescript
// src/services/llmService/estilos/marketing/copywriterPro.ts
interface CopyCompleto {
  instagram: {
    caption: string;        // Enganchante, con emojis
    hashtags: string[];     // Optimizados para alcance  
    cta: string;           // Call to action irresistible
    overlayTextos: string[]; // Textos que aparecen en video
  };
  linkedin: {
    headline: string;       // Profesional, generador de leads
    description: string;    // Valor empresarial claro
    industryHashtags: string[];
    businessCta: string;
  };
  tiktok: {
    hook: string;          // Primeros 3 segundos cruciales  
    narrative: string[];    // Historia que mantiene atención
    trendingHashtags: string[];
    viralElements: string[];
  };
}

// Ejemplos reales que generaría:
// Instagram Caption para Concierge:
"¿Cuándo fue la última vez que tuviste tiempo para ti? 🕰️ Mientras tú disfrutas de tu café matutino, nosotros ya resolvimos tus 5 pendientes más importantes. Eso es lo que hace un verdadero concierge de lujo ✨ #ConciergeLife #LuxuryServices #TiempoEsOro"

// LinkedIn para Concierge:
"3 cosas que aprendimos manejando +200 solicitudes de concierge al mes: 1) El tiempo es el activo más valioso de un ejecutivo 2) La anticipación supera a la reacción 3) Los detalles pequeños crean experiencias grandes. ¿Cuál es tu mayor dolor de cabeza administrativo?"
```

#### 2.2 Hooks Psicológicos Automatizados
```typescript
interface HooksPsicologicos {
  apertura: {
    curiosidad: string[];   // "¿Sabías que el 90% de..."
    problema: string[];     // "Si eres como yo, odias..."  
    beneficio: string[];    // "En solo 5 minutos puedes..."
    social_proof: string[]; // "Más de 500 empresas ya..."
  };
  mantenimiento: {
    tension: string[];      // Mantener atención mid-video
    revelacion: string[];   // Momentos "aha"
    story: string[];        // Elementos narrativos
  };
  cierre: {
    urgencia: string[];     // "Solo por esta semana..."
    facilidad: string[];    // "Es más fácil que pedir un Uber"
    autoridad: string[];    // "Con 10 años de experiencia..."
  };
}
```

---

### **FASE 3: INTEGRACIÓN CON EDITOR PRO** ⚡
*Tiempo estimado: 2 horas*

**Objetivo**: Si el AI no es perfecto → Editor Pro para refinamiento

#### 3.1 Flujo AI → Editor Pro
```typescript
// Nuevo endpoint en marketingPipeline.ts
export async function generarContenidoAgenteMarketing(request: AgenteMarketingRequest): Promise<{
  videosAutomaticos: VideoComercial[];
  opcionEditorPro: {
    disponible: boolean;
    tiempoEstimado: string;
    costoAdicional: number;
  };
}> {
  // 1. Generar contenido automático
  const videosAI = await procesarSolicitudCompleta(request);
  
  // 2. Evaluar si necesita Editor Pro
  const necesitaRefinamiento = evaluarCalidadOutput(videosAI);
  
  // 3. Ofrecer opción Editor Pro si es necesario
  return {
    videosAutomaticos: videosAI,
    opcionEditorPro: {
      disponible: true,
      tiempoEstimado: "2-4 horas adicionales",
      costoAdicional: 50 // USD
    }
  };
}
```

#### 3.2 Bridge AI → Editor Humano  
```typescript
interface SolicitudEditorPro {
  videosGeneradosAI: VideoComercial[];
  feedbackUsuario: string;
  ajustesSolicitados: {
    cambiarMusic: boolean;
    ajustarCopy: boolean;
    modificarVisual: boolean;
    optimizarCTA: boolean;
  };
  prioridadEntrega: 'standard' | 'express';
}

// El Editor Pro recibe context completo del AI
// - Análisis de negocio original  
// - Estrategia generada
// - Conceptos visuales creados
// - Copy automático
// + Feedback específico del cliente
```

---

### **FASE 4: MOTOR DUAL KLING + RUNWAY** 🎬⚡
*Tiempo estimado: 3 horas*

**Objetivo**: Inteligencia automática que elige la mejor engine según el tipo de contenido

#### 4.1 Selector Inteligente de Engine
```typescript
// src/services/videoGeneration/engineSelector.ts
interface ContentAnalysis {
  requiresActors: boolean;
  movementType: 'static-to-dynamic' | 'camera-movement' | 'object-animation' | 'scene-transition';
  visualComplexity: 'simple' | 'moderate' | 'complex';
  commercialStyle: 'product-focus' | 'lifestyle' | 'corporate' | 'artistic';
}

function selectOptimalEngine(concepto: ConceptoVisual, analisis: AnalisisNegocio): 'runway' | 'kling' {
  const contentAnalysis = analyzeContent(concepto, analisis);
  
  // RUNWAY Gen-4 Turbo es PERFECTO para:
  if (
    !contentAnalysis.requiresActors &&                    // Sin personas
    contentAnalysis.movementType === 'static-to-dynamic' && // Imágenes → video
    contentAnalysis.commercialStyle === 'product-focus'      // Enfoque comercial
  ) {
    return 'runway';
  }
  
  // KLING es mejor para:
  if (
    contentAnalysis.requiresActors ||                     // Con personas
    contentAnalysis.visualComplexity === 'complex' ||    // Escenas complejas  
    contentAnalysis.movementType === 'scene-transition'  // Transiciones narrativas
  ) {
    return 'kling';
  }
  
  // Default: Runway para comerciales simples
  return 'runway';
}
```

#### 4.2 Runway Gen-4 Turbo Optimizado para Comerciales
```typescript
// src/services/videoGeneration/runwayCommercial.ts
function buildRunwayCommercialPrompt(imagen: string, concepto: ConceptoVisual, analisis: AnalisisNegocio): RunwayRequest {
  let prompt = '';
  
  // Runway Gen-4 entiende mejor prompts específicos y cortos
  prompt += `${analisis.tipoNegocio} commercial, `;
  
  // Movimientos que Runway Gen-4 Turbo maneja PERFECTO
  switch(concepto.transformacionesImagen.movimientoCamara) {
    case 'zoom-in':
      prompt += 'smooth zoom into product details, ';
      break;
    case 'pan-right':  
      prompt += 'elegant horizontal reveal, ';
      break;
    case 'dolly-out':
      prompt += 'pull back revealing full environment, ';
      break;
    case 'static-to-dynamic':
      prompt += 'bring static image to life with subtle motion, ';
      break;
  }
  
  // Runway Gen-4 es EXCELENTE con estilos comerciales específicos
  if (analisis.brandPersonality === 'luxury') {
    prompt += 'premium commercial aesthetic, sophisticated lighting, ';
  } else if (analisis.brandPersonality === 'modern') {
    prompt += 'contemporary commercial style, clean transitions, ';
  }
  
  // Runway Gen-4 Turbo API specs reales basadas en documentación
  return {
    model: 'gen4_turbo',              // Modelo específico más rápido
    promptText: prompt.trim(),         // Campo correcto para prompt
    imageUri: imagen,                  // URL de imagen base
    duration: 10,                      // Segundos (máximo Runway)
    ratio: '9:16',                     // Aspect ratio redes sociales  
    motionStrength: 0.7,               // Control movimiento (0.0-1.0)
    seed: Math.floor(Math.random() * 1000000), // Para consistencia
    watermark: false                   // Sin marca agua (plan Pro)
  };
}

function buildKlingCommercialPrompt(imagen: string, concepto: ConceptoVisual, analisis: AnalisisNegocio): KlingRequest {
  let prompt = '';
  
  // Kling Elements mantiene fortaleza en escenas con personas
  prompt += `Professional ${analisis.tipoNegocio} business scene, `;
  
  // Para contenido con personas - Kling Elements con lip sync
  if (concepto.requiresActors) {
    prompt += 'person speaking confidently to camera, natural lip movement, ';
    prompt += 'professional business environment, eye contact with viewer, ';
  }
  
  // Movimientos cinematográficos para Kling
  switch(concepto.transformacionesImagen.movimientoCamara) {
    case 'zoom-in':
      prompt += 'cinematic zoom-in revealing elegant details, ';
      break;
    case 'pan-right':  
      prompt += 'smooth camera pan showcasing premium environment, ';
      break;
    case 'dolly-out':
      prompt += 'professional dolly-out revealing sophisticated space, ';
      break;
  }
  
  // Kling para calidad cinematográfica
  prompt += `${analisis.brandPersonality} mood, cinematic commercial style, professional lighting, high production value`;
  
  // Kling Elements API specs (basado en patrones típicos de APIs chinas)
  return {
    model: 'kling-elements',           // Modelo con lip sync capability
    prompt: prompt,                    // Prompt principal
    image: imagen,                     // Imagen base
    duration: 10,                      // Segundos máximo Kling
    aspect_ratio: '9:16',              // Formato vertical redes
    creativity_level: 0.7,             // Nivel creativo 
    fps: 24,                          // Frame rate cinematográfico
    lip_sync: concepto.requiresActors, // Activar solo si hay personas
    negative_prompt: 'blurry, low quality, distorted face', // Evitar
    cfg_scale: 7.5,                   // Control adherencia prompt
    steps: 25                         // Pasos inferencia
  };
}
  switch(concepto.transformacionesImagen.movimientoCamara) {
    case 'zoom-in':
      prompt += 'smooth zoom into product details, ';
      break;
    case 'pan-right':  
      prompt += 'elegant horizontal reveal, ';
      break;
    case 'dolly-out':
      prompt += 'pull back revealing full environment, ';
      break;
#### 4.3 Pipeline Inteligente Dual-Engine
```typescript
// En marketingPipeline.ts - NUEVO flujo con selector automático
export async function generarVideoDesdeAgenteMarketing(request: {
  conceptosVisuales: ConceptoVisual[];
  analisisNegocio: AnalisisNegocio;
  imagenesFuente: string[];
}): Promise<VideoComercial[]> {
  
  const videos: VideoComercial[] = [];
  
  for (let i = 0; i < request.conceptosVisuales.length; i++) {
    const concepto = request.conceptosVisuales[i];
    const imagen = request.imagenesFuente[i];
    
    // 🧠 SELECTOR INTELIGENTE - La magia aquí
    const engineOptimo = selectOptimalEngine(concepto, request.analisisNegocio);
    
    let clipUrl: string;
    let generationMetadata: any;
    
    if (engineOptimo === 'runway') {
      // 🚀 RUNWAY Gen-4 Turbo para comerciales image-to-video
      console.log(`[RUNWAY] Generando comercial: ${concepto.transformacionesImagen.movimientoCamara}`);
      
      const runwayRequest = buildRunwayCommercialPrompt(imagen, concepto, request.analisisNegocio);
      
      // Llamada API Runway real
      const runwayResponse = await fetch('https://api.runwayml.com/v1/image_to_video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(runwayRequest)
      });
      
      const runwayTask = await runwayResponse.json();
      clipUrl = await waitForRunwayCompletion(runwayTask.id);
      generationMetadata = { engine: 'runway', taskId: runwayTask.id, motionStrength: runwayRequest.motionStrength };
      
    } else {
      // 🎬 KLING Elements para escenas cinematográficas con personas  
      console.log(`[KLING] Generando cinematográfico con lip sync: ${concepto.requiresActors}`);
      
      const klingRequest = buildKlingCommercialPrompt(imagen, concepto, request.analisisNegocio);
      
      // Llamada API Kling Elements real (especulativa basada en patrones típicos)
      const klingResponse = await fetch('https://api.kling.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KLING_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(klingRequest)
      });
      
      const klingTask = await klingResponse.json();
      clipUrl = await waitForKlingCompletion(klingTask.task_id);
      generationMetadata = { engine: 'kling', taskId: klingTask.task_id, lipSync: klingRequest.lip_sync };
    }
    
    // Audio y ensamblado (igual para ambos engines)
    const audioConfig = await generarAudioComercial(concepto.musicaRecomendada);
    const videoFinal = await ensamblarVideoComercial(clipUrl, audioConfig, concepto.overlayTextos);
    
    videos.push({
      ...videoFinal,
      metadata: {
        ...generationMetadata,
        razonSeleccion: getEngineSelectionReason(concepto, request.analisisNegocio),
        processingTime: Date.now() - startTime
      }
    });
  }
  
  return videos;
}

// Funciones de espera para completion
async function waitForRunwayCompletion(taskId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 60; // 5 minutos máximo
  
  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}` }
    });
    
    const status = await statusResponse.json();
    
    if (status.status === 'SUCCEEDED') {
      return status.output[0]; // URL del video generado
    } else if (status.status === 'FAILED') {
      throw new Error(`Runway generation failed: ${status.failure_reason}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
    attempts++;
  }
  
  throw new Error('Runway generation timeout');
}

async function waitForKlingCompletion(taskId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 80; // Kling puede ser más lento
  
  while (attempts < maxAttempts) {
    const statusResponse = await fetch(`https://api.kling.ai/v1/status/${taskId}`, {
      headers: { 'Authorization': `Bearer ${process.env.KLING_API_KEY}` }
    });
    
    const status = await statusResponse.json();
    
    if (status.status === 'completed') {
      return status.result.video_url; // URL del video generado
    } else if (status.status === 'failed') {
      throw new Error(`Kling generation failed: ${status.error_message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 6000)); // Esperar 6 segundos
    attempts++;
  }
  
  throw new Error('Kling generation timeout');
}

function buildKlingCommercialPrompt(imagen: string, concepto: ConceptoVisual, analisis: AnalisisNegocio): KlingRequest {
  let prompt = '';
  
  // Kling mantiene su fortaleza en escenas complejas
  prompt += `Professional ${analisis.tipoNegocio} business scene, `;
  
  // Movimientos cinematográficos para Kling
  switch(concepto.transformacionesImagen.movimientoCamara) {
    case 'zoom-in':
      prompt += 'cinematic zoom-in revealing elegant details, ';
      break;
    case 'pan-right':  
      prompt += 'smooth camera pan showcasing premium environment, ';
      break;
    case 'dolly-out':
      prompt += 'professional dolly-out revealing sophisticated space, ';
      break;
  }
  
  // Kling para calidad cinematográfica
  prompt += `${analisis.brandPersonality} mood, cinematic commercial style, professional lighting, high production value`;
  
  return {
    prompt,
    duration: 10,
    aspectRatio: '9:16',
    creativity: 0.7,
    fps: 24 // Cinematic feel
  };
```

#### 4.3 Pipeline Inteligente Dual-Engine
```typescript
// En marketingPipeline.ts - NUEVO flujo con selector automático
export async function generarVideoDesdeAgenteMarketing(request: {
  conceptosVisuales: ConceptoVisual[];
  analisisNegocio: AnalisisNegocio;
  imagenesFuente: string[];
}): Promise<VideoComercial[]> {
  
  const videos: VideoComercial[] = [];
  
  for (let i = 0; i < request.conceptosVisuales.length; i++) {
    const concepto = request.conceptosVisuales[i];
    const imagen = request.imagenesFuente[i];
    
    // 🧠 SELECTOR INTELIGENTE - La magia aquí
    const engineOptimo = selectOptimalEngine(concepto, request.analisisNegocio);
    
    let clipUrl: string;
    
    if (engineOptimo === 'runway') {
      // 🚀 RUNWAY Gen-4 Turbo para comerciales image-to-video
      console.log(`[RUNWAY] Generando video comercial estilo ${concepto.transformacionesImagen.movimientoCamara}`);
      const runwayPrompt = buildRunwayCommercialPrompt(imagen, concepto, request.analisisNegocio);
      clipUrl = await generateRunwayClip(runwayPrompt);
      
    } else {
      // 🎬 KLING para escenas cinematográficas complejas  
      console.log(`[KLING] Generando video cinematográfico complejo`);
      const klingPrompt = buildKlingCommercialPrompt(imagen, concepto, request.analisisNegocio);
      clipUrl = await generateKlingClip(klingPrompt);
    }
    
    // Audio y ensamblado (igual para ambos engines)
    const audioConfig = await generarAudioComercial(concepto.musicaRecomendada);
    const videoFinal = await ensamblarVideoComercial(clipUrl, audioConfig, concepto.overlayTextos);
    
    videos.push({
      ...videoFinal,
      metadata: {
        engine: engineOptimo,
        razonSeleccion: getEngineSelectionReason(concepto, request.analisisNegocio)
      }
    });
  }
  
  return videos;
}
```

#### 4.4 Casos de Uso Específicos por Engine

**🚀 RUNWAY Gen-4 Turbo es PERFECTO para:**
```typescript
// Ejemplos donde Runway dominará
const casosRunway = {
  concierge: {
    // Foto estática de oficina elegante → Video con zoom suave
    input: "elegant-office-space.jpg",
    movement: "zoom-in revealing luxury details",
    output: "Smooth zoom into premium concierge office setup"
  },
  
  restaurante: {
    // Foto de plato gourmet → Video con movimiento circular
    input: "gourmet-dish-plated.jpg", 
    movement: "circular reveal of culinary artistry",
    output: "Elegant circular motion showcasing dish details"
  },
  
  boutique: {
    // Foto de outfit → Video con pan vertical
    input: "fashion-outfit-display.jpg",
    movement: "vertical pan revealing full style",
    output: "Smooth vertical reveal of complete fashion look"
  }
};
```

**🎬 KLING mantiene su dominio para:**
```typescript
// Casos donde Kling sigue siendo superior
const casosKling = {
  testimoniales: {
    // Video con personas hablando
    requiresActors: true,
    complexity: "high",
    engine: "kling"
  },
  
  scenasComplejas: {
    // Múltiples elementos interactuando
    elements: ["people", "objects", "environment"],
    transitions: "narrative-driven", 
    engine: "kling"
  }
};
```

#### 4.5 Metadata y Analytics
```typescript
interface VideoGenerationMetrics {
  engineUsed: 'runway' | 'kling';
  processingTime: number;
  qualityScore: number;
  costEfficiency: number;
  userSatisfaction?: number; // Post-generation feedback
}

// Analytics para optimizar selector
export function trackEnginePerformance(metrics: VideoGenerationMetrics) {
  // Datos para mejorar el selector automático
  console.log(`Engine: ${metrics.engineUsed}, Quality: ${metrics.qualityScore}, Time: ${metrics.processingTime}s`);
  
  // Si Runway está consistentemente más rápido para comerciales simples
  // Si Kling mantiene calidad superior para contenido complejo
  // Ajustar selectOptimalEngine() basado en data real
}
```

---

### **VENTAJAS DEL SISTEMA DUAL** 🎯

**💰 COSTO-EFECTIVIDAD:**
- Runway Gen-4 Turbo: Más rápido y económico para comerciales simples
- Kling: Reservado para contenido premium que justifica el costo

**⚡ VELOCIDAD:**
- Runway Gen-4 Turbo: ~30-60 segundos por clip comercial
- Kling: ~2-4 minutos para contenido cinematográfico

**🎨 CALIDAD OPTIMIZADA:**
- Runway: Excelente para transformar fotos → videos comerciales
- Kling: Superior para escenas narrativas complejas

**🧠 INTELIGENCIA:**
- El selector automático aprende de cada generación
- Optimización continua basada en resultados reales
```

---

### **FASE 5: DASHBOARD AGENTE MARKETING** 📊
*Tiempo estimado: 3 horas*

**Objetivo**: Interface súper simple para usuarios no-técnicos como tu amigo

#### 5.1 Nuevo Endpoint para Frontend
```typescript
// src/controllers/agenteMarketingController.ts
export async function crearCampañaCompleta(req: Request, res: Response) {
  try {
    const { imagenes, descripcionNegocio, plataformasObjetivo, cantidadVideos } = req.body;
    
    // 1. Procesar con Agente Marketing
    const resultado = await procesarSolicitudCompleta({
      imagenes,
      descripcionNegocio, 
      plataformasObjetivo,
      cantidadVideos
    });
    
    // 2. Generar videos reales
    const videosGenerados = await generarVideoDesdeAgenteMarketing({
      conceptosVisuales: resultado.conceptosVisuales,
      analisisNegocio: resultado.analisisNegocio,
      imagenesFuente: imagenes
    });
    
    // 3. Respuesta completa para frontend
    res.json({
      success: true,
      campañaCompleta: {
        analisis: resultado.analisisNegocio,
        estrategia: resultado.estrategiaContenido,
        videos: videosGenerados,
        copy: resultado.copyProfesional,
        planPosteo: resultado.planPosteo,
        opcionEditorPro: {
          disponible: true,
          estimado: "2-4 horas",
          costo: 50
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  };
}
```

#### 5.2 Frontend: Interface No-Técnico
```tsx
// Frontend: componente súper simple
function AgenteMarketingDashboard() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Tu Agente de Marketing Personal 🤖</h1>
      
      {/* Paso 1: Upload súper simple */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Sube fotos de tu negocio</h2>
        <ImageUploader 
          placeholder="Arrastra 3-5 fotos aquí - oficina, equipo, productos, etc."
          maxFiles={5}
        />
      </div>
      
      {/* Paso 2: Info básica */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibent mb-4">2. Cuéntanos de tu negocio</h2>
        <textarea 
          placeholder="Ej: Somos un servicio de concierge de lujo para ejecutivos ocupados en Miami"
          className="w-full p-3 border rounded"
        />
      </div>
      
      {/* Paso 3: Plataformas */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">3. ¿Dónde quieres postear?</h2>
        <div className="flex gap-4">
          <label><input type="checkbox" /> Instagram</label>
          <label><input type="checkbox" /> LinkedIn</label>
          <label><input type="checkbox" /> TikTok</label>
        </div>
      </div>
      
      {/* Botón mágico */}
      <button 
        className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-semibold"
        onClick={generarCampañaCompleta}
      >
        ✨ Crear Mi Campaña Completa (5-8 videos)
      </button>
    </div>
  );
}
```

#### 5.3 Resultados Listos Para Usar  
```tsx
// Cuando termina el procesamiento
function ResultadosCampaña({ campaña }) {
  return (
    <div>
      <h2>🎉 Tu campaña está lista!</h2>
      
      {/* Videos generados */}
      <div className="grid grid-cols-2 gap-4">
        {campaña.videos.map(video => (
          <div key={video.id} className="bg-white p-4 rounded shadow">
            <video src={video.url} controls className="w-full mb-2" />
            <p className="text-sm font-medium">{video.copy.titulo}</p>
            <p className="text-xs text-gray-600">{video.copy.descripcion}</p>
            
            {/* Copy listo para copiar */}
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
              <strong>Caption:</strong> {video.copy.instagram.caption}
            </div>
            <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
              <strong>Hashtags:</strong> {video.copy.instagram.hashtags.join(' ')}
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2 mt-3">
              <button className="bg-green-500 text-white px-3 py-1 rounded text-sm">
                📤 Descargar Video
              </button>
              <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                📋 Copiar Caption
              </button>
              <button className="bg-purple-500 text-white px-3 py-1 rounded text-sm">
                ⚡ Mejorar con Editor Pro
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Plan de posteo */}
      <div className="mt-6 bg-yellow-50 p-4 rounded">
        <h3 className="font-semibold mb-2">📅 Plan de Posteo Recomendado:</h3>
        <ul className="text-sm">
          <li>• Instagram: Lunes y Jueves a las 9:00 AM</li>
          <li>• LinkedIn: Martes a las 8:00 AM</li>  
          <li>• TikTok: Viernes a las 7:00 PM</li>
        </ul>
      </div>
    </div>
  );
}
```

---

**ESTIMACIÓN TOTAL DE TIEMPO** ⏱️

**FASE 1: Agente Inteligente** - 4-5 horas  
**FASE 2: Copywriter Pro** - 3 horas  
**FASE 3: Integración Editor Pro** - 2 horas  
**FASE 4: Motor Dual Runway + Kling** - 3 horas  
**FASE 5: Dashboard No-Técnico** - 3 horas  

**TOTAL: 15-16 horas** = 2 días de trabajo intenso

### **RESULTADO FINAL MEJORADO** 🎯

**Tu amigo del concierge podrá:**
1. Subir 4 fotos de su oficina elegante  
2. Escribir: "Servicio de concierge de lujo en Miami"
3. Seleccionar: Instagram + LinkedIn
4. Hacer click en "Crear Campaña"
5. **OBTENER:** 6 videos profesionales donde:
   - **Videos de oficina/productos** → **Runway Gen-4 Turbo** (súper smooth y rápido)
   - **Videos con personas/testimoniales** → **Kling** (calidad cinematográfica)
   - Copy profesional incluido para cada video
6. **Si no le gusta algo:** Editor Pro en 2-4 horas por $50

**El sistema AUTOMÁTICAMENTE elige el mejor engine** 🤖  
**Sin saber NADA de tecnología, marketing o diferencias técnicas** 🚀

### **CASOS REALES DE TU AMIGO CONCIERGE:**

**🚀 RUNWAY Gen-4 Turbo generará:**
- Foto de oficina elegante → Video con zoom smooth revelando detalles premium
- Foto de sala de espera → Video con pan horizontal mostrando ambiente luxury
- Foto de desk setup → Video con dolly-out revelando espacio completo
- Foto de servicios → Video con movimiento circular destacando beneficios

**🎬 KLING generará:**
- Video testimonial simulado (si hay personas)
- Escenas de "día en la vida" más complejas
- Contenido narrativo con múltiples elementos

**Resultado:** ¡Variedad perfecta de contenido comercial optimizado! ⚡

---

### **FASE 6: AGENTE CONVERSACIONAL CON MEMORIA** 🤖💬
*Tiempo estimado: 4-5 horas*
*EL GAME CHANGER DEFINITIVO*

**Objetivo**: Un asistente AI que conoce todo del negocio del usuario y habla como humano

#### 6.1 Sistema de Memoria Persistente
```typescript
// src/services/agentMemory/memorySystem.ts
interface UserBusinessMemory {
  userId: string;
  businessProfile: {
    type: string;                    // "concierge", "restaurante", etc.
    name: string;                    // "Miami Luxury Concierge"
    targetAudience: string[];        // ["executives", "wealthy clients"]
    brandVoice: string;              // "professional", "friendly", "luxury"
    competitors: string[];           // Competidores identificados
    uniqueValueProp: string;         // USP del negocio
  };
  contentHistory: {
    videosCreados: VideoMemory[];    // Historial de videos
    copiesExitosos: CopyMemory[];    // Qué copy funcionó
    platformas: PlatformPerformance[]; // Rendimiento por red social  
    metricas: EngagementData[];      // Métricas reales de posts
  };
  conversations: ConversationMemory[]; // Historial de chats
  preferences: {
    stylesPreferidos: string[];      // Estilos visuales que prefiere
    horariosOptimos: TimeSlot[];     // Mejores horas para postear
    budgetPreferences: BudgetInfo;   // Presupuesto típico
    painPoints: string[];            // Problemas recurrentes
  };
  lastInteraction: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ConversationMemory {
  id: string;
  timestamp: Date;
  userMessage: string;
  agentResponse: string;
  context: 'content_creation' | 'strategy_advice' | 'troubleshooting' | 'casual';
  outcome: 'helpful' | 'neutral' | 'frustrated'; // Feedback del usuario
  followUpNeeded: boolean;
}

class AgentMemoryManager {
  async saveInteraction(userId: string, conversation: ConversationMemory): Promise<void> {
    // Guardar en base de datos persistente
    await prisma.userBusinessMemory.upsert({
      where: { userId },
      create: { userId, conversations: [conversation] },
      update: { 
        conversations: { push: conversation },
        updatedAt: new Date()
      }
    });
  }
  
  async getBusinessContext(userId: string): Promise<UserBusinessMemory | null> {
    return await prisma.userBusinessMemory.findUnique({
      where: { userId },
      include: { 
        contentHistory: true,
        conversations: { orderBy: { timestamp: 'desc' }, take: 20 } // Últimas 20 conversaciones
      }
    });
  }
  
  async updateBusinessProfile(userId: string, newData: Partial<UserBusinessMemory>): Promise<void> {
    await prisma.userBusinessMemory.update({
      where: { userId },
      data: { ...newData, updatedAt: new Date() }
    });
  }
}
```

#### 6.2 Agente Conversacional Inteligente
```typescript
// src/services/conversationalAgent/marketingAgent.ts
class MarketingConversationalAgent {
  private memoryManager: AgentMemoryManager;
  private llm: OpenAI; // o Claude, o cualquier LLM
  
  constructor() {
    this.memoryManager = new AgentMemoryManager();
    this.llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  
  async chatWithUser(userId: string, userMessage: string): Promise<{
    response: string;
    suggestedActions: ActionSuggestion[];
    contextUsed: string[];
  }> {
    // 1. Cargar memoria completa del usuario
    const businessMemory = await this.memoryManager.getBusinessContext(userId);
    
    // 2. Construir contexto rico para el LLM
    const systemPrompt = this.buildPersonalizedSystemPrompt(businessMemory);
    
    // 3. Generar respuesta contextual
    const llmResponse = await this.llm.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    const agentResponse = llmResponse.choices[0].message.content;
    
    // 4. Identificar acciones sugeridas
    const suggestedActions = await this.identifyActionSuggestions(userMessage, businessMemory);
    
    // 5. Guardar interacción en memoria
    await this.memoryManager.saveInteraction(userId, {
      id: generateId(),
      timestamp: new Date(),
      userMessage,
      agentResponse,
      context: this.classifyContext(userMessage),
      outcome: 'helpful', // Se actualiza con feedback del usuario
      followUpNeeded: this.needsFollowUp(userMessage, agentResponse)
    });
    
    return {
      response: agentResponse,
      suggestedActions,
      contextUsed: this.getContextUsed(businessMemory)
    };
  }
  
  private buildPersonalizedSystemPrompt(memory: UserBusinessMemory | null): string {
    if (!memory) {
      return `Eres el asistente de marketing personal del usuario. Ayúdalo a crear contenido para su negocio de forma amigable y profesional.`;
    }
    
    return `
Eres el asistente de marketing personal de ${memory.businessProfile?.name || 'el usuario'}.

CONTEXTO DEL NEGOCIO:
- Tipo: ${memory.businessProfile?.type}
- Target: ${memory.businessProfile?.targetAudience?.join(', ')}
- Voz de marca: ${memory.businessProfile?.brandVoice}
- USP: ${memory.businessProfile?.uniqueValueProp}

HISTORIAL RECIENTE:
- Videos creados: ${memory.contentHistory?.videosCreados?.length || 0}
- Últimas conversaciones: ${memory.conversations?.slice(0, 3).map(c => `"${c.userMessage}" → "${c.agentResponse}"`).join(' | ')}
- Problemas recurrentes: ${memory.preferences?.painPoints?.join(', ') || 'ninguno identificado'}

INSTRUCCIONES:
- Habla como un experto en marketing que conoce su negocio íntimamente
- Referencia conversaciones y decisiones pasadas cuando sea relevante  
- Sé proactivo sugiriendo mejoras basadas en su historial
- Mantén un tono ${memory.businessProfile?.brandVoice === 'luxury' ? 'profesional y sofisticado' : 'amigable pero experto'}
- Si menciona algo nuevo, actualiza tu comprensión del negocio
    `.trim();
  }
  
  private async identifyActionSuggestions(message: string, memory: UserBusinessMemory | null): Promise<ActionSuggestion[]> {
    const suggestions: ActionSuggestion[] = [];
    
    // Análisis de intención del mensaje
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('video') || lowerMessage.includes('contenido')) {
      suggestions.push({
        type: 'create_campaign',
        title: 'Crear nueva campaña',
        description: 'Basado en tu conversación, puedo generar videos automáticamente',
        action: 'navigate_to_campaign_creator',
        priority: 'high'
      });
    }
    
    if (lowerMessage.includes('no funciona') || lowerMessage.includes('mal resultado')) {
      suggestions.push({
        type: 'improve_content',
        title: 'Usar Editor Pro',
        description: 'Mejoremos ese contenido con nuestro equipo humano',
        action: 'upgrade_to_editor_pro',
        priority: 'medium'
      });
    }
    
    if (lowerMessage.includes('competencia') || lowerMessage.includes('otros')) {
      suggestions.push({
        type: 'competitive_analysis',
        title: 'Análisis de competencia',
        description: 'Analicemos qué está haciendo tu competencia',
        action: 'start_competitor_research',
        priority: 'low'
      });
    }
    
    return suggestions;
  }
}

interface ActionSuggestion {
  type: 'create_campaign' | 'improve_content' | 'competitive_analysis' | 'schedule_content' | 'upgrade_plan';
  title: string;
  description: string;
  action: string; // ID de la acción a ejecutar
  priority: 'high' | 'medium' | 'low';
}
```

#### 6.3 Frontend - Chat Interface Integrado
```tsx
// Frontend: components/ConversationalAgent/MarketingChatBot.tsx
function MarketingChatBot({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState<ActionSuggestion[]>([]);
  
  // Personalized welcome message based on memory (in English)
  useEffect(() => {
    loadWelcomeMessage();
  }, [userId]);
  
  const loadWelcomeMessage = async () => {
    const response = await fetch(`/api/agent/welcome/${userId}`);
    const { welcomeMessage, businessContext } = await response.json();
    
    setMessages([{
      id: '1',
      type: 'agent',
      content: welcomeMessage, // English welcome message
      timestamp: new Date(),
      contextUsed: businessContext
    }]);
  };
  
  return (
    <div className="marketing-chat-container">
      {/* Header with business info */}
      <div className="chat-header">
        <div className="agent-avatar">🤖</div>
        <div>
          <h3>Your Personal Marketing Assistant</h3>
          <p className="text-sm text-gray-500">Knows your business and history</p>
        </div>
      </div>
      
      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me about your marketing, content, strategy..."
          className="w-full p-3 border rounded-lg"
        />
        <button 
          onClick={sendMessage}
          className="send-button"
          disabled={!inputMessage.trim() || isTyping}
        >
          📤
        </button>
      </div>
    </div>
  );
}
  
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user', 
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Limpiar input y mostrar typing
    setInputMessage('');
    setIsTyping(true);
    
    try {
      // Llamar al agente
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, message: inputMessage })
      });
      
      const { response: agentResponse, suggestedActions: actions, contextUsed } = await response.json();
      
      // Agregar respuesta del agente
      const agentMessage: ChatMessage = {
        id: generateId(),
        type: 'agent',
        content: agentResponse,
        timestamp: new Date(),
        contextUsed: contextUsed
      };
      setMessages(prev => [...prev, agentMessage]);
      setSuggestedActions(actions);
      
    } catch (error) {
      console.error('Error chatting with agent:', error);
    } finally {
      setIsTyping(false);
    }
  };
  
  return (
    <div className="marketing-chat-container">
      {/* Header con info del negocio */}
      <div className="chat-header">
        <div className="agent-avatar">🤖</div>
        <div>
          <h3>Tu Asistente de Marketing Personal</h3>
          <p className="text-sm text-gray-500">Conoce tu negocio y tu historial</p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="chat-messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.content}
            </div>
            {message.contextUsed && (
              <div className="context-used">
                💭 Basado en: {message.contextUsed.join(', ')}
              </div>
            )}
            <div className="message-time">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message agent typing">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>
      
      {/* Suggested Actions */}
      {suggestedActions.length > 0 && (
        <div className="suggested-actions">
          <p className="text-sm font-medium">Puedo ayudarte con:</p>
          <div className="actions-grid">
            {suggestedActions.map(action => (
              <button 
                key={action.action}
                className={`action-button priority-${action.priority}`}
                onClick={() => executeAction(action)}
              >
                <span className="action-title">{action.title}</span>
                <span className="action-desc">{action.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input */}
      <div className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Pregúntame sobre tu marketing, contenido, estrategia..."
          className="w-full p-3 border rounded-lg"
        />
        <button 
          onClick={sendMessage}
          className="send-button"
          disabled={!inputMessage.trim() || isTyping}
        >
          📤
        </button>
      </div>
    </div>
  );
}
```

#### 6.4 Casos de Uso Reales del Chat Agent (EN INGLÉS)

**🤖 TYPICAL CONVERSATIONS WITH YOUR CONCIERGE FRIEND:**

```
👤 USER: "Hi, I need content for this week"

🤖 AGENT: "Hello! I remember Miami Luxury Concierge focuses on high-class executives. Last week we created 4 videos about premium services that had great engagement on LinkedIn.

Would you like to continue with that approach or explore something new like 'day in the life of your concierge'? I have some ideas based on the office photos you uploaded last month."

[Button: Create weekly campaign] [Button: View past metrics]
```

```
👤 USER: "I didn't like yesterday's videos that much"

🤖 AGENT: "I understand your concern. Looking at your history, I see you prefer a more elegant style with less camera movement. The videos you liked most were the smooth zoom ones from January.

How about we refine those videos with our Pro Editor? Or we can generate new versions with Runway Gen-4 that gives you that smooth effect you're looking for."

[Button: Improve with Pro Editor - $50] [Button: Regenerate with Runway]
```

```
👤 USER: "What's the best time to post on Instagram?"

🤖 AGENT: "Based on your previous posts, your best times have been:
• Tuesday 9:00 AM - 34% more engagement  
• Thursday 2:00 PM - 28% more reach
• Sunday 7:00 PM - Best for lifestyle content

Your executive audience is most active during work hours. Should we schedule content for those times?"

[Button: Schedule posts automatically] [Button: View complete analytics]
```

```
👤 USER: "My competition is getting more followers"

🤖 AGENT: "I can help with competitive analysis! Looking at your luxury concierge niche, I notice your content focuses more on services while competitors show lifestyle. 

Based on your brand personality, we could create 'behind-the-scenes luxury' content that maintains your professional edge while being more engaging. Want me to generate some concepts?"

[Button: Analyze competition] [Button: Create differentiation strategy]
```

```
👤 USER: "I'm not tech-savvy, this is overwhelming"

🤖 AGENT: "Don't worry! That's exactly why I'm here. You just need to chat with me like you're talking to your marketing employee. I handle all the technical stuff.

Just tell me what you need - 'I need Instagram posts' or 'My clients love testimonials' - and I'll take care of everything. You don't need to understand any technology."

[Button: Show simple tutorial] [Button: Create content now]
```

#### 6.5 Frontend - Dashboard Simplificado para No-Técnicos
```tsx
// Frontend: components/dashboard/MarketingAgentDashboard.tsx
function MarketingAgentDashboard({ userId }: { userId: string }) {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Your Personal Marketing Agent 🤖</h1>
      
      {/* Simple Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Upload your business photos</h2>
        <ImageUploader 
          placeholder="Drag 3-5 photos here - office, team, products, etc."
          maxFiles={5}
          onUpload={handleImageUpload}
        />
      </div>
      
      {/* Basic Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">2. Tell us about your business</h2>
        <textarea 
          placeholder="Example: We are a luxury concierge service for busy executives in Miami"
          className="w-full p-3 border rounded"
          onChange={handleBusinessDescription}
        />
      </div>
      
      {/* Platform Selection */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">3. Where do you want to post?</h2>
        <div className="flex gap-4">
          <label><input type="checkbox" value="instagram" /> Instagram</label>
          <label><input type="checkbox" value="linkedin" /> LinkedIn</label>
          <label><input type="checkbox" value="tiktok" /> TikTok</label>
        </div>
      </div>
      
      {/* Magic Button */}
      <button 
        className="w-full bg-blue-600 text-white py-4 rounded-lg text-xl font-semibold mb-6"
        onClick={generateCompleteCampaign}
      >
        ✨ Create My Complete Campaign (5-8 videos)
      </button>
      
      {/* Chat Interface Always Visible */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">💬 Chat with Your Marketing Agent</h3>
        <MarketingChatBot userId={userId} />
      </div>
    </div>
  );
}
```

#### 6.6 Schema de Base de Datos Actualizado
```sql
-- prisma/schema.prisma - New tables for agent memory

model UserBusinessMemory {
  id                String   @id @default(cuid())
  userId            String   @unique
  
  // Business Profile (English)
  businessType      String?  // "concierge", "restaurant", etc.
  businessName      String?  // "Miami Luxury Concierge"
  targetAudience    Json?    // Array of demographics
  brandVoice        String?  // "luxury", "professional", etc.
  competitors       Json?    // Array of competitor info
  valueProposition  String?  // Unique selling proposition
  
  // Content History
  videosCreated     Json?    // Array of VideoMemory objects
  successfulCopy    Json?    // Copy that performed well
  platformMetrics   Json?    // Performance per platform
  engagementData    Json?    // Real metrics from posts
  
  // User Preferences
  preferredStyles   Json?    // Visual styles user likes
  optimalTimes      Json?    // Best posting times
  budgetInfo        Json?    // Budget preferences
  painPoints        Json?    // Recurring problems
  
  // Timestamps
  lastInteraction   DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relations
  user              User     @relation(fields: [userId], references: [id])
  conversations     ConversationMemory[]
  
  @@map("user_business_memory")
}

model ConversationMemory {
  id               String   @id @default(cuid())
  userId           String
  userMessage      String   @db.Text
  agentResponse    String   @db.Text
  context          String   // "content_creation", "strategy_advice", etc.
  outcome          String   // "helpful", "neutral", "frustrated"
  followUpNeeded   Boolean  @default(false)
  timestamp        DateTime @default(now())
  
  // Relations
  businessMemory   UserBusinessMemory @relation(fields: [userId], references: [userId])
  
  @@map("conversation_memory")
}
```

**🤖 CONVERSACIONES TÍPICAS CON TU AMIGO CONCIERGE:**

```
👤 USER: "Hola, necesito contenido para esta semana"

🤖 AGENT: "¡Hola! Recuerdo que Miami Luxury Concierge está enfocado en ejecutivos de clase alta. La semana pasada creamos 4 videos sobre servicios premium que tuvieron buen engagement en LinkedIn. 

¿Quieres continuar con esa línea o exploramos algo nuevo como 'día en la vida de tu concierge'? Tengo algunas ideas basadas en las fotos de tu oficina que subiste el mes pasado."

[Botón: Crear campaña semanal] [Botón: Ver métricas pasadas]
```

```
👤 USER: "Los videos de ayer no me gustaron mucho"

🤖 AGENT: "Entiendo tu preocupación. Revisando tu historial, veo que prefieres un estilo más elegante y menos movimiento de cámara. Los videos que más te gustaron fueron los de zoom suave en enero.

¿Te parece si refinamos esos videos con nuestro Editor Pro? O podemos generar nuevas versiones con Runway Gen-4 que da ese efecto smooth que buscas."

[Botón: Mejorar con Editor Pro - $50] [Botón: Regenerar con Runway]
```

```
👤 USER: "¿Qué horario es mejor para postear en Instagram?"

🤖 AGENT: "Basándome en tus posts anteriores, tus mejores horarios han sido:
• Martes 9:00 AM - 34% más engagement  
• Jueves 2:00 PM - 28% más alcance
• Domingo 7:00 PM - Mejor para contenido lifestyle

Tu audiencia de ejecutivos está más activa en horarios de trabajo. ¿Programamos contenido para esas horas?"

---

### **ESTIMACIÓN TOTAL DE TIEMPO ACTUALIZADA** ⏱️

**FASE 1: Agente Inteligente** - 4-5 horas  
**FASE 2: Copywriter Pro** - 3 horas  
**FASE 3: Integración Editor Pro** - 2 horas  
**FASE 4: Motor Dual Runway + Kling** - 3 horas  
**FASE 5: Dashboard No-Técnico** - 3 horas  
**FASE 6: Agente Conversacional con Memoria** - 4-5 horas  

**TOTAL: 19-21 horas** = 3 días de trabajo intenso

### **RESULTADO FINAL: EL EMPLEADO DE MARKETING PERFECTO** 🎯

**Tu amigo del concierge ahora tendrá:**

**🤖 UN ASISTENTE QUE LO CONOCE:**
- Recuerda cada conversación anterior
- Conoce su negocio, competencia, y audience
- Aprende de qué contenido funciona mejor
- Sugiere mejoras basadas en su historial
- Habla como un humano experto en marketing

**💬 CONVERSACIONES NATURALES:**
- "Necesito contenido para esta semana" → Sugerencias personalizadas
- "Esto no me gusta" → Alternativas basadas en preferencias pasadas  
- "¿Cuándo posteo?" → Horarios optimizados con datos reales
- "¿Qué hace mi competencia?" → Análisis automático

**🚀 FLUJO COMPLETO AUTOMATIZADO:**
1. **Chatea** con el agente sobre sus necesidades
2. **Sube fotos** cuando el agente se lo sugiere
3. **Obtiene videos** generados automáticamente (Runway + Kling)
4. **Recibe copy** profesional listo para usar
5. **Chat follow-up** si necesita ajustes
6. **Editor Pro** disponible si quiere perfección

### **LA VENTAJA COMPETITIVA BRUTAL** 💪

**❌ Competencia:**
- Tools genéricos sin contexto
- Interfaces complicadas 
- Sin memoria del usuario
- Sin guidance personalizada

**✅ Nosotros:**
- Agente que conoce tu negocio
- Interfaz conversacional natural
- Memoria persistente de todo
- Guidance experta personalizada
- Generación automática inteligente
- Fallback humano (Editor Pro)

### **CASOS DE USO EXPANDIDOS:**

**🏢 Concierge Miami:**
- Agente recuerda: "target clase alta, estilo luxury, LinkedIn funciona mejor"
- Genera: Videos elegantes con Runway + Copy sofisticado

**🍽️ Restaurante Local:**
- Agente recuerda: "food-focused, Instagram prioridad, clientes jóvenes"  
- Genera: Videos dinámicos de comida + Copy casual

**👗 Boutique Fashion:**
- Agente recuerda: "visual-first, TikTok trends, audiencia gen-z"
- Genera: Videos trending + Copy viral

**El agente SE ADAPTA y APRENDE de cada cliente** 🧠

### **¿ES COMPLICADO IMPLEMENTAR?** 

**❌ NO es complicado, es GENIAL:**
- **Base de datos:** Solo tablas nuevas en Prisma
- **LLM:** OpenAI/Claude API (ya existentes)
- **Frontend:** Componente chat standard
- **Backend:** Controllers normales con memoria

**La complejidad real está en el VALOR que aporta** 🔥

**¿Te parece que esto convertiría a Storyteller en el #1 absoluto?** ✨
  };
  tiktok: {
    hook: string;          // Primeros 3 segundos cruciales  
    narrative: string[];    // Historia que mantiene atención
    trendingHashtags: string[];
    viralElements: string[];
  };
}

// Ejemplos reales que generaría:
// Instagram Caption para Concierge:
"¿Cuándo fue la última vez que tuviste tiempo para ti? 🕰️ Mientras tú disfrutas de tu café matutino, nosotros ya resolvimos tus 5 pendientes más importantes. Eso es lo que hace un verdadero concierge de lujo ✨ #ConciergeLife #LuxuryServices #TiempoEsOro"

// LinkedIn para Concierge:
"3 cosas que aprendimos manejando +200 solicitudes de concierge al mes: 1) El tiempo es el activo más valioso de un ejecutivo 2) La anticipación supera a la reacción 3) Los detalles pequeños crean experiencias grandes. ¿Cuál es tu mayor dolor de cabeza administrativo?"
```

#### 2.2 Hooks Psicológicos Automatizados
```typescript
interface HooksPsicologicos {
  apertura: {
    curiosidad: string[];   // "¿Sabías que el 90% de..."
    problema: string[];     // "Si eres como yo, odias..."  
    beneficio: string[];    // "En solo 5 minutos puedes..."
    social_proof: string[]; // "Más de 500 empresas ya..."
  };
  mantenimiento: {
    tension: string[];      // Mantener atención mid-video
    revelacion: string[];   // Momentos "aha"
    story: string[];        // Elementos narrativos
  };
  cierre: {
    urgencia: string[];     // "Solo por esta semana..."
    facilidad: string[];    // "Es más fácil que pedir un Uber"
    autoridad: string[];    // "Con 10 años de experiencia..."
  };
}
```

---

### **FASE 3: INTEGRACIÓN CON EDITOR PRO** ⚡
*Tiempo estimado: 2 horas*

**Objetivo**: Si el AI no es perfecto → Editor Pro para refinamiento

#### 3.1 Flujo AI → Editor Pro
```typescript
// Nuevo endpoint en marketingPipeline.ts
export async function generarContenidoAgenteMarketing(request: AgenteMarketingRequest): Promise<{
  videosAutomaticos: VideoComercial[];
  opcionEditorPro: {
    disponible: boolean;
    tiempoEstimado: string;
    costoAdicional: number;
  };
}> {
  // 1. Generar contenido automático
  const videosAI = await procesarSolicitudCompleta(request);
  
  // 2. Evaluar si necesita Editor Pro
  const necesitaRefinamiento = evaluarCalidadOutput(videosAI);
  
  // 3. Ofrecer opción Editor Pro si es necesario
  return {
    videosAutomaticos: videosAI,
    opcionEditorPro: {
      disponible: true,
      tiempoEstimado: "2-4 horas adicionales",
      costoAdicional: 50 // USD
    }
  };
}
```

#### 3.2 Bridge AI → Editor Humano  
```typescript
interface SolicitudEditorPro {
  videosGeneradosAI: VideoComercial[];
  feedbackUsuario: string;
  ajustesSolicitados: {
    cambiarMusic: boolean;
    ajustarCopy: boolean;
    modificarVisual: boolean;
    optimizarCTA: boolean;
  };
  prioridadEntrega: 'standard' | 'express';
}

// El Editor Pro recibe context completo del AI
// - Análisis de negocio original  
// - Estrategia generada
// - Conceptos visuales creados
// - Copy automático
// + Feedback específico del cliente
```

---

## 🎯 PLAN DE EJECUCIÓN RECOMENDADO

### Orden Optimizado (Marketing Priority)
1. **FASE 2** → Cerebros Marketing (impacto inmediato en tu enfoque)
2. **FASE 1** → Base sólida (para que todo funcione mejor)
3. **FASE 4** → Optimizaciones Kling (calidad visual máxima)
4. **FASE 3** → Unificación (eliminar duplicación)
5. **FASE 5** → Pulimento (cerrar detalles)

### Checkpoints Críticos
- ✅ Después de cada fase: Test completo
- ✅ Validar que no rompemos Cinema existente
- ✅ Medir mejoras cuantificables
- ✅ Documentar cambios para rollback si necesario

---

## 📊 BENEFICIOS ESPERADOS

### Para Marketing (Tu Prioridad)
- ✨ Videos 3x más profesionales y persuasivos
- 🧠 Cerebros especializados en conversión
- 📱 Optimización automática por plataforma
- 📈 Métricas de engagement predictivo
- 🎯 CTAs dinámicos y efectivos

### Para Cinema
- 🎬 Prompts 5x más ricos → mejor calidad visual
- 🏗️ Arquitectura más limpia y mantenible
- 📽️ Tomas más coherentes cinematográficamente

### Para Ambos
- 🚀 Base sólida para escalar rápidamente
- 🐛 Menos bugs por código duplicado
- 📈 Más fácil agregar nuevos estilos
- 🔧 Mantenimiento simplificado

---

## ⚠️ RIESGOS Y MITIGACIONES

### Riesgos Técnicos
- **Prompts demasiado largos**: Kling tiene límites → Truncar inteligentemente
- **Overfitting comercial**: Videos muy similares → Añadir variabilidad
- **Performance**: Más complejidad → Optimizar cerebros críticos

### Mitigaciones
- Tests A/B continuo en cada fase
- Fallbacks robustos para cada cerebro
- Métricas de calidad automáticas
- Rollback rápido si hay problemas

---

## 🔮 EXPANSIONES FUTURAS

### Q1 2025
- Cerebros para otros estilos (Anime, Documentary)
- A/B Testing automático de prompts
- API pública para cerebros

### Q2 2025
- Multi-idioma en cerebros
- Integración con más generadores (Runway, Pika)
- Analytics avanzados de conversión

---

## 📝 NOTAS TÉCNICAS

### Kling Elements 2025 - Best Practices
- **Duración óptima**: 5-15 segundos por clip
- **Prompts efectivos**: Descriptivos pero concisos (<200 chars)
- **Movimientos**: Sutiles funcionan mejor que dramáticos
- **Aspect ratio**: 16:9 para social, 9:16 para stories
- **FPS**: 24 para cinema, 30 para comercial

### Optimizaciones Detectadas
- Usar "cinematic lighting" mejora consistencia
- "Professional cinematography" aumenta calidad
- Especificar ángulo de cámara reduce artifacts
- Mood keywords impactan más que descripciones largas

---

**Última actualización**: 13 de agosto de 2025  
**Próxima revisión**: Al completar cada fase  
**Responsable**: Claude (AI Assistant) + Cris (Product Owner)
