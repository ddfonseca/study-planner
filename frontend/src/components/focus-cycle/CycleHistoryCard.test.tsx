import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CycleHistoryCard } from './CycleHistoryCard'

// Mock the workspace store
vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: vi.fn(() => ({
    currentWorkspaceId: 'workspace-1',
  })),
}))

// Mock the API
vi.mock('@/lib/api', () => ({
  studyCycleApi: {
    getHistory: vi.fn(() => Promise.resolve({
      entries: [],
      totalAdvances: 0,
      totalCompletions: 0,
    })),
  },
}))

describe('CycleHistoryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the card header with title', () => {
      render(<CycleHistoryCard />)
      expect(screen.getByText('Histórico do Ciclo')).toBeInTheDocument()
    })

    it('renders collapsed by default', () => {
      render(<CycleHistoryCard />)
      const expandButton = screen.getByRole('button', { name: /expandir/i })
      expect(expandButton).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('accessibility', () => {
    it('expand button has aria-expanded attribute', () => {
      render(<CycleHistoryCard />)
      const expandButton = screen.getByRole('button', { name: /expandir/i })

      expect(expandButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('expand button has descriptive aria-label when collapsed', () => {
      render(<CycleHistoryCard />)
      const expandButton = screen.getByRole('button', { name: /expandir histórico do ciclo/i })

      expect(expandButton).toBeInTheDocument()
    })

    it('updates aria-expanded and aria-label when expanded', async () => {
      const user = userEvent.setup()
      render(<CycleHistoryCard />)

      const expandButton = screen.getByRole('button', { name: /expandir/i })
      await user.click(expandButton)

      expect(expandButton).toHaveAttribute('aria-expanded', 'true')
      expect(expandButton).toHaveAttribute('aria-label', 'Recolher histórico do ciclo')
    })

    it('icons are hidden from screen readers', () => {
      render(<CycleHistoryCard />)

      const icons = document.querySelectorAll('svg')
      icons.forEach((icon) => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })
})
