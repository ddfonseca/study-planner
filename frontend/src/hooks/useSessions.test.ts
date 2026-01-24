import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSessions } from './useSessions'

// Mock the stores
vi.mock('@/store/sessionStore', () => ({
  useSessionStore: vi.fn(() => ({
    sessions: {},
    selectedDate: null,
    isLoading: false,
    error: null,
    fetchSessions: vi.fn(),
    addSession: vi.fn(),
    updateSession: vi.fn(),
    deleteSession: vi.fn(),
    selectDate: vi.fn(),
    getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
  })),
}))

vi.mock('@/store/workspaceStore', () => ({
  useWorkspaceStore: vi.fn(() => ({
    currentWorkspaceId: 'workspace-1',
  })),
}))

vi.mock('@/store/studyCycleStore', () => ({
  useStudyCycleStore: vi.fn(() => ({
    cycle: null,
    fetchSuggestion: vi.fn(),
  })),
}))

import { useSessionStore } from '@/store/sessionStore'

const mockUseSessionStore = vi.mocked(useSessionStore)

describe('useSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('hasSessionsInMonth', () => {
    const createWeeks = (): Date[][] => [
      [
        new Date('2025-01-05'),
        new Date('2025-01-06'),
        new Date('2025-01-07'),
        new Date('2025-01-08'),
        new Date('2025-01-09'),
        new Date('2025-01-10'),
        new Date('2025-01-11'),
      ],
      [
        new Date('2025-01-12'),
        new Date('2025-01-13'),
        new Date('2025-01-14'),
        new Date('2025-01-15'),
        new Date('2025-01-16'),
        new Date('2025-01-17'),
        new Date('2025-01-18'),
      ],
    ]

    it('returns false when there are no sessions', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {},
        selectedDate: null,
        isLoading: false,
        isSaving: false,
        error: null,
        rawSessions: [],
        fetchSessions: vi.fn(),
        addSession: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        clearSessions: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      })

      const { result } = renderHook(() => useSessions())
      const weeks = createWeeks()

      expect(result.current.hasSessionsInMonth(weeks)).toBe(false)
    })

    it('returns true when there is at least one session in the month', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {
          '2025-01-10': { totalMinutos: 60, materias: [{ materia: 'Math', minutos: 60 }] },
        },
        selectedDate: null,
        isLoading: false,
        isSaving: false,
        error: null,
        rawSessions: [],
        fetchSessions: vi.fn(),
        addSession: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        clearSessions: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      })

      const { result } = renderHook(() => useSessions())
      const weeks = createWeeks()

      expect(result.current.hasSessionsInMonth(weeks)).toBe(true)
    })

    it('returns false when sessions exist but have zero minutes', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {
          '2025-01-10': { totalMinutos: 0, materias: [] },
        },
        selectedDate: null,
        isLoading: false,
        isSaving: false,
        error: null,
        rawSessions: [],
        fetchSessions: vi.fn(),
        addSession: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        clearSessions: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      })

      const { result } = renderHook(() => useSessions())
      const weeks = createWeeks()

      expect(result.current.hasSessionsInMonth(weeks)).toBe(false)
    })

    it('returns false when sessions exist outside the displayed weeks', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {
          '2025-02-15': { totalMinutos: 120, materias: [{ materia: 'Physics', minutos: 120 }] },
        },
        selectedDate: null,
        isLoading: false,
        isSaving: false,
        error: null,
        rawSessions: [],
        fetchSessions: vi.fn(),
        addSession: vi.fn(),
        updateSession: vi.fn(),
        deleteSession: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        clearSessions: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
      })

      const { result } = renderHook(() => useSessions())
      const weeks = createWeeks()

      expect(result.current.hasSessionsInMonth(weeks)).toBe(false)
    })
  })
})
