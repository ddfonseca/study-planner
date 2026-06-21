/**
 * CycleItemComposer - Inline task/project + minutes picker for the cycle editor.
 *
 * Replaces the old nested-drawer flow (TaskPicker/ProjectPicker opening their
 * own drawers on top of the cycle drawer) with a single inline surface, so
 * there is no modal-behind-modal and no screen shift. Minutes are chosen with
 * preset chips + a stepper, so the on-screen keyboard is never required.
 */
import { useMemo, useState } from 'react';
import { Search, Plus, X, Check, BookOpen, Layers, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task, Project } from '@/types/api';

const MINUTE_PRESETS = [15, 25, 30, 45, 60, 90];
const MIN_MINUTES = 5;
const MAX_MINUTES = 1440;
const STEP = 5;

type ItemType = 'task' | 'project';

interface SelectedItem {
  id: string;
  name: string;
  color?: string | null;
}

export interface CycleItemComposerProps {
  tasks: Task[];
  projects: Project[];
  recentTaskIds: string[];
  onTaskUsed: (id: string) => void;
  /** Create a task by name. Returns the created task. */
  onCreateTask?: (name: string) => Promise<Task>;
  /** Create a project by name. Returns the created project. */
  onCreateProject?: (name: string) => Promise<Project>;
  /** Add the chosen item to the cycle. */
  onAdd: (item: { taskId?: string; projectId?: string; targetMinutes: number }) => void;
}

const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function CycleItemComposer({
  tasks,
  projects,
  recentTaskIds,
  onTaskUsed,
  onCreateTask,
  onCreateProject,
  onAdd,
}: CycleItemComposerProps) {
  const [type, setType] = useState<ItemType>('task');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [minutes, setMinutes] = useState<number>(30);
  const [isCreating, setIsCreating] = useState(false);

  const source: SelectedItem[] = type === 'task' ? tasks : projects;

  const matches = useMemo(() => {
    const q = normalize(search.trim());
    if (!q) return source;
    return source.filter((item) => normalize(item.name).includes(q));
  }, [source, search]);

  const recents = useMemo(() => {
    if (type !== 'task' || search.trim()) return [];
    const byId = new Map(tasks.map((t) => [t.id, t]));
    return recentTaskIds
      .map((id) => byId.get(id))
      .filter((t): t is Task => !!t);
  }, [type, search, tasks, recentTaskIds]);

  const exactMatch = source.some(
    (item) => normalize(item.name) === normalize(search.trim())
  );
  const canCreate =
    !!search.trim() &&
    !exactMatch &&
    (type === 'task' ? !!onCreateTask : !!onCreateProject);

  const resetSelection = () => {
    setSelected(null);
    setSearch('');
  };

  const switchType = (next: ItemType) => {
    if (next === type) return;
    setType(next);
    resetSelection();
  };

  const handleSelect = (item: SelectedItem) => {
    setSelected(item);
    setSearch('');
    if (type === 'task') onTaskUsed(item.id);
  };

  const handleCreate = async () => {
    const name = search.trim();
    if (!name || isCreating) return;
    setIsCreating(true);
    try {
      if (type === 'task' && onCreateTask) {
        const created = await onCreateTask(name);
        onTaskUsed(created.id);
        setSelected({ id: created.id, name: created.name, color: created.color });
        setSearch('');
      } else if (type === 'project' && onCreateProject) {
        const created = await onCreateProject(name);
        setSelected({ id: created.id, name: created.name, color: created.color });
        setSearch('');
      }
    } catch (error) {
      console.error('Failed to create item:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const adjustMinutes = (delta: number) => {
    setMinutes((m) => Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, m + delta)));
  };

  const handleAdd = () => {
    if (!selected || minutes < MIN_MINUTES) return;
    onAdd(
      type === 'task'
        ? { taskId: selected.id, targetMinutes: minutes }
        : { projectId: selected.id, targetMinutes: minutes }
    );
    setSelected(null);
    setSearch('');
    setMinutes(30);
  };

  return (
    <div className="space-y-3">
      {/* Type segmented toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {(['task', 'project'] as const).map((t) => {
          const Icon = t === 'task' ? BookOpen : Layers;
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => switchType(t)}
              className={cn(
                'flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {t === 'task' ? 'Task' : 'Project'}
            </button>
          );
        })}
      </div>

      {selected ? (
        /* Selected item + minutes */
        <div className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              {selected.color && (
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: selected.color }}
                />
              )}
              <span className="truncate font-medium">{selected.name}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-2 text-muted-foreground"
              onClick={resetSelection}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Change
            </Button>
          </div>

          {/* Minutes presets */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {MINUTE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMinutes(preset)}
                  className={cn(
                    'min-h-[36px] rounded-full border px-3 text-sm font-medium transition-colors',
                    minutes === preset
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-accent'
                  )}
                >
                  {preset}m
                </button>
              ))}
            </div>

            {/* Fine-tune stepper */}
            <div className="flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => adjustMinutes(-STEP)}
                disabled={minutes <= MIN_MINUTES}
                aria-label="Decrease minutes"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="min-w-[5rem] text-center">
                <span className="text-2xl font-bold tabular-nums">{minutes}</span>
                <span className="ml-1 text-sm text-muted-foreground">min</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => adjustMinutes(STEP)}
                disabled={minutes >= MAX_MINUTES}
                aria-label="Increase minutes"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button type="button" className="w-full" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add to cycle
          </Button>
        </div>
      ) : (
        /* Search + inline list */
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border px-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={type === 'task' ? 'Search or create a task...' : 'Search or create a project...'}
              className="h-11 w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="shrink-0 text-muted-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border p-1">
            {recents.length > 0 && (
              <>
                <p className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">
                  Recent
                </p>
                {recents.map((item) => (
                  <ListRow key={`recent-${item.id}`} item={item} onSelect={handleSelect} />
                ))}
                <div className="my-1 border-t" />
              </>
            )}

            {matches.length > 0 ? (
              matches.map((item) => (
                <ListRow key={item.id} item={item} onSelect={handleSelect} />
              ))
            ) : !canCreate ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {type === 'task' ? 'No tasks found' : 'No projects found'}
              </p>
            ) : null}

            {canCreate && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-primary transition-colors hover:bg-accent',
                  isCreating && 'cursor-not-allowed opacity-50'
                )}
              >
                <Plus className="h-4 w-4" />
                {isCreating ? 'Creating...' : `Create "${search.trim()}"`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ListRow({
  item,
  onSelect,
}: {
  item: SelectedItem;
  onSelect: (item: SelectedItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-2.5 text-left text-sm transition-colors hover:bg-accent"
    >
      {item.color && (
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: item.color }}
        />
      )}
      <span className="flex-1 truncate">{item.name}</span>
      <Check className="invisible h-4 w-4" />
    </button>
  );
}

export default CycleItemComposer;
