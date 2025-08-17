import { callOpenRouter } from '../../openRouterUtil.js';

// 🎬 CONCEPTO VISUAL COMPLETO - SEGÚN ROADMAP FASE 4
export interface ConceptoVisual {
  transformacionesImagen: {
    movimientoCamara: 'zoom-in' | 'pan-right' | 'dolly-out' | 'static-to-dynamic' | 'pan-left' | 'zoom-out' | 'tilt-up' | 'tilt-down';
    transiciones: 'smooth' | 'quick-cut' | 'fade' | 'slide' | 'cross-dissolve';
    efectosVisuales: string[];
    anguloCamara: 'close-up' | 'medium-shot' | 'wide-shot' | 'extreme-close-up' | 'establishing-shot';
    iluminacion: 'dramatic' | 'soft' | 'natural' | 'corporate' | 'cinematic' | 'bright';
    estilo: 'commercial' | 'lifestyle' | 'corporate' | 'artistic' | 'documentary';
  };
  musicaRecomendada: {
    genero: 'corporate' | 'upbeat' | 'elegant' | 'modern' | 'dramatic' | 'ambient';
    intensidad: 'sutil' | 'media' | 'energetica';
    duracion: number;
  };
  palettaColores: string[];
  overlayTextos: OverlayConfig[];
  engineRecommendation: {
    preferredEngine: 'runway' | 'kling';
    reason: string;
    confidence: number; // 0-1
  };
  requiresActors: boolean;
  visualComplexity: 'simple' | 'moderate' | 'complex';
}

export interface OverlayConfig {
  texto: string;
  posicion: 'top' | 'center' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  timing: {
    inicio: number; // seconds
    duracion: number; // seconds
  };
  estilo: {
    fontSize: number;
    color: string;
    backgroundColor?: string;
    fontWeight: 'normal' | 'bold' | 'light';
    animation: 'fade-in' | 'slide-in' | 'zoom-in' | 'none';
  };
}

// Legacy interface for backward compatibility
export interface CreativeDirection {
  theme: string;
  visualStyle: 'cinematic' | 'elegant' | 'minimalist' | 'vibrant' | 'luxury';
  moodBoard: {
    colors: string[];
    lighting: string;
    composition: string;
    energy: 'calm' | 'energetic' | 'dramatic' | 'playful';
  };
  concepts: {
    primary: string;
    secondary: string[];
    hooks: string[];
  };
  brandPersonality: {
    voice: string;
    tone: string;
    values: string[];
  };
  execution: {
    videoStyle: string;
    duration: number;
    callToAction: string;
    keyMessages: string[];
  };
  adaptations: {
    social: string[];
    email: string;
    website: string;
  };
}

/**
 * 🎬 FUNCIÓN PRINCIPAL - GENERAR CONCEPTOS VISUALES CON CAMERA MOVEMENTS
 * Convierte imágenes estáticas en conceptos dinámicos para Runway/Kling
 */
