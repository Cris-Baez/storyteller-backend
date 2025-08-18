# 🤖 MARKETING AGENT ROADMAP - "Almost Human" Instagram Analytics & Optimization

**Project**: Storyteller AI Marketing Agent Integration  
**Goal**: Add Instagram analytics, content optimization, and automated marketing insights without breaking existing functionality  
**Timeline**: 10-12 days (modular implementation)  
**Date**: August 17, 2025

---

## 📋 **CURRENT ARCHITECTURE ANALYSIS**

### ✅ **What We Already Have (DO NOT TOUCH)**
- **Backend**: Node.js + TypeScript + Express + Prisma + PostgreSQL
- **Frontend**: Next.js with organized routes in `/src/app/`
- **Authentication**: JWT + RefreshTokens system working
- **Subscriptions**: PayPal integration with 3 plans (Starter $0, Creator $29, Studio Pro $99)
- **Video Generation**: Cinema AI + Marketing AI pipelines functional
- **Database Models**: User, Subscription, Video, SocialAccount (Instagram/YouTube/TikTok support)
- **Job System**: Async job queue with progress tracking
- **CDN**: Google Cloud Storage integration
- **APIs**: RESTful endpoints for all existing features

### 🎯 **What We're Adding (NEW FUNCTIONALITY)**
- Instagram Analytics & Audit System (Scorecard 0-100)
- Daily Brief with actionable recommendations
- Content optimization suggestions
- A/B testing for hooks/thumbnails
- Real-time post monitoring & alerts
- Weekly agency-style reports
- Auto-scheduling with best time detection
- Integration with existing CinemaAI for content variants

---

## 🏗️ **IMPLEMENTATION PHASES**

### **PHASE 1: DATABASE FOUNDATION** (Days 1-2)
**Goal**: Extend existing Prisma schema without breaking current models

#### 1.1 New Database Models
```typescript
// Add to existing prisma/schema.prisma (DO NOT MODIFY EXISTING MODELS)

model InstagramMetrics {
  id           Int      @id @default(autoincrement())
  accountId    Int
  date         DateTime @default(now())
  reach        Int?
  impressions  Int?
  engagement   Float?   // Engagement rate %
  bestHour     Int?     // 0-23 hour with best performance
  followers    Int?
  profileViews Int?
  websiteClicks Int?
  account      SocialAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("instagram_metrics")
}

model PostAnalytics {
  id              Int      @id @default(autoincrement())
  postId          String   @unique // Instagram post ID
  accountId       Int
  caption         String?
  mediaType       String?  // IMAGE, VIDEO, CAROUSEL_ALBUM
  permalink       String?
  thumbnail       String?
  likes           Int?
  comments        Int?
  saves           Int?
  reach           Int?
  impressions     Int?
  ctr             Float?   // Click-through rate
  retentionAvg    Float?   // % average retention for videos
  engagementRate  Float?   // Total engagement / reach
  postedAt        DateTime
  analyzedAt      DateTime @default(now())
  account         SocialAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@map("post_analytics")
}

model MarketingInsight {
  id        Int      @id @default(autoincrement())
  userId    Int
  type      String   // 'daily_brief', 'weekly_report', 'alert', 'recommendation'
  title     String
  content   String
  data      Json     // Flexible JSON for different insight types
  priority  Int      @default(1) // 1=low, 2=medium, 3=high
  actionable Boolean @default(true)
  isRead    Boolean  @default(false)
  isArchived Boolean @default(false)
  expiresAt DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("marketing_insights")
}

model ContentOptimization {
  id            Int      @id @default(autoincrement())
  userId        Int
  originalPostId String?
  optimizationType String // 'hook', 'thumbnail', 'caption', 'timing'
  originalContent  String
  optimizedContent String
  improvement   String   // Explanation of the improvement
  status        String   @default("pending") // pending, approved, rejected, scheduled
  scheduledFor  DateTime?
  performance   Json?    // Results after posting
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("content_optimizations")
}

model WeeklyReport {
  id            Int      @id @default(autoincrement())
  userId        Int
  weekStart     DateTime
  weekEnd       DateTime
  overallScore  Int      // 0-100
  insights      Json     // Week insights and learnings
  nextWeekPlan  Json     // 5 content pieces planned
  topPosts      Json     // Best performing posts
  improvements  Json     // Recommended improvements
  generated     Boolean  @default(false)
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, weekStart])
  @@map("weekly_reports")
}

// Add relations to existing User model
// Add these lines to existing User model:
// instagramMetrics    InstagramMetrics[]
// marketingInsights   MarketingInsight[]
// contentOptimizations ContentOptimization[]
// weeklyReports       WeeklyReport[]

// Add relations to existing SocialAccount model  
// Add these lines to existing SocialAccount model:
// instagramMetrics InstagramMetrics[]
// postAnalytics    PostAnalytics[]
```

