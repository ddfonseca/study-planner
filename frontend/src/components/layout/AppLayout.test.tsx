import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AppLayout } from './AppLayout'

// Mock stores
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: '1', name: 'Test User', email: 'test@example.com', image: null },
    logout: vi.fn(),
    isLoading: false,
  })),
}))

vi.mock('@/store/subscriptionStore', () => ({
  useSubscriptionStore: vi.fn(() => ({
    fetchCurrentSubscription: vi.fn(),
  })),
}))

vi.mock('@/store/featureBadgesStore', () => ({
  useFeatureBadgesStore: vi.fn(() => ({
    isFeatureNew: vi.fn(() => false),
    markFeatureSeen: vi.fn(),
  })),
}))

// Mock child components
vi.mock('@/components/workspace', () => ({
  WorkspaceSelector: () => <div data-testid="workspace-selector">Workspace Selector</div>,
}))

vi.mock('@/components/onboarding', () => ({
  WelcomeOverlay: () => null,
}))

vi.mock('@/components/ui/offline-banner', () => ({
  OfflineBanner: () => null,
}))

const renderWithRouter = (component: React.ReactNode) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'light')
    Storage.prototype.setItem = vi.fn()
  })

  describe('rendering', () => {
    it('renders the header with logo', () => {
      renderWithRouter(<AppLayout />)
      expect(screen.getByText('Horas Líquidas')).toBeInTheDocument()
    })

    it('renders navigation links', () => {
      renderWithRouter(<AppLayout />)
      expect(screen.getAllByText('Calendário').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Configurações').length).toBeGreaterThan(0)
    })

    it('renders theme toggle button', () => {
      renderWithRouter(<AppLayout />)
      expect(screen.getByLabelText(/ativar modo/i)).toBeInTheDocument()
    })

    it('renders logout button', () => {
      renderWithRouter(<AppLayout />)
      expect(screen.getByText('Sair')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('theme toggle button has descriptive aria-label for light mode', () => {
      Storage.prototype.getItem = vi.fn(() => 'light')
      renderWithRouter(<AppLayout />)

      const themeButton = screen.getByLabelText('Ativar modo escuro')
      expect(themeButton).toBeInTheDocument()
    })

    it('theme toggle button has descriptive aria-label for dark mode', () => {
      Storage.prototype.getItem = vi.fn(() => 'dark')
      renderWithRouter(<AppLayout />)

      const themeButton = screen.getByLabelText('Ativar modo claro')
      expect(themeButton).toBeInTheDocument()
    })

    it('theme toggle icon is hidden from screen readers', () => {
      renderWithRouter(<AppLayout />)

      const themeButton = screen.getByLabelText(/ativar modo/i)
      const icon = themeButton.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('logout button has aria-label', () => {
      renderWithRouter(<AppLayout />)

      const logoutButton = screen.getByLabelText('Sair da conta')
      expect(logoutButton).toBeInTheDocument()
    })

    it('logout icon is hidden from screen readers', () => {
      renderWithRouter(<AppLayout />)

      const logoutButton = screen.getByLabelText('Sair da conta')
      const icon = logoutButton.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('toggles theme when theme button is clicked', async () => {
      const user = userEvent.setup()
      Storage.prototype.getItem = vi.fn(() => 'light')
      renderWithRouter(<AppLayout />)

      const themeButton = screen.getByLabelText('Ativar modo escuro')
      await user.click(themeButton)

      // After click, the button label should change
      expect(screen.getByLabelText('Ativar modo claro')).toBeInTheDocument()
    })
  })
})
