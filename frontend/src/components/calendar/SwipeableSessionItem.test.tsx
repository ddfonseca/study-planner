import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwipeableSessionItem } from './SwipeableSessionItem';
import type { StudySession } from '@/types/session';

function createTouchEvent(
  type: 'touchstart' | 'touchmove' | 'touchend',
  clientX: number,
  clientY: number
): Partial<React.TouchEvent> {
  const touch = { clientX, clientY };
  return {
    touches: type !== 'touchend' ? [touch] : [],
    changedTouches: [touch],
  } as Partial<React.TouchEvent>;
}

describe('SwipeableSessionItem', () => {
  const mockSession: StudySession = {
    id: 'session-1',
    materia: 'Mathematics',
    minutos: 60,
  };

  const defaultProps = {
    session: mockSession,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    canModify: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders session information', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      expect(screen.getByText('1h')).toBeInTheDocument();
    });

    it('renders delete action button', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      expect(screen.getByLabelText('Excluir sessão')).toBeInTheDocument();
    });

    it('renders with test id', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      expect(screen.getByTestId('swipeable-session-item')).toBeInTheDocument();
    });
  });

  describe('when canModify is false', () => {
    it('does not render delete action', () => {
      render(<SwipeableSessionItem {...defaultProps} canModify={false} />);

      expect(screen.queryByLabelText('Excluir sessão')).not.toBeInTheDocument();
    });

    it('does not have clickable content', () => {
      render(<SwipeableSessionItem {...defaultProps} canModify={false} />);

      const content = screen.getByTestId('session-content');
      const contentInner = content.querySelector('[role="button"]');

      expect(contentInner).not.toBeInTheDocument();
    });
  });

  describe('click interactions', () => {
    it('calls onEdit when content is clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<SwipeableSessionItem {...defaultProps} onEdit={onEdit} />);

      await user.click(screen.getByText('Mathematics'));

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<SwipeableSessionItem {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByLabelText('Excluir sessão'));

      expect(onDelete).toHaveBeenCalledWith('session-1');
    });
  });

  describe('keyboard interactions', () => {
    it('triggers edit on Enter key', async () => {
      const onEdit = vi.fn();
      render(<SwipeableSessionItem {...defaultProps} onEdit={onEdit} />);

      const content = screen.getByText('Mathematics').closest('[role="button"]');
      content?.focus();
      fireEvent.keyDown(content!, { key: 'Enter' });

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('triggers edit on Space key', async () => {
      const onEdit = vi.fn();
      render(<SwipeableSessionItem {...defaultProps} onEdit={onEdit} />);

      const content = screen.getByText('Mathematics').closest('[role="button"]');
      content?.focus();
      fireEvent.keyDown(content!, { key: ' ' });

      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('swipe gestures', () => {
    it('reveals delete button on swipe left', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByTestId('session-content');

      // Start touch
      fireEvent.touchStart(content, createTouchEvent('touchstart', 200, 100));

      // Move left (revealing delete)
      fireEvent.touchMove(content, createTouchEvent('touchmove', 100, 100));

      // End touch
      fireEvent.touchEnd(content, createTouchEvent('touchend', 100, 100));

      // Check transform style - should be translated left
      expect(content).toHaveStyle({ transform: 'translateX(-72px)' });
    });

    it('hides delete button on swipe right after revealed', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByTestId('session-content');

      // First, reveal the delete button
      fireEvent.touchStart(content, createTouchEvent('touchstart', 200, 100));
      fireEvent.touchMove(content, createTouchEvent('touchmove', 100, 100));
      fireEvent.touchEnd(content, createTouchEvent('touchend', 100, 100));

      expect(content).toHaveStyle({ transform: 'translateX(-72px)' });

      // Now swipe right to hide
      fireEvent.touchStart(content, createTouchEvent('touchstart', 100, 100));
      fireEvent.touchMove(content, createTouchEvent('touchmove', 200, 100));
      fireEvent.touchEnd(content, createTouchEvent('touchend', 200, 100));

      // Should be back to original position
      expect(content).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('does not reveal on small swipe (below threshold)', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByTestId('session-content');

      // Small swipe that doesn't meet threshold (40px)
      fireEvent.touchStart(content, createTouchEvent('touchstart', 200, 100));
      fireEvent.touchMove(content, createTouchEvent('touchmove', 180, 100));
      fireEvent.touchEnd(content, createTouchEvent('touchend', 180, 100));

      // Should remain at original position
      expect(content).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('ignores swipe when vertical movement is greater (scrolling)', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByTestId('session-content');

      // Vertical scroll movement
      fireEvent.touchStart(content, createTouchEvent('touchstart', 200, 100));
      fireEvent.touchMove(content, createTouchEvent('touchmove', 180, 200));
      fireEvent.touchEnd(content, createTouchEvent('touchend', 180, 200));

      // Should not have moved
      expect(content).toHaveStyle({ transform: 'translateX(0px)' });
    });

    it('does not respond to swipe when canModify is false', () => {
      render(<SwipeableSessionItem {...defaultProps} canModify={false} />);

      const content = screen.getByTestId('session-content');

      fireEvent.touchStart(content, createTouchEvent('touchstart', 200, 100));
      fireEvent.touchMove(content, createTouchEvent('touchmove', 100, 100));
      fireEvent.touchEnd(content, createTouchEvent('touchend', 100, 100));

      expect(content).toHaveStyle({ transform: 'translateX(0px)' });
    });
  });

  describe('delete action after swipe reveal', () => {
    it('clicking content while revealed closes the swipe', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<SwipeableSessionItem {...defaultProps} onEdit={onEdit} />);

      const content = screen.getByTestId('session-content');

      // Reveal delete
      fireEvent.touchStart(content, createTouchEvent('touchstart', 200, 100));
      fireEvent.touchMove(content, createTouchEvent('touchmove', 100, 100));
      fireEvent.touchEnd(content, createTouchEvent('touchend', 100, 100));

      expect(content).toHaveStyle({ transform: 'translateX(-72px)' });

      // Click content - should close, not trigger edit
      await user.click(screen.getByText('Mathematics'));

      expect(content).toHaveStyle({ transform: 'translateX(0px)' });
      expect(onEdit).not.toHaveBeenCalled();
    });

    it('resets swipe state when delete is triggered', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<SwipeableSessionItem {...defaultProps} onDelete={onDelete} />);

      const content = screen.getByTestId('session-content');

      // Reveal delete
      fireEvent.touchStart(content, createTouchEvent('touchstart', 200, 100));
      fireEvent.touchMove(content, createTouchEvent('touchmove', 100, 100));
      fireEvent.touchEnd(content, createTouchEvent('touchend', 100, 100));

      // Click delete button
      await user.click(screen.getByLabelText('Excluir sessão'));

      expect(onDelete).toHaveBeenCalledWith('session-1');
      expect(content).toHaveStyle({ transform: 'translateX(0px)' });
    });
  });

  describe('accessibility', () => {
    it('has role="button" on clickable content when canModify', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByText('Mathematics').closest('[role="button"]');
      expect(content).toBeInTheDocument();
    });

    it('has tabIndex for keyboard navigation', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByText('Mathematics').closest('[role="button"]');
      expect(content).toHaveAttribute('tabIndex', '0');
    });

    it('delete button has proper aria-label', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      expect(screen.getByLabelText('Excluir sessão')).toBeInTheDocument();
    });
  });

  describe('touch utilities', () => {
    it('has touch-no-select class to prevent text selection', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByTestId('session-content');
      expect(content).toHaveClass('touch-no-select');
    });

    it('has touch-action-manipulation on content area', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const contentInner = screen.getByText('Mathematics').closest('.touch-action-manipulation');
      expect(contentInner).toBeInTheDocument();
    });
  });
});