#### 1.2 Migration Strategy
```bash
# Create migration
npx prisma migrate dev --name add_marketing_agent_models

# Generate new client
npx prisma generate
```

---

### **PHASE 2: CORE SERVICES** (Days 3-4)
**Goal**: Create the intelligence layer for Instagram analysis

#### 2.1 Instagram Analytics Service
```typescript
// src/services/InstagramAnalyticsService.ts
export class InstagramAnalyticsService {
  
  // Connect Instagram account using Instagram Basic Display API
  static async connectInstagramAccount(userId: number, accessToken: string) {
    // Validate token and get account info
    // Store in existing SocialAccount model
    // Initial sync of basic metrics
  }

  // Sync recent posts and metrics
  static async syncAccountMetrics(accountId: number) {
    // Fetch recent posts (last 25)
    // Get engagement metrics for each post
    // Store in PostAnalytics
    // Calculate daily metrics for InstagramMetrics
  }

  // Calculate overall account health score (0-100)
  static async calculateScorecard(accountId: number) {
    // Profile Health (20%): bio, profile pic, highlights
    // Content Quality (30%): engagement rate, retention, clarity
    // Consistency (20%): posting frequency, timing
    // Community (15%): comment responses, interaction
    // Growth (15%): follower growth, reach expansion
    
    return {
      overall: number,
      breakdown: {
        profile: number,
        content: number, 
        consistency: number,
        community: number,
        growth: number
      },
      recommendations: string[]
    }
  }

  // Detect best posting times based on historical data
  static async getBestPostingTimes(accountId: number) {
    // Analyze engagement by hour of day
    // Return top 3 recommended times
  }

  // Analyze individual post performance
  static async analyzePost(postId: string) {
    // Deep dive into specific post metrics
    // Compare vs account average
    // Generate specific improvement suggestions
  }
}
```

#### 2.2 Marketing Intelligence Service
```typescript
// src/services/MarketingIntelligenceService.ts
export class MarketingIntelligenceService {
  
  // Generate daily actionable brief
  static async generateDailyBrief(userId: number) {
    const account = await this.getUserPrimaryAccount(userId);
    const scorecard = await InstagramAnalyticsService.calculateScorecard(account.id);
    const bestTimes = await InstagramAnalyticsService.getBestPostingTimes(account.id);
    
    return {
      date: new Date(),
      bestHour: bestTimes[0],
      overallScore: scorecard.overall,
      actions: [
        // 3-5 specific actionable recommendations
        "Post your next video at 11:30 AM for maximum reach",
        "Try shorter hook (under 3 seconds) based on recent performance",
        "Add captions to increase retention by 15%"
      ],
      opportunities: [
        // High-impact improvements
      ],
      alerts: [
        // Any urgent items requiring attention
      ]
    };
  }

  // Generate content variants using existing CinemaAI
  static async generateContentVariants(postId: string, type: 'hook' | 'thumbnail' | 'caption') {
    // Analyze original post
    // Use existing MarketingController/CinemaAI to generate variants
    // Return 2-3 optimized options
  }

  // A/B test tracking and winner detection
  static async trackABTest(originalPostId: string, variantPostId: string) {
    // Compare performance after 24 hours
    // Determine winner based on engagement rate
    // Generate insights for future content
  }

  // Weekly report generation
  static async generateWeeklyReport(userId: number) {
    // Analyze week's performance
    // Identify patterns and insights
    // Generate next week's content plan (5 pieces)
    // Store in WeeklyReport model
  }
}
```

