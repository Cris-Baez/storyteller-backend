// 🎯 CONTROLLER PARA TESTING Y VALIDACIÓN DEL SISTEMA DE ANÁLISIS
// Endpoints para probar y validar el sistema híbrido mejorado

import { Request, Response } from 'express';
import { runValidationTest, runFullValidationSuite, VALIDATION_TEST_CASES } from '../services/llmService/estilos/marketing/analysisValidator.js';
import { analyzeBusinessFromImages } from '../services/llmService/estilos/marketing/businessAnalyst.js';

/**
 * 🧪 ENDPOINT: Ejecutar test individual del análisis
 * POST /api/marketing/test-analysis
 */
export async function testBusinessAnalysis(req: Request, res: Response) {
  try {
    const { description, images = [], expectedBusinessType } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere description para el test'
      });
    }

    console.log('[TestController] Ejecutando test de análisis:', {
      description: description.substring(0, 50) + '...',
      imageCount: images.length,
      expectedType: expectedBusinessType
    });

    // Ejecutar test de validación
    const validationResult = await runValidationTest(
      description,
      images,
      expectedBusinessType
    );

    // Calcular métricas adicionales
    const metrics = {
      performanceGrade: getPerformanceGrade(validationResult.result.qualityScore),
      speedGrade: getSpeedGrade(validationResult.result.processingTime),
      confidenceGrade: getConfidenceGrade(validationResult.result.confidence),
      issuesSeverity: getIssuesSeverity(validationResult.issues),
      overallRating: calculateOverallRating(validationResult)
    };

    res.json({
      success: true,
      testResult: validationResult,
      metrics,
      summary: {
        testId: validationResult.testId,
        qualityScore: validationResult.result.qualityScore.toFixed(2),
        processingTime: `${validationResult.result.processingTime}ms`,
        confidence: `${(validationResult.result.confidence * 100).toFixed(1)}%`,
        issuesFound: validationResult.issues.length,
        recommendationsCount: validationResult.recommendations.length,
        overallGrade: metrics.overallRating
      }
    });

  } catch (error: any) {
    console.error('[TestController] Error en test:', error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando test de análisis',
      details: error?.message || 'Error desconocido'
    });
  }
}

/**
 * 🏃‍♂️ ENDPOINT: Ejecutar suite completa de tests
 * POST /api/marketing/run-validation-suite
 */
export async function runValidationSuiteEndpoint(req: Request, res: Response) {
  try {
    console.log('[TestController] Ejecutando suite completa de validación...');

    const results = await runFullValidationSuite();

    // Calcular métricas consolidadas
    const consolidatedMetrics = calculateConsolidatedMetrics(results);
    
    // Generar reporte de rendimiento
    const performanceReport = generatePerformanceReport(results);

    res.json({
      success: true,
      suiteResults: {
        totalTests: results.length,
        results,
        metrics: consolidatedMetrics,
        performanceReport,
        timestamp: new Date(),
        recommendations: generateSuiteRecommendations(results)
      }
    });

  } catch (error: any) {
    console.error('[TestController] Error en suite de validación:', error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando suite de validación',
      details: error?.message || 'Error desconocido'
    });
  }
}

/**
 * 🎯 ENDPOINT: Test rápido con datos predefinidos
 * GET /api/marketing/quick-test/:testName
 */
export async function quickTestEndpoint(req: Request, res: Response) {
  try {
    const { testName } = req.params;
    
    const testCase = VALIDATION_TEST_CASES.find(tc => 
      tc.name.toLowerCase().includes(testName.toLowerCase())
    );

    if (!testCase) {
      return res.status(404).json({
        success: false,
        error: `Test case '${testName}' no encontrado`,
        availableTests: VALIDATION_TEST_CASES.map(tc => tc.name)
      });
    }

    console.log(`[TestController] Ejecutando test rápido: ${testCase.name}`);

    const validationResult = await runValidationTest(
      testCase.description,
      testCase.images,
      testCase.expectedBusinessType
    );

    res.json({
      success: true,
      testCase: testCase.name,
      result: validationResult,
      passed: validationResult.result.qualityScore > 0.6,
      grade: getPerformanceGrade(validationResult.result.qualityScore)
    });

  } catch (error: any) {
    console.error('[TestController] Error en test rápido:', error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando test rápido',
      details: error?.message || 'Error desconocido'
    });
  }
}

