/**
 * Subjects API
 */
import { apiClient } from './client';
import type {
  Subject,
  CreateSubjectDto,
  UpdateSubjectDto,
  MergeSubjectsDto,
  ReorderSubjectsDto,
} from '@/types/api';

export const subjectsApi = {
  /**
   * Get all subjects for a workspace
   */
  async getAll(workspaceId: string, includeArchived = false): Promise<Subject[]> {
    const params = new URLSearchParams();
    if (includeArchived) params.append('includeArchived', 'true');
    const queryString = params.toString();
    const url = `/api/workspaces/${workspaceId}/subjects${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<Subject[]>(url);
  },

  /**
   * Get a single subject by ID
   */
  async getOne(subjectId: string): Promise<Subject> {
    return apiClient.get<Subject>(`/api/subjects/${subjectId}`);
  },

  /**
   * Create a new subject
   */
  async create(workspaceId: string, data: CreateSubjectDto): Promise<Subject> {
    return apiClient.post<Subject, CreateSubjectDto>(
      `/api/workspaces/${workspaceId}/subjects`,
      data,
    );
  },

  /**
   * Find or create a subject by name (maintains inline creation UX)
   */
  async findOrCreate(workspaceId: string, name: string): Promise<Subject> {
    return apiClient.post<Subject, { name: string }>(
      `/api/workspaces/${workspaceId}/subjects/find-or-create`,
      { name },
    );
  },

  /**
   * Update a subject
   */
  async update(subjectId: string, data: UpdateSubjectDto): Promise<Subject> {
    return apiClient.put<Subject, UpdateSubjectDto>(
      `/api/subjects/${subjectId}`,
      data,
    );
  },

  /**
   * Archive a subject (soft delete)
   */
  async archive(subjectId: string): Promise<Subject> {
    return apiClient.delete<Subject>(`/api/subjects/${subjectId}`);
  },

  /**
   * Unarchive a subject
   */
  async unarchive(subjectId: string): Promise<Subject> {
    return apiClient.post<Subject, Record<string, never>>(
      `/api/subjects/${subjectId}/unarchive`,
      {},
    );
  },

  /**
   * Merge multiple subjects into one
   */
  async merge(data: MergeSubjectsDto): Promise<Subject> {
    return apiClient.post<Subject, MergeSubjectsDto>('/api/subjects/merge', data);
  },

  /**
   * Reorder subjects in a workspace
   */
  async reorder(workspaceId: string, data: ReorderSubjectsDto): Promise<Subject[]> {
    return apiClient.put<Subject[], ReorderSubjectsDto>(
      `/api/workspaces/${workspaceId}/subjects/reorder`,
      data,
    );
  },
};

export default subjectsApi;
