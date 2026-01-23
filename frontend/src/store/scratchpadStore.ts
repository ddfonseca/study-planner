/**
 * Scratchpad Store using Zustand with backend API persistence
 * Supports multiple notes with sidebar navigation
 */
import { create } from 'zustand';
import { scratchpadNotesApi } from '@/lib/api/scratchpadNotes';
import type {
  ScratchpadNote as ApiNote,
  CreateScratchpadNoteDto,
  UpdateScratchpadNoteDto,
} from '@/lib/api/scratchpadNotes';

// Re-export types for compatibility
export interface ScratchpadNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Convert API response to internal format
const mapApiNote = (note: ApiNote): ScratchpadNote => ({
  id: note.id,
  title: note.title,
  content: note.content,
  createdAt: note.createdAt,
  updatedAt: note.updatedAt,
});

// localStorage key for current note selection
const CURRENT_NOTE_KEY = 'scratchpad-current-note';

interface ScratchpadState {
  notes: ScratchpadNote[];
  currentNoteId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

interface ScratchpadActions {
  // Fetch all notes from backend
  fetchNotes: () => Promise<void>;
  // Create a new note
  createNote: () => Promise<string | null>;
  // Delete a note
  deleteNote: (id: string) => Promise<void>;
  // Update a note (debounced save handled by component)
  updateNote: (id: string, updates: Partial<Pick<ScratchpadNote, 'title' | 'content'>>) => Promise<void>;
  // Set current note (persists to localStorage)
  setCurrentNote: (id: string | null) => void;
  // Get current note
  getCurrentNote: () => ScratchpadNote | null;
  // Set notes directly (for migration)
  setNotes: (notes: ScratchpadNote[]) => void;
  // Clear error
  clearError: () => void;
}

type ScratchpadStore = ScratchpadState & ScratchpadActions;

// Get initial current note from localStorage
const getInitialCurrentNoteId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_NOTE_KEY);
  } catch {
    return null;
  }
};

export const useScratchpadStore = create<ScratchpadStore>()((set, get) => ({
  // Initial state
  notes: [],
  currentNoteId: getInitialCurrentNoteId(),
  isLoading: false,
  isSaving: false,
  error: null,

  // Actions
  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const apiNotes = await scratchpadNotesApi.getAll();
      const notes = apiNotes.map(mapApiNote);

      // If current note doesn't exist in fetched notes, clear it
      const currentId = get().currentNoteId;
      const currentExists = notes.some((n) => n.id === currentId);

      set({
        notes,
        currentNoteId: currentExists ? currentId : (notes.length > 0 ? notes[0].id : null),
        isLoading: false,
      });

      // Persist current note selection
      const newCurrentId = get().currentNoteId;
      if (newCurrentId) {
        localStorage.setItem(CURRENT_NOTE_KEY, newCurrentId);
      } else {
        localStorage.removeItem(CURRENT_NOTE_KEY);
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notes',
      });
    }
  },

  createNote: async () => {
    set({ isSaving: true, error: null });
    try {
      const data: CreateScratchpadNoteDto = {
        title: 'Nova nota',
        content: '',
      };
      const apiNote = await scratchpadNotesApi.create(data);
      const newNote = mapApiNote(apiNote);

      set((state) => ({
        notes: [newNote, ...state.notes],
        currentNoteId: newNote.id,
        isSaving: false,
      }));

      localStorage.setItem(CURRENT_NOTE_KEY, newNote.id);
      return newNote.id;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to create note',
      });
      return null;
    }
  },

  deleteNote: async (id: string) => {
    set({ isSaving: true, error: null });
    try {
      await scratchpadNotesApi.delete(id);

      set((state) => {
        const newNotes = state.notes.filter((note) => note.id !== id);
        const newCurrentId =
          state.currentNoteId === id
            ? newNotes.length > 0
              ? newNotes[0].id
              : null
            : state.currentNoteId;

        if (newCurrentId) {
          localStorage.setItem(CURRENT_NOTE_KEY, newCurrentId);
        } else {
          localStorage.removeItem(CURRENT_NOTE_KEY);
        }

        return {
          notes: newNotes,
          currentNoteId: newCurrentId,
          isSaving: false,
        };
      });
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to delete note',
      });
    }
  },

  updateNote: async (id: string, updates: Partial<Pick<ScratchpadNote, 'title' | 'content'>>) => {
    // Optimistic update
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      ),
      isSaving: true,
      error: null,
    }));

    try {
      const data: UpdateScratchpadNoteDto = {};
      if (updates.title !== undefined) data.title = updates.title;
      if (updates.content !== undefined) data.content = updates.content;

      const apiNote = await scratchpadNotesApi.update(id, data);
      const updatedNote = mapApiNote(apiNote);

      // Update with server response
      set((state) => ({
        notes: state.notes.map((note) =>
          note.id === id ? updatedNote : note
        ),
        isSaving: false,
      }));
    } catch (error) {
      // Revert optimistic update would require storing previous state
      // For simplicity, just show error
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update note',
      });
    }
  },

  setCurrentNote: (id: string | null) => {
    set({ currentNoteId: id });
    if (id) {
      localStorage.setItem(CURRENT_NOTE_KEY, id);
    } else {
      localStorage.removeItem(CURRENT_NOTE_KEY);
    }
  },

  getCurrentNote: () => {
    const state = get();
    return state.notes.find((note) => note.id === state.currentNoteId) || null;
  },

  setNotes: (notes: ScratchpadNote[]) => {
    set({ notes });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useScratchpadStore;
