/**
 * Session Types - Types for app state and UI
 */

// Individual study session in UI format
export interface StudySession {
  id: string;
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

// Config for minimum and desired hours
export interface Config {
  minHours: number;
  desHours: number;
}

// Calendar cell status based on study time
export type CellStatus = 'empty' | 'below' | 'minimum' | 'desired';

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
