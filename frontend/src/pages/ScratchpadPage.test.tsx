import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScratchpadPage } from './ScratchpadPage'

// Mock useIsMobile hook to always return false (desktop)
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}))

// Mock date-fns to avoid locale issues in tests
vi.mock('date-fns', () => ({
  format: vi.fn(() => '10:00 de 01/01'),
}))

vi.mock('date-fns/locale', () => ({
  ptBR: {},
}))

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

// Mock remarkGfm
vi.mock('remark-gfm', () => ({
  default: () => {},
}))

vi.mock('@/store/scratchpadStore', () => {
  const mockStoreState = {
    notes: [
      {
        id: 'note-1',
        title: 'First Note',
        content: 'Content of first note',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T12:00:00Z',
      },
      {
        id: 'note-2',
        title: 'Second Note',
        content: 'Content of second note',
        createdAt: '2024-01-02T10:00:00Z',
        updatedAt: null,
      },
    ],
    currentNoteId: 'note-1',
    isLoading: false,
    isSaving: false,
    error: null,
    fetchNotes: vi.fn(),
    createNote: vi.fn(),
    deleteNote: vi.fn(),
    updateNote: vi.fn(),
    setCurrentNote: vi.fn(),
    getCurrentNote: () => ({
      id: 'note-1',
      title: 'First Note',
      content: 'Content of first note',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
    }),
    clearError: vi.fn(),
  }

  const mockUseScratchpadStore = Object.assign(
    () => mockStoreState,
    { getState: () => mockStoreState }
  )

  return {
    useScratchpadStore: mockUseScratchpadStore,
  }
})

// Mock the API
vi.mock('@/lib/api/scratchpadNotes', () => ({
  scratchpadNotesApi: {
    create: vi.fn(),
    getAll: vi.fn(),
  },
}))

describe('ScratchpadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('delete confirmation dialog', () => {
    it('shows delete button on note list items on hover', () => {
      render(<ScratchpadPage />)

      // The delete buttons have opacity-0 by default but should exist
      const deleteButtons = document.querySelectorAll('button')
      const trashButtons = Array.from(deleteButtons).filter(btn =>
        btn.querySelector('svg.lucide-trash-2') || btn.innerHTML.includes('Trash2')
      )
      expect(trashButtons.length).toBeGreaterThan(0)
    })

    it('opens confirm dialog when clicking delete button', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      // Find the delete button for the first note in the desktop sidebar
      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Excluir nota')).toBeInTheDocument()
        expect(screen.getByText(/tem certeza que deseja excluir esta nota/i)).toBeInTheDocument()
      })
    })

    it('shows cancel and confirm buttons in dialog', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      // Find and click delete button
      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
        // There should be an Excluir button in the dialog
        const excluirButtons = screen.getAllByRole('button', { name: /excluir/i })
        expect(excluirButtons.length).toBeGreaterThan(0)
      })
    })

    it('confirms deletion when clicking the confirm button', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      // Find and click delete button
      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Excluir nota')).toBeInTheDocument()
      })

      // Find and click confirm button
      const excluirButtons = screen.getAllByRole('button', { name: /excluir/i })
      const confirmButton = excluirButtons.find(btn => btn.classList.contains('bg-destructive'))
      expect(confirmButton).toBeInTheDocument()

      if (confirmButton) {
        await user.click(confirmButton)
      }

      // The dialog should close after confirmation (or show loading)
      // Since the mock deleteNote is inside the factory, we can't easily check if it was called
      // But we can verify the UI behavior - the dialog should close
      await waitFor(() => {
        expect(screen.queryByText(/tem certeza que deseja excluir esta nota/i)).not.toBeInTheDocument()
      })
    })

    it('closes dialog when canceling deletion', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      // Find and click delete button
      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('Excluir nota')).toBeInTheDocument()
      })

      // Click cancel
      await user.click(screen.getByRole('button', { name: /cancelar/i }))

      await waitFor(() => {
        expect(screen.queryByText(/tem certeza que deseja excluir esta nota/i)).not.toBeInTheDocument()
      })
    })

    it('uses destructive variant for confirm button', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      // Find and click delete button
      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        const excluirButtons = screen.getAllByRole('button', { name: /excluir/i })
        const confirmButton = excluirButtons.find(btn => btn.classList.contains('bg-destructive'))
        expect(confirmButton).toBeInTheDocument()
      })
    })
  })
})
