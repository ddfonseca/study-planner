import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyncIndicator } from './sync-indicator'

describe('SyncIndicator', () => {
  describe('rendering', () => {
    it('renders with default idle state', () => {
      render(<SyncIndicator />)
      const indicator = screen.getByRole('status')
      expect(indicator).toBeInTheDocument()
      expect(indicator).toHaveAttribute('aria-label', 'Sync status: Synced')
    })

    it('renders with label by default', () => {
      render(<SyncIndicator />)
      expect(screen.getByText('Synced')).toBeInTheDocument()
    })

    it('renders without label when showLabel is false', () => {
      render(<SyncIndicator showLabel={false} />)
      expect(screen.queryByText('Synced')).not.toBeInTheDocument()
    })
  })

  describe('states', () => {
    it('renders idle state correctly', () => {
      render(<SyncIndicator state="idle" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-muted-foreground')
      expect(indicator).toHaveAttribute('aria-label', 'Sync status: Synced')
      expect(screen.getByText('Synced')).toBeInTheDocument()
    })

    it('renders syncing state correctly', () => {
      render(<SyncIndicator state="syncing" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-primary')
      expect(indicator).toHaveAttribute('aria-label', 'Sync status: Syncing...')
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })

    it('renders success state correctly', () => {
      render(<SyncIndicator state="success" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-green-600')
      expect(indicator).toHaveAttribute('aria-label', 'Sync status: Saved')
      expect(screen.getByText('Saved')).toBeInTheDocument()
    })

    it('renders error state correctly', () => {
      render(<SyncIndicator state="error" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-destructive')
      expect(indicator).toHaveAttribute('aria-label', 'Sync status: Sync failed')
      expect(screen.getByText('Sync failed')).toBeInTheDocument()
    })

    it('syncing state has spinning animation', () => {
      render(<SyncIndicator state="syncing" />)
      const icon = screen.getByRole('status').querySelector('svg')

      expect(icon).toHaveClass('animate-spin')
    })
  })

  describe('sizes', () => {
    it('has default size', () => {
      render(<SyncIndicator size="default" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-sm')
    })

    it('has small size', () => {
      render(<SyncIndicator size="sm" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-xs')
    })

    it('has large size', () => {
      render(<SyncIndicator size="lg" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-base')
    })
  })

  describe('custom labels', () => {
    it('accepts custom labels', () => {
      render(
        <SyncIndicator
          state="idle"
          labels={{ idle: 'All changes saved' }}
        />
      )

      expect(screen.getByText('All changes saved')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Sync status: All changes saved')
    })

    it('merges custom labels with defaults', () => {
      const { rerender } = render(
        <SyncIndicator
          state="idle"
          labels={{ idle: 'Custom idle' }}
        />
      )
      expect(screen.getByText('Custom idle')).toBeInTheDocument()

      rerender(
        <SyncIndicator
          state="syncing"
          labels={{ idle: 'Custom idle' }}
        />
      )
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(<SyncIndicator />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has aria-live="polite" for status updates', () => {
      render(<SyncIndicator />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveAttribute('aria-live', 'polite')
    })

    it('has descriptive aria-label for each state', () => {
      const { rerender } = render(<SyncIndicator state="idle" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Sync status: Synced')

      rerender(<SyncIndicator state="syncing" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Sync status: Syncing...')

      rerender(<SyncIndicator state="success" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Sync status: Saved')

      rerender(<SyncIndicator state="error" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Sync status: Sync failed')
    })

    it('icons are hidden from screen readers', () => {
      render(<SyncIndicator state="idle" />)
      const icon = screen.getByRole('status').querySelector('svg')

      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('className prop', () => {
    it('accepts additional className', () => {
      render(<SyncIndicator className="custom-class" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('custom-class')
    })

    it('merges className with variant classes', () => {
      render(<SyncIndicator state="error" className="my-4" />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('text-destructive')
      expect(indicator).toHaveClass('my-4')
    })
  })

  describe('transitions', () => {
    it('has transition classes for smooth state changes', () => {
      render(<SyncIndicator />)
      const indicator = screen.getByRole('status')

      expect(indicator).toHaveClass('transition-all')
      expect(indicator).toHaveClass('duration-200')
    })
  })
})
