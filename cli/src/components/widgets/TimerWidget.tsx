import React from 'react';
import { Box, Text } from 'ink';
import { useTimer } from '../../context/TimerContext';
import { progressBar, truncate } from '../../utils/format';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TimerWidget() {
  const { state } = useTimer();

  if (!state.isRunning && state.remainingSeconds === 0 && !state.subject) {
    return (
      <Box flexDirection="column" borderStyle="round" paddingX={1}>
        <Box>
          <Text bold color="gray">TIMER</Text>
        </Box>
        <Text color="gray">No timer active</Text>
      </Box>
    );
  }

  const elapsed = state.totalSeconds - state.remainingSeconds;
  const percentage = state.totalSeconds > 0 ? Math.round((elapsed / state.totalSeconds) * 100) : 0;
  const isCompleted = state.remainingSeconds === 0 && state.totalSeconds > 0;

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color={isCompleted ? 'green' : 'cyan'}>TIMER</Text>
        <Text color={state.isPaused ? 'yellow' : isCompleted ? 'green' : 'gray'}>
          {isCompleted ? 'DONE' : state.isPaused ? 'PAUSE' : 'RUN'}
        </Text>
      </Box>

      <Box justifyContent="center" marginY={1}>
        <Text bold color={state.isPaused ? 'yellow' : isCompleted ? 'green' : state.remainingSeconds <= 60 ? 'red' : 'white'}>
          {formatTime(state.remainingSeconds)}
        </Text>
      </Box>

      <Text>{progressBar(elapsed, state.totalSeconds, 20)}</Text>

      <Text color="cyan">{truncate(state.subject, 24)}</Text>
    </Box>
  );
}
