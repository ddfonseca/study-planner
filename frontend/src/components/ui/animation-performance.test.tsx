import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { AnimatedBar } from './animated-bar'
import { AnimatedProgress } from './animated-progress'
import { AnimatedNumber } from './animated-number'
import { StateTransition } from './state-transition'
import { Confetti } from './confetti'

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

// Properties that trigger layout/paint (avoid for 60fps)
const NON_PERFORMANT_PROPERTIES = [
  'width',
  'height',
  'top',
  'left',
  'right',
  'bottom',
  'margin',
  'padding',
  'border-width',
  'font-size',
]

// Properties that are GPU-accelerated (good for 60fps): transform, opacity

/**
 * Animation Performance Tests
 *
 * These tests verify that our animations use GPU-accelerated properties
 * for smooth 60fps performance. The key principles are:
 *
 * 1. Use transform and opacity for animations (GPU-accelerated)
 * 2. Avoid animating properties that trigger layout (width, height, top, left, etc.)
 * 3. Use will-change hints to optimize compositing
 * 4. Use requestAnimationFrame for JS animations
 * 5. Respect prefers-reduced-motion for accessibility
 */
describe('Animation Performance (60fps)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockMatchMedia(false)

    // Mock requestAnimationFrame
    let frameId = 0
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      frameId++
      setTimeout(() => cb(performance.now()), 16) // ~60fps
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

  describe('AnimatedBar - GPU Acceleration', () => {
    it('uses scaleY transform instead of height for animation', () => {
      const { container } = render(<AnimatedBar height={50} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      const bar = container.firstChild as HTMLElement
      // Should use transform, not height
      expect(bar.style.transform).toContain('scaleY')
      expect(bar.style.height).toBe('')
    })

    it('includes will-change-transform optimization hint', () => {
      const { container } = render(<AnimatedBar height={50} />)

      const bar = container.firstChild as HTMLElement
      expect(bar).toHaveClass('will-change-transform')
    })

    it('uses transformOrigin bottom for natural bar growth', () => {
      const { container } = render(<AnimatedBar height={50} />)

      const bar = container.firstChild as HTMLElement
      expect(bar.style.transformOrigin).toBe('bottom')
    })

    it('does not animate non-performant properties', () => {
      const { container } = render(<AnimatedBar height={50} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(50) // Mid-animation
      })

      const bar = container.firstChild as HTMLElement
      NON_PERFORMANT_PROPERTIES.forEach((prop) => {
        const value = bar.style.getPropertyValue(prop)
        // Should not have animated values
        expect(value).not.toMatch(/^\d+%$/)
      })
    })
  })

  describe('AnimatedProgress - GPU Acceleration', () => {
    it('uses stroke-dashoffset for SVG animation (GPU-friendly)', () => {
      const { container } = render(<AnimatedProgress value={50} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      const progressCircle = container.querySelectorAll('circle')[1]
      expect(progressCircle).toHaveAttribute('stroke-dashoffset')
    })

    it('SVG transforms are GPU-accelerated', () => {
      const { container } = render(<AnimatedProgress value={50} />)

      // SVG uses a rotation transform for the circular effect
      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('-rotate-90')
    })
  })

  describe('AnimatedNumber - Performance', () => {
    it('only updates text content (no layout-triggering styles)', () => {
      const { container } = render(<AnimatedNumber value={50} duration={100} />)

      const span = container.firstChild as HTMLElement

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Should not have any animated styles
      expect(span.style.length).toBe(0)
    })
  })

  describe('StateTransition - GPU Acceleration', () => {
    it('includes will-change hints for fade animation', () => {
      const { container } = render(
        <StateTransition show={true} animation="fade">
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('will-change-opacity')
    })

    it('includes will-change hints for slide animations', () => {
      const { container } = render(
        <StateTransition show={true} animation="slide-down">
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('will-change-transform-opacity')
    })

    it('includes will-change hints for scale animation', () => {
      const { container } = render(
        <StateTransition show={true} animation="scale">
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('will-change-transform-opacity')
    })

    it('uses transform-based transitions (not position)', () => {
      const { container } = render(
        <StateTransition show={true} animation="slide-up">
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      // translate-y uses transform, not top/bottom
      expect(wrapper.className).toMatch(/translate-y/)
      expect(wrapper.style.top).toBe('')
      expect(wrapper.style.bottom).toBe('')
    })
  })

  describe('Confetti - Canvas Performance', () => {
    beforeEach(() => {
      // Mock canvas context
      HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        globalAlpha: 1,
      })
    })

    it('uses Canvas API for hardware-accelerated rendering', () => {
      const { container } = render(<Confetti active={true} duration={1000} />)

      const canvas = container.querySelector('canvas')
      expect(canvas).toBeInTheDocument()
    })

    it('canvas is positioned with pointer-events-none for performance', () => {
      const { container } = render(<Confetti active={true} duration={1000} />)

      const canvas = container.querySelector('canvas')
      expect(canvas).toHaveClass('pointer-events-none')
    })

    it('uses requestAnimationFrame for animation loop', () => {
      render(<Confetti active={true} duration={1000} />)

      // RAF should be called to start animation
      expect(window.requestAnimationFrame).toHaveBeenCalled()
    })
  })

  describe('Cubic Bezier Easing for 60fps', () => {
    it('StateTransition uses Material Design easing', () => {
      const { container } = render(
        <StateTransition show={true} enterDuration={300}>
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      // Material Design standard: cubic-bezier(0.4, 0, 0.2, 1)
      expect(wrapper.style.transitionTimingFunction).toBe('cubic-bezier(0.4, 0, 0.2, 1)')
    })
  })

  describe('Reduced Motion Support', () => {
    beforeEach(() => {
      mockMatchMedia(true)
    })

    it('AnimatedBar respects reduced motion preference', () => {
      const { container } = render(<AnimatedBar height={50} duration={500} />)

      act(() => {
        vi.advanceTimersByTime(16)
      })

      const bar = container.firstChild as HTMLElement
      // Should jump to final state immediately
      expect(bar.style.transform).toContain('scaleY(0.5)')
    })

    it('StateTransition uses 0ms duration for reduced motion', () => {
      const { container } = render(
        <StateTransition show={true} enterDuration={500}>
          <div>Content</div>
        </StateTransition>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.transitionDuration).toBe('0ms')
    })

    it('Confetti does not render when reduced motion is preferred', () => {
      const { container } = render(<Confetti active={true} duration={1000} />)

      const canvas = container.querySelector('canvas')
      expect(canvas).not.toBeInTheDocument()
    })
  })

  describe('requestAnimationFrame Usage', () => {
    it('AnimatedBar uses RAF for smooth animation', () => {
      render(<AnimatedBar height={50} duration={400} />)

      expect(window.requestAnimationFrame).toHaveBeenCalled()
    })

    it('AnimatedProgress uses RAF for smooth animation', () => {
      render(<AnimatedProgress value={50} duration={400} />)

      expect(window.requestAnimationFrame).toHaveBeenCalled()
    })

    it('AnimatedNumber uses RAF for smooth animation on value change', () => {
      const { rerender } = render(<AnimatedNumber value={0} duration={400} />)

      // Clear RAF calls from initial render
      vi.mocked(window.requestAnimationFrame).mockClear()

      // Change value to trigger animation
      rerender(<AnimatedNumber value={50} duration={400} />)

      expect(window.requestAnimationFrame).toHaveBeenCalled()
    })

    it('cleanup cancels RAF on unmount to prevent memory leaks', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { unmount } = render(<AnimatedBar height={50} duration={1000} />)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      unmount()

      expect(cancelSpy).toHaveBeenCalled()
    })
  })
})
