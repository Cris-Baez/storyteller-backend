import { Request, Response } from 'express';
import { InstagramAnalyticsService } from '../services/InstagramAnalyticsService.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Instagram Controller - API endpoints for Instagram analytics and management
 * Handles Instagram-specific operations for the Marketing Agent
 */

/**
 * POST /api/instagram/sync
 * Trigger sync job for Instagram account metrics
 */
export async function syncAccount(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    logger.info(`[InstagramController] Syncing account for user ${userId}`);

    // Get user's Instagram account
    const account = await prisma.socialAccount.findFirst({
      where: { 
        userId, 
        platform: 'INSTAGRAM',
        isActive: true 
      }
    });

    if (!account) {
      return res.status(404).json({ 
        success: false,
        error: 'No Instagram account found' 
      });
    }

    if (!account.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Instagram account is not properly connected. Please reconnect your account.'
      });
    }

    // Trigger sync using the real service
    await InstagramAnalyticsService.syncAccountMetrics(account.id);

    res.json({ 
      success: true,
      message: 'Instagram account sync completed',
      accountId: account.id,
      username: account.username
    });

  } catch (error) {
    logger.error('[InstagramController] Sync account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync Instagram account',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

/**
 * GET /api/instagram/posts
 * Get Instagram posts with analytics data
 */
export async function getPosts(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const { limit = 25, page = 1 } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    logger.info(`[InstagramController] Getting posts for user ${userId}, page ${page}, limit ${limit}`);
    
    const posts = await prisma.postAnalytics.findMany({
      where: { 
        account: { 
          userId: userId,
          platform: 'INSTAGRAM',
          isActive: true
        } 
      },
      orderBy: { postedAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit),
      include: { 
        account: {
          select: {
            id: true,
            username: true,
            platform: true
          }
        }
      }
    });

    const total = await prisma.postAnalytics.count({
      where: { 
        account: { 
          userId: userId,
          platform: 'INSTAGRAM',
          isActive: true
        } 
      }
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });

  } catch (error) {
    logger.error('[InstagramController] Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Instagram posts',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

/**
 * GET /api/instagram/analytics/:postId
 * Get detailed analytics for a specific Instagram post
 */
export async function getPostAnalytics(req: Request, res: Response) {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!postId) {
      return res.status(400).json({
        success: false,
        error: 'Post ID is required'
      });
    }

    logger.info(`[InstagramController] Getting analytics for post ${postId}, user ${userId}`);
    
    // Get post data
    const post = await prisma.postAnalytics.findFirst({
      where: { 
        postId,
        account: { 
          userId,
          platform: 'INSTAGRAM'
        }
      },
      include: { 
        account: {
          select: {
            id: true,
            username: true,
            platform: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ 
        success: false,
        error: 'Post not found or you do not have access to it' 
      });
    }

    // Get detailed analysis using the real service
    const analysis = await InstagramAnalyticsService.analyzePost(postId);
    
    res.json({
      success: true,
      data: {
        post,
        analysis
      }
    });

  } catch (error) {
    logger.error('[InstagramController] Get post analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get post analytics',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

/**
 * GET /api/instagram/account
 * Get Instagram account information and basic metrics
 */
export async function getAccountInfo(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    logger.info(`[InstagramController] Getting account info for user ${userId}`);

    // Get account data
    const account = await prisma.socialAccount.findFirst({
      where: { 
        userId, 
        platform: 'INSTAGRAM',
        isActive: true 
      },
      include: {
        instagramMetrics: {
          orderBy: { date: 'desc' },
          take: 7 // Last 7 days of metrics
        }
      }
    });

    if (!account) {
      return res.status(404).json({ 
        success: false,
        error: 'No Instagram account connected' 
      });
    }

    // Get latest metrics
    const latestMetrics = account.instagramMetrics[0];
    
    res.json({
      success: true,
      data: {
        account: {
          id: account.id,
          username: account.username,
          platformUserId: account.platformUserId,
          isActive: account.isActive,
          connectedAt: account.createdAt,
          settings: account.settings
        },
        latestMetrics: latestMetrics ? {
          followers: latestMetrics.followers,
          engagement: latestMetrics.engagement,
          bestHour: latestMetrics.bestHour,
          profileViews: latestMetrics.profileViews,
          websiteClicks: latestMetrics.websiteClicks,
          lastUpdated: latestMetrics.updatedAt
        } : null,
        weeklyMetrics: account.instagramMetrics.map(metric => ({
          date: metric.date,
          engagement: metric.engagement,
          followers: metric.followers,
          profileViews: metric.profileViews
        }))
      }
    });

  } catch (error) {
    logger.error('[InstagramController] Get account info error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get account information',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}
