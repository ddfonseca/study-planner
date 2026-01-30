/**
 * Category Store using Zustand
 */
import { create } from 'zustand';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types/api';
import { categoriesApi } from '@/lib/api/categories';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface CategoryActions {
  fetchCategories: (workspaceId: string) => Promise<void>;
  createCategory: (workspaceId: string, data: CreateCategoryDto) => Promise<Category>;
  updateCategory: (categoryId: string, data: UpdateCategoryDto) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;
  clearCategories: () => void;
  setError: (error: string | null) => void;
}

type CategoryStore = CategoryState & CategoryActions;

export const useCategoryStore = create<CategoryStore>()((set, get) => ({
  // Initial state
  categories: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentWorkspaceId: null,

  // Actions
  fetchCategories: async (workspaceId) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const categories = await categoriesApi.getAll(workspaceId);
      set({ categories, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      });
      throw error;
    }
  },

  createCategory: async (workspaceId, data) => {
    try {
      set({ isSaving: true, error: null });
      const newCategory = await categoriesApi.create(workspaceId, data);

      set((state) => ({
        categories: [...state.categories, newCategory].sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return newCategory;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create category',
      });
      throw error;
    }
  },

  updateCategory: async (categoryId, data) => {
    try {
      set({ isSaving: true, error: null });
      const updatedCategory = await categoriesApi.update(categoryId, data);

      set((state) => ({
        categories: state.categories
          .map((c) => (c.id === categoryId ? updatedCategory : c))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return updatedCategory;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update category',
      });
      throw error;
    }
  },

  deleteCategory: async (categoryId) => {
    try {
      set({ isSaving: true, error: null });
      await categoriesApi.delete(categoryId);

      set((state) => ({
        categories: state.categories.filter((c) => c.id !== categoryId),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to delete category',
      });
      throw error;
    }
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id);
  },

  getCategoryByName: (name) => {
    return get().categories.find(
      (c) => c.name && c.name.toLowerCase() === name.toLowerCase()
    );
  },

  clearCategories: () => {
    set({
      categories: [],
      currentWorkspaceId: null,
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },
}));

export default useCategoryStore;
