/**
 * 🎬 KLING ELEMENTS COMMERCIAL PROMPT BUILDER  
 * Optimizado para contenido cinematográfico, escenas con actores y calidad premium
 */

import { ConceptoVisual } from '../llmService/estilos/marketing/creativeDirector.js';

export interface KlingRequest {
  model: 'kling-elements' | 'kling-pro';
  prompt: string;
  image: string;
  duration: number; // 5-10 seconds typical
  aspect_ratio: '16:9' | '9:16' | '1:1';
  creativity_level: number; // 0.0-1.0
  fps: 24 | 30 | 60;
  lip_sync?: boolean; // Kling specialty
  negative_prompt?: string;
  cfg_scale: number; // 1-20, control adherence to prompt
  steps: number; // 10-50, quality vs speed
  motion_intensity?: number; // 0.0-1.0
}

export interface KlingResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    video_url: string;
    thumbnail_url?: string;
    duration: number;
  };
  error_message?: string;
  processing_time?: number;
  queue_position?: number;
}

/**
 * 🎯 CONSTRUCTOR PRINCIPAL - Kling Commercial Prompts
 */
export function buildKlingCommercialPrompt(
  imagen: string,
  concepto: ConceptoVisual, 
  analisisNegocio: any
): KlingRequest {
  let prompt = '';
  
  // 1️⃣ CINEMATIC FOUNDATION (Kling excels at cinematic quality)
  prompt += `Professional ${analisisNegocio?.businessType || 'business'} commercial scene, `;
  
  // 2️⃣ ACTOR/PERSON HANDLING (Kling's specialty)
  if (concepto.requiresActors) {
    prompt += buildActorPrompt(analisisNegocio?.brandPersonality || 'professional');
  }
  
  // 3️⃣ CINEMATIC CAMERA MOVEMENTS (Kling's strength)
  const cameraWork = buildCinematicMovement(concepto.transformacionesImagen.movimientoCamara);
  prompt += cameraWork;
  
  // 4️⃣ LIGHTING & MOOD (Kling excels at complex lighting)
  const cinematicMood = buildCinematicMood(
    concepto.transformacionesImagen.iluminacion,
    analisisNegocio?.brandPersonality || 'professional'
  );
  prompt += cinematicMood;
  
  // 5️⃣ COMMERCIAL CONTEXT & BRAND (Kling understands complex contexts)
  const brandContext = buildBrandContext(analisisNegocio, concepto);
  prompt += brandContext;
  
  // 6️⃣ FINAL CINEMATIC POLISH
  prompt += 'cinematic commercial style, professional lighting, high production value, commercial grade cinematography';
  
  // Clean and optimize prompt
  prompt = optimizeKlingPrompt(prompt);
  
  console.log(`[Kling] Generated prompt: ${prompt}`);
  
  return {
    model: determineKlingModel(concepto.visualComplexity, concepto.requiresActors),
    prompt,
    image: imagen,
    duration: Math.min(concepto.musicaRecomendada.duracion, 10), // Kling max 10s typically
    aspect_ratio: determineAspectRatio(analisisNegocio),
    creativity_level: calculateCreativityLevel(concepto.visualComplexity),
    fps: concepto.requiresActors ? 24 : 30, // Cinematic fps for actors
    lip_sync: concepto.requiresActors, // Enable lip sync if actors present
    negative_prompt: buildNegativePrompt(),
    cfg_scale: 7.5, // Balanced adherence
    steps: concepto.visualComplexity === 'complex' ? 35 : 25, // Quality vs speed
    motion_intensity: calculateMotionIntensity(concepto.transformacionesImagen.movimientoCamara)
  };
}

/**
 * 🎭 Actor/Person Prompt Building (Kling's specialty)
 */
function buildActorPrompt(brandPersonality: string): string {
  const actorStyles = {
    luxury: 'elegantly dressed professional speaking confidently to camera, sophisticated presence, maintaining eye contact, ',
    professional: 'professional businessperson addressing viewer directly, confident demeanor, natural expressions, ',
    casual: 'friendly approachable person speaking naturally, warm smile, relaxed professional appearance, ',
    friendly: 'warm engaging person connecting with audience, genuine expression, inviting personality, '
  };
  
  const baseStyle = actorStyles[brandPersonality as keyof typeof actorStyles] || actorStyles.professional;
  
  // Add Kling-specific lip sync optimization
  return baseStyle + 'natural lip movement synchronized with speech, authentic facial expressions, ';
}

/**
 * 🎬 Cinematic Camera Movement (Kling excels here)
 */
