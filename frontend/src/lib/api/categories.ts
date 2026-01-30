/**
 * Categories API
 */
import { apiClient } from './client';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '@/types/api';

export const categoriesApi = {
  /**
   * Get all categories for a workspace
   */
  async getAll(workspaceId: string): Promise<Category[]> {
    return apiClient.get<Category[]>(`/api/workspaces/${workspaceId}/categories`);
  },

  /**
   * Get a single category by ID
   */
  async getOne(categoryId: string): Promise<Category> {
    return apiClient.get<Category>(`/api/categories/${categoryId}`);
  },

  /**
   * Create a new category
   */
  async create(workspaceId: string, data: CreateCategoryDto): Promise<Category> {
    return apiClient.post<Category, CreateCategoryDto>(
      `/api/workspaces/${workspaceId}/categories`,
      data,
    );
  },

  /**
   * Update a category
   */
  async update(categoryId: string, data: UpdateCategoryDto): Promise<Category> {
    return apiClient.put<Category, UpdateCategoryDto>(
      `/api/categories/${categoryId}`,
      data,
    );
  },

  /**
   * Delete a category
   */
  async delete(categoryId: string): Promise<void> {
    return apiClient.delete<void>(`/api/categories/${categoryId}`);
  },
};

export default categoriesApi;
