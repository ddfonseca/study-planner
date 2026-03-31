/**
 * Project Store using Zustand
 */
import { create } from 'zustand';
import type { Project, CreateProjectDto, UpdateProjectDto } from '@/types/api';
import { projectsApi } from '@/lib/api/projects';

interface ProjectState {
  projects: Project[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface ProjectActions {
  fetchProjects: (workspaceId: string) => Promise<void>;
  createProject: (workspaceId: string, data: CreateProjectDto) => Promise<Project>;
  updateProject: (projectId: string, data: UpdateProjectDto) => Promise<Project>;
  addTasksToProject: (projectId: string, taskIds: string[]) => Promise<Project>;
  removeTasksFromProject: (projectId: string, taskIds: string[]) => Promise<Project>;
  reorderProjects: (workspaceId: string, orderedIds: string[]) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  getProjectById: (id: string) => Project | undefined;
  getProjectByName: (name: string) => Project | undefined;
  findOrCreateProject: (workspaceId: string, name: string) => Promise<Project>;
  clearProjects: () => void;
  setError: (error: string | null) => void;
}

type ProjectStore = ProjectState & ProjectActions;

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  // Initial state
  projects: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentWorkspaceId: null,

  // Actions
  fetchProjects: async (workspaceId) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const projects = await projectsApi.getAll(workspaceId);
      set({ projects, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      });
      throw error;
    }
  },

  createProject: async (workspaceId, data) => {
    try {
      set({ isSaving: true, error: null });
      const newProject = await projectsApi.create(workspaceId, data);

      set((state) => ({
        projects: [...state.projects, newProject].sort(
          (a, b) => a.position - b.position
        ),
        isSaving: false,
      }));

      return newProject;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create project',
      });
      throw error;
    }
  },

  updateProject: async (projectId, data) => {
    try {
      set({ isSaving: true, error: null });
      const updatedProject = await projectsApi.update(projectId, data);

      set((state) => ({
        projects: state.projects
          .map((d) => (d.id === projectId ? updatedProject : d))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return updatedProject;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update project',
      });
      throw error;
    }
  },

  addTasksToProject: async (projectId, taskIds) => {
    try {
      set({ isSaving: true, error: null });
      const updatedProject = await projectsApi.addTasks(projectId, taskIds);

      set((state) => ({
        projects: state.projects.map((d) =>
          d.id === projectId ? updatedProject : d
        ),
        isSaving: false,
      }));

      return updatedProject;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to add tasks to project',
      });
      throw error;
    }
  },

  removeTasksFromProject: async (projectId, taskIds) => {
    try {
      set({ isSaving: true, error: null });
      const updatedProject = await projectsApi.removeTasks(projectId, taskIds);

      set((state) => ({
        projects: state.projects.map((d) =>
          d.id === projectId ? updatedProject : d
        ),
        isSaving: false,
      }));

      return updatedProject;
    } catch (error) {
      set({
        isSaving: false,
        error:
          error instanceof Error ? error.message : 'Failed to remove tasks from project',
      });
      throw error;
    }
  },

  reorderProjects: async (workspaceId, orderedIds) => {
    try {
      set({ isSaving: true, error: null });
      const reorderedProjects = await projectsApi.reorder(workspaceId, orderedIds);

      set({
        projects: reorderedProjects,
        isSaving: false,
      });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to reorder projects',
      });
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    try {
      set({ isSaving: true, error: null });
      await projectsApi.delete(projectId);

      set((state) => ({
        projects: state.projects.filter((d) => d.id !== projectId),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to delete project',
      });
      throw error;
    }
  },

  getProjectById: (id) => {
    return get().projects.find((d) => d.id === id);
  },

  getProjectByName: (name) => {
    return get().projects.find(
      (d) => d.name && d.name.toLowerCase() === name.toLowerCase()
    );
  },

  findOrCreateProject: async (workspaceId, name) => {
    const existing = get().getProjectByName(name);
    if (existing) return existing;
    return get().createProject(workspaceId, { name });
  },

  clearProjects: () => {
    set({
      projects: [],
      currentWorkspaceId: null,
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },
}));

export default useProjectStore;
