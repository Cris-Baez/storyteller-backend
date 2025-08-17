/**
 * 🚀 RUNWAY GEN-4 TURBO COMMERCIAL PROMPT BUILDER
 * Optimizado específicamente para contenido comercial y transformaciones image-to-video
 */

import { ConceptoVisual } from '../llmService/estilos/marketing/creativeDirector.js';

export interface RunwayRequest {
  model: 'gen4_turbo';
  promptText: string;
  imageUri: string;
  duration: number; // 5-10 seconds
  ratio: '16:9' | '9:16' | '1:1';
  motionStrength: number; // 0.0-1.0
  seed?: number;
  watermark: boolean;
  extend_video?: boolean; // Para clips más largos
}

export interface RunwayResponse {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  output?: string[]; // URLs de videos generados
  failure_reason?: string;
  processing_time?: number;
}

/**
 * 🎯 CONSTRUCTOR PRINCIPAL - Runway Commercial Prompts
 */
export function buildRunwayCommercialPrompt(
  imagen: string, 
  concepto: ConceptoVisual, 
  analisisNegocio: any
): RunwayRequest {
  let prompt = '';
  
  // 1️⃣ BUSINESS CONTEXT (Runway Gen-4 entiende contexto de negocio)
  prompt += `${analisisNegocio?.businessType || 'business'} commercial, `;
  
  // 2️⃣ CAMERA MOVEMENTS (Runway Gen-4 Turbo maneja PERFECTO estos movimientos)
  const cameraMovement = buildCameraMovementPrompt(concepto.transformacionesImagen.movimientoCamara);
  prompt += cameraMovement;
  
  // 3️⃣ VISUAL STYLE (Runway Gen-4 es EXCELENTE con estilos comerciales específicos)
  const visualStyle = buildVisualStylePrompt(analisisNegocio?.brandPersonality || 'professional', concepto);
  prompt += visualStyle;
  
  // 4️⃣ LIGHTING & CINEMATOGRAPHY (Runway Gen-4 Turbo strengths)
  const cinematography = buildCinematographyPrompt(concepto.transformacionesImagen.iluminacion, concepto.transformacionesImagen.anguloCamara);
  prompt += cinematography;
  
  // 5️⃣ COMMERCIAL POLISH (Final professional touch)
  prompt += 'professional commercial production, high-end advertising quality, ';
  
  // Clean up prompt
  prompt = prompt.replace(/,\s*$/, '').trim(); // Remove trailing comma
  prompt = prompt.substring(0, 200); // Runway likes concise prompts
  
  console.log(`[Runway] Generated prompt: ${prompt}`);
  
  return {
    model: 'gen4_turbo',
    promptText: prompt,
    imageUri: imagen,
    duration: Math.min(concepto.musicaRecomendada.duracion, 10), // Max 10s for Runway
    ratio: determineAspectRatio(analisisNegocio),
    motionStrength: calculateMotionStrength(concepto.transformacionesImagen.movimientoCamara),
    seed: Math.floor(Math.random() * 1000000), // For consistency
    watermark: false, // Assuming Pro plan
    extend_video: concepto.musicaRecomendada.duracion > 10 // If longer than 10s needed
  };
}

/**
 * 🎬 Camera Movement Prompts (Runway Gen-4 Turbo specialties)
 */
function buildCameraMovementPrompt(movimiento: ConceptoVisual['transformacionesImagen']['movimientoCamara']): string {
  const movements = {
    'zoom-in': 'smooth zoom into intricate details, revealing premium craftsmanship, ',
    'zoom-out': 'elegant zoom-out revealing full scope and scale, ',
    'pan-right': 'graceful horizontal pan revealing environment and elegance, ',
    'pan-left': 'smooth left pan showcasing complete visual story, ',
    'dolly-out': 'cinematic pull-back revealing full magnificent environment, ',
    'tilt-up': 'dramatic upward tilt creating aspirational perspective, ',
    'tilt-down': 'elegant downward reveal showcasing detailed craftsmanship, ',
    'static-to-dynamic': 'bring static scene to life with subtle sophisticated motion, '
  };
  
  return movements[movimiento] || movements['static-to-dynamic'];
}

