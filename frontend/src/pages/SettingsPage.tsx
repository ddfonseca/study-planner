/**
 * Settings Page - User configuration
 */
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, User, Clock, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { minHours, desHours, updateConfig, isLoading } = useConfigStore();
  const { toast } = useToast();

  const [localMinHours, setLocalMinHours] = useState(minHours);
  const [localDesHours, setLocalDesHours] = useState(desHours);

  const handleSave = async () => {
    if (localMinHours < 0 || localDesHours < 0) {
      toast({
        title: 'Erro',
        description: 'Os valores devem ser maiores que 0',
        variant: 'destructive',
      });
      return;
    }

    if (localMinHours > localDesHours) {
      toast({
        title: 'Erro',
        description: 'O mínimo não pode ser maior que o desejado',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateConfig({
        minHours: localMinHours,
        desHours: localDesHours,
      });
      toast({
        title: 'Sucesso',
        description: 'Configurações salvas com sucesso!',
      });
    } catch {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Perfil
          </CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <div className="flex items-center gap-4">
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-16 w-16 rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Carregando...</p>
          )}
        </CardContent>
      </Card>

      {/* Study Goals Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Metas de Estudo
          </CardTitle>
          <CardDescription>
            Configure suas horas mínimas e desejadas por dia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minHours" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                Horas Mínimas
              </Label>
              <Input
                id="minHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={localMinHours}
                onChange={(e) => setLocalMinHours(parseFloat(e.target.value) || 0)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Dias que atingirem este valor ficam verdes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desHours" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                Horas Desejadas
              </Label>
              <Input
                id="desHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={localDesHours}
                onChange={(e) => setLocalDesHours(parseFloat(e.target.value) || 0)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Dias que atingirem este valor ficam azuis
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
