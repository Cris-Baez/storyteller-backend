import prisma from '../config/prismaClient.js';
import { Plan } from '@prisma/client';

const PLAN_LIMITS = {
  STARTER: { videos: 3, editor: 0, agent: 10 },
  CREATOR: { videos: 20, editor: 0, agent: 100 },
  STUDIO_PRO: { videos: Infinity, editor: Infinity, agent: Infinity },
} as const;

class PlanLimitService {
  private getNextWeekReset() {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + (7 - now.getDay()));
    nextWeek.setHours(0, 0, 0, 0);
    return nextWeek;
  }

  async getUsage(userId: number) {
    let usage = await prisma.usage.findUnique({ where: { userId } });

    // Reset semanal
    if (usage && usage.weekResetDate < new Date()) {
      usage = await prisma.usage.update({
        where: { userId },
        data: {
          videosThisWeek: 0,
          editorUsage: 0,
          agentGenerations: 0,
          weekResetDate: this.getNextWeekReset(),
        },
      });
    }

    return usage;
  }

  async recordFeatureUsage(
    userId: number,
    updateData: Partial<{
      videosThisWeek: number;
      editorUsage: number;
      agentGenerations: number;
      lastEditorUse: Date;
      lastAgentUse: Date;
      lastVideoGenerated: Date;
    }>
  ) {
    const existing = await prisma.usage.findUnique({ where: { userId } });

    if (existing) {
      return prisma.usage.update({
        where: { userId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
    } else {
      return prisma.usage.create({
        data: {
          userId,
          weekResetDate: this.getNextWeekReset(),
          ...updateData, // ✅ bug arreglado
        },
      });
    }
  }

  async validateVideoAccess(userId: number, plan: Plan) {
    const usage = await this.getUsage(userId);
    const limit = PLAN_LIMITS[plan].videos;

    if (limit !== Infinity && (usage?.videosThisWeek ?? 0) >= limit) {
      throw new Error('Plan limit exceeded: videos');
    }
  }

  async validateEditorAccess(userId: number, plan: Plan) {
    if (PLAN_LIMITS[plan].editor === 0) {
      throw new Error('Editor Pro is only available for Studio Pro plan');
    }

    const usage = await this.getUsage(userId);
    const limit = PLAN_LIMITS[plan].editor;

    if (limit !== Infinity && (usage?.editorUsage ?? 0) >= limit) {
      throw new Error('Plan limit exceeded: editor');
    }
  }

  async validateAgentAccess(userId: number, plan: Plan) {
    const usage = await this.getUsage(userId);
    const limit = PLAN_LIMITS[plan].agent;

    if (limit !== Infinity && (usage?.agentGenerations ?? 0) >= limit) {
      throw new Error('Plan limit exceeded: agent generations');
    }
  }
}

export default new PlanLimitService();
