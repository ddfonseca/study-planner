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

// Mock CodeMirrorEditor since CodeMirror doesn't work well in jsdom
vi.mock('@/components/ui/codemirror-editor', () => ({
  CodeMirrorEditor: ({ onChange, docId }: {
    onChange: (content: string) => void;
    placeholder?: string;
    docId: string;
  }) => {
    return (
      <div data-testid="codemirror-editor" data-doc-id={docId}>
        <textarea
          data-testid="codemirror-textarea"
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    )
  },
}))

// Mock useAutoSave - to control save status for SyncIndicator tests
const mockRetry = vi.fn()
const mockSave = vi.fn()
const mockSaveNow = vi.fn()
let mockAutoSaveStatus = 'idle'

vi.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => ({
    status: mockAutoSaveStatus,
    lastSavedAt: new Date('2024-01-01T12:00:00Z'),
    retry: mockRetry,
    save: mockSave,
    saveNow: mockSaveNow,
    isOnline: true,
  }),
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
    setNotes: vi.fn(),
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
    update: vi.fn(),
  },
}))

describe('ScratchpadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockAutoSaveStatus = 'idle'
  })

  describe('delete confirmation dialog', () => {
    it('shows delete button on note list items on hover', () => {
      render(<ScratchpadPage />)

      const deleteButtons = document.querySelectorAll('button')
      const trashButtons = Array.from(deleteButtons).filter(btn =>
        btn.querySelector('svg.lucide-trash-2') || btn.innerHTML.includes('Trash2')
      )
      expect(trashButtons.length).toBeGreaterThan(0)
    })

    it('opens confirm dialog when clicking delete button', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

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

      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
        const excluirButtons = screen.getAllByRole('button', { name: /excluir/i })
        expect(excluirButtons.length).toBeGreaterThan(0)
      })
    })

    it('confirms deletion when clicking the confirm button', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Excluir nota')).toBeInTheDocument()
      })

      const excluirButtons = screen.getAllByRole('button', { name: /excluir/i })
      const confirmButton = excluirButtons.find(btn => btn.classList.contains('bg-destructive'))
      expect(confirmButton).toBeInTheDocument()

      if (confirmButton) {
        await user.click(confirmButton)
      }

      await waitFor(() => {
        expect(screen.queryByText(/tem certeza que deseja excluir esta nota/i)).not.toBeInTheDocument()
      })
    })

    it('closes dialog when canceling deletion', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      const noteItems = screen.getAllByText('First Note')
      const noteItem = noteItems[0].closest('div')
      const deleteButton = noteItem?.querySelector('button')

      if (deleteButton) {
        await user.click(deleteButton)
      }

      await waitFor(() => {
        expect(screen.getByText('Excluir nota')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /cancelar/i }))

      await waitFor(() => {
        expect(screen.queryByText(/tem certeza que deseja excluir esta nota/i)).not.toBeInTheDocument()
      })
    })

    it('uses destructive variant for confirm button', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

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

  describe('SyncIndicator integration', () => {
    it('renders SyncIndicator when a note is selected', () => {
      render(<ScratchpadPage />)

      const syncIndicator = screen.getByRole('status')
      expect(syncIndicator).toBeInTheDocument()
    })

    it('shows idle state label when not saving', () => {
      mockAutoSaveStatus = 'idle'
      render(<ScratchpadPage />)

      expect(screen.getByText('Salvo')).toBeInTheDocument()
    })

    it('shows saving state when auto-save is in progress', () => {
      mockAutoSaveStatus = 'saving'
      render(<ScratchpadPage />)

      expect(screen.getByText('Salvando...')).toBeInTheDocument()
    })

    it('shows success state after successful save', () => {
      mockAutoSaveStatus = 'saved'
      render(<ScratchpadPage />)

      expect(screen.getByText('Salvo')).toBeInTheDocument()
    })

    it('shows error state when save fails', () => {
      mockAutoSaveStatus = 'error'
      render(<ScratchpadPage />)

      expect(screen.getByText('Erro ao salvar')).toBeInTheDocument()
    })

    it('shows retry button when in error state', async () => {
      mockAutoSaveStatus = 'error'
      render(<ScratchpadPage />)

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i })
      expect(retryButton).toBeInTheDocument()
    })

    it('calls retry function when retry button is clicked', async () => {
      const user = userEvent.setup()
      mockAutoSaveStatus = 'error'
      render(<ScratchpadPage />)

      const retryButton = screen.getByRole('button', { name: /tentar novamente/i })
      await user.click(retryButton)

      expect(mockRetry).toHaveBeenCalled()
    })

    it('triggers auto-save when content changes', async () => {
      const user = userEvent.setup()
      mockAutoSaveStatus = 'idle'
      render(<ScratchpadPage />)

      // Type in the mocked CodeMirror textarea
      const textarea = screen.getByTestId('codemirror-textarea')
      await user.type(textarea, 'New content')

      expect(mockSave).toHaveBeenCalled()
    })
  })

  describe('CodeMirror editor', () => {
    it('renders CodeMirrorEditor component', () => {
      render(<ScratchpadPage />)

      expect(screen.getByTestId('codemirror-editor')).toBeInTheDocument()
    })

    it('passes correct docId to editor', () => {
      render(<ScratchpadPage />)

      const editor = screen.getByTestId('codemirror-editor')
      expect(editor.getAttribute('data-doc-id')).toBe('note-1')
    })
  })

  describe('Vim mode toggle', () => {
    it('renders Vim toggle button', () => {
      render(<ScratchpadPage />)

      expect(screen.getByTitle(/vim/i)).toBeInTheDocument()
    })

    it('persists vim preference to localStorage', async () => {
      const user = userEvent.setup()
      render(<ScratchpadPage />)

      const vimButton = screen.getByTitle(/ativar vim/i)
      await user.click(vimButton)

      expect(localStorage.getItem('scratchpad-vim-mode')).toBe('true')
    })
  })
})
