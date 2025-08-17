import { callOpenRouter } from '../../openRouterUtil.js';
import { BusinessAnalysis } from './businessAnalyst.js';

export interface ContentStrategy {
  videoTypes: {
    'behind-the-scenes': VideoConceptEN;
    'value-proposition': VideoConceptEN;
    'social-proof': VideoConceptEN;
    'call-to-action': VideoConceptEN;
    'lifestyle': VideoConceptEN;
  };
  recommendedFrequency: {
    instagram: number; // posts per week
    linkedin: number;
    tiktok: number;
    facebook: number;
  };
  optimalTimes: OptimalScheduleEN[];
  contentThemes: string[];
  hashtagStrategy: HashtagStrategy;
  engagementTactics: string[];
}

export interface VideoConceptEN {
  title: string;
  description: string;
  visualStyle: 'elegant' | 'dynamic' | 'minimal' | 'bold' | 'cinematic';
  cameraMovement: 'zoom-in' | 'pan-right' | 'dolly-out' | 'static-to-dynamic';
  mood: 'professional' | 'exciting' | 'calm' | 'inspiring' | 'trustworthy';
  duration: number; // seconds
  callToAction: string;
  targetPlatforms: string[];
  estimatedPerformance: number; // 1-10 score
}

export interface OptimalScheduleEN {
  platform: string;
  dayOfWeek: string;
  timeSlot: string;
  audienceActivity: 'high' | 'medium' | 'low';
  contentType: string;
}

export interface HashtagStrategy {
  branded: string[];
  industry: string[];
  trending: string[];
  niche: string[];
  location?: string[];
}

/**
 * Creates comprehensive content strategy based on business analysis
 */
export async function createCompleteStrategy(analysis: BusinessAnalysis): Promise<ContentStrategy> {
  
  const strategyPrompt = `
You are a senior social media strategist. Create a comprehensive content strategy for this business:

BUSINESS ANALYSIS: ${JSON.stringify(analysis, null, 2)}

Create a detailed content strategy in the following JSON format:

{
  "videoTypes": {
    "behind-the-scenes": {
      "title": "Behind the Scenes Content",
      "description": "Show the human side of your business operations",
      "visualStyle": "elegant|dynamic|minimal|bold|cinematic",
      "cameraMovement": "zoom-in|pan-right|dolly-out|static-to-dynamic",
      "mood": "professional|exciting|calm|inspiring|trustworthy",
      "duration": 10,
      "callToAction": "specific CTA for this content type",
      "targetPlatforms": ["instagram", "linkedin"],
      "estimatedPerformance": 8
    },
    "value-proposition": { /* same structure */ },
    "social-proof": { /* same structure */ },
    "call-to-action": { /* same structure */ },
    "lifestyle": { /* same structure */ }
  },
  "recommendedFrequency": {
    "instagram": 4,
    "linkedin": 2,
    "tiktok": 3,
    "facebook": 2
  },
  "optimalTimes": [
    {
      "platform": "instagram",
      "dayOfWeek": "Tuesday",
      "timeSlot": "9:00 AM",
      "audienceActivity": "high",
      "contentType": "professional"
    }
  ],
  "contentThemes": ["theme1", "theme2", "theme3"],
  "hashtagStrategy": {
    "branded": ["#YourBrand", "#YourService"],
    "industry": ["#industry1", "#industry2"],
    "trending": ["#trending1", "#trending2"],
    "niche": ["#niche1", "#niche2"],
    "location": ["#YourCity", "#YourArea"]
  },
  "engagementTactics": ["tactic1", "tactic2", "tactic3"]
}

Base the strategy on:
1. Business type and target audience
2. Platform suitability scores
3. Brand personality
4. Industry best practices
5. Audience behavior patterns
6. Competitive differentiation opportunities

Ensure all video concepts are optimized for the identified target audience and brand personality.
  `;

  try {
    console.log('[ContentStrategist] Creating comprehensive strategy...');
    
    const response = await callOpenRouter(
      'You are a senior social media strategist.',
      strategyPrompt
    );

    let strategy: ContentStrategy;
    try {
      strategy = JSON.parse(response);
    } catch (parseError) {
      console.error('[ContentStrategist] JSON parse error:', parseError);
      strategy = createFallbackStrategy(analysis);
    }

    console.log('[ContentStrategist] Strategy created:', {
      videoTypesCount: Object.keys(strategy.videoTypes).length,
      totalWeeklyPosts: Object.values(strategy.recommendedFrequency).reduce((a, b) => a + b, 0),
      topPlatform: Object.entries(strategy.recommendedFrequency)
        .sort(([,a], [,b]) => b - a)[0][0]
    });

    return strategy;

  } catch (error) {
    console.error('[ContentStrategist] Error creating strategy:', error);
    return createFallbackStrategy(analysis);
  }
}

