import { ApiClient } from './client';

export interface WorkSession {
  id: string;
  userId: string;
  workspaceId: string;
  date: string;
  task: string;
  minutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  workspaceId: string;
  date: string;
  task: string;
  minutes: number;
}

export interface UpdateSessionDto {
  date?: string;
  task?: string;
  minutes?: number;
}

export interface GetSessionsParams {
  workspaceId?: string;
  startDate?: string;
  endDate?: string;
}

export class SessionsApi {
  constructor(private client: ApiClient) {}

  async list(params?: GetSessionsParams): Promise<WorkSession[]> {
    const queryParams: Record<string, string> = {};
    if (params?.workspaceId) queryParams.workspaceId = params.workspaceId;
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;

    return this.client.get<WorkSession[]>('/api/work-sessions', queryParams);
  }

  async getTasks(workspaceId?: string): Promise<string[]> {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    return this.client.get<string[]>('/api/work-sessions/tasks', params);
  }

  async create(data: CreateSessionDto): Promise<WorkSession> {
    return this.client.post<WorkSession>('/api/work-sessions', data);
  }

  async update(id: string, data: UpdateSessionDto): Promise<WorkSession> {
    return this.client.put<WorkSession>(`/api/work-sessions/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(`/api/work-sessions/${id}`);
  }
}
