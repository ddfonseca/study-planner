/**
 * Data transformation utilities between backend and frontend formats
 */
import type { WorkSession } from '@/types/api';
import type { SessionsMap, DayData, WorkSessionUI, StudyStats } from '@/types/session';

/**
 * Transform backend sessions array to app format (grouped by date)
 */
export function transformSessionsToAppFormat(sessions: WorkSession[]): SessionsMap {
  const data: SessionsMap = {};

  sessions.forEach((session) => {
    // Ensure date is in YYYY-MM-DD format
    const dateKey = session.date.split('T')[0];

    if (!data[dateKey]) {
      data[dateKey] = {
        totalMinutes: 0,
        entries: [],
      };
    }

    data[dateKey].entries.push({
      id: session.id,
      taskId: session.taskId,
      taskName: session.task.name,
      minutes: session.minutes,
    });

    data[dateKey].totalMinutes += session.minutes;
  });

  return data;
}

/**
 * Transform a single session from backend to UI format
 */
export function transformSessionToUI(session: WorkSession): WorkSessionUI {
  return {
    id: session.id,
    taskId: session.taskId,
    taskName: session.task.name,
    minutes: session.minutes,
  };
}

/**
 * Get DayData for a specific date, or empty data if not found
 */
export function getDayData(sessions: SessionsMap, dateKey: string): DayData {
  return sessions[dateKey] || { totalMinutes: 0, entries: [] };
}

/**
 * Calculate study statistics from sessions
 */
export function calculateStats(sessions: SessionsMap): StudyStats {
  const taskBreakdown: Record<string, number> = {};
  let totalMinutes = 0;
  let totalDays = 0;

  Object.values(sessions).forEach((dayData) => {
    if (dayData.totalMinutes > 0) {
      totalDays++;
      totalMinutes += dayData.totalMinutes;

      dayData.entries.forEach((entry) => {
        taskBreakdown[entry.taskName] =
          (taskBreakdown[entry.taskName] || 0) + entry.minutes;
      });
    }
  });

  // Find most worked task
  let mostWorkedTask: string | null = null;
  let maxMinutes = 0;

  Object.entries(taskBreakdown).forEach(([task, minutes]) => {
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      mostWorkedTask = task;
    }
  });

  return {
    totalMinutes,
    totalDays,
    averageMinutesPerDay: totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0,
    mostWorkedTask,
    taskBreakdown,
  };
}

/**
 * Filter sessions by date range
 */
export function filterSessionsByDateRange(
  sessions: SessionsMap,
  startDate: string,
  endDate: string
): SessionsMap {
  const filtered: SessionsMap = {};

  Object.entries(sessions).forEach(([dateKey, dayData]) => {
    if (dateKey >= startDate && dateKey <= endDate) {
      filtered[dateKey] = dayData;
    }
  });

  return filtered;
}
