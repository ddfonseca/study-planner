/**
 * Workspace Manager - Modal for managing workspaces (create, rename, delete)
 */
import { useState } from 'react';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogFooter,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspaceStore } from '@/store/workspaceStore';
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Check,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import type { Workspace } from '@/types/api';
import { useCanUseFeature, FEATURES } from '@/hooks/useSubscriptionLimits';
import { LimitIndicator, UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { PricingModal } from '@/components/subscription';

interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Preset colors for workspaces
const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

export function WorkspaceManager({ isOpen, onClose }: WorkspaceManagerProps) {
  const {
    workspaces,
    isLoading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  } = useWorkspaceStore();

  // Check workspace limit from subscription
  const workspaceLimit = useCanUseFeature(FEATURES.MAX_WORKSPACES, workspaces.length);
  const canCreateMore = workspaceLimit.canUse;

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [moveToDefault, setMoveToDefault] = useState(true);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetState = () => {
    setIsCreating(false);
    setNewName('');
    setNewColor(PRESET_COLORS[0]);
    setEditingId(null);
    setEditName('');
    setEditColor('');
    setDeletingId(null);
    setDeleteConfirmName('');
    setMoveToDefault(true);
    setError(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await createWorkspace({ name: newName.trim(), color: newColor });
      setIsCreating(false);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditName(workspace.name);
    setEditColor(workspace.color || PRESET_COLORS[0]);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateWorkspace(editingId, { name: editName.trim(), color: editColor });
      setEditingId(null);
      setEditName('');
      setEditColor('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
    setError(null);
  };

  const handleStartDelete = (workspace: Workspace) => {
    setDeletingId(workspace.id);
    setDeleteConfirmName('');
    setMoveToDefault(true);
    setError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;

    const workspace = workspaces.find((w) => w.id === deletingId);
    if (!workspace) return;

    if (deleteConfirmName !== workspace.name) {
      setError('Digite o nome do workspace para confirmar');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await deleteWorkspace(deletingId, moveToDefault);
      setDeletingId(null);
      setDeleteConfirmName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar workspace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingId(null);
    setDeleteConfirmName('');
    setError(null);
  };

  const deletingWorkspace = workspaces.find((w) => w.id === deletingId);

  return (
    <>
    <ResponsiveDialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <ResponsiveDialogContent className="sm:max-w-[500px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Gerenciar Workspaces</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Workspace list */}
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card"
              >
                {editingId === workspace.id ? (
                  // Edit mode
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nome do workspace"
                        disabled={isSaving}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1" role="radiogroup" aria-label="Cor do workspace">
                      {PRESET_COLORS.map((color, index) => (
                        <button
                          key={color}
                          type="button"
                          role="radio"
                          aria-checked={editColor === color}
                          aria-label={`Cor ${index + 1}`}
                          className={`h-6 w-6 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            editColor === color
                              ? 'border-foreground scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setEditColor(color);
                            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                              e.preventDefault();
                              const nextIndex = (index + 1) % PRESET_COLORS.length;
                              setEditColor(PRESET_COLORS[nextIndex]);
                              (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prevIndex = (index - 1 + PRESET_COLORS.length) % PRESET_COLORS.length;
                              setEditColor(PRESET_COLORS[prevIndex]);
                              (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
                            }
                          }}
                          tabIndex={editColor === color ? 0 : -1}
                          disabled={isSaving}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div
                      className="h-4 w-4 rounded-full shrink-0"
                      style={{ backgroundColor: workspace.color || '#6366f1' }}
                    />
                    <span className="flex-1 font-medium">
                      {workspace.name}
                      {workspace.isDefault && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Padrão)
                        </span>
                      )}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleStartEdit(workspace)}
                      disabled={isLoading}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!workspace.isDefault && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartDelete(workspace)}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Delete confirmation */}
          {deletingId && deletingWorkspace && (
            <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">
                    Deletar "{deletingWorkspace.name}"?
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">
                  O que fazer com as sessões deste workspace?
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={moveToDefault}
                      onChange={() => setMoveToDefault(true)}
                      disabled={isSaving}
                    />
                    Mover para "Geral"
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={!moveToDefault}
                      onChange={() => setMoveToDefault(false)}
                      disabled={isSaving}
                    />
                    Deletar tudo
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm">
                  Digite "{deletingWorkspace.name}" para confirmar:
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder={deletingWorkspace.name}
                  disabled={isSaving}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDelete}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmDelete}
                  disabled={isSaving || deleteConfirmName !== deletingWorkspace.name}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Deletar
                </Button>
              </div>
            </div>
          )}

          {/* Create new workspace */}
          {isCreating ? (
            <div className="p-4 rounded-lg border bg-muted/50 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-name">Nome do Workspace</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Trabalho, Pessoal, Faculdade..."
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-1" role="radiogroup" aria-label="Cor do workspace">
                  {PRESET_COLORS.map((color, index) => (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={newColor === color}
                      aria-label={`Cor ${index + 1}`}
                      className={`h-6 w-6 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        newColor === color
                          ? 'border-foreground scale-110'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColor(color)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setNewColor(color);
                        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          const nextIndex = (index + 1) % PRESET_COLORS.length;
                          setNewColor(PRESET_COLORS[nextIndex]);
                          (e.currentTarget.nextElementSibling as HTMLElement)?.focus();
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          const prevIndex = (index - 1 + PRESET_COLORS.length) % PRESET_COLORS.length;
                          setNewColor(PRESET_COLORS[prevIndex]);
                          (e.currentTarget.previousElementSibling as HTMLElement)?.focus();
                        }
                      }}
                      tabIndex={newColor === color ? 0 : -1}
                      disabled={isSaving}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                    setError(null);
                  }}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleCreate} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Criar
                </Button>
              </div>
            </div>
          ) : canCreateMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsCreating(true)}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Workspace
              <LimitIndicator
                feature={FEATURES.MAX_WORKSPACES}
                currentUsage={workspaces.length}
                className="ml-auto"
              />
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full opacity-60"
                disabled
              >
                <Lock className="h-4 w-4 mr-2" />
                Novo Workspace
                <LimitIndicator
                  feature={FEATURES.MAX_WORKSPACES}
                  currentUsage={workspaces.length}
                  className="ml-auto"
                />
              </Button>
              <UpgradePrompt
                feature={FEATURES.MAX_WORKSPACES}
                currentUsage={workspaces.length}
                variant="inline"
                onUpgradeClick={() => setPricingModalOpen(true)}
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
    <PricingModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
  </>
  );
}

export default WorkspaceManager;
