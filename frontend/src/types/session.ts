/**
 * Session Types - Types for app state and UI
 */

// Individual work session in UI format
export interface WorkSessionUI {
  id: string;
  taskId: string; // task ID
  taskName: string; // task name
  minutes: number;
}

// Day data containing all sessions for a specific date
export interface DayData {
  totalMinutes: number;
  entries: WorkSessionUI[];
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
  mostWorkedTask: string | null;
  taskBreakdown: Record<string, number>;
}

// Task-specific analytics
export interface TaskStats {
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
