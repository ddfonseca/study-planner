/**
 * Work Sessions API
 */
import { apiClient } from './client';
import type { WorkSession, CreateWorkSessionDto, UpdateWorkSessionDto } from '@/types/api';

export const workSessionsApi = {
  /**
   * Get all work sessions with optional date range filter
   * @param workspaceId - Workspace ID or "all" for all workspaces
   */
  async getAll(
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<WorkSession[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get<WorkSession[]>(`/api/work-sessions?${params.toString()}`);
  },

  /**
   * Get distinct tasks for a workspace
   * @param workspaceId - Workspace ID or "all" for all workspaces
   */
  async getTasks(workspaceId: string): Promise<string[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    return apiClient.get<string[]>(`/api/work-sessions/tasks?${params.toString()}`);
  },

  /**
   * Create a new work session
   */
  async create(session: CreateWorkSessionDto): Promise<WorkSession> {
    return apiClient.post<WorkSession, CreateWorkSessionDto>('/api/work-sessions', session);
  },

  /**
   * Update an existing work session
   */
  async update(id: string, session: UpdateWorkSessionDto): Promise<WorkSession> {
    return apiClient.put<WorkSession, UpdateWorkSessionDto>(`/api/work-sessions/${id}`, session);
  },

  /**
   * Delete a work session
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/work-sessions/${id}`);
  },
};

export default workSessionsApi;
