import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChartSkeleton } from './ChartSkeleton';

describe('ChartSkeleton', () => {
  describe('common elements', () => {
    it('renders inside a Card component', () => {
      const { container } = render(<ChartSkeleton />);

      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
    });

    it('renders a skeleton for the title', () => {
      const { container } = render(<ChartSkeleton />);

      // Title skeleton should be in the CardHeader
      const titleSkeleton = container.querySelector('.h-6.w-40');
      expect(titleSkeleton).toBeInTheDocument();
      expect(titleSkeleton).toHaveClass('animate-pulse-soft');
    });

    it('renders chart area with correct height', () => {
      const { container } = render(<ChartSkeleton />);

      const chartArea = container.querySelector('.h-\\[300px\\]');
      expect(chartArea).toBeInTheDocument();
    });

    it('renders Y-axis label skeletons', () => {
      const { container } = render(<ChartSkeleton />);

      const yAxisLabels = container.querySelectorAll('.h-3.w-8.animate-pulse-soft');
      expect(yAxisLabels.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('bar variant', () => {
    it('renders bar variant by default', () => {
      const { container } = render(<ChartSkeleton />);

      // Bar variant should have bars with rounded-t-sm class
      const bars = container.querySelectorAll('.rounded-t-sm');
      expect(bars.length).toBeGreaterThan(0);
    });

    it('renders default number of bars (7)', () => {
      const { container } = render(<ChartSkeleton variant="bar" />);

      const bars = container.querySelectorAll('.rounded-t-sm');
      expect(bars).toHaveLength(7);
    });

    it('renders custom number of bars', () => {
      const { container } = render(<ChartSkeleton variant="bar" barCount={5} />);

      const bars = container.querySelectorAll('.rounded-t-sm');
      expect(bars).toHaveLength(5);
    });

    it('renders bars with varying heights', () => {
      const { container } = render(<ChartSkeleton variant="bar" />);

      const bars = container.querySelectorAll('.rounded-t-sm');
      const heights = Array.from(bars).map((bar) => (bar as HTMLElement).style.height);

      // Check that heights vary (not all the same)
      const uniqueHeights = new Set(heights);
      expect(uniqueHeights.size).toBeGreaterThan(1);
    });

    it('renders X-axis label skeletons', () => {
      const { container } = render(<ChartSkeleton variant="bar" />);

      // X-axis labels container
      const xAxisContainer = container.querySelector('.pl-10.pt-2');
      expect(xAxisContainer).toBeInTheDocument();

      const xAxisLabels = xAxisContainer?.querySelectorAll('.animate-pulse-soft');
      expect(xAxisLabels?.length).toBeGreaterThan(0);
    });
  });

  describe('line variant', () => {
    it('renders line variant when specified', () => {
      const { container } = render(<ChartSkeleton variant="line" />);

      // Line variant should not have bar elements
      const bars = container.querySelectorAll('.rounded-t-sm');
      expect(bars).toHaveLength(0);
    });

    it('renders data point circles in line variant', () => {
      const { container } = render(<ChartSkeleton variant="line" />);

      const dataPoints = container.querySelectorAll('.rounded-full.w-3.h-3');
      expect(dataPoints).toHaveLength(7);
    });

    it('renders area fill skeleton in line variant', () => {
      const { container } = render(<ChartSkeleton variant="line" />);

      const areaFill = container.querySelector('.opacity-50.rounded-md');
      expect(areaFill).toBeInTheDocument();
    });
  });

  describe('matches chart layout', () => {
    it('uses same card structure as actual charts', () => {
      const { container } = render(<ChartSkeleton />);

      // Check for Card > CardHeader + CardContent structure
      const card = container.querySelector('.bg-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('h-full');
    });

    it('has chart area with axis borders', () => {
      const { container } = render(<ChartSkeleton />);

      const chartArea = container.querySelector('.border-l.border-b.border-muted');
      expect(chartArea).toBeInTheDocument();
    });
  });
});
