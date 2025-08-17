/**
 * Marketing AI Cerebros System - Phase 1 & 2 Implementation
 * 
 * This module provides comprehensive marketing intelligence through specialized AI agents:
 * 
 * PHASE 1 - Business Intelligence Cerebros:
 * - Business Analyst: Analyzes business from images and descriptions
 * - Content Strategist: Creates comprehensive content strategies
 * - Creative Director: Develops creative direction and brand positioning
 * - Copywriter Pro: Generates high-converting copy and video scripts
 * - Marketing Orchestrator: Coordinates all cerebros with memory system
 * 
 * PHASE 2 - Advanced Copywriter Pro AI:
 * - Platform-Specific Copy: Instagram, LinkedIn, TikTok, Facebook, Twitter
 * - Psychological Hooks: Opening, Maintenance, Closing hooks
 * - HPSCA Video Scripts: Hook, Problem, Solution, Proof, Call-to-Action
 * - A/B Testing Variations: Multiple copy variations for testing
 * - Conversion Optimization: Copy optimization for specific goals
 * 
 * All cerebros work in English for optimal LLM performance and international scalability.
 */

// PHASE 1 EXPORTS - Business Intelligence
export { 
  BusinessAnalysis, 
  analyzeBusinessFromImages, 
  updateBusinessAnalysis 
} from './businessAnalyst.js';

export { 
  ContentStrategy, 
  createCompleteStrategy, 
  adaptStrategyForPlatform 
} from './contentStrategist.js';

export { 
  CreativeDirection, 
  createCreativeDirection, 
  refineCreativeDirection 
} from './creativeDirector.js';

export { 
  VideoScript, 
  CopyVariations,
  PlatformCopy,
  PsychologicalHooks,
  generateVideoScript, 
  generateCopyVariations,
  generatePlatformSpecificCopy,
  generatePsychologicalHooks,
  optimizeCopyForConversion 
} from './copywriterPro.js';

export { 
  MarketingOutput, 
  MarketingMemory, 
  MarketingOrchestrator, 
  marketingOrchestrator 
} from './orchestrator.js';

// PHASE 2 COMPLETED - Platform-Specific Copy & Psychological Hooks
// All FASE 2 functionality is already exported from copywriterPro.js above:
// - PlatformCopy (Instagram, LinkedIn, TikTok, Facebook, Twitter)
// - PsychologicalHooks (Opening, Maintenance, Closing)
// - generatePlatformSpecificCopy()
// - generatePsychologicalHooks()

// Export system information
export const MARKETING_SYSTEM_INFO = {
  version: '2.0.0',
  phases: {
    'FASE_1': 'Business Intelligence Cerebros - COMPLETED ✅',
    'FASE_2': 'Copywriter Pro AI - COMPLETED ✅', 
    'FASE_4': 'Dual Engine System - COMPLETED ✅',
    'FASE_6': 'Conversational Agent with Memory - COMPLETED ✅'
  },
  capabilities: [
    'Business analysis from images',
    'Platform-specific copy generation',
    'Psychological hooks creation',
    'HPSCA video scripts',
    'A/B testing variations',
    'Conversion optimization',
    'Conversational marketing agent',
    'Persistent memory system'
  ],
  supportedPlatforms: ['instagram', 'linkedin', 'tiktok', 'facebook', 'twitter'],
  languages: 'English (optimized for LLM performance)',
  ethicsCommitment: 'All persuasion techniques prioritize ethical influence and genuine customer value'
};
