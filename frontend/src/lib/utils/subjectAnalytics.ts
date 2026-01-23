/**
 * Subject Analytics Utilities
 * Functions to calculate subject-specific metrics and trends
 */
import type { SessionsMap, SubjectStats, TrendPoint, WeekdayAverage } from '@/types/session';
import { getDay } from 'date-fns';
import { parseDateKey, formatDateKey, addDays } from './date';

/**
 * Get list of all unique subjects from sessions
 */
export function getUniqueSubjects(sessions: SessionsMap): string[] {
  const subjects = new Set<string>();

  Object.values(sessions).forEach((dayData) => {
    dayData.materias.forEach((materia) => {
      subjects.add(materia.materia);
    });
  });

  return Array.from(subjects).sort();
}

/**
 * Calculate detailed stats for a specific subject
 */
export function calculateSubjectStats(
  sessions: SessionsMap,
  subject: string,
  startDate: string,
  endDate: string
): SubjectStats {
  let totalMinutes = 0;
  let totalSessions = 0;
  let allSubjectsTotalMinutes = 0;

  // Calculate weeks in range for weekly average
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const daysInRange = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeksInRange = Math.max(1, daysInRange / 7);

  Object.entries(sessions).forEach(([dateKey, dayData]) => {
    if (dateKey >= startDate && dateKey <= endDate) {
      // Count total for all subjects (for percentage)
      allSubjectsTotalMinutes += dayData.totalMinutos;

      // Count stats for selected subject
      dayData.materias.forEach((materia) => {
        if (materia.materia === subject) {
          totalMinutes += materia.minutos;
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
    percentageOfTotal: allSubjectsTotalMinutes > 0
      ? Math.round((totalMinutes / allSubjectsTotalMinutes) * 100)
      : 0,
  };
}

/**
 * Get trend data (minutes per day) for a specific subject
 */
export function getSubjectTrendData(
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
      dayData.materias.forEach((materia) => {
        if (materia.materia === subject) {
          minutesForDay += materia.minutos;
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
 * Get average minutes per weekday for a specific subject
 */
export function getSubjectWeeklyAverages(
  sessions: SessionsMap,
  subject: string,
  startDate: string,
  endDate: string
): WeekdayAverage[] {
  // Weekday names in Portuguese (starting from Sunday)
  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

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
      dayData.materias.forEach((materia) => {
        if (materia.materia === subject) {
          weekdayTotals[dayOfWeek] += materia.minutos;
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
