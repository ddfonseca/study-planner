/**
 * Config Panel - Quick settings for study goals
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfigStore } from '@/store/configStore';
import { useToast } from '@/hooks/use-toast';
import { Settings, Loader2 } from 'lucide-react';

export function ConfigPanel() {
  const { minHours, desHours, updateConfig, isLoading } = useConfigStore();
  const { toast } = useToast();

  const [localMinHours, setLocalMinHours] = useState(minHours);
  const [localDesHours, setLocalDesHours] = useState(desHours);

  // Sync local state with store
  useEffect(() => {
    setLocalMinHours(minHours);
    setLocalDesHours(desHours);
  }, [minHours, desHours]);

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
        description: 'Configurações salvas!',
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Metas Diárias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="minHours" className="text-xs flex items-center gap-2">
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
            className="h-8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desHours" className="text-xs flex items-center gap-2">
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
            className="h-8"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          size="sm"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Salvar'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ConfigPanel;
