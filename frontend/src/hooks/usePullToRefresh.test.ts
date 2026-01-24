import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePullToRefresh } from './usePullToRefresh';

function createTouchEvent(clientY: number): React.TouchEvent {
  return {
    touches: [{ clientY, clientX: 0 }],
    changedTouches: [{ clientY, clientX: 0 }],
  } as unknown as React.TouchEvent;
}

describe('usePullToRefresh', () => {
  beforeEach(() => {
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 0,
      writable: true,
    });
  });

  it('returns expected properties', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

    expect(result.current.isRefreshing).toBe(false);
    expect(result.current.pullDistance).toBe(0);
    expect(result.current.containerProps.onTouchStart).toBeDefined();
    expect(result.current.containerProps.onTouchMove).toBeDefined();
    expect(result.current.containerProps.onTouchEnd).toBeDefined();
  });

  describe('pull gesture', () => {
    it('updates pullDistance when pulling down', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(100));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      // Pull distance should be positive (with resistance applied)
      expect(result.current.pullDistance).toBeGreaterThan(0);
      expect(result.current.pullDistance).toBeLessThanOrEqual(120); // maxPull default
    });

    it('does not update pullDistance when pulling up', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(200));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(100));
      });

      expect(result.current.pullDistance).toBe(0);
    });

    it('does not update pullDistance when page is scrolled', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

      // Simulate page scrolled down
      Object.defineProperty(window, 'scrollY', { value: 100, writable: true });

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(100));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      expect(result.current.pullDistance).toBe(0);
    });
  });

  describe('refresh trigger', () => {
    it('calls onRefresh when pull exceeds threshold', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, threshold: 80 })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      // Pull more than threshold (with resistance at 0.5, need to pull 160+ to get 80)
      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      await act(async () => {
        result.current.containerProps.onTouchEnd(createTouchEvent(200));
      });

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onRefresh when pull is below threshold', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, threshold: 80 })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      // Pull less than threshold
      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(50));
      });

      await act(async () => {
        result.current.containerProps.onTouchEnd(createTouchEvent(50));
      });

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('sets isRefreshing to true during refresh', async () => {
      let resolveRefresh: () => void;
      const onRefresh = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, threshold: 40 })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      act(() => {
        result.current.containerProps.onTouchEnd(createTouchEvent(200));
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(true);
      });

      await act(async () => {
        resolveRefresh!();
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false);
      });
    });
  });

  describe('enabled state', () => {
    it('does not respond to touch when disabled', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, enabled: false })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      expect(result.current.pullDistance).toBe(0);
    });

    it('does not respond to touch while refreshing', async () => {
      let resolveRefresh: () => void;
      const onRefresh = vi.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, threshold: 40 })
      );

      // Trigger first refresh
      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      act(() => {
        result.current.containerProps.onTouchEnd(createTouchEvent(200));
      });

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(true);
      });

      // Try to start another pull while refreshing
      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      // pullDistance should not change while refreshing
      // (the component sets it to 60 during refresh animation)
      expect(onRefresh).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveRefresh!();
      });
    });
  });

  describe('configuration', () => {
    it('respects custom threshold', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, threshold: 30 })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      // Pull enough to exceed threshold of 30 (with 0.5 resistance, need 60+ to get 30)
      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(80));
      });

      await act(async () => {
        result.current.containerProps.onTouchEnd(createTouchEvent(80));
      });

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('respects custom maxPull', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, maxPull: 50 })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      // Pull far down
      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(300));
      });

      expect(result.current.pullDistance).toBeLessThanOrEqual(50);
    });

    it('respects custom thresholds object', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({
          onRefresh,
          thresholds: {
            threshold: 20,
            maxPull: 40,
            resistance: 0.8,
          },
        })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      // With resistance 0.8, pulling 30px should give 24px (> 20 threshold)
      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(30));
      });

      await act(async () => {
        result.current.containerProps.onTouchEnd(createTouchEvent(30));
      });

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('thresholds object overrides individual threshold/maxPull params', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({
          onRefresh,
          threshold: 100, // Should be overridden
          maxPull: 200, // Should be overridden
          thresholds: {
            threshold: 20,
            maxPull: 30,
          },
        })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      // Pull far - maxPull should cap at 30, not 200
      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      expect(result.current.pullDistance).toBeLessThanOrEqual(30);
    });

    it('uses default scrollTopThreshold from config', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      // Set scrollY to 4 (below default threshold of 5)
      Object.defineProperty(window, 'scrollY', { value: 4, writable: true });

      const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(100));
      });

      // Should allow pull since scrollY (4) <= scrollTopThreshold (5)
      expect(result.current.pullDistance).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles onTouchEnd without onTouchStart', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

      await act(async () => {
        result.current.containerProps.onTouchEnd(createTouchEvent(200));
      });

      expect(onRefresh).not.toHaveBeenCalled();
    });

    it('handles onTouchMove without onTouchStart', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePullToRefresh({ onRefresh }));

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(200));
      });

      expect(result.current.pullDistance).toBe(0);
    });

    it('resets pullDistance after release without refresh', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        usePullToRefresh({ onRefresh, threshold: 80 })
      );

      act(() => {
        result.current.containerProps.onTouchStart(createTouchEvent(0));
      });

      act(() => {
        result.current.containerProps.onTouchMove(createTouchEvent(50));
      });

      expect(result.current.pullDistance).toBeGreaterThan(0);

      await act(async () => {
        result.current.containerProps.onTouchEnd(createTouchEvent(50));
      });

      expect(result.current.pullDistance).toBe(0);
    });
  });
});