export async function convertirImagenesEstaticasADinamicas(
  imagenes: string[], 
  estrategia: any,
  businessAnalysis: any
): Promise<ConceptoVisual[]> {
  const conceptos: ConceptoVisual[] = [];

  for (let i = 0; i < imagenes.length; i++) {
    const imagen = imagenes[i];
    
    const prompt = `
      You are a world-class Creative Director specializing in cinematic video generation for commercial marketing.
      
      BUSINESS CONTEXT: ${JSON.stringify(businessAnalysis, null, 2)}
      CONTENT STRATEGY: ${JSON.stringify(estrategia, null, 2)}
      
      Create a CINEMATIC VISUAL CONCEPT for transforming this static business image into a dynamic commercial video.
      
      Image ${i + 1}: Professional business image (assume it shows ${businessAnalysis?.businessType || 'business'} environment)
      
      Generate specific camera movements and cinematic details:
      
      1. CAMERA MOVEMENT: Choose the most compelling movement for this business type
         - zoom-in: Reveal intricate details and craftsmanship
         - pan-right/pan-left: Showcase environment and scale  
         - dolly-out: Reveal full scope and grandeur
         - static-to-dynamic: Bring subtle life to still scenes
         - tilt-up/tilt-down: Add dramatic perspective
         - zoom-out: Show context and bigger picture
      
      2. CINEMATOGRAPHY: Professional commercial standards
         - Camera angle: close-up, medium-shot, wide-shot, extreme-close-up, establishing-shot
         - Lighting: dramatic, soft, natural, corporate, cinematic, bright
         - Style: commercial, lifestyle, corporate, artistic, documentary
      
      3. ENGINE RECOMMENDATION: 
         - RUNWAY Gen-4 Turbo: Perfect for static-to-dynamic, simple movements, product focus
         - KLING Elements: Better for complex scenes, actors, narrative sequences
      
      4. VISUAL COMPLEXITY: Analyze if this requires simple, moderate, or complex processing
      
      5. OVERLAY TEXTS: Create compelling commercial text overlays with timing
      
      BUSINESS TYPE: ${businessAnalysis?.businessType || 'general business'}
      TARGET AUDIENCE: ${businessAnalysis?.targetAudience?.demographic || 'professional'}
      BRAND PERSONALITY: ${businessAnalysis?.brandPersonality || 'professional'}
      
      Return as valid JSON matching ConceptoVisual interface exactly.
      Focus on COMMERCIAL EFFECTIVENESS and CINEMATIC QUALITY.
    `;

    try {
      const response = await callOpenRouter(
        'You are a world-class Creative Director specializing in cinematic commercial video generation.',
        prompt,
        'anthropic/claude-3.5-sonnet'
      );

      const concepto = JSON.parse(response);
      
      // Validate and ensure all required fields with smart defaults
      const conceptoCompleto: ConceptoVisual = {
        transformacionesImagen: {
          movimientoCamara: concepto.transformacionesImagen?.movimientoCamara || 'zoom-in',
          transiciones: concepto.transformacionesImagen?.transiciones || 'smooth',
          efectosVisuales: concepto.transformacionesImagen?.efectosVisuales || ['professional lighting', 'color grading'],
          anguloCamara: concepto.transformacionesImagen?.anguloCamara || 'medium-shot',
          iluminacion: concepto.transformacionesImagen?.iluminacion || 'corporate',
          estilo: concepto.transformacionesImagen?.estilo || 'commercial'
        },
        musicaRecomendada: {
          genero: concepto.musicaRecomendada?.genero || 'corporate',
          intensidad: concepto.musicaRecomendada?.intensidad || 'media',
          duracion: concepto.musicaRecomendada?.duracion || 10
        },
        palettaColores: concepto.palettaColores || ['#1a1a1a', '#ffffff', '#3b82f6'],
        overlayTextos: concepto.overlayTextos || [{
          texto: businessAnalysis?.brandPersonality === 'luxury' ? 'Premium Experience' : 'Professional Excellence',
          posicion: 'bottom',
          timing: { inicio: 2, duracion: 3 },
          estilo: {
            fontSize: 24,
            color: '#ffffff',
            fontWeight: 'bold',
            animation: 'fade-in'
          }
        }],
        engineRecommendation: {
          preferredEngine: concepto.engineRecommendation?.preferredEngine || 'runway',
          reason: concepto.engineRecommendation?.reason || 'Optimal for static-to-dynamic commercial content',
          confidence: concepto.engineRecommendation?.confidence || 0.8
        },
        requiresActors: concepto.requiresActors || false,
        visualComplexity: concepto.visualComplexity || 'simple'
      };
      
      conceptos.push(conceptoCompleto);
      
    } catch (error) {
      console.error(`Error generando concepto visual ${i + 1}:`, error);
      
      // Fallback concepto with business-appropriate defaults
      conceptos.push(createFallbackConcepto(businessAnalysis, i));
    }
  }

  return conceptos;
}

/**
 * 🛡️ FALLBACK - Concepto por defecto si falla la generación AI
 */
