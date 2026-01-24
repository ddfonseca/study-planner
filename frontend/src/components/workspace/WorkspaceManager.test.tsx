import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WorkspaceManager } from './WorkspaceManager'

// Mock the stores and hooks
vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: vi.fn(() => ({
    workspaces: [
      { id: '1', name: 'Geral', color: '#6366f1', isDefault: true },
      { id: '2', name: 'Trabalho', color: '#22c55e', isDefault: false },
    ],
    isLoading: false,
    createWorkspace: vi.fn().mockResolvedValue(undefined),
    updateWorkspace: vi.fn().mockResolvedValue(undefined),
    deleteWorkspace: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@/hooks/useMediaQuery', () => ({
  useIsMobile: vi.fn(() => false),
}))

vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useCanUseFeature: vi.fn(() => ({ canUse: true, limit: 5, remaining: 3 })),
  FEATURES: { MAX_WORKSPACES: 'max_workspaces' },
}))

vi.mock('@/components/subscription/UpgradePrompt', () => ({
  LimitIndicator: () => null,
  UpgradePrompt: () => null,
}))

vi.mock('@/components/subscription', () => ({
  PricingModal: () => null,
}))

describe('WorkspaceManager', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('color picker keyboard navigation', () => {
    it('color picker has role="radiogroup" with aria-label', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const radiogroup = screen.getByRole('radiogroup', { name: /Cor do workspace/i })
      expect(radiogroup).toBeInTheDocument()
    })

    it('color buttons have role="radio"', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const radios = screen.getAllByRole('radio')
      expect(radios.length).toBe(10) // 10 preset colors
    })

    it('selected color has aria-checked="true"', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const radios = screen.getAllByRole('radio')
      // First color is selected by default
      expect(radios[0]).toHaveAttribute('aria-checked', 'true')
      expect(radios[1]).toHaveAttribute('aria-checked', 'false')
    })

    it('only selected color has tabIndex=0', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const radios = screen.getAllByRole('radio')
      // First color is selected by default
      expect(radios[0]).toHaveAttribute('tabindex', '0')
      expect(radios[1]).toHaveAttribute('tabindex', '-1')
    })

    it('color buttons have aria-label', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      expect(screen.getByLabelText('Cor 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Cor 2')).toBeInTheDocument()
      expect(screen.getByLabelText('Cor 10')).toBeInTheDocument()
    })

    it('selects color on Enter key', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const colorButton = screen.getByLabelText('Cor 3')
      colorButton.focus()
      await user.keyboard('{Enter}')

      expect(colorButton).toHaveAttribute('aria-checked', 'true')
    })

    it('selects color on Space key', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const colorButton = screen.getByLabelText('Cor 5')
      colorButton.focus()
      await user.keyboard(' ')

      expect(colorButton).toHaveAttribute('aria-checked', 'true')
    })

    it('moves to next color on ArrowRight', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const firstColor = screen.getByLabelText('Cor 1')
      firstColor.focus()
      await user.keyboard('{ArrowRight}')

      const secondColor = screen.getByLabelText('Cor 2')
      expect(secondColor).toHaveAttribute('aria-checked', 'true')
    })

    it('moves to previous color on ArrowLeft', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      // First select color 3
      const thirdColor = screen.getByLabelText('Cor 3')
      await user.click(thirdColor)

      // Now press ArrowLeft
      thirdColor.focus()
      await user.keyboard('{ArrowLeft}')

      const secondColor = screen.getByLabelText('Cor 2')
      expect(secondColor).toHaveAttribute('aria-checked', 'true')
    })

    it('wraps to first color on ArrowRight from last color', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      // Select last color
      const lastColor = screen.getByLabelText('Cor 10')
      await user.click(lastColor)

      // Press ArrowRight
      lastColor.focus()
      await user.keyboard('{ArrowRight}')

      const firstColor = screen.getByLabelText('Cor 1')
      expect(firstColor).toHaveAttribute('aria-checked', 'true')
    })

    it('wraps to last color on ArrowLeft from first color', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      // First color is selected by default
      const firstColor = screen.getByLabelText('Cor 1')
      firstColor.focus()
      await user.keyboard('{ArrowLeft}')

      const lastColor = screen.getByLabelText('Cor 10')
      expect(lastColor).toHaveAttribute('aria-checked', 'true')
    })

    it('color buttons have focus-visible ring styles', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click new workspace button
      await user.click(screen.getByText('Novo Workspace'))

      const radios = screen.getAllByRole('radio')
      radios.forEach(radio => {
        expect(radio).toHaveClass('focus-visible:outline-none')
        expect(radio).toHaveClass('focus-visible:ring-2')
        expect(radio).toHaveClass('focus-visible:ring-ring')
      })
    })
  })

  describe('edit mode color picker keyboard navigation', () => {
    it('edit mode color picker has role="radiogroup"', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click edit button on second workspace
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg.lucide-pencil')
      )
      await user.click(editButtons[1])

      const radiogroups = screen.getAllByRole('radiogroup', { name: /Cor do workspace/i })
      expect(radiogroups.length).toBeGreaterThan(0)
    })

    it('edit mode color picker supports arrow key navigation', async () => {
      const user = userEvent.setup()
      render(<WorkspaceManager {...defaultProps} />)

      // Click edit button on second workspace
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg.lucide-pencil')
      )
      await user.click(editButtons[1])

      // Find the color picker in edit mode
      const radiogroups = screen.getAllByRole('radiogroup', { name: /Cor do workspace/i })
      const editRadiogroup = radiogroups[0]
      const radios = within(editRadiogroup).getAllByRole('radio')

      // The workspace's current color should be selected
      const selectedRadio = radios.find(r => r.getAttribute('aria-checked') === 'true')
      expect(selectedRadio).toBeDefined()

      if (selectedRadio) {
        selectedRadio.focus()
        await user.keyboard('{ArrowDown}')

        // A different radio should now be selected
        const newSelectedRadio = radios.find(r => r.getAttribute('aria-checked') === 'true')
        expect(newSelectedRadio).not.toBe(selectedRadio)
      }
    })
  })
})
