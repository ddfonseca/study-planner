import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DailyChart } from './DailyChart'
import type { ChartData } from 'chart.js'

// Mock chart.js to avoid canvas issues in tests
vi.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="bar-chart">Mocked Bar Chart</div>,
}))

// Mock useIsMobile hook
const mockIsMobile = vi.fn()
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => mockIsMobile(),
}))

const mockData: ChartData<'bar'> = {
  labels: ['2024-01-01', '2024-01-02', '2024-01-03'],
  datasets: [{
    data: [60, 90, 45],
    backgroundColor: '#3b82f6',
  }],
}

const emptyData: ChartData<'bar'> = {
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: '#3b82f6',
  }],
}

describe('DailyChart', () => {
  beforeEach(() => {
    mockIsMobile.mockReturnValue(false)
  })

  describe('rendering', () => {
    it('renders the chart title', () => {
      render(<DailyChart data={mockData} />)
      expect(screen.getByText('Tempo por Dia')).toBeInTheDocument()
    })

    it('renders the bar chart when data is available', () => {
      render(<DailyChart data={mockData} />)
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
    })

    it('renders empty state message when no data', () => {
      render(<DailyChart data={emptyData} />)
      expect(screen.getByText('Nenhum dado disponível')).toBeInTheDocument()
    })
  })

  describe('responsive layout', () => {
    it('renders card header with responsive padding', () => {
      const { container } = render(<DailyChart data={mockData} />)
      // CardHeader has base classes plus responsive overrides
      const header = container.querySelector('.pb-2.sm\\:pb-6')

      expect(header).toBeInTheDocument()
    })

    it('renders card content with responsive padding', () => {
      const { container } = render(<DailyChart data={mockData} />)
      // CardContent has responsive padding classes
      const content = container.querySelector('.px-3.sm\\:px-6')

      expect(content).toBeInTheDocument()
    })

    it('renders title with responsive font size', () => {
      render(<DailyChart data={mockData} />)
      const title = screen.getByText('Tempo por Dia')

      expect(title).toHaveClass('text-base')
      expect(title).toHaveClass('sm:text-lg')
    })

    it('renders chart container with responsive height', () => {
      const { container } = render(<DailyChart data={mockData} />)
      const chartContainer = container.querySelector('[class*="h-\\[280px\\]"]')

      expect(chartContainer).toBeInTheDocument()
      expect(chartContainer).toHaveClass('sm:h-[300px]')
    })
  })

  describe('mobile behavior', () => {
    it('uses isMobile hook for responsive chart options', () => {
      mockIsMobile.mockReturnValue(true)
      render(<DailyChart data={mockData} />)

      // The hook should be called
      expect(mockIsMobile).toHaveBeenCalled()
    })
  })

  describe('empty state responsive', () => {
    it('renders empty state with responsive height', () => {
      const { container } = render(<DailyChart data={emptyData} />)
      const emptyContainer = container.querySelector('[class*="h-\\[280px\\]"][class*="flex"]')

      expect(emptyContainer).toBeInTheDocument()
      expect(emptyContainer).toHaveClass('sm:h-[300px]')
    })

    it('renders empty text with responsive font size', () => {
      render(<DailyChart data={emptyData} />)
      const emptyText = screen.getByText('Nenhum dado disponível')

      expect(emptyText).toHaveClass('text-sm')
    })
  })
})
