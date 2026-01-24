import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('animate-pulse-soft', () => {
  it('can be applied as a class to elements', () => {
    const { container } = render(
      <div className="animate-pulse-soft" data-testid="pulse-element">
        Content
      </div>
    )
    const element = container.querySelector('.animate-pulse-soft')
    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('animate-pulse-soft')
  })

  it('can be combined with other classes', () => {
    const { container } = render(
      <div className="animate-pulse-soft bg-primary/10 rounded-md">
        Content
      </div>
    )
    const element = container.querySelector('.animate-pulse-soft')
    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('animate-pulse-soft')
    expect(element).toHaveClass('bg-primary/10')
    expect(element).toHaveClass('rounded-md')
  })

  it('can be used in skeleton-style components', () => {
    const SoftPulseSkeleton = ({ className }: { className?: string }) => (
      <div className={`animate-pulse-soft rounded-md bg-primary/10 ${className || ''}`} />
    )

    const { container } = render(<SoftPulseSkeleton className="h-4 w-24" />)
    const element = container.querySelector('.animate-pulse-soft')
    expect(element).toBeInTheDocument()
    expect(element).toHaveClass('rounded-md')
    expect(element).toHaveClass('h-4')
    expect(element).toHaveClass('w-24')
  })
})
