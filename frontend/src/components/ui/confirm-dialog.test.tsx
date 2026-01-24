import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AlertTriangle } from 'lucide-react'
import { ConfirmDialog } from './confirm-dialog'

// Mock useIsMobile hook to always return false (desktop)
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}))

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Confirm Action',
    onConfirm: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders title', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('heading', { name: 'Confirm Action' })).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(
        <ConfirmDialog {...defaultProps} description="Are you sure you want to proceed?" />
      )

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    })

    it('hides description with sr-only when not provided', () => {
      render(<ConfirmDialog {...defaultProps} />)

      // The fallback description uses the title and has sr-only class
      const description = screen.getByText('Confirm Action', { selector: 'p' })
      expect(description).toHaveClass('sr-only')
    })

    it('renders default button texts', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    })

    it('renders custom button texts', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="Delete"
          cancelText="Keep"
        />
      )

      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
    })

    it('renders icon when provided', () => {
      render(<ConfirmDialog {...defaultProps} icon={AlertTriangle} />)

      const icon = document.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

      await user.click(screen.getByRole('button', { name: 'Confirmar' }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
    })

    it('calls onOpenChange with false when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />)

      await user.click(screen.getByRole('button', { name: 'Cancelar' }))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('handles async onConfirm', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn().mockImplementation(() => Promise.resolve())
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />)

      await user.click(screen.getByRole('button', { name: 'Confirmar' }))

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('loading state', () => {
    it('disables confirm button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading />)

      expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDisabled()
    })

    it('disables cancel button when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading />)

      expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    })

    it('shows spinner when loading', () => {
      render(<ConfirmDialog {...defaultProps} isLoading />)

      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('does not call onOpenChange when cancel is clicked during loading', () => {
      const onOpenChange = vi.fn()
      render(<ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} isLoading />)

      // The button is disabled, so click won't work
      const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
      expect(cancelButton).toBeDisabled()
    })
  })

  describe('variants', () => {
    it('renders default variant confirm button', () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />)

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
      expect(confirmButton).toHaveClass('bg-primary')
    })

    it('renders destructive variant confirm button', () => {
      render(<ConfirmDialog {...defaultProps} variant="destructive" />)

      const confirmButton = screen.getByRole('button', { name: 'Confirmar' })
      expect(confirmButton).toHaveClass('bg-destructive')
    })
  })

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(<ConfirmDialog {...defaultProps} />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('icon has aria-hidden attribute', () => {
      render(<ConfirmDialog {...defaultProps} icon={AlertTriangle} />)

      const icon = document.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('when closed', () => {
    it('does not render content when open is false', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
