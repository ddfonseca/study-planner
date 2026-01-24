import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeOverlay } from './WelcomeOverlay'
import { useOnboardingStore } from '@/store/onboardingStore'

// Mock the responsive-dialog to avoid issues with Radix UI
vi.mock('@/components/ui/responsive-dialog', () => ({
  ResponsiveDialog: ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) =>
    open ? (
      <div data-testid="dialog" role="dialog">
        {children}
        <button onClick={() => onOpenChange(false)} data-testid="close-trigger">
          Close
        </button>
      </div>
    ) : null,
  ResponsiveDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResponsiveDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResponsiveDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  ResponsiveDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  ResponsiveDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('WelcomeOverlay', () => {
  beforeEach(() => {
    // Reset onboarding store before each test
    useOnboardingStore.setState({ hasSeenWelcome: false, shouldOpenSessionModal: false })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders overlay for new users who have not seen welcome', () => {
      render(<WelcomeOverlay />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Bem-vindo ao Horas Líquidas!')).toBeInTheDocument()
    })

    it('does not render overlay when user has already seen welcome', () => {
      useOnboardingStore.setState({ hasSeenWelcome: true })

      render(<WelcomeOverlay />)

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('displays the welcome title', () => {
      render(<WelcomeOverlay />)

      expect(screen.getByText('Bem-vindo ao Horas Líquidas!')).toBeInTheDocument()
    })

    it('displays the welcome description', () => {
      render(<WelcomeOverlay />)

      expect(screen.getByText('Acompanhe seu tempo de estudo de forma simples e eficiente.')).toBeInTheDocument()
    })
  })

  describe('features section', () => {
    it('displays calendar feature', () => {
      render(<WelcomeOverlay />)

      expect(screen.getByText('Calendário de Estudos')).toBeInTheDocument()
      expect(screen.getByText('Registre suas sessões de estudo diárias com facilidade.')).toBeInTheDocument()
    })

    it('displays study cycles feature', () => {
      render(<WelcomeOverlay />)

      expect(screen.getByText('Ciclos de Estudo')).toBeInTheDocument()
      expect(screen.getByText('Organize suas matérias em ciclos para estudar de forma equilibrada.')).toBeInTheDocument()
    })

    it('displays dashboard feature', () => {
      render(<WelcomeOverlay />)

      expect(screen.getByText('Dashboard de Progresso')).toBeInTheDocument()
      expect(screen.getByText('Visualize seu progresso com gráficos e estatísticas detalhadas.')).toBeInTheDocument()
    })
  })

  describe('user interactions', () => {
    it('closes overlay and sets hasSeenWelcome when clicking "Começar" button', async () => {
      const user = userEvent.setup()

      render(<WelcomeOverlay />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /começar/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      expect(useOnboardingStore.getState().hasSeenWelcome).toBe(true)
    })

    it('sets shouldOpenSessionModal to true when clicking "Começar" button', async () => {
      const user = userEvent.setup()

      render(<WelcomeOverlay />)

      expect(useOnboardingStore.getState().shouldOpenSessionModal).toBe(false)

      await user.click(screen.getByRole('button', { name: /começar/i }))

      expect(useOnboardingStore.getState().shouldOpenSessionModal).toBe(true)
    })

    it('closes overlay and sets hasSeenWelcome when clicking "Pular" (skip) button', async () => {
      const user = userEvent.setup()

      render(<WelcomeOverlay />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /pular/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      expect(useOnboardingStore.getState().hasSeenWelcome).toBe(true)
    })

    it('does not set shouldOpenSessionModal when clicking "Pular" (skip) button', async () => {
      const user = userEvent.setup()

      render(<WelcomeOverlay />)

      expect(useOnboardingStore.getState().shouldOpenSessionModal).toBe(false)

      await user.click(screen.getByRole('button', { name: /pular/i }))

      expect(useOnboardingStore.getState().shouldOpenSessionModal).toBe(false)
    })

    it('closes overlay and sets hasSeenWelcome when dialog is dismissed', async () => {
      const user = userEvent.setup()

      render(<WelcomeOverlay />)

      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Click the close trigger (simulating dialog dismiss)
      await user.click(screen.getByTestId('close-trigger'))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
      expect(useOnboardingStore.getState().hasSeenWelcome).toBe(true)
    })
  })

  describe('persistence', () => {
    it('does not show overlay on subsequent renders after user has seen it', async () => {
      const user = userEvent.setup()

      const { unmount } = render(<WelcomeOverlay />)

      // Close the overlay
      await user.click(screen.getByRole('button', { name: /começar/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Unmount and remount to simulate navigation/refresh
      unmount()

      render(<WelcomeOverlay />)

      // Should not show the overlay again
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
