import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { StateTransition } from './state-transition'

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
  })
}

describe('StateTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Default: animations enabled
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('visibility states', () => {
    it('renders children when show is true', () => {
      render(
        <StateTransition show={true}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      expect(screen.getByTestId('content')).toBeInTheDocument()
    })

    it('does not render children initially when show is false', () => {
      render(
        <StateTransition show={false}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('unmounts children after exit animation when unmountOnExit is true', () => {
      const { rerender } = render(
        <StateTransition show={true} unmountOnExit={true} exitDuration={200}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      // Trigger exit
      rerender(
        <StateTransition show={false} unmountOnExit={true} exitDuration={200}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      // Content should still be visible during exit animation
      expect(screen.getByTestId('content')).toBeInTheDocument()

      // After exit duration, content should be unmounted
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('keeps children mounted when unmountOnExit is false', () => {
      const { rerender } = render(
        <StateTransition show={true} unmountOnExit={false} exitDuration={200}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      rerender(
        <StateTransition show={false} unmountOnExit={false} exitDuration={200}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Content should still be in DOM, just hidden
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  describe('animation classes', () => {
    it('applies fade animation classes by default', () => {
      const { container } = render(
        <StateTransition show={true}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('transition-opacity')
    })

    it('applies slide-down animation classes', () => {
      const { container } = render(
        <StateTransition show={true} animation="slide-down">
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('transition-all')
    })

    it('applies enter classes when visible', () => {
      const { container } = render(
        <StateTransition show={true} animation="fade" enterDuration={300}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      // Trigger requestAnimationFrame callback
      act(() => {
        vi.advanceTimersByTime(20) // Trigger RAF
      })

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('opacity-100')
    })

    it('applies exit classes when hiding', () => {
      const { container, rerender } = render(
        <StateTransition show={true} animation="fade" enterDuration={100}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      // Complete enter animation
      act(() => {
        vi.advanceTimersByTime(100)
      })

      rerender(
        <StateTransition show={false} animation="fade" enterDuration={100}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('opacity-0')
    })
  })

  describe('custom durations', () => {
    it('respects custom enter duration', () => {
      const onEntered = vi.fn()

      render(
        <StateTransition show={true} enterDuration={500} onEntered={onEntered}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      // Trigger animation start
      act(() => {
        vi.advanceTimersByTime(16)
      })

      // Callback should not be called yet at 300ms
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(onEntered).not.toHaveBeenCalled()

      // Callback should be called after 500ms total
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(onEntered).toHaveBeenCalledTimes(1)
    })

    it('respects custom exit duration', () => {
      const onExited = vi.fn()

      const { rerender } = render(
        <StateTransition show={true} exitDuration={500} onExited={onExited}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      rerender(
        <StateTransition show={false} exitDuration={500} onExited={onExited}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      // Callback should not be called yet at 300ms
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(onExited).not.toHaveBeenCalled()

      // Callback should be called after 500ms
      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(onExited).toHaveBeenCalledTimes(1)
    })
  })

  describe('callbacks', () => {
    it('calls onEntered after enter animation completes', () => {
      const onEntered = vi.fn()

      render(
        <StateTransition show={true} enterDuration={300} onEntered={onEntered}>
          <div>Content</div>
        </StateTransition>
      )

      // Trigger animation start
      act(() => {
        vi.advanceTimersByTime(16)
      })

      expect(onEntered).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(onEntered).toHaveBeenCalledTimes(1)
    })

    it('calls onExited after exit animation completes', () => {
      const onExited = vi.fn()

      const { rerender } = render(
        <StateTransition show={true} exitDuration={200} onExited={onExited}>
          <div>Content</div>
        </StateTransition>
      )

      rerender(
        <StateTransition show={false} exitDuration={200} onExited={onExited}>
          <div>Content</div>
        </StateTransition>
      )

      expect(onExited).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(onExited).toHaveBeenCalledTimes(1)
    })
  })

  describe('className prop', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <StateTransition show={true} className="custom-class">
          <div>Content</div>
        </StateTransition>
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('aria-hidden', () => {
    it('sets aria-hidden to false when visible', () => {
      const { container } = render(
        <StateTransition show={true}>
          <div>Content</div>
        </StateTransition>
      )

      // Trigger requestAnimationFrame callback
      act(() => {
        vi.advanceTimersByTime(20)
      })

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('aria-hidden', 'false')
    })

    it('sets aria-hidden to true when exiting', () => {
      const { container, rerender } = render(
        <StateTransition show={true} unmountOnExit={false}>
          <div>Content</div>
        </StateTransition>
      )

      rerender(
        <StateTransition show={false} unmountOnExit={false}>
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('reduced motion', () => {
    it('uses instant durations when user prefers reduced motion', () => {
      mockMatchMedia(true)
      const onEntered = vi.fn()

      render(
        <StateTransition show={true} enterDuration={500} onEntered={onEntered}>
          <div>Content</div>
        </StateTransition>
      )

      // With reduced motion, callback should be called immediately (0ms duration)
      act(() => {
        vi.advanceTimersByTime(1)
      })

      expect(onEntered).toHaveBeenCalledTimes(1)
    })

    it('unmounts immediately on exit when reduced motion is preferred', () => {
      mockMatchMedia(true)
      const onExited = vi.fn()

      const { rerender } = render(
        <StateTransition show={true} exitDuration={500} onExited={onExited}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      rerender(
        <StateTransition show={false} exitDuration={500} onExited={onExited}>
          <div data-testid="content">Content</div>
        </StateTransition>
      )

      // With reduced motion, exit should be instant
      act(() => {
        vi.advanceTimersByTime(1)
      })

      expect(onExited).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('sets transition duration to 0ms when reduced motion is preferred', () => {
      mockMatchMedia(true)

      const { container } = render(
        <StateTransition show={true} enterDuration={500}>
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transitionDuration).toBe('0ms')
    })
  })
})
