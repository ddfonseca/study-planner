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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, User, Clock, Calendar, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { targetHours, weekStartDay, updateConfig, isLoading } = useConfigStore();
  const { toast } = useToast();

  const [localTargetHours, setLocalTargetHours] = useState(String(targetHours));
  const [localWeekStartDay, setLocalWeekStartDay] = useState(String(weekStartDay));

  const handleSave = async () => {
    const targetValue = parseFloat(localTargetHours) || 0;
    const weekStartValue = parseInt(localWeekStartDay, 10);

    if (targetValue < 0) {
      toast({
        title: 'Erro',
        description: 'O valor deve ser maior ou igual a 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateConfig({
        targetHours: targetValue,
        weekStartDay: weekStartValue,
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
            Meta Semanal Padrão
          </CardTitle>
          <CardDescription>
            Configure o padrão de horas para novas semanas. Você pode personalizar semanas individuais clicando na coluna "Total" do calendário.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="targetHours">
              Horas por Semana
            </Label>
            <Input
              id="targetHours"
              type="number"
              min="0"
              max="168"
              step="0.5"
              value={localTargetHours}
              onChange={(e) => setLocalTargetHours(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Semanas que atingirem esta meta ficam verdes no calendário
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário
          </CardTitle>
          <CardDescription>
            Configure como o calendário é exibido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="weekStartDay">
              Início da Semana
            </Label>
            <Select
              value={localWeekStartDay}
              onValueChange={setLocalWeekStartDay}
            >
              <SelectTrigger id="weekStartDay" className="w-full">
                <SelectValue placeholder="Selecione o dia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Domingo</SelectItem>
                <SelectItem value="1">Segunda-feira</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define qual dia aparece primeiro no calendário
            </p>
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
