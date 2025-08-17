// Marketing Conversational Agent - The AI that knows your business intimately
// Provides personalized marketing advice with full context memory

import OpenAI from 'openai';
import { 
  MemorySystem, 
  UserBusinessMemory, 
  ConversationMemory, 
  generateId 
} from '../agentMemory/memorySystem.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Action suggestions the agent can make
export interface ActionSuggestion {
  type: 'create_campaign' | 'improve_content' | 'competitive_analysis' | 
        'schedule_content' | 'upgrade_plan' | 'analyze_performance' | 'pro_editor';
  title: string;
  description: string;
  action: string;                  // Function/endpoint to call
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;          // How long it will take
  cost?: number;                   // Additional cost if any
}

// Chat response structure
export interface ChatResponse {
  response: string;
  suggestedActions: ActionSuggestion[];
  contextUsed: string[];
  confidence: number;              // How confident the agent is (0-1)
  needsMoreInfo: boolean;          // If agent needs more business info
}

// Main Conversational Marketing Agent
export class MarketingConversationalAgent {
  private memoryManager: MemorySystem;
  
  constructor() {
    this.memoryManager = new MemorySystem();
  }
  
  // Main chat function - the core of the conversational agent
  async chatWithUser(userId: string, userMessage: string): Promise<ChatResponse> {
    try {
      // 1. Load complete business memory
      const businessMemory = await this.memoryManager.getBusinessContext(userId);
      
      // 2. Build personalized system prompt with full context
      const systemPrompt = await this.buildPersonalizedSystemPrompt(businessMemory);
      
      // 3. Get conversation history for context
      const recentConversations = await this.memoryManager.getConversationHistory(userId, 5);
      const conversationContext = this.buildConversationContext(recentConversations);
      
      // 4. Generate contextual response using GPT-4
      const llmResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'system', content: `Recent conversation context: ${conversationContext}` },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 600
      });
      
      const agentResponse = llmResponse.choices[0].message?.content || 
        "I'm here to help with your marketing needs. Could you tell me more about what you're looking for?";
      
      // 5. Identify suggested actions based on user intent
      const suggestedActions = await this.identifyActionSuggestions(userMessage, businessMemory);
      
      // 6. Determine context used for transparency
      const contextUsed = this.getContextUsed(businessMemory);
      
      // 7. Calculate confidence based on available context
      const confidence = this.calculateConfidence(businessMemory, userMessage);
      
      // 8. Determine if more business info is needed
      const needsMoreInfo = this.needsMoreBusinessInfo(businessMemory, userMessage);
      
      // 9. Save interaction to memory
      const conversation: ConversationMemory = {
        id: generateId(),
        timestamp: new Date(),
        userMessage,
        agentResponse,
        context: this.classifyMessageContext(userMessage),
        outcome: 'helpful', // Will be updated based on user feedback
        followUpNeeded: this.determineFollowUpNeed(userMessage, agentResponse),
        actionsTaken: suggestedActions.map(action => action.type)
      };
      
      await this.memoryManager.saveInteraction(userId, conversation);
      
      // 10. Update business profile if new information detected
      await this.updateBusinessProfileFromMessage(userId, userMessage, businessMemory);
      
      return {
        response: agentResponse,
        suggestedActions,
        contextUsed,
        confidence,
        needsMoreInfo
      };
      
    } catch (error) {
      console.error('Error in chat with user:', error);
      return {
        response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        suggestedActions: [],
        contextUsed: [],
        confidence: 0,
        needsMoreInfo: false
      };
    }
  }
  
  // Build personalized system prompt based on user's business memory
  private async buildPersonalizedSystemPrompt(memory: UserBusinessMemory | null): Promise<string> {
    if (!memory || !memory.businessProfile?.type) {
      return `You are a personal marketing assistant. Help the user create professional marketing content for their business. 

Ask questions to understand their business better so you can provide personalized advice.

COMMUNICATION STYLE:
- Be friendly but professional
- Ask clarifying questions when needed
- Suggest specific actions the user can take
- Use marketing expertise to guide them

Respond in English for optimal processing.`;
    }
    
    // Get performance insights for recommendations
    const insights = await this.memoryManager.getPerformanceInsights(memory.userId);
    
    return `You are the personal marketing assistant for ${memory.businessProfile?.name || 'the user'}.

BUSINESS CONTEXT:
- Business Type: ${memory.businessProfile?.type}
- Industry: ${memory.businessProfile?.industry || 'not specified'}
- Target Audience: ${memory.businessProfile?.targetAudience?.join(', ') || 'general audience'}
- Brand Voice: ${memory.businessProfile?.brandVoice || 'professional'}
- Unique Value Proposition: ${memory.businessProfile?.uniqueValueProp || 'not yet defined'}
- Main Competitors: ${memory.businessProfile?.competitors?.join(', ') || 'not identified'}

CONTENT HISTORY:
- Videos Created: ${memory.contentHistory?.videosCreated?.length || 0}
- Successful Copy Examples: ${memory.contentHistory?.successfulCopy?.length || 0}
- Platform Performance: ${memory.contentHistory?.platformMetrics?.map(p => `${p.platform}: ${p.avgEngagementRate}% avg engagement`).join(', ') || 'no data yet'}

RECENT CONVERSATIONS:
${memory.conversations?.slice(0, 3).map(c => `User: "${c.userMessage}" → You: "${c.agentResponse}"`).join('\n') || 'This is our first conversation'}

USER PREFERENCES:
- Preferred Styles: ${memory.preferences?.preferredStyles?.join(', ') || 'not yet identified'}
- Budget Sensitivity: ${memory.preferences?.budgetPreferences?.costSensitivity || 'unknown'}
- Recurring Concerns: ${memory.preferences?.painPoints?.join(', ') || 'none identified'}
- Favorite Engines: ${memory.preferences?.favoriteEngines?.join(', ') || 'no preference'}

PERFORMANCE INSIGHTS:
- Best Performing Styles: ${insights.bestPerformingStyles?.join(', ') || 'insufficient data'}
- Top Platforms: ${insights.topEngagementPlatforms?.join(', ') || 'no platform data'}
- Recommendations: ${insights.recommendedImprovements?.join('; ') || 'continue creating content'}

INSTRUCTIONS:
- Speak as an expert marketing professional who knows their business intimately
- Reference past conversations and decisions when relevant
- Be proactive in suggesting improvements based on their performance history
- Maintain a ${memory.businessProfile?.brandVoice === 'luxury' ? 'sophisticated and professional' : 'friendly but expert'} tone
- When they mention something new about their business, incorporate it into your understanding
- Always suggest concrete, actionable next steps
- If you recommend spending money (like Pro Editor), explain the value clearly

Respond in English for optimal AI processing.`;
  }
  
  // Build conversation context from recent chats
  private buildConversationContext(conversations: ConversationMemory[]): string {
    if (conversations.length === 0) {
      return "This is a new conversation.";
    }
    
    return conversations
      .reverse() // Show chronological order
      .map(conv => `[${conv.timestamp.toLocaleDateString()}] User: ${conv.userMessage} → Agent: ${conv.agentResponse}`)
      .join('\n');
  }
  
  // Identify actions the agent can suggest based on user message
  private async identifyActionSuggestions(message: string, memory: UserBusinessMemory | null): Promise<ActionSuggestion[]> {
    const suggestions: ActionSuggestion[] = [];
    const lowerMessage = message.toLowerCase();
    
    // Content creation requests
    if (lowerMessage.includes('video') || lowerMessage.includes('content') || 
        lowerMessage.includes('create') || lowerMessage.includes('campaign')) {
      suggestions.push({
        type: 'create_campaign',
        title: 'Create Marketing Campaign',
        description: 'Generate 4-6 professional videos with copy for your business',
        action: 'generateMarketingCampaign',
        priority: 'high',
        estimatedTime: '10-15 minutes'
      });
    }
    
    // Feedback on existing content
    if (lowerMessage.includes('not good') || lowerMessage.includes('didn\'t like') || 
        lowerMessage.includes('improve') || lowerMessage.includes('better')) {
      suggestions.push({
        type: 'improve_content',
        title: 'Improve Content',
        description: 'Regenerate content with different styles or use Pro Editor',
        action: 'improveExistingContent',
        priority: 'high'
      });
      
      suggestions.push({
        type: 'pro_editor',
        title: 'Pro Editor Service',
        description: 'Human expert will refine your content in 2-4 hours',
        action: 'requestProEditor',
        priority: 'medium',
        estimatedTime: '2-4 hours',
        cost: 50
      });
    }
    
    // Competition analysis
    if (lowerMessage.includes('competitor') || lowerMessage.includes('competition') || 
        lowerMessage.includes('others are doing')) {
      suggestions.push({
        type: 'competitive_analysis',
        title: 'Competitive Analysis',
        description: 'Analyze what your competitors are doing and find opportunities',
        action: 'analyzeCompetition',
        priority: 'medium',
        estimatedTime: '5-10 minutes'
      });
    }
    
    // Scheduling and timing
    if (lowerMessage.includes('when to post') || lowerMessage.includes('schedule') || 
        lowerMessage.includes('timing') || lowerMessage.includes('best time')) {
      suggestions.push({
        type: 'schedule_content',
        title: 'Optimize Posting Schedule',
        description: 'Find the best times to post based on your audience data',
        action: 'optimizeSchedule',
        priority: 'medium'
      });
    }
    
    // Performance analysis
    if (lowerMessage.includes('metrics') || lowerMessage.includes('performance') || 
        lowerMessage.includes('analytics') || lowerMessage.includes('how am i doing')) {
      suggestions.push({
        type: 'analyze_performance',
        title: 'Performance Analysis',
        description: 'Review your content performance and get recommendations',
        action: 'analyzePerformance',
        priority: 'medium'
      });
    }
    
    // Plan upgrades
    if (lowerMessage.includes('upgrade') || lowerMessage.includes('more features') || 
        lowerMessage.includes('premium')) {
      suggestions.push({
        type: 'upgrade_plan',
        title: 'Upgrade Plan',
        description: 'Explore Pro features for advanced marketing tools',
        action: 'showUpgradeOptions',
        priority: 'low'
      });
    }
    
    // If no specific suggestions, offer general content creation
    if (suggestions.length === 0 && memory?.businessProfile?.type) {
      suggestions.push({
        type: 'create_campaign',
        title: 'Create Content',
        description: `Generate professional ${memory.businessProfile.type} marketing videos`,
        action: 'generateMarketingCampaign',
        priority: 'medium',
        estimatedTime: '10-15 minutes'
      });
    }
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions to avoid overwhelm
  }
  
  // Determine what context was used (for transparency)
  private getContextUsed(memory: UserBusinessMemory | null): string[] {
    const contextUsed: string[] = [];
    
    if (!memory) {
      return ['No previous context - this is our first interaction'];
    }
    
    if (memory.businessProfile?.type) {
      contextUsed.push(`Business type: ${memory.businessProfile.type}`);
    }
    
    if (memory.contentHistory?.videosCreated?.length > 0) {
      contextUsed.push(`${memory.contentHistory.videosCreated.length} previous videos`);
    }
    
    if (memory.conversations?.length > 0) {
      contextUsed.push(`${memory.conversations.length} previous conversations`);
    }
    
    if (memory.preferences?.preferredStyles?.length > 0) {
      contextUsed.push(`Style preferences: ${memory.preferences.preferredStyles.join(', ')}`);
    }
    
    if (memory.contentHistory?.platformMetrics?.length > 0) {
      contextUsed.push('Platform performance data');
    }
    
    return contextUsed;
  }
  
  // Calculate confidence based on available context
  private calculateConfidence(memory: UserBusinessMemory | null, message: string): number {
    let confidence = 0.5; // Base confidence
    
    if (!memory) return confidence;
    
    // Business profile completeness
    if (memory.businessProfile?.type) confidence += 0.1;
    if (memory.businessProfile?.targetAudience?.length > 0) confidence += 0.1;
    if (memory.businessProfile?.brandVoice) confidence += 0.05;
    
    // Content history
    if (memory.contentHistory?.videosCreated?.length > 3) confidence += 0.1;
    if (memory.contentHistory?.platformMetrics?.length > 0) confidence += 0.1;
    
    // Conversation history
    if (memory.conversations?.length > 5) confidence += 0.05;
    
    // User preferences
    if (memory.preferences?.preferredStyles?.length > 0) confidence += 0.05;
    if (memory.preferences?.painPoints?.length > 0) confidence += 0.05;
    
    return Math.min(confidence, 0.95); // Cap at 95%
  }
  
  // Determine if more business info is needed
  private needsMoreBusinessInfo(memory: UserBusinessMemory | null, message: string): boolean {
    if (!memory) return true;
    
    const businessProfile = memory.businessProfile;
    
    // Check if essential business info is missing
    return !businessProfile?.type || 
           !businessProfile?.targetAudience?.length ||
           !businessProfile?.brandVoice;
  }
  
  // Classify the context/intent of the message
  private classifyMessageContext(message: string): ConversationMemory['context'] {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('create') || lowerMessage.includes('generate') || 
        lowerMessage.includes('video') || lowerMessage.includes('campaign')) {
      return 'content_creation';
    }
    
    if (lowerMessage.includes('strategy') || lowerMessage.includes('advice') || 
        lowerMessage.includes('should i') || lowerMessage.includes('recommend')) {
      return 'strategy_advice';
    }
    
    if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || 
        lowerMessage.includes('not working') || lowerMessage.includes('help')) {
      return 'troubleshooting';
    }
    
    if (lowerMessage.includes('feedback') || lowerMessage.includes('review') || 
        lowerMessage.includes('rate') || lowerMessage.includes('opinion')) {
      return 'feedback';
    }
    
    return 'casual';
  }
  
  // Determine if follow-up is needed
  private determineFollowUpNeed(userMessage: string, agentResponse: string): boolean {
    const lowerUserMessage = userMessage.toLowerCase();
    const lowerAgentResponse = agentResponse.toLowerCase();
    
    // If agent asked questions, follow-up is needed
    if (agentResponse.includes('?')) return true;
    
    // If user mentioned problems, follow-up to ensure resolution
    if (lowerUserMessage.includes('problem') || lowerUserMessage.includes('issue') || 
        lowerUserMessage.includes('not working')) return true;
    
    // If agent suggested actions, follow-up to see if they were helpful
    if (lowerAgentResponse.includes('suggest') || lowerAgentResponse.includes('recommend') || 
        lowerAgentResponse.includes('try')) return true;
    
    return false;
  }
  
  // Update business profile based on new information in message
  private async updateBusinessProfileFromMessage(
    userId: string, 
    message: string, 
    memory: UserBusinessMemory | null
  ): Promise<void> {
    const lowerMessage = message.toLowerCase();
    const updates: Partial<UserBusinessMemory['businessProfile']> = {};
    
    // Detect business type mentions
    if (lowerMessage.includes('concierge')) updates.type = 'concierge';
    else if (lowerMessage.includes('restaurant')) updates.type = 'restaurant';
    else if (lowerMessage.includes('boutique')) updates.type = 'boutique';
    else if (lowerMessage.includes('salon')) updates.type = 'salon';
    else if (lowerMessage.includes('clinic')) updates.type = 'clinic';
    
    // Detect target audience mentions
    const audienceKeywords = ['executives', 'young people', 'families', 'professionals', 'luxury clients', 'millennials'];
    const mentionedAudiences = audienceKeywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (mentionedAudiences.length > 0) {
      updates.targetAudience = mentionedAudiences;
    }
    
    // Detect brand voice indicators
    if (lowerMessage.includes('professional') || lowerMessage.includes('corporate')) {
      updates.brandVoice = 'professional';
    } else if (lowerMessage.includes('luxury') || lowerMessage.includes('premium') || lowerMessage.includes('high-end')) {
      updates.brandVoice = 'luxury';
    } else if (lowerMessage.includes('friendly') || lowerMessage.includes('casual') || lowerMessage.includes('approachable')) {
      updates.brandVoice = 'friendly';
    }
    
    // Only update if we found new information
    if (Object.keys(updates).length > 0) {
      await this.memoryManager.updateBusinessProfile(userId, updates);
    }
  }
  
  // Generate welcome message for new or returning users
  async generateWelcomeMessage(userId: string): Promise<{ 
    welcomeMessage: string; 
    businessContext: string[];
    suggestedActions: ActionSuggestion[];
  }> {
    const memory = await this.memoryManager.getBusinessContext(userId);
    const contextUsed = this.getContextUsed(memory);
    
    let welcomeMessage: string;
    let suggestedActions: ActionSuggestion[] = [];
    
    if (!memory || !memory.businessProfile?.type) {
      welcomeMessage = `Hello! I'm your personal marketing assistant. I'm here to help you create professional marketing content for your business.

To get started, tell me a bit about your business - what type of business is it, and who are your main customers?

I can help you create videos, write engaging copy, analyze your competition, and develop a complete marketing strategy tailored just for your business.`;
      
      suggestedActions = [{
        type: 'create_campaign',
        title: 'Get Started',
        description: 'Tell me about your business and I\'ll create a sample campaign',
        action: 'startBusinessSetup',
        priority: 'high'
      }];
    } else {
      const businessName = memory.businessProfile.name || `your ${memory.businessProfile.type} business`;
      const totalVideos = memory.contentHistory?.videosCreated?.length || 0;
      const lastInteraction = memory.lastInteraction ? 
        new Date(memory.lastInteraction).toLocaleDateString() : 'a while ago';
      
      welcomeMessage = `Welcome back! It's great to see you again.

I remember we've been working on marketing for ${businessName}. Since our last conversation on ${lastInteraction}, you've created ${totalVideos} videos.

${totalVideos > 0 ? 
  `Your best performing content has been ${memory.contentHistory?.videosCreated
    ?.filter((v: any) => v.userFeedback === 'loved')
    ?.map((v: any) => v.style)
    ?.join(', ') || 'your recent videos'}.` : 
  'Ready to create some amazing marketing content?'}

What can I help you with today?`;

      suggestedActions = await this.identifyActionSuggestions('help me with marketing', memory);
    }
    
    return {
      welcomeMessage,
      businessContext: contextUsed,
      suggestedActions
    };
  }
  
  // Update conversation outcome based on user feedback
  async updateConversationOutcome(
    userId: string, 
    conversationId: string, 
    outcome: ConversationMemory['outcome']
  ): Promise<void> {
    // This would update the specific conversation's outcome
    // Implementation depends on how conversations are stored in the database
    console.log(`Updating conversation ${conversationId} outcome to ${outcome}`);
  }
}

// Export singleton instance
export const marketingAgent = new MarketingConversationalAgent();
