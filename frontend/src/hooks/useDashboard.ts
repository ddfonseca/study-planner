/**
 * Dashboard Hook - Manages date range and filtered data for dashboard
 */
import { useState, useMemo, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { filterSessionsByDateRange, calculateStats } from '@/lib/utils/transform';
import { getDateRangeFromDays, formatDateKey } from '@/lib/utils/date';

export function useDashboard() {
  const { sessions } = useSessionStore();
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

    // Generate colors for each subject
    const colors = labels.map((_, i) => {
      const hue = (i * 137.5) % 360; // Golden angle for good distribution
      return `hsl(${hue}, 70%, 50%)`;
    });

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map((c) => c.replace('50%', '40%')),
          borderWidth: 1,
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
          backgroundColor: '#4a90e2',
          borderColor: '#2f6cb5',
          borderWidth: 1,
          borderRadius: 4,
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
  };
}

export default useDashboard;
