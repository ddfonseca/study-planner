/**
 * Time formatting utilities
 */

/**
 * Pomodoro duration in minutes
 */
export const POMODORO_MINUTES = 25;

/**
 * Convert minutes to pomodoros (floor)
 * Example: 150 -> 6
 */
export function minutesToPomodoros(minutes: number): number {
  return Math.floor(minutes / POMODORO_MINUTES);
}

/**
 * Format minutes as pomodoros with emoji
 * Example: 200 -> "8 🍅"
 */
export function formatPomodoros(minutes: number): string {
  const pomodoros = minutesToPomodoros(minutes);
  return `${pomodoros} 🍅`;
}

/**
 * Convert hours to pomodoros
 * Example: 10 -> 24
 */
export function hoursToPomodoros(hours: number): number {
  return Math.floor((hours * 60) / POMODORO_MINUTES);
}

/**
 * Format minutes to hours and minutes string
 * Example: 150 -> "2h 30m"
 */
export function formatTime(minutes: number): string {
  if (minutes === 0) return '0m';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}

/**
 * Format minutes to hours with decimal
 * Example: 150 -> "2.5h"
 */
export function formatHoursDecimal(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

/**
 * Convert minutes to hours (decimal)
 */
export function minutesToHours(minutes: number): number {
  return minutes / 60;
}

/**
 * Convert hours to minutes
 */
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

/**
 * Parse time input string to minutes
 * Accepts: "2h", "30m", "2h 30m", "2:30", "150"
 */
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();

  // Try parsing as plain number (minutes)
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // Try parsing as hours only (e.g., "2h")
  const hoursOnly = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/);
  if (hoursOnly) {
    return Math.round(parseFloat(hoursOnly[1]) * 60);
  }

  // Try parsing as minutes only (e.g., "30m")
  const minsOnly = trimmed.match(/^(\d+)\s*m$/);
  if (minsOnly) {
    return parseInt(minsOnly[1], 10);
  }

  // Try parsing as hours and minutes (e.g., "2h 30m")
  const hoursAndMins = trimmed.match(/^(\d+)\s*h\s*(\d+)\s*m$/);
  if (hoursAndMins) {
    return parseInt(hoursAndMins[1], 10) * 60 + parseInt(hoursAndMins[2], 10);
  }

  // Try parsing as HH:MM format
  const colonFormat = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (colonFormat) {
    return parseInt(colonFormat[1], 10) * 60 + parseInt(colonFormat[2], 10);
  }

  return null;
}

/**
 * Check if minutes meet minimum hours requirement
 */
export function meetsMinimumHours(minutes: number, minHours: number): boolean {
  return minutes >= hoursToMinutes(minHours);
}

/**
 * Check if minutes meet desired hours requirement
 */
export function meetsDesiredHours(minutes: number, desHours: number): boolean {
  return minutes >= hoursToMinutes(desHours);
}