#### 2.3 Alert & Monitoring Service
```typescript
// src/services/AlertService.ts
export class AlertService {
  
  // Real-time post monitoring
  static async monitorPosts() {
    // Check recent posts for performance changes
    // Detect viral content (engagement >150% of average)
    // Detect underperforming content (<70% of average)
    // Create alerts in MarketingInsight model
  }

  // Generate actionable alerts
  static async createAlert(userId: number, type: string, data: any) {
    // Types: 'post_boom', 'post_underperform', 'best_time_reminder', 'content_suggestion'
    // Store in MarketingInsight with high priority
  }

  // Schedule automation (for Studio Pro users)
  static async scheduleContent(userId: number, content: any, scheduledTime: Date) {
    // Queue content for automatic posting
    // Use existing job system for scheduling
  }
}
```

---

### **PHASE 3: API CONTROLLERS** (Days 5-6)
**Goal**: Create RESTful endpoints for frontend integration

#### 3.1 Marketing Agent Controller
```typescript
// src/controllers/marketingAgentController.ts
export class MarketingAgentController {
  
  // GET /api/marketing-agent/scorecard
  async getScorecard(req: Request, res: Response) {
    const { userId } = req.user;
    const account = await SocialAccount.findFirst({
      where: { userId, platform: 'INSTAGRAM' }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'No Instagram account connected' });
    }

    const scorecard = await InstagramAnalyticsService.calculateScorecard(account.id);
    res.json(scorecard);
  }

  // GET /api/marketing-agent/daily-brief
  async getDailyBrief(req: Request, res: Response) {
    const { userId } = req.user;
    const brief = await MarketingIntelligenceService.generateDailyBrief(userId);
    res.json(brief);
  }

  // GET /api/marketing-agent/insights
  async getInsights(req: Request, res: Response) {
    const { userId } = req.user;
    const { page = 1, limit = 10 } = req.query;
    
    const insights = await MarketingInsight.findMany({
      where: { userId, isArchived: false },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    });
    
    res.json(insights);
  }

  // POST /api/marketing-agent/optimize
  async generateOptimization(req: Request, res: Response) {
    const { userId } = req.user;
    const { postId, type } = req.body; // type: 'hook' | 'thumbnail' | 'caption'
    
    // Validate user plan has optimization features
    const user = await User.findUnique({ where: { id: userId }, include: { subscription: true }});
    if (user.plan === 'STARTER' && type !== 'hook') {
      return res.status(403).json({ error: 'Upgrade to access thumbnail and caption optimization' });
    }

    const variants = await MarketingIntelligenceService.generateContentVariants(postId, type);
    res.json(variants);
  }

  // POST /api/marketing-agent/connect-instagram  
  async connectInstagram(req: Request, res: Response) {
    const { userId } = req.user;
    const { accessToken } = req.body;
    
    try {
      const account = await InstagramAnalyticsService.connectInstagramAccount(userId, accessToken);
      res.json({ success: true, account });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET /api/marketing-agent/calendar
  async getContentCalendar(req: Request, res: Response) {
    const { userId } = req.user;
    const { month, year } = req.query;
    
    // Get scheduled content + best times + historical performance
    const calendar = await this.buildContentCalendar(userId, month, year);
    res.json(calendar);
  }

  // POST /api/marketing-agent/schedule
  async scheduleContent(req: Request, res: Response) {
    const { userId } = req.user;
    const { content, scheduledTime } = req.body;
    
    // Validate user plan (Studio Pro only)
    const user = await User.findUnique({ where: { id: userId }});
    if (user.plan !== 'STUDIO_PRO') {
      return res.status(403).json({ error: 'Auto-scheduling requires Studio Pro plan' });
    }

    await AlertService.scheduleContent(userId, content, new Date(scheduledTime));
    res.json({ success: true });
  }
}
```

