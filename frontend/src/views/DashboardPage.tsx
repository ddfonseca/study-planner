/**
 * Dashboard Page - Analytics and statistics
 */
import { useEffect, useCallback, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSessionStore } from '@/store/sessionStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useSubjectStore } from '@/store/subjectStore';
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
  CategoryFilter,
  DateRangeFilter,
  StatsCards,
  SubjectChart,
  DailyChart,
  AnnualHeatmap,
} from '@/components/dashboard';

export function DashboardPage() {
  const navigate = useNavigate();
  const isMobile = useIsSmallMobile();
  const { sessions, rawSessions, isLoading } = useSessionStore();
  const { fetchSessions } = useSessions();
  const { currentWorkspaceId } = useWorkspaceStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { subjects } = useSubjectStore();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

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

  // Fetch categories when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchCategories(currentWorkspaceId);
    }
  }, [currentWorkspaceId, fetchCategories]);

  // Get subject IDs that belong to selected categories
  const filteredSubjectIds = useMemo((): string[] | null => {
    if (selectedCategoryIds.length === 0) return null;
    return subjects
      .filter(s => s.categories?.some(sc => selectedCategoryIds.includes(sc.categoryId)))
      .map(s => s.id);
  }, [subjects, selectedCategoryIds]);

  // Filter raw sessions by category for heatmap
  const filteredRawSessions = useMemo(() => {
    if (!filteredSubjectIds) return rawSessions;
    return rawSessions.filter(s => filteredSubjectIds.includes(s.subjectId));
  }, [rawSessions, filteredSubjectIds]);

  // Recalculate stats for filtered sessions
  const filteredStats = useMemo(() => {
    if (!filteredSubjectIds) return stats;
    // If filtering, recalculate basic stats
    const totalMinutes = filteredRawSessions.reduce((sum, s) => sum + s.minutes, 0);
    const uniqueSubjects = new Set(filteredRawSessions.map(s => s.subjectId));
    return {
      ...stats,
      totalMinutes,
      totalSubjects: uniqueSubjects.size,
      totalSessions: filteredRawSessions.length,
    };
  }, [filteredSubjectIds, filteredRawSessions, stats]);

  // Filter chart data - filter labels/data by subject names
  const filteredSubjectChartData = useMemo(() => {
    if (!filteredSubjectIds) return subjectChartData;

    // Get names of subjects that are in selected categories
    const filteredSubjectNames = new Set(
      subjects
        .filter(s => filteredSubjectIds.includes(s.id))
        .map(s => s.name)
    );

    // Filter the chart data
    const filteredIndices: number[] = [];
    subjectChartData.labels.forEach((label, index) => {
      if (filteredSubjectNames.has(label)) {
        filteredIndices.push(index);
      }
    });

    return {
      labels: filteredIndices.map(i => subjectChartData.labels[i]),
      datasets: subjectChartData.datasets.map(ds => ({
        ...ds,
        data: filteredIndices.map(i => ds.data[i]),
        backgroundColor: filteredIndices.map(i =>
          Array.isArray(ds.backgroundColor) ? ds.backgroundColor[i] : ds.backgroundColor
        ),
        borderColor: filteredIndices.map(i =>
          Array.isArray(ds.borderColor) ? ds.borderColor[i] : ds.borderColor
        ),
      })),
    };
  }, [subjectChartData, filteredSubjectIds, subjects]);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

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

      {/* Category Filter */}
      <CategoryFilter
        categories={categories}
        selectedIds={selectedCategoryIds}
        onToggle={handleCategoryToggle}
        onClearAll={() => setSelectedCategoryIds([])}
      />

      {filteredStats.totalMinutes === 0 ? (
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
          <StatsCards stats={filteredStats} />

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SubjectChart data={filteredSubjectChartData} />
            <DailyChart data={dailyChartData} />
          </div>
        </>
      )}

      {/* Annual Heatmap - shows all sessions, category filter applies to stats/charts only */}
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
