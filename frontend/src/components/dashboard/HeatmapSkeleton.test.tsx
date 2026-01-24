import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HeatmapSkeleton } from './HeatmapSkeleton';

describe('HeatmapSkeleton', () => {
  describe('card structure', () => {
    it('renders inside a Card component', () => {
      const { container } = render(<HeatmapSkeleton />);

      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('renders header with icon and title skeletons', () => {
      const { container } = render(<HeatmapSkeleton />);

      // Icon skeleton
      const iconSkeleton = container.querySelector('.h-3\\.5.w-3\\.5');
      expect(iconSkeleton).toBeInTheDocument();
      expect(iconSkeleton).toHaveClass('animate-pulse');

      // Title skeleton
      const titleSkeleton = container.querySelector('.h-4.w-28');
      expect(titleSkeleton).toBeInTheDocument();
      expect(titleSkeleton).toHaveClass('animate-pulse');
    });
  });

  describe('month labels', () => {
    it('renders 12 month label skeletons', () => {
      const { container } = render(<HeatmapSkeleton />);

      const monthLabelsContainer = container.querySelector('.pl-7.gap-1');
      const monthLabels = monthLabelsContainer?.querySelectorAll('.animate-pulse.h-3.flex-1');
      expect(monthLabels).toHaveLength(12);
    });
  });

  describe('day labels', () => {
    it('renders day labels column', () => {
      const { container } = render(<HeatmapSkeleton />);

      const dayLabelsContainer = container.querySelector('.w-6.shrink-0');
      expect(dayLabelsContainer).toBeInTheDocument();

      // Check for day label text
      expect(dayLabelsContainer?.textContent).toContain('Dom');
      expect(dayLabelsContainer?.textContent).toContain('Ter');
      expect(dayLabelsContainer?.textContent).toContain('Qui');
      expect(dayLabelsContainer?.textContent).toContain('Sáb');
    });
  });

  describe('weeks grid', () => {
    it('renders default 53 week columns', () => {
      const { container } = render(<HeatmapSkeleton />);

      // Each week column has the flex-col class
      const weekColumns = container.querySelectorAll('.flex-1.flex-col.gap-\\[2px\\]');
      expect(weekColumns).toHaveLength(53);
    });

    it('renders 7 day cells per week', () => {
      const { container } = render(<HeatmapSkeleton />);

      // Get the first week column
      const firstWeek = container.querySelector('.flex-1.flex-col.gap-\\[2px\\]');
      const dayCells = firstWeek?.querySelectorAll('.aspect-square.rounded-sm');
      expect(dayCells).toHaveLength(7);
    });

    it('renders custom number of weeks', () => {
      const { container } = render(<HeatmapSkeleton weekCount={30} />);

      const weekColumns = container.querySelectorAll('.flex-1.flex-col.gap-\\[2px\\]');
      expect(weekColumns).toHaveLength(30);
    });

    it('renders cells with skeleton animation', () => {
      const { container } = render(<HeatmapSkeleton />);

      const cells = container.querySelectorAll('.aspect-square.rounded-sm.animate-pulse');
      // 53 weeks × 7 days = 371 cells
      expect(cells.length).toBe(53 * 7);
    });
  });

  describe('monthly totals', () => {
    it('renders 12 monthly total skeletons', () => {
      const { container } = render(<HeatmapSkeleton />);

      // Find the monthly totals row (second pl-7 div with mt-1)
      const totalsRow = container.querySelector('.pl-7.mt-1');
      const totalSkeletons = totalsRow?.querySelectorAll('.animate-pulse.h-3.flex-1');
      expect(totalSkeletons).toHaveLength(12);
    });
  });

  describe('legend', () => {
    it('renders year skeleton in legend', () => {
      const { container } = render(<HeatmapSkeleton />);

      const legendContainer = container.querySelector('.justify-between.pt-1');
      const yearSkeleton = legendContainer?.querySelector('.h-3.w-10');
      expect(yearSkeleton).toBeInTheDocument();
      expect(yearSkeleton).toHaveClass('animate-pulse');
    });

    it('renders intensity legend with 5 levels', () => {
      const { container } = render(<HeatmapSkeleton />);

      const legendContainer = container.querySelector('.justify-between.pt-1');
      const intensityBoxes = legendContainer?.querySelectorAll('.w-\\[10px\\].h-\\[10px\\].rounded-sm');
      expect(intensityBoxes).toHaveLength(5);
    });

    it('renders Menos and Mais labels', () => {
      const { container } = render(<HeatmapSkeleton />);

      expect(container.textContent).toContain('Menos');
      expect(container.textContent).toContain('Mais');
    });
  });

  describe('matches AnnualHeatmap layout', () => {
    it('uses same responsive container structure', () => {
      const { container } = render(<HeatmapSkeleton />);

      const responsiveContainer = container.querySelector('.min-w-\\[320px\\].sm\\:min-w-\\[450px\\].lg\\:min-w-\\[600px\\]');
      expect(responsiveContainer).toBeInTheDocument();
    });

    it('has scrollable wrapper', () => {
      const { container } = render(<HeatmapSkeleton />);

      const scrollWrapper = container.querySelector('.overflow-x-auto');
      expect(scrollWrapper).toBeInTheDocument();
    });

    it('uses same card header padding', () => {
      const { container } = render(<HeatmapSkeleton />);

      const cardHeader = container.querySelector('.pb-2');
      expect(cardHeader).toBeInTheDocument();
    });
  });
});