function createFallbackConcepto(businessAnalysis: any, index: number): ConceptoVisual {
  const businessType = businessAnalysis?.businessType || 'general';
  const brandPersonality = businessAnalysis?.brandPersonality || 'professional';
  
  // Camera movement basado en tipo de negocio
  let movimiento: ConceptoVisual['transformacionesImagen']['movimientoCamara'] = 'zoom-in';
  if (businessType === 'restaurant') movimiento = 'pan-right';
  if (businessType === 'boutique') movimiento = 'dolly-out';
  if (businessType === 'concierge' && brandPersonality === 'luxury') movimiento = 'zoom-in';
  
  return {
    transformacionesImagen: {
      movimientoCamara: movimiento,
      transiciones: 'smooth',
      efectosVisuales: ['professional lighting', 'subtle color enhancement'],
      anguloCamara: 'medium-shot',
      iluminacion: brandPersonality === 'luxury' ? 'cinematic' : 'corporate',
      estilo: 'commercial'
    },
    musicaRecomendada: {
      genero: brandPersonality === 'luxury' ? 'elegant' : 'corporate',
      intensidad: 'media',
      duracion: 10
    },
    palettaColores: brandPersonality === 'luxury' ? ['#000000', '#d4af37', '#ffffff'] : ['#1a1a1a', '#ffffff', '#3b82f6'],
    overlayTextos: [{
      texto: brandPersonality === 'luxury' ? 'Luxury Experience' : 'Professional Excellence',
      posicion: 'bottom',
      timing: { inicio: 2, duracion: 3 },
      estilo: {
        fontSize: 24,
        color: '#ffffff',
        fontWeight: 'bold',
        animation: 'fade-in'
      }
    }],
    engineRecommendation: {
      preferredEngine: 'runway',
      reason: 'Safe default for commercial content',
      confidence: 0.7
    },
    requiresActors: false,
    visualComplexity: 'simple'
  };
}

/**
 * 📊 LEGACY FUNCTION - Mantener compatibilidad con código existente
 */
