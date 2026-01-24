/**
 * Scratchpad Page - Multiple notes with sidebar navigation
 * Persists to backend API with localStorage migration
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useScratchpadStore } from '@/store/scratchpadStore';
import type { ScratchpadNote } from '@/store/scratchpadStore';
import { scratchpadNotesApi } from '@/lib/api/scratchpadNotes';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Eye,
  Code,
  Plus,
  Trash2,
  ChevronDown,
  StickyNote,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// Old localStorage key from previous implementation
const OLD_STORAGE_KEY = 'scratchpad-storage';

interface OldStorageFormat {
  state: {
    notes: Array<{
      id: string;
      title: string;
      content: string;
      createdAt: string;
      updatedAt: string | null;
    }>;
    currentNoteId: string | null;
  };
  version?: number;
}

export function ScratchpadPage() {
  const {
    notes,
    currentNoteId,
    isLoading,
    isSaving,
    error,
    fetchNotes,
    createNote,
    deleteNote,
    updateNote,
    setCurrentNote,
    getCurrentNote,
    clearError,
  } = useScratchpadStore();

  const currentNote = getCurrentNote();
  const [showSource, setShowSource] = useState(false);
  const [localContent, setLocalContent] = useState(currentNote?.content || '');
  const [localTitle, setLocalTitle] = useState(currentNote?.title || '');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const hasFetchedRef = useRef(false);

  // Migrate old localStorage data to backend
  const migrateLocalStorageData = useCallback(async () => {
    try {
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (!oldData) return;

      const parsed: OldStorageFormat = JSON.parse(oldData);
      const oldNotes = parsed?.state?.notes;

      if (!oldNotes || oldNotes.length === 0) {
        // No notes to migrate, just clean up
        localStorage.removeItem(OLD_STORAGE_KEY);
        return;
      }

      setIsMigrating(true);

      // Create each note in the backend
      for (const note of oldNotes) {
        await scratchpadNotesApi.create({
          title: note.title,
          content: note.content,
        });
      }

      // Remove old localStorage data after successful migration
      localStorage.removeItem(OLD_STORAGE_KEY);

      // Refetch notes to get the migrated data
      await fetchNotes();
    } catch (err) {
      console.error('Failed to migrate localStorage data:', err);
    } finally {
      setIsMigrating(false);
    }
  }, [fetchNotes]);

  // Fetch notes on mount and handle migration
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const initialize = async () => {
      // First, fetch existing notes from backend
      await fetchNotes();

      // Check if we need to migrate localStorage data
      const currentNotes = useScratchpadStore.getState().notes;
      if (currentNotes.length === 0) {
        // Backend is empty, check for localStorage data to migrate
        await migrateLocalStorageData();
      } else {
        // Backend has data, just clean up old localStorage
        localStorage.removeItem(OLD_STORAGE_KEY);
      }
    };

    initialize();
  }, [fetchNotes, migrateLocalStorageData]);

  // Sync local content with current note
  useEffect(() => {
    if (currentNote) {
      setLocalContent(currentNote.content);
      setLocalTitle(currentNote.title);
    } else {
      setLocalContent('');
      setLocalTitle('');
    }
  }, [currentNote?.id, currentNote?.content, currentNote?.title]);

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  // Debounced auto-save for content
  const saveContent = useCallback(
    (newContent: string) => {
      if (!currentNoteId) return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        updateNote(currentNoteId, { content: newContent });
      }, 1000);
    },
    [currentNoteId, updateNote]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle content change
  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newContent = e.target.value;
      setLocalContent(newContent);
      saveContent(newContent);
    },
    [saveContent]
  );

  // Handle title save
  const handleTitleSave = useCallback(() => {
    if (currentNoteId && localTitle.trim()) {
      updateNote(currentNoteId, { title: localTitle.trim() });
    }
    setIsEditingTitle(false);
  }, [currentNoteId, localTitle, updateNote]);

  // Handle title key down
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleTitleSave();
      } else if (e.key === 'Escape') {
        setLocalTitle(currentNote?.title || '');
        setIsEditingTitle(false);
      }
    },
    [handleTitleSave, currentNote?.title]
  );

  // Handle new note
  const handleNewNote = useCallback(async () => {
    await createNote();
    setMobileListOpen(false);
  }, [createNote]);

  // Handle delete note
  const handleDeleteNote = useCallback(async () => {
    if (!noteToDelete) return;
    setIsDeleting(true);
    try {
      await deleteNote(noteToDelete);
      setNoteToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }, [noteToDelete, deleteNote]);

  // Handle note selection
  const handleSelectNote = useCallback(
    (id: string) => {
      // Save current content before switching
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (currentNoteId && localContent !== currentNote?.content) {
        updateNote(currentNoteId, { content: localContent });
      }
      setCurrentNote(id);
      setMobileListOpen(false);
    },
    [currentNoteId, localContent, currentNote?.content, updateNote, setCurrentNote]
  );

  // Note list item component
  const NoteListItem = ({ note }: { note: ScratchpadNote }) => (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
        note.id === currentNoteId
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
      )}
      onClick={() => handleSelectNote(note.id)}
    >
      <StickyNote className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1 truncate text-sm">{note.title}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setNoteToDelete(note.id);
        }}
      >
        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );

  // Loading state
  if (isLoading || isMigrating) {
    return (
      <div className="h-full flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          {isMigrating ? 'Migrando notas...' : 'Carregando notas...'}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center min-h-[40vh]">
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-destructive mb-4">{error}</p>
        <Button onClick={() => { clearError(); fetchNotes(); }}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Empty state
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full min-h-[40vh] text-center p-4 sm:p-8">
      <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50 mb-3 sm:mb-4" />
      <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">Nenhuma nota ainda</h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 max-w-xs">
        Crie sua primeira nota para comecar a organizar seus pensamentos.
      </p>
      <Button onClick={handleNewNote} className="gap-2" size="sm" disabled={isSaving}>
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Nova nota
      </Button>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Scratchpad</h1>
          {isSaving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewNote}
            className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="hidden sm:inline">Nova</span>
          </Button>
          {currentNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSource(!showSource)}
              className="gap-1 sm:gap-2 h-8 px-2 sm:px-3"
            >
              {showSource ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
              <span className="hidden sm:inline">{showSource ? 'Preview' : 'Codigo'}</span>
            </Button>
          )}
        </div>
      </div>

      {notes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex gap-4 flex-1 min-h-0 md:h-[calc(100vh-12rem)] pb-16 md:pb-0">
          {/* Sidebar - Desktop */}
          <div className="hidden md:flex flex-col w-56 flex-shrink-0">
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {notes.map((note) => (
                <NoteListItem key={note.id} note={note} />
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0 md:border-l md:pl-4">
            {currentNote ? (
              <>
                {/* Editable title */}
                <div className="mb-2 sm:mb-3">
                  {isEditingTitle ? (
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={localTitle}
                      onChange={(e) => setLocalTitle(e.target.value)}
                      onBlur={handleTitleSave}
                      onKeyDown={handleTitleKeyDown}
                      className="text-lg sm:text-xl font-semibold bg-transparent border-b border-primary outline-none w-full"
                    />
                  ) : (
                    <h2
                      className="text-lg sm:text-xl font-semibold cursor-pointer hover:text-primary transition-colors truncate"
                      onClick={() => setIsEditingTitle(true)}
                      title="Clique para editar o titulo"
                    >
                      {currentNote.title}
                    </h2>
                  )}
                </div>

                {/* Content editor/preview */}
                <div className="flex-1 min-h-0">
                  {showSource ? (
                    <Textarea
                      value={localContent}
                      onChange={handleContentChange}
                      placeholder="Escreva seus pensamentos, objetivos, reflexoes...

Suporta markdown basico:
# Titulo
## Subtitulo
**negrito**
*italico*
- lista"
                      className="h-full min-h-[40vh] sm:min-h-[50vh] font-mono text-sm sm:text-base resize-none"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="h-full min-h-[40vh] sm:min-h-[50vh] p-3 sm:p-4 rounded-[var(--radius)] border border-input bg-transparent cursor-text overflow-y-auto"
                      onClick={() => setShowSource(true)}
                    >
                      {localContent ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {localContent}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Clique para comecar a escrever...
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer - Desktop only */}
                <p className="hidden md:block text-xs text-muted-foreground text-center mt-3">
                  {currentNote.updatedAt
                    ? `Ultimo save: ${format(new Date(currentNote.updatedAt), "HH:mm 'de' dd/MM", { locale: ptBR })}`
                    : `Criado em: ${format(new Date(currentNote.createdAt), "HH:mm 'de' dd/MM", { locale: ptBR })}`}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Selecione uma nota ou crie uma nova
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile note selector - Fixed footer */}
      {notes.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-40">
          <div className="relative">
            {mobileListOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                {notes.map((note) => (
                  <NoteListItem key={note.id} note={note} />
                ))}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setMobileListOpen(!mobileListOpen)}
            >
              <div className="flex items-center gap-2 truncate">
                <StickyNote className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{currentNote?.title || 'Selecione uma nota'}</span>
              </div>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform flex-shrink-0', mobileListOpen && 'rotate-180')}
              />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!noteToDelete}
        onOpenChange={(open) => !open && setNoteToDelete(null)}
        title="Excluir nota"
        description="Tem certeza que deseja excluir esta nota? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDeleteNote}
        isLoading={isDeleting}
        variant="destructive"
        icon={Trash2}
      />
    </div>
  );
}

export default ScratchpadPage;