function buildCinematicMovement(movimiento: ConceptoVisual['transformacionesImagen']['movimientoCamara']): string {
  const cinematicMovements = {
    'zoom-in': 'cinematic zoom-in revealing elegant details with depth of field, ',
    'zoom-out': 'dramatic zoom-out revealing magnificent full scope with cinematic flair, ',
    'pan-right': 'smooth professional camera pan right showcasing premium environment, ',
    'pan-left': 'elegant camera pan left revealing sophisticated business space, ',
    'dolly-out': 'cinematic dolly-out movement revealing impressive full environment with depth, ',
    'tilt-up': 'dramatic upward camera tilt creating aspirational cinematic perspective, ',
    'tilt-down': 'cinematic downward tilt revealing intricate details with artistic flair, ',
    'static-to-dynamic': 'subtle cinematic movement bringing sophisticated energy to the scene, '
  };
  
  return cinematicMovements[movimiento] || cinematicMovements['static-to-dynamic'];
}

/**
 * 💡 Cinematic Mood & Lighting (Kling's strength)
 */
function buildCinematicMood(iluminacion: string, brandPersonality: string): string {
  const lightingStyles = {
    dramatic: 'dramatic cinematic lighting with rich shadows and highlights, moody commercial atmosphere, ',
    soft: 'soft diffused cinematic lighting creating elegant mood, professional commercial ambiance, ',
    natural: 'enhanced natural lighting with cinematic quality, sophisticated environmental illumination, ',
    corporate: 'bright professional lighting with cinematic depth, modern commercial presentation, ',
    cinematic: 'full cinematic lighting setup with depth and artistic shadows, film-grade illumination, ',
    bright: 'bright cinematic lighting maintaining depth and visual interest, high-key commercial style, '
  };
  
  const moodEnhancers = {
    luxury: 'golden hour warmth, premium atmospheric depth, ',
    professional: 'clean sophisticated lighting, modern business atmosphere, ',
    casual: 'warm inviting lighting, approachable professional mood, ',
    friendly: 'bright welcoming lighting, positive engaging atmosphere, '
  };
  
  const baseLighting = lightingStyles[iluminacion as keyof typeof lightingStyles] || lightingStyles.cinematic;
  const moodEnhancer = moodEnhancers[brandPersonality as keyof typeof moodEnhancers] || moodEnhancers.professional;
  
  return baseLighting + moodEnhancer;
}

/**
 * 🏢 Brand Context Building (Kling understands complex contexts)
 */
function buildBrandContext(analisisNegocio: any, concepto: ConceptoVisual): string {
  const businessType = analisisNegocio?.businessType || 'business';
  const brandPersonality = analisisNegocio?.brandPersonality || 'professional';
  
  const contextTemplates = {
    concierge: {
      luxury: 'exclusive luxury concierge environment, premium service excellence, sophisticated client experience, ',
      professional: 'professional concierge service setting, business excellence atmosphere, reliable service presentation, '
    },
    restaurant: {
      luxury: 'fine dining culinary experience, gourmet restaurant ambiance, culinary artistry presentation, ',
      casual: 'welcoming restaurant atmosphere, authentic culinary experience, inviting dining environment, '
    },
    boutique: {
      luxury: 'high-end fashion boutique atmosphere, exclusive retail experience, sophisticated style presentation, ',
      casual: 'contemporary fashion retail environment, accessible style showcase, modern boutique atmosphere, '
    },
    services: {
      professional: 'expert professional services environment, business solution atmosphere, trusted expertise presentation, ',
      friendly: 'approachable professional services setting, client-focused atmosphere, reliable service environment, '
    }
  };
  
  const businessContexts = contextTemplates[businessType as keyof typeof contextTemplates];
  if (businessContexts) {
    const specificContext = businessContexts[brandPersonality as keyof typeof businessContexts];
    if (specificContext) return specificContext;
  }
  
  // Fallback generic context
  return `professional ${businessType} commercial environment, ${brandPersonality} business atmosphere, `;
}

/**
 * 🧹 Optimize Kling Prompt
 */
function optimizeKlingPrompt(prompt: string): string {
  // Remove redundant words
  prompt = prompt.replace(/\b(commercial|professional|cinematic)\s+\1\b/gi, '$1');
  
  // Ensure under 300 characters for optimal processing
  if (prompt.length > 280) {
    prompt = prompt.substring(0, 277) + '...';
  }
  
  // Clean up punctuation
  prompt = prompt.replace(/,\s*,/g, ',').replace(/,\s*$/, '');
  
  return prompt.trim();
}

/**
 * 🚫 Negative Prompt Building
 */
function buildNegativePrompt(): string {
  return 'blurry, low quality, distorted face, bad anatomy, poor lighting, amateur, unprofessional, pixelated, artifacts';
}

/**
 * 🎛️ Configuration Helpers
 */
function determineKlingModel(complexity: string, hasActors: boolean): 'kling-elements' | 'kling-pro' {
  if (hasActors && complexity === 'complex') {
    return 'kling-elements'; // Best for lip sync and complex scenes
  }
  return 'kling-elements'; // Default to elements for most commercial use
}

function determineAspectRatio(analisisNegocio: any): '16:9' | '9:16' | '1:1' {
  const platforms = analisisNegocio?.preferredPlatforms || ['instagram'];
  
  if (platforms.includes('youtube') || platforms.includes('linkedin')) {
    return '16:9';
  } else if (platforms.includes('instagram') || platforms.includes('tiktok')) {
    return '9:16';
  }
  
  return '9:16'; // Default vertical
}

