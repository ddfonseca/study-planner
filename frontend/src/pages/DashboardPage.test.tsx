import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'

// Mock the hooks
vi.mock('@/store/sessionStore', () => ({
  useSessionStore: vi.fn(),
}))

vi.mock('@/hooks/useDashboard', () => ({
  useDashboard: vi.fn(),
}))

vi.mock('@/hooks/useSessions', () => ({
  useSessions: vi.fn(() => ({
    fetchSessions: vi.fn(),
  })),
}))

// Mock dashboard components
vi.mock('@/components/dashboard', () => ({
  DateRangeFilter: vi.fn(({ currentDays }) => (
    <div data-testid="date-range-filter">Filter: {currentDays} days</div>
  )),
  StatsCards: vi.fn(({ stats }) => (
    <div data-testid="stats-cards">Stats: {stats.totalMinutes} min</div>
  )),
  SubjectChart: vi.fn(() => <div data-testid="subject-chart">Subject Chart</div>),
  DailyChart: vi.fn(() => <div data-testid="daily-chart">Daily Chart</div>),
  AnnualHeatmap: vi.fn(() => <div data-testid="annual-heatmap">Annual Heatmap</div>),
}))

import { useSessionStore } from '@/store/sessionStore'
import { useDashboard } from '@/hooks/useDashboard'

const mockUseSessionStore = vi.mocked(useSessionStore)
const mockUseDashboard = vi.mocked(useDashboard)

const renderWithRouter = (component: React.ReactNode) => {
  return render(<MemoryRouter>{component}</MemoryRouter>)
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('shows skeleton when loading', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {},
        isLoading: true,
      } as ReturnType<typeof useSessionStore>)

      mockUseDashboard.mockReturnValue({
        daysBack: 30,
        stats: { totalMinutes: 0, totalDays: 0, averageMinutesPerDay: 0, mostStudiedSubject: null, subjectBreakdown: {} },
        subjectChartData: { labels: [], datasets: [] },
        dailyChartData: { labels: [], datasets: [] },
        setDateRangePreset: vi.fn(),
      } as unknown as ReturnType<typeof useDashboard>)

      renderWithRouter(<DashboardPage />)

      // Should show skeletons during loading
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
      expect(screen.queryByTestId('stats-cards')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows empty state when period has no sessions', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {},
        isLoading: false,
      } as ReturnType<typeof useSessionStore>)

      mockUseDashboard.mockReturnValue({
        daysBack: 30,
        stats: { totalMinutes: 0, totalDays: 0, averageMinutesPerDay: 0, mostStudiedSubject: null, subjectBreakdown: {} },
        subjectChartData: { labels: [], datasets: [] },
        dailyChartData: { labels: [], datasets: [] },
        setDateRangePreset: vi.fn(),
      } as unknown as ReturnType<typeof useDashboard>)

      renderWithRouter(<DashboardPage />)

      expect(screen.getByText('Nenhuma sessão neste período')).toBeInTheDocument()
      expect(
        screen.getByText('Selecione outro período ou adicione sessões de estudo para visualizar estatísticas')
      ).toBeInTheDocument()
    })

    it('does not show stats cards when period has no sessions', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {},
        isLoading: false,
      } as ReturnType<typeof useSessionStore>)

      mockUseDashboard.mockReturnValue({
        daysBack: 30,
        stats: { totalMinutes: 0, totalDays: 0, averageMinutesPerDay: 0, mostStudiedSubject: null, subjectBreakdown: {} },
        subjectChartData: { labels: [], datasets: [] },
        dailyChartData: { labels: [], datasets: [] },
        setDateRangePreset: vi.fn(),
      } as unknown as ReturnType<typeof useDashboard>)

      renderWithRouter(<DashboardPage />)

      expect(screen.queryByTestId('stats-cards')).not.toBeInTheDocument()
      expect(screen.queryByTestId('subject-chart')).not.toBeInTheDocument()
      expect(screen.queryByTestId('daily-chart')).not.toBeInTheDocument()
    })

    it('still shows annual heatmap when period has no sessions', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {},
        isLoading: false,
      } as ReturnType<typeof useSessionStore>)

      mockUseDashboard.mockReturnValue({
        daysBack: 30,
        stats: { totalMinutes: 0, totalDays: 0, averageMinutesPerDay: 0, mostStudiedSubject: null, subjectBreakdown: {} },
        subjectChartData: { labels: [], datasets: [] },
        dailyChartData: { labels: [], datasets: [] },
        setDateRangePreset: vi.fn(),
      } as unknown as ReturnType<typeof useDashboard>)

      renderWithRouter(<DashboardPage />)

      expect(screen.getByTestId('annual-heatmap')).toBeInTheDocument()
    })
  })

  describe('with data', () => {
    it('shows stats cards and charts when period has sessions', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {
          '2025-01-10': { totalMinutos: 60, materias: [{ id: '1', materia: 'Math', minutos: 60 }] },
        },
        isLoading: false,
      } as ReturnType<typeof useSessionStore>)

      mockUseDashboard.mockReturnValue({
        daysBack: 30,
        stats: { totalMinutes: 60, totalDays: 1, averageMinutesPerDay: 60, mostStudiedSubject: 'Math', subjectBreakdown: { Math: 60 } },
        subjectChartData: { labels: ['Math'], datasets: [{ data: [60] }] },
        dailyChartData: { labels: ['2025-01-10'], datasets: [{ data: [60] }] },
        setDateRangePreset: vi.fn(),
      } as unknown as ReturnType<typeof useDashboard>)

      renderWithRouter(<DashboardPage />)

      expect(screen.queryByText('Nenhuma sessão neste período')).not.toBeInTheDocument()
      expect(screen.getByTestId('stats-cards')).toBeInTheDocument()
      expect(screen.getByTestId('subject-chart')).toBeInTheDocument()
      expect(screen.getByTestId('daily-chart')).toBeInTheDocument()
    })

    it('shows header with title and date range filter', () => {
      mockUseSessionStore.mockReturnValue({
        sessions: {},
        isLoading: false,
      } as ReturnType<typeof useSessionStore>)

      mockUseDashboard.mockReturnValue({
        daysBack: 30,
        stats: { totalMinutes: 60, totalDays: 1, averageMinutesPerDay: 60, mostStudiedSubject: 'Math', subjectBreakdown: { Math: 60 } },
        subjectChartData: { labels: ['Math'], datasets: [{ data: [60] }] },
        dailyChartData: { labels: ['2025-01-10'], datasets: [{ data: [60] }] },
        setDateRangePreset: vi.fn(),
      } as unknown as ReturnType<typeof useDashboard>)

      renderWithRouter(<DashboardPage />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('date-range-filter')).toBeInTheDocument()
      expect(screen.getByText('Ver por Materia')).toBeInTheDocument()
    })
  })
})
