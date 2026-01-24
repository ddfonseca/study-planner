import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SubjectStatsCards } from './SubjectStatsCards'
import type { SubjectStats } from '@/types/session'

const mockStats: SubjectStats = {
  totalMinutes: 180,
  totalSessions: 5,
  averageSessionMinutes: 36,
  percentageOfTotal: 25,
}

describe('SubjectStatsCards', () => {
  describe('rendering', () => {
    it('renders all four stat cards', () => {
      render(<SubjectStatsCards stats={mockStats} />)

      expect(screen.getByText('Total de Horas')).toBeInTheDocument()
      expect(screen.getByText('Sessoes')).toBeInTheDocument()
      expect(screen.getByText('Media por Sessao')).toBeInTheDocument()
      expect(screen.getByText('% do Total')).toBeInTheDocument()
    })

    it('displays formatted time for total minutes', () => {
      render(<SubjectStatsCards stats={mockStats} />)
      expect(screen.getByText('3h')).toBeInTheDocument()
    })

    it('displays total sessions count', () => {
      render(<SubjectStatsCards stats={mockStats} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays percentage of total', () => {
      render(<SubjectStatsCards stats={mockStats} />)
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('displays "-" when stats is null', () => {
      render(<SubjectStatsCards stats={null} />)
      const dashValues = screen.getAllByText('-')
      expect(dashValues.length).toBe(4)
    })
  })

  describe('responsive layout', () => {
    it('renders with responsive grid classes', () => {
      const { container } = render(<SubjectStatsCards stats={mockStats} />)
      const grid = container.firstChild as HTMLElement

      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('sm:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-4')
    })

    it('renders cards with responsive padding', () => {
      const { container } = render(<SubjectStatsCards stats={mockStats} />)
      const cardContent = container.querySelector('.p-3')

      expect(cardContent).toHaveClass('p-3')
      expect(cardContent).toHaveClass('sm:p-6')
    })

    it('renders with responsive gap in flex container', () => {
      const { container } = render(<SubjectStatsCards stats={mockStats} />)
      const flexContainer = container.querySelector('.gap-3')

      expect(flexContainer).toHaveClass('gap-3')
      expect(flexContainer).toHaveClass('sm:gap-4')
    })

    it('renders icons with responsive sizes', () => {
      render(<SubjectStatsCards stats={mockStats} />)
      const icons = document.querySelectorAll('svg')

      icons.forEach((icon) => {
        expect(icon).toHaveClass('h-5', 'w-5')
        expect(icon).toHaveClass('sm:h-6', 'sm:w-6')
      })
    })

    it('renders icon containers with responsive padding', () => {
      const { container } = render(<SubjectStatsCards stats={mockStats} />)
      const iconContainers = container.querySelectorAll('.rounded-lg')

      iconContainers.forEach((iconContainer) => {
        expect(iconContainer).toHaveClass('p-2')
        expect(iconContainer).toHaveClass('sm:p-3')
      })
    })

    it('renders values with responsive text size', () => {
      render(<SubjectStatsCards stats={mockStats} />)
      const valueElements = document.querySelectorAll('.font-bold')

      valueElements.forEach((element) => {
        expect(element).toHaveClass('text-xl')
        expect(element).toHaveClass('sm:text-2xl')
      })
    })

    it('renders values with responsive max-width for truncation', () => {
      render(<SubjectStatsCards stats={mockStats} />)
      const valueElements = document.querySelectorAll('.truncate')

      valueElements.forEach((element) => {
        expect(element).toHaveClass('max-w-[100px]')
        expect(element).toHaveClass('sm:max-w-[150px]')
      })
    })
  })

  describe('accessibility', () => {
    it('renders all icons with proper styling', () => {
      render(<SubjectStatsCards stats={mockStats} />)
      const icons = document.querySelectorAll('svg')

      expect(icons.length).toBe(4)
    })

    it('values are visible', () => {
      render(<SubjectStatsCards stats={mockStats} />)

      expect(screen.getByText('3h')).toBeVisible()
      expect(screen.getByText('5')).toBeVisible()
      expect(screen.getByText('25%')).toBeVisible()
    })
  })
})
