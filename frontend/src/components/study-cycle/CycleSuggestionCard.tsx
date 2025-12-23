/**
 * Cycle Suggestion Card - Shows current study suggestion from the cycle
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, ChevronRight, Settings, BookOpen } from 'lucide-react';
import { useStudyCycleStore, formatDuration, calculateCycleProgress } from '@/store/studyCycleStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { CycleEditorModal } from './CycleEditorModal';

export function CycleSuggestionCard() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const { suggestion, isLoading, refresh, advanceToNext } = useStudyCycleStore();
  const [editorOpen, setEditorOpen] = useState(false);

  // Fetch cycle data when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      refresh(currentWorkspaceId);
    }
  }, [currentWorkspaceId, refresh]);

  // No cycle configured
  if (!suggestion?.hasCycle) {
    return (
      <>
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Ciclo de Estudos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Configure um ciclo para receber sugestões do que estudar
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setEditorOpen(true)}
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Configurar Ciclo
            </Button>
          </CardContent>
        </Card>
        <CycleEditorModal open={editorOpen} onOpenChange={setEditorOpen} />
      </>
    );
  }

  const { suggestion: data } = suggestion;
  if (!data) return null;

  const progress = calculateCycleProgress(data.currentAccumulatedMinutes, data.currentTargetMinutes);

  const handleAdvance = async () => {
    if (!currentWorkspaceId) return;
    try {
      await advanceToNext(currentWorkspaceId);
    } catch (error) {
      console.error('Failed to advance cycle:', error);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Estudar Agora
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setEditorOpen(true)}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Current subject */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate" title={data.currentSubject}>
                {data.currentSubject}
              </span>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                {data.currentPosition + 1}/{data.totalItems}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{formatDuration(data.currentAccumulatedMinutes)}</span>
              <span>{formatDuration(data.currentTargetMinutes)}</span>
            </div>
          </div>

          {/* Status and actions */}
          {data.isCurrentComplete ? (
            <div className="space-y-2">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Meta atingida!
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={handleAdvance}
                disabled={isLoading}
                title={`Avançar para ${data.nextSubject}`}
              >
                <ChevronRight className="h-3.5 w-3.5 mr-1 shrink-0" />
                <span className="truncate">Avançar para {data.nextSubject}</span>
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <span>Faltam </span>
              <span className="font-medium text-foreground">
                {formatDuration(data.remainingMinutes)}
              </span>
              <span> para completar</span>
            </div>
          )}

          {/* Next subject preview */}
          {!data.isCurrentComplete && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground truncate" title={`Próximo: ${data.nextSubject}`}>
                Próximo: <span className="font-medium">{data.nextSubject}</span>
                {' '}({formatDuration(data.nextTargetMinutes)})
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <CycleEditorModal open={editorOpen} onOpenChange={setEditorOpen} />
    </>
  );
}

export default CycleSuggestionCard;
