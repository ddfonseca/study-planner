import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuickAddSession } from './QuickAddSession'

// Mock the recent subjects hook
vi.mock('@/hooks/useRecentSubjects', () => ({
  useRecentSubjects: vi.fn(() => ({
    recentSubjects: [],
    addRecentSubject: vi.fn(),
  })),
}))

describe('QuickAddSession', () => {
  const defaultProps = {
    subjects: ['Matemática', 'Português', 'História'],
    onAddSession: vi.fn(),
    canModify: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the card with title', () => {
      render(<QuickAddSession {...defaultProps} />)
      expect(screen.getByText('Adicionar Estudo de Hoje')).toBeInTheDocument()
    })

    it('renders the form when canModify is true', () => {
      render(<QuickAddSession {...defaultProps} />)
      expect(screen.getByText('Matéria')).toBeInTheDocument()
      expect(screen.getByLabelText('Minutos')).toBeInTheDocument()
    })

    it('renders message when canModify is false', () => {
      render(<QuickAddSession {...defaultProps} canModify={false} />)
      expect(screen.getByText('Selecione um workspace para adicionar sessões.')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('submit button has aria-label', () => {
      render(<QuickAddSession {...defaultProps} />)
      const submitButton = screen.getByRole('button', { name: /adicionar sessão de estudo/i })

      expect(submitButton).toBeInTheDocument()
    })

    it('submit button has aria-busy=false when not submitting', () => {
      render(<QuickAddSession {...defaultProps} />)
      const submitButton = screen.getByRole('button', { name: /adicionar/i })

      expect(submitButton).toHaveAttribute('aria-busy', 'false')
    })

    it('plus icons are hidden from screen readers', () => {
      render(<QuickAddSession {...defaultProps} />)

      const icons = document.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('form inputs have associated labels', () => {
      render(<QuickAddSession {...defaultProps} />)

      // SubjectPicker has its own label handling
      expect(screen.getByText('Matéria')).toBeInTheDocument()
      expect(screen.getByLabelText('Minutos')).toBeInTheDocument()
    })

    it('icons are hidden when canModify is false', () => {
      render(<QuickAddSession {...defaultProps} canModify={false} />)

      const icons = document.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })
})
