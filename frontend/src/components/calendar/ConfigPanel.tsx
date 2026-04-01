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
  const { targetHours, updateConfig, isLoading } = useConfigStore();
  const { toast } = useToast();

  const [localTargetHours, setLocalTargetHours] = useState(String(targetHours));

  // Sync local state with store
  useEffect(() => {
    setLocalTargetHours(String(targetHours));
  }, [targetHours]);

  const handleSave = async () => {
    const targetValue = parseFloat(localTargetHours) || 0;

    if (targetValue < 0) {
      toast({
        title: 'Error',
        description: 'Value must be greater than or equal to 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateConfig({
        targetHours: targetValue,
      });
      toast({
        title: 'Success',
        description: 'Settings saved!',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" aria-hidden="true" />
          Default Weekly Goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="targetHours" className="text-xs">
            Hours per Week
          </Label>
          <Input
            id="targetHours"
            type="number"
            min="0"
            max="168"
            step="0.5"
            value={localTargetHours}
            onChange={(e) => setLocalTargetHours(e.target.value)}
            className="h-8"
          />
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          size="sm"
          className="w-full"
          aria-busy={isLoading}
          aria-label="Save settings"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            'Save'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ConfigPanel;
