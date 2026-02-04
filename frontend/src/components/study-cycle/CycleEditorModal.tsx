/**
 * Cycle Editor Modal - Create/edit study cycle
 */
import { useState, useEffect, useCallback } from 'react';
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
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubjectPicker } from '@/components/ui/subject-picker';
import { DisciplinePicker } from '@/components/ui/discipline-picker';
import { useRecentSubjects } from '@/hooks/useRecentSubjects';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SortableCycleItem } from './SortableCycleItem';
import {
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  Save,
  BookOpen,
  Layers,
} from 'lucide-react';
import { useStudyCycleStore, formatDuration } from '@/store/studyCycleStore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useDisciplineStore } from '@/store/disciplineStore';
import type { CreateCycleItemDto } from '@/types/api';

interface CycleEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit'; // 'create' for new cycle, 'edit' for editing active cycle
}

interface CycleItemForm extends CreateCycleItemDto {
  id: string; // Temporary ID for React key
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function CycleEditorModal({ open, onOpenChange, mode = 'edit' }: CycleEditorModalProps) {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { cycle, cycles, isLoading, createCycle, updateCycle, deleteCycle, refresh } =
    useStudyCycleStore();
  const { getActiveSubjects, findOrCreateSubject } = useSubjectStore();
  const { disciplines, fetchDisciplines, findOrCreateDiscipline } = useDisciplineStore();
  const subjects = getActiveSubjects();
  const { recentSubjects, addRecentSubject } = useRecentSubjects();

  const [items, setItems] = useState<CycleItemForm[]>([]);
  const [cycleName, setCycleName] = useState('');
  const [newSubjectId, setNewSubjectId] = useState('');
  const [newDisciplineId, setNewDisciplineId] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const [activateOnCreate, setActivateOnCreate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addItemType, setAddItemType] = useState<'subject' | 'discipline'>('subject');

  // Fetch disciplines when modal opens
  useEffect(() => {
    if (open && currentWorkspaceId) {
      fetchDisciplines(currentWorkspaceId);
    }
  }, [open, currentWorkspaceId, fetchDisciplines]);

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

  // Handle drag end for reordering
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setItems((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // Determine if editing or creating
  const isEditing = mode === 'edit' && !!cycle;

  // Load existing cycle data when modal opens
  useEffect(() => {
    if (open && isEditing && cycle) {
      setCycleName(cycle.name || '');
      setItems(
        cycle.items.map((item) => ({
          id: item.id,
          subjectId: item.subjectId || undefined,
          disciplineId: item.disciplineId || undefined,
          targetMinutes: item.targetMinutes,
        }))
      );
      setActivateOnCreate(false);
    } else if (open && !isEditing) {
      setCycleName('');
      setItems([]);
      setActivateOnCreate(cycles.length === 0);
    }
  }, [open, isEditing, cycle, cycles.length]);

  const handleAddItem = () => {
    if (!newMinutes) return;

    if (addItemType === 'subject' && newSubjectId) {
      setItems((prev) => [
        ...prev,
        {
          id: generateId(),
          subjectId: newSubjectId,
          targetMinutes: parseInt(newMinutes, 10),
        },
      ]);
      setNewSubjectId('');
    } else if (addItemType === 'discipline' && newDisciplineId) {
      setItems((prev) => [
        ...prev,
        {
          id: generateId(),
          disciplineId: newDisciplineId,
          targetMinutes: parseInt(newMinutes, 10),
        },
      ]);
      setNewDisciplineId('');
    }

    setNewMinutes('');
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getItemName = (item: CycleItemForm): string => {
    if (item.disciplineId) {
      const discipline = disciplines.find((d) => d.id === item.disciplineId);
      return discipline?.name || item.disciplineId;
    }
    if (item.subjectId) {
      const subject = subjects.find((s) => s.id === item.subjectId);
      return subject?.name || item.subjectId;
    }
    return 'Unknown';
  };

  const isItemDiscipline = (item: CycleItemForm): boolean => {
    return !!item.disciplineId;
  };

  const handleSave = async () => {
    if (!currentWorkspaceId || items.length === 0) return;
    if (!isEditing && !cycleName.trim()) return; // Name required for new cycles

    setIsSaving(true);
    try {
      if (isEditing) {
        const data = {
          name: cycleName.trim() || undefined,
          items: items.map(({ subjectId, disciplineId, targetMinutes }) => ({
            subjectId,
            disciplineId,
            targetMinutes,
          })),
        };
        await updateCycle(currentWorkspaceId, data);
      } else {
        const data = {
          name: cycleName.trim(),
          items: items.map(({ subjectId, disciplineId, targetMinutes }) => ({
            subjectId,
            disciplineId,
            targetMinutes,
          })),
          activateOnCreate,
        };
        await createCycle(currentWorkspaceId, data);
      }
      // Refresh all cycles
      if (currentWorkspaceId) {
        await refresh(currentWorkspaceId);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save cycle:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentWorkspaceId || !cycle) return;

    setIsDeleting(true);
    try {
      await deleteCycle(currentWorkspaceId);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete cycle:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate total duration
  const totalMinutes = items.reduce((acc, item) => acc + item.targetMinutes, 0);

  // Check if can add item
  const canAddItem =
    !!newMinutes &&
    ((addItemType === 'subject' && !!newSubjectId) ||
      (addItemType === 'discipline' && !!newDisciplineId));

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {cycle ? 'Editar Ciclo' : 'Criar Ciclo de Estudos'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Configure as matérias/disciplinas e o tempo de estudo para cada uma. O ciclo irá
            sugerir o que estudar baseado na ordem definida.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-2">
          {/* Cycle name */}
          <div className="space-y-2">
            <Label htmlFor="cycleName">
              Nome do ciclo {!isEditing && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id="cycleName"
              placeholder="Ex: Auditor-Fiscal"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
              maxLength={50}
              required={!isEditing}
            />
          </div>

          {/* Activate on create checkbox (only for new cycles) */}
          {!isEditing && cycles.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="activateOnCreate"
                checked={activateOnCreate}
                onCheckedChange={(checked) => setActivateOnCreate(checked === true)}
              />
              <Label htmlFor="activateOnCreate" className="text-sm font-normal cursor-pointer">
                Ativar este ciclo ao criar
              </Label>
            </div>
          )}

          {/* Add item form */}
          <div className="space-y-2">
            <Label>Adicionar ao ciclo</Label>

            {/* Type selector tabs */}
            <Tabs
              value={addItemType}
              onValueChange={(v) => setAddItemType(v as 'subject' | 'discipline')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="subject" className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Tópico
                </TabsTrigger>
                <TabsTrigger value="discipline" className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  Disciplina
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <div className="flex-1">
                {addItemType === 'subject' ? (
                  <SubjectPicker
                    value={newSubjectId}
                    onValueChange={setNewSubjectId}
                    subjects={subjects}
                    recentSubjects={recentSubjects}
                    onSubjectUsed={addRecentSubject}
                    onCreateSubject={
                      currentWorkspaceId
                        ? (name) => findOrCreateSubject(currentWorkspaceId, name)
                        : undefined
                    }
                    placeholder="Tópico"
                    searchPlaceholder="Buscar..."
                    emptyMessage="Nenhum encontrado"
                  />
                ) : (
                  <DisciplinePicker
                    value={newDisciplineId}
                    onValueChange={setNewDisciplineId}
                    disciplines={disciplines}
                    onCreateDiscipline={
                      currentWorkspaceId
                        ? (name) => findOrCreateDiscipline(currentWorkspaceId, name)
                        : undefined
                    }
                    placeholder="Selecione uma disciplina"
                    searchPlaceholder="Buscar disciplina..."
                    emptyMessage="Nenhuma disciplina encontrada"
                  />
                )}
              </div>
              <Input
                type="number"
                placeholder="Min"
                min="1"
                max="1440"
                value={newMinutes}
                onChange={(e) => setNewMinutes(e.target.value)}
                className="w-20"
              />
              <Button type="button" size="icon" onClick={handleAddItem} disabled={!canAddItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Items list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Ordem do ciclo</Label>
                <span className="text-xs text-muted-foreground">
                  Total: {formatDuration(totalMinutes)}
                </span>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {items.map((item, index) => (
                      <SortableCycleItem
                        key={item.id}
                        id={item.id}
                        index={index}
                        subjectName={getItemName(item)}
                        duration={formatDuration(item.targetMinutes)}
                        onRemove={() => handleRemoveItem(item.id)}
                        isDiscipline={isItemDiscipline(item)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Adicione matérias ou disciplinas para criar o ciclo
            </p>
          )}
        </div>

        <ResponsiveDialogFooter className="flex-col sm:flex-row gap-2">
          {cycle && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSaving || isLoading}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <ConfirmDialog
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            title="Excluir ciclo"
            description="Tem certeza que deseja excluir este ciclo? Esta ação não pode ser desfeita."
            confirmText="Excluir"
            cancelText="Cancelar"
            onConfirm={handleDelete}
            isLoading={isDeleting}
            variant="destructive"
            icon={Trash2}
          />
          <div className="flex-1" />
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              items.length === 0 || isSaving || isLoading || (!isEditing && !cycleName.trim())
            }
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

export default CycleEditorModal;
