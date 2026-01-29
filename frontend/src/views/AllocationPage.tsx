/**
 * Allocation Page - Study time allocation calculator
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useAllocationStore } from '@/store/allocationStore';
import {
  ExamProfileCard,
  ExamProfileModal,
  AllocationResultCard,
} from '@/components/allocation';
import type { ExamProfile, CreateExamProfileDto, UpdateExamProfileDto } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export function AllocationPage() {
  const { workspaces, currentWorkspaceId } = useWorkspaceStore();
  const currentWorkspace = currentWorkspaceId
    ? workspaces.find(w => w.id === currentWorkspaceId) || null
    : null;
  const {
    profiles,
    currentProfile,
    allocationResult,
    isLoading,
    fetchProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    calculateAllocation,
    setCurrentProfile,
  } = useAllocationStore();
  const { toast } = useToast();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ExamProfile | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<ExamProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchProfiles(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchProfiles]);

  const handleCreateProfile = async (data: CreateExamProfileDto) => {
    try {
      await createProfile(data);
      toast({ title: 'Perfil criado com sucesso!' });
    } catch (error) {
      toast({ title: 'Erro ao criar perfil', variant: 'destructive' });
      throw error;
    }
  };

  const handleUpdateProfile = async (data: CreateExamProfileDto) => {
    if (!editingProfile) return;
    try {
      // Extract only the fields allowed in UpdateExamProfileDto (no workspaceId)
      const updateData: UpdateExamProfileDto = {
        name: data.name,
        examDate: data.examDate,
        weeklyHours: data.weeklyHours,
        subjects: data.subjects,
      };
      await updateProfile(editingProfile.id, updateData);
      toast({ title: 'Perfil atualizado!' });
      setEditingProfile(null);
    } catch (error) {
      toast({ title: 'Erro ao atualizar perfil', variant: 'destructive' });
      throw error;
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProfile(profileToDelete.id);
      toast({ title: 'Perfil excluído' });
      setProfileToDelete(null);
      setDeleteDialogOpen(false);
    } catch {
      toast({ title: 'Erro ao excluir perfil', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCalculate = async (profile: ExamProfile) => {
    try {
      setCurrentProfile(profile);
      await calculateAllocation(profile.id);
    } catch {
      toast({ title: 'Erro ao calcular alocação', variant: 'destructive' });
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Selecione um workspace para começar
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Alocação de Estudo</h1>
          <p className="text-muted-foreground mt-1">
            Calcule a distribuição ideal de horas por disciplina.{' '}
            <a
              href="/blog/modelo-alocacao-estudo-por-disciplina"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Entenda o modelo
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
        <Button onClick={() => { setEditingProfile(null); setProfileModalOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      {isLoading && profiles.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-lg font-medium text-foreground">Nenhum perfil criado</h3>
          <p className="text-muted-foreground mt-1">
            Crie seu primeiro perfil de concurso para calcular a alocação
          </p>
          <Button className="mt-4" onClick={() => { setEditingProfile(null); setProfileModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Perfil
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Seus Perfis</h2>
            <div className="grid gap-4">
              {profiles.map((profile) => (
                <ExamProfileCard
                  key={profile.id}
                  profile={profile}
                  onEdit={() => { setEditingProfile(profile); setProfileModalOpen(true); }}
                  onDelete={() => { setProfileToDelete(profile); setDeleteDialogOpen(true); }}
                  onCalculate={() => handleCalculate(profile)}
                />
              ))}
            </div>
          </div>

          {allocationResult && currentProfile && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Resultado: {currentProfile.name}</h2>
              <AllocationResultCard allocation={allocationResult} />
            </div>
          )}
        </div>
      )}

      <ExamProfileModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        profile={editingProfile}
        workspaceId={currentWorkspace.id}
        onSave={editingProfile?.id ? handleUpdateProfile : handleCreateProfile}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir perfil?"
        description={`Esta ação não pode ser desfeita. O perfil "${profileToDelete?.name}" será excluído permanentemente.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleDeleteProfile}
        isLoading={isDeleting}
        variant="destructive"
        icon={Trash2}
      />
    </div>
  );
}

export default AllocationPage;
