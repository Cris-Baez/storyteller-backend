/**
 * 🧠 SELECTOR INTELIGENTE DE ENGINE - ROADMAP FASE 4
 * Decide automáticamente entre Runway Gen-4 Turbo vs Kling Elements
 * basado en análisis de contenido y tipo de negocio
 */

import { ConceptoVisual } from '../llmService/estilos/marketing/creativeDirector.js';

export interface ContentAnalysis {
  requiresActors: boolean;
  movementType: 'static-to-dynamic' | 'camera-movement' | 'object-animation' | 'scene-transition';
  visualComplexity: 'simple' | 'moderate' | 'complex';
  commercialStyle: 'product-focus' | 'lifestyle' | 'corporate' | 'artistic';
  businessContext: {
    type: string;
    brandPersonality: string;
    targetAudience: string;
  };
}

export interface EngineRecommendation {
  selectedEngine: 'runway' | 'kling';
  confidence: number; // 0-1
  reasoning: string;
  alternativeEngine: 'runway' | 'kling';
  costEstimate: {
    runway: number;
    kling: number;
    recommended: number;
  };
  timeEstimate: {
    runway: number; // seconds
    kling: number; // seconds  
    recommended: number;
  };
}

/**
 * 🎯 FUNCIÓN PRINCIPAL - Selecciona el engine óptimo
 */
export function selectOptimalEngine(concepto: ConceptoVisual, analisisNegocio: any): EngineRecommendation {
  const contentAnalysis = analyzeContent(concepto, analisisNegocio);
  
  // 🚀 RUNWAY Gen-4 Turbo es PERFECTO para:
  const runwayScore = calculateRunwayScore(contentAnalysis, concepto);
  
  // 🎬 KLING Elements es mejor para:
  const klingScore = calculateKlingScore(contentAnalysis, concepto);
  
  const selectedEngine = runwayScore >= klingScore ? 'runway' : 'kling';
  const confidence = Math.max(runwayScore, klingScore);
  
  return {
    selectedEngine,
    confidence,
    reasoning: generateReasoning(contentAnalysis, selectedEngine, runwayScore, klingScore),
    alternativeEngine: selectedEngine === 'runway' ? 'kling' : 'runway',
    costEstimate: {
      runway: 2.50, // USD per 10-second clip
      kling: 4.00,  // USD per 10-second clip
      recommended: selectedEngine === 'runway' ? 2.50 : 4.00
    },
    timeEstimate: {
      runway: 45,   // seconds average
      kling: 180,   // seconds average
      recommended: selectedEngine === 'runway' ? 45 : 180
    }
  };
}

/**
 * 📊 Analiza el contenido para determinar requirements
 */
function analyzeContent(concepto: ConceptoVisual, analisisNegocio: any): ContentAnalysis {
  // Detect movement type based on camera movement
  let movementType: ContentAnalysis['movementType'] = 'static-to-dynamic';
  
  switch (concepto.transformacionesImagen.movimientoCamara) {
    case 'zoom-in':
    case 'zoom-out':
    case 'static-to-dynamic':
      movementType = 'static-to-dynamic';
      break;
    case 'pan-right':
    case 'pan-left':
    case 'tilt-up':
    case 'tilt-down':
    case 'dolly-out':
      movementType = 'camera-movement';
      break;
    default:
      movementType = 'static-to-dynamic';
  }
  
  // Determine commercial style
  let commercialStyle: ContentAnalysis['commercialStyle'] = 'corporate';
  
  if (concepto.transformacionesImagen.estilo === 'commercial') {
    commercialStyle = 'product-focus';
  } else if (concepto.transformacionesImagen.estilo === 'lifestyle') {
    commercialStyle = 'lifestyle';
  } else if (concepto.transformacionesImagen.estilo === 'artistic') {
    commercialStyle = 'artistic';
  }
  
  return {
    requiresActors: concepto.requiresActors,
    movementType,
    visualComplexity: concepto.visualComplexity,
    commercialStyle,
    businessContext: {
      type: analisisNegocio?.businessType || 'general',
      brandPersonality: analisisNegocio?.brandPersonality || 'professional',
      targetAudience: analisisNegocio?.targetAudience?.demographic || 'general'
    }
  };
}

