/**
 * 📊 INSTAGRAM ANALYTICS SERVICE - Marketing Agent Core
 * Handles Instagram API integration, metrics calculation, and scorecard generation
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import axios from 'axios';

const prisma = new PrismaClient();

export interface InstagramAccountInfo {
  id: string;
  username: string;
  account_type: string;
  media_count: number;
  followers_count: number;
}

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: string;
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  insights?: {
    impressions?: number;
    reach?: number;
    saved?: number;
    video_views?: number;
  };
}

export interface ScorecardResult {
  overall: number;
  breakdown: {
    profile: number;
    content: number;
    consistency: number;
    community: number;
    growth: number;
  };
  recommendations: string[];
  lastUpdated: Date;
}

export interface BestTimeAnalysis {
  hour: number;
  day: string;
  engagementRate: number;
  sampleSize: number;
}

/**
 * 🔗 INSTAGRAM ANALYTICS SERVICE
 * Core service for Instagram data analysis and insights generation
 */
export class InstagramAnalyticsService {

  /**
   * Connect Instagram account using Instagram Basic Display API
   */
  static async connectInstagramAccount(userId: number, accessToken: string): Promise<any> {
    logger.info(`[InstagramAnalytics] 🔌 Connecting Instagram account for user ${userId}`);

    try {
      // Validate token and get account info
      const accountInfo = await this.getAccountInfo(accessToken);
      
      // Check if account already exists
      const existingAccount = await prisma.socialAccount.findFirst({
        where: {
          userId,
          platform: 'INSTAGRAM',
          platformUserId: accountInfo.id
        }
      });

      let socialAccount;
      if (existingAccount) {
        // Update existing account
        socialAccount = await prisma.socialAccount.update({
          where: { id: existingAccount.id },
          data: {
            accessToken,
            username: accountInfo.username,
            isActive: true,
            settings: {
              account_type: accountInfo.account_type,
              media_count: accountInfo.media_count,
              followers_count: accountInfo.followers_count
            },
            updatedAt: new Date()
          }
        });
      } else {
        // Create new account
        socialAccount = await prisma.socialAccount.create({
          data: {
            userId,
            platform: 'INSTAGRAM',
            username: accountInfo.username,
            platformUserId: accountInfo.id,
            accessToken,
            isActive: true,
            settings: {
              account_type: accountInfo.account_type,
              media_count: accountInfo.media_count,
              followers_count: accountInfo.followers_count
            }
          }
        });
      }

      // Initial sync of basic metrics
      await this.syncAccountMetrics(socialAccount.id);

      logger.info(`[InstagramAnalytics] ✅ Instagram account connected successfully: ${accountInfo.username}`);
      return socialAccount;

    } catch (error) {
      logger.error(`[InstagramAnalytics] ❌ Failed to connect Instagram account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error(`Instagram connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Instagram account info from API
   */
  private static async getAccountInfo(accessToken: string): Promise<InstagramAccountInfo> {
    try {
      const response = await axios.get('https://graph.instagram.com/me', {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      if (error instanceof Error && 'response' in error && (error as any).response?.status === 401) {
        throw new Error('Invalid or expired Instagram access token');
      }
      throw new Error(`Instagram API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync recent posts and metrics for an account
   */
  static async syncAccountMetrics(accountId: number): Promise<void> {
    logger.info(`[InstagramAnalytics] 🔄 Syncing metrics for account ${accountId}`);

    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id: accountId },
        include: { user: true }
      });

      if (!account || !account.accessToken) {
        throw new Error('Account not found or missing access token');
      }

      // Get recent posts (last 25)
      const posts = await this.getRecentPosts(account.accessToken, 25);
      
      let totalEngagement = 0;
      let validPosts = 0;
      const hourlyEngagement: { [hour: number]: { total: number; count: number } } = {};

      for (const post of posts) {
        try {
          // Store/update post analytics
          await this.storePostAnalytics(accountId, post);
          
          // Calculate engagement metrics
          if (post.like_count && post.comments_count) {
            const engagement = post.like_count + post.comments_count + (post.insights?.saved || 0);
            totalEngagement += engagement;
            validPosts++;

            // Track hourly engagement
            const postHour = new Date(post.timestamp).getHours();
            if (!hourlyEngagement[postHour]) {
              hourlyEngagement[postHour] = { total: 0, count: 0 };
            }
            hourlyEngagement[postHour].total += engagement;
            hourlyEngagement[postHour].count++;
          }
        } catch (postError) {
          logger.warn(`[InstagramAnalytics] ⚠️ Failed to process post ${post.id}: ${postError instanceof Error ? postError.message : 'Unknown error'}`);
        }
      }

      // Calculate best hour
      let bestHour = 12; // Default to noon
      let bestEngagementRate = 0;
      
      for (const [hour, data] of Object.entries(hourlyEngagement)) {
        const avgEngagement = data.total / data.count;
        if (avgEngagement > bestEngagementRate) {
          bestEngagementRate = avgEngagement;
          bestHour = parseInt(hour);
        }
      }

      // Store daily metrics
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const avgEngagement = validPosts > 0 ? totalEngagement / validPosts : 0;
      const settings = account.settings as any || {};

      // Check if metrics already exist for today
      const existingMetrics = await prisma.instagramMetrics.findFirst({
        where: {
          accountId,
          date: today
        }
      });

      if (existingMetrics) {
        await prisma.instagramMetrics.update({
          where: { id: existingMetrics.id },
          data: {
            engagement: avgEngagement,
            bestHour,
            followers: settings.followers_count,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.instagramMetrics.create({
          data: {
            accountId,
            date: today,
            engagement: avgEngagement,
            bestHour,
            followers: settings.followers_count
          }
        });
      }

      logger.info(`[InstagramAnalytics] ✅ Synced ${posts.length} posts for account ${accountId}`);

    } catch (error) {
      logger.error(`[InstagramAnalytics] ❌ Failed to sync metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Get recent posts from Instagram API
   */
  private static async getRecentPosts(accessToken: string, limit: number = 25): Promise<InstagramPost[]> {
    try {
      const response = await axios.get('https://graph.instagram.com/me/media', {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count',
          limit,
          access_token: accessToken
        },
        timeout: 15000
      });

      const posts = response.data.data || [];

      // Get insights for each post (if available)
      for (const post of posts) {
        try {
          const insightsResponse = await axios.get(`https://graph.instagram.com/${post.id}/insights`, {
            params: {
              metric: 'impressions,reach,saved',
              access_token: accessToken
            },
            timeout: 5000
          });

          post.insights = {};
          for (const insight of insightsResponse.data.data) {
            post.insights[insight.name] = insight.values[0]?.value || 0;
          }
        } catch (insightError) {
          // Insights might not be available for all posts/accounts
          logger.debug(`[InstagramAnalytics] No insights available for post ${post.id}`);
        }
      }

      return posts;
    } catch (error) {
      logger.error(`[InstagramAnalytics] ❌ Failed to fetch posts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Store post analytics in database
   */
  private static async storePostAnalytics(accountId: number, post: InstagramPost): Promise<void> {
    try {
      const engagementRate = post.insights?.reach 
        ? ((post.like_count || 0) + (post.comments_count || 0)) / post.insights.reach * 100
        : null;

      await prisma.postAnalytics.upsert({
        where: { postId: post.id },
        update: {
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
          saves: post.insights?.saved || null,
          reach: post.insights?.reach || null,
          impressions: post.insights?.impressions || null,
          engagementRate,
          analyzedAt: new Date()
        },
        create: {
          postId: post.id,
          accountId,
          caption: post.caption || '',
          mediaType: post.media_type,
          permalink: post.permalink,
          thumbnail: post.thumbnail_url,
          likes: post.like_count || 0,
          comments: post.comments_count || 0,
          saves: post.insights?.saved || null,
          reach: post.insights?.reach || null,
          impressions: post.insights?.impressions || null,
          engagementRate,
          postedAt: new Date(post.timestamp)
        }
      });
    } catch (error) {
      logger.error(`[InstagramAnalytics] ❌ Failed to store post analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Calculate overall account health score (0-100)
   */
  static async calculateScorecard(accountId: number): Promise<ScorecardResult> {
    logger.info(`[InstagramAnalytics] 📊 Calculating scorecard for account ${accountId}`);

    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id: accountId },
        include: {
          postAnalytics: {
            orderBy: { postedAt: 'desc' },
            take: 20 // Last 20 posts
          },
          instagramMetrics: {
            orderBy: { date: 'desc' },
            take: 7 // Last 7 days
          }
        }
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const settings = account.settings as any || {};
      const posts = account.postAnalytics;
      const metrics = account.instagramMetrics;

      // Profile Health (20%)
      const profileScore = this.calculateProfileScore(account, settings);

      // Content Quality (30%)
      const contentScore = this.calculateContentScore(posts);

      // Consistency (20%)
      const consistencyScore = this.calculateConsistencyScore(posts);

      // Community Engagement (15%)
      const communityScore = this.calculateCommunityScore(posts);

      // Growth Trend (15%)
      const growthScore = this.calculateGrowthScore(metrics);

      // Calculate weighted overall score
      const overall = Math.round(
        profileScore * 0.20 +
        contentScore * 0.30 +
        consistencyScore * 0.20 +
        communityScore * 0.15 +
        growthScore * 0.15
      );

      const recommendations = this.generateRecommendations({
        profile: profileScore,
        content: contentScore,
        consistency: consistencyScore,
        community: communityScore,
        growth: growthScore
      });

      const scorecard: ScorecardResult = {
        overall,
        breakdown: {
          profile: profileScore,
          content: contentScore,
          consistency: consistencyScore,
          community: communityScore,
          growth: growthScore
        },
        recommendations,
        lastUpdated: new Date()
      };

      logger.info(`[InstagramAnalytics] ✅ Scorecard calculated: ${overall}/100`);
      return scorecard;

    } catch (error) {
      logger.error(`[InstagramAnalytics] ❌ Failed to calculate scorecard: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Calculate profile health score
   */
  private static calculateProfileScore(account: any, settings: any): number {
    let score = 0;

    // Has bio (check username length as proxy)
    if (account.username && account.username.length > 3) score += 20;

    // Account type (business accounts get bonus)
    if (settings.account_type === 'BUSINESS') score += 30;
    else if (settings.account_type === 'CREATOR') score += 25;
    else score += 15;

    // Follower count (relative scoring)
    const followers = settings.followers_count || 0;
    if (followers > 10000) score += 30;
    else if (followers > 1000) score += 25;
    else if (followers > 100) score += 15;
    else score += 5;

    // Media count (content volume)
    const mediaCount = settings.media_count || 0;
    if (mediaCount > 100) score += 20;
    else if (mediaCount > 50) score += 15;
    else if (mediaCount > 10) score += 10;
    else score += 5;

    return Math.min(score, 100);
  }

  /**
   * Calculate content quality score
   */
  private static calculateContentScore(posts: any[]): number {
    if (posts.length === 0) return 0;

    let score = 0;
    let totalEngagement = 0;
    let postsWithGoodEngagement = 0;

    for (const post of posts) {
      const engagement = (post.likes || 0) + (post.comments || 0);
      totalEngagement += engagement;

      // Posts with good engagement (>10 interactions)
      if (engagement > 10) postsWithGoodEngagement++;

      // Posts with captions
      if (post.caption && post.caption.length > 20) score += 2;

      // Posts with good engagement rate
      if (post.engagementRate && post.engagementRate > 3) score += 3;
    }

    // Average engagement bonus
    const avgEngagement = totalEngagement / posts.length;
    if (avgEngagement > 50) score += 30;
    else if (avgEngagement > 20) score += 20;
    else if (avgEngagement > 10) score += 10;

    // Consistency in quality
    const qualityRatio = postsWithGoodEngagement / posts.length;
    score += qualityRatio * 20;

    return Math.min(score, 100);
  }

  /**
   * Calculate posting consistency score
   */
  private static calculateConsistencyScore(posts: any[]): number {
    if (posts.length < 2) return 20; // Not enough data

    const sortedPosts = posts.sort((a, b) => 
      new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );

    const intervals: number[] = [];
    for (let i = 0; i < sortedPosts.length - 1; i++) {
      const diff = new Date(sortedPosts[i].postedAt).getTime() - 
                  new Date(sortedPosts[i + 1].postedAt).getTime();
      intervals.push(diff / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Calculate average interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Score based on posting frequency
    let score = 0;
    if (avgInterval <= 1) score = 100; // Daily posting
    else if (avgInterval <= 2) score = 80; // Every 2 days
    else if (avgInterval <= 3) score = 60; // Every 3 days
    else if (avgInterval <= 7) score = 40; // Weekly
    else score = 20; // Less frequent

    // Penalize for inconsistency
    const variance = intervals.reduce((acc, interval) => 
      acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const consistency = Math.max(0, 1 - (variance / (avgInterval * avgInterval)));
    
    return Math.round(score * consistency);
  }

  /**
   * Calculate community engagement score
   */
  private static calculateCommunityScore(posts: any[]): number {
    if (posts.length === 0) return 0;

    const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);

    if (totalLikes === 0) return 0;

    // Comment to like ratio (higher is better for community)
    const commentRatio = totalComments / totalLikes;
    
    let score = 0;
    if (commentRatio > 0.1) score = 100; // 10%+ comment rate is excellent
    else if (commentRatio > 0.05) score = 80; // 5%+ is good
    else if (commentRatio > 0.02) score = 60; // 2%+ is average
    else if (commentRatio > 0.01) score = 40; // 1%+ is below average
    else score = 20;

    return score;
  }

  /**
   * Calculate growth trend score
   */
  private static calculateGrowthScore(metrics: any[]): number {
    if (metrics.length < 2) return 50; // Not enough data, neutral score

    const recent = metrics[0];
    const older = metrics[metrics.length - 1];

    if (!recent.followers || !older.followers) return 50;

    const growthRate = (recent.followers - older.followers) / older.followers;
    
    let score = 50; // Base score
    if (growthRate > 0.1) score = 100; // 10%+ growth
    else if (growthRate > 0.05) score = 80; // 5%+ growth
    else if (growthRate > 0.02) score = 70; // 2%+ growth
    else if (growthRate > 0) score = 60; // Any growth
    else if (growthRate > -0.02) score = 40; // Small decline
    else score = 20; // Significant decline

    return score;
  }

  /**
   * Generate actionable recommendations based on scores
   */
  private static generateRecommendations(scores: any): string[] {
    const recommendations: string[] = [];

    if (scores.profile < 60) {
      recommendations.push("Optimize your profile: add a clear bio and profile picture");
    }

    if (scores.content < 60) {
      recommendations.push("Improve content quality: use better captions and engaging visuals");
    }

    if (scores.consistency < 60) {
      recommendations.push("Post more consistently: aim for at least 3-4 posts per week");
    }

    if (scores.community < 60) {
      recommendations.push("Increase engagement: respond to comments and ask questions in captions");
    }

    if (scores.growth < 60) {
      recommendations.push("Focus on growth: use relevant hashtags and post at optimal times");
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  /**
   * Get best posting times based on historical data
   */
  static async getBestPostingTimes(accountId: number): Promise<BestTimeAnalysis[]> {
    logger.info(`[InstagramAnalytics] ⏰ Analyzing best posting times for account ${accountId}`);

    try {
      const posts = await prisma.postAnalytics.findMany({
        where: { accountId },
        orderBy: { postedAt: 'desc' },
        take: 100 // Analyze last 100 posts
      });

      if (posts.length === 0) {
        return [{ hour: 12, day: 'monday', engagementRate: 0, sampleSize: 0 }];
      }

      const timeAnalysis: { [key: string]: { engagement: number; count: number } } = {};

      for (const post of posts) {
        const date = new Date(post.postedAt);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const key = `${day}-${hour}`;

        const engagement = (post.likes || 0) + (post.comments || 0);

        if (!timeAnalysis[key]) {
          timeAnalysis[key] = { engagement: 0, count: 0 };
        }

        timeAnalysis[key].engagement += engagement;
        timeAnalysis[key].count++;
      }

      // Calculate average engagement for each time slot
      const results: BestTimeAnalysis[] = [];
      for (const [key, data] of Object.entries(timeAnalysis)) {
        const [day, hourStr] = key.split('-');
        const hour = parseInt(hourStr);
        const avgEngagement = data.engagement / data.count;

        results.push({
          hour,
          day,
          engagementRate: avgEngagement,
          sampleSize: data.count
        });
      }

      // Sort by engagement rate and return top 3
      return results
        .filter(r => r.sampleSize >= 2) // At least 2 posts for reliability
        .sort((a, b) => b.engagementRate - a.engagementRate)
        .slice(0, 3);

    } catch (error) {
      logger.error(`[InstagramAnalytics] ❌ Failed to analyze posting times: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Analyze individual post performance
   */
  static async analyzePost(postId: string): Promise<any> {
    logger.info(`[InstagramAnalytics] 🔍 Analyzing post ${postId}`);

    try {
      const post = await prisma.postAnalytics.findUnique({
        where: { postId },
        include: { account: true }
      });

      if (!post) {
        throw new Error('Post not found');
      }

      // Get account average for comparison
      const accountPosts = await prisma.postAnalytics.findMany({
        where: { accountId: post.accountId },
        orderBy: { postedAt: 'desc' },
        take: 20
      });

      const avgLikes = accountPosts.reduce((sum, p) => sum + (p.likes || 0), 0) / accountPosts.length;
      const avgComments = accountPosts.reduce((sum, p) => sum + (p.comments || 0), 0) / accountPosts.length;
      const avgEngagement = avgLikes + avgComments;

      const postEngagement = (post.likes || 0) + (post.comments || 0);
      const performanceVsAverage = avgEngagement > 0 ? (postEngagement / avgEngagement) : 1;

      let performance = 'average';
      if (performanceVsAverage > 1.5) performance = 'excellent';
      else if (performanceVsAverage > 1.2) performance = 'good';
      else if (performanceVsAverage < 0.7) performance = 'poor';

      const analysis = {
        post: {
          id: post.postId,
          caption: post.caption,
          likes: post.likes,
          comments: post.comments,
          engagementRate: post.engagementRate,
          postedAt: post.postedAt
        },
        performance: {
          status: performance,
          vsAverage: Math.round(performanceVsAverage * 100),
          accountAverage: Math.round(avgEngagement)
        },
        insights: this.generatePostInsights(post, performanceVsAverage)
      };

      logger.info(`[InstagramAnalytics] ✅ Post analysis completed: ${performance}`);
      return analysis;

    } catch (error) {
      logger.error(`[InstagramAnalytics] ❌ Failed to analyze post: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Generate insights for individual post
   */
  private static generatePostInsights(post: any, performanceRatio: number): string[] {
    const insights: string[] = [];

    if (performanceRatio > 1.5) {
      insights.push("This post performed exceptionally well - consider creating similar content");
    } else if (performanceRatio < 0.7) {
      insights.push("This post underperformed - analyze what could be improved");
    }

    const postHour = new Date(post.postedAt).getHours();
    if (postHour < 9 || postHour > 20) {
      insights.push("Posted outside optimal hours (9 AM - 8 PM) - consider better timing");
    }

    if (post.caption && post.caption.length < 50) {
      insights.push("Caption is quite short - longer captions often drive more engagement");
    }

    const commentToLikeRatio = post.likes > 0 ? (post.comments || 0) / post.likes : 0;
    if (commentToLikeRatio < 0.05) {
      insights.push("Low comment engagement - try asking questions to encourage interaction");
    }

    return insights;
  }
}
