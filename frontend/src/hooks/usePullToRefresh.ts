import { useState, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  /** Pull distance required to trigger refresh (default: 80px) */
  threshold?: number;
  /** Maximum pull distance (default: 120px) */
  maxPull?: number;
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean;
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
}

/**
 * Hook to implement pull-to-refresh functionality
 * Returns touch event handlers and state for rendering the pull indicator
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchState = useRef<TouchState | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || isRefreshing) return;

      // Only start if at the top of the page
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 5) return;

      const touch = e.touches[0];
      touchState.current = {
        startY: touch.clientY,
        currentY: touch.clientY,
        isPulling: false,
      };
    },
    [enabled, isRefreshing]
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
      if (scrollTop > 5) {
        touchState.current.isPulling = false;
        setPullDistance(0);
        return;
      }

      touchState.current.isPulling = true;
      touchState.current.currentY = touch.clientY;

      // Apply resistance to the pull (diminishing returns)
      const resistance = 0.5;
      const resistedPull = Math.min(deltaY * resistance, maxPull);
      setPullDistance(resistedPull);
    },
    [enabled, isRefreshing, maxPull]
  );

  const onTouchEnd = useCallback(async () => {
    if (!enabled || !touchState.current || !touchState.current.isPulling) {
      touchState.current = null;
      return;
    }

    const shouldRefresh = pullDistance >= threshold;
    touchState.current = null;

    if (shouldRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [enabled, pullDistance, threshold, isRefreshing, onRefresh]);

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
