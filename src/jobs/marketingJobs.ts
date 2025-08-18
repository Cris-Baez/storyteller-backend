import { InstagramAnalyticsService } from '../services/InstagramAnalyticsService.js';
import { MarketingAgentAnalyticsService } from '../services/MarketingAgentAnalyticsService.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Marketing Jobs - Background jobs for Instagram analytics and marketing automation
 * Integrates with existing job queue system for Marketing Agent functionality
 */

export interface MarketingJobData {
  userId: number;
  accountId?: number;
  jobType: 'instagram-sync' | 'weekly-report' | 'content-monitor' | 'daily-brief';
  metadata?: any;
}

export interface MarketingJobResult {
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

/**
 * Instagram sync job - Synchronize account metrics and posts
 */
export async function executeInstagramSyncJob(data: {
  accountId: number;
  userId: number;
}): Promise<MarketingJobResult> {
  const startTime = Date.now();
  
  try {
    logger.info(`[MarketingJobs] Starting Instagram sync for account ${data.accountId}, user ${data.userId}`);

    // Verify account exists and belongs to user
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: data.accountId,
        userId: data.userId,
        platform: 'INSTAGRAM',
        isActive: true
      }
    });

    if (!account) {
      throw new Error(`Instagram account ${data.accountId} not found or not accessible for user ${data.userId}`);
    }

    if (!account.accessToken) {
      throw new Error('Instagram account access token is missing');
    }

    // Perform sync using real service
    await InstagramAnalyticsService.syncAccountMetrics(data.accountId);

    // Generate daily brief after sync if it's a new day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingBrief = await prisma.marketingInsight.findFirst({
      where: {
        userId: data.userId,
        type: 'daily_brief',
        createdAt: {
          gte: today
        }
      }
    });

    if (!existingBrief) {
      logger.info(`[MarketingJobs] Generating daily brief for user ${data.userId}`);
      const brief = await MarketingAgentAnalyticsService.generateDailyBrief(data.userId);
      
      // Store brief as marketing insight
      await prisma.marketingInsight.create({
        data: {
          userId: data.userId,
          type: 'daily_brief',
          title: 'Daily Marketing Brief',
          content: `Generated daily brief with ${brief.actions?.length || 0} actionable insights`,
          data: JSON.parse(JSON.stringify(brief)), // Convert to JSON-safe object
          priority: 2
        }
      });
    }

    const processingTime = Date.now() - startTime;
    logger.info(`[MarketingJobs] Instagram sync completed in ${processingTime}ms`);

    return {
      success: true,
      data: {
        synced: true,
        accountId: data.accountId,
        briefGenerated: !existingBrief
      },
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error(`[MarketingJobs] Instagram sync failed:`, error);
    
    return {
      success: false,
      error: errorMessage,
      processingTime
    };
  }
}

/**
 * Weekly report generation job
 */
