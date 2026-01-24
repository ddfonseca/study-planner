import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConfigPanel } from './ConfigPanel'

// Mock the config store
const mockUpdateConfig = vi.fn()
vi.mock('@/store/configStore', () => ({
  useConfigStore: vi.fn(() => ({
    targetHours: 10,
    updateConfig: mockUpdateConfig,
    isLoading: false,
  })),
}))

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}))

describe('ConfigPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the card with title', () => {
      render(<ConfigPanel />)
      expect(screen.getByText('Meta Semanal Padrão')).toBeInTheDocument()
    })

    it('renders the hours input with label', () => {
      render(<ConfigPanel />)
      expect(screen.getByLabelText('Horas por Semana')).toBeInTheDocument()
    })

    it('renders the save button', () => {
      render(<ConfigPanel />)
      expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('save button has aria-label', () => {
      render(<ConfigPanel />)
      const saveButton = screen.getByRole('button', { name: /salvar configurações/i })

      expect(saveButton).toBeInTheDocument()
    })

    it('save button has aria-busy=false when not loading', () => {
      render(<ConfigPanel />)
      const saveButton = screen.getByRole('button', { name: /salvar/i })

      expect(saveButton).toHaveAttribute('aria-busy', 'false')
    })

    it('settings icon is hidden from screen readers', () => {
      const { container } = render(<ConfigPanel />)

      const icons = container.querySelectorAll('svg')
      const settingsIcon = icons[0]
      expect(settingsIcon).toHaveAttribute('aria-hidden', 'true')
    })

    it('input has associated label', () => {
      render(<ConfigPanel />)
      const input = screen.getByLabelText('Horas por Semana')

      expect(input).toHaveAttribute('id', 'targetHours')
      expect(input).toHaveAttribute('type', 'number')
    })
  })
})