/**
 * 🚀 Calcula score para Runway Gen-4 Turbo (0-1)
 */
function calculateRunwayScore(analysis: ContentAnalysis, concepto: ConceptoVisual): number {
  let score = 0.5; // Base score
  
  // ✅ RUNWAY ES PERFECTO PARA:
  
  // 1. Sin actores (+0.25)
  if (!analysis.requiresActors) {
    score += 0.25;
  }
  
  // 2. Movimientos static-to-dynamic (+0.2)
  if (analysis.movementType === 'static-to-dynamic') {
    score += 0.2;
  }
  
  // 3. Complejidad simple o moderate (+0.15)
  if (analysis.visualComplexity === 'simple') {
    score += 0.15;
  } else if (analysis.visualComplexity === 'moderate') {
    score += 0.1;
  }
  
  // 4. Estilo comercial/producto (+0.15)
  if (analysis.commercialStyle === 'product-focus' || analysis.commercialStyle === 'corporate') {
    score += 0.15;
  }
  
  // 5. Movimientos específicos que Runway maneja muy bien (+0.1)
  const excellentMovements = ['zoom-in', 'zoom-out', 'static-to-dynamic'];
  if (excellentMovements.includes(concepto.transformacionesImagen.movimientoCamara)) {
    score += 0.1;
  }
  
  // 6. Negocios tipo producto/servicio simple (+0.05)
  const runwayFriendlyBusiness = ['boutique', 'restaurant', 'product', 'retail'];
  if (runwayFriendlyBusiness.includes(analysis.businessContext.type)) {
    score += 0.05;
  }
  
  // ❌ PENALIZACIONES PARA RUNWAY:
  
  // 1. Con actores (-0.3)
  if (analysis.requiresActors) {
    score -= 0.3;
  }
  
  // 2. Complejidad alta (-0.2)  
  if (analysis.visualComplexity === 'complex') {
    score -= 0.2;
  }
  
  // 3. Estilo artístico complejo (-0.1)
  if (analysis.commercialStyle === 'artistic') {
    score -= 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * 🎬 Calcula score para Kling Elements (0-1)
 */
function calculateKlingScore(analysis: ContentAnalysis, concepto: ConceptoVisual): number {
  let score = 0.5; // Base score
  
  // ✅ KLING ES PERFECTO PARA:
  
  // 1. Con actores/personas (+0.3)
  if (analysis.requiresActors) {
    score += 0.3;
  }
  
  // 2. Complejidad alta (+0.25)
  if (analysis.visualComplexity === 'complex') {
    score += 0.25;
  } else if (analysis.visualComplexity === 'moderate') {
    score += 0.1;
  }
  
  // 3. Movimientos cinematográficos complejos (+0.2)
  if (analysis.movementType === 'scene-transition' || analysis.movementType === 'object-animation') {
    score += 0.2;
  }
  
  // 4. Estilo artístico/lifestyle (+0.15)
  if (analysis.commercialStyle === 'artistic' || analysis.commercialStyle === 'lifestyle') {
    score += 0.15;
  }
  
  // 5. Movimientos cinematográficos (+0.1)
  const cinematicMovements = ['dolly-out', 'pan-right', 'pan-left', 'tilt-up', 'tilt-down'];
  if (cinematicMovements.includes(concepto.transformacionesImagen.movimientoCamara)) {
    score += 0.1;
  }
  
  // 6. Negocios complejos (+0.05)
  const klingFriendlyBusiness = ['concierge', 'consulting', 'services', 'hospitality'];
  if (klingFriendlyBusiness.includes(analysis.businessContext.type)) {
    score += 0.05;
  }
  
  // ❌ PENALIZACIONES PARA KLING:
  
  // 1. Sin actores y movimiento simple (-0.2)
  if (!analysis.requiresActors && analysis.visualComplexity === 'simple') {
    score -= 0.2;
  }
  
  // 2. Solo enfoque producto simple (-0.15)
  if (analysis.commercialStyle === 'product-focus' && analysis.visualComplexity === 'simple') {
    score -= 0.15;
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * 💬 Genera explicación humana de la decisión
 */
function generateReasoning(
  analysis: ContentAnalysis, 
  selectedEngine: 'runway' | 'kling',
  runwayScore: number,
  klingScore: number
): string {
  const reasons: string[] = [];
  
  if (selectedEngine === 'runway') {
    reasons.push('🚀 Runway Gen-4 Turbo selected:');
    
    if (!analysis.requiresActors) {
      reasons.push('• No actors required - Runway excels at image-to-video');
    }
    
    if (analysis.movementType === 'static-to-dynamic') {
      reasons.push('• Static-to-dynamic transformation - Runway specialty');
    }
    
    if (analysis.visualComplexity === 'simple') {
      reasons.push('• Simple visual complexity - Runway is faster and cost-effective');
    }
    
    if (analysis.commercialStyle === 'product-focus') {
      reasons.push('• Product-focused commercial - Runway optimized for this');
    }
    
    reasons.push(`• Speed advantage: ~45s vs ~180s processing time`);
    reasons.push(`• Cost advantage: $2.50 vs $4.00 per clip`);
    
  } else {
    reasons.push('🎬 Kling Elements selected:');
    
    if (analysis.requiresActors) {
      reasons.push('• Requires actors - Kling superior for lip sync and human movement');
    }
    
    if (analysis.visualComplexity === 'complex') {
      reasons.push('• Complex visual requirements - Kling handles better');
    }
    
    if (analysis.commercialStyle === 'artistic' || analysis.commercialStyle === 'lifestyle') {
      reasons.push('• Artistic/lifestyle style - Kling excels at cinematic quality');
    }
    
    if (analysis.movementType === 'scene-transition') {
      reasons.push('• Scene transitions needed - Kling specialty');
    }
    
    reasons.push(`• Quality advantage: Superior for complex scenes`);
    reasons.push(`• Worth extra cost and time for this content type`);
  }
  
  reasons.push(`\nConfidence: ${Math.round((Math.max(runwayScore, klingScore)) * 100)}%`);
  reasons.push(`Alternative: ${selectedEngine === 'runway' ? 'Kling' : 'Runway'} (${Math.round((Math.min(runwayScore, klingScore)) * 100)}%)`);
  
  return reasons.join('\n');
}

/**
 * 🎯 CASOS DE USO ESPECÍFICOS POR ENGINE
 */
export const ENGINE_USE_CASES = {
  runway: {
    perfect_for: [
      'Static product photos → dynamic videos',
      'Office/business space showcases',
      'Simple camera movements (zoom, pan)',
      'Commercial content without actors',
      'Quick turnaround needs',
      'Budget-conscious projects'
    ],
    examples: {
      concierge: 'Elegant office zoom-in revealing luxury details',
      restaurant: 'Smooth pan across gourmet dish presentation',
      boutique: 'Zoom-in on fashion pieces with subtle movement',
      product: '360-degree reveal of product features'
    }
  },
  kling: {
    perfect_for: [
      'Content with people/actors',
      'Complex scene transitions', 
      'Cinematic storytelling',
      'Lifestyle and artistic content',
      'Premium quality requirements',
      'Narrative-driven videos'
    ],
    examples: {
      concierge: 'Professional testimonial with lip sync',
      restaurant: 'Chef preparing dish with multiple angles',
      boutique: 'Model wearing clothes in lifestyle setting',
      services: 'Client consultation scene with dialogue'
    }
  }
};

/**
 * 📊 ANALYTICS - Track engine performance
 */
export function trackEnginePerformance(metrics: {
  engineUsed: 'runway' | 'kling';
  processingTime: number;
  qualityScore: number;
  costEfficiency: number;
  userSatisfaction?: number;
  businessType: string;
  contentType: string;
}) {
  console.log(`[EngineSelector Analytics] Engine: ${metrics.engineUsed}`);
  console.log(`  Business: ${metrics.businessType}, Content: ${metrics.contentType}`);
  console.log(`  Performance: Quality=${metrics.qualityScore}, Time=${metrics.processingTime}s, Cost=${metrics.costEfficiency}`);
  console.log(`  User Satisfaction: ${metrics.userSatisfaction || 'pending'}`);
  
  // TODO: Send to analytics service for ML optimization
  // This data will be used to continuously improve the selector algorithm
}
