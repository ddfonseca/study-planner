/**
 * Cycle Editor Modal - Create/edit study cycle
 */
import { useState, useEffect } from 'react';
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
import { Combobox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import {
  RefreshCw,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
  Save,
} from 'lucide-react';
import { useStudyCycleStore, formatDuration } from '@/store/studyCycleStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useSessions } from '@/hooks/useSessions';
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
  const { cycle, cycles, isLoading, createCycle, updateCycle, deleteCycle, refresh } = useStudyCycleStore();
  const { getUniqueSubjects } = useSessions();
  const subjects = getUniqueSubjects();

  const [items, setItems] = useState<CycleItemForm[]>([]);
  const [cycleName, setCycleName] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const [activateOnCreate, setActivateOnCreate] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Determine if editing or creating
  const isEditing = mode === 'edit' && !!cycle;

  // Load existing cycle data when modal opens
  useEffect(() => {
    if (open && isEditing && cycle) {
      setCycleName(cycle.name || '');
      setItems(
        cycle.items.map((item) => ({
          id: item.id,
          subject: item.subject,
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
    if (!newSubject.trim() || !newMinutes) return;

    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        subject: newSubject.trim(),
        targetMinutes: parseInt(newMinutes, 10),
      },
    ]);
    setNewSubject('');
    setNewMinutes('');
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
      return newItems;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems((prev) => {
      const newItems = [...prev];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      return newItems;
    });
  };

  const handleSave = async () => {
    if (!currentWorkspaceId || items.length === 0) return;
    if (!isEditing && !cycleName.trim()) return; // Name required for new cycles

    setIsSaving(true);
    try {
      if (isEditing) {
        const data = {
          name: cycleName.trim() || undefined,
          items: items.map(({ subject, targetMinutes }) => ({ subject, targetMinutes })),
        };
        await updateCycle(currentWorkspaceId, data);
      } else {
        const data = {
          name: cycleName.trim(),
          items: items.map(({ subject, targetMinutes }) => ({ subject, targetMinutes })),
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

    if (!confirm('Tem certeza que deseja excluir este ciclo?')) return;

    setIsSaving(true);
    try {
      await deleteCycle(currentWorkspaceId);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete cycle:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total duration
  const totalMinutes = items.reduce((acc, item) => acc + item.targetMinutes, 0);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {cycle ? 'Editar Ciclo' : 'Criar Ciclo de Estudos'}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Configure as matérias e o tempo de estudo para cada uma.
            O ciclo irá sugerir o que estudar baseado na ordem definida.
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
              placeholder="Ex: Concurso TRT"
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
            <Label>Adicionar matéria</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Combobox
                  value={newSubject}
                  onValueChange={setNewSubject}
                  options={subjects}
                  placeholder="Matéria"
                  searchPlaceholder="Buscar..."
                  emptyMessage="Nenhuma encontrada"
                />
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
              <Button
                type="button"
                size="icon"
                onClick={handleAddItem}
                disabled={!newSubject.trim() || !newMinutes}
              >
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
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <span className="text-xs text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <span className="flex-1 text-sm font-medium truncate">
                      {item.subject}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(item.targetMinutes)}
                    </span>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Adicione matérias para criar o ciclo
            </p>
          )}
        </div>

        <ResponsiveDialogFooter className="flex-col sm:flex-row gap-2">
          {cycle && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving || isLoading}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
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
            disabled={items.length === 0 || isSaving || isLoading || (!isEditing && !cycleName.trim())}
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
