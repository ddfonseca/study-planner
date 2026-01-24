import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileBottomNav } from './MobileBottomNav'

// Mock the feature badges store
vi.mock('@/store/featureBadgesStore', () => ({
  useFeatureBadgesStore: vi.fn(() => ({
    isFeatureNew: vi.fn(() => false),
    markFeatureSeen: vi.fn(),
  })),
}))

describe('MobileBottomNav', () => {
  const defaultProps = {
    activeTab: 'calendar' as const,
    onTabChange: vi.fn(),
    timerActive: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('responsive layout', () => {
    it('renders with responsive max-width classes', () => {
      const { container } = render(<MobileBottomNav {...defaultProps} />)
      const innerContainer = container.querySelector('.max-w-lg')

      expect(innerContainer).toHaveClass('max-w-lg')
      expect(innerContainer).toHaveClass('w-full')
    })

    it('renders with responsive padding classes', () => {
      const { container } = render(<MobileBottomNav {...defaultProps} />)
      const innerContainer = container.querySelector('.px-2')

      expect(innerContainer).toHaveClass('px-2')
      expect(innerContainer).toHaveClass('sm:px-4')
    })
  })

  describe('rendering', () => {
    it('renders all navigation tabs', () => {
      render(<MobileBottomNav {...defaultProps} />)

      expect(screen.getByText('Dia')).toBeInTheDocument()
      expect(screen.getByText('Ciclo')).toBeInTheDocument()
      expect(screen.getByText('Progresso')).toBeInTheDocument()
      expect(screen.getByText('Timer')).toBeInTheDocument()
    })

    it('highlights the active tab', () => {
      render(<MobileBottomNav {...defaultProps} activeTab="timer" />)

      const timerButton = screen.getByText('Timer').closest('button')
      expect(timerButton).toHaveClass('text-primary')
    })

    it('renders non-active tabs with muted color', () => {
      render(<MobileBottomNav {...defaultProps} activeTab="calendar" />)

      const timerButton = screen.getByText('Timer').closest('button')
      expect(timerButton).toHaveClass('text-muted-foreground')
    })
  })

  describe('interactions', () => {
    it('calls onTabChange when tab is clicked', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} onTabChange={onTabChange} />)

      await user.click(screen.getByText('Timer'))

      expect(onTabChange).toHaveBeenCalledWith('timer')
    })

    it('calls onTabChange with correct tab id for each tab', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} onTabChange={onTabChange} />)

      await user.click(screen.getByText('Ciclo'))
      expect(onTabChange).toHaveBeenCalledWith('cycle')

      await user.click(screen.getByText('Progresso'))
      expect(onTabChange).toHaveBeenCalledWith('progress')
    })
  })

  describe('timer indicator', () => {
    it('shows pulse indicator when timer is active and not on timer tab', () => {
      const { container } = render(
        <MobileBottomNav {...defaultProps} activeTab="calendar" timerActive={true} />
      )

      const pulseIndicator = container.querySelector('.animate-pulse')
      expect(pulseIndicator).toBeInTheDocument()
    })

    it('does not show pulse indicator when on timer tab', () => {
      const { container } = render(
        <MobileBottomNav {...defaultProps} activeTab="timer" timerActive={true} />
      )

      const pulseIndicator = container.querySelector('.animate-pulse')
      expect(pulseIndicator).not.toBeInTheDocument()
    })

    it('does not show pulse indicator when timer is not active', () => {
      const { container } = render(
        <MobileBottomNav {...defaultProps} activeTab="calendar" timerActive={false} />
      )

      const pulseIndicator = container.querySelector('.animate-pulse')
      expect(pulseIndicator).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('renders navigation element', () => {
      render(<MobileBottomNav {...defaultProps} />)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('renders buttons for each tab', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(4)
    })
  })
})
