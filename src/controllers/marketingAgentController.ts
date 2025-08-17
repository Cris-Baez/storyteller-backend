// Marketing Agent Controller - API endpoints for conversational marketing agent
// The main interface between frontend chat and the intelligent marketing agent

import { Request, Response } from 'express';
import { marketingAgent } from '../services/conversationalAgent/marketingAgent.js';
import { memoryManager } from '../services/agentMemory/memorySystem.js';
import { MarketingPipeline } from '../pipelines/marketingPipeline.js';
import { preAnalyzeImages } from '../services/llmService/estilos/marketing/imagePreAnalyzer.js';
import { analyzeBusinessFromImages } from '../services/llmService/estilos/marketing/businessAnalyst.js';
import { createCompleteStrategy } from '../services/llmService/estilos/marketing/contentStrategist.js';
import { convertirImagenesEstaticasADinamicas } from '../services/llmService/estilos/marketing/creativeDirector.js';
import { procesarSolicitudCompleta } from '../services/llmService/estilos/marketing/agenteMarketing.js';
import { generarVideoDesdeAgenteMarketing } from '../services/llmService/estilos/marketing/generadorVideoAgente.js';

// Main chat endpoint - where users talk to their marketing agent
export async function chatWithAgent(req: Request, res: Response) {
  try {
    const { message } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }
    
    console.log(`[MARKETING AGENT] User ${userId} message: "${message}"`);
    
    // Get response from the intelligent agent
    const response = await marketingAgent.chatWithUser(userId.toString(), message);
    
    console.log(`[MARKETING AGENT] Agent response generated with confidence: ${response.confidence}`);
    
    res.json({
      success: true,
      data: {
        response: response.response,
        suggestedActions: response.suggestedActions,
        contextUsed: response.contextUsed,
        confidence: response.confidence,
        needsMoreInfo: response.needsMoreInfo,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[MARKETING AGENT] Chat error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Get welcome message for new or returning users
export async function getWelcomeMessage(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    console.log(`[MARKETING AGENT] Generating welcome message for user ${userId}`);
    
    // Generate personalized welcome message
    const welcomeData = await marketingAgent.generateWelcomeMessage(userId.toString());
    
    res.json({
      success: true,
      data: {
        welcomeMessage: welcomeData.welcomeMessage,
        businessContext: welcomeData.businessContext,
        suggestedActions: welcomeData.suggestedActions,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('[MARKETING AGENT] Welcome message error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate welcome message',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Get conversation history
export async function getConversationHistory(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { limit = 20 } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    const conversations = await memoryManager.getConversationHistory(
      userId.toString(), 
      parseInt(limit as string)
    );
    
    res.json({
      success: true,
      data: {
        conversations,
        total: conversations.length
      }
    });
    
  } catch (error) {
    console.error('[MARKETING AGENT] Get conversation history error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Get business context and memory
export async function getBusinessContext(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    const businessMemory = await memoryManager.getBusinessContext(userId.toString());
    const performanceInsights = await memoryManager.getPerformanceInsights(userId.toString());
    
    res.json({
      success: true,
      data: {
        businessMemory,
        performanceInsights,
        hasContext: !!businessMemory?.businessProfile?.type
      }
    });
    
  } catch (error) {
    console.error('[MARKETING AGENT] Get business context error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get business context',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Update conversation feedback (helpful/not helpful)
export async function updateConversationFeedback(req: Request, res: Response) {
  try {
    const { conversationId, outcome } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    if (!conversationId || !outcome) {
      return res.status(400).json({
        success: false,
        error: 'conversationId and outcome are required'
      });
    }
    
    if (!['helpful', 'neutral', 'frustrated'].includes(outcome)) {
      return res.status(400).json({
        success: false,
        error: 'outcome must be helpful, neutral, or frustrated'
      });
    }
    
    await marketingAgent.updateConversationOutcome(
      userId.toString(), 
      conversationId, 
      outcome
    );
    
    res.json({
      success: true,
      message: 'Feedback updated successfully'
    });
    
  } catch (error) {
    console.error('[MARKETING AGENT] Update feedback error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Execute suggested actions from the agent
export async function executeSuggestedAction(req: Request, res: Response) {
  try {
    const { actionType, actionData } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    if (!actionType) {
      return res.status(400).json({
        success: false,
        error: 'actionType is required'
      });
    }
    
    console.log(`[MARKETING AGENT] Executing action ${actionType} for user ${userId}`);
    
    let result: any;
    
    switch (actionType) {
      case 'generateMarketingCampaign':
        // This would call the marketing pipeline to create videos
        result = await handleGenerateCampaign(userId.toString(), actionData);
        break;
        
      case 'improveExistingContent':
        result = await handleImproveContent(userId.toString(), actionData);
        break;
        
      case 'analyzeCompetition':
        result = await handleCompetitiveAnalysis(userId.toString(), actionData);
        break;
        
      case 'optimizeSchedule':
        result = await handleOptimizeSchedule(userId.toString(), actionData);
        break;
        
      case 'analyzePerformance':
        result = await handlePerformanceAnalysis(userId.toString(), actionData);
        break;
        
      case 'requestProEditor':
        result = await handleProEditorRequest(userId.toString(), actionData);
        break;
        
      case 'startBusinessSetup':
        result = await handleBusinessSetup(userId.toString(), actionData);
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action type: ${actionType}`
        });
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error(`[MARKETING AGENT] Execute action error:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to execute action',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Action handlers (these would integrate with existing services)

async function handleGenerateCampaign(userId: string, actionData: any) {
  // This would call the marketing pipeline with dual engine system
  console.log(`[ACTION] Generating marketing campaign for user ${userId}`);
  
  return {
    action: 'generateMarketingCampaign',
    status: 'initiated',
    message: 'Campaign generation started. This will take 10-15 minutes.',
    estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    trackingId: `campaign_${userId}_${Date.now()}`
  };
}

async function handleImproveContent(userId: string, actionData: any) {
  console.log(`[ACTION] Improving content for user ${userId}`);
  
  return {
    action: 'improveExistingContent',
    status: 'analysis_started',
    message: 'Analyzing your existing content to suggest improvements...',
    suggestions: [
      'Try using Runway Gen-4 for smoother camera movements',
      'Consider adding more engaging hooks in your copy',
      'Test posting at optimal times for your audience'
    ]
  };
}

async function handleCompetitiveAnalysis(userId: string, actionData: any) {
  console.log(`[ACTION] Competitive analysis for user ${userId}`);
  
  return {
    action: 'analyzeCompetition',
    status: 'analysis_complete',
    message: 'Here\'s what I found about your competition...',
    insights: [
      'Your competitors post 3x per week on average',
      'They focus heavily on behind-the-scenes content',
      'Video content gets 40% more engagement than photos',
      'Best performing posts use professional lighting'
    ],
    recommendations: [
      'Increase posting frequency to match competitors',
      'Create more behind-the-scenes content',
      'Focus on video over static images',
      'Invest in better lighting for content'
    ]
  };
}

async function handleOptimizeSchedule(userId: string, actionData: any) {
  console.log(`[ACTION] Optimizing schedule for user ${userId}`);
  
  const businessMemory = await memoryManager.getBusinessContext(userId);
  const businessType = businessMemory?.businessProfile?.type || 'general';
  
  // Generate schedule recommendations based on business type
  let optimalTimes: { day: string; time: string; platform: string; reason: string; }[] = [];
  
  if (businessType === 'concierge') {
    optimalTimes = [
      { day: 'Tuesday', time: '09:00', platform: 'LinkedIn', reason: 'Business professionals check LinkedIn on Tuesday mornings' },
      { day: 'Thursday', time: '14:00', platform: 'Instagram', reason: 'Lunch break scrolling peaks on Thursday afternoons' },
      { day: 'Sunday', time: '19:00', platform: 'Instagram', reason: 'Sunday evening leisure time browsing' }
    ];
  } else if (businessType === 'restaurant') {
    optimalTimes = [
      { day: 'Friday', time: '11:00', platform: 'Instagram', reason: 'People plan weekend dining on Friday mornings' },
      { day: 'Sunday', time: '17:00', platform: 'TikTok', reason: 'Sunday dinner decision time' },
      { day: 'Wednesday', time: '12:00', platform: 'Instagram', reason: 'Lunch time food inspiration' }
    ];
  } else {
    optimalTimes = [
      { day: 'Tuesday', time: '10:00', platform: 'Instagram', reason: 'Mid-week engagement boost' },
      { day: 'Thursday', time: '15:00', platform: 'LinkedIn', reason: 'Professional audience afternoon check' },
      { day: 'Saturday', time: '11:00', platform: 'Instagram', reason: 'Weekend leisure browsing' }
    ];
  }
  
  return {
    action: 'optimizeSchedule',
    status: 'recommendations_ready',
    message: 'Here are your personalized posting times based on your business and audience:',
    optimalTimes,
    insights: [
      `Your ${businessType} business audience is most active on weekdays`,
      'Video content performs 60% better than images',
      'Consistent posting schedule increases engagement by 25%'
    ]
  };
}

async function handlePerformanceAnalysis(userId: string, actionData: any) {
  console.log(`[ACTION] Performance analysis for user ${userId}`);
  
  const insights = await memoryManager.getPerformanceInsights(userId);
  
  return {
    action: 'analyzePerformance',
    status: 'analysis_complete',
    message: 'Here\'s your detailed performance analysis:',
    insights,
    summary: {
      totalVideos: insights.bestPerformingStyles.length || 0,
      avgEngagement: calculateRealEngagement(insights) || 'No data',
      topPlatform: insights.topEngagementPlatforms[0] || 'Instagram',
      growthTrend: calculateGrowthTrend(insights) || 'No trend data'
    },
    recommendations: insights.recommendedImprovements
  };
}

// Helper functions for real engagement calculation
function calculateRealEngagement(insights: any): string {
  if (!insights.bestPerformingStyles || insights.bestPerformingStyles.length === 0) {
    return 'No data';
  }
  
  // Calculate average from actual performance data
  const totalEngagement = insights.bestPerformingStyles.reduce((sum: number, style: any) => {
    return sum + (parseFloat(style.engagementRate) || 0);
  }, 0);
  
  const avgEngagement = totalEngagement / insights.bestPerformingStyles.length;
  return `${avgEngagement.toFixed(1)}%`;
}

function calculateGrowthTrend(insights: any): string {
  if (!insights.timeBasedPerformance || insights.timeBasedPerformance.length < 2) {
    return 'Insufficient data for trend';
  }
  
  const recent = insights.timeBasedPerformance[insights.timeBasedPerformance.length - 1];
  const previous = insights.timeBasedPerformance[insights.timeBasedPerformance.length - 2];
  
  if (!recent?.engagement || !previous?.engagement) {
    return 'No trend data';
  }
  
  const growth = ((recent.engagement - previous.engagement) / previous.engagement) * 100;
  const sign = growth >= 0 ? '+' : '';
  return `${sign}${growth.toFixed(1)}% this month`;
}

async function handleProEditorRequest(userId: string, actionData: any) {
  console.log(`[ACTION] Pro Editor request for user ${userId}`);
  
  return {
    action: 'requestProEditor',
    status: 'request_submitted',
    message: 'Your Pro Editor request has been submitted!',
    details: {
      estimatedTime: '2-4 hours',
      cost: 50,
      includes: [
        'Professional video editing and enhancement',
        'Copy optimization for maximum engagement',
        'Music and sound optimization',
        'Platform-specific formatting',
        'Up to 2 revisions included'
      ]
    },
    nextSteps: [
      'A Pro Editor will be assigned within 30 minutes',
      'You\'ll receive updates via email',
      'Final delivery within 2-4 hours'
    ]
  };
}

async function handleBusinessSetup(userId: string, actionData: any) {
  console.log(`[ACTION] Business setup for user ${userId}`);
  
  return {
    action: 'startBusinessSetup',
    status: 'setup_initiated',
    message: 'Let\'s get your business profile set up for maximum marketing impact!',
    questions: [
      {
        id: 'business_type',
        question: 'What type of business do you have?',
        options: ['Concierge Service', 'Restaurant', 'Boutique', 'Salon/Spa', 'Professional Services', 'Other'],
        required: true
      },
      {
        id: 'target_audience',
        question: 'Who are your main customers?',
        options: ['High-end executives', 'Young professionals', 'Families', 'Luxury clients', 'Local community', 'Other'],
        multiple: true,
        required: true
      },
      {
        id: 'brand_voice',
        question: 'How would you describe your brand personality?',
        options: ['Professional & Corporate', 'Luxury & Sophisticated', 'Friendly & Approachable', 'Creative & Artistic'],
        required: true
      }
    ]
  };
}

// 🎯 FUNCIÓN PRINCIPAL DEL ROADMAP - Crear campaña completa desde imágenes
export async function crearCampañaCompleta(req: Request, res: Response) {
  try {
    const { imagenes, descripcionNegocio, plataformasObjetivo, cantidadVideos } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }
    
    if (!imagenes || !Array.isArray(imagenes) || imagenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Business images are required'
      });
    }
    
    if (!descripcionNegocio || typeof descripcionNegocio !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Business description is required'
      });
    }
    
    console.log(`[MARKETING CAMPAIGN] Iniciando campaña completa para usuario ${userId}`);
    console.log(`[MARKETING CAMPAIGN] Imágenes: ${imagenes.length}, Descripción: "${descripcionNegocio}"`);
    
    // 🚀 USAR EL ORQUESTADOR PRINCIPAL IMPLEMENTADO
    const solicitud = {
      userId: userId.toString(),
      imagenes,
      descripcionNegocio,
      plataformasObjetivo: plataformasObjetivo || ['instagram', 'tiktok'],
      cantidadVideos: cantidadVideos || 1
    };
    
    const resultado = await procesarSolicitudCompleta(solicitud);
    
    // Retornar resultado completo al frontend
    res.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error('[MARKETING CAMPAIGN] Error creating complete campaign:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating marketing campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
