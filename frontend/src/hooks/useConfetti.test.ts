import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConfetti } from './useConfetti';

describe('useConfetti', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with isActive as false', () => {
      const { result } = renderHook(() => useConfetti());

      expect(result.current.isActive).toBe(false);
    });

    it('returns confettiProps with default values', () => {
      const { result } = renderHook(() => useConfetti());

      expect(result.current.confettiProps).toEqual({
        active: false,
        duration: 3000,
        particleCount: 100,
        onComplete: expect.any(Function),
      });
    });
  });

  describe('fire', () => {
    it('sets isActive to true when called', () => {
      const { result } = renderHook(() => useConfetti());

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);
      expect(result.current.confettiProps.active).toBe(true);
    });

    it('auto-stops after duration + buffer', () => {
      const { result } = renderHook(() => useConfetti({ duration: 1000 }));

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);

      // Before timeout
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isActive).toBe(true);

      // After timeout (duration + 500ms buffer)
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.isActive).toBe(false);
    });

    it('clears previous timeout when fired multiple times', () => {
      const { result } = renderHook(() => useConfetti({ duration: 1000 }));

      act(() => {
        result.current.fire();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Fire again before first timeout
      act(() => {
        result.current.fire();
      });

      // Original timeout would have fired by now
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should still be active because second fire reset the timer
      expect(result.current.isActive).toBe(true);

      // After second timeout
      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('stop', () => {
    it('sets isActive to false when called', () => {
      const { result } = renderHook(() => useConfetti());

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('clears auto-stop timeout when called', () => {
      const { result } = renderHook(() => useConfetti({ duration: 1000 }));

      act(() => {
        result.current.fire();
      });

      act(() => {
        result.current.stop();
      });

      // Fire again
      act(() => {
        result.current.fire();
      });

      // Original timeout should not interfere
      act(() => {
        vi.advanceTimersByTime(1200);
      });

      // Still active because we restarted
      expect(result.current.isActive).toBe(true);
    });
  });

  describe('onComplete callback', () => {
    it('sets isActive to false when onComplete is called', () => {
      const { result } = renderHook(() => useConfetti());

      act(() => {
        result.current.fire();
      });

      expect(result.current.isActive).toBe(true);

      // Simulate Confetti component calling onComplete
      act(() => {
        result.current.confettiProps.onComplete();
      });

      expect(result.current.isActive).toBe(false);
    });

    it('clears timeout when onComplete is called', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { result } = renderHook(() => useConfetti());

      act(() => {
        result.current.fire();
      });

      act(() => {
        result.current.confettiProps.onComplete();
      });

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('options', () => {
    it('uses custom duration', () => {
      const { result } = renderHook(() => useConfetti({ duration: 5000 }));

      expect(result.current.confettiProps.duration).toBe(5000);
    });

    it('uses custom particleCount', () => {
      const { result } = renderHook(() => useConfetti({ particleCount: 200 }));

      expect(result.current.confettiProps.particleCount).toBe(200);
    });
  });

  describe('cleanup', () => {
    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { result, unmount } = renderHook(() => useConfetti());

      act(() => {
        result.current.fire();
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