/**
 * 🎨 Visual Style Prompts (Runway Gen-4 optimized)
 */
function buildVisualStylePrompt(brandPersonality: string, concepto: ConceptoVisual): string {
  const styles = {
    luxury: 'premium luxury aesthetic, sophisticated gold accents, high-end commercial style, ',
    professional: 'clean professional presentation, corporate elegance, modern business style, ',
    casual: 'approachable friendly style, warm inviting atmosphere, contemporary casual, ',
    friendly: 'welcoming warm aesthetic, approachable professional style, ',
    modern: 'sleek contemporary design, minimalist professional, cutting-edge style, ',
    elegant: 'refined sophisticated presentation, timeless elegant style, '
  };
  
  const baseStyle = styles[brandPersonality as keyof typeof styles] || styles.professional;
  
  // Add concepto specific style elements
  if (concepto.transformacionesImagen.estilo === 'commercial') {
    return baseStyle + 'polished commercial production value, ';
  } else if (concepto.transformacionesImagen.estilo === 'lifestyle') {
    return baseStyle + 'lifestyle commercial feel, aspirational presentation, ';
  } else if (concepto.transformacionesImagen.estilo === 'corporate') {
    return baseStyle + 'corporate professional standards, business excellence, ';
  }
  
  return baseStyle;
}

/**
 * 💡 Cinematography Prompts (Runway Gen-4 Turbo strengths)
 */
function buildCinematographyPrompt(iluminacion: string, angulo: string): string {
  const lighting = {
    dramatic: 'dramatic professional lighting, high contrast shadows, ',
    soft: 'soft professional lighting, even illumination, ',
    natural: 'natural lighting enhanced for commercial appeal, ',
    corporate: 'bright corporate lighting, professional illumination, ',
    cinematic: 'cinematic lighting with depth and mood, ',
    bright: 'bright even lighting, high-key commercial style, '
  };
  
  const angles = {
    'close-up': 'intimate close-up revealing fine details, ',
    'medium-shot': 'professional medium shot with balanced composition, ',
    'wide-shot': 'expansive wide shot showcasing full environment, ',
    'extreme-close-up': 'extreme close-up highlighting premium details, ',
    'establishing-shot': 'establishing shot setting professional scene, '
  };
  
  return (lighting[iluminacion as keyof typeof lighting] || lighting.corporate) + 
         (angles[angulo as keyof typeof angles] || angles['medium-shot']);
}

/**
 * 📐 Aspect Ratio Logic
 */
function determineAspectRatio(analisisNegocio: any): '16:9' | '9:16' | '1:1' {
  // Default to vertical for social media
  const platforms = analisisNegocio?.preferredPlatforms || ['instagram'];
  
  if (platforms.includes('youtube') || platforms.includes('linkedin')) {
    return '16:9'; // Horizontal for professional platforms
  } else if (platforms.includes('instagram') || platforms.includes('tiktok')) {
    return '9:16'; // Vertical for social media
  }
  
  return '9:16'; // Default vertical for social media dominance
}

/**
 * ⚡ Motion Strength Calculation
 */
function calculateMotionStrength(movimiento: ConceptoVisual['transformacionesImagen']['movimientoCamara']): number {
  const motionStrengths = {
    'static-to-dynamic': 0.4, // Subtle movement
    'zoom-in': 0.6,          // Moderate zoom
    'zoom-out': 0.7,         // Bit more movement
    'pan-right': 0.7,        // Smooth pan
    'pan-left': 0.7,         // Smooth pan
    'dolly-out': 0.8,        // More dramatic movement
    'tilt-up': 0.6,          // Moderate tilt
    'tilt-down': 0.6         // Moderate tilt
  };
  
  return motionStrengths[movimiento] || 0.6;
}

/**
 * 🎯 BUSINESS-SPECIFIC OPTIMIZATIONS
 */
