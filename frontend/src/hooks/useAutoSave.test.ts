import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from './useAutoSave';

// Mock useOnlineStatus
vi.mock('./useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(() => true),
}));

import { useOnlineStatus } from './useOnlineStatus';

const mockUseOnlineStatus = vi.mocked(useOnlineStatus);

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseOnlineStatus.mockReturnValue(true);
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with idle status', () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoSave({ onSave }));

    expect(result.current.status).toBe('idle');
    expect(result.current.lastSavedAt).toBe(null);
    expect(result.current.errorMessage).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  it('debounces save calls', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 500 })
    );

    // Call save multiple times rapidly
    act(() => {
      result.current.save({ data: 'test1' });
    });
    act(() => {
      result.current.save({ data: 'test2' });
    });
    act(() => {
      result.current.save({ data: 'test3' });
    });

    // Should not have called onSave yet
    expect(onSave).not.toHaveBeenCalled();

    // Advance time past debounce
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should have called onSave once with the last data
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ data: 'test3' });
  });

  it('sets status to saving during save', async () => {
    let resolvePromise: () => void;
    const onSave = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePromise = resolve;
        })
    );

    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 100 })
    );

    act(() => {
      result.current.save({ data: 'test' });
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('saving');

    await act(async () => {
      resolvePromise!();
    });

    // After save completes, status should be 'saved'
    expect(result.current.status).toBe('saved');
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it('sets status to error on failure after max retries', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 100, maxRetries: 2, retryDelayMs: 100 })
    );

    act(() => {
      result.current.save({ data: 'test' });
    });

    // First attempt
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.retryCount).toBe(1);

    // First retry (delay: 100ms * 2^0 = 100ms)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(result.current.retryCount).toBe(2);

    // Second retry (delay: 100ms * 2^1 = 200ms)
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(onSave).toHaveBeenCalledTimes(3);
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Network error');
    expect(result.current.retryCount).toBe(2);
  });

  it('allows manual retry after error', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 100, maxRetries: 2, retryDelayMs: 100 })
    );

    act(() => {
      result.current.save({ data: 'test' });
    });

    // Go through initial attempt and retries
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.status).toBe('error');
    expect(onSave).toHaveBeenCalledTimes(3);

    // Manual retry
    await act(async () => {
      result.current.retry();
    });

    expect(result.current.status).toBe('saved');
    expect(onSave).toHaveBeenCalledTimes(4);
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it('saveNow bypasses debounce', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 5000 })
    );

    await act(async () => {
      await result.current.saveNow({ data: 'immediate' });
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({ data: 'immediate' });
    expect(result.current.status).toBe('saved');
  });

  it('reset clears status and error', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 100, maxRetries: 0 })
    );

    act(() => {
      result.current.save({ data: 'test' });
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.errorMessage).toBe(null);
    expect(result.current.retryCount).toBe(0);
  });

  it('does not save when offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });

    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useAutoSave({ onSave, debounceMs: 100 })
    );

    act(() => {
      result.current.save({ data: 'test' });
    });

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(result.current.errorMessage).toBe('Sem conexão com a internet');
  });

  it('returns isOnline status from hook', () => {
    mockUseOnlineStatus.mockReturnValue(false);

    const onSave = vi.fn();
    const { result } = renderHook(() => useAutoSave({ onSave }));

    expect(result.current.isOnline).toBe(false);
  });
});
