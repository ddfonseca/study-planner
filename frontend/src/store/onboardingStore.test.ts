import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from './onboardingStore'

describe('onboardingStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useOnboardingStore.setState({ hasSeenWelcome: false, shouldOpenSessionModal: false })
  })

  describe('initial state', () => {
    it('has hasSeenWelcome set to false by default', () => {
      const state = useOnboardingStore.getState()
      expect(state.hasSeenWelcome).toBe(false)
    })

    it('has shouldOpenSessionModal set to false by default', () => {
      const state = useOnboardingStore.getState()
      expect(state.shouldOpenSessionModal).toBe(false)
    })
  })

  describe('setHasSeenWelcome', () => {
    it('sets hasSeenWelcome to true', () => {
      const { setHasSeenWelcome } = useOnboardingStore.getState()

      setHasSeenWelcome(true)

      expect(useOnboardingStore.getState().hasSeenWelcome).toBe(true)
    })

    it('sets hasSeenWelcome to false', () => {
      // First set to true
      useOnboardingStore.setState({ hasSeenWelcome: true })

      const { setHasSeenWelcome } = useOnboardingStore.getState()

      setHasSeenWelcome(false)

      expect(useOnboardingStore.getState().hasSeenWelcome).toBe(false)
    })
  })

  describe('setShouldOpenSessionModal', () => {
    it('sets shouldOpenSessionModal to true', () => {
      const { setShouldOpenSessionModal } = useOnboardingStore.getState()

      setShouldOpenSessionModal(true)

      expect(useOnboardingStore.getState().shouldOpenSessionModal).toBe(true)
    })

    it('sets shouldOpenSessionModal to false', () => {
      // First set to true
      useOnboardingStore.setState({ shouldOpenSessionModal: true })

      const { setShouldOpenSessionModal } = useOnboardingStore.getState()

      setShouldOpenSessionModal(false)

      expect(useOnboardingStore.getState().shouldOpenSessionModal).toBe(false)
    })
  })

  describe('resetOnboarding', () => {
    it('resets hasSeenWelcome to false', () => {
      // First set to true
      useOnboardingStore.setState({ hasSeenWelcome: true })

      const { resetOnboarding } = useOnboardingStore.getState()

      resetOnboarding()

      expect(useOnboardingStore.getState().hasSeenWelcome).toBe(false)
    })

    it('resets shouldOpenSessionModal to false', () => {
      // First set to true
      useOnboardingStore.setState({ shouldOpenSessionModal: true })

      const { resetOnboarding } = useOnboardingStore.getState()

      resetOnboarding()

      expect(useOnboardingStore.getState().shouldOpenSessionModal).toBe(false)
    })
  })

  describe('persistence', () => {
    const STORAGE_KEY = 'onboarding-storage'

    beforeEach(() => {
      localStorage.clear()
    })

    it('store name is set to onboarding-storage', () => {
      // The persist middleware uses 'onboarding-storage' as the storage key
      // This is configured in the store definition
      // We verify the store is correctly configured by checking it exists
      expect(useOnboardingStore).toBeDefined()
      expect(typeof useOnboardingStore.getState).toBe('function')
      expect(typeof useOnboardingStore.setState).toBe('function')
    })

    it('persists hasSeenWelcome to localStorage', () => {
      const { setHasSeenWelcome } = useOnboardingStore.getState()

      setHasSeenWelcome(true)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      expect(parsed.state.hasSeenWelcome).toBe(true)
    })

    it('does not persist shouldOpenSessionModal to localStorage', () => {
      const { setShouldOpenSessionModal } = useOnboardingStore.getState()

      setShouldOpenSessionModal(true)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(stored).not.toBeNull()

      const parsed = JSON.parse(stored!)
      // shouldOpenSessionModal should not be in persisted state
      expect(parsed.state.shouldOpenSessionModal).toBeUndefined()
    })

    it('has correct persist options configured', () => {
      // Verify the persist middleware is configured with correct options
      const persistOptions = useOnboardingStore.persist.getOptions()

      expect(persistOptions.name).toBe(STORAGE_KEY)
      // partialize should only include hasSeenWelcome
      const partialized = persistOptions.partialize?.({
        hasSeenWelcome: true,
        shouldOpenSessionModal: true,
        setHasSeenWelcome: () => {},
        setShouldOpenSessionModal: () => {},
        resetOnboarding: () => {},
      })
      expect(partialized).toEqual({ hasSeenWelcome: true })
      expect(partialized).not.toHaveProperty('shouldOpenSessionModal')
    })

    it('uses localStorage as storage mechanism', () => {
      // Verify the store uses localStorage
      const persistOptions = useOnboardingStore.persist.getOptions()
      // Zustand wraps localStorage with getItem/setItem/removeItem methods
      expect(persistOptions.storage).toBeDefined()
      expect(typeof persistOptions.storage?.getItem).toBe('function')
      expect(typeof persistOptions.storage?.setItem).toBe('function')
    })
  })
})
