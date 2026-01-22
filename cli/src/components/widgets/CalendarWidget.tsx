import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { getApiClient } from '../../api/client';
import { SessionsApi, StudySession } from '../../api/sessions';
import { formatDate } from '../../utils/format';

interface CalendarWidgetProps {
  token: string;
  workspaceId: string;
}

const MONTH_NAMES = [
  'JANEIRO', 'FEVEREIRO', 'MARCO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const WEEKDAY_HEADERS = 'D  S  T  Q  Q  S  S';

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getDaysInMonth(date: Date): number {
  return getMonthEnd(date).getDate();
}

function getFirstDayOfWeek(date: Date): number {
  // Returns 0 (Sunday) to 6 (Saturday)
  return getMonthStart(date).getDay();
}

export function CalendarWidget({ token, workspaceId }: CalendarWidgetProps) {
  const [sessionDays, setSessionDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const client = getApiClient(token);
        const sessionsApi = new SessionsApi(client);

        const monthStart = getMonthStart(today);
        const monthEnd = getMonthEnd(today);

        const sessions = await sessionsApi.list({
          workspaceId,
          startDate: formatDate(monthStart),
          endDate: formatDate(monthEnd),
        });

        // Extract days that have sessions
        const days = new Set<number>();
        sessions.forEach((session) => {
          const sessionDate = new Date(session.date);
          if (sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear) {
            days.add(sessionDate.getDate());
          }
        });
        setSessionDays(days);
      } catch {
        // Silently fail - widget is informational
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
    // Refresh every 60 seconds
    const interval = setInterval(loadSessions, 60000);
    return () => clearInterval(interval);
  }, [token, workspaceId, currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(today);
  const firstDayOfWeek = getFirstDayOfWeek(today);

  // Build calendar grid
  const weeks: (number | null)[][] = [];
  let currentWeek: (number | null)[] = [];

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Add remaining empty cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const monthName = MONTH_NAMES[currentMonth];

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold color="magenta">{monthName} {currentYear}</Text>
      <Text color="gray">{WEEKDAY_HEADERS}</Text>
      {weeks.map((week, weekIndex) => (
        <Box key={weekIndex}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <Text key={dayIndex}>{'   '}</Text>;
            }

            const isToday = day === currentDay;
            const hasSession = sessionDays.has(day);
            const dayStr = day.toString().padStart(2, ' ');

            if (isToday) {
              return (
                <Text key={dayIndex} inverse bold>
                  {dayStr}{' '}
                </Text>
              );
            }

            return (
              <Text key={dayIndex} color={hasSession ? 'green' : 'white'}>
                {dayStr}{' '}
              </Text>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
