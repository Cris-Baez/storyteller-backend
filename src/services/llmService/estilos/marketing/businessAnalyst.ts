import { callOpenRouter } from '../../openRouterUtil.js';
import { preAnalyzeImages, convertAnalysisToLLMInput, BusinessImageSummary, ImageAnalysisData } from './imagePreAnalyzer.js';

export interface BusinessAnalysis {
  businessType: 'concierge' | 'restaurant' | 'boutique' | 'services' | 'product' | 'other';
  businessName: string;
  targetAudience: {
    demographic: 'gen-z' | 'millennials' | 'gen-x' | 'high-class' | 'mixed';
    needs: string[];
    painPoints: string[];
    interests: string[];
  };
  competitionAnalysis: {
    strengths: string[];
    opportunities: string[];
    differentiators: string[];
  };
  brandPersonality: 'luxury' | 'casual' | 'professional' | 'friendly' | 'modern' | 'traditional';
  marketingGoals: string[];
  platformSuitability: {
    instagram: number; // 1-10 score
    linkedin: number;
    tiktok: number;
    facebook: number;
  };
  // NUEVOS CAMPOS PARA EVIDENCIA Y CONFIANZA
  evidenceBased: {
    visualData: BusinessImageSummary;
    keyFindings: string[];
    assumptions: string[];
    confidenceLevel: number; // 0-1
    questionsForClient: string[];
  };
}

/**
 * ANÁLISIS MEJORADO: Proceso híbrido en dos pasos
 * 1. Pre-análisis objetivo de imágenes (datos técnicos)
 * 2. Análisis inteligente basado en datos + descripción
 */
export async function analyzeBusinessFromImages(
  images: string[], 
  basicDescription: string
): Promise<BusinessAnalysis> {
  
  console.log('[BusinessAnalyst] Iniciando análisis híbrido en 2 pasos...');
  
  // PASO 1: PRE-ANÁLISIS OBJETIVO DE IMÁGENES
  let imageAnalysis: { analyses: ImageAnalysisData[], summary: BusinessImageSummary } | null = null;
  
  if (images && images.length > 0) {
    console.log(`[BusinessAnalyst] Paso 1: Pre-analizando ${images.length} imágenes...`);
    try {
      imageAnalysis = await preAnalyzeImages(images, basicDescription);
      console.log('[BusinessAnalyst] Pre-análisis completado:', {
        totalImages: imageAnalysis.summary.totalImages,
        overallQuality: imageAnalysis.summary.overallQuality,
        categories: imageAnalysis.summary.primaryCategories
      });
    } catch (error) {
      console.error('[BusinessAnalyst] Error en pre-análisis:', error);
      // Continuar sin análisis de imágenes
    }
  }

  // PASO 2: ANÁLISIS INTELIGENTE CON DATOS OBJETIVOS
  console.log('[BusinessAnalyst] Paso 2: Análisis inteligente basado en evidencia...');
  
  const llmInput = imageAnalysis 
    ? convertAnalysisToLLMInput(basicDescription, imageAnalysis.analyses, imageAnalysis.summary)
    : `DESCRIPCIÓN DEL NEGOCIO: ${basicDescription}\n\nNOTA: Sin imágenes disponibles para análisis visual.`;

  const analysisPrompt = `
Eres un analista de negocios senior especializado en marketing para pequeñas empresas. 

DATOS DISPONIBLES:
${llmInput}

Analiza este negocio y proporciona un análisis estratégico en formato JSON:

{
  "businessType": "concierge|restaurant|boutique|services|product|other",
  "businessName": "nombre extraído o inferido",
  "targetAudience": {
    "demographic": "gen-z|millennials|gen-x|high-class|mixed",
    "needs": ["necesidad primaria 1", "necesidad primaria 2"],
    "painPoints": ["dolor 1", "dolor 2"],
    "interests": ["interés 1", "interés 2"]
  },
  "competitionAnalysis": {
    "strengths": ["fortaleza única 1", "fortaleza única 2"],
    "opportunities": ["oportunidad 1", "oportunidad 2"], 
    "differentiators": ["diferenciador 1", "diferenciador 2"]
  },
  "brandPersonality": "luxury|casual|professional|friendly|modern|traditional",
  "marketingGoals": ["objetivo 1", "objetivo 2"],
  "platformSuitability": {
    "instagram": 8,
    "linkedin": 6, 
    "tiktok": 4,
    "facebook": 5
  },
  "evidenceBased": {
    "keyFindings": ["hallazgo basado en evidencia 1", "hallazgo 2"],
    "assumptions": ["suposición que no está probada 1", "suposición 2"],
    "confidenceLevel": 0.85,
    "questionsForClient": ["¿pregunta para validar 1?", "¿pregunta 2?"]
  }
}

REGLAS CRÍTICAS:
1. Base CADA recomendación en evidencia específica de los datos
2. Separe claramente hechos observados vs suposiciones
3. Indique nivel de confianza basado en calidad/cantidad de datos
4. Genere preguntas específicas para llenar vacíos de información
5. Si faltan datos clave, reduzca confidenceLevel y aumente questionsForClient

EVIDENCIA REQUERIDA:
- Para cada conclusión, cite qué dato específico la respalda
- Si algo es una suposición, márquelo como tal
- Si los datos son limitados, sea honesto sobre las limitaciones
  `;

  try {
    const response = await callOpenRouter(
      'Eres un analista de negocios experto que basa sus recomendaciones en evidencia sólida y siempre indica el nivel de confianza de sus conclusiones.',
      analysisPrompt,
      'openai/gpt-4o' // Modelo más potente para análisis inteligente
    );

    // Parse JSON response
    let analysis: BusinessAnalysis;
    try {
      analysis = JSON.parse(response);
    } catch (parseError) {
      console.error('[BusinessAnalyst] JSON parse error:', parseError);
      // Fallback analysis con evidencia básica
      analysis = createFallbackAnalysis(basicDescription, imageAnalysis?.summary || null);
    }

    // Añadir datos de imagen al evidenceBased
    if (imageAnalysis && analysis.evidenceBased) {
      analysis.evidenceBased.visualData = imageAnalysis.summary;
    }

    console.log('[BusinessAnalyst] Analysis completed:', {
      businessType: analysis.businessType,
      brandPersonality: analysis.brandPersonality,
      topPlatform: Object.entries(analysis.platformSuitability)
        .sort(([,a], [,b]) => b - a)[0]
    });

    return analysis;

  } catch (error) {
    console.error('[BusinessAnalyst] Error analyzing business:', error);
    // Return fallback analysis on error
    return createFallbackAnalysis(basicDescription);
  }
}

