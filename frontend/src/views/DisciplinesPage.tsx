/**
 * Disciplines Management Page
 * Manage disciplines that group related subjects for study cycles
 */
import { useState, useEffect } from 'react';
import { useDisciplineStore } from '@/store/disciplineStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Color palette for disciplines
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
  null, // no color
];

interface EditingDiscipline {
  id: string;
  name: string;
  color: string | null;
}

export function DisciplinesPage() {
  const { workspaces, currentWorkspaceId } = useWorkspaceStore();
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || null;
  const {
    disciplines,
    isLoading,
    isSaving,
    error,
    fetchDisciplines,
    createDiscipline,
    updateDiscipline,
    addSubjectsToDiscipline,
    removeSubjectsFromDiscipline,
    deleteDiscipline,
    setError,
  } = useDisciplineStore();

  const { subjects, fetchSubjects, getActiveSubjects } = useSubjectStore();
  const activeSubjects = getActiveSubjects();

  const [newDisciplineName, setNewDisciplineName] = useState('');
  const [editingDiscipline, setEditingDiscipline] = useState<EditingDiscipline | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedDisciplines, setExpandedDisciplines] = useState<Set<string>>(new Set());
  const [addingSubjectTo, setAddingSubjectTo] = useState<string | null>(null);

  // Fetch disciplines and subjects when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      fetchDisciplines(currentWorkspace.id);
      fetchSubjects(currentWorkspace.id);
    }
  }, [currentWorkspace, fetchDisciplines, fetchSubjects]);

  // Handle create new discipline
  const handleCreate = async () => {
    if (!currentWorkspace || !newDisciplineName.trim()) return;
    try {
      await createDiscipline(currentWorkspace.id, { name: newDisciplineName.trim() });
      setNewDisciplineName('');
    } catch {
      // Error is handled in store
    }
  };

  // Handle start editing
  const handleStartEdit = (discipline: { id: string; name: string; color: string | null }) => {
    setEditingDiscipline({
      id: discipline.id,
      name: discipline.name,
      color: discipline.color,
    });
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingDiscipline) return;
    try {
      await updateDiscipline(editingDiscipline.id, {
        name: editingDiscipline.name,
        color: editingDiscipline.color ?? undefined,
      });
      setEditingDiscipline(null);
    } catch {
      // Error is handled in store
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteDiscipline(id);
      setConfirmDelete(null);
    } catch {
      // Error is handled in store
    }
  };

  // Handle add subject to discipline
  const handleAddSubject = async (disciplineId: string, subjectId: string) => {
    try {
      await addSubjectsToDiscipline(disciplineId, [subjectId]);
      setAddingSubjectTo(null);
    } catch {
      // Error is handled in store
    }
  };

  // Handle remove subject from discipline
  const handleRemoveSubject = async (disciplineId: string, subjectId: string) => {
    try {
      await removeSubjectsFromDiscipline(disciplineId, [subjectId]);
    } catch {
      // Error is handled in store
    }
  };

  // Toggle expanded state
  const toggleExpanded = (id: string) => {
    setExpandedDisciplines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get subjects not in any discipline (or in current discipline)
  const getAvailableSubjects = (currentDisciplineId: string) => {
    const disciplineSubjectIds = new Set(
      disciplines
        .filter((d) => d.id !== currentDisciplineId)
        .flatMap((d) => d.subjects.map((s) => s.id))
    );
    return activeSubjects.filter((s) => !disciplineSubjectIds.has(s.id));
  };

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Layers className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Nenhum workspace selecionado</h2>
        <p className="text-muted-foreground">
          Selecione um workspace para gerenciar as disciplinas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Disciplinas</h1>
        <p className="text-muted-foreground">
          Agrupe tópicos relacionados em disciplinas para usar no ciclo de estudos
        </p>
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

      {/* Add new discipline */}
      <div className="flex gap-2">
        <Input
          placeholder="Nome da nova disciplina..."
          value={newDisciplineName}
          onChange={(e) => setNewDisciplineName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          disabled={isSaving}
          className="max-w-md"
        />
        <Button onClick={handleCreate} disabled={!newDisciplineName.trim() || isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Adicionar
        </Button>
      </div>

      {/* Disciplines list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : disciplines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
          <Layers className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma disciplina cadastrada</h3>
          <p className="text-muted-foreground mb-4">
            Crie disciplinas para agrupar tópicos relacionados.
            <br />
            Ex: "Inglês" pode conter "Listening", "Grammar", "Reading"
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {disciplines.map((discipline) => {
            const isEditing = editingDiscipline?.id === discipline.id;
            const isExpanded = expandedDisciplines.has(discipline.id);
            const availableSubjects = getAvailableSubjects(discipline.id);
            const unassignedSubjects = availableSubjects.filter(
              (s) => !discipline.subjects.some((ds) => ds.id === s.id)
            );

            return (
              <Collapsible
                key={discipline.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(discipline.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  {/* Discipline header */}
                  <div
                    className={cn(
                      'flex items-center gap-3 p-3 bg-muted/30',
                      isExpanded && 'border-b'
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>

                    {/* Color indicator */}
                    {isEditing ? (
                      <div className="flex gap-1">
                        {COLOR_OPTIONS.map((color, i) => (
                          <button
                            key={i}
                            onClick={() =>
                              setEditingDiscipline({ ...editingDiscipline!, color })
                            }
                            className={cn(
                              'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                              editingDiscipline?.color === color &&
                                'ring-2 ring-offset-2 ring-primary'
                            )}
                            style={{ backgroundColor: color || 'transparent' }}
                          >
                            {color === null && (
                              <X className="h-3 w-3 mx-auto text-muted-foreground" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: discipline.color || '#6b7280' }}
                      />
                    )}

                    {/* Name */}
                    {isEditing ? (
                      <Input
                        value={editingDiscipline?.name || ''}
                        onChange={(e) =>
                          setEditingDiscipline({ ...editingDiscipline!, name: e.target.value })
                        }
                        className="flex-1 h-8"
                        placeholder="Nome"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') setEditingDiscipline(null);
                        }}
                      />
                    ) : (
                      <span className="flex-1 font-medium">{discipline.name}</span>
                    )}

                    {/* Subject count */}
                    <Badge variant="secondary" className="text-xs">
                      {discipline.subjects.length} tópicos
                    </Badge>

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
                            onClick={() => setEditingDiscipline(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(discipline)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setConfirmDelete(discipline.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Subjects list */}
                  <CollapsibleContent>
                    <div className="p-3 space-y-2">
                      {discipline.subjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nenhum tópico vinculado a esta disciplina
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {discipline.subjects.map((subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                            >
                              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="flex-1 text-sm">{subject.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveSubject(discipline.id, subject.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add subject */}
                      {addingSubjectTo === discipline.id ? (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Selecione um tópico para adicionar:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {unassignedSubjects.length === 0 ? (
                              <p className="text-xs text-muted-foreground">
                                Todos os tópicos já estão em disciplinas
                              </p>
                            ) : (
                              unassignedSubjects.map((subject) => (
                                <Button
                                  key={subject.id}
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleAddSubject(discipline.id, subject.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  {subject.name}
                                </Button>
                              ))
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAddingSubjectTo(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setAddingSubjectTo(discipline.id)}
                        >
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Adicionar tópico
                        </Button>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Deletar disciplina?"
        description="A disciplina será removida permanentemente. Os tópicos não serão afetados, apenas perderão o vínculo com esta disciplina."
        confirmText="Deletar"
        variant="destructive"
        onConfirm={() => {
          if (confirmDelete) handleDelete(confirmDelete);
        }}
        isLoading={isSaving}
      />
    </div>
  );
}

export default DisciplinesPage;
