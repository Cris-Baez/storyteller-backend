import { Request, Response } from 'express';
import {
  generatePlatformSpecificCopy,
  generatePsychologicalHooks,
  generateVideoScript,
  generateCopyVariations,
  optimizeCopyForConversion,
  PlatformCopy,
  PsychologicalHooks,
  VideoScript,
  CopyVariations
} from '../services/llmService/estilos/marketing/copywriterPro.js';

/**
 * FASE 2: COPYWRITER PROFESIONAL AI CONTROLLER
 * 
 * Handles all advanced copywriting operations:
 * - Platform-specific copy generation (Instagram, LinkedIn, TikTok, Facebook, Twitter)
 * - Psychological hooks creation
 * - Video script generation with HPSCA framework
 * - Copy variations for A/B testing
 * - Conversion optimization
 */

interface CopywriterRequest {
  businessAnalysis: any;
  contentStrategy?: any;
  creativeDirection?: any;
  targetPlatforms: string[];
  conversionGoal?: string;
  targetAudience?: string;
}

// PHASE 2 - Platform-Specific Copy Generation
export async function generatePlatformCopy(req: Request, res: Response) {
  try {
    const { businessAnalysis, contentStrategy, targetPlatforms }: CopywriterRequest = req.body;

    if (!businessAnalysis || !targetPlatforms || targetPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Business analysis and target platforms are required'
      });
    }

    console.log(`[COPYWRITER PRO] Generating platform-specific copy for: ${targetPlatforms.join(', ')}`);

    const platformCopy: PlatformCopy = await generatePlatformSpecificCopy(
      businessAnalysis,
      contentStrategy,
      targetPlatforms
    );

    res.json({
      success: true,
      data: {
        platformCopy,
        generatedFor: targetPlatforms,
        businessType: businessAnalysis.businessType,
        timestamp: new Date().toISOString()
      },
      metadata: {
        phase: 'FASE_2_COPYWRITER_PRO',
        platforms: targetPlatforms,
        copyTypes: Object.keys(platformCopy)
      }
    });

  } catch (error) {
    console.error('Platform Copy Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate platform-specific copy',
      details: (error as Error).message
    });
  }
}

// PHASE 2 - Psychological Hooks Generation
export async function generateHooks(req: Request, res: Response) {
  try {
    const { businessAnalysis, targetAudience, conversionGoal }: CopywriterRequest = req.body;

    if (!businessAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Business analysis is required'
      });
    }

    console.log(`[PSYCHOLOGICAL HOOKS] Generating hooks for ${targetAudience || 'general audience'}`);

    const hooks: PsychologicalHooks = await generatePsychologicalHooks(
      businessAnalysis,
      targetAudience || 'general business audience',
      conversionGoal || 'lead generation'
    );

    res.json({
      success: true,
      data: {
        hooks,
        targetAudience: targetAudience || 'general business audience',
        conversionGoal: conversionGoal || 'lead generation',
        businessType: businessAnalysis.businessType,
        timestamp: new Date().toISOString()
      },
      metadata: {
        phase: 'FASE_2_PSYCHOLOGICAL_HOOKS',
        hookCategories: ['opening', 'maintenance', 'closing'],
        totalHooks: Object.values(hooks).reduce((acc: number, category: any) => 
          acc + Object.values(category).reduce((catAcc: number, hookArray: any) => catAcc + (hookArray as string[]).length, 0), 0
        )
      }
    });

  } catch (error) {
    console.error('Psychological Hooks Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate psychological hooks',
      details: (error as Error).message
    });
  }
}

// Enhanced Video Script Generation (HPSCA Framework)
export async function generateHPSCAScript(req: Request, res: Response) {
  try {
    const { businessAnalysis, contentStrategy, creativeDirection }: CopywriterRequest = req.body;

    if (!businessAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Business analysis is required'
      });
    }

    console.log(`[HPSCA SCRIPT] Generating video script for ${businessAnalysis.businessType}`);

    const script: VideoScript = await generateVideoScript(
      businessAnalysis,
      contentStrategy,
      creativeDirection
    );

    res.json({
      success: true,
      data: {
        script,
        framework: 'HPSCA',
        totalDuration: script.totalDuration,
        businessType: businessAnalysis.businessType,
        timestamp: new Date().toISOString()
      },
      metadata: {
        phase: 'FASE_2_HPSCA_SCRIPT',
        sections: ['hook', 'problem', 'solution', 'proof', 'callToAction'],
        style: script.style,
        tone: script.tone,
        targetEmotion: script.targetEmotion
      }
    });

  } catch (error) {
    console.error('HPSCA Script Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate HPSCA video script',
      details: (error as Error).message
    });
  }
}

// A/B Testing Copy Variations
export async function generateCopyVariationsForTesting(req: Request, res: Response) {
  try {
    const { businessAnalysis, contentStrategy, creativeDirection }: CopywriterRequest = req.body;

    if (!businessAnalysis) {
      return res.status(400).json({
        success: false,
        error: 'Business analysis is required'
      });
    }

    console.log(`[COPY VARIATIONS] Generating A/B testing variations for ${businessAnalysis.businessType}`);

    const variations: CopyVariations = await generateCopyVariations(
      businessAnalysis,
      contentStrategy,
      creativeDirection
    );

    res.json({
      success: true,
      data: {
        variations,
        businessType: businessAnalysis.businessType,
        totalVariations: {
          headlines: variations.headlines.length,
          callToActions: variations.callToActions.length,
          socialPosts: Object.values(variations.socialPosts).reduce((acc, posts) => acc + posts.length, 0),
          emailSubjects: variations.emailSubjects.length,
          adCopy: variations.adCopy.short.length + variations.adCopy.medium.length + variations.adCopy.long.length
        },
        timestamp: new Date().toISOString()
      },
      metadata: {
        phase: 'FASE_2_AB_TESTING',
        purposes: 'A/B testing, campaign optimization, conversion testing',
        platforms: Object.keys(variations.socialPosts)
      }
    });

  } catch (error) {
    console.error('Copy Variations Generation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate copy variations',
      details: (error as Error).message
    });
  }
}

