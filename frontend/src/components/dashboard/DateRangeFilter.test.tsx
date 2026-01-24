import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangeFilter } from './DateRangeFilter'

describe('DateRangeFilter', () => {
  const defaultProps = {
    currentDays: 7,
    onSelectPreset: vi.fn(),
  }

  describe('rendering', () => {
    it('renders all preset buttons', () => {
      render(<DateRangeFilter {...defaultProps} />)

      expect(screen.getByText('7 dias')).toBeInTheDocument()
      expect(screen.getByText('14 dias')).toBeInTheDocument()
      expect(screen.getByText('30 dias')).toBeInTheDocument()
      expect(screen.getByText('90 dias')).toBeInTheDocument()
    })

    it('renders period label', () => {
      render(<DateRangeFilter {...defaultProps} />)
      expect(screen.getByText('Período:')).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('calls onSelectPreset when a button is clicked', async () => {
      const user = userEvent.setup()
      const onSelectPreset = vi.fn()

      render(<DateRangeFilter {...defaultProps} onSelectPreset={onSelectPreset} />)

      await user.click(screen.getByText('30 dias'))

      expect(onSelectPreset).toHaveBeenCalledWith(30)
    })
  })

  describe('accessibility', () => {
    it('has aria-label on filter buttons', () => {
      render(<DateRangeFilter {...defaultProps} />)

      expect(screen.getByLabelText('Filtrar últimos 7 dias')).toBeInTheDocument()
      expect(screen.getByLabelText('Filtrar últimos 14 dias')).toBeInTheDocument()
      expect(screen.getByLabelText('Filtrar últimos 30 dias')).toBeInTheDocument()
      expect(screen.getByLabelText('Filtrar últimos 90 dias')).toBeInTheDocument()
    })

    it('has aria-current on the active filter button', () => {
      render(<DateRangeFilter {...defaultProps} currentDays={7} />)

      const activeButton = screen.getByLabelText('Filtrar últimos 7 dias')
      const inactiveButton = screen.getByLabelText('Filtrar últimos 30 dias')

      expect(activeButton).toHaveAttribute('aria-current', 'true')
      expect(inactiveButton).not.toHaveAttribute('aria-current')
    })

    it('has role="group" with aria-labelledby on button container', () => {
      render(<DateRangeFilter {...defaultProps} />)

      const group = screen.getByRole('group')
      expect(group).toHaveAttribute('aria-labelledby', 'date-range-label')
    })

    it('calendar icon is hidden from screen readers', () => {
      const { container } = render(<DateRangeFilter {...defaultProps} />)

      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
