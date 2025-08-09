import { Router } from 'express';
import { MarketingController } from '../controllers/marketingController.js';
import { MarketingIntelligenceService } from '../services/marketingIntelligenceService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ✅ APLICAR AUTENTICACIÓN A TODAS LAS RUTAS DE MARKETING
router.use(authenticate);

const marketingController = new MarketingController();

/**
 * 🎯 CREAR VIDEO MARKETING MANUAL
 * POST /api/marketing/create
 */
router.post('/create', marketingController.createMarketingVideo.bind(marketingController));

/**
 * 🤖 ACTIVAR MODO AGENTE
 * POST /api/marketing/agent/activate
 */
router.post('/agent/activate', marketingController.activateAgent.bind(marketingController));

/**
 * 📊 OBTENER ESTADO DE VIDEO
 * GET /api/marketing/status/:requestId
 */
router.get('/status/:requestId', marketingController.getVideoStatus.bind(marketingController));

/**
 * 📱 OBTENER HISTORIAL DE VIDEOS
 * GET /api/marketing/history/:userId
 */
router.get('/history/:userId', marketingController.getVideoHistory.bind(marketingController));

/**
 * 🎨 OBTENER PLANTILLAS/PRESETS
 * GET /api/marketing/templates
 */
router.get('/templates', marketingController.getTemplates.bind(marketingController));

/**
 * 📈 ESTADÍSTICAS DE MARKETING
 * GET /api/marketing/analytics/:userId
 */
router.get('/analytics/:userId', async (req, res) => {
  const { userId } = req.params;
  const { period = 'month' } = req.query;

  const mockAnalytics = {
    userId,
    period,
    totalVideos: 24,
    completedVideos: 22,
    failedVideos: 2,
    averageCompletionTime: 156,
    mostUsedStyle: 'professional',
    mostUsedBusinessType: 'restaurant',
    totalDuration: 720,
    agentModeActive: true,
    weeklyFrequency: 3,
    successRate: 91.7,
    topPerformingVideos: [
      {
        id: '1',
        title: 'Promoción Especial',
        views: 1250,
        engagement: 8.5
      }
    ]
  };

  res.json({
    success: true,
    analytics: mockAnalytics
  });
});

/**
 * 🎭 OBTENER ACTORES DISPONIBLES
 * GET /api/marketing/actors
 */
router.get('/actors', async (req, res) => {
  const { businessType, actorType } = req.query;

  const actors = [
    {
      id: 'young_male_professional',
      type: 'young_male',
      category: 'professional',
      name: 'Marcus - Joven Profesional',
      description: 'Joven ejecutivo, perfecto para tech y servicios',
      previewImage: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/marcus_preview.jpg',
      bestFor: ['tech', 'services', 'retail'],
      voiceMatching: 'marcus'
    },
    {
      id: 'young_female_casual',
      type: 'young_female',
      category: 'casual',
      name: 'Sofia - Joven Relajada',
      description: 'Joven amigable, ideal para spa y fitness',
      previewImage: 'https://storage.googleapis.com/storyteller-ai-cdn/actors/sofia_preview.jpg',
      bestFor: ['spa', 'fitness', 'beauty'],
      voiceMatching: 'jenny'
    }
  ];

  let filteredActors = actors;

  if (businessType) {
    filteredActors = filteredActors.filter(actor => 
      actor.bestFor.includes(businessType as string)
    );
  }

  if (actorType) {
    filteredActors = filteredActors.filter(actor => 
      actor.type === actorType
    );
  }

  res.json({
    success: true,
    actors: filteredActors,
    total: filteredActors.length
  });
});

export { router as marketingRoutes };
