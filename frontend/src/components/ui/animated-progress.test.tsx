import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { AnimatedProgress } from './animated-progress'

describe('AnimatedProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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

  describe('rendering', () => {
    it('renders an SVG with two circles', () => {
      const { container } = render(<AnimatedProgress value={50} />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()

      const circles = container.querySelectorAll('circle')
      expect(circles).toHaveLength(2)
    })

    it('renders children in center', () => {
      render(
        <AnimatedProgress value={50}>
          <span data-testid="center-content">50%</span>
        </AnimatedProgress>
      )

      expect(screen.getByTestId('center-content')).toBeInTheDocument()
    })
  })

  describe('size customization', () => {
    it('applies custom size to container and SVG', () => {
      const { container } = render(<AnimatedProgress value={50} size={100} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '100px', height: '100px' })

      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '100')
      expect(svg).toHaveAttribute('height', '100')
    })

    it('uses default size of 64px', () => {
      const { container } = render(<AnimatedProgress value={50} />)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ width: '64px', height: '64px' })
    })
  })

  describe('stroke width', () => {
    it('applies custom stroke width to circles', () => {
      const { container } = render(<AnimatedProgress value={50} strokeWidth={5} />)

      const circles = container.querySelectorAll('circle')
      circles.forEach(circle => {
        expect(circle).toHaveAttribute('stroke-width', '5')
      })
    })
  })

  describe('progress animation', () => {
    it('starts at 0 and animates to target value', () => {
      const { container } = render(<AnimatedProgress value={50} duration={500} />)

      // Initially should be at 0 (full circumference offset)
      const progressCircle = container.querySelectorAll('circle')[1]
      const initialOffset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '0')

      // Get circumference (2 * PI * radius)
      const circumference = parseFloat(progressCircle.getAttribute('stroke-dasharray') || '0')

      // Initial offset should be close to full circumference (0% progress)
      expect(initialOffset).toBeCloseTo(circumference, 0)
    })

    it('animates progress change', () => {
      const { container, rerender } = render(<AnimatedProgress value={0} duration={500} />)

      // Complete initial animation
      act(() => {
        vi.advanceTimersByTime(600)
      })

      rerender(<AnimatedProgress value={100} duration={500} />)

      // After animation completes, offset should be close to 0 (100% progress)
      act(() => {
        vi.advanceTimersByTime(600)
      })

      const progressCircle = container.querySelectorAll('circle')[1]
      const finalOffset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '100')
      expect(finalOffset).toBeCloseTo(0, 0)
    })
  })

  describe('className props', () => {
    it('applies custom className to container', () => {
      const { container } = render(
        <AnimatedProgress value={50} className="custom-container" />
      )

      expect(container.firstChild).toHaveClass('custom-container')
    })

    it('applies trackClassName to track circle', () => {
      const { container } = render(
        <AnimatedProgress value={50} trackClassName="custom-track" />
      )

      const trackCircle = container.querySelectorAll('circle')[0]
      expect(trackCircle).toHaveClass('custom-track')
    })

    it('applies progressClassName to progress circle', () => {
      const { container } = render(
        <AnimatedProgress value={50} progressClassName="custom-progress" />
      )

      const progressCircle = container.querySelectorAll('circle')[1]
      expect(progressCircle).toHaveClass('custom-progress')
    })
  })

  describe('value clamping', () => {
    it('clamps value to maximum of 100', () => {
      const { container } = render(<AnimatedProgress value={150} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      const progressCircle = container.querySelectorAll('circle')[1]
      const offset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '100')
      // At 100%, offset should be 0
      expect(offset).toBeCloseTo(0, 0)
    })

    it('clamps value to minimum of 0', () => {
      const { container } = render(<AnimatedProgress value={-50} duration={100} />)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      const progressCircle = container.querySelectorAll('circle')[1]
      const circumference = parseFloat(progressCircle.getAttribute('stroke-dasharray') || '0')
      const offset = parseFloat(progressCircle.getAttribute('stroke-dashoffset') || '0')
      // At 0%, offset should equal circumference
      expect(offset).toBeCloseTo(circumference, 0)
    })
  })

  describe('cleanup', () => {
    it('cancels animation frame on unmount', () => {
      const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { rerender, unmount } = render(<AnimatedProgress value={0} duration={500} />)

      rerender(<AnimatedProgress value={100} duration={500} />)

      act(() => {
        vi.advanceTimersByTime(16)
      })

      unmount()

      expect(cancelSpy).toHaveBeenCalled()
    })
  })
})
