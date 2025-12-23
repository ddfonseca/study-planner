import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, Subscription } from '@prisma/client';

export interface FeatureLimitCheck {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  feature: string;
}

export interface UserLimits {
  plan: string;
  limits: Record<string, number>;
}

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      include: {
        limits: true,
      },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  /**
   * Get the free plan (default)
   */
  async getFreePlan(): Promise<SubscriptionPlan> {
    const freePlan = await this.prisma.subscriptionPlan.findUnique({
      where: { name: 'free' },
      include: { limits: true },
    });

    if (!freePlan) {
      throw new Error('Free plan not found. Please run seed script.');
    }

    return freePlan;
  }

  /**
   * Get user's current subscription (or free plan if none)
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        plan: {
          include: { limits: true },
        },
      },
    });
  }

  /**
   * Get user's current plan (subscription plan or free)
   */
  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const subscription = await this.getUserSubscription(userId);

    if (subscription && subscription.status === 'ACTIVE') {
      return this.prisma.subscriptionPlan.findUnique({
        where: { id: subscription.planId },
        include: { limits: true },
      }) as Promise<SubscriptionPlan>;
    }

    return this.getFreePlan();
  }

  /**
   * Get user's limits for all features
   */
  async getUserLimits(userId: string): Promise<UserLimits> {
    const plan = await this.getUserPlan(userId);

    const limits = await this.prisma.planLimit.findMany({
      where: { planId: plan.id },
    });

    const limitsMap: Record<string, number> = {};
    for (const limit of limits) {
      limitsMap[limit.feature] = limit.limitValue;
    }

    return {
      plan: plan.name,
      limits: limitsMap,
    };
  }

  /**
   * Get limit value for a specific feature
   * Returns -1 if unlimited, 0 if feature not available
   */
  async getFeatureLimit(userId: string, feature: string): Promise<number> {
    const plan = await this.getUserPlan(userId);

    const limit = await this.prisma.planLimit.findUnique({
      where: {
        planId_feature: {
          planId: plan.id,
          feature,
        },
      },
    });

    return limit?.limitValue ?? 0;
  }

  /**
   * Check if user can use a feature (hasn't reached limit)
   */
  async checkFeatureLimit(
    userId: string,
    feature: string,
    currentUsage: number,
  ): Promise<FeatureLimitCheck> {
    const limit = await this.getFeatureLimit(userId, feature);

    // -1 means unlimited
    const allowed = limit === -1 || currentUsage < limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - currentUsage);

    return {
      allowed,
      limit,
      current: currentUsage,
      remaining,
      feature,
    };
  }

  /**
   * Enforce feature limit - throws if limit reached
   */
  async enforceFeatureLimit(
    userId: string,
    feature: string,
    currentUsage: number,
    customMessage?: string,
  ): Promise<void> {
    const check = await this.checkFeatureLimit(userId, feature, currentUsage);

    if (!check.allowed) {
      const defaultMessage = `Limite de ${check.limit} atingido para "${feature}". Faça upgrade para continuar.`;
      throw new ForbiddenException(customMessage || defaultMessage);
    }
  }

  // ==========================================
  // Convenience methods for common limits
  // ==========================================

  /**
   * Check max_cycles limit
   */
  async checkCyclesLimit(userId: string, workspaceId: string): Promise<FeatureLimitCheck> {
    const currentCount = await this.prisma.studyCycle.count({
      where: { workspaceId },
    });
    return this.checkFeatureLimit(userId, 'max_cycles', currentCount);
  }

  /**
   * Check max_workspaces limit
   */
  async checkWorkspacesLimit(userId: string): Promise<FeatureLimitCheck> {
    const currentCount = await this.prisma.workspace.count({
      where: { userId },
    });
    return this.checkFeatureLimit(userId, 'max_workspaces', currentCount);
  }

  /**
   * Check max_sessions_per_day limit
   */
  async checkSessionsLimit(userId: string, date: Date): Promise<FeatureLimitCheck> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const currentCount = await this.prisma.studySession.count({
      where: {
        userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    return this.checkFeatureLimit(userId, 'max_sessions_per_day', currentCount);
  }

  // ==========================================
  // Subscription Management (for future Mercado Pago integration)
  // ==========================================

  /**
   * Create a new subscription for a user
   * This will be called after successful payment in the future
   */
  async createSubscription(
    userId: string,
    planId: string,
    billingCycle: 'MONTHLY' | 'YEARLY' = 'MONTHLY',
    externalData?: { externalId?: string; externalCustomerId?: string },
  ): Promise<Subscription> {
    // Calculate period dates
    const now = new Date();
    const periodEnd = new Date(now);
    if (billingCycle === 'MONTHLY') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    // Delete any existing subscription
    await this.prisma.subscription.deleteMany({
      where: { userId },
    });

    return this.prisma.subscription.create({
      data: {
        userId,
        planId,
        status: 'ACTIVE',
        billingCycle,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        externalId: externalData?.externalId,
        externalCustomerId: externalData?.externalCustomerId,
      },
      include: {
        plan: {
          include: { limits: true },
        },
      },
    });
  }

  /**
   * Cancel a subscription
   * @param immediate If true, cancels immediately. Otherwise, cancels at period end.
   */
  async cancelSubscription(
    userId: string,
    immediate: boolean = false,
  ): Promise<Subscription | null> {
    const subscription = await this.getUserSubscription(userId);

    if (!subscription) {
      return null;
    }

    if (immediate) {
      return this.prisma.subscription.update({
        where: { userId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }
}
