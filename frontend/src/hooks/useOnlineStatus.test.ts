import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from './useOnlineStatus';

describe('useOnlineStatus', () => {
  let originalNavigatorOnLine: boolean;

  beforeEach(() => {
    originalNavigatorOnLine = navigator.onLine;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigatorOnLine,
      writable: true,
      configurable: true,
    });
  });

  it('returns true when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it('returns false when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('updates to true when online event is fired', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current).toBe(true);
  });

  it('updates to false when offline event is fired', () => {
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current).toBe(false);
  });

  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));
  });
});
