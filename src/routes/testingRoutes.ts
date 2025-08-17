// 🛣️ RUTAS PARA TESTING Y VALIDACIÓN DEL SISTEMA HÍBRIDO
// Endpoints para probar y validar el sistema de análisis mejorado

import { Router } from 'express';
import { 
  testBusinessAnalysis, 
  runValidationSuiteEndpoint, 
  quickTestEndpoint,
  compareAnalysisEndpoint 
} from '../controllers/testingController.js';

const router = Router();

/**
 * 🧪 POST /api/testing/analyze
 * Test individual del análisis de negocio híbrido
 * 
 * Body: {
 *   description: string,
 *   images?: string[],
 *   expectedBusinessType?: string
 * }
 */
router.post('/analyze', testBusinessAnalysis);

/**
 * 🏃‍♂️ POST /api/testing/validation-suite
 * Ejecuta suite completa de tests de validación
 * 
 * Ejecuta todos los casos de prueba predefinidos
 */
router.post('/validation-suite', runValidationSuiteEndpoint);

/**
 * ⚡ GET /api/testing/quick/:testName
 * Test rápido con datos predefinidos
 * 
 * Params:
 * - testName: 'restaurante' | 'boutique' | 'concierge'
 */
router.get('/quick/:testName', quickTestEndpoint);

/**
 * 📊 POST /api/testing/compare
 * Análisis comparativo (híbrido vs simple)
 * 
 * Body: {
 *   description: string,
 *   images?: string[]
 * }
 */
router.post('/compare', compareAnalysisEndpoint);

/**
 * 📋 GET /api/testing/status
 * Estado general del sistema de testing
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    systemStatus: {
      testingSystemActive: true,
      availableEndpoints: [
        'POST /api/testing/analyze - Test individual',
        'POST /api/testing/validation-suite - Suite completa',
        'GET /api/testing/quick/:testName - Test rápido',
        'POST /api/testing/compare - Comparación híbrido vs simple',
        'GET /api/testing/status - Este endpoint'
      ],
      availableQuickTests: [
        'restaurante - Test restaurante italiano premium',
        'boutique - Test boutique de moda joven', 
        'concierge - Test servicio concierge luxury'
      ],
      systemInfo: {
        hybridAnalysisEnabled: true,
        imagePreAnalysisEnabled: true,
        validationSystemEnabled: true,
        performanceMetricsEnabled: true
      }
    },
    timestamp: new Date()
  });
});

/**
 * 🎯 GET /api/testing/examples
 * Ejemplos de uso del sistema de testing
 */
router.get('/examples', (req, res) => {
  res.json({
    success: true,
    examples: {
      testIndividual: {
        endpoint: 'POST /api/testing/analyze',
        description: 'Prueba el análisis híbrido con tus propios datos',
        exampleBody: {
          description: 'Restaurante de sushi premium en el centro de la ciudad',
          images: [
            'https://ejemplo.com/sushi-bar.jpg',
            'https://ejemplo.com/interior-restaurante.jpg'
          ],
          expectedBusinessType: 'restaurant'
        },
        expectedResponse: {
          success: true,
          testResult: {
            testId: 'test_1234567890_abcdef123',
            result: {
              qualityScore: 0.85,
              processingTime: 12500,
              confidence: 0.78
            },
            validation: {
              evidenceQuality: 0.8,
              assumptionRatio: 0.3,
              completeness: 0.9
            }
          },
          metrics: {
            performanceGrade: 'A',
            overallRating: 'Excelente'
          }
        }
      },
      testRapido: {
        endpoint: 'GET /api/testing/quick/restaurante',
        description: 'Ejecuta test predefinido de restaurante',
        noBodyRequired: true,
        expectedResponse: {
          success: true,
          testCase: 'Restaurante Italiano Premium',
          passed: true,
          grade: 'A+'
        }
      },
      suiteCompleta: {
        endpoint: 'POST /api/testing/validation-suite',
        description: 'Ejecuta todos los tests de validación',
        noBodyRequired: true,
        expectedResponse: {
          success: true,
          suiteResults: {
            totalTests: 3,
            metrics: {
              avgQualityScore: 0.82,
              successRate: 100,
              overallGrade: 'A'
            }
          }
        }
      },
      comparacion: {
        endpoint: 'POST /api/testing/compare',
        description: 'Compara análisis híbrido vs simple',
        exampleBody: {
          description: 'Boutique de ropa moderna para profesionales',
          images: ['https://ejemplo.com/tienda.jpg']
        },
        expectedResponse: {
          success: true,
          comparison: {
            improvement: {
              confidenceIncrease: 0.15,
              evidenceIncrease: 3,
              worthIt: true
            }
          },
          recommendation: 'El sistema híbrido proporciona mejoras significativas'
        }
      }
    },
    usageGuide: {
      step1: 'Usa GET /api/testing/quick/restaurante para test rápido',
      step2: 'Usa POST /api/testing/analyze con tus datos para test completo',
      step3: 'Usa POST /api/testing/validation-suite para validación general',
      step4: 'Usa POST /api/testing/compare para ver mejoras del sistema híbrido'
    }
  });
});

export default router;