export const RUNWAY_BUSINESS_TEMPLATES = {
  concierge: {
    basePrompt: 'luxury concierge service commercial, ',
    preferredMovements: ['zoom-in', 'dolly-out'],
    optimalMotion: 0.6,
    specialElements: 'premium office environment, sophisticated service presentation'
  },
  
  restaurant: {
    basePrompt: 'gourmet restaurant commercial, ',
    preferredMovements: ['pan-right', 'zoom-in'],
    optimalMotion: 0.7,
    specialElements: 'culinary artistry, food presentation excellence'
  },
  
  boutique: {
    basePrompt: 'fashion boutique commercial, ',
    preferredMovements: ['dolly-out', 'pan-right'],
    optimalMotion: 0.8,
    specialElements: 'fashion styling, retail elegance'
  },
  
  product: {
    basePrompt: 'premium product commercial, ',
    preferredMovements: ['zoom-in', 'static-to-dynamic'],
    optimalMotion: 0.5,
    specialElements: 'product details, craftsmanship focus'
  }
};

/**
 * 🔧 ADVANCED RUNWAY CONFIGURATIONS
 */
export function createAdvancedRunwayRequest(
  baseRequest: RunwayRequest,
  advancedOptions: {
    enhanceQuality?: boolean;
    prioritizeSpeed?: boolean;
    customSeed?: number;
    extendDuration?: boolean;
  }
): RunwayRequest {
  const enhanced = { ...baseRequest };
  
  if (advancedOptions.enhanceQuality) {
    enhanced.motionStrength = Math.min(enhanced.motionStrength + 0.1, 1.0);
    enhanced.promptText += ', ultra-high quality commercial production';
  }
  
  if (advancedOptions.prioritizeSpeed) {
    enhanced.duration = Math.min(enhanced.duration, 5); // Shorter for faster processing
  }
  
  if (advancedOptions.customSeed) {
    enhanced.seed = advancedOptions.customSeed;
  }
  
  if (advancedOptions.extendDuration && enhanced.duration < 15) {
    enhanced.extend_video = true; // Enable video extension
  }
  
  return enhanced;
}

/**
 * ⏱️ RUNWAY API INTERACTION HELPERS
 */
export async function submitRunwayRequest(request: RunwayRequest): Promise<string> {
  console.log(`[Runway] Submitting request: ${request.promptText.substring(0, 50)}...`);
  
  try {
    const response = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      throw new Error(`Runway API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json() as any;
    console.log(`[Runway] Task submitted: ${result.id}`);
    
    return result.id;
    
  } catch (error) {
    console.error('[Runway] Submission error:', error);
    throw error;
  }
}

export async function checkRunwayStatus(taskId: string): Promise<RunwayResponse> {
  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.RUNWAY_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Runway status check error: ${response.status}`);
    }
    
    return await response.json() as RunwayResponse;
    
  } catch (error) {
    console.error(`[Runway] Status check error for task ${taskId}:`, error);
    throw error;
  }
}

/**
 * ⏳ WAIT FOR COMPLETION
 */
export async function waitForRunwayCompletion(taskId: string, maxWaitTime = 300): Promise<string> {
  const startTime = Date.now();
  let attempts = 0;
  const maxAttempts = Math.floor(maxWaitTime / 5); // Check every 5 seconds
  
  while (attempts < maxAttempts) {
    const status = await checkRunwayStatus(taskId);
    
    if (status.status === 'SUCCEEDED') {
      const processingTime = Date.now() - startTime;
      console.log(`[Runway] ✅ Completed in ${Math.round(processingTime / 1000)}s`);
      return status.output![0]; // Return video URL
    } 
    
    if (status.status === 'FAILED') {
      throw new Error(`Runway generation failed: ${status.failure_reason}`);
    }
    
    console.log(`[Runway] ⏳ Status: ${status.status} (attempt ${attempts + 1}/${maxAttempts})`);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;
  }
  
  throw new Error(`Runway generation timeout after ${maxWaitTime}s`);
}
