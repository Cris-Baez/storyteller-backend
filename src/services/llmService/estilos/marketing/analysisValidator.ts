// 🧪 SISTEMA DE VALIDACIÓN Y TESTING DEL ANÁLISIS DE NEGOCIO
// Implementa el "botón de prueba" interno y métricas de calidad

import { analyzeBusinessFromImages, BusinessAnalysis } from './businessAnalyst.js';
import { BusinessImageSummary } from './imagePreAnalyzer.js';

export interface AnalysisValidationResult {
  testId: string;
  timestamp: Date;
  inputData: {
    description: string;
    imageCount: number;
    imageUrls: string[];
  };
  result: {
    analysis: BusinessAnalysis;
    processingTime: number;
    confidence: number;
    qualityScore: number; // 0-1
  };
  validation: {
    evidenceQuality: number; // 0-1
    assumptionRatio: number; // 0-1 (menos asunciones = mejor)
    completeness: number; // 0-1
    consistency: number; // 0-1
    questionsGeneratedCount: number;
  };
  recommendations: string[];
  issues: string[];
}

export interface AnalysisPerformanceMetrics {
  totalTests: number;
  avgProcessingTime: number;
  avgConfidence: number;
  avgQualityScore: number;
  successRate: number; // % de análisis válidos
  costPerAnalysis: number;
  trendsOverTime: {
    date: Date;
    qualityScore: number;
    processingTime: number;
  }[];
}

/**
 * BOTÓN DE PRUEBA INTERNO: Ejecuta análisis con datos de ejemplo
 * y valida la calidad del resultado
 */
export async function runValidationTest(
  testDescription: string,
  testImages: string[],
  expectedBusinessType?: string
): Promise<AnalysisValidationResult> {
  
  const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  console.log(`[ValidationTest] Iniciando test: ${testId}`);
  
  try {
    // Ejecutar análisis
    const analysis = await analyzeBusinessFromImages(testImages, testDescription);
    const processingTime = Date.now() - startTime;
    
    // Validar calidad del análisis
    const validation = validateAnalysisQuality(analysis);
    
    // Calcular score general de calidad
    const qualityScore = calculateQualityScore(analysis, validation);
    
    // Generar recomendaciones de mejora
    const recommendations = generateImprovementRecommendations(analysis, validation);
    
    // Detectar problemas
    const issues = detectAnalysisIssues(analysis, validation, expectedBusinessType);
    
    const result: AnalysisValidationResult = {
      testId,
      timestamp: new Date(),
      inputData: {
        description: testDescription,
        imageCount: testImages.length,
        imageUrls: testImages
      },
      result: {
        analysis,
        processingTime,
        confidence: analysis.evidenceBased.confidenceLevel,
        qualityScore
      },
      validation,
      recommendations,
      issues
    };
    
    console.log(`[ValidationTest] Completado: ${testId}`, {
      processingTime: `${processingTime}ms`,
      qualityScore: qualityScore.toFixed(2),
      confidence: analysis.evidenceBased.confidenceLevel.toFixed(2),
      issuesFound: issues.length
    });
    
    return result;
    
  } catch (error: any) {
    console.error(`[ValidationTest] Error en test ${testId}:`, error);
    
    return {
      testId,
      timestamp: new Date(),
      inputData: {
        description: testDescription,
        imageCount: testImages.length,
        imageUrls: testImages
      },
      result: {
        analysis: {} as BusinessAnalysis,
        processingTime: Date.now() - startTime,
        confidence: 0,
        qualityScore: 0
      },
      validation: {
        evidenceQuality: 0,
        assumptionRatio: 1,
        completeness: 0,
        consistency: 0,
        questionsGeneratedCount: 0
      },
      recommendations: ['Revisar sistema de análisis - falló completamente'],
      issues: [`Error crítico: ${error?.message || 'Error desconocido'}`]
    };
  }
}

/**
 * Valida la calidad de un análisis basado en evidencia
 */
