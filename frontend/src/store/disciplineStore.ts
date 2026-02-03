/**
 * Discipline Store using Zustand
 */
import { create } from 'zustand';
import type { Discipline, CreateDisciplineDto, UpdateDisciplineDto } from '@/types/api';
import { disciplinesApi } from '@/lib/api/disciplines';

interface DisciplineState {
  disciplines: Discipline[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentWorkspaceId: string | null;
}

interface DisciplineActions {
  fetchDisciplines: (workspaceId: string) => Promise<void>;
  createDiscipline: (workspaceId: string, data: CreateDisciplineDto) => Promise<Discipline>;
  updateDiscipline: (disciplineId: string, data: UpdateDisciplineDto) => Promise<Discipline>;
  addSubjectsToDiscipline: (disciplineId: string, subjectIds: string[]) => Promise<Discipline>;
  removeSubjectsFromDiscipline: (disciplineId: string, subjectIds: string[]) => Promise<Discipline>;
  reorderDisciplines: (workspaceId: string, orderedIds: string[]) => Promise<void>;
  deleteDiscipline: (disciplineId: string) => Promise<void>;
  getDisciplineById: (id: string) => Discipline | undefined;
  getDisciplineByName: (name: string) => Discipline | undefined;
  clearDisciplines: () => void;
  setError: (error: string | null) => void;
}

type DisciplineStore = DisciplineState & DisciplineActions;

export const useDisciplineStore = create<DisciplineStore>()((set, get) => ({
  // Initial state
  disciplines: [],
  isLoading: false,
  isSaving: false,
  error: null,
  currentWorkspaceId: null,

  // Actions
  fetchDisciplines: async (workspaceId) => {
    try {
      set({ isLoading: true, error: null, currentWorkspaceId: workspaceId });
      const disciplines = await disciplinesApi.getAll(workspaceId);
      set({ disciplines, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch disciplines',
      });
      throw error;
    }
  },

  createDiscipline: async (workspaceId, data) => {
    try {
      set({ isSaving: true, error: null });
      const newDiscipline = await disciplinesApi.create(workspaceId, data);

      set((state) => ({
        disciplines: [...state.disciplines, newDiscipline].sort(
          (a, b) => a.position - b.position
        ),
        isSaving: false,
      }));

      return newDiscipline;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create discipline',
      });
      throw error;
    }
  },

  updateDiscipline: async (disciplineId, data) => {
    try {
      set({ isSaving: true, error: null });
      const updatedDiscipline = await disciplinesApi.update(disciplineId, data);

      set((state) => ({
        disciplines: state.disciplines
          .map((d) => (d.id === disciplineId ? updatedDiscipline : d))
          .sort((a, b) => a.position - b.position),
        isSaving: false,
      }));

      return updatedDiscipline;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update discipline',
      });
      throw error;
    }
  },

  addSubjectsToDiscipline: async (disciplineId, subjectIds) => {
    try {
      set({ isSaving: true, error: null });
      const updatedDiscipline = await disciplinesApi.addSubjects(disciplineId, subjectIds);

      set((state) => ({
        disciplines: state.disciplines.map((d) =>
          d.id === disciplineId ? updatedDiscipline : d
        ),
        isSaving: false,
      }));

      return updatedDiscipline;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to add subjects to discipline',
      });
      throw error;
    }
  },

  removeSubjectsFromDiscipline: async (disciplineId, subjectIds) => {
    try {
      set({ isSaving: true, error: null });
      const updatedDiscipline = await disciplinesApi.removeSubjects(disciplineId, subjectIds);

      set((state) => ({
        disciplines: state.disciplines.map((d) =>
          d.id === disciplineId ? updatedDiscipline : d
        ),
        isSaving: false,
      }));

      return updatedDiscipline;
    } catch (error) {
      set({
        isSaving: false,
        error:
          error instanceof Error ? error.message : 'Failed to remove subjects from discipline',
      });
      throw error;
    }
  },

  reorderDisciplines: async (workspaceId, orderedIds) => {
    try {
      set({ isSaving: true, error: null });
      const reorderedDisciplines = await disciplinesApi.reorder(workspaceId, orderedIds);

      set({
        disciplines: reorderedDisciplines,
        isSaving: false,
      });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to reorder disciplines',
      });
      throw error;
    }
  },

  deleteDiscipline: async (disciplineId) => {
    try {
      set({ isSaving: true, error: null });
      await disciplinesApi.delete(disciplineId);

      set((state) => ({
        disciplines: state.disciplines.filter((d) => d.id !== disciplineId),
        isSaving: false,
      }));
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to delete discipline',
      });
      throw error;
    }
  },

  getDisciplineById: (id) => {
    return get().disciplines.find((d) => d.id === id);
  },

  getDisciplineByName: (name) => {
    return get().disciplines.find(
      (d) => d.name && d.name.toLowerCase() === name.toLowerCase()
    );
  },

  clearDisciplines: () => {
    set({
      disciplines: [],
      currentWorkspaceId: null,
      error: null,
    });
  },

  setError: (error) => {
    set({ error });
  },
}));

export default useDisciplineStore;
