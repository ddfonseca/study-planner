/**
 * Subscription API
 */
import { apiClient } from './client';

export interface PlanLimit {
  id: string;
  feature: string;
  limitValue: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  priceLifetime: number | null;
  isActive: boolean;
  limits: PlanLimit[];
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'PAUSED';
  billingCycle: 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}

export interface UserLimits {
  plan: string;
  limits: Record<string, number>;
}

export interface CurrentSubscriptionResponse {
  plan: SubscriptionPlan;
  subscription: Subscription | null;
  isFree: boolean;
}

export interface FeatureLimitCheck {
  allowed: boolean;
  limit: number;
  current: number;
  remaining: number;
  feature: string;
}

export const subscriptionApi = {
  /**
   * Get all available plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    return apiClient.get<SubscriptionPlan[]>('/api/subscription/plans');
  },

  /**
   * Get current user's subscription
   */
  async getCurrent(): Promise<CurrentSubscriptionResponse> {
    return apiClient.get<CurrentSubscriptionResponse>('/api/subscription/current');
  },

  /**
   * Get current user's limits
   */
  async getLimits(): Promise<UserLimits> {
    return apiClient.get<UserLimits>('/api/subscription/limits');
  },

  /**
   * Check a specific feature limit
   */
  async checkLimit(feature: string, currentUsage: number): Promise<FeatureLimitCheck> {
    return apiClient.post<FeatureLimitCheck, { feature: string; currentUsage: number }>(
      '/api/subscription/check-limit',
      { feature, currentUsage }
    );
  },

  /**
   * Cancel subscription
   */
  async cancel(immediate: boolean = false): Promise<{ message: string; subscription?: Subscription }> {
    return apiClient.post<{ message: string; subscription?: Subscription }, { immediate: boolean }>(
      '/api/subscription/cancel',
      { immediate }
    );
  },

  /**
   * Subscribe to a plan (lifetime payment - redirects to Mercado Pago checkout)
   */
  async subscribe(
    planId: string
  ): Promise<{ success: boolean; initPoint: string; preferenceId: string }> {
    return apiClient.post<
      { success: boolean; initPoint: string; preferenceId: string },
      { planId: string }
    >('/api/mercadopago/subscribe', { planId });
  },

  /**
   * Cancel subscription via Mercado Pago
   */
  async cancelMercadoPago(): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }, Record<string, never>>(
      '/api/mercadopago/cancel',
      {}
    );
  },
};

export default subscriptionApi;