#### 3.2 Instagram Integration Controller
```typescript
// src/controllers/instagramController.ts
export class InstagramController {
  
  // POST /api/instagram/sync
  async syncAccount(req: Request, res: Response) {
    const { userId } = req.user;
    const account = await SocialAccount.findFirst({
      where: { userId, platform: 'INSTAGRAM' }
    });

    if (!account) {
      return res.status(404).json({ error: 'No Instagram account found' });
    }

    // Trigger sync job using existing job system
    const job = await jobQueue.add('instagram-sync', {
      accountId: account.id,
      userId
    });

    res.json({ jobId: job.id, status: 'syncing' });
  }

  // GET /api/instagram/posts
  async getPosts(req: Request, res: Response) {
    const { userId } = req.user;
    const { limit = 25 } = req.query;
    
    const posts = await PostAnalytics.findMany({
      where: { 
        account: { 
          userId: userId 
        } 
      },
      orderBy: { postedAt: 'desc' },
      take: Number(limit),
      include: { account: true }
    });

    res.json(posts);
  }

  // GET /api/instagram/analytics/:postId
  async getPostAnalytics(req: Request, res: Response) {
    const { postId } = req.params;
    const { userId } = req.user;
    
    const post = await PostAnalytics.findFirst({
      where: { 
        postId,
        account: { userId }
      },
      include: { account: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const analysis = await InstagramAnalyticsService.analyzePost(postId);
    res.json({ post, analysis });
  }
}
```

#### 3.3 Routes Configuration
```typescript
// src/routes/marketingAgentRoutes.ts
import { Router } from 'express';
import { MarketingAgentController } from '../controllers/marketingAgentController.js';
import { InstagramController } from '../controllers/instagramController.js';
import { authenticate, checkPlanLimits } from '../middleware/auth.js';

const router = Router();
const marketingController = new MarketingAgentController();
const instagramController = new InstagramController();

// Marketing Agent routes
router.get('/scorecard', authenticate, marketingController.getScorecard);
router.get('/daily-brief', authenticate, marketingController.getDailyBrief);
router.get('/insights', authenticate, marketingController.getInsights);
router.get('/calendar', authenticate, marketingController.getContentCalendar);

router.post('/optimize', authenticate, checkPlanLimits('content_optimization'), marketingController.generateOptimization);
router.post('/connect-instagram', authenticate, marketingController.connectInstagram);
router.post('/schedule', authenticate, checkPlanLimits('auto_scheduling'), marketingController.scheduleContent);

// Instagram-specific routes
router.post('/instagram/sync', authenticate, instagramController.syncAccount);
router.get('/instagram/posts', authenticate, instagramController.getPosts);
router.get('/instagram/analytics/:postId', authenticate, instagramController.getPostAnalytics);

export default router;
```

---

### **PHASE 4: FRONTEND DASHBOARD** (Days 7-8)
**Goal**: Create intuitive UI that integrates with existing frontend

#### 4.1 Main Marketing Agent Page
```typescript
// storyteller-frontend/src/app/marketing-agent/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ScorecardCard } from '@/components/marketing/ScorecardCard';
import { DailyBrief } from '@/components/marketing/DailyBrief';
import { QuickActions } from '@/components/marketing/QuickActions';
import { RecentPosts } from '@/components/marketing/RecentPosts';
import { ConnectInstagram } from '@/components/marketing/ConnectInstagram';

export default function MarketingAgentPage() {
  const { user } = useAuth();
  const [scorecard, setScorecard] = useState(null);
  const [dailyBrief, setDailyBrief] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInstagram, setHasInstagram] = useState(false);

  useEffect(() => {
    if (user) {
      checkInstagramConnection();
      if (hasInstagram) {
        fetchDashboardData();
      }
    }
  }, [user, hasInstagram]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [scorecardRes, briefRes, insightsRes] = await Promise.all([
        fetch('/api/marketing-agent/scorecard'),
        fetch('/api/marketing-agent/daily-brief'),
        fetch('/api/marketing-agent/insights')
      ]);

      setScorecard(await scorecardRes.json());
      setDailyBrief(await briefRes.json());
      setInsights(await insightsRes.json());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasInstagram) {
    return <ConnectInstagram onConnected={() => setHasInstagram(true)} />;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Marketing Agent</h1>
        <button 
          onClick={fetchDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Scorecard Overview */}
      <ScorecardCard scorecard={scorecard} />

      {/* Daily Brief */}
      <DailyBrief brief={dailyBrief} />

      {/* Quick Actions */}
      <QuickActions 
        user={user}
        onOptimize={handleOptimize}
        onSchedule={handleSchedule}
      />

      {/* Recent Posts Performance */}
      <RecentPosts />
    </div>
  );
}
```

