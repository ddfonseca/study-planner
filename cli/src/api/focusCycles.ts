import { ApiClient } from './client';

export interface FocusCycleItem {
  id: string;
  cycleId: string;
  task: string;
  targetMinutes: number;
  position: number;
}

export interface FocusCycle {
  id: string;
  workspaceId: string;
  name: string;
  isActive: boolean;
  currentItemIndex: number;
  displayOrder: number;
  lastResetAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: FocusCycleItem[];
}

export interface CycleItemProgress {
  task: string;
  targetMinutes: number;
  accumulatedMinutes: number;
  isComplete: boolean;
  position: number;
}

export interface CycleSuggestion {
  hasCycle: boolean;
  suggestion: {
    currentTask: string;
    currentTargetMinutes: number;
    currentAccumulatedMinutes: number;
    remainingMinutes: number;
    isCurrentComplete: boolean;
    nextTask: string;
    nextTargetMinutes: number;
    currentPosition: number;
    totalItems: number;
    allItemsProgress: CycleItemProgress[];
    isCycleComplete: boolean;
  } | null;
}

export interface CycleStatistics {
  totalTargetMinutes: number;
  totalAccumulatedMinutes: number;
  completedItemsCount: number;
  totalItemsCount: number;
  overallPercentage: number;
  averagePerItem: number;
}

export interface CreateCycleDto {
  name: string;
  items: { task: string; targetMinutes: number }[];
  activateOnCreate?: boolean;
}

export interface UpdateCycleDto {
  name?: string;
  items?: { task: string; targetMinutes: number }[];
}

export interface AdvanceResult {
  previousTask: string;
  newTask: string;
  cycleCompleted: boolean;
}

export interface CycleHistoryEntry {
  type: 'advance' | 'completion';
  createdAt: string;
  fromTask?: string;
  toTask?: string;
  minutesSpent?: number;
  completionNumber?: number;
}

export class FocusCyclesApi {
  constructor(private client: ApiClient) {}

  async getActive(workspaceId: string): Promise<FocusCycle | null> {
    try {
      return await this.client.get<FocusCycle>(`/api/workspaces/${workspaceId}/focus-cycle`);
    } catch {
      return null;
    }
  }

  async list(workspaceId: string): Promise<FocusCycle[]> {
    return this.client.get<FocusCycle[]>(`/api/workspaces/${workspaceId}/focus-cycle/list`);
  }

  async getSuggestion(workspaceId: string): Promise<CycleSuggestion> {
    return this.client.get<CycleSuggestion>(`/api/workspaces/${workspaceId}/focus-cycle/suggestion`);
  }

  async getStatistics(workspaceId: string): Promise<CycleStatistics> {
    return this.client.get<CycleStatistics>(`/api/workspaces/${workspaceId}/focus-cycle/statistics`);
  }

  async getHistory(workspaceId: string, limit: number = 20): Promise<CycleHistoryEntry[]> {
    return this.client.get<CycleHistoryEntry[]>(`/api/workspaces/${workspaceId}/focus-cycle/history`, {
      limit: String(limit),
    });
  }

  async create(workspaceId: string, data: CreateCycleDto): Promise<FocusCycle> {
    return this.client.post<FocusCycle>(`/api/workspaces/${workspaceId}/focus-cycle`, data);
  }

  async activate(workspaceId: string, cycleId: string): Promise<FocusCycle> {
    return this.client.post<FocusCycle>(`/api/workspaces/${workspaceId}/focus-cycle/${cycleId}/activate`);
  }

  async advance(workspaceId: string): Promise<AdvanceResult> {
    return this.client.post<AdvanceResult>(`/api/workspaces/${workspaceId}/focus-cycle/advance`);
  }

  async reset(workspaceId: string): Promise<void> {
    await this.client.post(`/api/workspaces/${workspaceId}/focus-cycle/reset`);
  }

  async update(workspaceId: string, data: UpdateCycleDto): Promise<FocusCycle> {
    return this.client.put<FocusCycle>(`/api/workspaces/${workspaceId}/focus-cycle`, data);
  }

  async delete(workspaceId: string): Promise<void> {
    await this.client.delete(`/api/workspaces/${workspaceId}/focus-cycle`);
  }
}
