/**
 * 🚨 ALERT SERVICE - Real-time monitoring and notifications
 * Monitors Instagram posts for performance changes and generates actionable alerts
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { InstagramAnalyticsService } from './InstagramAnalyticsService.js';

const prisma = new PrismaClient();

export interface Alert {
  id?: number;
  userId: number;
  type: 'post_boom' | 'post_underperform' | 'best_time_reminder' | 'content_suggestion' | 'milestone' | 'engagement_drop';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  data?: any;
  expiresAt?: Date;
}

export interface PostPerformanceAlert {
  postId: string;
  accountId: number;
  performanceChange: number; // Percentage change vs average
  currentEngagement: number;
  averageEngagement: number;
  timeframe: string;
}

export interface SchedulingAlert {
  accountId: number;
  recommendedTime: number; // Hour of day
  daysSinceLastPost: number;
  potentialReachIncrease: number;
}

/**
 * 🔔 ALERT SERVICE
 * Real-time monitoring and smart notifications for Instagram performance
 */
export class AlertService {

  /**
   * Monitor all active accounts for performance changes
   * This method should be called hourly via cron job
   */
  static async monitorAllAccounts(): Promise<void> {
    logger.info('[AlertService] 🔍 Starting performance monitoring for all accounts');

    try {
      const activeAccounts = await prisma.socialAccount.findMany({
        where: {
          platform: 'INSTAGRAM',
          isActive: true
        },
        include: { user: true }
      });

      logger.info(`[AlertService] Found ${activeAccounts.length} active Instagram accounts to monitor`);

      for (const account of activeAccounts) {
        try {
          await this.monitorAccountPerformance(account.id, account.userId);
          await this.checkPostingReminders(account.id, account.userId);
          await this.checkMilestones(account.id, account.userId);
        } catch (error) {
          logger.error(`[AlertService] ❌ Failed to monitor account ${account.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      logger.info('[AlertService] ✅ Completed monitoring cycle');

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to monitor accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Monitor individual account for performance changes
   */
  static async monitorAccountPerformance(accountId: number, userId: number): Promise<void> {
    logger.info(`[AlertService] 📊 Monitoring performance for account ${accountId}`);

    try {
      // Get recent posts (last 24 hours)
      const recentPosts = await prisma.postAnalytics.findMany({
        where: {
          accountId,
          postedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { postedAt: 'desc' }
      });

      if (recentPosts.length === 0) {
        return; // No recent posts to monitor
      }

      // Get baseline performance (last 30 days average)
      const baselinePosts = await prisma.postAnalytics.findMany({
        where: {
          accountId,
          postedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Exclude last 24h
          }
        }
      });

      if (baselinePosts.length === 0) {
        return; // Not enough historical data
      }

      const averageEngagement = baselinePosts.reduce(
        (sum, post) => sum + ((post.likes || 0) + (post.comments || 0)),
        0
      ) / baselinePosts.length;

      // Check each recent post
      for (const post of recentPosts) {
        const postEngagement = (post.likes || 0) + (post.comments || 0);
        const performanceChange = ((postEngagement - averageEngagement) / averageEngagement) * 100;

        // Viral post detection (150%+ above average)
        if (performanceChange > 150) {
          await this.createAlert({
            userId,
            type: 'post_boom',
            title: '🔥 Viral Post Alert!',
            message: `Your recent post is performing exceptionally well (+${Math.round(performanceChange)}% vs average)! Consider creating similar content or reposting variations.`,
            priority: 'high',
            actionable: true,
            data: {
              postId: post.postId,
              performanceChange,
              currentEngagement: postEngagement,
              averageEngagement
            },
            expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // Expire in 48 hours
          });
        }

        // Underperforming post detection (70% below average)
        else if (performanceChange < -30 && postEngagement < averageEngagement * 0.7) {
          await this.createAlert({
            userId,
            type: 'post_underperform',
            title: '📉 Post Underperforming',
            message: `Your recent post is performing ${Math.abs(Math.round(performanceChange))}% below average. Consider reviewing the content strategy or optimal posting times.`,
            priority: 'medium',
            actionable: true,
            data: {
              postId: post.postId,
              performanceChange,
              currentEngagement: postEngagement,
              averageEngagement
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expire in 24 hours
          });
        }
      }

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to monitor account performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check for posting reminders and optimal time suggestions
   */
  static async checkPostingReminders(accountId: number, userId: number): Promise<void> {
    logger.info(`[AlertService] ⏰ Checking posting reminders for account ${accountId}`);

    try {
      // Get last post
      const lastPost = await prisma.postAnalytics.findFirst({
        where: { accountId },
        orderBy: { postedAt: 'desc' }
      });

      if (!lastPost) {
        return; // No posts yet
      }

      const daysSinceLastPost = (Date.now() - new Date(lastPost.postedAt).getTime()) / (1000 * 60 * 60 * 24);

      // Alert if it's been more than 3 days
      if (daysSinceLastPost > 3) {
        // Get best posting times
        const bestTimes = await InstagramAnalyticsService.getBestPostingTimes(accountId);
        const nextBestTime = bestTimes[0]?.hour || 12;

        await this.createAlert({
          userId,
          type: 'best_time_reminder',
          title: '📅 Time to Post!',
          message: `It's been ${Math.round(daysSinceLastPost)} days since your last post. Your audience is most active at ${nextBestTime}:00. Consider posting new content today!`,
          priority: 'medium',
          actionable: true,
          data: {
            daysSinceLastPost: Math.round(daysSinceLastPost),
            recommendedTime: nextBestTime,
            potentialReachIncrease: 25
          },
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // Expire in 12 hours
        });
      }

      // Daily optimal time reminders
      const now = new Date();
      const currentHour = now.getHours();
      const bestTimes = await InstagramAnalyticsService.getBestPostingTimes(accountId);

      for (const timeSlot of bestTimes.slice(0, 1)) { // Only remind for the best time
        if (Math.abs(currentHour - timeSlot.hour) <= 1 && daysSinceLastPost >= 1) {
          await this.createAlert({
            userId,
            type: 'best_time_reminder',
            title: '⏰ Optimal Posting Window',
            message: `Now is one of your best times to post! Your audience typically shows ${Math.round(timeSlot.engagementRate)} average engagement at this time.`,
            priority: 'low',
            actionable: true,
            data: {
              recommendedTime: timeSlot.hour,
              expectedEngagement: Math.round(timeSlot.engagementRate)
            },
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // Expire in 2 hours
          });
        }
      }

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to check posting reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check for milestone achievements
   */
  static async checkMilestones(accountId: number, userId: number): Promise<void> {
    logger.info(`[AlertService] 🎯 Checking milestones for account ${accountId}`);

    try {
      const account = await prisma.socialAccount.findUnique({
        where: { id: accountId }
      });

      if (!account || !account.settings) {
        return;
      }

      const settings = account.settings as any;
      const currentFollowers = settings.followers_count || 0;

      // Get previous follower count from metrics
      const previousMetrics = await prisma.instagramMetrics.findFirst({
        where: { accountId },
        orderBy: { date: 'desc' },
        skip: 1 // Get second most recent
      });

      if (previousMetrics && previousMetrics.followers) {
        const followerGrowth = currentFollowers - previousMetrics.followers;

        // Milestone alerts for follower growth
        const milestones = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000];
        
        for (const milestone of milestones) {
          if (currentFollowers >= milestone && previousMetrics.followers < milestone) {
            await this.createAlert({
              userId,
              type: 'milestone',
              title: '🎉 Milestone Achieved!',
              message: `Congratulations! You've reached ${milestone.toLocaleString()} followers! This is a great achievement. Keep creating amazing content!`,
              priority: 'high',
              actionable: false,
              data: {
                milestone,
                currentFollowers,
                growth: followerGrowth
              },
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
            });
            break; // Only trigger one milestone at a time
          }
        }

        // Significant daily growth alert
        if (followerGrowth > Math.max(10, currentFollowers * 0.05)) { // 5% growth or 10 followers minimum
          await this.createAlert({
            userId,
            type: 'milestone',
            title: '📈 Great Growth Day!',
            message: `Amazing! You gained ${followerGrowth} followers today. That's a ${((followerGrowth / previousMetrics.followers) * 100).toFixed(1)}% increase!`,
            priority: 'medium',
            actionable: false,
            data: {
              followersGained: followerGrowth,
              growthPercentage: (followerGrowth / previousMetrics.followers) * 100
            },
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expire in 24 hours
          });
        }
      }

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to check milestones: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create and store an alert
   */
  static async createAlert(alert: Alert): Promise<void> {
    logger.info(`[AlertService] 🔔 Creating ${alert.type} alert for user ${alert.userId}`);

    try {
      // Check if similar alert already exists and is not expired
      const existingAlert = await prisma.marketingInsight.findFirst({
        where: {
          userId: alert.userId,
          type: alert.type,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      // Don't create duplicate alerts for the same type within 6 hours
      if (existingAlert) {
        const timeSinceLastAlert = Date.now() - new Date(existingAlert.createdAt).getTime();
        if (timeSinceLastAlert < 6 * 60 * 60 * 1000) { // 6 hours
          logger.debug(`[AlertService] Skipping duplicate ${alert.type} alert for user ${alert.userId}`);
          return;
        }
      }

      // Create the alert as a marketing insight
      await prisma.marketingInsight.create({
        data: {
          userId: alert.userId,
          type: alert.type,
          title: alert.title,
          content: alert.message,
          data: alert.data || {},
          priority: alert.priority === 'high' ? 3 : alert.priority === 'medium' ? 2 : 1,
          actionable: alert.actionable,
          expiresAt: alert.expiresAt
        }
      });

      logger.info(`[AlertService] ✅ Created ${alert.type} alert: ${alert.title}`);

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to create alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get active alerts for a user
   */
  static async getUserAlerts(userId: number, limit: number = 10): Promise<any[]> {
    logger.info(`[AlertService] 📋 Getting alerts for user ${userId}`);

    try {
      const alerts = await prisma.marketingInsight.findMany({
        where: {
          userId,
          isArchived: false,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return alerts;

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to get user alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Mark alert as read
   */
  static async markAlertAsRead(alertId: number, userId: number): Promise<void> {
    logger.info(`[AlertService] ✅ Marking alert ${alertId} as read for user ${userId}`);

    try {
      await prisma.marketingInsight.updateMany({
        where: {
          id: alertId,
          userId // Ensure user owns the alert
        },
        data: {
          isRead: true
        }
      });

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to mark alert as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Archive expired alerts (cleanup job)
   */
  static async archiveExpiredAlerts(): Promise<void> {
    logger.info('[AlertService] 🗂️ Archiving expired alerts');

    try {
      const result = await prisma.marketingInsight.updateMany({
        where: {
          expiresAt: {
            lt: new Date()
          },
          isArchived: false
        },
        data: {
          isArchived: true
        }
      });

      logger.info(`[AlertService] ✅ Archived ${result.count} expired alerts`);

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to archive expired alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Schedule content for auto-posting (Studio Pro feature)
   */
  static async scheduleContent(userId: number, content: any, scheduledTime: Date): Promise<void> {
    logger.info(`[AlertService] 📅 Scheduling content for user ${userId} at ${scheduledTime}`);

    try {
      // Validate user has Studio Pro plan
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      });

      if (!user || user.plan !== 'STUDIO_PRO') {
        throw new Error('Auto-scheduling requires Studio Pro plan');
      }

      // Store scheduled content as a content optimization
      await prisma.contentOptimization.create({
        data: {
          userId,
          optimizationType: 'timing',
          originalContent: JSON.stringify(content),
          optimizedContent: 'Scheduled for optimal time',
          improvement: `Scheduled for ${scheduledTime.toLocaleString()} based on audience activity patterns`,
          status: 'scheduled',
          scheduledFor: scheduledTime
        }
      });

      // Create reminder alert
      await this.createAlert({
        userId,
        type: 'content_suggestion',
        title: '📅 Content Scheduled',
        message: `Your content has been scheduled for ${scheduledTime.toLocaleString()}. We'll remind you before it's time to post.`,
        priority: 'low',
        actionable: false,
        data: { scheduledTime, content },
        expiresAt: scheduledTime
      });

      logger.info(`[AlertService] ✅ Content scheduled successfully for ${scheduledTime}`);

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to schedule content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Check for scheduled content that needs to be posted
   */
  static async checkScheduledContent(): Promise<void> {
    logger.info('[AlertService] 📋 Checking for scheduled content');

    try {
      const now = new Date();
      const scheduledContent = await prisma.contentOptimization.findMany({
        where: {
          status: 'scheduled',
          scheduledFor: {
            lte: new Date(now.getTime() + 15 * 60 * 1000) // Next 15 minutes
          }
        },
        include: { user: true }
      });

      for (const content of scheduledContent) {
        // Create posting reminder
        await this.createAlert({
          userId: content.userId,
          type: 'content_suggestion',
          title: '⏰ Time to Post!',
          message: `Your scheduled content is ready to be posted. The optimal time window is now!`,
          priority: 'high',
          actionable: true,
          data: {
            contentId: content.id,
            scheduledTime: content.scheduledFor,
            content: JSON.parse(content.originalContent)
          },
          expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000) // Expire in 2 hours
        });

        // Update status
        await prisma.contentOptimization.update({
          where: { id: content.id },
          data: { status: 'pending' }
        });
      }

      logger.info(`[AlertService] ✅ Processed ${scheduledContent.length} scheduled content items`);

    } catch (error) {
      logger.error(`[AlertService] ❌ Failed to check scheduled content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
