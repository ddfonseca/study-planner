/**
 * Subject Store using Zustand
 */
import { create } from 'zustand';
import type {
  Subject,
  CreateSubjectDto,
  UpdateSubjectDto,
  MergeSubjectsDto,
} from '@/types/api';
import { subjectsApi } from '@/lib/api/subjects';

interface SubjectState {
  subjects: Subject[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface SubjectActions {
  fetchSubjects: (workspaceId: string, includeArchived?: boolean) => Promise<void>;
  createSubject: (workspaceId: string, data: CreateSubjectDto) => Promise<Subject>;
  findOrCreateSubject: (workspaceId: string, name: string) => Promise<Subject>;
  updateSubject: (subjectId: string, data: UpdateSubjectDto) => Promise<Subject>;
  archiveSubject: (subjectId: string) => Promise<void>;
  unarchiveSubject: (subjectId: string) => Promise<void>;
  mergeSubjects: (data: MergeSubjectsDto) => Promise<Subject>;
  reorderSubjects: (workspaceId: string, subjectIds: string[]) => Promise<void>;
  getSubjectById: (id: string) => Subject | undefined;
  getSubjectByName: (name: string) => Subject | undefined;
  getActiveSubjects: () => Subject[];
  clearSubjects: () => void;
  setError: (error: string | null) => void;
}

type SubjectStore = SubjectState & SubjectActions;

export const useSubjectStore = create<SubjectStore>()((set, get) => ({
  // Initial state
  subjects: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentWorkspaceId: null,

  // Actions
  fetchSubjects: async (workspaceId, includeArchived = false) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const rawSubjects = await subjectsApi.getAll(workspaceId, includeArchived);
      // Filter out any invalid subjects (safety check)
      const subjects = rawSubjects.filter((s) => s && s.id && s.name);
      set({ subjects, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch subjects',
      });
      throw error;
    }
  },

  createSubject: async (workspaceId, data) => {
    try {
      set({ isSaving: true, error: null });
      const newSubject = await subjectsApi.create(workspaceId, data);

      set((state) => ({
        subjects: [...state.subjects, newSubject].sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return newSubject;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create subject',
      });
      throw error;
    }
  },

  findOrCreateSubject: async (workspaceId, name) => {
    // First check if already exists in local state
    const existing = get().subjects.find(
      (s) => s.name && s.name.toLowerCase() === name.toLowerCase() && !s.archivedAt
    );
    if (existing) return existing;

    try {
      set({ isSaving: true, error: null });
      const subject = await subjectsApi.findOrCreate(workspaceId, name);

      // Update local state
      set((state) => {
        const exists = state.subjects.find((s) => s.id === subject.id);
        if (exists) {
          // Update existing (might have been unarchived)
          return {
            subjects: state.subjects
              .map((s) => (s.id === subject.id ? subject : s))
              .sort((a, b) => a.position - b.position),
            isSaving: false,
          };
        }
        return {
          subjects: [...state.subjects, subject].sort((a, b) => a.position - b.position),
          isSaving: false,
        };
      });

      return subject;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to find or create subject',
      });
      throw error;
    }
  },

  updateSubject: async (subjectId, data) => {
    try {
      set({ isSaving: true, error: null });
      const updatedSubject = await subjectsApi.update(subjectId, data);

      set((state) => ({
        subjects: state.subjects
          .map((s) => (s.id === subjectId ? updatedSubject : s))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return updatedSubject;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update subject',
      });
      throw error;
    }
  },

  archiveSubject: async (subjectId) => {
    try {
      set({ isSaving: true, error: null });
      const archivedSubject = await subjectsApi.archive(subjectId);

      set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId ? archivedSubject : s
        ),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to archive subject',
      });
      throw error;
    }
  },

  unarchiveSubject: async (subjectId) => {
    try {
      set({ isSaving: true, error: null });
      const unarchivedSubject = await subjectsApi.unarchive(subjectId);

      set((state) => ({
        subjects: state.subjects.map((s) =>
          s.id === subjectId ? unarchivedSubject : s
        ),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to unarchive subject',
      });
      throw error;
    }
  },

  mergeSubjects: async (data) => {
    try {
      set({ isSaving: true, error: null });
      const mergedSubject = await subjectsApi.merge(data);

      // Remove source subjects and update target
      set((state) => ({
        subjects: state.subjects
          .filter((s) => !data.sourceIds.includes(s.id))
          .map((s) => (s.id === data.targetId ? mergedSubject : s))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return mergedSubject;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to merge subjects',
      });
      throw error;
    }
  },

  reorderSubjects: async (workspaceId, subjectIds) => {
    // Optimistic update
    const previousSubjects = get().subjects;
    const reorderedSubjects = subjectIds
      .map((id, index) => {
        const subject = previousSubjects.find((s) => s.id === id);
        return subject ? { ...subject, position: index } : null;
      })
      .filter((s): s is Subject => s !== null);

    set({ subjects: reorderedSubjects, isSaving: true, error: null });

    try {
      await subjectsApi.reorder(workspaceId, { subjectIds });
      set({ isSaving: false });
    } catch (error) {
      // Rollback on error
      set({
        subjects: previousSubjects,
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to reorder subjects',
      });
      throw error;
    }
  },

  getSubjectById: (id) => {
    return get().subjects.find((s) => s.id === id);
  },

  getSubjectByName: (name) => {
    return get().subjects.find(
      (s) => s.name && s.name.toLowerCase() === name.toLowerCase() && !s.archivedAt
    );
  },

  getActiveSubjects: () => {
    return get().subjects.filter((s) => s && s.id && s.name && !s.archivedAt);
  },

  clearSubjects: () => {
    set({
      subjects: [],
      currentWorkspaceId: null,
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },
}));

export default useSubjectStore;
