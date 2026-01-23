/**
 * Subject Analytics Page - Detailed analytics for individual subjects
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useSessions } from '@/hooks/useSessions';
import { useSubjectAnalytics } from '@/hooks/useSubjectAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PieChart, ArrowLeft } from 'lucide-react';

import {
  DateRangeFilter,
  SubjectSelector,
  SubjectStatsCards,
  SubjectTrendChart,
  SubjectWeeklyChart,
} from '@/components/dashboard';

export function SubjectAnalyticsPage() {
  const { isLoading } = useSessionStore();
  const { fetchSessions } = useSessions();
  const {
    daysBack,
    subjects,
    selectedSubject,
    stats,
    trendChartData,
    weeklyChartData,
    setDateRangePreset,
    selectSubject,
  } = useSubjectAnalytics();

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
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <PieChart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Analytics por Materia</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SubjectSelector
            subjects={subjects}
            selectedSubject={selectedSubject}
            onSelectSubject={selectSubject}
          />
          <DateRangeFilter
            currentDays={daysBack}
            onSelectPreset={setDateRangePreset}
          />
        </div>
      </div>

      {/* Empty State */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PieChart className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhum dado encontrado
          </h2>
          <p className="text-muted-foreground mb-4">
            Registre sessoes de estudo para ver analytics detalhados.
          </p>
          <Link to="/app/calendar">
            <Button>Ir para Calendario</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <SubjectStatsCards stats={stats} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubjectTrendChart data={trendChartData} />
            <SubjectWeeklyChart data={weeklyChartData} />
          </div>
        </>
      )}
    </div>
  );
}

export default SubjectAnalyticsPage;
