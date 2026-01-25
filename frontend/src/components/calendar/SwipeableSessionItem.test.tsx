import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SwipeableSessionItem } from './SwipeableSessionItem';
import type { StudySession } from '@/types/session';

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

    it('renders with test id', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      expect(screen.getByTestId('swipeable-session-item')).toBeInTheDocument();
    });

    it('does not render delete button (delete is now in modal only)', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      expect(screen.queryByLabelText('Excluir sessão')).not.toBeInTheDocument();
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

    it('calls onEdit when canModify is false (navigates to view mode)', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<SwipeableSessionItem {...defaultProps} onEdit={onEdit} canModify={false} />);

      await user.click(screen.getByText('Mathematics'));

      expect(onEdit).toHaveBeenCalledTimes(1);
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

  describe('accessibility', () => {
    it('has role="button" on clickable content', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByText('Mathematics').closest('[role="button"]');
      expect(content).toBeInTheDocument();
    });

    it('has tabIndex for keyboard navigation', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByText('Mathematics').closest('[role="button"]');
      expect(content).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('styling', () => {
    it('has cursor-pointer class when canModify is true', () => {
      render(<SwipeableSessionItem {...defaultProps} />);

      const content = screen.getByTestId('session-content');
      expect(content).toHaveClass('cursor-pointer');
    });

    it('does not have cursor-pointer class when canModify is false', () => {
      render(<SwipeableSessionItem {...defaultProps} canModify={false} />);

      const content = screen.getByTestId('session-content');
      expect(content).not.toHaveClass('cursor-pointer');
    });
  });
});
