import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AchievementBadge } from './achievement-badge';

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

describe('AchievementBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('rendering', () => {
    it('renders when show is true', () => {
      render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('does not render when show is false', () => {
      render(
        <AchievementBadge show={false}>
          🏆
        </AchievementBadge>
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('renders title when provided', () => {
      render(
        <AchievementBadge show={true} title="First Study Session">
          🏆
        </AchievementBadge>
      );

      expect(screen.getByText('First Study Session')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <AchievementBadge show={true} description="Complete your first study session">
          🏆
        </AchievementBadge>
      );

      expect(screen.getByText('Complete your first study session')).toBeInTheDocument();
    });

    it('renders both title and description', () => {
      render(
        <AchievementBadge
          show={true}
          title="First Study Session"
          description="Complete your first study session"
        >
          🏆
        </AchievementBadge>
      );

      expect(screen.getByText('First Study Session')).toBeInTheDocument();
      expect(screen.getByText('Complete your first study session')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('applies default variant styles', () => {
      const { container } = render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      const badge = container.querySelector('.rounded-full');
      expect(badge).toHaveClass('from-primary');
    });

    it('applies gold variant styles', () => {
      const { container } = render(
        <AchievementBadge show={true} variant="gold">
          🥇
        </AchievementBadge>
      );

      const badge = container.querySelector('.rounded-full');
      expect(badge).toHaveClass('from-yellow-400');
    });

    it('applies silver variant styles', () => {
      const { container } = render(
        <AchievementBadge show={true} variant="silver">
          🥈
        </AchievementBadge>
      );

      const badge = container.querySelector('.rounded-full');
      expect(badge).toHaveClass('from-gray-300');
    });

    it('applies bronze variant styles', () => {
      const { container } = render(
        <AchievementBadge show={true} variant="bronze">
          🥉
        </AchievementBadge>
      );

      const badge = container.querySelector('.rounded-full');
      expect(badge).toHaveClass('from-orange-400');
    });
  });

  describe('animation', () => {
    it('starts in entering state when show becomes true', () => {
      const { container } = render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      const badge = container.querySelector('.rounded-full');
      expect(badge).toHaveClass('animate-achievement-enter');
    });

    it('transitions to visible state after animation duration', () => {
      const { container } = render(
        <AchievementBadge show={true} animationDuration={600}>
          🏆
        </AchievementBadge>
      );

      act(() => {
        vi.advanceTimersByTime(600);
      });

      const badge = container.querySelector('.rounded-full');
      expect(badge).not.toHaveClass('animate-achievement-enter');
    });

    it('calls onAnimationComplete when animation finishes', () => {
      const onComplete = vi.fn();
      render(
        <AchievementBadge show={true} animationDuration={600} onAnimationComplete={onComplete}>
          🏆
        </AchievementBadge>
      );

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('respects custom animationDuration', () => {
      const onComplete = vi.fn();
      render(
        <AchievementBadge show={true} animationDuration={1000} onAnimationComplete={onComplete}>
          🏆
        </AchievementBadge>
      );

      act(() => {
        vi.advanceTimersByTime(600);
      });

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('shows glow effect during animation', () => {
      const { container } = render(
        <AchievementBadge show={true} variant="gold">
          🏆
        </AchievementBadge>
      );

      const glow = container.querySelector('.animate-achievement-glow');
      expect(glow).toBeInTheDocument();
      expect(glow).toHaveClass('bg-yellow-400');
    });
  });

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for screen reader announcements', () => {
      render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has default aria-label for achievement', () => {
      render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Achievement unlocked');
    });

    it('includes title in aria-label when provided', () => {
      render(
        <AchievementBadge show={true} title="First Win">
          🏆
        </AchievementBadge>
      );

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Achievement unlocked: First Win');
    });

    it('glow effect is aria-hidden', () => {
      const { container } = render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      const glow = container.querySelector('.animate-achievement-glow');
      expect(glow).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('reduced motion', () => {
    it('skips animation when user prefers reduced motion', () => {
      mockMatchMedia(true);

      const { container } = render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      const badge = container.querySelector('.rounded-full');
      expect(badge).not.toHaveClass('animate-achievement-enter');
    });

    it('does not show glow effect when reduced motion is preferred', () => {
      mockMatchMedia(true);

      const { container } = render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      const glow = container.querySelector('.animate-achievement-glow');
      expect(glow).not.toBeInTheDocument();
    });

    it('calls onAnimationComplete immediately when reduced motion is preferred', () => {
      mockMatchMedia(true);

      const onComplete = vi.fn();
      render(
        <AchievementBadge show={true} animationDuration={600} onAnimationComplete={onComplete}>
          🏆
        </AchievementBadge>
      );

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('clears timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('clears timeout when show changes', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { rerender } = render(
        <AchievementBadge show={true}>
          🏆
        </AchievementBadge>
      );

      rerender(
        <AchievementBadge show={false}>
          🏆
        </AchievementBadge>
      );

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('className prop', () => {
    it('applies additional className to wrapper', () => {
      render(
        <AchievementBadge show={true} className="custom-class">
          🏆
        </AchievementBadge>
      );

      expect(screen.getByRole('status')).toHaveClass('custom-class');
    });
  });
});
