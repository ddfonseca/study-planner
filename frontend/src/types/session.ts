/**
 * Session Types - Types for app state and UI
 */

// Individual study session in UI format
export interface StudySession {
  id: string;
  subjectId: string; // subject ID
  materia: string; // subject name in Portuguese
  minutos: number; // minutes in Portuguese
}

// Day data containing all sessions for a specific date
export interface DayData {
  totalMinutos: number;
  materias: StudySession[];
}

// Sessions organized by date (YYYY-MM-DD)
export type SessionsMap = Record<string, DayData>;

// Calendar cell intensity based on study time (0-4 for heatmap)
export type CellIntensity = 0 | 1 | 2 | 3 | 4;

// Date range for filtering
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Stats for dashboard
export interface StudyStats {
  totalMinutes: number;
  totalDays: number;
  averageMinutesPerDay: number;
  mostStudiedSubject: string | null;
  subjectBreakdown: Record<string, number>;
}

// Subject-specific analytics
export interface SubjectStats {
  subject: string;
  totalMinutes: number;
  totalSessions: number;
  averageSessionMinutes: number;
  weeklyAverageMinutes: number;
  percentageOfTotal: number;
}

// Trend data point for charts
export interface TrendPoint {
  date: string;
  minutes: number;
}

// Weekday average for charts
export interface WeekdayAverage {
  weekday: string;
  dayIndex: number;
  averageMinutes: number;
}
