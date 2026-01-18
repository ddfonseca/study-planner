/**
 * Study Sessions API
 */
import { apiClient } from './client';
import type { Session, CreateSessionDto, UpdateSessionDto, StreakData, ReviewSuggestion } from '@/types/api';

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

  /**
   * Get streak data (consecutive study days)
   * @param workspaceId - Workspace ID or "all" for all workspaces
   */
  async getStreak(workspaceId: string): Promise<StreakData> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    return apiClient.get<StreakData>(`/api/study-sessions/streak?${params.toString()}`);
  },

  /**
   * Get review suggestions based on spaced repetition
   * @param workspaceId - Workspace ID or "all" for all workspaces
   */
  async getReviewSuggestions(workspaceId: string): Promise<ReviewSuggestion[]> {
    const params = new URLSearchParams();
    params.append('workspaceId', workspaceId);
    return apiClient.get<ReviewSuggestion[]>(`/api/study-sessions/review-suggestions?${params.toString()}`);
  },
};

export default sessionsApi;
