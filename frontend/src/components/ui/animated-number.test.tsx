import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AnimatedNumber } from './animated-number'

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

describe('AnimatedNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Default: animations enabled
    mockMatchMedia(false)
    // Mock requestAnimationFrame
    let frameId = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frameId++
      setTimeout(() => cb(performance.now()), 16)
      return frameId
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      clearTimeout(id)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('initial render', () => {
    it('renders the initial value', () => {
      render(<AnimatedNumber value={50} />)
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('respects decimals prop', () => {
      render(<AnimatedNumber value={50.5678} decimals={2} />)
      expect(screen.getByText('50.57')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      render(<AnimatedNumber value={50} className="custom-class" />)
      expect(screen.getByText('50')).toHaveClass('custom-class')
    })
  })

  describe('value changes', () => {
    it('animates from old value to new value', () => {
      const { rerender } = render(<AnimatedNumber value={0} duration={500} />)

      expect(screen.getByText('0')).toBeInTheDocument()

      rerender(<AnimatedNumber value={100} duration={500} />)

      // Advance through animation
      act(() => {
        vi.advanceTimersByTime(250) // Halfway through
      })

      // Value should be somewhere between 0 and 100
      const text = screen.getByText((content) => {
        const num = parseInt(content)
        return num > 0 && num < 100
      })
      expect(text).toBeInTheDocument()
    })

    it('completes animation at target value', () => {
      const { rerender } = render(<AnimatedNumber value={0} duration={500} />)

      rerender(<AnimatedNumber value={100} duration={500} />)

      // Complete the animation
      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('does not animate when value is unchanged', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame')

      const { rerender } = render(<AnimatedNumber value={50} />)
      const callsAfterMount = rafSpy.mock.calls.length

      rerender(<AnimatedNumber value={50} />)

      // Should not have called requestAnimationFrame again
      expect(rafSpy.mock.calls.length).toBe(callsAfterMount)
    })
  })

  describe('custom format function', () => {
    it('uses custom format function for display', () => {
      render(
        <AnimatedNumber
          value={1500}
          format={(val) => `$${val.toFixed(2)}`}
        />
      )

      expect(screen.getByText('$1500.00')).toBeInTheDocument()
    })

    it('applies format during animation', () => {
      const { rerender } = render(
        <AnimatedNumber
          value={0}
          duration={500}
          format={(val) => `${Math.round(val)}%`}
        />
      )

      rerender(
        <AnimatedNumber
          value={100}
          duration={500}
          format={(val) => `${Math.round(val)}%`}
        />
      )

      // During animation, should show formatted intermediate value
      act(() => {
        vi.advanceTimersByTime(16)
      })

      const span = screen.getByText((content) => content.includes('%'))
      expect(span).toBeInTheDocument()
    })
  })

  describe('animation timing', () => {
    it('respects custom duration', () => {
      const { rerender } = render(<AnimatedNumber value={0} duration={1000} />)

      rerender(<AnimatedNumber value={100} duration={1000} />)

      // At 500ms (halfway), should not be at target yet
      act(() => {
        vi.advanceTimersByTime(500)
      })

      const text = screen.getByText((content) => {
        const num = parseInt(content)
        return num < 100
      })
      expect(text).toBeInTheDocument()

      // At 1100ms, should be at target
      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(screen.getByText('100')).toBeInTheDocument()
    })
  })

  describe('cleanup', () => {
    it('cancels animation frame on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { rerender, unmount } = render(<AnimatedNumber value={0} duration={500} />)

      rerender(<AnimatedNumber value={100} duration={500} />)

      // Start animation
      act(() => {
        vi.advanceTimersByTime(16)
      })

      unmount()

      expect(cancelSpy).toHaveBeenCalled()
    })
  })

  describe('reduced motion', () => {
    it('updates value instantly when user prefers reduced motion', () => {
      mockMatchMedia(true) // Enable reduced motion preference

      const { rerender } = render(<AnimatedNumber value={0} duration={500} />)

      // Advance one frame to process initial render
      act(() => {
        vi.advanceTimersByTime(16)
      })

      rerender(<AnimatedNumber value={100} duration={500} />)

      // With reduced motion, one RAF call should complete the update
      act(() => {
        vi.advanceTimersByTime(16)
      })

      // Value should be at target after just one frame
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('shows final value after one frame when reduced motion is preferred', () => {
      mockMatchMedia(true)

      const { rerender } = render(<AnimatedNumber value={0} />)

      act(() => {
        vi.advanceTimersByTime(16)
      })

      rerender(<AnimatedNumber value={50} />)

      // One frame is enough with reduced motion
      act(() => {
        vi.advanceTimersByTime(16)
      })

      expect(screen.getByText('50')).toBeInTheDocument()
    })
  })
})
