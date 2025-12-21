/**
 * Calendar Hook - Manages calendar navigation and state
 */
import { useState, useMemo, useCallback } from 'react';
import {
  getCalendarWeeks,
  formatMonthYear,
  addMonths,
  subMonths,
  getDayNames,
} from '@/lib/utils/date';
import { useConfigStore } from '@/store/configStore';

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const weekStartDay = useConfigStore((state) => state.weekStartDay);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Get calendar weeks for current month
  const weeks = useMemo(() => {
    return getCalendarWeeks(currentYear, currentMonth, weekStartDay);
  }, [currentYear, currentMonth, weekStartDay]);

  // Get day names based on weekStartDay
  const dayNames = useMemo(() => {
    return getDayNames(weekStartDay);
  }, [weekStartDay]);

  // Format month/year for display
  const monthYearDisplay = useMemo(() => {
    return formatMonthYear(currentDate);
  }, [currentDate]);

  // Navigation functions
  const goToNextMonth = useCallback(() => {
    setCurrentDate((prev) => addMonths(prev, 1));
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate((prev) => subMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToMonth = useCallback((year: number, month: number) => {
    setCurrentDate(new Date(year, month, 1));
  }, []);

  return {
    currentDate,
    currentYear,
    currentMonth,
    weeks,
    dayNames,
    weekStartDay,
    monthYearDisplay,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
    goToMonth,
  };
}

export default useCalendar;
