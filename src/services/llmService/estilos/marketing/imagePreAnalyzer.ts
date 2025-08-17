// 🔍 PRE-ANALIZADOR DE IMÁGENES - PASO FRÍO Y OBJETIVO
// Análisis técnico de imágenes antes del análisis inteligente por LLM

import { callOpenRouter } from '../../openRouterUtil.js';

export interface ImageAnalysisData {
  fileName: string;
  technicalData: {
    dominantColors: string[];
    detectedObjects: string[];
    textContent: string[];
    imageQuality: 'excellent' | 'good' | 'fair' | 'poor';
    lighting: 'natural' | 'artificial' | 'mixed' | 'poor';
    composition: 'professional' | 'amateur' | 'mobile';
  };
  businessElements: {
    category: string;
    brandingVisible: boolean;
    peoplePresent: number;
    isInterior: boolean;
    pricePointIndicators: string[];
  };
  confidence: number; // 0-1
}

export interface BusinessImageSummary {
  totalImages: number;
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  dominantColorPalette: string[];
  primaryCategories: string[];
  brandingConsistency: number; // 0-1
  professionalismScore: number; // 0-1
  keyInsights: string[];
  recommendations: string[];
}

/**
 * PRE-ANÁLISIS OBJETIVO: Extrae datos técnicos duros de las imágenes
 * Sin interpretación subjetiva, solo hechos observables
 */
export async function preAnalyzeImages(
  businessImages: string[],
  businessDescription: string
): Promise<{ analyses: ImageAnalysisData[], summary: BusinessImageSummary }> {
  
  const analyses: ImageAnalysisData[] = [];
  
  // Análisis individual por imagen
  for (let i = 0; i < businessImages.length; i++) {
    const imageUrl = businessImages[i];
    
    const technicalPrompt = `Eres un analizador técnico de imágenes. Analiza OBJETIVAMENTE esta imagen de negocio.

CONTEXTO DEL NEGOCIO: ${businessDescription}

IMAGEN: ${imageUrl}

Devuelve SOLO datos observables técnicos en formato JSON:
{
  "dominantColors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "detectedObjects": ["lista de objetos visibles"],
  "textContent": ["texto visible en la imagen"],
  "imageQuality": "excellent|good|fair|poor",
  "lighting": "natural|artificial|mixed|poor",
  "composition": "professional|amateur|mobile",
  "category": "tipo de negocio detectado",
  "brandingVisible": true/false,
  "peoplePresent": numero_de_personas,
  "isInterior": true/false,
  "pricePointIndicators": ["indicadores de precio"],
  "confidence": 0.0-1.0
}

NO hagas interpretaciones subjetivas. Solo reporta lo que VES.`;

    try {
      const response = await callOpenRouter(
        "Eres un analizador técnico especializado en extraer datos objetivos de imágenes comerciales.",
        technicalPrompt,
        'openai/gpt-4o-mini', // Modelo más barato para análisis técnico
        60000 // 1 minuto timeout
      );

      const analysisData = JSON.parse(response);
      
      analyses.push({
        fileName: `image_${i + 1}`,
        technicalData: {
          dominantColors: analysisData.dominantColors || [],
          detectedObjects: analysisData.detectedObjects || [],
          textContent: analysisData.textContent || [],
          imageQuality: analysisData.imageQuality || 'fair',
          lighting: analysisData.lighting || 'mixed',
          composition: analysisData.composition || 'amateur'
        },
        businessElements: {
          category: analysisData.category || 'unknown',
          brandingVisible: analysisData.brandingVisible || false,
          peoplePresent: analysisData.peoplePresent || 0,
          isInterior: analysisData.isInterior || false,
          pricePointIndicators: analysisData.pricePointIndicators || []
        },
        confidence: analysisData.confidence || 0.5
      });

    } catch (error) {
      console.error(`Error analizando imagen ${i + 1}:`, error);
      
      // Análisis de respaldo básico
      analyses.push({
        fileName: `image_${i + 1}`,
        technicalData: {
          dominantColors: [],
          detectedObjects: [],
          textContent: [],
          imageQuality: 'fair',
          lighting: 'mixed',
          composition: 'amateur'
        },
        businessElements: {
          category: 'unknown',
          brandingVisible: false,
          peoplePresent: 0,
          isInterior: false,
          pricePointIndicators: []
        },
        confidence: 0.3
      });
    }
  }

  // Generar resumen consolidado
  const summary = generateBusinessImageSummary(analyses);

  return { analyses, summary };
}

/**
 * Genera resumen consolidado de todas las imágenes analizadas
 */
