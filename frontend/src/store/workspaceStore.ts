/**
 * Workspace Store using Zustand
 * Manages workspace selection and CRUD operations
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '@/types/api';
import { workspacesApi } from '@/lib/api/workspaces';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null; // null means "all" (consolidated view)
  isLoading: boolean;
  error: string | null;
}

interface WorkspaceActions {
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (id: string | null) => void;
  createWorkspace: (data: CreateWorkspaceDto) => Promise<Workspace>;
  updateWorkspace: (id: string, data: UpdateWorkspaceDto) => Promise<Workspace>;
  deleteWorkspace: (id: string, moveToDefault: boolean) => Promise<void>;
  getCurrentWorkspace: () => Workspace | null;
  getDefaultWorkspace: () => Workspace | undefined;
  clearWorkspaces: () => void;
}

type WorkspaceStore = WorkspaceState & WorkspaceActions;

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      workspaces: [],
      currentWorkspaceId: null,
      isLoading: false,
      error: null,

      // Actions
      fetchWorkspaces: async () => {
        try {
          set({ isLoading: true, error: null });
          const workspaces = await workspacesApi.getAll();

          // If no current workspace is set, set the default one
          const { currentWorkspaceId } = get();
          const defaultWorkspace = workspaces.find((w) => w.isDefault);

          set({
            workspaces,
            // Only set default if currentWorkspaceId is not set and we have workspaces
            currentWorkspaceId:
              currentWorkspaceId ||
              (defaultWorkspace?.id ?? (workspaces[0]?.id || null)),
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch workspaces',
          });
          throw error;
        }
      },

      setCurrentWorkspace: (id) => {
        set({ currentWorkspaceId: id });
      },

      createWorkspace: async (data) => {
        const { workspaces } = get();

        try {
          set({ isLoading: true, error: null });
          const newWorkspace = await workspacesApi.create(data);

          set({
            workspaces: [...workspaces, newWorkspace],
            isLoading: false,
          });

          return newWorkspace;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to create workspace',
          });
          throw error;
        }
      },

      updateWorkspace: async (id, data) => {
        try {
          set({ isLoading: true, error: null });
          const updatedWorkspace = await workspacesApi.update(id, data);

          const { workspaces } = get();
          set({
            workspaces: workspaces.map((w) =>
              w.id === id ? updatedWorkspace : w
            ),
            isLoading: false,
          });

          return updatedWorkspace;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update workspace',
          });
          throw error;
        }
      },

      deleteWorkspace: async (id, moveToDefault) => {
        const { workspaces, currentWorkspaceId } = get();
        const workspace = workspaces.find((w) => w.id === id);

        if (workspace?.isDefault) {
          throw new Error('Cannot delete the default workspace');
        }

        try {
          set({ isLoading: true, error: null });
          await workspacesApi.delete(id, moveToDefault);

          const updatedWorkspaces = workspaces.filter((w) => w.id !== id);
          const defaultWorkspace = updatedWorkspaces.find((w) => w.isDefault);

          set({
            workspaces: updatedWorkspaces,
            // If deleted workspace was current, switch to default
            currentWorkspaceId:
              currentWorkspaceId === id
                ? (defaultWorkspace?.id ?? null)
                : currentWorkspaceId,
            isLoading: false,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to delete workspace',
          });
          throw error;
        }
      },

      getCurrentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        if (!currentWorkspaceId) return null;
        return workspaces.find((w) => w.id === currentWorkspaceId) || null;
      },

      getDefaultWorkspace: () => {
        const { workspaces } = get();
        return workspaces.find((w) => w.isDefault);
      },

      clearWorkspaces: () => {
        set({
          workspaces: [],
          currentWorkspaceId: null,
          error: null,
        });
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
      }),
    }
  )
);

export default useWorkspaceStore;
