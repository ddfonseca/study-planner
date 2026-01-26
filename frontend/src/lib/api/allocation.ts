/**
 * Study Allocation API client
 */
import { apiClient } from './client';
import type {
  ExamProfile,
  ExamTemplate,
  AllocationResponse,
  CreateExamProfileDto,
  UpdateExamProfileDto,
} from '@/types/api';

export const allocationApi = {
  /**
   * List all exam profiles for a workspace
   */
  async listProfiles(workspaceId: string): Promise<ExamProfile[]> {
    return apiClient.get<ExamProfile[]>(`/api/exam-profiles?workspaceId=${workspaceId}`);
  },

  /**
   * Get a specific exam profile by ID
   */
  async getProfile(id: string): Promise<ExamProfile> {
    return apiClient.get<ExamProfile>(`/api/exam-profiles/${id}`);
  },

  /**
   * Create a new exam profile
   */
  async createProfile(data: CreateExamProfileDto): Promise<ExamProfile> {
    return apiClient.post<ExamProfile, CreateExamProfileDto>('/api/exam-profiles', data);
  },

  /**
   * Update an existing exam profile
   */
  async updateProfile(id: string, data: UpdateExamProfileDto): Promise<ExamProfile> {
    return apiClient.put<ExamProfile, UpdateExamProfileDto>(`/api/exam-profiles/${id}`, data);
  },

  /**
   * Delete an exam profile
   */
  async deleteProfile(id: string): Promise<{ success: boolean }> {
    return apiClient.delete<{ success: boolean }>(`/api/exam-profiles/${id}`);
  },

  /**
   * Calculate allocation for an exam profile
   */
  async calculateAllocation(id: string): Promise<AllocationResponse> {
    return apiClient.post<AllocationResponse, undefined>(`/api/exam-profiles/${id}/calculate`, undefined);
  },

  /**
   * List all exam templates
   */
  async listTemplates(): Promise<ExamTemplate[]> {
    return apiClient.get<ExamTemplate[]>('/api/exam-templates');
  },

  /**
   * Get a specific exam template by ID
   */
  async getTemplate(id: string): Promise<ExamTemplate> {
    return apiClient.get<ExamTemplate>(`/api/exam-templates/${id}`);
  },

  /**
   * Get all available exam template categories
   */
  async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/api/exam-templates/categories');
  },
};
