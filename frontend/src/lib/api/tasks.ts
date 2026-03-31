/**
 * Tasks API
 */
import { apiClient } from './client';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  MergeTasksDto,
  ReorderTasksDto,
} from '@/types/api';

export const tasksApi = {
  /**
   * Get all tasks for a workspace
   */
  async getAll(workspaceId: string, includeArchived = false): Promise<Task[]> {
    const params = new URLSearchParams();
    if (includeArchived) params.append('includeArchived', 'true');
    const queryString = params.toString();
    const url = `/api/workspaces/${workspaceId}/tasks${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<Task[]>(url);
  },

  /**
   * Get a single task by ID
   */
  async getOne(taskId: string): Promise<Task> {
    return apiClient.get<Task>(`/api/tasks/${taskId}`);
  },

  /**
   * Create a new task
   */
  async create(workspaceId: string, data: CreateTaskDto): Promise<Task> {
    return apiClient.post<Task, CreateTaskDto>(
      `/api/workspaces/${workspaceId}/tasks`,
      data,
    );
  },

  /**
   * Find or create a task by name (maintains inline creation UX)
   */
  async findOrCreate(workspaceId: string, name: string): Promise<Task> {
    return apiClient.post<Task, { name: string }>(
      `/api/workspaces/${workspaceId}/tasks/find-or-create`,
      { name },
    );
  },

  /**
   * Update a task
   */
  async update(taskId: string, data: UpdateTaskDto): Promise<Task> {
    return apiClient.put<Task, UpdateTaskDto>(
      `/api/tasks/${taskId}`,
      data,
    );
  },

  /**
   * Archive a task (soft delete)
   */
  async archive(taskId: string): Promise<Task> {
    return apiClient.delete<Task>(`/api/tasks/${taskId}`);
  },

  /**
   * Unarchive a task
   */
  async unarchive(taskId: string): Promise<Task> {
    return apiClient.post<Task, Record<string, never>>(
      `/api/tasks/${taskId}/unarchive`,
      {},
    );
  },

  /**
   * Permanently delete an archived task
   */
  async permanentDelete(taskId: string): Promise<{ deleted: boolean; taskId: string }> {
    return apiClient.delete<{ deleted: boolean; taskId: string }>(
      `/api/tasks/${taskId}/permanent`,
    );
  },

  /**
   * Merge multiple tasks into one
   */
  async merge(data: MergeTasksDto): Promise<Task> {
    return apiClient.post<Task, MergeTasksDto>('/api/tasks/merge', data);
  },

  /**
   * Reorder tasks in a workspace
   */
  async reorder(workspaceId: string, data: ReorderTasksDto): Promise<Task[]> {
    return apiClient.put<Task[], ReorderTasksDto>(
      `/api/workspaces/${workspaceId}/tasks/reorder`,
      data,
    );
  },
};

export default tasksApi;
