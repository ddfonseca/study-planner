import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { getApiClient } from '../api/client';
import { WorkspacesApi, Workspace } from '../api/workspaces';

interface WorkspaceSelectorProps {
  token: string;
  currentWorkspaceId: string | null;
  onSelect: (workspace: Workspace) => void;
  onBack: () => void;
}

export function WorkspaceSelector({ token, currentWorkspaceId, onSelect, onBack }: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = getApiClient(token);
  const workspacesApi = new WorkspacesApi(client);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await workspacesApi.list();
      setWorkspaces(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  const handleSelect = (item: { value: string }) => {
    const workspace = workspaces.find((w) => w.id === item.value);
    if (workspace) {
      onSelect(workspace);
    }
  };

  if (loading) {
    return (
      <Box padding={1}>
        <Spinner type="dots" />
        <Text> Loading workspaces...</Text>
      </Box>
    );
  }

  const workspaceItems = workspaces.map((w) => ({
    label: w.id === currentWorkspaceId
      ? `> ${w.name}${w.isDefault ? ' (default)' : ''} [current]`
      : `  ${w.name}${w.isDefault ? ' (default)' : ''}`,
    value: w.id,
  }));

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Switch Workspace
        </Text>
      </Box>

      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      <Box marginBottom={1}>
        <Text bold>Select a workspace:</Text>
      </Box>

      <SelectInput items={workspaceItems} onSelect={handleSelect} />

      <Box marginTop={1}>
        <Text color="gray">Press ESC to go back</Text>
      </Box>
    </Box>
  );
}
