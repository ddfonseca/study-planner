import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UpgradePrompt, LimitIndicator } from './UpgradePrompt'
import { FEATURES } from '@/hooks/useSubscriptionLimits'

// Mock the subscription limits hook
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  FEATURES: {
    MAX_CYCLES: 'max_cycles',
    MAX_WORKSPACES: 'max_workspaces',
    MAX_SESSIONS_PER_DAY: 'max_sessions_per_day',
    EXPORT_DATA: 'export_data',
    SHARED_PLANS: 'shared_plans',
    HISTORY_DAYS: 'history_days',
  },
  useCanUseFeature: vi.fn((feature, currentUsage) => ({
    canUse: currentUsage < 3,
    limit: 3,
    isUnlimited: false,
    percentUsed: (currentUsage / 3) * 100,
  })),
}))

describe('UpgradePrompt', () => {
  const defaultProps = {
    feature: FEATURES.MAX_WORKSPACES,
    currentUsage: 5,
    onUpgradeClick: vi.fn(),
  }

  describe('inline variant', () => {
    it('renders inline variant with aria-label on button', () => {
      render(<UpgradePrompt {...defaultProps} variant="inline" />)

      const button = screen.getByRole('button', { name: /fazer upgrade para aumentar limite/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe('banner variant', () => {
    it('renders banner variant with aria-label on upgrade button', () => {
      render(<UpgradePrompt {...defaultProps} variant="banner" />)

      const button = screen.getByRole('button', { name: /fazer upgrade para aumentar limite/i })
      expect(button).toBeInTheDocument()
    })

    it('icons are hidden from screen readers in banner variant', () => {
      render(<UpgradePrompt {...defaultProps} variant="banner" />)

      const icons = document.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('card variant', () => {
    it('renders card variant with aria-label on button', () => {
      render(<UpgradePrompt {...defaultProps} variant="card" />)

      const button = screen.getByRole('button', { name: /ver planos de upgrade disponíveis/i })
      expect(button).toBeInTheDocument()
    })

    it('icons are hidden from screen readers in card variant', () => {
      render(<UpgradePrompt {...defaultProps} variant="card" />)

      const icons = document.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })
})

describe('LimitIndicator', () => {
  it('renders usage count', () => {
    render(<LimitIndicator feature={FEATURES.MAX_WORKSPACES} currentUsage={2} />)
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })
})
