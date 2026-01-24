import { useRef, useCallback, useMemo } from 'react';
import { SWIPE_THRESHOLDS, type SwipeThresholds } from '@/config/thresholds';
import { useIsTouchDevice } from './useMediaQuery';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  /** Custom thresholds for swipe behavior */
  thresholds?: Partial<SwipeThresholds>;
  /** Force enable swipe even on non-touch devices (for testing) */
  forceEnable?: boolean;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

interface SwipeProps {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  /** Whether swipe functionality is enabled (only on touch devices) */
  isEnabled: boolean;
}

// No-op handlers for desktop devices
const noopHandler = () => {};

/**
 * Hook to detect horizontal swipe gestures
 * Returns touch event handlers to attach to the swipeable element
 *
 * Note: This hook only works on mobile/touch devices. On desktop,
 * it returns no-op handlers and isEnabled: false.
 */
export function useSwipe(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
): SwipeProps {
  const {
    minSwipeDistance = SWIPE_THRESHOLDS.minSwipeDistance,
    maxSwipeTime = SWIPE_THRESHOLDS.maxSwipeTime,
    thresholds,
    forceEnable = false,
  } = config;

  const isTouchDevice = useIsTouchDevice();
  const isEnabled = forceEnable || isTouchDevice;

  // Merge custom thresholds with defaults
  const effectiveThresholds = useMemo(
    () => ({
      ...SWIPE_THRESHOLDS,
      ...thresholds,
      minSwipeDistance: thresholds?.minSwipeDistance ?? minSwipeDistance,
      maxSwipeTime: thresholds?.maxSwipeTime ?? maxSwipeTime,
    }),
    [minSwipeDistance, maxSwipeTime, thresholds]
  );

  const touchState = useRef<TouchState | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isEnabled) return;

      const touch = e.touches[0];
      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };
    },
    [isEnabled]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isEnabled) return;
      if (!touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      // Clear touch state
      touchState.current = null;

      // Ignore if swipe took too long
      if (deltaTime > effectiveThresholds.maxSwipeTime) return;

      // Ignore if vertical movement is greater than horizontal (scrolling)
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;

      // Check for minimum swipe distance
      if (Math.abs(deltaX) < effectiveThresholds.minSwipeDistance) return;

      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    },
    [isEnabled, handlers, effectiveThresholds]
  );

  // Return no-op handlers on desktop for cleaner API
  if (!isEnabled) {
    return { onTouchStart: noopHandler, onTouchEnd: noopHandler, isEnabled: false };
  }

  return { onTouchStart, onTouchEnd, isEnabled: true };
}

export default useSwipe;
