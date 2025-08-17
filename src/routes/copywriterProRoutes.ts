import express from 'express';
import {
  generatePlatformCopy,
  generateHooks,
  generateHPSCAScript,
  generateCopyVariationsForTesting,
  optimizeCopy,
  generateCompleteCopywriterSuite,
  generateConciergeExample
} from '../controllers/copywriterProController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * FASE 2: COPYWRITER PROFESIONAL AI ROUTES
 * 
 * Advanced copywriting endpoints for platform-specific content generation:
 * - Platform-optimized copy (Instagram, LinkedIn, TikTok, Facebook, Twitter)
 * - Psychological hooks and triggers
 * - HPSCA video scripts
 * - A/B testing variations
 * - Conversion optimization
 */

// PHASE 2 - Platform-Specific Copy Generation
router.post('/platform-copy', authenticate, generatePlatformCopy);

// PHASE 2 - Psychological Hooks Generation
router.post('/psychological-hooks', authenticate, generateHooks);

// Enhanced Video Script Generation (HPSCA Framework)
router.post('/hpsca-script', authenticate, generateHPSCAScript);

// A/B Testing Copy Variations
router.post('/copy-variations', authenticate, generateCopyVariationsForTesting);

// Conversion Optimization
router.post('/optimize-copy', authenticate, optimizeCopy);

// Complete Copywriter Pro Suite (All components)
router.post('/complete-suite', authenticate, generateCompleteCopywriterSuite);

// Real-world example endpoint (for testing and demonstration)
router.get('/concierge-example', generateConciergeExample);

export default router;
