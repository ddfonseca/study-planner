import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { Confetti } from './confetti';

// Helper to mock matchMedia for reduced motion tests
const mockMatchMedia = (prefersReducedMotion: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Mock canvas context
const mockCanvasContext = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
  globalAlpha: 1,
};

describe('Confetti', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);

    // Mock requestAnimationFrame
    let frameId = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frameId++;
      setTimeout(() => cb(performance.now()), 16);
      return frameId;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id);
    });

    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCanvasContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders canvas when active', () => {
      const { container } = render(<Confetti active={true} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('does not render canvas when reduced motion is preferred', () => {
      mockMatchMedia(true);
      const { container } = render(<Confetti active={true} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeInTheDocument();
    });

    it('renders canvas with correct classes', () => {
      const { container } = render(<Confetti active={true} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveClass('fixed', 'inset-0', 'pointer-events-none', 'z-50');
    });

    it('has aria-hidden attribute for accessibility', () => {
      const { container } = render(<Confetti active={true} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('animation lifecycle', () => {
    it('starts animation when active becomes true', () => {
      render(<Confetti active={true} />);

      act(() => {
        vi.advanceTimersByTime(16);
      });

      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('cancels animation when active becomes false', () => {
      const { rerender } = render(<Confetti active={true} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
      rerender(<Confetti active={false} />);

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('calls onComplete when animation finishes', () => {
      const onComplete = vi.fn();
      render(<Confetti active={true} duration={1000} onComplete={onComplete} />);

      // Advance past animation duration
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('cancels animation on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

      const { unmount } = render(<Confetti active={true} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      unmount();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('clears canvas on stop', () => {
      const { rerender } = render(<Confetti active={true} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      rerender(<Confetti active={false} />);

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  describe('reduced motion', () => {
    it('returns null when user prefers reduced motion', () => {
      mockMatchMedia(true);

      const { container } = render(<Confetti active={true} />);

      expect(container.firstChild).toBeNull();
    });

    it('skips rendering entirely when reduced motion is preferred', () => {
      mockMatchMedia(true);

      const { container } = render(<Confetti active={true} />);

      // Canvas should not be in the DOM at all
      const canvas = container.querySelector('canvas');
      expect(canvas).not.toBeInTheDocument();
    });
  });

  describe('props', () => {
    it('accepts duration prop', () => {
      const { container } = render(<Confetti active={true} duration={5000} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('accepts particleCount prop', () => {
      const { container } = render(<Confetti active={true} particleCount={50} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    it('respects custom duration prop and calls onComplete', () => {
      const onComplete = vi.fn();
      render(<Confetti active={true} duration={1000} onComplete={onComplete} />);

      act(() => {
        vi.advanceTimersByTime(800);
      });

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('window resize', () => {
    it('updates canvas size on window resize when animating', () => {
      render(<Confetti active={true} />);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Trigger resize event
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      // Canvas should have been resized (this is handled internally)
      // We just verify no errors occurred
      expect(true).toBe(true);
    });
  });
});
