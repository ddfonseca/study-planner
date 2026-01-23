/**
 * Dashboard Page - Analytics and statistics
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useDashboard } from '@/hooks/useDashboard';
import { useSessions } from '@/hooks/useSessions';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart } from 'lucide-react';

import {
  DateRangeFilter,
  StatsCards,
  SubjectChart,
  DailyChart,
  AnnualHeatmap,
} from '@/components/dashboard';

export function DashboardPage() {
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

  if (isLoading) {
    return (
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
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link to="/app/analytics">
            <Button variant="outline" size="sm">
              <PieChart className="h-4 w-4 mr-2" />
              Ver por Materia
            </Button>
          </Link>
          <DateRangeFilter
            currentDays={daysBack}
            onSelectPreset={setDateRangePreset}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectChart data={subjectChartData} />
        <DailyChart data={dailyChartData} />
      </div>

      {/* Annual Heatmap */}
      <AnnualHeatmap sessions={sessions} />
    </div>
  );
}

export default DashboardPage;
