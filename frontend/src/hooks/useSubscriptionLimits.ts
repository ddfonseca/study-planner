/**
 * useSubscriptionLimits - Hook for checking feature limits
 */
import { useSubscriptionStore } from '@/store/subscriptionStore';

export interface LimitCheck {
  canUse: boolean;
  limit: number;
  current: number;
  remaining: number;
  isUnlimited: boolean;
  percentUsed: number;
}

/**
 * Check if user can use a feature based on their subscription
 */
export function useCanUseFeature(feature: string, currentUsage: number): LimitCheck {
  const { getLimit, canUseFeature, getRemainingUsage } = useSubscriptionStore();

  const limit = getLimit(feature);
  const isUnlimited = limit === -1;
  const canUse = canUseFeature(feature, currentUsage);
  const remaining = getRemainingUsage(feature, currentUsage);
  const percentUsed = isUnlimited ? 0 : limit > 0 ? (currentUsage / limit) * 100 : 0;

  return {
    canUse,
    limit: isUnlimited ? Infinity : limit,
    current: currentUsage,
    remaining: isUnlimited ? Infinity : remaining,
    isUnlimited,
    percentUsed: Math.min(100, percentUsed),
  };
}

/**
 * Get the limit for a specific feature
 */
export function useFeatureLimit(feature: string): number {
  const { getLimit } = useSubscriptionStore();
  return getLimit(feature);
}

/**
 * Check if user is on free plan
 */
export function useIsFreeUser(): boolean {
  const { isFree } = useSubscriptionStore();
  return isFree;
}

/**
 * Get current plan name
 */
export function usePlanName(): string {
  const { currentPlan } = useSubscriptionStore();
  return currentPlan?.displayName ?? 'Gratuito';
}

/**
 * Feature limit constants
 */
export const FEATURES = {
  MAX_CYCLES: 'max_cycles',
  MAX_WORKSPACES: 'max_workspaces',
  MAX_SESSIONS_PER_DAY: 'max_sessions_per_day',
  EXPORT_DATA: 'export_data',
  SHARED_PLANS: 'shared_plans',
  HISTORY_DAYS: 'history_days',
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

export default useCanUseFeature;
