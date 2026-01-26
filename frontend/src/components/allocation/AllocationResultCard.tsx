import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info, Sparkles } from 'lucide-react';
import type { AllocationResponse } from '@/types/api';

interface AllocationResultCardProps {
  allocation: AllocationResponse;
}

export function AllocationResultCard({ allocation }: AllocationResultCardProps) {
  const { results, metadata } = allocation;
  const maxPercentage = Math.max(...results.map(r => r.percentage), 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Check if any subject has 0% (faith mode)
  const faithModeSubjects = results.filter(r => r.percentage < 0.1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição de Horas</CardTitle>
        <CardDescription className="space-y-1">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>📅 Prova: {formatDate(metadata.examDate)}</span>
            <span>📆 {metadata.weeksUntilExam} semanas restantes</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span>⏱️ {metadata.weeklyHours}h/semana disponíveis</span>
            <span className="font-medium text-foreground">
              🎯 Total: {metadata.totalAvailableHours}h líquidas
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma disciplina cadastrada.</p>
        ) : (
          results.map((result, index) => {
            const isFaithMode = result.percentage < 0.1;

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isFaithMode ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                    {result.subject}
                    {isFaithMode && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="inline-flex items-center ml-2 cursor-help hover:opacity-70 transition-opacity"
                            title="Modo Fé: por sua conta e risco"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="w-64 p-3">
                          <p className="font-medium text-sm">🙏 Modo Fé ativado!</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Por sua conta e risco. Teste novamente daqui a 1 semana para ver se o gap mudou.
                          </p>
                        </PopoverContent>
                      </Popover>
                    )}
                  </span>
                  <span className={`text-muted-foreground ${isFaithMode ? 'italic' : ''}`}>
                    {isFaithMode ? (
                      <span className="text-purple-600 dark:text-purple-400">0h (revisão)</span>
                    ) : (
                      <>{result.totalHours}h total ({result.hoursPerWeek}h/sem) · {result.percentage.toFixed(1)}%</>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isFaithMode ? (
                    <div className="h-2 flex-1 bg-gradient-to-r from-purple-200 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-full flex items-center justify-center">
                      <span className="text-[8px] text-purple-600 dark:text-purple-400 font-medium">🙏</span>
                    </div>
                  ) : (
                    <Progress
                      value={(result.percentage / maxPercentage) * 100}
                      className="h-2 flex-1"
                    />
                  )}
                  {result.gap > 0 && !isFaithMode && (
                    <span className="text-xs text-orange-500 font-medium">
                      Gap: {result.gap}
                    </span>
                  )}
                  {result.gap === 0 && !isFaithMode && (
                    <span className="text-xs text-green-500 font-medium">
                      ✓ Meta
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Faith mode summary */}
        {faithModeSubjects.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-purple-700 dark:text-purple-300">
                  {faithModeSubjects.length === 1
                    ? '1 disciplina em Modo Fé'
                    : `${faithModeSubjects.length} disciplinas em Modo Fé`
                  }
                </p>
                <p className="text-purple-600 dark:text-purple-400 text-xs mt-1">
                  Você já atingiu ou ultrapassou a meta nessas disciplinas.
                  Mantenha revisões leves ou reavalie seus níveis daqui a 1 semana.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
