import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SkeletonTransition } from './skeleton-transition'

describe('SkeletonTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial loading state', () => {
    it('renders skeleton when isLoading is true', () => {
      render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('skeleton does not have fade animation on initial render', () => {
      const { container } = render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      const skeletonParent = container.firstChild as HTMLElement
      expect(skeletonParent).not.toHaveClass('animate-fade-out')
    })
  })

  describe('loaded state', () => {
    it('renders content after loading completes and transition finishes', () => {
      const { rerender } = render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      // Start loaded
      rerender(
        <SkeletonTransition
          isLoading={false}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      // During transition, both should be visible
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()

      // After transition completes
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('transition animations', () => {
    it('applies fade-out class to skeleton during transition', () => {
      const { rerender, container } = render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      rerender(
        <SkeletonTransition
          isLoading={false}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      const skeletonWrapper = container.querySelector('.animate-fade-out')
      expect(skeletonWrapper).toBeInTheDocument()
    })

    it('applies fade-in class to content during transition', () => {
      const { rerender, container } = render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      rerender(
        <SkeletonTransition
          isLoading={false}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      const contentWrapper = container.querySelector('.animate-fade-in')
      expect(contentWrapper).toBeInTheDocument()
    })
  })

  describe('custom duration', () => {
    it('respects custom transition duration', () => {
      const { rerender } = render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
          duration={500}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      rerender(
        <SkeletonTransition
          isLoading={false}
          skeleton={<div data-testid="skeleton">Loading...</div>}
          duration={500}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      // Skeleton should still be visible at 300ms (default would have finished)
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(screen.getByTestId('skeleton')).toBeInTheDocument()

      // After full 500ms, skeleton should be gone
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
    })
  })

  describe('className prop', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div>Loading...</div>}
          className="custom-class"
        >
          <div>Content</div>
        </SkeletonTransition>
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('re-loading', () => {
    it('shows skeleton again when isLoading becomes true after content was shown', () => {
      const { rerender } = render(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      // Load content
      rerender(
        <SkeletonTransition
          isLoading={false}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(screen.getByTestId('content')).toBeInTheDocument()

      // Start loading again
      rerender(
        <SkeletonTransition
          isLoading={true}
          skeleton={<div data-testid="skeleton">Loading...</div>}
        >
          <div data-testid="content">Content</div>
        </SkeletonTransition>
      )

      expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    })
  })
})
