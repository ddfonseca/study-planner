import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarGridSkeleton } from './CalendarGridSkeleton';

describe('CalendarGridSkeleton', () => {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  describe('header rendering', () => {
    it('renders all day name headers', () => {
      render(<CalendarGridSkeleton />);

      dayNames.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });

    it('renders Total column header', () => {
      render(<CalendarGridSkeleton />);

      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('renders 8 column headers (7 days + Total)', () => {
      render(<CalendarGridSkeleton />);

      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(8);
    });
  });

  describe('grid structure', () => {
    it('renders default 5 week rows', () => {
      render(<CalendarGridSkeleton />);

      const tbody = document.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(5);
    });

    it('renders custom number of week rows', () => {
      render(<CalendarGridSkeleton weekCount={6} />);

      const tbody = document.querySelector('tbody');
      const rows = tbody?.querySelectorAll('tr');
      expect(rows).toHaveLength(6);
    });

    it('renders 8 cells per row (7 days + Total)', () => {
      render(<CalendarGridSkeleton weekCount={1} />);

      const tbody = document.querySelector('tbody');
      const cells = tbody?.querySelectorAll('td');
      expect(cells).toHaveLength(8);
    });

    it('renders correct total number of skeleton cells', () => {
      const weekCount = 5;
      render(<CalendarGridSkeleton weekCount={weekCount} />);

      const tbody = document.querySelector('tbody');
      const cells = tbody?.querySelectorAll('td');
      // 8 cells per row (7 days + 1 Total) * weekCount rows
      expect(cells).toHaveLength(8 * weekCount);
    });
  });

  describe('matches CalendarGrid layout', () => {
    it('uses table-fixed layout like CalendarGrid', () => {
      render(<CalendarGridSkeleton />);

      const table = document.querySelector('table');
      expect(table).toHaveClass('table-fixed');
    });

    it('uses same column width classes as CalendarGrid', () => {
      render(<CalendarGridSkeleton />);

      const headers = screen.getAllByRole('columnheader');
      headers.forEach((header) => {
        expect(header).toHaveClass('w-[12.5%]');
      });
    });

    it('wraps in overflow-x-auto container like CalendarGrid', () => {
      const { container } = render(<CalendarGridSkeleton />);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('overflow-x-auto');
    });
  });
});
