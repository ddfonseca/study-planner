/**
 * Dashboard Page - Analytics and statistics
 */
import { useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useDashboard } from '@/hooks/useDashboard';
import { useSessions } from '@/hooks/useSessions';
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonTransition } from '@/components/ui/skeleton-transition';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BarChart3, PieChart, CalendarOff } from 'lucide-react';
import { useIsSmallMobile } from '@/hooks/useMediaQuery';
import {
  DateRangeFilter,
  StatsCards,
  SubjectChart,
  DailyChart,
  AnnualHeatmap,
} from '@/components/dashboard';

export function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsSmallMobile();
  const { sessions, isLoading } = useSessionStore();
  const { fetchSessions } = useSessions();
  const {
    daysBack,
    stats,
    subjectChartData,
    dailyChartData,
    setDateRangePreset,
  } = useDashboard();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  const skeletonContent = (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link to="/app/analytics">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
              <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden xs:inline">Ver por</span> Materia
            </Button>
          </Link>
          <DateRangeFilter
            currentDays={daysBack}
            onSelectPreset={setDateRangePreset}
          />
        </div>
      </div>

      {stats.totalMinutes === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="Nenhuma sessão neste período"
          description="Selecione outro período ou adicione sessões de estudo para visualizar estatísticas"
          variant="card"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/calendar')}
            >
              Ir para calendário
            </Button>
          }
        />
      ) : (
        <>
          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubjectChart data={subjectChartData} />
            <DailyChart data={dailyChartData} />
          </div>
        </>
      )}

      {/* Annual Heatmap */}
      <AnnualHeatmap sessions={sessions} />
    </div>
  );

  return (
    <SkeletonTransition isLoading={isLoading} skeleton={skeletonContent}>
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh} enabled={!isLoading}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}
    </SkeletonTransition>
  );
}

export default DashboardPage;
