/**
 * Task Store using Zustand
 */
import { create } from 'zustand';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  MergeTasksDto,
} from '@/types/api';
import { tasksApi } from '@/lib/api/tasks';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface TaskActions {
  fetchTasks: (workspaceId: string, includeArchived?: boolean) => Promise<void>;
  createTask: (workspaceId: string, data: CreateTaskDto) => Promise<Task>;
  findOrCreateTask: (workspaceId: string, name: string, projectId?: string) => Promise<Task>;
  updateTask: (taskId: string, data: UpdateTaskDto) => Promise<Task>;
  archiveTask: (taskId: string) => Promise<void>;
  unarchiveTask: (taskId: string) => Promise<void>;
  permanentDeleteTask: (taskId: string) => Promise<void>;
  mergeTasks: (data: MergeTasksDto) => Promise<Task>;
  reorderTasks: (workspaceId: string, taskIds: string[]) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  getTaskByName: (name: string) => Task | undefined;
  getActiveTasks: () => Task[];
  clearTasks: () => void;
  setError: (error: string | null) => void;
}

type TaskStore = TaskState & TaskActions;

export const useTaskStore = create<TaskStore>()((set, get) => ({
  // Initial state
  tasks: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentWorkspaceId: null,

  // Actions
  fetchTasks: async (workspaceId, includeArchived = false) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const rawTasks = await tasksApi.getAll(workspaceId, includeArchived);
      // Filter out any invalid tasks (safety check)
      const tasks = rawTasks.filter((s) => s && s.id && s.name);
      set({ tasks, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
      });
      throw error;
    }
  },

  createTask: async (workspaceId, data) => {
    try {
      set({ isSaving: true, error: null });
      const newTask = await tasksApi.create(workspaceId, data);

      set((state) => ({
        tasks: [...state.tasks, newTask].sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return newTask;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      });
      throw error;
    }
  },

  findOrCreateTask: async (workspaceId, name, projectId) => {
    // First check if already exists in local state
    const existing = get().tasks.find(
      (s) => s.name && s.name.toLowerCase() === name.toLowerCase() && !s.archivedAt
    );
    if (existing) return existing;

    try {
      set({ isSaving: true, error: null });

      // If projectId is provided, use create instead of findOrCreate
      // to set the project relationship
      const task = projectId
        ? await tasksApi.create(workspaceId, { name, projectId })
        : await tasksApi.findOrCreate(workspaceId, name);

      // Update local state
      set((state) => {
        const exists = state.tasks.find((s) => s.id === task.id);
        if (exists) {
          // Update existing (might have been unarchived)
          return {
            tasks: state.tasks
              .map((s) => (s.id === task.id ? task : s))
              .sort((a, b) => a.position - b.position),
            isSaving: false,
          };
        }
        return {
          tasks: [...state.tasks, task].sort((a, b) => a.position - b.position),
          isSaving: false,
        };
      });

      return task;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to find or create task',
      });
      throw error;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      set({ isSaving: true, error: null });
      const updatedTask = await tasksApi.update(taskId, data);

      set((state) => ({
        tasks: state.tasks
          .map((s) => (s.id === taskId ? updatedTask : s))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return updatedTask;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update task',
      });
      throw error;
    }
  },

  archiveTask: async (taskId) => {
    try {
      set({ isSaving: true, error: null });
      const archivedTask = await tasksApi.archive(taskId);

      set((state) => ({
        tasks: state.tasks.map((s) =>
          s.id === taskId ? archivedTask : s
        ),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to archive task',
      });
      throw error;
    }
  },

  unarchiveTask: async (taskId) => {
    try {
      set({ isSaving: true, error: null });
      const unarchivedTask = await tasksApi.unarchive(taskId);

      set((state) => ({
        tasks: state.tasks.map((s) =>
          s.id === taskId ? unarchivedTask : s
        ),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to unarchive task',
      });
      throw error;
    }
  },

  permanentDeleteTask: async (taskId) => {
    try {
      set({ isSaving: true, error: null });
      await tasksApi.permanentDelete(taskId);

      set((state) => ({
        tasks: state.tasks.filter((s) => s.id !== taskId),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to permanently delete task',
      });
      throw error;
    }
  },

  mergeTasks: async (data) => {
    try {
      set({ isSaving: true, error: null });
      const mergedTask = await tasksApi.merge(data);

      // Remove source tasks and update target
      set((state) => ({
        tasks: state.tasks
          .filter((s) => !data.sourceIds.includes(s.id))
          .map((s) => (s.id === data.targetId ? mergedTask : s))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return mergedTask;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to merge tasks',
      });
      throw error;
    }
  },

  reorderTasks: async (workspaceId, taskIds) => {
    // Optimistic update
    const previousTasks = get().tasks;
    const reorderedTasks = taskIds
      .map((id, index) => {
        const task = previousTasks.find((s) => s.id === id);
        return task ? { ...task, position: index } : null;
      })
      .filter((s): s is Task => s !== null);

    set({ tasks: reorderedTasks, isSaving: true, error: null });

    try {
      await tasksApi.reorder(workspaceId, { taskIds });
      set({ isSaving: false });
    } catch (error) {
      // Rollback on error
      set({
        tasks: previousTasks,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to reorder tasks',
      });
      throw error;
    }
  },

  getTaskById: (id) => {
    return get().tasks.find((s) => s.id === id);
  },

  getTaskByName: (name) => {
    return get().tasks.find(
      (s) => s.name && s.name.toLowerCase() === name.toLowerCase() && !s.archivedAt
    );
  },

  getActiveTasks: () => {
    return get().tasks.filter((s) => s && s.id && s.name && !s.archivedAt);
  },

  clearTasks: () => {
    set({
      tasks: [],
      currentWorkspaceId: null,
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },
}));

export default useTaskStore;
