// Marketing Agent Routes - API routes for conversational marketing agent
// All endpoints for chatting with the intelligent marketing agent

import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  chatWithAgent,
  getWelcomeMessage,
  getConversationHistory,
  getBusinessContext,
  updateConversationFeedback,
  executeSuggestedAction,
  crearCampañaCompleta,
  // Instagram Analytics endpoints from Marketing Agent roadmap
  getScorecard,
  getDailyBrief,
  getInsights,
  generateOptimization,
  connectInstagram,
  getContentCalendar,
  scheduleContent
} from '../controllers/marketingAgentController.js';
// Instagram-specific controller
import {
  syncAccount,
  getPosts,
  getPostAnalytics,
  getAccountInfo
} from '../controllers/instagramController.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// 💬 Main chat endpoint - where users talk to their marketing agent
router.post('/chat', chatWithAgent);

// 🤝 Get personalized welcome message
router.get('/welcome', getWelcomeMessage);

// 📚 Get conversation history
router.get('/history', getConversationHistory);

// 🏢 Get business context and memory
router.get('/context', getBusinessContext);

// 👍👎 Update conversation feedback (helpful/not helpful)
router.post('/feedback', updateConversationFeedback);

// ⚡ Execute actions suggested by the agent
router.post('/execute-action', executeSuggestedAction);

// 🎯 ROADMAP FASE 5: Create complete marketing campaign from business images
router.post('/create-campaign', crearCampañaCompleta);

// =============================================================================
// 📊 INSTAGRAM ANALYTICS ROUTES (MARKETING AGENT ROADMAP)
// =============================================================================

// Marketing Agent Analytics endpoints
router.get('/scorecard', getScorecard);
router.get('/daily-brief', getDailyBrief);
router.get('/insights', getInsights);
router.get('/calendar', getContentCalendar);

router.post('/optimize', generateOptimization);
router.post('/connect-instagram', connectInstagram);
router.post('/schedule', scheduleContent);

// Instagram-specific endpoints
router.post('/instagram/sync', syncAccount);
router.get('/instagram/posts', getPosts);
router.get('/instagram/account', getAccountInfo);
router.get('/instagram/analytics/:postId', getPostAnalytics);

export { router as marketingAgentRoutes };
