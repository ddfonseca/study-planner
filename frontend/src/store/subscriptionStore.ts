/**
 * Subscription Store - Manages user subscription and plan limits
 */
import { create } from 'zustand';
import {
  subscriptionApi,
  type SubscriptionPlan,
  type Subscription,
  type UserLimits,
} from '@/lib/api/subscription';

// Re-export types for convenience
export type { SubscriptionPlan, Subscription, UserLimits };

interface SubscriptionState {
  // State
  currentPlan: SubscriptionPlan | null;
  subscription: Subscription | null;
  limits: Record<string, number>;
  plans: SubscriptionPlan[];
  isLoading: boolean;
  error: string | null;
  isFree: boolean;

  // Actions
  fetchCurrentSubscription: () => Promise<void>;
  fetchPlans: () => Promise<void>;
  fetchLimits: () => Promise<void>;
  getLimit: (feature: string) => number;
  canUseFeature: (feature: string, currentUsage: number) => boolean;
  getRemainingUsage: (feature: string, currentUsage: number) => number;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  // Initial state
  currentPlan: null,
  subscription: null,
  limits: {},
  plans: [],
  isLoading: false,
  error: null,
  isFree: true,

  // Actions
  fetchCurrentSubscription: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await subscriptionApi.getCurrent();

      set({
        currentPlan: response.plan,
        subscription: response.subscription,
        isFree: response.isFree,
        isLoading: false,
      });

      // Also fetch limits
      await get().fetchLimits();
    } catch {
      set({
        error: 'Erro ao carregar assinatura',
        isLoading: false,
      });
    }
  },

  fetchPlans: async () => {
    try {
      const plans = await subscriptionApi.getPlans();
      set({ plans });
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  },

  fetchLimits: async () => {
    try {
      const response = await subscriptionApi.getLimits();
      set({ limits: response.limits });
    } catch (error) {
      console.error('Error fetching limits:', error);
    }
  },

  getLimit: (feature: string) => {
    const { limits } = get();
    return limits[feature] ?? 0;
  },

  canUseFeature: (feature: string, currentUsage: number) => {
    const limit = get().getLimit(feature);
    // -1 means unlimited
    if (limit === -1) return true;
    return currentUsage < limit;
  },

  getRemainingUsage: (feature: string, currentUsage: number) => {
    const limit = get().getLimit(feature);
    // -1 means unlimited
    if (limit === -1) return Infinity;
    return Math.max(0, limit - currentUsage);
  },

  reset: () => {
    set({
      currentPlan: null,
      subscription: null,
      limits: {},
      plans: [],
      isLoading: false,
      error: null,
      isFree: true,
    });
  },
}));

export default useSubscriptionStore;
