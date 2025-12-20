/**
 * Date utilities using date-fns
 */
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  isSameMonth,
  getDay,
  getDaysInMonth,
  subDays,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateKey(dateKey: string): Date {
  return parse(dateKey, 'yyyy-MM-dd', new Date());
}

/**
 * Format date for display in Portuguese
 */
export function formatDateDisplay(date: Date): string {
  return format(date, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Format date for display in Portuguese (short)
 */
export function formatDateShort(date: Date): string {
  return format(date, 'dd/MM', { locale: ptBR });
}

/**
 * Format month and year for display
 */
export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: ptBR });
}

/**
 * Format day of week
 */
export function formatDayOfWeek(date: Date): string {
  return format(date, 'EEEE', { locale: ptBR });
}

/**
 * Get day names for calendar header
 */
export function getDayNames(): string[] {
  return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
}

/**
 * Get all dates for a calendar month grid (includes padding days)
 */
export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = endOfMonth(firstDay);
  const startDayOfWeek = getDay(firstDay);

  const days: Date[] = [];

  // Add padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(subDays(firstDay, i + 1));
  }

  // Add all days of current month
  const daysInMonth = getDaysInMonth(firstDay);
  for (let i = 0; i < daysInMonth; i++) {
    days.push(addDays(firstDay, i));
  }

  // Add padding days from next month to complete 6 rows (42 days)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(addDays(lastDay, i));
  }

  return days;
}

/**
 * Get weeks array from calendar days
 */
export function getCalendarWeeks(year: number, month: number): Date[][] {
  const days = getCalendarDays(year, month);
  const weeks: Date[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

/**
 * Get date range for a number of days back from today
 */
export function getDateRangeFromDays(daysBack: number): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = subDays(endDate, daysBack - 1);

  return {
    startDate: formatDateKey(startDate),
    endDate: formatDateKey(endDate),
  };
}

/**
 * Get month range
 */
export function getMonthRange(year: number, month: number): { startDate: string; endDate: string } {
  const date = new Date(year, month, 1);

  return {
    startDate: formatDateKey(startOfMonth(date)),
    endDate: formatDateKey(endOfMonth(date)),
  };
}

// Re-export date-fns functions that might be needed
export {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
  isSameMonth,
  getDay,
  getDaysInMonth,
  subDays,
};
