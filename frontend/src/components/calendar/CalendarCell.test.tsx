import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarCell } from './CalendarCell'
import type { DayData, CellIntensity } from '@/types/session'

// Mock the config store
vi.mock('@/store/configStore', () => ({
  useConfigStore: vi.fn((selector) => {
    const state = { heatmapStyle: 'gradient' as const }
    return selector(state)
  }),
}))

describe('CalendarCell', () => {
  const defaultProps = {
    date: new Date(2025, 0, 15), // January 15, 2025 (using local timezone)
    currentMonth: 0, // January
    dayData: {
      totalMinutos: 0,
      materias: [],
    } as DayData,
    intensity: 0 as CellIntensity,
    onClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('responsive layout', () => {
    it('renders with responsive height classes', () => {
      const { container } = render(<CalendarCell {...defaultProps} />)
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveClass('h-[80px]')
      expect(cell).toHaveClass('sm:h-[100px]')
    })

    it('renders with responsive padding classes', () => {
      const { container } = render(<CalendarCell {...defaultProps} />)
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveClass('p-1.5')
      expect(cell).toHaveClass('sm:p-2')
    })

    it('renders sessions list with responsive max-height', () => {
      const propsWithSessions = {
        ...defaultProps,
        dayData: {
          totalMinutos: 60,
          materias: [
            { id: '1', materia: 'Math', minutos: 30 },
            { id: '2', materia: 'Science', minutos: 30 },
          ],
        },
        intensity: 1 as CellIntensity,
      }

      const { container } = render(<CalendarCell {...propsWithSessions} />)
      const sessionsList = container.querySelector('.space-y-0\\.5')

      expect(sessionsList).toHaveClass('max-h-[35px]')
      expect(sessionsList).toHaveClass('sm:max-h-[55px]')
    })
  })

  describe('rendering', () => {
    it('displays the day number', () => {
      render(<CalendarCell {...defaultProps} />)
      expect(screen.getByText('15')).toBeInTheDocument()
    })

    it('calls onClick when cell is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<CalendarCell {...defaultProps} onClick={onClick} />)

      await user.click(screen.getByText('15').closest('div')!)

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('shows reduced opacity for days not in current month', () => {
      const { container } = render(
        <CalendarCell
          {...defaultProps}
          date={new Date(2024, 11, 31)} // December 31, 2024 (local timezone)
          currentMonth={0} // January
        />
      )
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveClass('opacity-50')
    })

    it('displays session list when there are sessions', () => {
      const propsWithSessions = {
        ...defaultProps,
        dayData: {
          totalMinutos: 60,
          materias: [
            { id: '1', materia: 'Matemática', minutos: 60 },
          ],
        },
        intensity: 1 as CellIntensity,
      }

      render(<CalendarCell {...propsWithSessions} />)
      expect(screen.getByText('Matemática')).toBeInTheDocument()
    })

    it('shows "+N mais" when there are more than 2 sessions', () => {
      const propsWithManySessions = {
        ...defaultProps,
        dayData: {
          totalMinutos: 180,
          materias: [
            { id: '1', materia: 'Math', minutos: 60 },
            { id: '2', materia: 'Science', minutos: 60 },
            { id: '3', materia: 'History', minutos: 60 },
          ],
        },
        intensity: 2 as CellIntensity,
      }

      render(<CalendarCell {...propsWithManySessions} />)
      expect(screen.getByText('+1 mais')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has cursor pointer for clickable interaction', () => {
      const { container } = render(<CalendarCell {...defaultProps} />)
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveClass('cursor-pointer')
    })

    it('has role="button" for screen readers', () => {
      render(<CalendarCell {...defaultProps} />)
      const cell = screen.getByRole('button')

      expect(cell).toBeInTheDocument()
    })

    it('has tabIndex for keyboard navigation', () => {
      const { container } = render(<CalendarCell {...defaultProps} />)
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveAttribute('tabindex', '0')
    })

    it('calls onClick when Enter key is pressed', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<CalendarCell {...defaultProps} onClick={onClick} />)

      const cell = screen.getByRole('button')
      cell.focus()
      await user.keyboard('{Enter}')

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('calls onClick when Space key is pressed', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<CalendarCell {...defaultProps} onClick={onClick} />)

      const cell = screen.getByRole('button')
      cell.focus()
      await user.keyboard(' ')

      expect(onClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('touch-friendly features', () => {
    it('has touch-action-manipulation class for better touch handling', () => {
      const { container } = render(<CalendarCell {...defaultProps} />)
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveClass('touch-action-manipulation')
    })

    it('has select-none class to prevent text selection on touch', () => {
      const { container } = render(<CalendarCell {...defaultProps} />)
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveClass('select-none')
    })

    it('has active state classes for touch feedback', () => {
      const { container } = render(<CalendarCell {...defaultProps} />)
      const cell = container.firstChild as HTMLElement

      expect(cell).toHaveClass('active:scale-[0.98]')
      expect(cell).toHaveClass('active:opacity-90')
    })
  })
})
