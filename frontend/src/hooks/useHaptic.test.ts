import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHaptic } from './useHaptic';

// Mock useIsTouchDevice
vi.mock('./useMediaQuery', () => ({
  useIsTouchDevice: vi.fn(() => true),
}));

import { useIsTouchDevice } from './useMediaQuery';

describe('useHaptic', () => {
  const mockVibrate = vi.fn();
  const originalVibrate = navigator.vibrate;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    });
    vi.mocked(useIsTouchDevice).mockReturnValue(true);
  });

  afterEach(() => {
    // Restore original vibrate
    Object.defineProperty(navigator, 'vibrate', {
      value: originalVibrate,
      writable: true,
      configurable: true,
    });
  });

  describe('isSupported', () => {
    it('returns true when on touch device with vibration support', () => {
      const { result } = renderHook(() => useHaptic());

      expect(result.current.isSupported).toBe(true);
    });

    it('returns false when not on touch device', () => {
      vi.mocked(useIsTouchDevice).mockReturnValue(false);
      const { result } = renderHook(() => useHaptic());

      expect(result.current.isSupported).toBe(false);
    });

    it('returns false when vibration API is not available', () => {
      // Need to delete vibrate entirely for 'vibrate' in navigator to return false
      const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'vibrate');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (navigator as any).vibrate;

      const { result } = renderHook(() => useHaptic());

      expect(result.current.isSupported).toBe(false);

      // Restore
      if (originalDescriptor) {
        Object.defineProperty(navigator, 'vibrate', originalDescriptor);
      }
    });
  });

  describe('trigger', () => {
    it('triggers light haptic feedback (10ms)', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('light');
      });

      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('triggers medium haptic feedback (30ms)', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('medium');
      });

      expect(mockVibrate).toHaveBeenCalledWith(30);
    });

    it('triggers heavy haptic feedback (50ms)', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('heavy');
      });

      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('defaults to light intensity when no argument provided', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger();
      });

      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('does not vibrate when not supported', () => {
      vi.mocked(useIsTouchDevice).mockReturnValue(false);
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.trigger('heavy');
      });

      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('handles vibration errors silently', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration not allowed');
      });
      const { result } = renderHook(() => useHaptic());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.trigger('light');
        });
      }).not.toThrow();
    });
  });

  describe('triggerPattern', () => {
    it('triggers success pattern', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.triggerPattern('success');
      });

      expect(mockVibrate).toHaveBeenCalledWith([10, 50, 30]);
    });

    it('triggers error pattern', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.triggerPattern('error');
      });

      expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
    });

    it('triggers warning pattern', () => {
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.triggerPattern('warning');
      });

      expect(mockVibrate).toHaveBeenCalledWith([30, 50, 30]);
    });

    it('does not vibrate patterns when not supported', () => {
      vi.mocked(useIsTouchDevice).mockReturnValue(false);
      const { result } = renderHook(() => useHaptic());

      act(() => {
        result.current.triggerPattern('success');
      });

      expect(mockVibrate).not.toHaveBeenCalled();
    });

    it('handles pattern vibration errors silently', () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration not allowed');
      });
      const { result } = renderHook(() => useHaptic());

      // Should not throw
      expect(() => {
        act(() => {
          result.current.triggerPattern('error');
        });
      }).not.toThrow();
    });
  });

  describe('memoization', () => {
    it('returns stable trigger function reference', () => {
      const { result, rerender } = renderHook(() => useHaptic());
      const firstTrigger = result.current.trigger;

      rerender();

      expect(result.current.trigger).toBe(firstTrigger);
    });

    it('returns stable triggerPattern function reference', () => {
      const { result, rerender } = renderHook(() => useHaptic());
      const firstTriggerPattern = result.current.triggerPattern;

      rerender();

      expect(result.current.triggerPattern).toBe(firstTriggerPattern);
    });
  });

  describe('custom configuration', () => {
    it('uses custom durations when provided', () => {
      const { result } = renderHook(() =>
        useHaptic({
          durations: {
            light: 5,
            medium: 15,
            heavy: 25,
          },
        })
      );

      act(() => {
        result.current.trigger('light');
      });
      expect(mockVibrate).toHaveBeenCalledWith(5);

      act(() => {
        result.current.trigger('medium');
      });
      expect(mockVibrate).toHaveBeenCalledWith(15);

      act(() => {
        result.current.trigger('heavy');
      });
      expect(mockVibrate).toHaveBeenCalledWith(25);
    });

    it('uses custom patterns when provided', () => {
      const customPatterns = {
        success: [5, 10, 5],
        error: [100, 50, 100],
        warning: [20, 20],
      };

      const { result } = renderHook(() =>
        useHaptic({ patterns: customPatterns })
      );

      act(() => {
        result.current.triggerPattern('success');
      });
      expect(mockVibrate).toHaveBeenCalledWith([5, 10, 5]);

      act(() => {
        result.current.triggerPattern('error');
      });
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);

      act(() => {
        result.current.triggerPattern('warning');
      });
      expect(mockVibrate).toHaveBeenCalledWith([20, 20]);
    });

    it('merges partial custom durations with defaults', () => {
      const { result } = renderHook(() =>
        useHaptic({
          durations: {
            light: 5, // Only override light
          },
        })
      );

      act(() => {
        result.current.trigger('light');
      });
      expect(mockVibrate).toHaveBeenCalledWith(5);

      act(() => {
        result.current.trigger('medium');
      });
      // Should use default value (30)
      expect(mockVibrate).toHaveBeenCalledWith(30);
    });

    it('merges partial custom patterns with defaults', () => {
      const { result } = renderHook(() =>
        useHaptic({
          patterns: {
            success: [1, 2, 3], // Only override success
          },
        })
      );

      act(() => {
        result.current.triggerPattern('success');
      });
      expect(mockVibrate).toHaveBeenCalledWith([1, 2, 3]);

      act(() => {
        result.current.triggerPattern('error');
      });
      // Should use default pattern
      expect(mockVibrate).toHaveBeenCalledWith([50, 30, 50, 30, 50]);
    });
  });
});
