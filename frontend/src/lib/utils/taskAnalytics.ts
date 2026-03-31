/**
 * Task Analytics Utilities
 * Functions to calculate task-specific metrics and trends
 */
import type { SessionsMap, TaskStats, TrendPoint, WeekdayAverage } from '@/types/session';
import { getDay } from 'date-fns';
import { parseDateKey, formatDateKey, addDays } from './date';

/**
 * Get list of all unique tasks from sessions
 */
export function getUniqueTasks(sessions: SessionsMap): string[] {
  const tasks = new Set<string>();

  Object.values(sessions).forEach((dayData) => {
    dayData.entries.forEach((entry) => {
      tasks.add(entry.taskName);
    });
  });

  return Array.from(tasks).sort();
}

/**
 * Calculate detailed stats for a specific task
 */
export function calculateTaskStats(
  sessions: SessionsMap,
  subject: string,
  startDate: string,
  endDate: string
): TaskStats {
  let totalMinutes = 0;
  let totalSessions = 0;
  let allTasksTotalMinutes = 0;

  // Calculate weeks in range for weekly average
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeksInRange = Math.max(1, daysInRange / 7);

  Object.entries(sessions).forEach(([dateKey, dayData]) => {
    if (dateKey >= startDate && dateKey <= endDate) {
      // Count total for all tasks (for percentage)
      allTasksTotalMinutes += dayData.totalMinutes;

      // Count stats for selected task
      dayData.entries.forEach((entry) => {
        if (entry.taskName === subject) {
          totalMinutes += entry.minutes;
          totalSessions++;
        }
      });
    }
  });

  return {
    subject,
    totalMinutes,
    totalSessions,
    averageSessionMinutes: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    weeklyAverageMinutes: Math.round(totalMinutes / weeksInRange),
    percentageOfTotal: allTasksTotalMinutes > 0
      ? Math.round((totalMinutes / allTasksTotalMinutes) * 100)
      : 0,
  };
}

/**
 * Get trend data (minutes per day) for a specific task
 */
export function getTaskTrendData(
  sessions: SessionsMap,
  subject: string,
  startDate: string,
  endDate: string
): TrendPoint[] {
  const trendData: TrendPoint[] = [];
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  // Iterate through each day in the range
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const dateKey = formatDateKey(d);
    let minutesForDay = 0;

    const dayData = sessions[dateKey];
    if (dayData) {
      dayData.entries.forEach((entry) => {
        if (entry.taskName === subject) {
          minutesForDay += entry.minutes;
        }
      });
    }

    trendData.push({
      date: dateKey,
      minutes: minutesForDay,
    });
  }

  return trendData;
}

/**
 * Get average minutes per weekday for a specific task
 */
export function getTaskWeeklyAverages(
  sessions: SessionsMap,
  subject: string,
  startDate: string,
  endDate: string
): WeekdayAverage[] {
  // Weekday names (starting from Sunday)
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Track totals and counts for each weekday
  const weekdayTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
  const weekdayCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  // Iterate through each day in the range
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const dateKey = formatDateKey(d);
    const dayOfWeek = getDay(d); // 0 = Sunday, 6 = Saturday

    weekdayCounts[dayOfWeek]++;

    const dayData = sessions[dateKey];
    if (dayData) {
      dayData.entries.forEach((entry) => {
        if (entry.taskName === subject) {
          weekdayTotals[dayOfWeek] += entry.minutes;
        }
      });
    }
  }

  // Calculate averages and format result (ordered Mon-Sun)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]; // Mon to Sun

  return orderedDays.map((dayIndex) => ({
    weekday: weekdayNames[dayIndex],
    dayIndex,
    averageMinutes: weekdayCounts[dayIndex] > 0
      ? Math.round(weekdayTotals[dayIndex] / weekdayCounts[dayIndex])
      : 0,
  }));
}
