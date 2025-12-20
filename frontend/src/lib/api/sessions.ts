/**
 * Study Sessions API
 */
import { apiClient } from './client';
import type { Session, CreateSessionDto, UpdateSessionDto } from '@/types/api';

export const sessionsApi = {
  /**
   * Get all study sessions with optional date range filter
   */
  async getAll(startDate?: string, endDate?: string): Promise<Session[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const query = params.toString();
    return apiClient.get<Session[]>(`/api/study-sessions${query ? '?' + query : ''}`);
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
