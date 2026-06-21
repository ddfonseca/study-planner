/**
 * Cycle Editor Modal - Create/edit study cycle
 */
import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CycleItemComposer } from './CycleItemComposer';
import { useRecentTasks } from '@/hooks/useRecentTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { SortableCycleItem } from './SortableCycleItem';
import { RefreshCw, Trash2, Loader2, Save } from 'lucide-react';
import { useFocusCycleStore, formatDuration } from '@/store/focusCycleStore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useTaskStore } from '@/store/taskStore';
import { useProjectStore } from '@/store/projectStore';
import type { CreateCycleItemDto } from '@/types/api';

interface CycleEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit'; // 'create' for new cycle, 'edit' for editing active cycle
}

interface CycleItemForm extends CreateCycleItemDto {
  id: string; // Temporary ID for React key
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function CycleEditorModal({ open, onOpenChange, mode = 'edit' }: CycleEditorModalProps) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { cycle, cycles, isLoading, createCycle, updateCycle, deleteCycle, refresh } =
    useFocusCycleStore();
  const { getActiveTasks, findOrCreateTask } = useTaskStore();
  const { projects, fetchProjects, findOrCreateProject } = useProjectStore();
  const tasks = getActiveTasks();
  const { recentTasks, addRecentTask } = useRecentTasks();

  const [items, setItems] = useState<CycleItemForm[]>([]);
  const [cycleName, setCycleName] = useState('');
  const [activateOnCreate, setActivateOnCreate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch disciplines when modal opens
  useEffect(() => {
    if (open && currentWorkspaceId) {
      fetchProjects(currentWorkspaceId);
    }
  }, [open, currentWorkspaceId, fetchProjects]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // Determine if editing or creating
  const isEditing = mode === 'edit' && !!cycle;

  // Load existing cycle data when modal opens
  useEffect(() => {
    if (open && isEditing && cycle) {
      setCycleName(cycle.name || '');
      setItems(
        cycle.items.map((item) => ({
          id: item.id,
          taskId: item.taskId || undefined,
          projectId: item.projectId || undefined,
          targetMinutes: item.targetMinutes,
        }))
      );
      setActivateOnCreate(false);
    } else if (open && !isEditing) {
      setCycleName('');
      setItems([]);
      setActivateOnCreate(cycles.length === 0);
    }
  }, [open, isEditing, cycle, cycles.length]);

  const handleAddItem = (item: {
    taskId?: string;
    projectId?: string;
    targetMinutes: number;
  }) => {
    setItems((prev) => [...prev, { id: generateId(), ...item }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getItemName = (item: CycleItemForm): string => {
    if (item.projectId) {
      const project = projects.find((d) => d.id === item.projectId);
      return project?.name || item.projectId;
    }
    if (item.taskId) {
      const task = tasks.find((s) => s.id === item.taskId);
      return task?.name || item.taskId;
    }
    return 'Unknown';
  };

  const isItemDiscipline = (item: CycleItemForm): boolean => {
    return !!item.projectId;
  };

  const handleSave = async () => {
    if (!currentWorkspaceId || items.length === 0) return;
    if (!isEditing && !cycleName.trim()) return; // Name required for new cycles

    setIsSaving(true);
    try {
      if (isEditing) {
        const data = {
          name: cycleName.trim() || undefined,
          items: items.map(({ taskId, projectId, targetMinutes }) => ({
            taskId,
            projectId,
            targetMinutes,
          })),
        };
        await updateCycle(currentWorkspaceId, data);
      } else {
        const data = {
          name: cycleName.trim(),
          items: items.map(({ taskId, projectId, targetMinutes }) => ({
            taskId,
            projectId,
            targetMinutes,
          })),
          activateOnCreate,
        };
        await createCycle(currentWorkspaceId, data);
      }
      // Refresh all cycles
      if (currentWorkspaceId) {
        await refresh(currentWorkspaceId);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save cycle:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspaceId || !cycle) return;

    setIsDeleting(true);
    try {
      await deleteCycle(currentWorkspaceId);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete cycle:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate total duration
  const totalMinutes = items.reduce((acc, item) => acc + item.targetMinutes, 0);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent
        className="sm:max-w-lg"
        drawerClassName="max-h-[90dvh] overflow-hidden px-0 pb-0"
      >
        <ResponsiveDialogHeader className="shrink-0">
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {cycle ? 'Edit Cycle' : 'Create Focus Cycle'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="hidden sm:block">
            Set up the tasks/projects and work time for each. The cycle will
            suggest what to work on based on the defined order.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-4 py-2 sm:px-0">
          {/* Cycle name */}
          <div className="space-y-2">
            <Label htmlFor="cycleName">
              Cycle name {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="cycleName"
              placeholder="Ex: Senior Engineer"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              maxLength={50}
              required={!isEditing}
            />
          </div>

          {/* Activate on create checkbox (only for new cycles) */}
          {!isEditing && cycles.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="activateOnCreate"
                checked={activateOnCreate}
                onCheckedChange={(checked) => setActivateOnCreate(checked === true)}
              />
              <Label htmlFor="activateOnCreate" className="text-sm font-normal cursor-pointer">
                Activate this cycle on creation
              </Label>
            </div>
          )}

          {/* Add item form */}
          <div className="space-y-2">
            <Label>Add to cycle</Label>
            <CycleItemComposer
              tasks={tasks}
              projects={projects}
              recentTaskIds={recentTasks}
              onTaskUsed={addRecentTask}
              onCreateTask={
                currentWorkspaceId
                  ? (name) => findOrCreateTask(currentWorkspaceId, name)
                  : undefined
              }
              onCreateProject={
                currentWorkspaceId
                  ? (name) => findOrCreateProject(currentWorkspaceId, name)
                  : undefined
              }
              onAdd={handleAddItem}
            />
          </div>

          {/* Items list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cycle order</Label>
                <span className="text-xs text-muted-foreground">
                  Total: {formatDuration(totalMinutes)}
                </span>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {items.map((item, index) => (
                      <SortableCycleItem
                        key={item.id}
                        id={item.id}
                        index={index}
                        subjectName={getItemName(item)}
                        duration={formatDuration(item.targetMinutes)}
                        onRemove={() => handleRemoveItem(item.id)}
                        isDiscipline={isItemDiscipline(item)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add tasks or projects to create the cycle
            </p>
          )}
        </div>

        <ResponsiveDialogFooter className="shrink-0 flex-col gap-2 border-t px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] sm:flex-row sm:border-0 sm:px-0 sm:pt-0 sm:pb-0">
          {cycle && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isLoading}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <ConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title="Delete cycle"
            description="Are you sure you want to delete this cycle? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={handleDelete}
            isLoading={isDeleting}
            variant="destructive"
            icon={Trash2}
          />
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              items.length === 0 || isSaving || isLoading || (!isEditing && !cycleName.trim())
            }
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export default CycleEditorModal;
