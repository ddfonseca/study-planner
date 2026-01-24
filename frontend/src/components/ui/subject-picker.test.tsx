import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubjectPicker } from './subject-picker'

// Mock the useIsMobile hook
vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false),
}))

describe('SubjectPicker', () => {
  const defaultProps = {
    value: '',
    onValueChange: vi.fn(),
    subjects: ['Matemática', 'Física', 'Química', 'Biologia'],
    recentSubjects: ['Matemática', 'Física'],
    onSubjectUsed: vi.fn(),
    placeholder: 'Selecione...',
    searchPlaceholder: 'Buscar matéria...',
    emptyMessage: 'Nenhuma matéria encontrada',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('keyboard navigation for recent subjects', () => {
    it('recent subject badges have role="option"', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      const options = screen.getAllByRole('option')
      expect(options.length).toBeGreaterThan(0)
    })

    it('recent subject badges have tabIndex=0', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Find recents listbox and check its options
      const recentsListbox = screen.getByRole('listbox', { name: /Matérias recentes/i })
      const recentsOptions = recentsListbox.querySelectorAll('[role="option"]')
      recentsOptions.forEach(option => {
        expect(option).toHaveAttribute('tabindex', '0')
      })
    })

    it('selects recent subject on Enter key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<SubjectPicker {...defaultProps} onValueChange={onValueChange} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Find the recents listbox and get the first option
      const recentsListbox = screen.getByRole('listbox', { name: /Matérias recentes/i })
      const matOption = recentsListbox.querySelector('[role="option"]') as HTMLElement
      matOption.focus()
      await user.keyboard('{Enter}')

      expect(onValueChange).toHaveBeenCalledWith('Matemática')
    })

    it('selects recent subject on Space key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<SubjectPicker {...defaultProps} onValueChange={onValueChange} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Find the recents listbox and get the second option (Física)
      const recentsListbox = screen.getByRole('listbox', { name: /Matérias recentes/i })
      const options = recentsListbox.querySelectorAll('[role="option"]')
      const fisicaOption = options[1] as HTMLElement
      fisicaOption.focus()
      await user.keyboard(' ')

      expect(onValueChange).toHaveBeenCalledWith('Física')
    })

    it('recent subjects have aria-selected attribute', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} value="Matemática" />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      const recentsListbox = screen.getByRole('listbox', { name: /Matérias recentes/i })
      const options = recentsListbox.querySelectorAll('[role="option"]')
      const matOption = options[0]
      const fisicaOption = options[1]

      expect(matOption).toHaveAttribute('aria-selected', 'true')
      expect(fisicaOption).toHaveAttribute('aria-selected', 'false')
    })

    it('recents container has role="listbox" with aria-label', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      const listbox = screen.getByRole('listbox', { name: /Matérias recentes/i })
      expect(listbox).toBeInTheDocument()
    })
  })

  describe('keyboard navigation for subject list', () => {
    it('subject buttons have role="option"', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} recentSubjects={[]} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      const listbox = screen.getByRole('listbox', { name: /Lista de matérias/i })
      expect(listbox).toBeInTheDocument()
    })

    it('subject buttons select on Enter key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<SubjectPicker {...defaultProps} recentSubjects={[]} onValueChange={onValueChange} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Find and focus a subject button
      const quimicaButton = screen.getByRole('option', { name: /Química/i })
      quimicaButton.focus()
      await user.keyboard('{Enter}')

      expect(onValueChange).toHaveBeenCalledWith('Química')
    })

    it('subject buttons select on Space key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<SubjectPicker {...defaultProps} recentSubjects={[]} onValueChange={onValueChange} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Find and focus a subject button
      const biologiaButton = screen.getByRole('option', { name: /Biologia/i })
      biologiaButton.focus()
      await user.keyboard(' ')

      expect(onValueChange).toHaveBeenCalledWith('Biologia')
    })

    it('subject buttons have aria-selected attribute', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} value="Química" recentSubjects={[]} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      const quimicaButton = screen.getByRole('option', { name: /Química/i })
      const biologiaButton = screen.getByRole('option', { name: /Biologia/i })

      expect(quimicaButton).toHaveAttribute('aria-selected', 'true')
      expect(biologiaButton).toHaveAttribute('aria-selected', 'false')
    })

    it('subject buttons have focus-visible ring styles', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} recentSubjects={[]} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      const options = screen.getAllByRole('option')
      options.forEach(option => {
        expect(option).toHaveClass('focus-visible:outline-none')
        expect(option).toHaveClass('focus-visible:ring-2')
        expect(option).toHaveClass('focus-visible:ring-ring')
      })
    })
  })

  describe('create new option keyboard navigation', () => {
    it('create button has aria-label', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Type a new subject name
      const searchInput = screen.getByPlaceholderText('Buscar matéria...')
      await user.type(searchInput, 'Nova Matéria')

      const createButton = screen.getByLabelText(/Criar nova matéria: Nova Matéria/i)
      expect(createButton).toBeInTheDocument()
    })

    it('create button triggers on Enter key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<SubjectPicker {...defaultProps} onValueChange={onValueChange} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Type a new subject name
      const searchInput = screen.getByPlaceholderText('Buscar matéria...')
      await user.type(searchInput, 'Nova Matéria')

      const createButton = screen.getByLabelText(/Criar nova matéria: Nova Matéria/i)
      createButton.focus()
      await user.keyboard('{Enter}')

      expect(onValueChange).toHaveBeenCalledWith('Nova Matéria')
    })

    it('create button triggers on Space key', async () => {
      const user = userEvent.setup()
      const onValueChange = vi.fn()
      render(<SubjectPicker {...defaultProps} onValueChange={onValueChange} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Type a new subject name
      const searchInput = screen.getByPlaceholderText('Buscar matéria...')
      await user.type(searchInput, 'Outra Matéria')

      const createButton = screen.getByLabelText(/Criar nova matéria: Outra Matéria/i)
      createButton.focus()
      await user.keyboard(' ')

      expect(onValueChange).toHaveBeenCalledWith('Outra Matéria')
    })

    it('create button has focus-visible ring styles', async () => {
      const user = userEvent.setup()
      render(<SubjectPicker {...defaultProps} />)

      // Open the picker
      await user.click(screen.getByRole('combobox'))

      // Type a new subject name
      const searchInput = screen.getByPlaceholderText('Buscar matéria...')
      await user.type(searchInput, 'Nova')

      const createButton = screen.getByLabelText(/Criar nova matéria/i)
      expect(createButton).toHaveClass('focus-visible:outline-none')
      expect(createButton).toHaveClass('focus-visible:ring-2')
      expect(createButton).toHaveClass('focus-visible:ring-ring')
    })
  })
})
