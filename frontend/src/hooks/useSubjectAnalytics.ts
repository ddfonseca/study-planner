/**
 * Subject Analytics Hook - Manages subject-specific analytics data
 */
import { useState, useMemo, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { filterSessionsByDateRange } from '@/lib/utils/transform';
import { getDateRangeFromDays } from '@/lib/utils/date';
import {
  getUniqueSubjects,
  calculateSubjectStats,
  getSubjectTrendData,
  getSubjectWeeklyAverages,
} from '@/lib/utils/subjectAnalytics';

// Modern soft color palette (same as useDashboard)
const MODERN_PALETTE = [
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

export function useSubjectAnalytics() {
  const { sessions } = useSessionStore();
  const [daysBack, setDaysBack] = useState(30);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Calculate date range based on days back
  const dateRange = useMemo(() => {
    return getDateRangeFromDays(daysBack);
  }, [daysBack]);

  // Filter sessions by date range
  const filteredSessions = useMemo(() => {
    return filterSessionsByDateRange(sessions, dateRange.startDate, dateRange.endDate);
  }, [sessions, dateRange]);

  // Get list of available subjects
  const subjects = useMemo(() => {
    return getUniqueSubjects(filteredSessions);
  }, [filteredSessions]);

  // Auto-select first subject if none selected or selection becomes invalid
  const activeSubject = useMemo(() => {
    if (selectedSubject && subjects.includes(selectedSubject)) {
      return selectedSubject;
    }
    return subjects.length > 0 ? subjects[0] : null;
  }, [selectedSubject, subjects]);

  // Calculate stats for selected subject
  const stats = useMemo(() => {
    if (!activeSubject) return null;
    return calculateSubjectStats(
      filteredSessions,
      activeSubject,
      dateRange.startDate,
      dateRange.endDate
    );
  }, [filteredSessions, activeSubject, dateRange]);

  // Get trend data for chart
  const trendData = useMemo(() => {
    if (!activeSubject) return [];
    return getSubjectTrendData(
      filteredSessions,
      activeSubject,
      dateRange.startDate,
      dateRange.endDate
    );
  }, [filteredSessions, activeSubject, dateRange]);

  // Get weekly averages for chart
  const weeklyAverages = useMemo(() => {
    if (!activeSubject) return [];
    return getSubjectWeeklyAverages(
      filteredSessions,
      activeSubject,
      dateRange.startDate,
      dateRange.endDate
    );
  }, [filteredSessions, activeSubject, dateRange]);

  // Get color for selected subject (consistent with SubjectChart)
  const subjectColor = useMemo(() => {
    if (!activeSubject) return MODERN_PALETTE[0];
    const index = subjects.indexOf(activeSubject);
    return MODERN_PALETTE[index % MODERN_PALETTE.length];
  }, [activeSubject, subjects]);

  // Chart data for trend chart (line)
  const trendChartData = useMemo(() => {
    return {
      labels: trendData.map((point) => point.date),
      datasets: [
        {
          label: activeSubject || 'Materia',
          data: trendData.map((point) => point.minutes),
          borderColor: subjectColor.border,
          backgroundColor: subjectColor.bg,
          fill: true,
          tension: 0.3,
          pointRadius: trendData.length > 30 ? 0 : 3,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [trendData, activeSubject, subjectColor]);

  // Chart data for weekly chart (bar)
  const weeklyChartData = useMemo(() => {
    return {
      labels: weeklyAverages.map((day) => day.weekday),
      datasets: [
        {
          label: 'Media por dia',
          data: weeklyAverages.map((day) => day.averageMinutes),
          backgroundColor: subjectColor.bg,
          borderColor: subjectColor.border,
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    };
  }, [weeklyAverages, subjectColor]);

  // Set date range preset
  const setDateRangePreset = useCallback((days: number) => {
    setDaysBack(days);
  }, []);

  // Select subject
  const selectSubject = useCallback((subject: string) => {
    setSelectedSubject(subject);
  }, []);

  return {
    // State
    daysBack,
    dateRange,
    subjects,
    selectedSubject: activeSubject,
    stats,
    trendData,
    weeklyAverages,
    trendChartData,
    weeklyChartData,
    subjectColor,
    // Actions
    setDateRangePreset,
    selectSubject,
  };
}

export default useSubjectAnalytics;
