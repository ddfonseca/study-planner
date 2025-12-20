/**
 * Data transformation utilities between backend and frontend formats
 */
import type { Session } from '@/types/api';
import type { SessionsMap, DayData, StudySession, StudyStats } from '@/types/session';

/**
 * Transform backend sessions array to app format (grouped by date)
 */
export function transformSessionsToAppFormat(sessions: Session[]): SessionsMap {
  const data: SessionsMap = {};

  sessions.forEach((session) => {
    // Ensure date is in YYYY-MM-DD format
    const dateKey = session.date.split('T')[0];

    if (!data[dateKey]) {
      data[dateKey] = {
        totalMinutos: 0,
        materias: [],
      };
    }

    data[dateKey].materias.push({
      id: session.id,
      materia: session.subject,
      minutos: session.minutes,
    });

    data[dateKey].totalMinutos += session.minutes;
  });

  return data;
}

/**
 * Transform a single session from backend to UI format
 */
export function transformSessionToUI(session: Session): StudySession {
  return {
    id: session.id,
    materia: session.subject,
    minutos: session.minutes,
  };
}

/**
 * Get DayData for a specific date, or empty data if not found
 */
export function getDayData(sessions: SessionsMap, dateKey: string): DayData {
  return sessions[dateKey] || { totalMinutos: 0, materias: [] };
}

/**
 * Calculate study statistics from sessions
 */
export function calculateStats(sessions: SessionsMap): StudyStats {
  const subjectBreakdown: Record<string, number> = {};
  let totalMinutes = 0;
  let totalDays = 0;

  Object.values(sessions).forEach((dayData) => {
    if (dayData.totalMinutos > 0) {
      totalDays++;
      totalMinutes += dayData.totalMinutos;

      dayData.materias.forEach((materia) => {
        subjectBreakdown[materia.materia] =
          (subjectBreakdown[materia.materia] || 0) + materia.minutos;
      });
    }
  });

  // Find most studied subject
  let mostStudiedSubject: string | null = null;
  let maxMinutes = 0;

  Object.entries(subjectBreakdown).forEach(([subject, minutes]) => {
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      mostStudiedSubject = subject;
    }
  });

  return {
    totalMinutes,
    totalDays,
    averageMinutesPerDay: totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0,
    mostStudiedSubject,
    subjectBreakdown,
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
