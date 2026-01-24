import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { ToastProgress } from './toast'

describe('ToastProgress', () => {
  it('renders progress bar with default variant', () => {
    const { container } = render(<ToastProgress duration={5000} />)
    const progressBar = container.querySelector('.animate-toast-progress')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveClass('bg-foreground/20')
  })

  it('renders progress bar with destructive variant', () => {
    const { container } = render(
      <ToastProgress duration={5000} variant="destructive" />
    )
    const progressBar = container.querySelector('.animate-toast-progress')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveClass('bg-destructive-foreground/30')
  })

  it('renders progress bar with success variant', () => {
    const { container } = render(
      <ToastProgress duration={5000} variant="success" />
    )
    const progressBar = container.querySelector('.animate-toast-progress')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveClass('bg-accent/50')
  })

  it('applies correct animation duration', () => {
    const { container } = render(<ToastProgress duration={3000} />)
    const progressBar = container.querySelector('.animate-toast-progress')
    expect(progressBar).toHaveStyle({ animationDuration: '3000ms' })
  })

  it('renders with container styling', () => {
    const { container } = render(<ToastProgress duration={5000} />)
    const progressContainer = container.firstChild as HTMLElement
    expect(progressContainer).toHaveClass('absolute')
    expect(progressContainer).toHaveClass('bottom-0')
    expect(progressContainer).toHaveClass('left-0')
    expect(progressContainer).toHaveClass('right-0')
    expect(progressContainer).toHaveClass('h-1')
    expect(progressContainer).toHaveClass('overflow-hidden')
  })

  it('applies origin-left class for animation', () => {
    const { container } = render(<ToastProgress duration={5000} />)
    const progressBar = container.querySelector('.animate-toast-progress')
    expect(progressBar).toHaveClass('origin-left')
  })

  it('applies h-full to progress bar', () => {
    const { container } = render(<ToastProgress duration={5000} />)
    const progressBar = container.querySelector('.animate-toast-progress')
    expect(progressBar).toHaveClass('h-full')
  })
})
