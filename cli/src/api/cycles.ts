import { ApiClient } from './client';

export interface StudyCycleItem {
  id: string;
  cycleId: string;
  subject: string;
  targetMinutes: number;
  position: number;
}

export interface StudyCycle {
  id: string;
  workspaceId: string;
  name: string;
  isActive: boolean;
  currentItemIndex: number;
  displayOrder: number;
  lastResetAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: StudyCycleItem[];
}

export interface CycleItemProgress {
  subject: string;
  targetMinutes: number;
  accumulatedMinutes: number;
  isComplete: boolean;
  position: number;
}

export interface CycleSuggestion {
  hasCycle: boolean;
  suggestion: {
    currentSubject: string;
    currentTargetMinutes: number;
    currentAccumulatedMinutes: number;
    remainingMinutes: number;
    isCurrentComplete: boolean;
    nextSubject: string;
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
  items: { subject: string; targetMinutes: number }[];
  activateOnCreate?: boolean;
}

export interface UpdateCycleDto {
  name?: string;
  items?: { subject: string; targetMinutes: number }[];
}

export interface AdvanceResult {
  previousSubject: string;
  newSubject: string;
  cycleCompleted: boolean;
}

export interface CycleHistoryEntry {
  type: 'advance' | 'completion';
  createdAt: string;
  fromSubject?: string;
  toSubject?: string;
  minutesSpent?: number;
  completionNumber?: number;
}

export class CyclesApi {
  constructor(private client: ApiClient) {}

  async getActive(workspaceId: string): Promise<StudyCycle | null> {
    try {
      return await this.client.get<StudyCycle>(`/api/workspaces/${workspaceId}/cycle`);
    } catch {
      return null;
    }
  }

  async list(workspaceId: string): Promise<StudyCycle[]> {
    return this.client.get<StudyCycle[]>(`/api/workspaces/${workspaceId}/cycle/list`);
  }

  async getSuggestion(workspaceId: string): Promise<CycleSuggestion> {
    return this.client.get<CycleSuggestion>(`/api/workspaces/${workspaceId}/cycle/suggestion`);
  }

  async getStatistics(workspaceId: string): Promise<CycleStatistics> {
    return this.client.get<CycleStatistics>(`/api/workspaces/${workspaceId}/cycle/statistics`);
  }

  async getHistory(workspaceId: string, limit: number = 20): Promise<CycleHistoryEntry[]> {
    return this.client.get<CycleHistoryEntry[]>(`/api/workspaces/${workspaceId}/cycle/history`, {
      limit: String(limit),
    });
  }

  async create(workspaceId: string, data: CreateCycleDto): Promise<StudyCycle> {
    return this.client.post<StudyCycle>(`/api/workspaces/${workspaceId}/cycle`, data);
  }

  async activate(workspaceId: string, cycleId: string): Promise<StudyCycle> {
    return this.client.post<StudyCycle>(`/api/workspaces/${workspaceId}/cycle/${cycleId}/activate`);
  }

  async advance(workspaceId: string): Promise<AdvanceResult> {
    return this.client.post<AdvanceResult>(`/api/workspaces/${workspaceId}/cycle/advance`);
  }

  async reset(workspaceId: string): Promise<void> {
    await this.client.post(`/api/workspaces/${workspaceId}/cycle/reset`);
  }

  async update(workspaceId: string, data: UpdateCycleDto): Promise<StudyCycle> {
    return this.client.put<StudyCycle>(`/api/workspaces/${workspaceId}/cycle`, data);
  }

  async delete(workspaceId: string): Promise<void> {
    await this.client.delete(`/api/workspaces/${workspaceId}/cycle`);
  }
}
