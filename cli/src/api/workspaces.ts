import { ApiClient } from './client';

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  color?: string;
}

export interface WorkspaceStats {
  totalMinutes: number;
  totalSessions: number;
  subjects: string[];
}

export class WorkspacesApi {
  constructor(private client: ApiClient) {}

  async list(): Promise<Workspace[]> {
    return this.client.get<Workspace[]>('/api/workspaces');
  }

  async getDefault(): Promise<Workspace> {
    return this.client.get<Workspace>('/api/workspaces/default');
  }

  async get(id: string): Promise<Workspace> {
    return this.client.get<Workspace>(`/api/workspaces/${id}`);
  }

  async getSubjects(id: string): Promise<string[]> {
    return this.client.get<string[]>(`/api/workspaces/${id}/subjects`);
  }

  async getStats(id: string): Promise<WorkspaceStats> {
    return this.client.get<WorkspaceStats>(`/api/workspaces/${id}/stats`);
  }

  async create(data: CreateWorkspaceDto): Promise<Workspace> {
    return this.client.post<Workspace>('/api/workspaces', data);
  }

  async update(id: string, data: Partial<CreateWorkspaceDto>): Promise<Workspace> {
    return this.client.put<Workspace>(`/api/workspaces/${id}`, data);
  }

  async delete(id: string, moveToDefault: boolean = true): Promise<void> {
    await this.client.delete(`/api/workspaces/${id}`, {
      moveToDefault: String(moveToDefault),
    });
  }
}
