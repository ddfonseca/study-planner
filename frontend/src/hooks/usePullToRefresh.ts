import { useState, useRef, useCallback, useMemo } from 'react';
import { useIsTouchDevice } from './useMediaQuery';
import {
  PULL_TO_REFRESH_THRESHOLDS,
  HAPTIC_DURATIONS,
  type PullToRefreshThresholds,
} from '@/config/thresholds';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  /** Pull distance required to trigger refresh (default: 80px) */
  threshold?: number;
  /** Maximum pull distance (default: 120px) */
  maxPull?: number;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
  /** Custom thresholds for pull-to-refresh behavior */
  thresholds?: Partial<PullToRefreshThresholds>;
}

interface UsePullToRefreshReturn {
  isRefreshing: boolean;
  pullDistance: number;
  containerProps: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
}

interface TouchState {
  startY: number;
  currentY: number;
  isPulling: boolean;
  hasTriggeredThresholdHaptic: boolean;
}

// Check if vibration is supported
function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

// Trigger haptic feedback
function triggerHaptic(duration: number): void {
  if (!isVibrationSupported()) return;
  try {
    navigator.vibrate(duration);
  } catch {
    // Silently fail
  }
}

/**
 * Hook to implement pull-to-refresh functionality
 * Returns touch event handlers and state for rendering the pull indicator
 */
export function usePullToRefresh({
  onRefresh,
  threshold = PULL_TO_REFRESH_THRESHOLDS.threshold,
  maxPull = PULL_TO_REFRESH_THRESHOLDS.maxPull,
  enabled = true,
  thresholds,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  // Merge custom thresholds with defaults
  const effectiveThresholds = useMemo(
    () => ({
      ...PULL_TO_REFRESH_THRESHOLDS,
      ...thresholds,
      threshold: thresholds?.threshold ?? threshold,
      maxPull: thresholds?.maxPull ?? maxPull,
    }),
    [threshold, maxPull, thresholds]
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchState = useRef<TouchState | null>(null);
  const isTouchDevice = useIsTouchDevice();
  const hapticEnabled = useMemo(
    () => isTouchDevice && isVibrationSupported(),
    [isTouchDevice]
  );

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing) return;

      // Only start if at the top of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > effectiveThresholds.scrollTopThreshold) return;

      const touch = e.touches[0];
      touchState.current = {
        startY: touch.clientY,
        currentY: touch.clientY,
        isPulling: false,
        hasTriggeredThresholdHaptic: false,
      };
    },
    [enabled, isRefreshing, effectiveThresholds.scrollTopThreshold]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing || !touchState.current) return;

      const touch = e.touches[0];
      const deltaY = touch.clientY - touchState.current.startY;

      // Only allow pulling down
      if (deltaY <= 0) {
        touchState.current.isPulling = false;
        setPullDistance(0);
        return;
      }

      // Check if we're at the top of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > effectiveThresholds.scrollTopThreshold) {
        touchState.current.isPulling = false;
        setPullDistance(0);
        return;
      }

      touchState.current.isPulling = true;
      touchState.current.currentY = touch.clientY;

      // Apply resistance to the pull (diminishing returns)
      const resistedPull = Math.min(
        deltaY * effectiveThresholds.resistance,
        effectiveThresholds.maxPull
      );

      // Haptic feedback when crossing threshold (only once per pull)
      if (
        hapticEnabled &&
        !touchState.current.hasTriggeredThresholdHaptic &&
        resistedPull >= effectiveThresholds.threshold
      ) {
        touchState.current.hasTriggeredThresholdHaptic = true;
        triggerHaptic(HAPTIC_DURATIONS.light);
      }

      setPullDistance(resistedPull);
    },
    [enabled, isRefreshing, effectiveThresholds, hapticEnabled]
  );

  const onTouchEnd = useCallback(async () => {
    if (!enabled || !touchState.current || !touchState.current.isPulling) {
      touchState.current = null;
      return;
    }

    const shouldRefresh = pullDistance >= effectiveThresholds.threshold;
    touchState.current = null;

    if (shouldRefresh && !isRefreshing) {
      setIsRefreshing(true);
      // Medium haptic when refresh starts
      if (hapticEnabled) {
        triggerHaptic(HAPTIC_DURATIONS.medium);
      }
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [enabled, pullDistance, effectiveThresholds, isRefreshing, onRefresh, hapticEnabled]);

  return {
    isRefreshing,
    pullDistance,
    containerProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}

export default usePullToRefresh;
