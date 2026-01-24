import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './button'

describe('Button', () => {
  describe('rendering', () => {
    it('renders with default variant', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
    })

    it('renders with different variants', () => {
      const { rerender } = render(<Button variant="destructive">Delete</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')

      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-secondary')

      rerender(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')

      rerender(<Button variant="link">Link</Button>)
      expect(screen.getByRole('button')).toHaveClass('underline-offset-4')

      rerender(<Button variant="accent">Accent</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-accent')
    })
  })

  describe('sizes', () => {
    it('has default size with minimum touch target', () => {
      render(<Button size="default">Default</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('h-10')
      expect(button).toHaveClass('min-h-[44px]')
    })

    it('has small size', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('h-9')
      expect(button).toHaveClass('min-h-[36px]')
    })

    it('has large size with larger touch target', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('h-11')
      expect(button).toHaveClass('min-h-[48px]')
    })

    it('has icon size with square touch target', () => {
      render(<Button size="icon">Icon</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('h-10')
      expect(button).toHaveClass('w-10')
      expect(button).toHaveClass('min-h-[44px]')
      expect(button).toHaveClass('min-w-[44px]')
    })
  })

  describe('touch-friendly features', () => {
    it('has touch-action-manipulation class', () => {
      render(<Button>Touch</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('touch-action-manipulation')
    })

    it('has select-none class to prevent text selection', () => {
      render(<Button>Touch</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('select-none')
    })

    it('has active state classes for touch feedback', () => {
      render(<Button>Touch</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('active:brightness-[0.97]')
      expect(button).toHaveClass('active:translate-y-[1px]')
    })

    it('has transition for smooth interactions', () => {
      render(<Button>Touch</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('transition-all')
      expect(button).toHaveClass('duration-150')
    })
  })

  describe('accessibility', () => {
    it('has focus-visible ring for keyboard navigation', () => {
      render(<Button>Focusable</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveClass('focus-visible:outline-none')
      expect(button).toHaveClass('focus-visible:ring-2')
      expect(button).toHaveClass('focus-visible:ring-ring')
    })

    it('has disabled state styling', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-60')
      expect(button).toHaveClass('disabled:pointer-events-none')
    })
  })

  describe('asChild prop', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      )

      expect(screen.getByRole('link', { name: 'Link Button' })).toBeInTheDocument()
    })
  })
})
