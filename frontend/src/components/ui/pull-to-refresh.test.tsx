import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PullToRefresh } from './pull-to-refresh';

describe('PullToRefresh', () => {
  beforeEach(() => {
    // Mock window.scrollY
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', {
      value: 0,
      writable: true,
    });
  });

  describe('rendering', () => {
    it('renders children correctly', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      render(
        <PullToRefresh onRefresh={onRefresh}>
          <div data-testid="content">Test Content</div>
        </PullToRefresh>
      );

      expect(screen.getByTestId('content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('applies custom className to container', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} className="custom-class">
          <div>Content</div>
        </PullToRefresh>
      );

      expect(container.firstChild).toHaveClass('custom-class');
      expect(container.firstChild).toHaveClass('relative');
    });
  });

  describe('pull indicator', () => {
    it('shows pull indicator when pulling down', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      // Start touch
      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      // Move down
      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 100, clientX: 0 }],
      });

      // Check that text is shown
      expect(screen.getByText('Puxe para atualizar')).toBeInTheDocument();
    });

    it('shows release text when pull exceeds threshold', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} threshold={40}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      // Start touch
      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      // Move down past threshold (with 0.5 resistance, need 80+ to get 40)
      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 200, clientX: 0 }],
      });

      expect(screen.getByText('Solte para atualizar')).toBeInTheDocument();
    });
  });

  describe('custom text', () => {
    it('uses custom pullText', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} pullText="Pull down to refresh">
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 50, clientX: 0 }],
      });

      expect(screen.getByText('Pull down to refresh')).toBeInTheDocument();
    });

    it('uses custom releaseText', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh
          onRefresh={onRefresh}
          threshold={30}
          releaseText="Release now!"
        >
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 200, clientX: 0 }],
      });

      expect(screen.getByText('Release now!')).toBeInTheDocument();
    });

    it('uses custom refreshingText', async () => {
      const onRefresh = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );
      const { container } = render(
        <PullToRefresh
          onRefresh={onRefresh}
          threshold={30}
          refreshingText="Loading..."
        >
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 200, clientX: 0 }],
      });

      fireEvent.touchEnd(pullContainer, {
        changedTouches: [{ clientY: 200, clientX: 0 }],
      });

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('refresh behavior', () => {
    it('calls onRefresh when released after threshold', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} threshold={30}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 200, clientX: 0 }],
      });

      fireEvent.touchEnd(pullContainer, {
        changedTouches: [{ clientY: 200, clientX: 0 }],
      });

      await waitFor(() => {
        expect(onRefresh).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onRefresh when released before threshold', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} threshold={80}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      // Small pull (with 0.5 resistance, 50px pull = 25px distance, less than 80 threshold)
      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 50, clientX: 0 }],
      });

      fireEvent.touchEnd(pullContainer, {
        changedTouches: [{ clientY: 50, clientX: 0 }],
      });

      // Wait a bit to ensure onRefresh is not called
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });

  describe('enabled state', () => {
    it('does not respond to gestures when disabled', async () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} enabled={false} threshold={30}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 200, clientX: 0 }],
      });

      fireEvent.touchEnd(pullContainer, {
        changedTouches: [{ clientY: 200, clientX: 0 }],
      });

      // Wait a bit to ensure onRefresh is not called
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(onRefresh).not.toHaveBeenCalled();

      // Pull indicator should be hidden (opacity-0) when disabled
      const indicator = container.querySelector('[aria-hidden]');
      expect(indicator).toHaveClass('opacity-0');
    });
  });

  describe('icons', () => {
    it('shows ArrowDown icon when pulling', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined);
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 100, clientX: 0 }],
      });

      // ArrowDown icon should be in the document
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('shows spinning RefreshCw icon when refreshing', async () => {
      const onRefresh = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );
      const { container } = render(
        <PullToRefresh onRefresh={onRefresh} threshold={30}>
          <div>Content</div>
        </PullToRefresh>
      );

      const pullContainer = container.firstChild as HTMLElement;

      fireEvent.touchStart(pullContainer, {
        touches: [{ clientY: 0, clientX: 0 }],
      });

      fireEvent.touchMove(pullContainer, {
        touches: [{ clientY: 200, clientX: 0 }],
      });

      fireEvent.touchEnd(pullContainer, {
        changedTouches: [{ clientY: 200, clientX: 0 }],
      });

      await waitFor(() => {
        const spinningIcon = container.querySelector('.animate-spin');
        expect(spinningIcon).toBeInTheDocument();
      });
    });
  });
});