function validateAnalysisQuality(analysis: BusinessAnalysis) {
  const evidence = analysis.evidenceBased;
  
  // Calidad de evidencia (¿están bien respaldadas las conclusiones?)
  const evidenceQuality = Math.min(1, evidence.keyFindings.length / 5) * 
                         (evidence.visualData?.keyInsights.length || 0) / 5;
  
  // Ratio de asunciones (menos es mejor)
  const totalClaims = evidence.keyFindings.length + evidence.assumptions.length;
  const assumptionRatio = totalClaims > 0 ? evidence.assumptions.length / totalClaims : 1;
  
  // Completitud (¿están llenos todos los campos importantes?)
  let completenessScore = 0;
  if (analysis.businessName && analysis.businessName !== 'Business Name') completenessScore += 0.2;
  if (analysis.targetAudience.needs.length >= 2) completenessScore += 0.2;
  if (analysis.competitionAnalysis.strengths.length >= 2) completenessScore += 0.2;
  if (analysis.marketingGoals.length >= 2) completenessScore += 0.2;
  if (evidence.questionsForClient.length >= 3) completenessScore += 0.2;
  
  // Consistencia (¿coincide businessType con brandPersonality?)
  let consistencyScore = 1;
  if (analysis.brandPersonality === 'luxury' && analysis.targetAudience.demographic !== 'high-class') {
    consistencyScore -= 0.3;
  }
  if (analysis.businessType === 'restaurant' && analysis.platformSuitability.linkedin > 8) {
    consistencyScore -= 0.2;
  }
  
  return {
    evidenceQuality: Math.max(0, Math.min(1, evidenceQuality)),
    assumptionRatio: Math.max(0, Math.min(1, assumptionRatio)),
    completeness: completenessScore,
    consistency: Math.max(0, consistencyScore),
    questionsGeneratedCount: evidence.questionsForClient.length
  };
}

/**
 * Calcula un score general de calidad (0-1)
 */
function calculateQualityScore(analysis: BusinessAnalysis, validation: any): number {
  const weights = {
    confidence: 0.25,
    evidenceQuality: 0.25,
    completeness: 0.25,
    consistency: 0.15,
    lowAssumptions: 0.10 // Bonus por pocas asunciones
  };
  
  const lowAssumptionBonus = Math.max(0, 1 - validation.assumptionRatio);
  
  return (
    analysis.evidenceBased.confidenceLevel * weights.confidence +
    validation.evidenceQuality * weights.evidenceQuality +
    validation.completeness * weights.completeness +
    validation.consistency * weights.consistency +
    lowAssumptionBonus * weights.lowAssumptions
  );
}

/**
 * Genera recomendaciones específicas para mejorar el análisis
 */
function generateImprovementRecommendations(analysis: BusinessAnalysis, validation: any): string[] {
  const recommendations: string[] = [];
  
  if (analysis.evidenceBased.confidenceLevel < 0.7) {
    recommendations.push('Confianza baja: Solicitar más imágenes o información específica');
  }
  
  if (validation.evidenceQuality < 0.6) {
    recommendations.push('Mejorar respaldo de evidencia: Cada conclusión debe citar datos específicos');
  }
  
  if (validation.assumptionRatio > 0.5) {
    recommendations.push('Demasiadas asunciones: Separar claramente hechos vs suposiciones');
  }
  
  if (validation.completeness < 0.8) {
    recommendations.push('Análisis incompleto: Llenar campos faltantes con análisis más profundo');
  }
  
  if (validation.questionsGeneratedCount < 3) {
    recommendations.push('Generar más preguntas para el cliente: Identificar vacíos de información');
  }
  
  if (analysis.evidenceBased.visualData && analysis.evidenceBased.visualData.overallQuality === 'poor') {
    recommendations.push('Calidad de imágenes baja: Sugerir al cliente mejorar fotos para mejor análisis');
  }
  
  return recommendations;
}

/**
 * Detecta problemas específicos en el análisis
 */
