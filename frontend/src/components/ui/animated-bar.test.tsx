import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AnimatedBar } from './animated-bar'

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

describe('AnimatedBar', () => {
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
    it('renders with initial height of 0', () => {
      const { container } = render(<AnimatedBar height={50} />)

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '0%' })
    })

    it('animates to target height', () => {
      const { container } = render(<AnimatedBar height={50} duration={400} />)

      // Complete animation
      act(() => {
        vi.advanceTimersByTime(500)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '50%' })
    })
  })

  describe('delay prop', () => {
    it('delays animation start', () => {
      const { container } = render(<AnimatedBar height={50} duration={400} delay={200} />)

      // Before delay ends
      act(() => {
        vi.advanceTimersByTime(100)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '0%' })

      // After delay + animation
      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(bar).toHaveStyle({ height: '50%' })
    })

    it('only applies delay on initial mount', () => {
      const { container, rerender } = render(<AnimatedBar height={50} duration={400} delay={200} />)

      // Complete initial animation
      act(() => {
        vi.advanceTimersByTime(800)
      })

      // Update height - should not have delay
      rerender(<AnimatedBar height={75} duration={400} delay={200} />)

      // Animation should start immediately (no delay)
      act(() => {
        vi.advanceTimersByTime(500)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '75%' })
    })
  })

  describe('minHeight prop', () => {
    it('enforces minimum height', () => {
      const { container } = render(<AnimatedBar height={5} minHeight={10} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '10%' })
    })

    it('allows height above minimum', () => {
      const { container } = render(<AnimatedBar height={50} minHeight={10} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '50%' })
    })
  })

  describe('height clamping', () => {
    it('clamps height to maximum of 100', () => {
      const { container } = render(<AnimatedBar height={150} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '100%' })
    })
  })

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(<AnimatedBar height={50} className="custom-class bg-blue-500" />)

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveClass('custom-class')
      expect(bar).toHaveClass('bg-blue-500')
    })

    it('always includes w-full class', () => {
      const { container } = render(<AnimatedBar height={50} />)

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveClass('w-full')
    })
  })

  describe('height updates', () => {
    it('animates from current height to new height', () => {
      const { container, rerender } = render(<AnimatedBar height={25} duration={400} />)

      // Complete first animation
      act(() => {
        vi.advanceTimersByTime(500)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '25%' })

      // Update to new height
      rerender(<AnimatedBar height={75} duration={400} />)

      // Complete second animation
      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(bar).toHaveStyle({ height: '75%' })
    })

    it('can animate from high to low', () => {
      const { container, rerender } = render(<AnimatedBar height={75} duration={400} />)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      rerender(<AnimatedBar height={25} duration={400} />)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '25%' })
    })
  })

  describe('animation duration', () => {
    it('respects custom duration', () => {
      const { container } = render(<AnimatedBar height={100} duration={1000} />)

      // At 500ms (halfway), should not be at target
      act(() => {
        vi.advanceTimersByTime(500)
      })

      const bar = container.firstChild as HTMLElement
      const height = parseFloat(bar.style.height)
      expect(height).toBeLessThan(100)
      expect(height).toBeGreaterThan(0)

      // After full duration
      act(() => {
        vi.advanceTimersByTime(600)
      })

      expect(bar).toHaveStyle({ height: '100%' })
    })
  })

  describe('cleanup', () => {
    it('cancels animation frame on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { rerender, unmount } = render(<AnimatedBar height={0} duration={500} />)

      rerender(<AnimatedBar height={100} duration={500} />)

      act(() => {
        vi.advanceTimersByTime(16)
      })

      unmount()

      expect(cancelSpy).toHaveBeenCalled()
    })

    it('clears delay timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = render(<AnimatedBar height={50} delay={500} />)

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('reduced motion', () => {
    it('updates height instantly when user prefers reduced motion', () => {
      mockMatchMedia(true)

      const { container } = render(<AnimatedBar height={50} duration={500} />)

      // With reduced motion, one RAF call should complete the update
      act(() => {
        vi.advanceTimersByTime(16)
      })

      // Height should be at target after just one frame
      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '50%' })
    })

    it('shows final height after one frame when reduced motion is preferred', () => {
      mockMatchMedia(true)

      const { container, rerender } = render(<AnimatedBar height={25} />)

      act(() => {
        vi.advanceTimersByTime(16)
      })

      let bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '25%' })

      rerender(<AnimatedBar height={75} />)

      act(() => {
        vi.advanceTimersByTime(16)
      })

      bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '75%' })
    })

    it('ignores delay when reduced motion is preferred', () => {
      mockMatchMedia(true)

      const { container } = render(<AnimatedBar height={50} delay={500} />)

      // With reduced motion, delay is skipped - one frame is enough
      act(() => {
        vi.advanceTimersByTime(16)
      })

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveStyle({ height: '50%' })
    })
  })
})