/**
 * Creates fallback strategy when LLM call fails
 */
function createFallbackStrategy(analysis: BusinessAnalysis): ContentStrategy {
  const isLuxury = analysis.brandPersonality === 'luxury';
  const isProfessional = ['professional', 'luxury'].includes(analysis.brandPersonality);
  
  return {
    videoTypes: {
      'behind-the-scenes': {
        title: 'Behind the Scenes',
        description: `Show the ${isLuxury ? 'elegant' : 'professional'} operations of your ${analysis.businessType}`,
        visualStyle: isLuxury ? 'elegant' : 'cinematic',
        cameraMovement: 'pan-right',
        mood: 'trustworthy',
        duration: 10,
        callToAction: 'Learn more about our process',
        targetPlatforms: ['instagram', 'linkedin'],
        estimatedPerformance: 7
      },
      'value-proposition': {
        title: 'Our Value',
        description: 'Showcase what makes your business unique',
        visualStyle: isProfessional ? 'cinematic' : 'dynamic',
        cameraMovement: 'zoom-in',
        mood: 'inspiring',
        duration: 10,
        callToAction: 'Contact us today',
        targetPlatforms: ['instagram', 'linkedin'],
        estimatedPerformance: 8
      },
      'social-proof': {
        title: 'Client Success',
        description: 'Show satisfied customers and testimonials',
        visualStyle: 'cinematic',
        cameraMovement: 'dolly-out',
        mood: 'trustworthy',
        duration: 10,
        callToAction: 'Book your consultation',
        targetPlatforms: ['instagram', 'facebook'],
        estimatedPerformance: 9
      },
      'call-to-action': {
        title: 'Take Action',
        description: 'Direct viewers to next steps',
        visualStyle: 'bold',
        cameraMovement: 'static-to-dynamic',
        mood: 'exciting',
        duration: 8,
        callToAction: 'Get started now',
        targetPlatforms: ['instagram', 'tiktok'],
        estimatedPerformance: 7
      },
      'lifestyle': {
        title: 'Lifestyle Integration',
        description: 'Show how your service fits into daily life',
        visualStyle: 'elegant',
        cameraMovement: 'pan-right',
        mood: 'calm',
        duration: 12,
        callToAction: 'Experience the difference',
        targetPlatforms: ['instagram', 'facebook'],
        estimatedPerformance: 8
      }
    },
    recommendedFrequency: {
      instagram: isProfessional ? 3 : 4,
      linkedin: isProfessional ? 2 : 1,
      tiktok: analysis.brandPersonality === 'casual' ? 4 : 2,
      facebook: 2
    },
    optimalTimes: [
      {
        platform: 'instagram',
        dayOfWeek: 'Tuesday',
        timeSlot: '9:00 AM',
        audienceActivity: 'high',
        contentType: 'professional'
      },
      {
        platform: 'linkedin',
        dayOfWeek: 'Wednesday',
        timeSlot: '8:30 AM',
        audienceActivity: 'high',
        contentType: 'business'
      }
    ],
    contentThemes: [
      'quality service',
      'customer satisfaction',
      'behind the scenes',
      'industry expertise'
    ],
    hashtagStrategy: {
      branded: [`#${analysis.businessName.replace(/\s/g, '')}`, '#QualityService'],
      industry: [`#${analysis.businessType}`, '#ProfessionalService'],
      trending: ['#SmallBusiness', '#LocalBusiness'],
      niche: ['#Premium', '#Trusted'],
      location: ['#Local', '#Community']
    },
    engagementTactics: [
      'Ask questions in captions',
      'Share behind-the-scenes content',
      'Feature customer stories',
      'Use location tags'
    ]
  };
}

/**
 * Adapts strategy for specific platform
 */
export async function adaptStrategyForPlatform(
  strategy: ContentStrategy,
  platform: string
): Promise<Partial<ContentStrategy>> {
  
  const adaptationPrompt = `
Adapt this content strategy specifically for ${platform.toUpperCase()}:

FULL STRATEGY: ${JSON.stringify(strategy, null, 2)}

Focus on:
1. Platform-specific best practices
2. Optimal content formats for ${platform}
3. Audience behavior on ${platform}
4. Algorithm preferences
5. Engagement strategies that work on ${platform}

Return the adapted strategy focusing on the most relevant elements for ${platform}.
  `;

  try {
    const response = await callOpenRouter(
      'You are a Platform Specialist adapting content strategies for different social media platforms.',
      adaptationPrompt,
      'openai/gpt-4-turbo'
    );

    const adaptedStrategy = JSON.parse(response);
    console.log(`[ContentStrategist] Strategy adapted for ${platform}`);
    return adaptedStrategy;

  } catch (error) {
    console.error(`[ContentStrategist] Error adapting for ${platform}:`, error);
    return strategy; // Return original strategy on error
  }
}
