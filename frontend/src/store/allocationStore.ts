/**
 * Allocation Store using Zustand
 * Manages exam profiles and allocation state per workspace
 */
import { create } from 'zustand';
import type {
  ExamProfile,
  ExamTemplate,
  AllocationResponse,
  CreateExamProfileDto,
  UpdateExamProfileDto,
} from '@/types/api';
import { allocationApi } from '@/lib/api';

interface AllocationState {
  profiles: ExamProfile[];
  currentProfile: ExamProfile | null;
  templates: ExamTemplate[];
  categories: string[];
  allocationResult: AllocationResponse | null;
  isLoading: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface AllocationActions {
  // Profiles
  fetchProfiles: (workspaceId: string) => Promise<void>;
  fetchProfile: (id: string) => Promise<void>;
  createProfile: (data: CreateExamProfileDto) => Promise<ExamProfile>;
  updateProfile: (id: string, data: UpdateExamProfileDto) => Promise<ExamProfile>;
  deleteProfile: (id: string) => Promise<void>;
  calculateAllocation: (id: string) => Promise<void>;

  // Templates
  fetchTemplates: () => Promise<void>;
  fetchCategories: () => Promise<void>;

  // Utility
  clearAllocation: () => void;
  setCurrentProfile: (profile: ExamProfile | null) => void;
}

type AllocationStore = AllocationState & AllocationActions;

export const useAllocationStore = create<AllocationStore>()((set) => ({
  profiles: [],
  currentProfile: null,
  templates: [],
  categories: [],
  allocationResult: null,
  isLoading: false,
  error: null,
  currentWorkspaceId: null,

  fetchProfiles: async (workspaceId: string) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const profiles = await allocationApi.listProfiles(workspaceId);
      set({ profiles, isLoading: false });
    } catch (error) {
      set({
        profiles: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profiles',
      });
    }
  },

  fetchProfile: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const profile = await allocationApi.getProfile(id);
      set({ currentProfile: profile, isLoading: false });
    } catch (error) {
      set({
        currentProfile: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
      });
    }
  },

  createProfile: async (data: CreateExamProfileDto) => {
    try {
      set({ isLoading: true, error: null });
      const profile = await allocationApi.createProfile(data);
      set((state) => ({
        profiles: [...state.profiles, profile],
        currentProfile: profile,
        isLoading: false,
      }));
      return profile;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to create profile',
      });
      throw error;
    }
  },

  updateProfile: async (id: string, data: UpdateExamProfileDto) => {
    try {
      set({ isLoading: true, error: null });
      const profile = await allocationApi.updateProfile(id, data);
      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === id ? profile : p)),
        currentProfile: profile,
        isLoading: false,
      }));
      return profile;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      });
      throw error;
    }
  },

  deleteProfile: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      await allocationApi.deleteProfile(id);
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id),
        currentProfile: state.currentProfile?.id === id ? null : state.currentProfile,
        allocationResult: null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete profile',
      });
      throw error;
    }
  },

  calculateAllocation: async (id: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await allocationApi.calculateAllocation(id);
      set({ allocationResult: result, isLoading: false });
    } catch (error) {
      set({
        allocationResult: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to calculate allocation',
      });
      throw error;
    }
  },

  fetchTemplates: async () => {
    try {
      const templates = await allocationApi.listTemplates();
      set({ templates });
    } catch (error) {
      set({
        templates: [],
        error: error instanceof Error ? error.message : 'Failed to fetch templates',
      });
    }
  },

  fetchCategories: async () => {
    try {
      const categories = await allocationApi.getCategories();
      set({ categories });
    } catch (error) {
      set({
        categories: [],
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
      });
    }
  },

  clearAllocation: () => {
    set({
      currentProfile: null,
      allocationResult: null,
      error: null,
    });
  },

  setCurrentProfile: (profile: ExamProfile | null) => {
    set({ currentProfile: profile, allocationResult: null });
  },
}));

export default useAllocationStore;
