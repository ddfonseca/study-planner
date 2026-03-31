/**
 * Projects API
 */
import { apiClient } from './client';
import type {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
} from '@/types/api';

export const projectsApi = {
  /**
   * Get all projects for a workspace
   */
  async getAll(workspaceId: string): Promise<Project[]> {
    return apiClient.get<Project[]>(`/api/workspaces/${workspaceId}/projects`);
  },

  /**
   * Get a single project by ID
   */
  async getOne(projectId: string): Promise<Project> {
    return apiClient.get<Project>(`/api/projects/${projectId}`);
  },

  /**
   * Create a new project
   */
  async create(workspaceId: string, data: CreateProjectDto): Promise<Project> {
    return apiClient.post<Project, CreateProjectDto>(
      `/api/workspaces/${workspaceId}/projects`,
      data,
    );
  },

  /**
   * Update a project
   */
  async update(projectId: string, data: UpdateProjectDto): Promise<Project> {
    return apiClient.put<Project, UpdateProjectDto>(
      `/api/projects/${projectId}`,
      data,
    );
  },

  /**
   * Add tasks to a project
   */
  async addTasks(projectId: string, taskIds: string[]): Promise<Project> {
    return apiClient.post<Project, { taskIds: string[] }>(
      `/api/projects/${projectId}/tasks`,
      { taskIds },
    );
  },

  /**
   * Remove tasks from a project
   */
  async removeTasks(projectId: string, taskIds: string[]): Promise<Project> {
    return apiClient.delete<Project>(`/api/projects/${projectId}/tasks`, {
      taskIds,
    });
  },

  /**
   * Reorder projects
   */
  async reorder(workspaceId: string, orderedIds: string[]): Promise<Project[]> {
    return apiClient.put<Project[], { orderedIds: string[] }>(
      `/api/workspaces/${workspaceId}/projects/reorder`,
      { orderedIds },
    );
  },

  /**
   * Delete a project
   */
  async delete(projectId: string): Promise<void> {
    return apiClient.delete<void>(`/api/projects/${projectId}`);
  },
};

export default projectsApi;
