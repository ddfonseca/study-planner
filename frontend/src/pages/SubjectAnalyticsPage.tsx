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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/app/dashboard">
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
              <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </Link>
          <PieChart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Analytics por Materia</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
          <PieChart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/50 mb-3 sm:mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
            Nenhum dado encontrado
          </h2>
          <p className="text-sm text-muted-foreground mb-3 sm:mb-4 max-w-xs">
            Registre sessoes de estudo para ver analytics detalhados.
          </p>
          <Link to="/app/calendar">
            <Button size="sm">Ir para Calendario</Button>
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