/**
 * Creates a fallback analysis when LLM call fails
 */
function createFallbackAnalysis(description: string, imageSummary: BusinessImageSummary | null = null): BusinessAnalysis {
  const lowerDesc = description.toLowerCase();
  
  // Simple business type detection
  let businessType: BusinessAnalysis['businessType'] = 'services';
  if (lowerDesc.includes('concierge')) businessType = 'concierge';
  else if (lowerDesc.includes('restaurant') || lowerDesc.includes('food')) businessType = 'restaurant';
  else if (lowerDesc.includes('boutique') || lowerDesc.includes('fashion')) businessType = 'boutique';
  else if (lowerDesc.includes('product')) businessType = 'product';

  // Simple brand personality detection
  let brandPersonality: BusinessAnalysis['brandPersonality'] = 'professional';
  if (lowerDesc.includes('luxury') || lowerDesc.includes('premium')) brandPersonality = 'luxury';
  else if (lowerDesc.includes('casual') || lowerDesc.includes('fun')) brandPersonality = 'casual';
  else if (lowerDesc.includes('friendly')) brandPersonality = 'friendly';
  else if (lowerDesc.includes('modern')) brandPersonality = 'modern';

  return {
    businessType,
    businessName: 'Business Name', // Will be extracted from context later
    targetAudience: {
      demographic: brandPersonality === 'luxury' ? 'high-class' : 'mixed',
      needs: ['quality service', 'reliability', 'convenience'],
      painPoints: ['lack of time', 'poor service quality', 'high prices'],
      interests: ['quality products', 'good service', 'value']
    },
    competitionAnalysis: {
      strengths: ['personalized service', 'quality focus'],
      opportunities: ['digital marketing', 'social media presence'],
      differentiators: ['customer experience', 'unique value proposition']
    },
    brandPersonality,
    marketingGoals: ['increase brand awareness', 'generate leads', 'improve customer retention'],
    platformSuitability: {
      instagram: 7,
      linkedin: 5,
      tiktok: 6,
      facebook: 6
    },
    evidenceBased: {
      visualData: imageSummary || {
        totalImages: 0,
        overallQuality: 'fair',
        dominantColorPalette: [],
        primaryCategories: [],
        brandingConsistency: 0,
        professionalismScore: 0,
        keyInsights: ['Análisis basado solo en descripción textual'],
        recommendations: ['Proporcionar imágenes para análisis más preciso']
      },
      keyFindings: [
        'Análisis basado únicamente en descripción textual',
        'Requiere validación con imágenes y datos adicionales'
      ],
      assumptions: [
        'Tipo de negocio inferido de palabras clave',
        'Personalidad de marca basada en descripción limitada',
        'Audiencia objetivo estimada por tipo de negocio'
      ],
      confidenceLevel: 0.4, // Baja confianza sin imágenes
      questionsForClient: [
        '¿Cuál es el precio promedio de sus productos/servicios?',
        '¿Quiénes son sus principales competidores?',
        '¿Cuál es su ubicación geográfica principal?',
        '¿Qué edad tienen típicamente sus clientes?',
        '¿Qué canales de marketing usa actualmente?'
      ]
    }
  };
}

/**
 * Updates business analysis with new information
 */
export async function updateBusinessAnalysis(
  currentAnalysis: BusinessAnalysis,
  newInformation: string
): Promise<BusinessAnalysis> {
  
  const updatePrompt = `
Update this business analysis with new information:

CURRENT ANALYSIS: ${JSON.stringify(currentAnalysis, null, 2)}

NEW INFORMATION: "${newInformation}"

Please provide the updated analysis in the same JSON format, incorporating the new information while maintaining consistency with the existing analysis.
  `;

  try {
    const response = await callOpenRouter(
      'You are a world-class Business Analyst specialized in marketing strategy and customer analysis.',
      updatePrompt,
      'openai/gpt-4-turbo'
    );

    const updatedAnalysis = JSON.parse(response);
    console.log('[BusinessAnalyst] Analysis updated with new information');
    return updatedAnalysis;

  } catch (error) {
    console.error('[BusinessAnalyst] Error updating analysis:', error);
    return currentAnalysis; // Return original on error
  }
}
