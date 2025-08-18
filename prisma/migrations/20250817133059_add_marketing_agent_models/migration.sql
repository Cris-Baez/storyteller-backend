-- CreateTable
CREATE TABLE "public"."user_business_memory" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "businessType" TEXT,
    "businessName" TEXT,
    "industry" TEXT,
    "targetAudience" JSONB,
    "brandVoice" TEXT,
    "competitors" JSONB,
    "valueProposition" TEXT,
    "videosCreated" JSONB,
    "successfulCopy" JSONB,
    "platformMetrics" JSONB,
    "engagementData" JSONB,
    "preferredStyles" JSONB,
    "optimalTimes" JSONB,
    "budgetInfo" JSONB,
    "painPoints" JSONB,
    "favoriteEngines" JSONB,
    "lastInteraction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_business_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation_memory" (
    "id" TEXT NOT NULL,
    "businessMemoryId" TEXT NOT NULL,
    "userMessage" TEXT NOT NULL,
    "agentResponse" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "outcome" TEXT NOT NULL DEFAULT 'helpful',
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "actionsTaken" JSONB,
    "confidence" DOUBLE PRECISION,
    "needsMoreInfo" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."instagram_metrics" (
    "id" SERIAL NOT NULL,
    "accountId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reach" INTEGER,
    "impressions" INTEGER,
    "engagement" DOUBLE PRECISION,
    "bestHour" INTEGER,
    "followers" INTEGER,
    "profileViews" INTEGER,
    "websiteClicks" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instagram_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_analytics" (
    "id" SERIAL NOT NULL,
    "postId" TEXT NOT NULL,
    "accountId" INTEGER NOT NULL,
    "caption" TEXT,
    "mediaType" TEXT,
    "permalink" TEXT,
    "thumbnail" TEXT,
    "likes" INTEGER,
    "comments" INTEGER,
    "saves" INTEGER,
    "reach" INTEGER,
    "impressions" INTEGER,
    "ctr" DOUBLE PRECISION,
    "retentionAvg" DOUBLE PRECISION,
    "engagementRate" DOUBLE PRECISION,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."marketing_insights" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "actionable" BOOLEAN NOT NULL DEFAULT true,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."content_optimizations" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "originalPostId" TEXT,
    "optimizationType" TEXT NOT NULL,
    "originalContent" TEXT NOT NULL,
    "optimizedContent" TEXT NOT NULL,
    "improvement" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scheduledFor" TIMESTAMP(3),
    "performance" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_optimizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weekly_reports" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "insights" JSONB NOT NULL,
    "nextWeekPlan" JSONB NOT NULL,
    "topPosts" JSONB NOT NULL,
    "improvements" JSONB NOT NULL,
    "generated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_business_memory_userId_key" ON "public"."user_business_memory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "post_analytics_postId_key" ON "public"."post_analytics"("postId");

-- CreateIndex
CREATE INDEX "weekly_reports_userId_weekStart_idx" ON "public"."weekly_reports"("userId", "weekStart");

-- AddForeignKey
ALTER TABLE "public"."user_business_memory" ADD CONSTRAINT "user_business_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation_memory" ADD CONSTRAINT "conversation_memory_businessMemoryId_fkey" FOREIGN KEY ("businessMemoryId") REFERENCES "public"."user_business_memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."instagram_metrics" ADD CONSTRAINT "instagram_metrics_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_analytics" ADD CONSTRAINT "post_analytics_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."marketing_insights" ADD CONSTRAINT "marketing_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."content_optimizations" ADD CONSTRAINT "content_optimizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weekly_reports" ADD CONSTRAINT "weekly_reports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
