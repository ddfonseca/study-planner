import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSwipe } from './useSwipe';

function createTouchEvent(clientX: number, clientY: number) {
  return {
    touches: [{ clientX, clientY }],
    changedTouches: [{ clientX, clientY }],
  } as unknown as React.TouchEvent;
}

// Helper to mock desktop environment (no touch)
function mockDesktopEnvironment() {
  // Remove ontouchstart from window
  const originalOntouchstart = window.ontouchstart;
  delete (window as unknown as Record<string, unknown>).ontouchstart;

  // Mock maxTouchPoints to 0
  const originalMaxTouchPoints = navigator.maxTouchPoints;
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: 0,
    configurable: true,
  });

  // Mock matchMedia to return false for pointer: coarse
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  return () => {
    // Restore original values
    if (originalOntouchstart !== undefined) {
      (window as unknown as Record<string, unknown>).ontouchstart = originalOntouchstart;
    }
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalMaxTouchPoints,
      configurable: true,
    });
  };
}

// Helper to mock touch device environment
function mockTouchEnvironment() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('useSwipe', () => {
  describe('mobile-only behavior', () => {
    let restoreDesktop: () => void;

    beforeEach(() => {
      restoreDesktop = mockDesktopEnvironment();
    });

    afterEach(() => {
      restoreDesktop();
    });

    it('returns isEnabled: false on non-touch devices', () => {
      const { result } = renderHook(() => useSwipe({}));

      expect(result.current.isEnabled).toBe(false);
    });

    it('returns no-op handlers on non-touch devices', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() => useSwipe({ onSwipeLeft }));

      // Touch events should not trigger swipe on desktop
      result.current.onTouchStart(createTouchEvent(200, 100));
      result.current.onTouchEnd(createTouchEvent(100, 100));

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('returns isEnabled: true when forceEnable is set', () => {
      const { result } = renderHook(() => useSwipe({}, { forceEnable: true }));

      expect(result.current.isEnabled).toBe(true);
    });

    describe('on touch device', () => {
      beforeEach(() => {
        mockTouchEnvironment();
      });

      it('returns isEnabled: true on touch devices', () => {
        const { result } = renderHook(() => useSwipe({}));

        expect(result.current.isEnabled).toBe(true);
      });

      it('detects swipes on touch devices', () => {
        const onSwipeLeft = vi.fn();
        const { result } = renderHook(() => useSwipe({ onSwipeLeft }));

        result.current.onTouchStart(createTouchEvent(200, 100));
        result.current.onTouchEnd(createTouchEvent(100, 100));

        expect(onSwipeLeft).toHaveBeenCalledTimes(1);
      });
    });
  });

  // Use forceEnable: true for all swipe functionality tests
  it('returns touch event handlers', () => {
    const { result } = renderHook(() => useSwipe({}, { forceEnable: true }));

    expect(result.current.onTouchStart).toBeDefined();
    expect(result.current.onTouchEnd).toBeDefined();
    expect(result.current.isEnabled).toBe(true);
  });

  describe('swipe left', () => {
    it('calls onSwipeLeft when swiping left with sufficient distance', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeLeft }, { forceEnable: true })
      );

      // Start touch at x=200
      result.current.onTouchStart(createTouchEvent(200, 100));

      // End touch at x=100 (moved 100px left)
      result.current.onTouchEnd(createTouchEvent(100, 100));

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('does not call onSwipeLeft when swipe distance is too short', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeLeft }, { forceEnable: true })
      );

      // Start touch at x=100
      result.current.onTouchStart(createTouchEvent(100, 100));

      // End touch at x=80 (moved only 20px left, less than default 50px threshold)
      result.current.onTouchEnd(createTouchEvent(80, 100));

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });
  });

  describe('swipe right', () => {
    it('calls onSwipeRight when swiping right with sufficient distance', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeRight }, { forceEnable: true })
      );

      // Start touch at x=100
      result.current.onTouchStart(createTouchEvent(100, 100));

      // End touch at x=200 (moved 100px right)
      result.current.onTouchEnd(createTouchEvent(200, 100));

      expect(onSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('does not call onSwipeRight when swipe distance is too short', () => {
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeRight }, { forceEnable: true })
      );

      // Start touch at x=100
      result.current.onTouchStart(createTouchEvent(100, 100));

      // End touch at x=120 (moved only 20px right, less than default 50px threshold)
      result.current.onTouchEnd(createTouchEvent(120, 100));

      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('vertical scroll detection', () => {
    it('ignores swipe when vertical movement is greater than horizontal', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeLeft, onSwipeRight }, { forceEnable: true })
      );

      // Start touch
      result.current.onTouchStart(createTouchEvent(100, 100));

      // End touch with more vertical movement (scrolling down)
      result.current.onTouchEnd(createTouchEvent(50, 200));

      expect(onSwipeLeft).not.toHaveBeenCalled();
      expect(onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('custom configuration', () => {
    it('respects custom minSwipeDistance', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeLeft }, { minSwipeDistance: 100, forceEnable: true })
      );

      // Start touch at x=200
      result.current.onTouchStart(createTouchEvent(200, 100));

      // End touch at x=120 (moved 80px, less than custom 100px threshold)
      result.current.onTouchEnd(createTouchEvent(120, 100));

      expect(onSwipeLeft).not.toHaveBeenCalled();

      // Start touch at x=200
      result.current.onTouchStart(createTouchEvent(200, 100));

      // End touch at x=90 (moved 110px, more than custom 100px threshold)
      result.current.onTouchEnd(createTouchEvent(90, 100));

      expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('does not crash when onTouchEnd is called without onTouchStart', () => {
      const onSwipeLeft = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeLeft }, { forceEnable: true })
      );

      // Call onTouchEnd without first calling onTouchStart
      expect(() => {
        result.current.onTouchEnd(createTouchEvent(100, 100));
      }).not.toThrow();

      expect(onSwipeLeft).not.toHaveBeenCalled();
    });

    it('handles consecutive swipes correctly', () => {
      const onSwipeLeft = vi.fn();
      const onSwipeRight = vi.fn();
      const { result } = renderHook(() =>
        useSwipe({ onSwipeLeft, onSwipeRight }, { forceEnable: true })
      );

      // First swipe left
      result.current.onTouchStart(createTouchEvent(200, 100));
      result.current.onTouchEnd(createTouchEvent(100, 100));
      expect(onSwipeLeft).toHaveBeenCalledTimes(1);

      // Second swipe right
      result.current.onTouchStart(createTouchEvent(100, 100));
      result.current.onTouchEnd(createTouchEvent(200, 100));
      expect(onSwipeRight).toHaveBeenCalledTimes(1);

      // Third swipe left
      result.current.onTouchStart(createTouchEvent(200, 100));
      result.current.onTouchEnd(createTouchEvent(100, 100));
      expect(onSwipeLeft).toHaveBeenCalledTimes(2);
    });
  });
});
