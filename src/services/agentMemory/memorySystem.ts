// Marketing Agent Memory System - Persistent business context and conversation history
// Built for the Marketing Agent that knows everything about each user's business

import { PrismaClient } from '../../../generated/prisma/index.js';

// Use real Prisma client
const prisma = new PrismaClient();

// Core business memory interface - all in English for better LLM performance
export interface UserBusinessMemory {
  userId: string;
  businessProfile: {
    type: string;                    // "concierge", "restaurant", "boutique", "services"
    name: string;                    // "Miami Luxury Concierge"
    targetAudience: string[];        // ["executives", "wealthy clients"]
    brandVoice: string;              // "professional", "friendly", "luxury"
    competitors: string[];           // Identified competitors
    uniqueValueProp: string;         // Unique selling proposition
    industry: string;                // "hospitality", "food", "fashion"
  };
  contentHistory: {
    videosCreated: VideoMemory[];    // History of generated videos
    successfulCopy: CopyMemory[];    // Copy that performed well
    platformMetrics: PlatformPerformance[]; // Performance per social platform
    engagementData: EngagementData[]; // Real metrics from posts
  };
  conversations: ConversationMemory[]; // Chat history with agent
  preferences: {
    preferredStyles: string[];       // Visual styles user likes
    optimalTimes: TimeSlot[];        // Best posting times based on data
    budgetPreferences: BudgetInfo;   // Typical budget
    painPoints: string[];            // Recurring problems
    favoriteEngines: ('runway' | 'kling')[]; // Preferred generation engines
  };
  lastInteraction: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMemory {
  id: string;
  timestamp: Date;
  userMessage: string;
  agentResponse: string;
  context: 'content_creation' | 'strategy_advice' | 'troubleshooting' | 'casual' | 'feedback';
  outcome: 'helpful' | 'neutral' | 'frustrated'; // User feedback
  followUpNeeded: boolean;
  actionsTaken: string[];          // Actions executed during conversation
}

export interface VideoMemory {
  id: string;
  createdAt: Date;
  concept: string;                 // Original concept
  engine: 'runway' | 'kling';     // Which engine was used
  style: string;                   // Visual style
  performanceScore?: number;       // How well it performed (0-10)
  userFeedback: 'loved' | 'liked' | 'neutral' | 'disliked';
  platformsUsed: string[];         // Where it was posted
  engagementMetrics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface CopyMemory {
  id: string;
  createdAt: Date;
  platform: 'instagram' | 'linkedin' | 'tiktok';
  copyType: 'caption' | 'headline' | 'hook' | 'cta';
  content: string;
  performanceScore: number;        // How well it performed (0-10)
  engagementRate?: number;
}

export interface PlatformPerformance {
  platform: 'instagram' | 'linkedin' | 'tiktok';
  avgEngagementRate: number;
  bestPostingTimes: string[];
  topPerformingContentTypes: string[];
  followerGrowthRate: number;
}

export interface TimeSlot {
  day: string;                     // "monday", "tuesday", etc.
  time: string;                    // "09:00", "14:00", etc.
  platform: string;               // "instagram", "linkedin", etc.
  engagementBoost: number;         // % increase in engagement
}

export interface BudgetInfo {
  monthlyBudget: number;
  preferredPlan: 'basic' | 'pro' | 'enterprise';
  willingToPayForProEditor: boolean;
  costSensitivity: 'low' | 'medium' | 'high';
}

export interface EngagementData {
  date: Date;
  platform: string;
  contentId: string;
  contentType: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  reachRate: number;
}

// Memory Management System
export class MemorySystem {
  
