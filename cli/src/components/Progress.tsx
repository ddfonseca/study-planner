import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { SessionsApi, StudySession } from '../api/sessions';
import { GoalsApi, WeeklyGoal } from '../api/goals';
import { Workspace } from '../api/workspaces';
import {
  formatMinutes,
  formatHours,
  formatDate,
  formatDateDisplay,
  getWeekStart,
  progressBar,
  padRight,
  padLeft,
} from '../utils/format';

interface ProgressProps {
  token: string;
  workspace: Workspace;
  onBack: () => void;
}

interface DailySummary {
  date: Date;
  minutes: number;
  subjects: Map<string, number>;
}

export function Progress({ token, workspace, onBack }: ProgressProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);

  const client = getApiClient(token);
  const sessionsApi = new SessionsApi(client);
  const goalsApi = new GoalsApi(client);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const weekStart = getWeekStart();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const [goal, sessionList] = await Promise.all([
        goalsApi.get(formatDate(weekStart), workspace.id),
        sessionsApi.list({
          workspaceId: workspace.id,
          startDate: formatDate(weekStart),
          endDate: formatDate(weekEnd),
        }),
      ]);

      setWeeklyGoal(goal);
      setSessions(sessionList);

      // Build daily summaries
      const summaries: DailySummary[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        const dateStr = formatDate(date);

        const daySessions = sessionList.filter(
          (s) => s.date.split('T')[0] === dateStr
        );

        const subjects = new Map<string, number>();
        let totalMinutes = 0;

        for (const session of daySessions) {
          const current = subjects.get(session.subject) || 0;
          subjects.set(session.subject, current + session.minutes);
          totalMinutes += session.minutes;
        }

        summaries.push({ date, minutes: totalMinutes, subjects });
      }

      setDailySummaries(summaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner type="dots" />
        <Text> Loading progress...</Text>
      </Box>
    );
  }

  const totalMinutes = sessions.reduce((acc, s) => acc + s.minutes, 0);
  const targetMinutes = weeklyGoal ? weeklyGoal.targetHours * 60 : 0;
  const percentage = targetMinutes > 0 ? Math.round((totalMinutes / targetMinutes) * 100) : 0;

  // Get unique subjects with totals
  const subjectTotals = new Map<string, number>();
  for (const session of sessions) {
    const current = subjectTotals.get(session.subject) || 0;
    subjectTotals.set(session.subject, current + session.minutes);
  }

  // Sort subjects by time spent
  const sortedSubjects = Array.from(subjectTotals.entries()).sort((a, b) => b[1] - a[1]);

  // Calculate max bar width for ASCII chart
  const maxMinutes = Math.max(...dailySummaries.map((d) => d.minutes), 1);
  const barScale = 20; // max bar width

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Weekly Progress
        </Text>
        <Text> - </Text>
        <Text color="yellow">{workspace.name}</Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {/* Weekly Summary */}
      <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
        <Text bold color="green">
          Week of {formatDateDisplay(getWeekStart())}
        </Text>
        <Text>
          Total: <Text color="cyan" bold>{formatMinutes(totalMinutes)}</Text>
          {' / '}
          <Text>{formatHours(weeklyGoal?.targetHours || 0)}</Text>
          {' '}
          <Text color={percentage >= 100 ? 'green' : percentage >= 50 ? 'yellow' : 'red'}>
            ({percentage}%)
          </Text>
        </Text>
        <Text>{progressBar(totalMinutes, targetMinutes, 35)}</Text>
      </Box>

      {/* Daily Breakdown Chart */}
      <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
        <Text bold>Daily Breakdown</Text>
        {dailySummaries.map((day) => {
          const barWidth = Math.round((day.minutes / maxMinutes) * barScale);
          const today = formatDate(new Date()) === formatDate(day.date);

          return (
            <Box key={formatDate(day.date)}>
              <Text color={today ? 'cyan' : 'white'}>
                {padRight(formatDateDisplay(day.date), 12)}
              </Text>
              <Text color="green">{'█'.repeat(barWidth)}</Text>
              <Text color="gray">{'░'.repeat(barScale - barWidth)}</Text>
              <Text> {padLeft(formatMinutes(day.minutes), 8)}</Text>
            </Box>
          );
        })}
      </Box>

      {/* Subject Breakdown */}
      {sortedSubjects.length > 0 && (
        <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
          <Text bold>By Subject</Text>
          {sortedSubjects.map(([subject, minutes]) => {
            const subjectPercentage = Math.round((minutes / totalMinutes) * 100);
            return (
              <Box key={subject}>
                <Text>{padRight(subject, 20)}</Text>
                <Text color="cyan">{padLeft(formatMinutes(minutes), 8)}</Text>
                <Text color="gray"> ({subjectPercentage}%)</Text>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Stats */}
      <Box marginBottom={1} flexDirection="column">
        <Text color="gray">
          {sessions.length} sessions this week
          {sessions.length > 0 && (
            <Text>
              {' • '}
              Avg: {formatMinutes(Math.round(totalMinutes / sessions.length))} per session
            </Text>
          )}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
}