function generateBusinessImageSummary(analyses: ImageAnalysisData[]): BusinessImageSummary {
  const totalImages = analyses.length;
  
  // Calidad general
  const qualityScores = analyses.map(a => {
    switch (a.technicalData.imageQuality) {
      case 'excellent': return 4;
      case 'good': return 3;
      case 'fair': return 2;
      case 'poor': return 1;
      default: return 2;
    }
  });
  const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
  const overallQuality = avgQuality >= 3.5 ? 'excellent' : 
                        avgQuality >= 2.5 ? 'good' : 
                        avgQuality >= 1.5 ? 'fair' : 'poor';

  // Paleta de colores dominante
  const allColors = analyses.flatMap(a => a.technicalData.dominantColors);
  const colorFreq = allColors.reduce((acc: Record<string, number>, color) => {
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});
  const dominantColorPalette = Object.entries(colorFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([color]) => color);

  // Categorías principales
  const categories = analyses.map(a => a.businessElements.category);
  const categoryFreq = categories.reduce((acc: Record<string, number>, cat) => {
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const primaryCategories = Object.entries(categoryFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);

  // Consistencia de branding
  const brandingCount = analyses.filter(a => a.businessElements.brandingVisible).length;
  const brandingConsistency = brandingCount / totalImages;

  // Score de profesionalismo
  const profScores = analyses.map(a => {
    let score = 0;
    if (a.technicalData.composition === 'professional') score += 0.4;
    if (a.technicalData.lighting === 'natural' || a.technicalData.lighting === 'artificial') score += 0.3;
    if (a.technicalData.imageQuality === 'excellent' || a.technicalData.imageQuality === 'good') score += 0.3;
    return score;
  });
  const professionalismScore = profScores.reduce((a, b) => a + b, 0) / profScores.length;

  // Insights clave
  const keyInsights: string[] = [];
  if (brandingConsistency > 0.7) {
    keyInsights.push(`Branding consistente en ${Math.round(brandingConsistency * 100)}% de las imágenes`);
  }
  if (professionalismScore > 0.7) {
    keyInsights.push('Calidad visual profesional detectada');
  }
  if (dominantColorPalette.length > 0) {
    keyInsights.push(`Paleta de colores definida: ${dominantColorPalette.slice(0, 3).join(', ')}`);
  }

  // Recomendaciones técnicas
  const recommendations: string[] = [];
  if (overallQuality === 'poor' || overallQuality === 'fair') {
    recommendations.push('Mejorar calidad fotográfica para mayor impacto visual');
  }
  if (brandingConsistency < 0.5) {
    recommendations.push('Incorporar elementos de branding más consistentes');
  }
  if (professionalismScore < 0.5) {
    recommendations.push('Considerar fotografía profesional para mejor presentación');
  }

  return {
    totalImages,
    overallQuality,
    dominantColorPalette,
    primaryCategories,
    brandingConsistency,
    professionalismScore,
    keyInsights,
    recommendations
  };
}

/**
 * Convierte el análisis técnico en un resumen textual para el LLM
 */
export function convertAnalysisToLLMInput(
  businessDescription: string,
  analyses: ImageAnalysisData[],
  summary: BusinessImageSummary
): string {
  return `DATOS TÉCNICOS OBJETIVOS DEL NEGOCIO:

DESCRIPCIÓN: ${businessDescription}

RESUMEN VISUAL (${summary.totalImages} imágenes):
- Calidad general: ${summary.overallQuality}
- Paleta dominante: ${summary.dominantColorPalette.join(', ')}
- Categorías detectadas: ${summary.primaryCategories.join(', ')}
- Consistencia de branding: ${Math.round(summary.brandingConsistency * 100)}%
- Score profesionalismo: ${Math.round(summary.professionalismScore * 100)}%

INSIGHTS TÉCNICOS:
${summary.keyInsights.map(insight => `- ${insight}`).join('\n')}

ANÁLISIS POR IMAGEN:
${analyses.map((analysis, i) => `
Imagen ${i + 1}:
- Objetos: ${analysis.technicalData.detectedObjects.join(', ')}
- Texto visible: ${analysis.technicalData.textContent.join(', ')}
- Calidad: ${analysis.technicalData.imageQuality}
- Personas: ${analysis.businessElements.peoplePresent}
- Interior/Exterior: ${analysis.businessElements.isInterior ? 'Interior' : 'Exterior'}
- Confianza: ${Math.round(analysis.confidence * 100)}%`).join('\n')}

RECOMENDACIONES TÉCNICAS:
${summary.recommendations.map(rec => `- ${rec}`).join('\n')}`;
}
