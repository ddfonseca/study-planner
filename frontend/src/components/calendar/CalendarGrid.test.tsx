import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CalendarGrid } from './CalendarGrid'

// Mock the hooks
vi.mock('@/hooks/useSessions', () => ({
  useSessions: vi.fn(),
}))

vi.mock('@/hooks/useWeeklyGoals', () => ({
  useWeeklyGoals: vi.fn(() => ({
    getCachedGoalForWeek: vi.fn(() => null),
    prefetchGoals: vi.fn(),
    calculateWeekStart: vi.fn((date: Date) => date.toISOString().split('T')[0]),
  })),
}))

import { useSessions } from '@/hooks/useSessions'

const mockUseSessions = vi.mocked(useSessions)

describe('CalendarGrid', () => {
  const defaultDayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const mockOnCellClick = vi.fn()

  // Create a sample weeks array for January 2025
  const createWeeks = (): Date[][] => {
    const weeks: Date[][] = []
    // Week 1: Dec 29 - Jan 4
    weeks.push([
      new Date('2025-01-05'),
      new Date('2025-01-06'),
      new Date('2025-01-07'),
      new Date('2025-01-08'),
      new Date('2025-01-09'),
      new Date('2025-01-10'),
      new Date('2025-01-11'),
    ])
    // Week 2: Jan 12-18
    weeks.push([
      new Date('2025-01-12'),
      new Date('2025-01-13'),
      new Date('2025-01-14'),
      new Date('2025-01-15'),
      new Date('2025-01-16'),
      new Date('2025-01-17'),
      new Date('2025-01-18'),
    ])
    return weeks
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('shows empty state when month has no sessions', () => {
      mockUseSessions.mockReturnValue({
        sessions: {},
        selectedDate: null,
        isLoading: false,
        error: null,
        currentWorkspaceId: 'workspace-1',
        canModify: true,
        fetchSessions: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        getCellIntensity: vi.fn(() => 0),
        handleAddSession: vi.fn(),
        handleUpdateSession: vi.fn(),
        handleDeleteSession: vi.fn(),
        getWeekTotals: vi.fn(() => 0),
        getUniqueSubjects: vi.fn(() => []),
        hasSessionsInMonth: vi.fn(() => false),
      })

      render(
        <CalendarGrid
          weeks={createWeeks()}
          currentMonth={0} // January
          dayNames={defaultDayNames}
          onCellClick={mockOnCellClick}
        />
      )

      expect(screen.getByText('Nenhuma sessão neste mês')).toBeInTheDocument()
      expect(
        screen.getByText('Clique em um dia para adicionar sua primeira sessão de estudo')
      ).toBeInTheDocument()
    })

    it('does not show empty state when month has sessions', () => {
      mockUseSessions.mockReturnValue({
        sessions: {
          '2025-01-10': { totalMinutos: 60, materias: [{ materia: 'Math', minutos: 60 }] },
        },
        selectedDate: null,
        isLoading: false,
        error: null,
        currentWorkspaceId: 'workspace-1',
        canModify: true,
        fetchSessions: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        getCellIntensity: vi.fn(() => 0),
        handleAddSession: vi.fn(),
        handleUpdateSession: vi.fn(),
        handleDeleteSession: vi.fn(),
        getWeekTotals: vi.fn(() => 60),
        getUniqueSubjects: vi.fn(() => ['Math']),
        hasSessionsInMonth: vi.fn(() => true),
      })

      render(
        <CalendarGrid
          weeks={createWeeks()}
          currentMonth={0} // January
          dayNames={defaultDayNames}
          onCellClick={mockOnCellClick}
        />
      )

      expect(screen.queryByText('Nenhuma sessão neste mês')).not.toBeInTheDocument()
    })
  })

  describe('rendering', () => {
    it('renders day names in header', () => {
      mockUseSessions.mockReturnValue({
        sessions: {},
        selectedDate: null,
        isLoading: false,
        error: null,
        currentWorkspaceId: 'workspace-1',
        canModify: true,
        fetchSessions: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        getCellIntensity: vi.fn(() => 0),
        handleAddSession: vi.fn(),
        handleUpdateSession: vi.fn(),
        handleDeleteSession: vi.fn(),
        getWeekTotals: vi.fn(() => 0),
        getUniqueSubjects: vi.fn(() => []),
        hasSessionsInMonth: vi.fn(() => false),
      })

      render(
        <CalendarGrid
          weeks={createWeeks()}
          currentMonth={0}
          dayNames={defaultDayNames}
          onCellClick={mockOnCellClick}
        />
      )

      defaultDayNames.forEach((day) => {
        expect(screen.getByText(day)).toBeInTheDocument()
      })
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('renders correct number of rows for weeks', () => {
      mockUseSessions.mockReturnValue({
        sessions: {},
        selectedDate: null,
        isLoading: false,
        error: null,
        currentWorkspaceId: 'workspace-1',
        canModify: true,
        fetchSessions: vi.fn(),
        selectDate: vi.fn(),
        getSessionsForDate: vi.fn(() => ({ totalMinutos: 0, materias: [] })),
        getCellIntensity: vi.fn(() => 0),
        handleAddSession: vi.fn(),
        handleUpdateSession: vi.fn(),
        handleDeleteSession: vi.fn(),
        getWeekTotals: vi.fn(() => 0),
        getUniqueSubjects: vi.fn(() => []),
        hasSessionsInMonth: vi.fn(() => false),
      })

      const weeks = createWeeks()

      render(
        <CalendarGrid
          weeks={weeks}
          currentMonth={0}
          dayNames={defaultDayNames}
          onCellClick={mockOnCellClick}
        />
      )

      const tbody = document.querySelector('tbody')
      expect(tbody?.querySelectorAll('tr')).toHaveLength(weeks.length)
    })
  })
})
