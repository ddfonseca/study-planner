/**
 * Relative time formatting utilities
 * Formats dates as relative timestamps in Portuguese
 * Examples: "há 5s", "há 2 min", "há 1 hora", "há 3 dias"
 */

/**
 * Time intervals in milliseconds
 */
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Format a date as relative time string in Portuguese
 * @param date The date to format (Date object, timestamp, or ISO string)
 * @param baseDate Optional base date for comparison (defaults to now)
 * @returns Relative time string (e.g., "há 5s", "há 2 min", "agora")
 */
export function formatRelativeTime(
  date: Date | number | string,
  baseDate: Date | number | string = new Date()
): string {
  const targetDate = toDate(date);
  const base = toDate(baseDate);
  const diff = base.getTime() - targetDate.getTime();

  // Future dates
  if (diff < 0) {
    return formatFutureTime(Math.abs(diff));
  }

  // Past dates
  return formatPastTime(diff);
}

/**
 * Convert input to Date object
 */
function toDate(input: Date | number | string): Date {
  if (input instanceof Date) {
    return input;
  }
  if (typeof input === 'number') {
    return new Date(input);
  }
  return new Date(input);
}

/**
 * Format time difference for past dates
 */
function formatPastTime(diff: number): string {
  if (diff < 5 * SECOND) {
    return 'agora';
  }

  if (diff < MINUTE) {
    const seconds = Math.floor(diff / SECOND);
    return `há ${seconds}s`;
  }

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `há ${minutes} min`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return hours === 1 ? 'há 1 hora' : `há ${hours} horas`;
  }

  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return days === 1 ? 'há 1 dia' : `há ${days} dias`;
  }

  if (diff < MONTH) {
    const weeks = Math.floor(diff / WEEK);
    return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`;
  }

  if (diff < YEAR) {
    const months = Math.floor(diff / MONTH);
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  }

  const years = Math.floor(diff / YEAR);
  return years === 1 ? 'há 1 ano' : `há ${years} anos`;
}

/**
 * Format time difference for future dates
 */
function formatFutureTime(diff: number): string {
  if (diff < 5 * SECOND) {
    return 'agora';
  }

  if (diff < MINUTE) {
    const seconds = Math.floor(diff / SECOND);
    return `em ${seconds}s`;
  }

  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `em ${minutes} min`;
  }

  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return hours === 1 ? 'em 1 hora' : `em ${hours} horas`;
  }

  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return days === 1 ? 'em 1 dia' : `em ${days} dias`;
  }

  if (diff < MONTH) {
    const weeks = Math.floor(diff / WEEK);
    return weeks === 1 ? 'em 1 semana' : `em ${weeks} semanas`;
  }

  if (diff < YEAR) {
    const months = Math.floor(diff / MONTH);
    return months === 1 ? 'em 1 mês' : `em ${months} meses`;
  }

  const years = Math.floor(diff / YEAR);
  return years === 1 ? 'em 1 ano' : `em ${years} anos`;
}

/**
 * Get the time unit for a given difference
 * Useful for determining update intervals
 */
export function getTimeUnit(diff: number): 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' {
  const absDiff = Math.abs(diff);

  if (absDiff < MINUTE) return 'second';
  if (absDiff < HOUR) return 'minute';
  if (absDiff < DAY) return 'hour';
  if (absDiff < WEEK) return 'day';
  if (absDiff < MONTH) return 'week';
  if (absDiff < YEAR) return 'month';
  return 'year';
}

/**
 * Get recommended update interval in milliseconds
 * for a relative time display
 */
export function getUpdateInterval(date: Date | number | string, baseDate: Date = new Date()): number {
  const targetDate = toDate(date);
  const diff = Math.abs(baseDate.getTime() - targetDate.getTime());

  if (diff < MINUTE) return SECOND; // Update every second
  if (diff < HOUR) return MINUTE; // Update every minute
  if (diff < DAY) return MINUTE * 5; // Update every 5 minutes
  return HOUR; // Update every hour
}
