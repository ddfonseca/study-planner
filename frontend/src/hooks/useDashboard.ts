/**
 * Dashboard Hook - Manages date range and filtered data for dashboard
 */
import { useState, useMemo, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { filterSessionsByDateRange, calculateStats } from '@/lib/utils/transform';
import { getDateRangeFromDays, formatDateKey } from '@/lib/utils/date';

export function useDashboard() {
  const { sessions } = useSessionStore();
  const { currentWorkspaceId, getCurrentWorkspace } = useWorkspaceStore();

  // Whether viewing consolidated data
  const isConsolidatedView = currentWorkspaceId === null;
  const currentWorkspace = getCurrentWorkspace();
  const [daysBack, setDaysBack] = useState(30);

  // Calculate date range based on days back
  const dateRange = useMemo(() => {
    return getDateRangeFromDays(daysBack);
  }, [daysBack]);

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    return filterSessionsByDateRange(sessions, dateRange.startDate, dateRange.endDate);
  }, [sessions, dateRange]);

  // Calculate stats from filtered sessions
  const stats = useMemo(() => {
    return calculateStats(filteredSessions);
  }, [filteredSessions]);

  // Get data for subject chart (doughnut)
  const subjectChartData = useMemo(() => {
    const labels = Object.keys(stats.subjectBreakdown);
    const data = Object.values(stats.subjectBreakdown);

    // Modern soft color palette (pastel tones)
    const modernPalette = [
      { bg: '#a5b4fc', border: '#818cf8' }, // Indigo 300/400
      { bg: '#c4b5fd', border: '#a78bfa' }, // Violet 300/400
      { bg: '#67e8f9', border: '#22d3ee' }, // Cyan 300/400
      { bg: '#fda4af', border: '#fb7185' }, // Rose 300/400
      { bg: '#6ee7b7', border: '#34d399' }, // Emerald 300/400
      { bg: '#fcd34d', border: '#fbbf24' }, // Amber 300/400
      { bg: '#93c5fd', border: '#60a5fa' }, // Blue 300/400
      { bg: '#f9a8d4', border: '#f472b6' }, // Pink 300/400
      { bg: '#5eead4', border: '#2dd4bf' }, // Teal 300/400
      { bg: '#d8b4fe', border: '#c084fc' }, // Purple 300/400
      { bg: '#86efac', border: '#4ade80' }, // Green 300/400
      { bg: '#fca5a5', border: '#f87171' }, // Red 300/400
    ];

    const colors = labels.map((_, i) => modernPalette[i % modernPalette.length]);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors.map(c => c.bg),
          borderColor: colors.map(c => c.border),
          borderWidth: 2,
        },
      ],
    };
  }, [stats.subjectBreakdown]);

  // Get data for daily chart (bar)
  const dailyChartData = useMemo(() => {
    const dates: string[] = [];
    const data: number[] = [];

    // Get all dates in range
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = formatDateKey(new Date(d));
      dates.push(dateKey);
      data.push(filteredSessions[dateKey]?.totalMinutos || 0);
    }

    return {
      labels: dates,
      datasets: [
        {
          label: 'Minutos estudados',
          data,
          backgroundColor: '#a5b4fc',
          borderColor: '#818cf8',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [filteredSessions, dateRange]);

  // Set date range preset
  const setDateRangePreset = useCallback((days: number) => {
    setDaysBack(days);
  }, []);

  return {
    daysBack,
    dateRange,
    filteredSessions,
    stats,
    subjectChartData,
    dailyChartData,
    setDateRangePreset,
    currentWorkspaceId,
    currentWorkspace,
    isConsolidatedView,
  };
}

export default useDashboard;