  // Save conversation interaction
  async saveInteraction(userId: string, conversation: ConversationMemory): Promise<void> {
    try {
      const userIdNum = parseInt(userId);
      
      // First try to find existing memory
      const existingMemory = await prisma.userBusinessMemory.findUnique({
        where: { userId: userIdNum }
      });
      
      if (existingMemory) {
        // Update existing memory - just update timestamp
        await prisma.userBusinessMemory.update({
          where: { userId: userIdNum },
          data: {
            lastInteraction: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Create conversation separately
        await prisma.conversationMemory.create({
          data: {
            businessMemoryId: existingMemory.id,
            userMessage: conversation.userMessage,
            agentResponse: conversation.agentResponse,
            context: conversation.context,
            outcome: conversation.outcome,
            followUpNeeded: conversation.followUpNeeded,
            actionsTaken: conversation.actionsTaken || [],
            confidence: 0.8,
            needsMoreInfo: false,
            timestamp: conversation.timestamp
          }
        });
      } else {
        // Create new memory entry first with default values
        const newMemory = await prisma.userBusinessMemory.create({
          data: {
            userId: userIdNum,
            businessType: 'unknown',
            businessName: 'New Business',
            industry: 'general',
            brandVoice: 'professional',
            valueProposition: '',
            targetAudience: {},
            competitors: {},
            videosCreated: [],
            successfulCopy: [],
            platformMetrics: [],
            engagementData: [],
            preferredStyles: [],
            optimalTimes: [],
            budgetInfo: {},
            painPoints: [],
            favoriteEngines: [],
            lastInteraction: new Date()
          }
        });
        
        // Then create conversation
        await prisma.conversationMemory.create({
          data: {
            businessMemoryId: newMemory.id,
            userMessage: conversation.userMessage,
            agentResponse: conversation.agentResponse,
            context: conversation.context,
            outcome: conversation.outcome,
            followUpNeeded: conversation.followUpNeeded,
            actionsTaken: conversation.actionsTaken || [],
            confidence: 0.8,
            needsMoreInfo: false,
            timestamp: conversation.timestamp
          }
        });
      }
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw new Error(`Failed to save conversation: ${(error as Error).message}`);
    }
  }
  
  // Get complete business context
  async getBusinessContext(userId: string): Promise<any | null> {
    try {
      const userIdNum = parseInt(userId);
      const memory = await prisma.userBusinessMemory.findUnique({
        where: { userId: userIdNum },
        include: {
          conversations: {
            orderBy: { timestamp: 'desc' },
            take: 20 // Last 20 conversations for context
          }
        }
      });
      
      return memory;
    } catch (error) {
      console.error('Error getting business context:', error);
      return null;
    }
  }
  
  // Update business profile from conversation insights
  async updateBusinessProfile(userId: string, profileUpdates: any): Promise<void> {
    try {
      const userIdNum = parseInt(userId);
      
      // Build update data based on what fields are available in Prisma schema
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Map interface fields to Prisma schema fields
      if (profileUpdates.type) updateData.businessType = profileUpdates.type;
      if (profileUpdates.name) updateData.businessName = profileUpdates.name;
      if (profileUpdates.industry) updateData.industry = profileUpdates.industry;
      if (profileUpdates.targetAudience) updateData.targetAudience = profileUpdates.targetAudience;
      if (profileUpdates.brandVoice) updateData.brandVoice = profileUpdates.brandVoice;
      if (profileUpdates.competitors) updateData.competitors = profileUpdates.competitors;
      if (profileUpdates.uniqueValueProp) updateData.valueProposition = profileUpdates.uniqueValueProp;
      
      await prisma.userBusinessMemory.update({
        where: { userId: userIdNum },
        data: updateData
      });
    } catch (error) {
      console.error('Error updating business profile:', error);
      throw new Error(`Failed to update business profile: ${(error as Error).message}`);
    }
  }
  
  // Save video generation memory
  async saveVideoMemory(userId: string, videoData: VideoMemory): Promise<void> {
    try {
      const userIdNum = parseInt(userId);
      const existingMemory = await prisma.userBusinessMemory.findUnique({
        where: { userId: userIdNum }
      });
      
      if (existingMemory) {
        const currentVideos = (existingMemory.videosCreated as any[]) || [];
        const updatedVideos = [...currentVideos, videoData];
        
        await prisma.userBusinessMemory.update({
          where: { userId: userIdNum },
          data: {
            videosCreated: updatedVideos,
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error saving video memory:', error);
      throw new Error(`Failed to save video memory: ${(error as Error).message}`);
    }
  }
  
  // Save successful copy for learning
  async saveCopyMemory(userId: string, copyData: CopyMemory): Promise<void> {
    try {
      const userIdNum = parseInt(userId);
      const existingMemory = await prisma.userBusinessMemory.findUnique({
        where: { userId: userIdNum }
      });
      
      if (existingMemory) {
        const currentCopy = (existingMemory.successfulCopy as any[]) || [];
        const updatedCopy = [...currentCopy, copyData];
        
        await prisma.userBusinessMemory.update({
          where: { userId: userIdNum },
          data: {
            successfulCopy: updatedCopy,
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error saving copy memory:', error);
      throw new Error(`Failed to save copy memory: ${(error as Error).message}`);
    }
  }
  
  // Update user preferences based on behavior
  async updatePreferences(userId: string, preferences: any): Promise<void> {
    try {
      const userIdNum = parseInt(userId);
      
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Map preferences to individual fields
      if (preferences.preferredStyles) updateData.preferredStyles = preferences.preferredStyles;
      if (preferences.optimalTimes) updateData.optimalTimes = preferences.optimalTimes;
      if (preferences.budgetPreferences) updateData.budgetInfo = preferences.budgetPreferences;
      if (preferences.painPoints) updateData.painPoints = preferences.painPoints;
      if (preferences.favoriteEngines) updateData.favoriteEngines = preferences.favoriteEngines;
      
      await prisma.userBusinessMemory.update({
        where: { userId: userIdNum },
        data: updateData
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error(`Failed to update preferences: ${(error as Error).message}`);
    }
  }
  
  // Get conversation history for context
  async getConversationHistory(userId: string, limit: number = 10): Promise<ConversationMemory[]> {
    try {
      const memory = await this.getBusinessContext(userId);
      
      if (!memory || !memory.conversations) {
        return [];
      }
      
      // Map Prisma conversation objects to our interface
      return memory.conversations
        .map((conv: any) => ({
          id: conv.id,
          timestamp: conv.timestamp,
          userMessage: conv.userMessage,
          agentResponse: conv.agentResponse,
          context: conv.context as 'content_creation' | 'strategy_advice' | 'troubleshooting' | 'casual' | 'feedback',
          outcome: conv.outcome as 'helpful' | 'neutral' | 'frustrated',
          followUpNeeded: conv.followUpNeeded,
          actionsTaken: conv.actionsTaken || []
        }))
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting conversation history:', error);
      return [];
    }
  }
  
  // Get performance insights for recommendations
  async getPerformanceInsights(userId: string): Promise<{
    bestPerformingStyles: string[];
    optimalPostingTimes: TimeSlot[];
    topEngagementPlatforms: string[];
    recommendedImprovements: string[];
  }> {
    try {
      const memory = await this.getBusinessContext(userId);
      
      if (!memory) {
        return {
          bestPerformingStyles: [],
          optimalPostingTimes: [],
          topEngagementPlatforms: [],
          recommendedImprovements: []
        };
      }
      
      // Analyze video performance - access from Prisma fields
      const videosCreated = (memory.videosCreated as any[]) || [];
      const videosByPerformance = videosCreated
        .filter((video: any) => video.performanceScore !== undefined)
        .sort((a: any, b: any) => (b.performanceScore || 0) - (a.performanceScore || 0));
      
      const bestPerformingStyles = videosByPerformance
        .slice(0, 5)
        .map((video: any) => video.style)
        .filter((style: string, index: number, array: string[]) => array.indexOf(style) === index);
      
      // Get optimal times from preferences
      const optimalPostingTimes = (memory.optimalTimes as TimeSlot[]) || [];
      
      // Analyze platform performance
      const platformMetrics = (memory.platformMetrics as PlatformPerformance[]) || [];
      const topEngagementPlatforms = platformMetrics
        .sort((a, b) => b.avgEngagementRate - a.avgEngagementRate)
        .map(p => p.platform);
      
      // Generate recommendations based on data
      const recommendedImprovements = this.generateRecommendations(memory);
      
      return {
        bestPerformingStyles,
        optimalPostingTimes,
        topEngagementPlatforms,
        recommendedImprovements
      };
    } catch (error) {
      console.error('Error getting performance insights:', error);
      return {
        bestPerformingStyles: [],
        optimalPostingTimes: [],
        topEngagementPlatforms: [],
        recommendedImprovements: []
      };
    }
  }
  
  // Generate personalized recommendations
  private generateRecommendations(memory: any): string[] {
    const recommendations: string[] = [];
    
    // Analyze video feedback patterns
    const videosCreated = (memory.videosCreated as any[]) || [];
    const dislikedVideos = videosCreated
      .filter((video: any) => video.userFeedback === 'disliked');
    
    if (dislikedVideos.length > 2) {
      const commonStyles = dislikedVideos.map((v: any) => v.style);
      const mostDislikedStyle = commonStyles
        .sort((a, b) => 
          commonStyles.filter(s => s === a).length - 
          commonStyles.filter(s => s === b).length
        ).pop();
      
      if (mostDislikedStyle) {
        recommendations.push(`Avoid ${mostDislikedStyle} style - it hasn't been performing well for your brand`);
      }
    }
    
    // Analyze platform performance
    const platformMetrics = (memory.platformMetrics as any[]) || [];
    if (platformMetrics.length > 0) {
      const bestPlatform = platformMetrics
        .sort((a: any, b: any) => b.avgEngagementRate - a.avgEngagementRate)[0];
      
      recommendations.push(`Focus more content on ${bestPlatform.platform} - it's your highest performing platform`);
    }
    
    // Budget optimization
    const budgetInfo = memory.budgetInfo as any;
    if (budgetInfo && budgetInfo.costSensitivity === 'high') {
      recommendations.push('Use Runway Gen-4 for simple commercial videos to optimize costs');
    }
    
    // Posting frequency
    const totalVideos = videosCreated.length;
    const daysSinceStart = Math.floor(
      (Date.now() - new Date(memory.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceStart > 30 && totalVideos < 10) {
      recommendations.push('Consider increasing content frequency to 2-3 posts per week for better engagement');
    }
    
    return recommendations;
  }
}

// Utility function to generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Export singleton instance
export const memoryManager = new MemorySystem();
