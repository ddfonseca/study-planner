import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Inbox, Search, FileX } from 'lucide-react'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  describe('rendering', () => {
    it('renders title correctly', () => {
      render(<EmptyState title="Nenhum item encontrado" />)
      expect(screen.getByText('Nenhum item encontrado')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(
        <EmptyState
          title="Nenhum item"
          description="Tente adicionar um novo item"
        />
      )
      expect(screen.getByText('Tente adicionar um novo item')).toBeInTheDocument()
    })

    it('does not render description when not provided', () => {
      render(<EmptyState title="Nenhum item" />)
      expect(screen.queryByText('Tente adicionar')).not.toBeInTheDocument()
    })

    it('renders icon when provided', () => {
      render(<EmptyState title="Nenhum item" icon={Inbox} />)
      const icon = document.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('renders action when provided', () => {
      render(
        <EmptyState
          title="Nenhum item"
          action={<button>Adicionar item</button>}
        />
      )
      expect(screen.getByRole('button', { name: 'Adicionar item' })).toBeInTheDocument()
    })
  })

  describe('variants', () => {
    it('renders default variant with muted text', () => {
      const { container } = render(<EmptyState title="Test" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('text-muted-foreground')
    })

    it('renders subtle variant with reduced opacity', () => {
      const { container } = render(<EmptyState title="Test" variant="subtle" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('text-muted-foreground/70')
    })

    it('renders card variant with border and background', () => {
      const { container } = render(<EmptyState title="Test" variant="card" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('border')
      expect(wrapper).toHaveClass('bg-card')
      expect(wrapper).toHaveClass('rounded-[var(--radius)]')
    })
  })

  describe('sizes', () => {
    it('renders default size with correct padding', () => {
      const { container } = render(<EmptyState title="Test" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('py-12')
    })

    it('renders small size with reduced padding', () => {
      const { container } = render(<EmptyState title="Test" size="sm" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('py-6')
    })

    it('renders large size with increased padding', () => {
      const { container } = render(<EmptyState title="Test" size="lg" />)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('py-16')
    })

    it('renders small icon for small size', () => {
      render(<EmptyState title="Test" size="sm" icon={Search} />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-8', 'w-8')
    })

    it('renders large icon for large size', () => {
      render(<EmptyState title="Test" size="lg" icon={FileX} />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveClass('h-16', 'w-16')
    })
  })

  describe('customization', () => {
    it('applies custom className', () => {
      const { container } = render(
        <EmptyState title="Test" className="custom-class" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('custom-class')
    })

    it('forwards additional props', () => {
      const { container } = render(
        <EmptyState title="Test" data-testid="empty-state" />
      )
      expect(container.querySelector('[data-testid="empty-state"]')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('hides decorative icon from screen readers', () => {
      render(<EmptyState title="Nenhum resultado" icon={Search} />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('renders text content for screen readers', () => {
      render(
        <EmptyState
          title="Nenhum item encontrado"
          description="Use a busca para encontrar itens"
        />
      )
      expect(screen.getByText('Nenhum item encontrado')).toBeVisible()
      expect(screen.getByText('Use a busca para encontrar itens')).toBeVisible()
    })
  })
})
