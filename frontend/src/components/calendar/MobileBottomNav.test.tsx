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
    it('renders navigation element with aria-label', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()
      expect(nav).toHaveAttribute('aria-label', 'Navegação principal')
    })

    it('renders tablist role for tab container', () => {
      render(<MobileBottomNav {...defaultProps} />)
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('renders tabs with role="tab"', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const tabs = screen.getAllByRole('tab')
      expect(tabs.length).toBe(4)
    })

    it('has aria-label for each tab button', () => {
      render(<MobileBottomNav {...defaultProps} />)

      expect(screen.getByLabelText('Dia')).toBeInTheDocument()
      expect(screen.getByLabelText('Ciclo')).toBeInTheDocument()
      expect(screen.getByLabelText('Progresso')).toBeInTheDocument()
      expect(screen.getByLabelText('Timer')).toBeInTheDocument()
    })

    it('has aria-selected="true" for active tab', () => {
      render(<MobileBottomNav {...defaultProps} activeTab="timer" />)

      const timerButton = screen.getByLabelText('Timer')
      expect(timerButton).toHaveAttribute('aria-selected', 'true')
    })

    it('has aria-selected="false" for inactive tabs', () => {
      render(<MobileBottomNav {...defaultProps} activeTab="calendar" />)

      const timerButton = screen.getByLabelText('Timer')
      expect(timerButton).toHaveAttribute('aria-selected', 'false')
    })

    it('has tabIndex=0 for active tab and tabIndex=-1 for inactive tabs', () => {
      render(<MobileBottomNav {...defaultProps} activeTab="calendar" />)

      const diaButton = screen.getByLabelText('Dia')
      const timerButton = screen.getByLabelText('Timer')

      expect(diaButton).toHaveAttribute('tabindex', '0')
      expect(timerButton).toHaveAttribute('tabindex', '-1')
    })
  })

  describe('keyboard navigation', () => {
    it('moves to next tab on ArrowRight', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} onTabChange={onTabChange} />)

      const diaButton = screen.getByLabelText('Dia')
      diaButton.focus()
      await user.keyboard('{ArrowRight}')

      expect(onTabChange).toHaveBeenCalledWith('cycle')
    })

    it('moves to previous tab on ArrowLeft', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} activeTab="cycle" onTabChange={onTabChange} />)

      const cicloButton = screen.getByLabelText('Ciclo')
      cicloButton.focus()
      await user.keyboard('{ArrowLeft}')

      expect(onTabChange).toHaveBeenCalledWith('calendar')
    })

    it('wraps to first tab when pressing ArrowRight on last tab', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} activeTab="timer" onTabChange={onTabChange} />)

      const timerButton = screen.getByLabelText('Timer')
      timerButton.focus()
      await user.keyboard('{ArrowRight}')

      expect(onTabChange).toHaveBeenCalledWith('calendar')
    })

    it('wraps to last tab when pressing ArrowLeft on first tab', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} activeTab="calendar" onTabChange={onTabChange} />)

      const diaButton = screen.getByLabelText('Dia')
      diaButton.focus()
      await user.keyboard('{ArrowLeft}')

      expect(onTabChange).toHaveBeenCalledWith('timer')
    })

    it('moves to first tab on Home key', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} activeTab="timer" onTabChange={onTabChange} />)

      const timerButton = screen.getByLabelText('Timer')
      timerButton.focus()
      await user.keyboard('{Home}')

      expect(onTabChange).toHaveBeenCalledWith('calendar')
    })

    it('moves to last tab on End key', async () => {
      const user = userEvent.setup()
      const onTabChange = vi.fn()

      render(<MobileBottomNav {...defaultProps} activeTab="calendar" onTabChange={onTabChange} />)

      const diaButton = screen.getByLabelText('Dia')
      diaButton.focus()
      await user.keyboard('{End}')

      expect(onTabChange).toHaveBeenCalledWith('timer')
    })

    it('has focus-visible ring styles', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const tabs = screen.getAllByRole('tab')

      tabs.forEach(tab => {
        expect(tab).toHaveClass('focus-visible:outline-none')
        expect(tab).toHaveClass('focus-visible:ring-2')
        expect(tab).toHaveClass('focus-visible:ring-ring')
      })
    })
  })

  describe('touch-friendly features', () => {
    it('has touch-action-manipulation class on tabs', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const tabs = screen.getAllByRole('tab')

      tabs.forEach(tab => {
        expect(tab).toHaveClass('touch-action-manipulation')
      })
    })

    it('has select-none class to prevent text selection', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const tabs = screen.getAllByRole('tab')

      tabs.forEach(tab => {
        expect(tab).toHaveClass('select-none')
      })
    })

    it('has active state classes for touch feedback', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const tabs = screen.getAllByRole('tab')

      tabs.forEach(tab => {
        expect(tab).toHaveClass('active:scale-95')
        expect(tab).toHaveClass('active:opacity-80')
      })
    })

    it('has minimum touch target height of 56px', () => {
      render(<MobileBottomNav {...defaultProps} />)
      const tabs = screen.getAllByRole('tab')

      tabs.forEach(tab => {
        expect(tab).toHaveClass('min-h-[56px]')
      })
    })
  })
})
