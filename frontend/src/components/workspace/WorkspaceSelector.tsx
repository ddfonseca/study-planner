/**
 * Workspace Selector Component
 * Dropdown to switch between workspaces in the header
 */
import { useEffect } from 'react';
import { Layers } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWorkspaceStore } from '@/store/workspaceStore';

export function WorkspaceSelector() {
  const {
    workspaces,
    currentWorkspaceId,
    isLoading,
    fetchWorkspaces,
    setCurrentWorkspace,
  } = useWorkspaceStore();

  // Fetch workspaces on mount
  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleValueChange = (value: string) => {
    // "all" means consolidated view (null in store)
    setCurrentWorkspace(value === 'all' ? null : value);
  };

  // Display value for the select
  const currentValue = currentWorkspaceId || 'all';
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  if (isLoading && workspaces.length === 0) {
    return (
      <div className="w-[180px] h-9 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <Select value={currentValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px] bg-background">
        <SelectValue>
          <div className="flex items-center gap-2">
            {currentWorkspaceId && currentWorkspace ? (
              <>
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: currentWorkspace.color || '#6366f1' }}
                />
                <span className="truncate">{currentWorkspace.name}</span>
              </>
            ) : (
              <>
                <Layers className="h-4 w-4 shrink-0" />
                <span>Todos</span>
              </>
            )}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* "All" option for consolidated view */}
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span>Todos</span>
          </div>
        </SelectItem>

        {workspaces.length > 0 && <SelectSeparator />}

        {/* Individual workspaces */}
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id}>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: workspace.color || '#6366f1' }}
              />
              <span className="truncate">{workspace.name}</span>
              {workspace.isDefault && (
                <span className="text-xs text-muted-foreground ml-1">
                  (Padrão)
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default WorkspaceSelector;
