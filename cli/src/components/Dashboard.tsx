import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { WorkspacesApi, Workspace } from '../api/workspaces';
import { CyclesApi, CycleSuggestion } from '../api/cycles';
import { GoalsApi, WeeklyGoal } from '../api/goals';
import { SessionsApi, StudySession } from '../api/sessions';
import { formatMinutes, formatHours, progressBar, getWeekStart, formatDate } from '../utils/format';
import { SessionLog } from './SessionLog';
import { CycleView } from './CycleView';
import { Progress } from './Progress';
import { Timer } from './Timer';
import { CycleManager } from './CycleManager';
import { WorkspaceSelector } from './WorkspaceSelector';
import { User } from '../auth/session';
import { Layout } from './Layout';

interface DashboardProps {
  token: string;
  user: User;
  onLogout: () => void;
}

type View = 'menu' | 'log-session' | 'cycle' | 'progress' | 'timer' | 'cycle-manager' | 'workspace-selector';

interface MenuItem {
  label: string;
  value: string;
}

export function Dashboard({ token, user, onLogout }: DashboardProps) {
  const { exit } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>('menu');

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [suggestion, setSuggestion] = useState<CycleSuggestion | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal | null>(null);
  const [weeklyMinutes, setWeeklyMinutes] = useState(0);

  const client = getApiClient(token);
  const workspacesApi = new WorkspacesApi(client);
  const cyclesApi = new CyclesApi(client);
  const goalsApi = new GoalsApi(client);
  const sessionsApi = new SessionsApi(client);

  const loadData = async (forceWorkspaceId?: string) => {
    setLoading(true);
    setError(null);

    try {
      // Load workspaces
      const ws = await workspacesApi.list();
      setWorkspaces(ws);

      // Select workspace: use forced ID, keep current, or use default
      let targetWs: Workspace | undefined;
      if (forceWorkspaceId) {
        targetWs = ws.find((w) => w.id === forceWorkspaceId);
      } else if (selectedWorkspace) {
        targetWs = ws.find((w) => w.id === selectedWorkspace.id);
      }
      if (!targetWs) {
        targetWs = ws.find((w) => w.isDefault) || ws[0];
      }

      if (targetWs) {
        setSelectedWorkspace(targetWs);

        // Load cycle suggestion
        const sug = await cyclesApi.getSuggestion(targetWs.id);
        setSuggestion(sug);

        // Load weekly goal
        const weekStart = formatDate(getWeekStart());
        const goal = await goalsApi.get(weekStart, targetWs.id);
        setWeeklyGoal(goal);

        // Calculate weekly minutes
        const weekEnd = new Date(getWeekStart());
        weekEnd.setDate(weekEnd.getDate() + 6);
        const sessions = await sessionsApi.list({
          workspaceId: targetWs.id,
          startDate: weekStart,
          endDate: formatDate(weekEnd),
        });
        const total = sessions.reduce((acc, s) => acc + s.minutes, 0);
        setWeeklyMinutes(total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (currentView !== 'menu') {
        setCurrentView('menu');
        loadData();
      }
    }
    if (input === 'q' && currentView === 'menu') {
      exit();
    }
  });

  if (currentView === 'log-session' && selectedWorkspace) {
    return (
      <SessionLog
        token={token}
        workspace={selectedWorkspace}
        suggestion={suggestion}
        onBack={() => {
          setCurrentView('menu');
          loadData();
        }}
      />
    );
  }

  if (currentView === 'cycle' && selectedWorkspace) {
    return (
      <CycleView
        token={token}
        workspace={selectedWorkspace}
        onBack={() => {
          setCurrentView('menu');
          loadData();
        }}
      />
    );
  }

  if (currentView === 'progress' && selectedWorkspace) {
    return (
      <Progress
        token={token}
        workspace={selectedWorkspace}
        onBack={() => {
          setCurrentView('menu');
          loadData();
        }}
      />
    );
  }

  if (currentView === 'timer' && selectedWorkspace) {
    return (
      <Timer
        token={token}
        workspace={selectedWorkspace}
        suggestion={suggestion}
        onBack={() => {
          setCurrentView('menu');
          loadData();
        }}
      />
    );
  }

  if (currentView === 'cycle-manager' && selectedWorkspace) {
    return (
      <CycleManager
        token={token}
        workspace={selectedWorkspace}
        onBack={() => {
          setCurrentView('menu');
          loadData();
        }}
      />
    );
  }

  if (currentView === 'workspace-selector') {
    return (
      <WorkspaceSelector
        token={token}
        currentWorkspaceId={selectedWorkspace?.id || null}
        onSelect={(workspace) => {
          setSelectedWorkspace(workspace);
          setCurrentView('menu');
          loadData(workspace.id);
        }}
        onBack={() => {
          setCurrentView('menu');
        }}
      />
    );
  }

  const menuItems: MenuItem[] = [
    { label: 'Start Study Timer', value: 'timer' },
    { label: 'Log Study Session', value: 'log-session' },
    { label: 'View Study Cycle', value: 'cycle' },
    { label: 'Manage Cycles', value: 'cycle-manager' },
    { label: 'Weekly Progress', value: 'progress' },
    { label: 'Switch Workspace', value: 'workspace-selector' },
    { label: 'Logout', value: 'logout' },
    { label: 'Exit', value: 'exit' },
  ];

  const handleMenuSelect = (item: MenuItem) => {
    switch (item.value) {
      case 'timer':
        setCurrentView('timer');
        break;
      case 'log-session':
        setCurrentView('log-session');
        break;
      case 'cycle':
        setCurrentView('cycle');
        break;
      case 'cycle-manager':
        setCurrentView('cycle-manager');
        break;
      case 'progress':
        setCurrentView('progress');
        break;
      case 'workspace-selector':
        setCurrentView('workspace-selector');
        break;
      case 'logout':
        onLogout();
        break;
      case 'exit':
        exit();
        break;
    }
  };

  const targetMinutes = weeklyGoal ? weeklyGoal.targetHours * 60 : 0;

  return (
    <Layout token={token} workspaceId={selectedWorkspace?.id || null}>
      <Box flexDirection="column" padding={1}>
        {/* Header */}
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Study Planner CLI
          </Text>
          <Text> - </Text>
          <Text color="gray">{user.email}</Text>
        </Box>

        {loading ? (
          <Box>
            <Spinner type="dots" />
            <Text> Loading...</Text>
          </Box>
        ) : error ? (
          <Box flexDirection="column">
            <Text color="red">Error: {error}</Text>
            <Text color="gray">Press any key to retry</Text>
          </Box>
        ) : (
          <Box flexDirection="column">
            {/* Workspace Info */}
            <Box marginBottom={1} flexDirection="column">
              <Text>
                <Text bold>Workspace:</Text>{' '}
                <Text color="yellow">{selectedWorkspace?.name || 'None'}</Text>
              </Text>
            </Box>

            {/* Weekly Progress */}
            <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
              <Text bold color="green">
                This Week
              </Text>
              <Box>
                <Text>
                  {formatMinutes(weeklyMinutes)} / {formatHours(weeklyGoal?.targetHours || 0)}
                </Text>
              </Box>
              <Box>
                <Text>{progressBar(weeklyMinutes, targetMinutes, 30)}</Text>
              </Box>
            </Box>

            {/* Current Study Suggestion */}
            {suggestion?.hasCycle && suggestion.suggestion && (
              <Box marginBottom={1} flexDirection="column" borderStyle="round" paddingX={1}>
                <Text bold color="blue">
                  Next Up
                </Text>
                <Text>
                  <Text color="cyan">{suggestion.suggestion.currentSubject}</Text>
                  {' - '}
                  <Text>
                    {formatMinutes(suggestion.suggestion.remainingMinutes)} remaining
                  </Text>
                </Text>
                {suggestion.suggestion.isCurrentComplete && (
                  <Text color="green">Ready to advance to next subject!</Text>
                )}
              </Box>
            )}

            {/* Menu */}
            <Box flexDirection="column">
              <Box marginBottom={1}>
                <Text bold>Actions:</Text>
              </Box>
              <SelectInput items={menuItems} onSelect={handleMenuSelect} />
            </Box>

            {/* Footer */}
            <Box marginTop={1}>
              <Text color="gray">Press q to quit, ESC to go back</Text>
            </Box>
          </Box>
        )}
      </Box>
    </Layout>
  );
}