/**
 * 📊 ENDPOINT: Análisis comparativo (antes vs después)
 * POST /api/marketing/compare-analysis
 */
export async function compareAnalysisEndpoint(req: Request, res: Response) {
  try {
    const { description, images = [] } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere description para la comparación'
      });
    }

    console.log('[TestController] Ejecutando análisis comparativo...');

    const startTime = Date.now();

    // Ejecutar análisis con nuevo sistema híbrido
    const hybridAnalysis = await analyzeBusinessFromImages(images, description);
    
    const hybridTime = Date.now() - startTime;

    // Simular análisis "antiguo" (sin pre-análisis de imágenes)
    // Para esto, llamaríamos a una versión simplificada
    const simpleAnalysisStart = Date.now();
    const simpleAnalysis = await analyzeBusinessFromImages([], description); // Sin imágenes
    const simpleTime = Date.now() - simpleAnalysisStart;

    // Comparar resultados
    const comparison = {
      hybrid: {
        analysis: hybridAnalysis,
        processingTime: hybridTime,
        confidence: hybridAnalysis.evidenceBased.confidenceLevel,
        evidenceQuality: hybridAnalysis.evidenceBased.keyFindings.length,
        questionsGenerated: hybridAnalysis.evidenceBased.questionsForClient.length
      },
      simple: {
        analysis: simpleAnalysis,
        processingTime: simpleTime,
        confidence: simpleAnalysis.evidenceBased.confidenceLevel,
        evidenceQuality: simpleAnalysis.evidenceBased.keyFindings.length,
        questionsGenerated: simpleAnalysis.evidenceBased.questionsForClient.length
      },
      improvement: {
        confidenceIncrease: hybridAnalysis.evidenceBased.confidenceLevel - simpleAnalysis.evidenceBased.confidenceLevel,
        evidenceIncrease: hybridAnalysis.evidenceBased.keyFindings.length - simpleAnalysis.evidenceBased.keyFindings.length,
        timeOverhead: hybridTime - simpleTime,
        worthIt: (hybridAnalysis.evidenceBased.confidenceLevel - simpleAnalysis.evidenceBased.confidenceLevel) > 0.2
      }
    };

    res.json({
      success: true,
      comparison,
      recommendation: comparison.improvement.worthIt 
        ? 'El sistema híbrido proporciona mejoras significativas'
        : 'El overhead puede no justificar la mejora para este caso',
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('[TestController] Error en comparación:', error);
    res.status(500).json({
      success: false,
      error: 'Error ejecutando comparación de análisis',
      details: error?.message || 'Error desconocido'
    });
  }
}

// UTILIDADES PARA MÉTRICAS Y GRADES

function getPerformanceGrade(qualityScore: number): string {
  if (qualityScore >= 0.9) return 'A+';
  if (qualityScore >= 0.8) return 'A';
  if (qualityScore >= 0.7) return 'B+';
  if (qualityScore >= 0.6) return 'B';
  if (qualityScore >= 0.5) return 'C+';
  if (qualityScore >= 0.4) return 'C';
  return 'F';
}

function getSpeedGrade(processingTimeMs: number): string {
  if (processingTimeMs <= 5000) return 'A+'; // 5 segundos
  if (processingTimeMs <= 10000) return 'A';  // 10 segundos
  if (processingTimeMs <= 20000) return 'B+'; // 20 segundos
  if (processingTimeMs <= 30000) return 'B';  // 30 segundos
  if (processingTimeMs <= 60000) return 'C';  // 1 minuto
  return 'F';
}

