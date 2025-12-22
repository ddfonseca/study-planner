/**
 * Study Sessions API
 */
import { apiClient } from './client';
import type { Session, CreateSessionDto, UpdateSessionDto } from '@/types/api';

export const sessionsApi = {
  /**
   * Get all study sessions with optional date range filter
   * @param workspaceId - Workspace ID or "all" for all workspaces
   */
  async getAll(
    workspaceId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<Session[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get<Session[]>(`/api/study-sessions?${params.toString()}`);
  },

  /**
   * Get distinct subjects for a workspace
   * @param workspaceId - Workspace ID or "all" for all workspaces
   */
  async getSubjects(workspaceId: string): Promise<string[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    return apiClient.get<string[]>(`/api/study-sessions/subjects?${params.toString()}`);
  },

  /**
   * Create a new study session
   */
  async create(session: CreateSessionDto): Promise<Session> {
    return apiClient.post<Session, CreateSessionDto>('/api/study-sessions', session);
  },

  /**
   * Update an existing study session
   */
  async update(id: string, session: UpdateSessionDto): Promise<Session> {
    return apiClient.put<Session, UpdateSessionDto>(`/api/study-sessions/${id}`, session);
  },

  /**
   * Delete a study session
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/study-sessions/${id}`);
  },
};

export default sessionsApi;
