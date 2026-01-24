import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog'

describe('Dialog', () => {
  describe('DialogContent responsive layout', () => {
    it('renders with responsive width classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const dialogContent = screen.getByRole('dialog')
      expect(dialogContent).toHaveClass('w-[calc(100%-2rem)]')
      expect(dialogContent).toHaveClass('sm:w-full')
    })

    it('renders with responsive gap classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const dialogContent = screen.getByRole('dialog')
      expect(dialogContent).toHaveClass('gap-3')
      expect(dialogContent).toHaveClass('sm:gap-4')
    })

    it('renders with responsive padding classes', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const dialogContent = screen.getByRole('dialog')
      expect(dialogContent).toHaveClass('p-4')
      expect(dialogContent).toHaveClass('sm:p-6')
    })
  })

  describe('DialogHeader responsive layout', () => {
    it('renders with responsive text alignment', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogHeader data-testid="dialog-header">
              <DialogTitle>Test Title</DialogTitle>
            </DialogHeader>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      const header = screen.getByTestId('dialog-header')
      expect(header).toHaveClass('text-center')
      expect(header).toHaveClass('sm:text-left')
    })
  })

  describe('DialogFooter responsive layout', () => {
    it('renders with responsive flex direction', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Test</DialogTitle>
            <DialogDescription>Description</DialogDescription>
            <DialogFooter data-testid="dialog-footer">
              <button>Cancel</button>
              <button>Confirm</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )

      const footer = screen.getByTestId('dialog-footer')
      expect(footer).toHaveClass('flex-col-reverse')
      expect(footer).toHaveClass('sm:flex-row')
    })
  })

  describe('rendering', () => {
    it('renders dialog title', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>My Dialog Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('My Dialog Title')).toBeInTheDocument()
    })

    it('renders dialog description', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>My description text</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByText('My description text')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has dialog role', () => {
      render(
        <Dialog open>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })
})
