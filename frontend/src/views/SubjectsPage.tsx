/**
 * Subjects Management Page
 * Manage, edit, archive, and merge study subjects
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSubjectStore } from '@/store/subjectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useCategoryStore } from '@/store/categoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { MultiCategorySelect } from '@/components/ui/multi-category-select';
import { ColorPicker } from '@/components/ui/color-picker';
import { SortableSubjectItem } from '@/components/subjects/SortableSubjectItem';
import {
  BookOpen,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Merge,
  Loader2,
  Check,
  X,
  Eye,
  EyeOff,
  Tag,
  Filter,
  Settings2,
  Trash2,
  AlertTriangle,
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
  categoryIds: string[];
}

export function SubjectsContent() {
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
    permanentDeleteSubject,
    mergeSubjects,
    reorderSubjects,
    setError,
  } = useSubjectStore();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const {
    categories,
    fetchCategories,
    createCategory,
    deleteCategory,
    isSaving: isSavingCategory,
  } = useCategoryStore();

  const [showArchived, setShowArchived] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<EditingSubject | null>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [managingCategories, setManagingCategories] = useState(false);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Fetch subjects and categories when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchSubjects(currentWorkspace.id, showArchived);
      fetchCategories(currentWorkspace.id);
    }
  }, [currentWorkspace, showArchived, fetchSubjects, fetchCategories]);

  // Filter subjects based on archived state and categories
  const activeSubjects = subjects.filter(s => !s.archivedAt);
  const archivedSubjects = subjects.filter(s => s.archivedAt);
  const filteredByArchive = showArchived ? subjects : activeSubjects;
  const displayedSubjects = useMemo(() => {
    if (selectedCategoryIds.length === 0) {
      return filteredByArchive;
    }
    return filteredByArchive.filter(s =>
      s.categories?.some(sc => selectedCategoryIds.includes(sc.categoryId))
    );
  }, [filteredByArchive, selectedCategoryIds]);

  // Handle category filter toggle
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Handle create category inline
  const handleCreateCategory = async (name: string) => {
    if (!currentWorkspace) throw new Error('No workspace');
    return createCategory(currentWorkspace.id, { name });
  };

  // Handle delete category
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      setConfirmDeleteCategory(null);
      // Remove from filter if selected
      setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
    } catch {
      // Error is handled in store
    }
  };

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
      categoryIds: subject.categories?.map(sc => sc.categoryId) || [],
    });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingSubject) return;
    try {
      await updateSubject(editingSubject.id, {
        name: editingSubject.name,
        color: editingSubject.color ?? undefined,
        categoryIds: editingSubject.categoryIds,
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

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    if (!deletingSubjectId) return;

    const subject = subjects.find((s) => s.id === deletingSubjectId);
    if (!subject || deleteConfirmName !== subject.name) return;

    try {
      await permanentDeleteSubject(deletingSubjectId);
      setDeletingSubjectId(null);
      setDeleteConfirmName('');
    } catch {
      // Error is handled in store
    }
  };

  // Cancel permanent delete
  const handleCancelDelete = () => {
    setDeletingSubjectId(null);
    setDeleteConfirmName('');
  };

  // Get deleting subject for display
  const deletingSubject = subjects.find((s) => s.id === deletingSubjectId);

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

  // Handle drag end for reordering
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id || !currentWorkspace) {
        return;
      }

      // Only reorder non-archived subjects
      const activeSubjects = subjects.filter((s) => !s.archivedAt);
      const oldIndex = activeSubjects.findIndex((s) => s.id === active.id);
      const newIndex = activeSubjects.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reordered = arrayMove(activeSubjects, oldIndex, newIndex);
      const newSubjectIds = reordered.map((s) => s.id);

      try {
        await reorderSubjects(currentWorkspace.id, newSubjectIds);
      } catch {
        // Error is handled in store
      }
    },
    [subjects, currentWorkspace, reorderSubjects]
  );

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tópicos</h1>
          <p className="text-muted-foreground">
            Gerencie os tópicos do workspace {currentWorkspace.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {!managingCategories && (
            <Button
              variant={selectedCategoryIds.length === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategoryIds([])}
            >
              Todos
            </Button>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center">
              <Button
                variant={selectedCategoryIds.includes(cat.id) ? "default" : "outline"}
                size="sm"
                onClick={() => !managingCategories && handleCategoryToggle(cat.id)}
                className={cn("gap-1", managingCategories && "rounded-r-none border-r-0")}
              >
                <Tag className="h-3 w-3" />
                {cat.name}
              </Button>
              {managingCategories && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-l-none px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmDeleteCategory(cat.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setManagingCategories(!managingCategories)}
            className="ml-2"
          >
            {managingCategories ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Concluir
              </>
            ) : (
              <>
                <Settings2 className="h-3 w-3 mr-1" />
                Gerenciar
              </>
            )}
          </Button>
        </div>
      )}

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={displayedSubjects.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {displayedSubjects.map((subject) => {
                const isEditing = editingSubject?.id === subject.id;
                const isSelected = selectedForMerge.has(subject.id);
                const isArchived = !!subject.archivedAt;

                return (
                  <SortableSubjectItem
                    key={subject.id}
                    subject={subject}
                    disabled={isArchived || isEditing || isMerging}
                  >
                    <div
                      className={cn(
                        "flex-1 flex items-center gap-3",
                        isSelected && "border-primary bg-primary/5",
                        isArchived && "opacity-60",
                        isMerging && isSelected && "cursor-pointer"
                      )}
                      onClick={() => {
                        if (isMerging && isSelected) {
                          setMergeTarget(subject.id);
                          handleMerge();
                        }
                      }}
                    >
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
                        <ColorPicker
                          value={editingSubject?.color ?? null}
                          onValueChange={(color) => setEditingSubject({ ...editingSubject!, color })}
                          colors={COLOR_OPTIONS}
                        />
                      ) : (
                        <span
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: subject.color || '#6b7280' }}
                        />
                      )}

                      {/* Name and Category */}
                      {isEditing ? (
                        <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:items-center min-w-0">
                          <Input
                            value={editingSubject?.name || ''}
                            onChange={(e) => setEditingSubject({ ...editingSubject!, name: e.target.value })}
                            className="flex-1 h-8 min-w-0"
                            placeholder="Nome"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') setEditingSubject(null);
                            }}
                          />
                          <div className="w-full sm:w-48 shrink-0">
                            <MultiCategorySelect
                              value={editingSubject?.categoryIds || []}
                              onValueChange={(categoryIds) => setEditingSubject({ ...editingSubject!, categoryIds })}
                              categories={categories}
                              onCreateCategory={handleCreateCategory}
                              placeholder="Categorias"
                              className="h-8"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center gap-2 flex-wrap">
                          <span className={cn("font-medium", isArchived && "line-through")}>
                            {subject.name}
                          </span>
                          {subject.categories?.map((sc) => (
                            <Badge key={sc.id} variant="outline" className="text-xs font-normal">
                              <Tag className="h-2.5 w-2.5 mr-1" />
                              {sc.category.name}
                            </Badge>
                          ))}
                        </div>
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
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleUnarchive(subject.id)}
                                  title="Desarquivar"
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeletingSubjectId(subject.id)}
                                  title="Deletar permanentemente"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
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
                  </SortableSubjectItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Archive confirmation dialog */}
      <ConfirmDialog
        open={!!confirmArchive}
        onOpenChange={(open) => !open && setConfirmArchive(null)}
        title="Arquivar tópico?"
        description="O tópico será ocultado da lista, mas todo o histórico será mantido. Você pode desarquivá-lo a qualquer momento."
        confirmText="Arquivar"
        onConfirm={() => { if (confirmArchive) handleArchive(confirmArchive); }}
        isLoading={isSaving}
      />

      {/* Delete category confirmation dialog */}
      <ConfirmDialog
        open={!!confirmDeleteCategory}
        onOpenChange={(open) => !open && setConfirmDeleteCategory(null)}
        title="Deletar categoria?"
        description="A categoria será removida permanentemente. Os tópicos não serão afetados, apenas perderão esta categoria."
        confirmText="Deletar"
        variant="destructive"
        onConfirm={() => { if (confirmDeleteCategory) handleDeleteCategory(confirmDeleteCategory); }}
        isLoading={isSavingCategory}
      />

      {/* Permanent delete confirmation dialog */}
      {deletingSubjectId && deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={handleCancelDelete}
          />
          <div className="relative z-50 w-full max-w-md p-6 bg-background rounded-lg border shadow-lg mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-lg text-destructive">
                  Deletar "{deletingSubject.name}" permanentemente?
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Esta ação é irreversível. Todas as horas de estudo registradas
                  neste tópico serão perdidas permanentemente.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="confirm-delete-subject" className="text-sm">
                  Digite "{deletingSubject.name}" para confirmar:
                </Label>
                <Input
                  id="confirm-delete-subject"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={deletingSubject.name}
                  disabled={isSaving}
                  autoFocus
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancelDelete}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handlePermanentDelete}
                  disabled={isSaving || deleteConfirmName !== deletingSubject.name}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Deletar permanentemente
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SubjectsPage() {
  return <SubjectsContent />;
}

export default SubjectsPage;