export async function executeWeeklyReportJob(data: {
  userId: number;
}): Promise<MarketingJobResult> {
  const startTime = Date.now();
  
  try {
    logger.info(`[MarketingJobs] Starting weekly report generation for user ${data.userId}`);

    // Check if user has Creator or Studio Pro plan
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { subscription: true }
    });

    if (!user) {
      throw new Error(`User ${data.userId} not found`);
    }

    if (user.plan === 'STARTER') {
      throw new Error('Weekly reports require Creator or Studio Pro plan');
    }

    // Check if report already exists for this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999);

    const existingReport = await prisma.weeklyReport.findFirst({
      where: {
        userId: data.userId,
        weekStart: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    if (existingReport) {
      logger.info(`[MarketingJobs] Weekly report already exists for user ${data.userId}`);
      return {
        success: true,
        data: { reportId: existingReport.id, alreadyExists: true },
        processingTime: Date.now() - startTime
      };
    }

    // Generate weekly report
    const reportData = await MarketingAgentAnalyticsService.generateWeeklyReport(data.userId);

    // Store in database
    const weeklyReport = await prisma.weeklyReport.create({
      data: {
        userId: data.userId,
        weekStart,
        weekEnd,
        overallScore: reportData.overallScore,
        insights: JSON.parse(JSON.stringify(reportData.insights)),
        nextWeekPlan: JSON.parse(JSON.stringify(reportData.nextWeekPlan)),
        topPosts: JSON.parse(JSON.stringify(reportData.insights.topPerformingContent)),
        improvements: JSON.parse(JSON.stringify(reportData.insights.recommendations)),
        generated: true
      }
    });

    // Create marketing insight notification
    await prisma.marketingInsight.create({
      data: {
        userId: data.userId,
        type: 'weekly_report',
        title: 'Weekly Report Ready',
        content: `Your weekly marketing report is ready with score ${reportData.overallScore}/100`,
        data: { reportId: weeklyReport.id },
        priority: 2
      }
    });

    const processingTime = Date.now() - startTime;
    logger.info(`[MarketingJobs] Weekly report generated in ${processingTime}ms`);

    return {
      success: true,
      data: { 
        reportId: weeklyReport.id,
        overallScore: reportData.overallScore 
      },
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error(`[MarketingJobs] Weekly report generation failed:`, error);
    
    return {
      success: false,
      error: errorMessage,
      processingTime
    };
  }
}

/**
 * Content monitoring job - Check for viral/underperforming content
 */
export async function executeContentMonitorJob(): Promise<MarketingJobResult> {
  const startTime = Date.now();
  
  try {
    logger.info(`[MarketingJobs] Starting content monitoring`);

    // Get all active Instagram accounts
    const accounts = await prisma.socialAccount.findMany({
      where: {
        platform: 'INSTAGRAM',
        isActive: true
      },
      include: {
        user: true
      }
    });

    let alertsCreated = 0;

    for (const account of accounts) {
      try {
        // Get recent posts (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const recentPosts = await prisma.postAnalytics.findMany({
          where: {
            accountId: account.id,
            postedAt: {
              gte: yesterday
            }
          },
          orderBy: { postedAt: 'desc' }
        });

        if (recentPosts.length === 0) continue;

        // Get account average engagement for comparison
        const accountPosts = await prisma.postAnalytics.findMany({
          where: { accountId: account.id },
          orderBy: { postedAt: 'desc' },
          take: 20 // Last 20 posts for average
        });

        if (accountPosts.length < 5) continue; // Need minimum data for comparison

        const avgEngagement = accountPosts.reduce((sum, post) => {
          const engagement = (post.likes || 0) + (post.comments || 0);
          return sum + engagement;
        }, 0) / accountPosts.length;

        // Check each recent post
        for (const post of recentPosts) {
          const postEngagement = (post.likes || 0) + (post.comments || 0);
          
          // Viral content detection (>150% of average)
          if (postEngagement > avgEngagement * 1.5) {
            await prisma.marketingInsight.create({
              data: {
                userId: account.userId,
                type: 'alert',
                title: 'Viral Content Detected! 🔥',
                content: `Your post is performing exceptionally well with ${postEngagement} total engagements (${Math.round((postEngagement / avgEngagement) * 100)}% above average)`,
                data: {
                  postId: post.postId,
                  engagement: postEngagement,
                  averageEngagement: Math.round(avgEngagement),
                  performanceRatio: postEngagement / avgEngagement
                },
                priority: 3
              }
            });
            alertsCreated++;
          }
          
          // Underperforming content detection (<70% of average)
          else if (postEngagement < avgEngagement * 0.7 && postEngagement > 0) {
            await prisma.marketingInsight.create({
              data: {
                userId: account.userId,
                type: 'alert',
                title: 'Content Needs Attention',
                content: `This post is underperforming with ${postEngagement} engagements. Consider boosting or analyzing what went different.`,
                data: {
                  postId: post.postId,
                  engagement: postEngagement,
                  averageEngagement: Math.round(avgEngagement),
                  performanceRatio: postEngagement / avgEngagement
                },
                priority: 2
              }
            });
            alertsCreated++;
          }
        }

      } catch (accountError) {
        logger.error(`[MarketingJobs] Error monitoring account ${account.id}:`, accountError);
        // Continue with other accounts
      }
    }

    const processingTime = Date.now() - startTime;
    logger.info(`[MarketingJobs] Content monitoring completed, ${alertsCreated} alerts created in ${processingTime}ms`);

    return {
      success: true,
      data: {
        accountsMonitored: accounts.length,
        alertsCreated
      },
      processingTime
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error(`[MarketingJobs] Content monitoring failed:`, error);
    
    return {
      success: false,
      error: errorMessage,
      processingTime
    };
  }
}
