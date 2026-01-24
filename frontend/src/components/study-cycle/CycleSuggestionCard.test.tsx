import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CycleSuggestionCard } from './CycleSuggestionCard'

// Mock the stores
vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: vi.fn(() => ({
    currentWorkspaceId: 'workspace-1',
  })),
}))

vi.mock('@/store/configStore', () => ({
  useConfigStore: vi.fn(() => ({
    celebrationsEnabled: true,
  })),
}))

vi.mock('@/hooks/useConfetti', () => ({
  useConfetti: vi.fn(() => ({
    fire: vi.fn(),
    confettiProps: { active: false },
  })),
}))

vi.mock('@/hooks/useHaptic', () => ({
  useHaptic: vi.fn(() => ({
    triggerPattern: vi.fn(),
  })),
}))

vi.mock('@/store/achievementsStore', () => ({
  useAchievementsStore: vi.fn(() => ({
    hasAchievementBeenShown: vi.fn(() => false),
    markAchievementShown: vi.fn(),
    _hasHydrated: true,
  })),
}))

vi.mock('@/store/studyCycleStore', () => ({
  useStudyCycleStore: vi.fn(),
  formatDuration: vi.fn((minutes: number) => `${minutes}m`),
  calculateCycleProgress: vi.fn((acc: number, target: number) =>
    target > 0 ? Math.min(100, Math.round((acc / target) * 100)) : 0
  ),
}))

vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useCanUseFeature: vi.fn(() => ({
    canUse: true,
    limit: 3,
    remaining: 2,
    isUnlimited: false,
  })),
  FEATURES: {
    MAX_CYCLES: 'MAX_CYCLES',
  },
}))

// Mock CycleEditorModal
vi.mock('./CycleEditorModal', () => ({
  CycleEditorModal: vi.fn(({ open }) =>
    open ? <div data-testid="cycle-editor-modal">Editor Modal</div> : null
  ),
}))

// Mock PricingModal
vi.mock('@/components/subscription', () => ({
  PricingModal: vi.fn(({ open }) =>
    open ? <div data-testid="pricing-modal">Pricing Modal</div> : null
  ),
}))

// Mock subscription components
vi.mock('@/components/subscription/UpgradePrompt', () => ({
  LimitIndicator: vi.fn(() => null),
  UpgradePrompt: vi.fn(() => <div data-testid="upgrade-prompt">Upgrade</div>),
}))

import { useStudyCycleStore } from '@/store/studyCycleStore'
import { useCanUseFeature } from '@/hooks/useSubscriptionLimits'
import { useConfigStore } from '@/store/configStore'
import { useConfetti } from '@/hooks/useConfetti'
import { useAchievementsStore } from '@/store/achievementsStore'

const mockUseStudyCycleStore = vi.mocked(useStudyCycleStore)
const mockUseCanUseFeature = vi.mocked(useCanUseFeature)
const mockUseConfigStore = vi.mocked(useConfigStore)
const mockUseConfetti = vi.mocked(useConfetti)
const mockUseAchievementsStore = vi.mocked(useAchievementsStore)

