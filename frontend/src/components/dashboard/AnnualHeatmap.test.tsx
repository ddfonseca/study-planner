import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnnualHeatmap } from './AnnualHeatmap'
import type { SessionsMap } from '@/types/session'

// Mock the config store
vi.mock('@/store/configStore', () => ({
  useConfigStore: vi.fn((selector) => {
    const state = { weekStartDay: 0, heatmapStyle: 'gradient' as const }
    return selector(state)
  }),
}))

describe('AnnualHeatmap', () => {
  const emptySessions: SessionsMap = {}

  describe('responsive layout', () => {
    it('renders with responsive min-width classes', () => {
      const { container } = render(<AnnualHeatmap sessions={emptySessions} />)
      const heatmapContainer = container.querySelector('.min-w-\\[320px\\]')

      expect(heatmapContainer).toHaveClass('min-w-[320px]')
      expect(heatmapContainer).toHaveClass('sm:min-w-[450px]')
      expect(heatmapContainer).toHaveClass('lg:min-w-[600px]')
    })

    it('renders with responsive padding in CardContent', () => {
      const { container } = render(<AnnualHeatmap sessions={emptySessions} />)
      const cardContent = container.querySelector('.px-3')

      expect(cardContent).toHaveClass('px-3')
      expect(cardContent).toHaveClass('sm:px-6')
    })

    it('renders title with responsive text size', () => {
      const { container } = render(<AnnualHeatmap sessions={emptySessions} />)
      const title = container.querySelector('.text-xs')

      expect(title).toHaveClass('text-xs')
      expect(title).toHaveClass('sm:text-sm')
    })

    it('renders calendar icon with responsive size', () => {
      render(<AnnualHeatmap sessions={emptySessions} />)
      const icon = document.querySelector('svg')

      expect(icon).toHaveClass('h-3.5')
      expect(icon).toHaveClass('w-3.5')
      expect(icon).toHaveClass('sm:h-4')
      expect(icon).toHaveClass('sm:w-4')
    })
  })

  describe('rendering', () => {
    it('renders the card title', () => {
      render(<AnnualHeatmap sessions={emptySessions} />)
      expect(screen.getByText('Atividade do Ano')).toBeInTheDocument()
    })

    it('displays the current year', () => {
      render(<AnnualHeatmap sessions={emptySessions} />)
      const currentYear = new Date().getFullYear().toString()
      expect(screen.getByText(currentYear)).toBeInTheDocument()
    })

    it('renders month labels', () => {
      render(<AnnualHeatmap sessions={emptySessions} />)
      expect(screen.getByText('Jan')).toBeInTheDocument()
      expect(screen.getByText('Fev')).toBeInTheDocument()
      expect(screen.getByText('Mar')).toBeInTheDocument()
    })

    it('renders legend with "Menos" and "Mais" labels', () => {
      render(<AnnualHeatmap sessions={emptySessions} />)
      expect(screen.getByText('Menos')).toBeInTheDocument()
      expect(screen.getByText('Mais')).toBeInTheDocument()
    })
  })

  describe('horizontal scroll', () => {
    it('has overflow-x-auto for horizontal scrolling on mobile', () => {
      const { container } = render(<AnnualHeatmap sessions={emptySessions} />)
      const scrollContainer = container.querySelector('.overflow-x-auto')

      expect(scrollContainer).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('renders within a Card component', () => {
      const { container } = render(<AnnualHeatmap sessions={emptySessions} />)
      const card = container.firstChild

      expect(card).toBeInTheDocument()
    })
  })
})