function detectAnalysisIssues(
  analysis: BusinessAnalysis, 
  validation: any, 
  expectedBusinessType?: string
): string[] {
  const issues: string[] = [];
  
  // Verificar tipo de negocio si se proporciona
  if (expectedBusinessType && analysis.businessType !== expectedBusinessType) {
    issues.push(`Tipo de negocio incorrecto: esperado '${expectedBusinessType}', obtenido '${analysis.businessType}'`);
  }
  
  // Verificar consistencia interna
  if (analysis.brandPersonality === 'luxury' && 
      analysis.targetAudience.demographic !== 'high-class') {
    issues.push('Inconsistencia: Brand luxury pero audiencia no high-class');
  }
  
  // Verificar plataformas apropiadas
  if (analysis.businessType === 'restaurant' && analysis.platformSuitability.linkedin > 7) {
    issues.push('Plataforma inapropiada: LinkedIn score muy alto para restaurante');
  }
  
  if (analysis.businessType === 'boutique' && analysis.platformSuitability.instagram < 7) {
    issues.push('Plataforma subutilizada: Instagram score bajo para boutique');
  }
  
  // Verificar calidad general
  if (validation.qualityScore < 0.5) {
    issues.push('Calidad general baja: Revisar sistema de análisis');
  }
  
  // Verificar tiempo de procesamiento (si es muy lento)
  // Esto se haría en el caller function
  
  return issues;
}

/**
 * TESTS DE EJEMPLO PREDEFINIDOS
 */
export const VALIDATION_TEST_CASES = [
  {
    name: 'Restaurante Italiano Premium',
    description: 'Restaurante de comida italiana auténtica con ambiente familiar y precios premium',
    images: [
      'https://example.com/restaurant-interior.jpg',
      'https://example.com/pasta-dishes.jpg',
      'https://example.com/wine-selection.jpg'
    ],
    expectedBusinessType: 'restaurant',
    expectedBrandPersonality: 'luxury'
  },
  {
    name: 'Boutique de Moda Joven',
    description: 'Tienda de ropa moderna para jóvenes profesionales en el centro de la ciudad',
    images: [
      'https://example.com/store-front.jpg',
      'https://example.com/clothing-display.jpg',
      'https://example.com/customers-shopping.jpg'
    ],
    expectedBusinessType: 'boutique',
    expectedBrandPersonality: 'modern'
  },
  {
    name: 'Servicio de Concierge Luxury',
    description: 'Servicio de concierge personal para ejecutivos y familias de alto nivel económico',
    images: [
      'https://example.com/luxury-car.jpg',
      'https://example.com/premium-service.jpg'
    ],
    expectedBusinessType: 'concierge',
    expectedBrandPersonality: 'luxury'
  }
];

/**
 * Ejecuta todos los tests de validación
 */
export async function runFullValidationSuite(): Promise<AnalysisValidationResult[]> {
  console.log('[ValidationSuite] Ejecutando suite completa de validación...');
  
  const results: AnalysisValidationResult[] = [];
  
  for (const testCase of VALIDATION_TEST_CASES) {
    console.log(`[ValidationSuite] Ejecutando: ${testCase.name}`);
    
    const result = await runValidationTest(
      testCase.description,
      testCase.images,
      testCase.expectedBusinessType
    );
    
    results.push(result);
  }
  
  // Generar reporte consolidado
  const avgQuality = results.reduce((sum, r) => sum + r.result.qualityScore, 0) / results.length;
  const avgTime = results.reduce((sum, r) => sum + r.result.processingTime, 0) / results.length;
  const successRate = results.filter(r => r.result.qualityScore > 0.6).length / results.length;
  
  console.log('[ValidationSuite] Reporte consolidado:', {
    totalTests: results.length,
    avgQuality: avgQuality.toFixed(2),
    avgProcessingTime: `${avgTime.toFixed(0)}ms`,
    successRate: `${(successRate * 100).toFixed(1)}%`,
    issues: results.reduce((sum, r) => sum + r.issues.length, 0)
  });
  
  return results;
}
