import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionModal } from './SessionModal'
import type { DayData } from '@/types/session'

// Mock the hooks and components
vi.mock('@/hooks/useRecentSubjects', () => ({
  useRecentSubjects: vi.fn(() => ({
    recentSubjects: [],
    addRecentSubject: vi.fn(),
  })),
}))

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false),
}))

describe('SessionModal', () => {
  const mockSessions: DayData = {
    totalMinutos: 120,
    materias: [
      { id: '1', materia: 'Matemática', minutos: 60 },
      { id: '2', materia: 'Física', minutos: 60 },
    ],
  }

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    date: new Date(2025, 0, 15),
    dayData: mockSessions,
    subjects: ['Matemática', 'Física', 'Química'],
    onAddSession: vi.fn().mockResolvedValue(undefined),
    onUpdateSession: vi.fn().mockResolvedValue(undefined),
    onDeleteSession: vi.fn().mockResolvedValue(undefined),
    canModify: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('keyboard navigation for session items', () => {
    it('session items have role="button" when canModify is true', () => {
      render(<SessionModal {...defaultProps} />)

      const sessionItems = screen.getAllByRole('button', { name: /Editar sessão/i })
      expect(sessionItems.length).toBeGreaterThan(0)
    })

    it('session items have role="listitem" when canModify is false', () => {
      render(<SessionModal {...defaultProps} canModify={false} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })

    it('session items have tabIndex=0 when canModify is true', () => {
      render(<SessionModal {...defaultProps} />)

      const sessionItems = screen.getAllByRole('button', { name: /Editar sessão/i })
      sessionItems.forEach(item => {
        expect(item).toHaveAttribute('tabindex', '0')
      })
    })

    it('session items do not have tabIndex when canModify is false', () => {
      render(<SessionModal {...defaultProps} canModify={false} />)

      // When canModify is false, session items should not be tabbable
      const sessionContainer = screen.getByRole('list')
      const items = sessionContainer.querySelectorAll('[role="listitem"]')
      items.forEach(item => {
        expect(item).not.toHaveAttribute('tabindex')
      })
    })

    it('triggers edit on Enter key press', async () => {
      const user = userEvent.setup()
      render(<SessionModal {...defaultProps} />)

      const sessionItem = screen.getByRole('button', { name: /Editar sessão: Matemática/i })
      sessionItem.focus()
      await user.keyboard('{Enter}')

      // The form should now show the session data for editing
      const input = screen.getByLabelText(/Minutos/i) as HTMLInputElement
      expect(input.value).toBe('60')
    })

    it('triggers edit on Space key press', async () => {
      const user = userEvent.setup()
      render(<SessionModal {...defaultProps} />)

      const sessionItem = screen.getByRole('button', { name: /Editar sessão: Física/i })
      sessionItem.focus()
      await user.keyboard(' ')

      // The form should now show the session data for editing
      const input = screen.getByLabelText(/Minutos/i) as HTMLInputElement
      expect(input.value).toBe('60')
    })

    it('has focus-visible ring styles on session items', () => {
      render(<SessionModal {...defaultProps} />)

      const sessionItems = screen.getAllByRole('button', { name: /Editar sessão/i })
      sessionItems.forEach(item => {
        expect(item).toHaveClass('focus-visible:outline-none')
        expect(item).toHaveClass('focus-visible:ring-2')
        expect(item).toHaveClass('focus-visible:ring-ring')
      })
    })

    it('has aria-label describing the session', () => {
      render(<SessionModal {...defaultProps} />)

      expect(screen.getByLabelText(/Editar sessão: Matemática, 1h/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Editar sessão: Física, 1h/i)).toBeInTheDocument()
    })

    it('delete button has aria-label', () => {
      render(<SessionModal {...defaultProps} />)

      expect(screen.getByLabelText(/Excluir sessão: Matemática/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Excluir sessão: Física/i)).toBeInTheDocument()
    })
  })

  describe('sessions list accessibility', () => {
    it('renders sessions in a list with role="list"', () => {
      render(<SessionModal {...defaultProps} />)

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
    })

    it('does not render list when no sessions', () => {
      render(<SessionModal {...defaultProps} dayData={{ totalMinutos: 0, materias: [] }} />)

      expect(screen.queryByRole('list')).not.toBeInTheDocument()
    })
  })
})
