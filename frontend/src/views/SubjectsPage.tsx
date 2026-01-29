/**
 * Subjects Management Page
 * Manage, edit, archive, and merge study subjects
 */
import { useState, useEffect, useCallback } from 'react';
import { useSubjectStore } from '@/store/subjectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  BookOpen,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Merge,
  Loader2,
  GripVertical,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Subject } from '@/types/api';

// Color palette for subjects
const COLOR_OPTIONS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  null,      // no color
];

interface EditingSubject {
  id: string;
  name: string;
  color: string | null;
}

export function SubjectsPage() {
  const { workspaces, currentWorkspaceId } = useWorkspaceStore();
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || null;
  const {
    subjects,
    isLoading,
    isSaving,
    error,
    fetchSubjects,
    createSubject,
    updateSubject,
    archiveSubject,
    unarchiveSubject,
    mergeSubjects,
    setError,
  } = useSubjectStore();

  const [showArchived, setShowArchived] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<EditingSubject | null>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);

  // Fetch subjects when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchSubjects(currentWorkspace.id, showArchived);
    }
  }, [currentWorkspace, showArchived, fetchSubjects]);

  // Filter subjects based on archived state
  const activeSubjects = subjects.filter(s => !s.archivedAt);
  const archivedSubjects = subjects.filter(s => s.archivedAt);
  const displayedSubjects = showArchived ? subjects : activeSubjects;

  // Handle create new subject
  const handleCreate = useCallback(async () => {
    if (!currentWorkspace || !newSubjectName.trim()) return;
    try {
      await createSubject(currentWorkspace.id, { name: newSubjectName.trim() });
      setNewSubjectName('');
    } catch {
      // Error is handled in store
    }
  }, [currentWorkspace, newSubjectName, createSubject]);

  // Handle start editing
  const handleStartEdit = (subject: Subject) => {
    setEditingSubject({
      id: subject.id,
      name: subject.name,
      color: subject.color,
    });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingSubject) return;
    try {
      await updateSubject(editingSubject.id, {
        name: editingSubject.name,
        color: editingSubject.color ?? undefined,
      });
      setEditingSubject(null);
    } catch {
      // Error is handled in store
    }
  };

  // Handle archive
  const handleArchive = async (id: string) => {
    try {
      await archiveSubject(id);
      setConfirmArchive(null);
    } catch {
      // Error is handled in store
    }
  };

  // Handle unarchive
  const handleUnarchive = async (id: string) => {
    try {
      await unarchiveSubject(id);
    } catch {
      // Error is handled in store
    }
  };

  // Toggle merge selection
  const toggleMergeSelection = (id: string) => {
    setSelectedForMerge(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Start merge flow
  const startMerge = () => {
    if (selectedForMerge.size < 2) return;
    setIsMerging(true);
  };

  // Execute merge
  const handleMerge = async () => {
    if (!mergeTarget || selectedForMerge.size < 2) return;
    const sourceIds = Array.from(selectedForMerge).filter(id => id !== mergeTarget);
    try {
      await mergeSubjects({ sourceIds, targetId: mergeTarget });
      setSelectedForMerge(new Set());
      setMergeTarget(null);
      setIsMerging(false);
    } catch {
      // Error is handled in store
    }
  };

  // Cancel merge
  const cancelMerge = () => {
    setIsMerging(false);
    setMergeTarget(null);
  };

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum workspace selecionado</h2>
        <p className="text-muted-foreground">
          Selecione um workspace para gerenciar os tópicos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tópicos</h1>
          <p className="text-muted-foreground">
            Gerencie os tópicos do workspace {currentWorkspace.name}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
        >
          {showArchived ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Ocultar arquivadas
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Mostrar arquivadas ({archivedSubjects.length})
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Add new subject */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome do novo tópico..."
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          disabled={isSaving}
          className="max-w-md"
        />
        <Button
          onClick={handleCreate}
          disabled={!newSubjectName.trim() || isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Adicionar
        </Button>
      </div>

      {/* Merge controls */}
      {selectedForMerge.size > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedForMerge.size} tópicos selecionados
          </span>
          {isMerging ? (
            <>
              <span className="text-sm text-muted-foreground">
                Selecione o tópico de destino:
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelMerge}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={startMerge}
                disabled={selectedForMerge.size < 2}
              >
                <Merge className="h-4 w-4 mr-2" />
                Mesclar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedForMerge(new Set())}
              >
                Limpar seleção
              </Button>
            </>
          )}
        </div>
      )}

      {/* Subjects list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : displayedSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum tópico cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando seu primeiro tópico acima.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedSubjects.map((subject) => {
            const isEditing = editingSubject?.id === subject.id;
            const isSelected = selectedForMerge.has(subject.id);
            const isArchived = !!subject.archivedAt;

            return (
              <div
                key={subject.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                  isSelected && "border-primary bg-primary/5",
                  isArchived && "opacity-60",
                  isMerging && isSelected && "cursor-pointer hover:bg-primary/10"
                )}
                onClick={() => {
                  if (isMerging && isSelected) {
                    setMergeTarget(subject.id);
                    handleMerge();
                  }
                }}
              >
                {/* Drag handle (visual only for now) */}
                <GripVertical className="h-5 w-5 text-muted-foreground/50 cursor-grab" />

                {/* Merge checkbox */}
                {!isArchived && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMergeSelection(subject.id)}
                    className="h-4 w-4 rounded border-gray-300"
                    disabled={isMerging}
                  />
                )}

                {/* Color indicator */}
                {isEditing ? (
                  <div className="flex gap-1">
                    {COLOR_OPTIONS.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => setEditingSubject({ ...editingSubject!, color })}
                        className={cn(
                          "w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                          editingSubject?.color === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color || 'transparent' }}
                      >
                        {color === null && <X className="h-3 w-3 mx-auto text-muted-foreground" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: subject.color || '#6b7280' }}
                  />
                )}

                {/* Name */}
                {isEditing ? (
                  <Input
                    value={editingSubject?.name || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject!, name: e.target.value })}
                    className="flex-1 h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') setEditingSubject(null);
                    }}
                  />
                ) : (
                  <span className={cn("flex-1 font-medium", isArchived && "line-through")}>
                    {subject.name}
                  </span>
                )}

                {/* Archived badge */}
                {isArchived && (
                  <Badge variant="secondary" className="text-xs">
                    Arquivada
                  </Badge>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingSubject(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {!isArchived && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(subject)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {isArchived ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUnarchive(subject.id)}
                          title="Desarquivar"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setConfirmArchive(subject.id)}
                          title="Arquivar"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Archive confirmation dialog */}
      <ConfirmDialog
        open={!!confirmArchive}
        onOpenChange={(open) => !open && setConfirmArchive(null)}
        title="Arquivar tópico?"
        description="O tópico será ocultado da lista, mas todo o histórico será mantido. Você pode desarquivá-lo a qualquer momento."
        confirmText="Arquivar"
        onConfirm={() => confirmArchive && handleArchive(confirmArchive)}
        isLoading={isSaving}
      />
    </div>
  );
}

export default SubjectsPage;
