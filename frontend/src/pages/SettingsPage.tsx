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

  const [localMinHours, setLocalMinHours] = useState(String(minHours));
  const [localDesHours, setLocalDesHours] = useState(String(desHours));

  const handleSave = async () => {
    const minValue = parseFloat(localMinHours) || 0;
    const desValue = parseFloat(localDesHours) || 0;

    if (minValue < 0 || desValue < 0) {
      toast({
        title: 'Erro',
        description: 'Os valores devem ser maiores que 0',
        variant: 'destructive',
      });
      return;
    }

    if (minValue > desValue) {
      toast({
        title: 'Erro',
        description: 'O mínimo não pode ser maior que o desejado',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateConfig({
        minHours: minValue,
        desHours: desValue,
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

      {/* Weekly Goals Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Metas Semanais Padrão
          </CardTitle>
          <CardDescription>
            Configure o padrão de horas para novas semanas. Você pode personalizar semanas individuais clicando na coluna "Total" do calendário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="minHours" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Horas Mínimas por Semana
              </Label>
              <Input
                id="minHours"
                type="number"
                min="0"
                max="168"
                step="0.5"
                value={localMinHours}
                onChange={(e) => setLocalMinHours(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Semanas que atingirem este total ficam verdes
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desHours" className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Horas Desejadas por Semana
              </Label>
              <Input
                id="desHours"
                type="number"
                min="0"
                max="168"
                step="0.5"
                value={localDesHours}
                onChange={(e) => setLocalDesHours(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Semanas que atingirem este total ficam azuis
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
