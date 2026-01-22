import { ApiClient } from './client';

export interface WeeklyGoal {
  id: string;
  userId: string;
  workspaceId: string;
  weekStart: string;
  targetHours: number;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoalWithProgress extends WeeklyGoal {
  actualMinutes?: number;
  percentage?: number;
}

export interface GetGoalsParams {
  startDate?: string;
  endDate?: string;
  workspaceId?: string;
}

export interface UpdateGoalDto {
  targetHours?: number;
}

export class GoalsApi {
  constructor(private client: ApiClient) {}

  async get(weekStart: string, workspaceId?: string): Promise<WeeklyGoal> {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    return this.client.get<WeeklyGoal>(`/api/weekly-goals/${weekStart}`, params);
  }

  async list(params?: GetGoalsParams): Promise<WeeklyGoal[]> {
    const queryParams: Record<string, string> = {};
    if (params?.startDate) queryParams.startDate = params.startDate;
    if (params?.endDate) queryParams.endDate = params.endDate;
    if (params?.workspaceId) queryParams.workspaceId = params.workspaceId;
    return this.client.get<WeeklyGoal[]>('/api/weekly-goals', queryParams);
  }

  async update(weekStart: string, data: UpdateGoalDto, workspaceId?: string): Promise<WeeklyGoal> {
    const params: Record<string, string> = {};
    if (workspaceId) params.workspaceId = workspaceId;
    return this.client.put<WeeklyGoal>(`/api/weekly-goals/${weekStart}?${new URLSearchParams(params)}`, data);
  }
}
