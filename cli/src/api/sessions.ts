import { ApiClient } from './client';

export interface StudySession {
  id: string;
  userId: string;
  workspaceId: string;
  date: string;
  subject: string;
  minutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  workspaceId: string;
  date: string;
  subject: string;
  minutes: number;
}

export interface UpdateSessionDto {
  date?: string;
  subject?: string;
  minutes?: number;
}

export interface GetSessionsParams {
  workspaceId?: string;
  startDate?: string;
  endDate?: string;
}

export class SessionsApi {
  constructor(private client: ApiClient) {}

  async list(params?: GetSessionsParams): Promise<StudySession[]> {
    const queryParams: Record<string, string> = {};
    if (params?.workspaceId) queryParams.workspaceId = params.workspaceId;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;

    return this.client.get<StudySession[]>('/api/study-sessions', queryParams);
  }

  async getSubjects(workspaceId?: string): Promise<string[]> {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    return this.client.get<string[]>('/api/study-sessions/subjects', params);
  }

  async create(data: CreateSessionDto): Promise<StudySession> {
    return this.client.post<StudySession>('/api/study-sessions', data);
  }

  async update(id: string, data: UpdateSessionDto): Promise<StudySession> {
    return this.client.put<StudySession>(`/api/study-sessions/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/api/study-sessions/${id}`);
  }
}
