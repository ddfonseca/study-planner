import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatsCardsSkeleton } from './StatsCardsSkeleton';

describe('StatsCardsSkeleton', () => {
  describe('card rendering', () => {
    it('renders 4 skeleton cards', () => {
      const { container } = render(<StatsCardsSkeleton />);

      const cards = container.querySelectorAll('.bg-card');
      expect(cards).toHaveLength(4);
    });

    it('renders skeleton elements for icon and text in each card', () => {
      const { container } = render(<StatsCardsSkeleton />);

      const skeletons = container.querySelectorAll('.animate-pulse');
      // Each card has 3 skeletons: icon, title, value
      expect(skeletons).toHaveLength(12);
    });
  });

  describe('matches StatsCards layout', () => {
    it('uses same grid layout as StatsCards', () => {
      const { container } = render(<StatsCardsSkeleton />);

      const grid = container.firstChild;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('grid-cols-2');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('uses same gap classes as StatsCards', () => {
      const { container } = render(<StatsCardsSkeleton />);

      const grid = container.firstChild;
      expect(grid).toHaveClass('gap-2');
      expect(grid).toHaveClass('sm:gap-4');
    });

    it('uses same padding classes as StatsCards', () => {
      const { container } = render(<StatsCardsSkeleton />);

      const cardContents = container.querySelectorAll('[class*="p-3"]');
      expect(cardContents).toHaveLength(4);
      cardContents.forEach((content) => {
        expect(content).toHaveClass('p-3');
        expect(content).toHaveClass('sm:p-6');
      });
    });

    it('uses same flex layout as StatsCards', () => {
      const { container } = render(<StatsCardsSkeleton />);

      const flexContainers = container.querySelectorAll('.flex.flex-col');
      expect(flexContainers).toHaveLength(4);
      flexContainers.forEach((flex) => {
        expect(flex).toHaveClass('sm:flex-row');
        expect(flex).toHaveClass('sm:items-center');
        expect(flex).toHaveClass('gap-2');
        expect(flex).toHaveClass('sm:gap-4');
      });
    });
  });

  describe('skeleton dimensions', () => {
    it('renders icon skeletons with responsive sizes', () => {
      const { container } = render(<StatsCardsSkeleton />);

      const iconSkeletons = container.querySelectorAll('.rounded-lg.animate-pulse');
      expect(iconSkeletons).toHaveLength(4);
      iconSkeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('h-8');
        expect(skeleton).toHaveClass('w-8');
        expect(skeleton).toHaveClass('sm:h-12');
        expect(skeleton).toHaveClass('sm:w-12');
      });
    });
  });
});
