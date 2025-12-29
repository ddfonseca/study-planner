/**
 * Cycle History Card - Shows recent advances and completions
 */
import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, ChevronRight, Trophy, ChevronDown } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { studyCycleApi } from '@/lib/api';
import type { CycleHistory, CycleHistoryEntry } from '@/types/api';
import { formatDuration } from '@/store/studyCycleStore';

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function HistoryEntry({ entry }: { entry: CycleHistoryEntry }) {
  if (entry.type === 'completion') {
    return (
      <div className="flex items-start gap-2 p-2 rounded-md bg-green-500/10 border border-green-500/20">
        <Trophy className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-green-700 dark:text-green-400">
            Ciclo completo!
          </p>
          <p className="text-xs text-muted-foreground">
            {entry.itemsCount} matérias · {formatDuration(entry.totalSpentMinutes || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatRelativeTime(entry.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
      <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs">
          <span className="text-muted-foreground">De </span>
          <span className="font-medium truncate">{entry.fromSubject}</span>
          <span className="text-muted-foreground"> para </span>
          <span className="font-medium truncate">{entry.toSubject}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDuration(entry.minutesSpent || 0)} estudados · {formatRelativeTime(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}

export function CycleHistoryCard() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const [history, setHistory] = useState<CycleHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!currentWorkspaceId) return;
    setIsLoading(true);
    try {
      const data = await studyCycleApi.getHistory(currentWorkspaceId, 10);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    if (currentWorkspaceId && isExpanded) {
      fetchHistory();
    }
  }, [currentWorkspaceId, isExpanded, fetchHistory]);

  if (!currentWorkspaceId) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <button
          type="button"
          className="flex items-center justify-between w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico do Ciclo
          </CardTitle>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-4">Carregando...</p>
          ) : !history || history.entries.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum histórico ainda. Avance no ciclo para começar a registrar.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Summary */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                <span>{history.totalAdvances} avanços</span>
                <span>{history.totalCompletions} ciclos completos</span>
              </div>

              {/* Entries */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.entries.map((entry) => (
                  <HistoryEntry key={entry.id} entry={entry} />
                ))}
              </div>

              {/* Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={fetchHistory}
                disabled={isLoading}
              >
                Atualizar histórico
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default CycleHistoryCard;
