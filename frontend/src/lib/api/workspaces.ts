/**
 * Workspaces API
 */
import { apiClient } from './client';
import type { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto } from '@/types/api';

export const workspacesApi = {
  /**
   * Get all workspaces for the current user
   */
  async getAll(): Promise<Workspace[]> {
    return apiClient.get<Workspace[]>('/api/workspaces');
  },

  /**
   * Get the default workspace for the current user
   */
  async getDefault(): Promise<Workspace> {
    return apiClient.get<Workspace>('/api/workspaces/default');
  },

  /**
   * Get a workspace by ID
   */
  async getById(id: string): Promise<Workspace> {
    return apiClient.get<Workspace>(`/api/workspaces/${id}`);
  },

  /**
   * Get distinct subjects for a workspace
   */
  async getSubjects(workspaceId: string): Promise<string[]> {
    return apiClient.get<string[]>(`/api/workspaces/${workspaceId}/subjects`);
  },

  /**
   * Create a new workspace
   */
  async create(data: CreateWorkspaceDto): Promise<Workspace> {
    return apiClient.post<Workspace, CreateWorkspaceDto>('/api/workspaces', data);
  },

  /**
   * Update a workspace
   */
  async update(id: string, data: UpdateWorkspaceDto): Promise<Workspace> {
    return apiClient.put<Workspace, UpdateWorkspaceDto>(`/api/workspaces/${id}`, data);
  },

  /**
   * Delete a workspace
   * @param moveToDefault If true, moves sessions to the default workspace before deleting
   */
  async delete(id: string, moveToDefault: boolean = false): Promise<void> {
    const query = moveToDefault ? '?moveToDefault=true' : '';
    return apiClient.delete<void>(`/api/workspaces/${id}${query}`);
  },
};

export default workspacesApi;