describe('CycleSuggestionCard', () => {
  const mockFireConfetti = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    mockUseConfigStore.mockReturnValue({
      celebrationsEnabled: true,
    } as unknown as ReturnType<typeof useConfigStore>)

    mockUseConfetti.mockReturnValue({
      fire: mockFireConfetti,
      confettiProps: { active: false },
    } as unknown as ReturnType<typeof useConfetti>)

    mockUseAchievementsStore.mockReturnValue({
      hasAchievementBeenShown: vi.fn(() => false),
      markAchievementShown: vi.fn(),
      _hasHydrated: true,
    } as unknown as ReturnType<typeof useAchievementsStore>)
  })

  describe('empty state', () => {
    it('shows empty state when no cycle is configured', () => {
      mockUseStudyCycleStore.mockReturnValue({
        cycle: null,
        cycles: [],
        suggestion: { hasCycle: false, suggestion: null },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      expect(screen.getByText('Nenhum ciclo configurado')).toBeInTheDocument()
      expect(
        screen.getByText('Organize seus estudos com um ciclo de rotação entre matérias')
      ).toBeInTheDocument()
    })

    it('shows empty state icon', () => {
      mockUseStudyCycleStore.mockReturnValue({
        cycle: null,
        cycles: [],
        suggestion: { hasCycle: false, suggestion: null },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      const icon = document.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('shows configure button in empty state when can create cycle', () => {
      mockUseStudyCycleStore.mockReturnValue({
        cycle: null,
        cycles: [],
        suggestion: { hasCycle: false, suggestion: null },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      expect(screen.getByRole('button', { name: /configurar ciclo/i })).toBeInTheDocument()
    })

    it('opens editor modal when clicking configure button', async () => {
      const user = userEvent.setup()

      mockUseStudyCycleStore.mockReturnValue({
        cycle: null,
        cycles: [],
        suggestion: { hasCycle: false, suggestion: null },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      await user.click(screen.getByRole('button', { name: /configurar ciclo/i }))

      expect(screen.getByTestId('cycle-editor-modal')).toBeInTheDocument()
    })

    it('shows upgrade prompt in empty state when cannot create cycle', () => {
      mockUseCanUseFeature.mockReturnValue({
        canUse: false,
        limit: 1,
        remaining: 0,
        isUnlimited: false,
      })

      mockUseStudyCycleStore.mockReturnValue({
        cycle: null,
        cycles: [{ id: '1', name: 'Existing Cycle' }],
        suggestion: { hasCycle: false, suggestion: null },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      expect(screen.getByTestId('upgrade-prompt')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /configurar ciclo/i })).not.toBeInTheDocument()
    })
  })

  describe('with active cycle', () => {
    it('renders current subject when cycle is configured', () => {
      mockUseStudyCycleStore.mockReturnValue({
        cycle: { id: '1', name: 'Meu Ciclo' },
        cycles: [{ id: '1', name: 'Meu Ciclo' }],
        suggestion: {
          hasCycle: true,
          suggestion: {
            currentSubject: 'Matemática',
            currentPosition: 0,
            totalItems: 3,
            currentAccumulatedMinutes: 30,
            currentTargetMinutes: 60,
            remainingMinutes: 30,
            isCurrentComplete: false,
            isCycleComplete: false,
            nextSubject: 'Português',
            nextTargetMinutes: 45,
            allItemsProgress: [],
          },
        },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      expect(screen.getByText('Matemática')).toBeInTheDocument()
      expect(screen.queryByText('Nenhum ciclo configurado')).not.toBeInTheDocument()
    })
  })

  describe('celebrationsEnabled setting', () => {
    it('does not fire confetti when celebrationsEnabled is false', () => {
      mockUseConfigStore.mockReturnValue({
        celebrationsEnabled: false,
      } as unknown as ReturnType<typeof useConfigStore>)

      mockUseStudyCycleStore.mockReturnValue({
        cycle: { id: '1', name: 'Meu Ciclo', updatedAt: '2024-01-15' },
        cycles: [{ id: '1', name: 'Meu Ciclo' }],
        suggestion: {
          hasCycle: true,
          suggestion: {
            currentSubject: 'Matemática',
            currentPosition: 2,
            totalItems: 3,
            currentAccumulatedMinutes: 60,
            currentTargetMinutes: 60,
            remainingMinutes: 0,
            isCurrentComplete: true,
            isCycleComplete: true,
            nextSubject: 'Português',
            nextTargetMinutes: 45,
            allItemsProgress: [],
          },
        },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      expect(mockFireConfetti).not.toHaveBeenCalled()
    })

    it('renders cycle complete UI even when celebrations are disabled', () => {
      mockUseConfigStore.mockReturnValue({
        celebrationsEnabled: false,
      } as unknown as ReturnType<typeof useConfigStore>)

      mockUseStudyCycleStore.mockReturnValue({
        cycle: { id: '1', name: 'Meu Ciclo', updatedAt: '2024-01-15' },
        cycles: [{ id: '1', name: 'Meu Ciclo' }],
        suggestion: {
          hasCycle: true,
          suggestion: {
            currentSubject: 'Matemática',
            currentPosition: 2,
            totalItems: 3,
            currentAccumulatedMinutes: 60,
            currentTargetMinutes: 60,
            remainingMinutes: 0,
            isCurrentComplete: true,
            isCycleComplete: true,
            nextSubject: 'Português',
            nextTargetMinutes: 45,
            allItemsProgress: [],
          },
        },
        isLoading: false,
        refresh: vi.fn(),
        advanceToNext: vi.fn(),
        activateCycle: vi.fn(),
        resetCycle: vi.fn(),
      } as unknown as ReturnType<typeof useStudyCycleStore>)

      render(<CycleSuggestionCard />)

      // The cycle complete UI should still show
      expect(screen.getByText('Ciclo Completo!')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reiniciar ciclo/i })).toBeInTheDocument()
    })
  })
})