function getConfidenceGrade(confidence: number): string {
  if (confidence >= 0.9) return 'Muy Alta';
  if (confidence >= 0.8) return 'Alta';
  if (confidence >= 0.7) return 'Buena';
  if (confidence >= 0.6) return 'Moderada';
  if (confidence >= 0.5) return 'Baja';
  return 'Muy Baja';
}

function getIssuesSeverity(issues: string[]): 'low' | 'medium' | 'high' | 'critical' {
  if (issues.length === 0) return 'low';
  if (issues.some(issue => issue.includes('Error crítico'))) return 'critical';
  if (issues.some(issue => issue.includes('Inconsistencia'))) return 'high';
  if (issues.length > 3) return 'medium';
  return 'low';
}

function calculateOverallRating(validationResult: any): string {
  const qualityGrade = getPerformanceGrade(validationResult.result.qualityScore);
  const speedGrade = getSpeedGrade(validationResult.result.processingTime);
  const issuesSeverity = getIssuesSeverity(validationResult.issues);
  
  if (qualityGrade.startsWith('A') && speedGrade.startsWith('A') && issuesSeverity === 'low') {
    return 'Excelente';
  }
  if (qualityGrade.startsWith('B') && issuesSeverity !== 'critical') {
    return 'Bueno';
  }
  if (validationResult.result.qualityScore > 0.5) {
    return 'Aceptable';
  }
  return 'Necesita Mejoras';
}

function calculateConsolidatedMetrics(results: any[]) {
  const avgQuality = results.reduce((sum, r) => sum + r.result.qualityScore, 0) / results.length;
  const avgTime = results.reduce((sum, r) => sum + r.result.processingTime, 0) / results.length;
  const avgConfidence = results.reduce((sum, r) => sum + r.result.confidence, 0) / results.length;
  const successRate = results.filter(r => r.result.qualityScore > 0.6).length / results.length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  return {
    avgQualityScore: Number(avgQuality.toFixed(2)),
    avgProcessingTime: Math.round(avgTime),
    avgConfidence: Number(avgConfidence.toFixed(2)),
    successRate: Number((successRate * 100).toFixed(1)),
    totalIssues,
    overallGrade: getPerformanceGrade(avgQuality)
  };
}

function generatePerformanceReport(results: any[]) {
  const passedTests = results.filter(r => r.result.qualityScore > 0.6);
  const failedTests = results.filter(r => r.result.qualityScore <= 0.6);
  const slowTests = results.filter(r => r.result.processingTime > 30000);
  
  return {
    summary: {
      totalTests: results.length,
      passed: passedTests.length,
      failed: failedTests.length,
      slowTests: slowTests.length
    },
    topPerformers: results
      .sort((a, b) => b.result.qualityScore - a.result.qualityScore)
      .slice(0, 3)
      .map(r => ({
        testId: r.testId,
        qualityScore: r.result.qualityScore,
        processingTime: r.result.processingTime
      })),
    needsImprovement: failedTests.map(r => ({
      testId: r.testId,
      qualityScore: r.result.qualityScore,
      mainIssues: r.issues.slice(0, 2)
    }))
  };
}

function generateSuiteRecommendations(results: any[]): string[] {
  const recommendations: string[] = [];
  const metrics = calculateConsolidatedMetrics(results);
  
  if (metrics.successRate < 80) {
    recommendations.push('Tasa de éxito baja: Revisar algoritmos de análisis');
  }
  
  if (metrics.avgProcessingTime > 25000) {
    recommendations.push('Tiempo de procesamiento alto: Optimizar llamadas a LLM');
  }
  
  if (metrics.avgConfidence < 0.7) {
    recommendations.push('Confianza promedio baja: Mejorar calidad de datos de entrada');
  }
  
  if (metrics.totalIssues > results.length * 2) {
    recommendations.push('Muchos problemas detectados: Revisar validaciones internas');
  }
  
  return recommendations;
}