export async function createCreativeDirection(businessAnalysis: any, contentStrategy: any): Promise<CreativeDirection> {
  const prompt = `
    You are a world-class Creative Director specializing in video marketing and brand storytelling.
    
    Based on this business analysis and content strategy, create a comprehensive creative direction:
    
    BUSINESS: ${JSON.stringify(businessAnalysis, null, 2)}
    STRATEGY: ${JSON.stringify(contentStrategy, null, 2)}
    You are a world-class Creative Director specializing in video marketing and brand storytelling.
    
    Based on this business analysis and content strategy, create a comprehensive creative direction:
    
    BUSINESS: ${JSON.stringify(businessAnalysis, null, 2)}
    STRATEGY: ${JSON.stringify(contentStrategy, null, 2)}
    
    Create a creative direction that includes:
    1. THEME: Core creative theme that connects with the target audience
    2. VISUAL STYLE: Choose from cinematic, elegant, minimalist, vibrant, or luxury
    3. MOOD BOARD: Colors, lighting, composition, and energy level
    4. CONCEPTS: Primary concept and supporting secondary concepts with hooks
    5. BRAND PERSONALITY: Voice, tone, and core values
    6. EXECUTION: Video style, duration, CTA, and key messages
    7. ADAPTATIONS: How to adapt for different channels
    
    Focus on emotional connection and conversion optimization.
    Make it practical and actionable for video production.
    
    Return as valid JSON matching the CreativeDirection interface.
  `;

  try {
    const response = await callOpenRouter(
      'You are a world-class Creative Director specializing in video marketing and brand storytelling.',
      prompt,
      'anthropic/claude-3.5-sonnet'
    );

    const creativeDirection = JSON.parse(response);
    
    // Validate and ensure all required fields
    return {
      theme: creativeDirection.theme || 'Professional Excellence',
      visualStyle: creativeDirection.visualStyle || 'cinematic',
      moodBoard: {
        colors: creativeDirection.moodBoard?.colors || ['#1a1a1a', '#ffffff', '#3b82f6'],
        lighting: creativeDirection.moodBoard?.lighting || 'soft professional',
        composition: creativeDirection.moodBoard?.composition || 'centered with depth',
        energy: creativeDirection.moodBoard?.energy || 'energetic'
      },
      concepts: {
        primary: creativeDirection.concepts?.primary || 'Transform Your Business',
        secondary: creativeDirection.concepts?.secondary || ['Innovation', 'Growth', 'Excellence'],
        hooks: creativeDirection.concepts?.hooks || ['Ready to transform?', 'See the difference']
      },
      brandPersonality: {
        voice: creativeDirection.brandPersonality?.voice || 'confident and approachable',
        tone: creativeDirection.brandPersonality?.tone || 'professional yet warm',
        values: creativeDirection.brandPersonality?.values || ['Quality', 'Innovation', 'Trust']
      },
      execution: {
        videoStyle: creativeDirection.execution?.videoStyle || 'high-energy showcase',
        duration: creativeDirection.execution?.duration || 30,
        callToAction: creativeDirection.execution?.callToAction || 'Get Started Today',
        keyMessages: creativeDirection.execution?.keyMessages || ['Quality results', 'Trusted expertise']
      },
      adaptations: {
        social: creativeDirection.adaptations?.social || ['Instagram Stories', 'LinkedIn Posts', 'Facebook Ads'],
        email: creativeDirection.adaptations?.email || 'Professional newsletter style',
        website: creativeDirection.adaptations?.website || 'Hero section video'
      }
    };
  } catch (error) {
    console.error('Creative Director AI Error:', error);
    
    // Fallback creative direction based on business type
    const businessType = businessAnalysis?.businessType || 'service';
    const isLuxury = businessAnalysis?.targetAudience?.income === 'high' || 
                     businessAnalysis?.pricePoint === 'premium';
    
    return {
      theme: isLuxury ? 'Premium Excellence' : 'Professional Growth',
      visualStyle: isLuxury ? 'luxury' : 'cinematic',
      moodBoard: {
        colors: isLuxury ? ['#000000', '#gold', '#ffffff'] : ['#1a1a1a', '#3b82f6', '#ffffff'],
        lighting: isLuxury ? 'dramatic with gold accents' : 'bright professional',
        composition: 'centered with movement',
        energy: isLuxury ? 'dramatic' : 'energetic'
      },
      concepts: {
        primary: isLuxury ? 'Exclusive Excellence' : 'Transform Your Business',
        secondary: isLuxury ? ['Prestige', 'Exclusivity', 'Luxury'] : ['Growth', 'Innovation', 'Results'],
        hooks: isLuxury ? ['Experience luxury', 'Join the elite'] : ['Ready to grow?', 'See results']
      },
      brandPersonality: {
        voice: isLuxury ? 'sophisticated and exclusive' : 'confident and approachable',
        tone: isLuxury ? 'premium and aspirational' : 'professional and energetic',
        values: isLuxury ? ['Exclusivity', 'Prestige', 'Quality'] : ['Innovation', 'Results', 'Growth']
      },
      execution: {
        videoStyle: isLuxury ? 'cinematic luxury showcase' : 'dynamic business showcase',
        duration: 30,
        callToAction: isLuxury ? 'Experience Excellence' : 'Start Your Journey',
        keyMessages: isLuxury ? ['Unmatched quality', 'Exclusive service'] : ['Proven results', 'Expert guidance']
      },
      adaptations: {
        social: isLuxury ? ['LinkedIn Premium', 'Instagram Luxury'] : ['LinkedIn Business', 'Facebook Ads', 'Instagram'],
        email: isLuxury ? 'Exclusive newsletter with premium design' : 'Professional growth-focused email',
        website: isLuxury ? 'Full-screen cinematic hero' : 'Engaging hero section with CTA'
      }
    };
  }
}

export async function refineCreativeDirection(
  creativeDirection: CreativeDirection, 
  feedback: string
): Promise<CreativeDirection> {
  const prompt = `
    You are a Creative Director refining a creative direction based on feedback.
    
    CURRENT DIRECTION: ${JSON.stringify(creativeDirection, null, 2)}
    FEEDBACK: ${feedback}
    
    Refine the creative direction incorporating the feedback while maintaining:
    - Brand consistency
    - Target audience appeal
    - Conversion optimization
    - Production feasibility
    
    Return the refined CreativeDirection as valid JSON.
  `;

  try {
    const response = await callOpenRouter(
      'You are a Creative Director refining a creative direction based on feedback.',
      prompt,
      'anthropic/claude-3.5-sonnet'
    );

    return JSON.parse(response);
  } catch (error) {
    console.error('Creative Direction Refinement Error:', error);
    return creativeDirection; // Return original if refinement fails
  }
}
