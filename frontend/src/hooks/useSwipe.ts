import { useRef, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

interface SwipeProps {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

/**
 * Hook to detect horizontal swipe gestures
 * Returns touch event handlers to attach to the swipeable element
 */
export function useSwipe(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
): SwipeProps {
  const { minSwipeDistance = 50, maxSwipeTime = 300 } = config;
  const touchState = useRef<TouchState | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      // Clear touch state
      touchState.current = null;

      // Ignore if swipe took too long
      if (deltaTime > maxSwipeTime) return;

      // Ignore if vertical movement is greater than horizontal (scrolling)
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;

      // Check for minimum swipe distance
      if (Math.abs(deltaX) < minSwipeDistance) return;

      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    },
    [handlers, minSwipeDistance, maxSwipeTime]
  );

  return { onTouchStart, onTouchEnd };
}

export default useSwipe;