function calculateCreativityLevel(complexity: string): number {
  const levels = {
    simple: 0.6,    // Moderate creativity
    moderate: 0.7,  // Higher creativity
    complex: 0.8    // High creativity for complex scenes
  };
  
  return levels[complexity as keyof typeof levels] || 0.7;
}

function calculateMotionIntensity(movimiento: ConceptoVisual['transformacionesImagen']['movimientoCamara']): number {
  const intensities = {
    'static-to-dynamic': 0.3, // Subtle
    'zoom-in': 0.5,          // Moderate
    'zoom-out': 0.6,         // Moderate-high
    'pan-right': 0.6,        // Moderate-high
    'pan-left': 0.6,         // Moderate-high
    'dolly-out': 0.7,        // High
    'tilt-up': 0.5,          // Moderate
    'tilt-down': 0.5         // Moderate
  };
  
  return intensities[movimiento] || 0.5;
}

/**
 * 🎯 BUSINESS-SPECIFIC KLING TEMPLATES
 */
export const KLING_BUSINESS_TEMPLATES = {
  concierge_with_actors: {
    basePrompt: 'luxury concierge professional speaking to camera, ',
    specialElements: 'premium office setting, confident professional demeanor, eye contact with viewer',
    lipSync: true,
    fps: 24
  },
  
  restaurant_chef: {
    basePrompt: 'chef presenting culinary creation, ',
    specialElements: 'professional kitchen environment, culinary expertise demonstration',
    lipSync: true,
    fps: 24
  },
  
  boutique_model: {
    basePrompt: 'fashion model showcasing boutique style, ',
    specialElements: 'retail fashion environment, style presentation, elegant movement',
    lipSync: false,
    fps: 30
  },
  
  business_testimonial: {
    basePrompt: 'satisfied client providing testimonial, ',
    specialElements: 'professional business setting, authentic recommendation, sincere expression',
    lipSync: true,
    fps: 24
  }
};

/**
 * ⏱️ KLING API INTERACTION
 */
export async function submitKlingRequest(request: KlingRequest): Promise<string> {
  console.log(`[Kling] Submitting request: ${request.prompt.substring(0, 50)}...`);
  
  try {
    // Note: This is speculative API structure based on typical patterns
    const response = await fetch('https://api.kling.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KLING_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Kling API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json() as any;
    console.log(`[Kling] Task submitted: ${result.task_id}`);
    
    return result.task_id;
    
  } catch (error) {
    console.error('[Kling] Submission error:', error);
    throw error;
  }
}

export async function checkKlingStatus(taskId: string): Promise<KlingResponse> {
  try {
    const response = await fetch(`https://api.kling.ai/v1/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.KLING_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Kling status check error: ${response.status}`);
    }
    
    return await response.json() as KlingResponse;
    
  } catch (error) {
    console.error(`[Kling] Status check error for task ${taskId}:`, error);
    throw error;
  }
}

export async function waitForKlingCompletion(taskId: string, maxWaitTime = 600): Promise<string> {
  const startTime = Date.now();
  let attempts = 0;
  const maxAttempts = Math.floor(maxWaitTime / 6); // Check every 6 seconds (Kling slower)
  
  while (attempts < maxAttempts) {
    const status = await checkKlingStatus(taskId);
    
    if (status.status === 'completed') {
      const processingTime = Date.now() - startTime;
      console.log(`[Kling] ✅ Completed in ${Math.round(processingTime / 1000)}s`);
      return status.result!.video_url;
    } 
    
    if (status.status === 'failed') {
      throw new Error(`Kling generation failed: ${status.error_message}`);
    }
    
    const queueInfo = status.queue_position ? ` (queue position: ${status.queue_position})` : '';
    console.log(`[Kling] ⏳ Status: ${status.status}${queueInfo} (attempt ${attempts + 1}/${maxAttempts})`);
    
    await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds
    attempts++;
  }
  
  throw new Error(`Kling generation timeout after ${maxWaitTime}s`);
}

/**
 * 🔧 Advanced Kling Configurations
 */
export function createAdvancedKlingRequest(
  baseRequest: KlingRequest,
  advancedOptions: {
    enhanceActors?: boolean;
    prioritizeQuality?: boolean;
    customMotion?: number;
    extendDuration?: boolean;
  }
): KlingRequest {
  const enhanced = { ...baseRequest };
  
  if (advancedOptions.enhanceActors && enhanced.lip_sync) {
    enhanced.steps = Math.max(enhanced.steps, 30); // Higher quality for actors
    enhanced.cfg_scale = 8.0; // Better prompt adherence
  }
  
  if (advancedOptions.prioritizeQuality) {
    enhanced.steps = Math.max(enhanced.steps, 35);
    enhanced.creativity_level = Math.min(enhanced.creativity_level + 0.1, 1.0);
  }
  
  if (advancedOptions.customMotion !== undefined) {
    enhanced.motion_intensity = advancedOptions.customMotion;
  }
  
  return enhanced;
}