#### 4.2 Key Components
```typescript
// storyteller-frontend/src/components/marketing/ScorecardCard.tsx
export function ScorecardCard({ scorecard }) {
  if (!scorecard) return <div>Loading scorecard...</div>;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Account Health Score</h2>
      
      <div className="flex items-center justify-center mb-6">
        <div className={`text-4xl font-bold ${getScoreColor(scorecard.overall)}`}>
          {scorecard.overall}/100
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(scorecard.breakdown).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className={`text-lg font-semibold ${getScoreColor(value)}`}>
              {value}
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {key.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>

      {scorecard.recommendations && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-2">Top Recommendations</h3>
          <ul className="space-y-1 text-sm">
            {scorecard.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// storyteller-frontend/src/components/marketing/DailyBrief.tsx
export function DailyBrief({ brief }) {
  if (!brief) return <div>Loading daily brief...</div>;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Today's Brief</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-blue-600">Best Time to Post</h3>
          <div className="text-2xl font-bold">
            {brief.bestHour}:00
          </div>
          <p className="text-sm text-gray-600">Peak audience activity</p>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-green-600">Score Trend</h3>
          <div className="text-2xl font-bold">
            {brief.overallScore}/100
          </div>
          <p className="text-sm text-gray-600">Current performance</p>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h3 className="font-semibold text-purple-600">Actions Today</h3>
          <div className="text-2xl font-bold">
            {brief.actions?.length || 0}
          </div>
          <p className="text-sm text-gray-600">Recommended actions</p>
        </div>
      </div>

      {brief.actions && brief.actions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Today's Action Items</h3>
          <div className="space-y-2">
            {brief.actions.map((action, index) => (
              <div key={index} className="bg-white rounded-lg p-3 flex items-center">
                <input type="checkbox" className="mr-3" />
                <span className="flex-1">{action}</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// storyteller-frontend/src/components/marketing/QuickActions.tsx
export function QuickActions({ user, onOptimize, onSchedule }) {
  const isPro = user?.plan === 'STUDIO_PRO';
  const isCreator = user?.plan === 'CREATOR' || isPro;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => onOptimize('hook')}
          className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <div className="text-lg font-semibold">Generate Hook Variants</div>
          <div className="text-sm opacity-90">Create engaging opening lines</div>
        </button>

        <button 
          onClick={() => onOptimize('thumbnail')}
          disabled={!isCreator}
          className={`p-4 rounded-lg transition-colors ${
            isCreator 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <div className="text-lg font-semibold">Optimize Thumbnails</div>
          <div className="text-sm opacity-90">
            {isCreator ? 'Improve visual appeal' : 'Creator+ feature'}
          </div>
        </button>

        <button 
          onClick={onSchedule}
          disabled={!isPro}
          className={`p-4 rounded-lg transition-colors ${
            isPro 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <div className="text-lg font-semibold">Auto Schedule</div>
          <div className="text-sm opacity-90">
            {isPro ? 'Queue optimal posting' : 'Studio Pro feature'}
          </div>
        </button>
      </div>
    </div>
  );
}
```

#### 4.3 Integration with Existing Layout
```typescript
// Add to storyteller-frontend/src/app/layout.tsx navigation
// Add marketing agent link to existing navigation

// Update existing dashboard to include marketing agent card
// storyteller-frontend/src/app/dashboard/page.tsx - add marketing summary card
```

---

### **PHASE 5: JOB SYSTEM INTEGRATION** (Days 9-10)
**Goal**: Integrate with existing job queue for automated tasks

#### 5.1 Marketing Jobs
```typescript
// src/jobs/marketingJobs.ts
import { jobQueue } from './jobQueue.js';

// Instagram sync job
jobQueue.add('instagram-sync', async (data) => {
  const { accountId, userId } = data;
  
  try {
    await InstagramAnalyticsService.syncAccountMetrics(accountId);
    
    // Generate insights after sync
    await MarketingIntelligenceService.generateDailyBrief(userId);
    
    // Check for any alerts
    await AlertService.monitorPosts();
    
    return { success: true, synced: true };
  } catch (error) {
    throw new Error(`Instagram sync failed: ${error.message}`);
  }
});

// Weekly report generation
jobQueue.add('weekly-report', async (data) => {
  const { userId } = data;
  
  const report = await MarketingIntelligenceService.generateWeeklyReport(userId);
  
  // Could integrate with email service if needed
  return { success: true, report };
});

// Content monitoring job (runs every hour)
jobQueue.add('content-monitor', async () => {
  await AlertService.monitorPosts();
  return { success: true };
});

// Auto-posting job (Studio Pro feature)
jobQueue.add('auto-post', async (data) => {
  const { userId, content, platform } = data;
  
  // Validate user has Studio Pro
  const user = await User.findUnique({ where: { id: userId }});
  if (user.plan !== 'STUDIO_PRO') {
    throw new Error('Auto-posting requires Studio Pro plan');
  }

  // Post content using platform API
  // This would integrate with Instagram/TikTok/YouTube APIs
  
  return { success: true, posted: true };
});
```

#### 5.2 Scheduled Tasks
```typescript
// src/jobs/marketingScheduler.ts
import cron from 'node-cron';

// Daily sync at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('Running daily Instagram sync...');
  
  const activeAccounts = await SocialAccount.findMany({
    where: { platform: 'INSTAGRAM', isActive: true }
  });

  for (const account of activeAccounts) {
    await jobQueue.add('instagram-sync', {
      accountId: account.id,
      userId: account.userId
    });
  }
});

// Hourly content monitoring
cron.schedule('0 * * * *', async () => {
  await jobQueue.add('content-monitor', {});
});

// Weekly reports on Sundays at 8 AM
cron.schedule('0 8 * * 0', async () => {
  console.log('Generating weekly reports...');
  
  const users = await User.findMany({
    where: { 
      plan: { in: ['CREATOR', 'STUDIO_PRO'] },
      isActive: true 
    }
  });

  for (const user of users) {
    await jobQueue.add('weekly-report', {
      userId: user.id
    });
  }
});
```

---

### **PHASE 6: PLAN LIMITS & FEATURES** (Day 11)
**Goal**: Integrate with existing subscription system

#### 6.1 Plan Feature Matrix
```typescript
// src/config/planFeatures.ts
export const PLAN_FEATURES = {
  STARTER: {
    instagram_accounts: 1,
    scorecard_frequency: 'weekly',
    daily_brief: false,
    content_optimization: ['hook'], // Only basic hook optimization
    ab_testing: 1, // per month
    auto_scheduling: false,
    alerts: false,
    weekly_reports: false
  },
  CREATOR: {
    instagram_accounts: 1,
    tiktok_accounts: 1,
    youtube_accounts: 1,
    scorecard_frequency: 'daily',
    daily_brief: true,
    content_optimization: ['hook', 'thumbnail', 'caption'],
    ab_testing: 'unlimited',
    auto_scheduling: false,
    alerts: true,
    weekly_reports: true,
    cinema_integration: true // Generate variants with CinemaAI
  },
  STUDIO_PRO: {
    instagram_accounts: 3,
    tiktok_accounts: 3,
    youtube_accounts: 3,
    scorecard_frequency: 'daily',
    daily_brief: true,
    content_optimization: ['hook', 'thumbnail', 'caption', 'timing'],
    ab_testing: 'unlimited',
    auto_scheduling: true,
    alerts: true,
    weekly_reports: true,
    cinema_integration: true,
    autopilot_mode: true,
    comment_responses: true,
    advanced_analytics: true
  }
};
```

#### 6.2 Updated Middleware
```typescript
// Update existing src/middleware/auth.ts
export const checkMarketingFeature = (feature: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const userPlan = user.plan;
    const planFeatures = PLAN_FEATURES[userPlan];

    if (!planFeatures[feature]) {
      return res.status(403).json({
        error: `${feature} is not available in your current plan`,
        upgrade: `Upgrade to ${feature === 'auto_scheduling' ? 'Studio Pro' : 'Creator'} to access this feature`
      });
    }

    next();
  };
};
```

---

## 🔗 **INTEGRATION POINTS**

### **With Existing CinemaAI**
- Use `MarketingController.createMarketingVideo()` for variant generation
- Leverage existing prompt engineering for content optimization
- Reuse video generation pipeline for visual content

### **With Existing Auth System**
- Extend current JWT middleware for new routes
- Use existing User/Subscription models
- Maintain current plan validation logic

### **With Existing Job Queue**
- Add marketing jobs to current queue system
- Use existing progress tracking
- Leverage current error handling and retries

### **With Existing Database**
- Add new models without modifying existing ones
- Use current Prisma setup and migrations
- Maintain existing relationships and constraints

---

## 📊 **SUCCESS METRICS**

### **Technical Metrics**
- [ ] All new endpoints respond < 500ms
- [ ] Instagram sync completes in < 2 minutes
- [ ] Scorecard calculation < 5 seconds
- [ ] Daily brief generation < 3 seconds
- [ ] Zero breaking changes to existing functionality

### **Feature Completeness**
- [ ] Instagram account connection working
- [ ] Scorecard calculation accurate
- [ ] Daily brief actionable and relevant
- [ ] Content optimization integrated with CinemaAI
- [ ] A/B testing tracking functional
- [ ] Plan-based feature gating working
- [ ] Automated scheduling (Studio Pro) working

### **User Experience**
- [ ] Onboarding flow intuitive (< 3 minutes)
- [ ] Dashboard loads quickly (< 2 seconds)
- [ ] Recommendations are actionable
- [ ] Plan upgrades clearly communicated
- [ ] Mobile responsive design

---

## ⚠️ **RISK MITIGATION**

### **Data Safety**
- Never modify existing User, Video, or Subscription models
- All new models use separate tables with foreign keys
- Implement soft deletes for user data
- Regular backups before each phase

### **API Rate Limits**
- Instagram Basic Display API: 200 calls/hour per user
- Implement exponential backoff for API calls
- Cache results for 1 hour minimum
- Graceful degradation when limits exceeded

### **Performance**
- Index all foreign keys and frequently queried fields
- Implement pagination for all list endpoints
- Use background jobs for heavy computations
- Monitor database query performance

### **Feature Flags**
- Each phase can be enabled/disabled independently
- Rollback strategy for each component
- A/B test new features with subset of users

---

## 🎯 **FINAL DELIVERABLES**

After completing all phases, we will have:

1. **Complete Marketing Agent Dashboard** integrated with existing UI
2. **Instagram Analytics Engine** with real-time monitoring
3. **Content Optimization System** using existing CinemaAI
4. **Automated Insights & Alerts** for all user segments
5. **Plan-based Feature Access** integrated with current subscription system
6. **Weekly Reports & Planning** for Creator+ users
7. **Auto-scheduling System** for Studio Pro users
8. **Mobile-responsive Interface** consistent with existing design

The system will seamlessly extend your current Storyteller AI platform without breaking any existing functionality, providing users with a comprehensive "almost human" marketing agent that analyzes, optimizes, and automates their social media strategy.

---

**Next Step**: Begin Phase 1 - Database Foundation
