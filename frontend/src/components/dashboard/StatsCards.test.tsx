import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatsCards } from './StatsCards'
import type { StudyStats } from '@/types/session'

const mockStats: StudyStats = {
  totalMinutes: 180,
  totalDays: 5,
  averageMinutesPerDay: 36,
  mostStudiedSubject: 'Matemática',
}

describe('StatsCards', () => {
  describe('rendering', () => {
    it('renders all four stat cards', () => {
      render(<StatsCards stats={mockStats} />)

      expect(screen.getByText('Tempo Total')).toBeInTheDocument()
      expect(screen.getByText('Dias Estudados')).toBeInTheDocument()
      expect(screen.getByText('Média por Dia')).toBeInTheDocument()
      expect(screen.getByText('Matéria Principal')).toBeInTheDocument()
    })

    it('displays formatted time for total minutes', () => {
      render(<StatsCards stats={mockStats} />)
      expect(screen.getByText('3h')).toBeInTheDocument()
    })

    it('displays total days count', () => {
      render(<StatsCards stats={mockStats} />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('displays most studied subject', () => {
      render(<StatsCards stats={mockStats} />)
      expect(screen.getByText('Matemática')).toBeInTheDocument()
    })

    it('displays N/A when no subject is available', () => {
      const statsWithNoSubject: StudyStats = {
        ...mockStats,
        mostStudiedSubject: null,
      }
      render(<StatsCards stats={statsWithNoSubject} />)
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  describe('responsive layout', () => {
    it('renders with responsive grid classes', () => {
      const { container } = render(<StatsCards stats={mockStats} />)
      const grid = container.firstChild as HTMLElement

      expect(grid).toHaveClass('grid')
      expect(grid).toHaveClass('grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-4')
    })

    it('renders with responsive gap classes', () => {
      const { container } = render(<StatsCards stats={mockStats} />)
      const grid = container.firstChild as HTMLElement

      expect(grid).toHaveClass('gap-2')
      expect(grid).toHaveClass('sm:gap-4')
    })

    it('renders cards with responsive padding', () => {
      const { container } = render(<StatsCards stats={mockStats} />)
      const cardContent = container.querySelector('[class*="CardContent"]') ||
                          container.querySelector('.p-3')

      expect(cardContent).toHaveClass('p-3')
      expect(cardContent).toHaveClass('sm:p-6')
    })

    it('renders icons with responsive sizes', () => {
      render(<StatsCards stats={mockStats} />)
      const icons = document.querySelectorAll('svg')

      icons.forEach(icon => {
        expect(icon).toHaveClass('h-4', 'w-4')
        expect(icon).toHaveClass('sm:h-6', 'sm:w-6')
      })
    })

    it('renders text with responsive font sizes', () => {
      render(<StatsCards stats={mockStats} />)

      const titles = screen.getAllByText(/Tempo Total|Dias Estudados|Média por Dia|Matéria Principal/)
      titles.forEach(title => {
        expect(title).toHaveClass('text-xs')
        expect(title).toHaveClass('sm:text-sm')
      })
    })
  })

  describe('accessibility', () => {
    it('renders all icons with proper styling', () => {
      render(<StatsCards stats={mockStats} />)
      const icons = document.querySelectorAll('svg')

      expect(icons.length).toBe(4)
    })

    it('values are visible', () => {
      render(<StatsCards stats={mockStats} />)

      expect(screen.getByText('3h')).toBeVisible()
      expect(screen.getByText('5')).toBeVisible()
      expect(screen.getByText('Matemática')).toBeVisible()
    })
  })
})