// Conversion Optimization
export async function optimizeCopy(req: Request, res: Response) {
  try {
    const { copy, businessAnalysis, conversionGoal }: {
      copy: string;
      businessAnalysis: any;
      conversionGoal: string;
    } = req.body;

    if (!copy || !businessAnalysis || !conversionGoal) {
      return res.status(400).json({
        success: false,
        error: 'Copy, business analysis, and conversion goal are required'
      });
    }

    console.log(`[COPY OPTIMIZATION] Optimizing copy for: ${conversionGoal}`);

    const optimizedCopy = await optimizeCopyForConversion(
      copy,
      businessAnalysis,
      conversionGoal
    );

    res.json({
      success: true,
      data: {
        originalCopy: copy,
        optimizedCopy,
        conversionGoal,
        improvementFocus: 'Psychological triggers, clarity, urgency, emotional appeal, value proposition',
        timestamp: new Date().toISOString()
      },
      metadata: {
        phase: 'FASE_2_CONVERSION_OPTIMIZATION',
        businessType: businessAnalysis.businessType,
        goal: conversionGoal
      }
    });

  } catch (error) {
    console.error('Copy Optimization Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to optimize copy',
      details: (error as Error).message
    });
  }
}

// Complete Copywriter Pro Suite
export async function generateCompleteCopywriterSuite(req: Request, res: Response) {
  try {
    const { businessAnalysis, contentStrategy, creativeDirection, targetPlatforms, conversionGoal, targetAudience }: CopywriterRequest = req.body;

    if (!businessAnalysis || !targetPlatforms || targetPlatforms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Business analysis and target platforms are required'
      });
    }

    console.log(`[COMPLETE COPYWRITER SUITE] Generating complete copy suite for ${businessAnalysis.businessType}`);

    // Generate all copywriter components in parallel for efficiency
    const [platformCopy, hooks, script, variations] = await Promise.all([
      generatePlatformSpecificCopy(businessAnalysis, contentStrategy, targetPlatforms),
      generatePsychologicalHooks(
        businessAnalysis,
        targetAudience || 'general business audience',
        conversionGoal || 'lead generation'
      ),
      generateVideoScript(businessAnalysis, contentStrategy, creativeDirection),
      generateCopyVariations(businessAnalysis, contentStrategy, creativeDirection)
    ]);

    res.json({
      success: true,
      data: {
        platformCopy,
        psychologicalHooks: hooks,
        videoScript: script,
        copyVariations: variations,
        businessAnalysis: {
          type: businessAnalysis.businessType,
          name: businessAnalysis.businessName,
          audience: targetAudience
        }
      },
      metadata: {
        phase: 'FASE_2_COMPLETE_COPYWRITER_SUITE',
        platforms: targetPlatforms,
        conversionGoal: conversionGoal || 'lead generation',
        components: ['platformCopy', 'psychologicalHooks', 'videoScript', 'copyVariations'],
        timestamp: new Date().toISOString(),
        processingTime: 'Generated in parallel for optimal speed'
      }
    });

  } catch (error) {
    console.error('Complete Copywriter Suite Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate complete copywriter suite',
      details: (error as Error).message
    });
  }
}

// Real-world example endpoint for testing
export async function generateConciergeExample(req: Request, res: Response) {
  try {
    console.log('[CONCIERGE EXAMPLE] Generating real-world example for Miami Luxury Concierge');

    const conciergeBusinessAnalysis = {
      businessType: 'concierge',
      businessName: 'Miami Luxury Concierge',
      targetAudience: {
        demographic: 'high-class executives',
        needs: ['time management', 'luxury services', 'personal assistance'],
        painPoints: ['limited time', 'busy schedule', 'need for reliable service']
      },
      brandPersonality: 'luxury',
      competitiveAdvantages: ['24/7 availability', 'premium service', 'established network'],
      valueProposition: 'Luxury concierge services for busy executives who value their time'
    };

    const targetPlatforms = ['instagram', 'linkedin'];

    const [platformCopy, hooks] = await Promise.all([
      generatePlatformSpecificCopy(conciergeBusinessAnalysis, null, targetPlatforms),
      generatePsychologicalHooks(conciergeBusinessAnalysis, 'high-class executives', 'luxury service inquiry')
    ]);

    res.json({
      success: true,
      example: 'Miami Luxury Concierge Copy Generation',
      data: {
        platformCopy,
        psychologicalHooks: hooks,
        businessProfile: conciergeBusinessAnalysis
      },
      metadata: {
        phase: 'FASE_2_REAL_WORLD_EXAMPLE',
        note: 'This demonstrates platform-specific copy for luxury concierge targeting high-class executives',
        platforms: targetPlatforms
      }
    });

  } catch (error) {
    console.error('Concierge Example Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate concierge example',
      details: (error as Error).message
    });
  }
}
