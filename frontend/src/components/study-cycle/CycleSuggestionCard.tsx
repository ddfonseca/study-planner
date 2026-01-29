/**
 * Cycle Suggestion Card - Shows current study suggestion from the cycle
 */
import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { RefreshCw, ChevronRight, ChevronDown, Settings, BookOpen, Check, Plus, ChevronsUpDown, Trophy, Lock, Layers, SkipForward } from 'lucide-react';
import { useStudyCycleStore, formatDuration, calculateCycleProgress } from '@/store/studyCycleStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { CycleEditorModal } from './CycleEditorModal';
import { useCanUseFeature, FEATURES } from '@/hooks/useSubscriptionLimits';
import { LimitIndicator, UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { PricingModal } from '@/components/subscription';
import { EmptyState } from '@/components/ui/empty-state';
import { Confetti } from '@/components/ui/confetti';
import { useConfetti } from '@/hooks/useConfetti';
import { useHaptic } from '@/hooks/useHaptic';
import { useAchievementsStore } from '@/store/achievementsStore';

export function CycleSuggestionCard() {
  const { currentWorkspaceId } = useWorkspaceStore();
  const {
    cycle,
    cycles,
    suggestion,
    isLoading,
    refresh,
    advanceToNext,
    activateCycle,
    resetCycle,
  } = useStudyCycleStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('edit');
  const [showAllItems, setShowAllItems] = useState(false);
  const [cycleSelectorOpen, setCycleSelectorOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const { fire: fireConfetti, confettiProps } = useConfetti({ duration: 3000, particleCount: 150 });
  const { triggerPattern } = useHaptic();
  const previousCycleCompleteRef = useRef<boolean | null>(null);

  // Use persistent achievements store to prevent showing achievements on page refresh
  const { hasAchievementBeenShown, markAchievementShown, _hasHydrated } = useAchievementsStore();

  // Check cycle limit
  const cycleLimit = useCanUseFeature(FEATURES.MAX_CYCLES, cycles.length);
  const canCreateCycle = cycleLimit.canUse;

  // Fetch cycle data when workspace changes
  useEffect(() => {
    if (currentWorkspaceId) {
      refresh(currentWorkspaceId);
    }
  }, [currentWorkspaceId, refresh]);

  // Trigger confetti when cycle becomes complete
  useEffect(() => {
    if (!_hasHydrated) return;

    const isCycleComplete = suggestion?.suggestion?.isCycleComplete ?? false;

    // Create unique identifier using cycle id and updatedAt timestamp
    // This ensures a new celebration triggers after the cycle is reset
    const cycleIdentifier = cycle ? `${cycle.id}:${cycle.updatedAt}` : null;

    // Check if this achievement has already been shown (persisted)
    const alreadyShownPersisted = cycleIdentifier
      ? hasAchievementBeenShown('cycle_complete', cycleIdentifier)
      : false;

    // Only fire confetti when transitioning from incomplete to complete
    // and achievement hasn't been shown yet
    if (isCycleComplete && previousCycleCompleteRef.current === false && !alreadyShownPersisted && cycleIdentifier) {
      fireConfetti();
      triggerPattern('success');
      markAchievementShown('cycle_complete', cycleIdentifier);
    }

    previousCycleCompleteRef.current = isCycleComplete;
  }, [suggestion?.suggestion?.isCycleComplete, cycle, fireConfetti, triggerPattern, _hasHydrated, hasAchievementBeenShown, markAchievementShown]);

  // No cycle configured
  if (!suggestion?.hasCycle) {
    return (
      <>
        <Card className="border-dashed">
          <CardContent className="p-0">
            <EmptyState
              icon={Layers}
              title="Nenhum ciclo configurado"
              description="Organize seus estudos com um ciclo de rotação entre matérias"
              size="sm"
              action={
                canCreateCycle ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditorOpen(true)}
                  >
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Configurar Ciclo
                  </Button>
                ) : (
                  <UpgradePrompt
                    feature={FEATURES.MAX_CYCLES}
                    currentUsage={cycles.length}
                    variant="inline"
                    onUpgradeClick={() => setPricingModalOpen(true)}
                  />
                )
              }
            />
          </CardContent>
        </Card>
        <CycleEditorModal open={editorOpen} onOpenChange={setEditorOpen} mode="create" />
        <PricingModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
      </>
    );
  }

  const { suggestion: data } = suggestion;
  if (!data) return null;

  const progress = calculateCycleProgress(data.currentAccumulatedMinutes, data.currentTargetMinutes);

  const handleAdvance = async (forceComplete?: boolean) => {
    if (!currentWorkspaceId) return;
    try {
      await advanceToNext(currentWorkspaceId, forceComplete);
    } catch (error) {
      console.error('Failed to advance cycle:', error);
    }
  };

  const handleReset = async () => {
    if (!currentWorkspaceId) return;
    try {
      await resetCycle(currentWorkspaceId);
    } catch (error) {
      console.error('Failed to reset cycle:', error);
    }
  };

  const handleCycleSelect = async (cycleId: string) => {
    if (!currentWorkspaceId) return;
    setCycleSelectorOpen(false);
    if (cycleId === 'new') {
      setEditorMode('create');
      setEditorOpen(true);
      return;
    }
    if (cycleId === cycle?.id) return;
    try {
      await activateCycle(currentWorkspaceId, cycleId);
    } catch (error) {
      console.error('Failed to activate cycle:', error);
    }
  };

  return (
    <>
      <Card data-tour="cycle-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <BookOpen className="h-4 w-4 shrink-0" />
              {cycles.length >= 1 ? (
                <Popover open={cycleSelectorOpen} onOpenChange={setCycleSelectorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs font-medium justify-between min-w-0"
                      disabled={isLoading}
                    >
                      <span className="truncate">{cycle?.name || 'Selecionar'}</span>
                      <ChevronsUpDown className="h-3 w-3 ml-1 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandGroup>
                          {cycles.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.id}
                              onSelect={() => handleCycleSelect(c.id)}
                            >
                              <Check
                                className={`mr-2 h-3 w-3 ${c.id === cycle?.id ? 'opacity-100' : 'opacity-0'}`}
                              />
                              <span className="truncate">{c.name}</span>
                            </CommandItem>
                          ))}
                          <CommandItem
                            value="new"
                            onSelect={() => canCreateCycle && handleCycleSelect('new')}
                            className={canCreateCycle ? 'text-primary' : 'text-muted-foreground opacity-60'}
                            disabled={!canCreateCycle}
                          >
                            {canCreateCycle ? (
                              <Plus className="mr-2 h-3 w-3" />
                            ) : (
                              <Lock className="mr-2 h-3 w-3" />
                            )}
                            Novo ciclo
                            <LimitIndicator
                              feature={FEATURES.MAX_CYCLES}
                              currentUsage={cycles.length}
                              className="ml-auto"
                            />
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <CardTitle className="text-sm font-medium truncate">
                  {cycle?.name || 'Estudar Agora'}
                </CardTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => {
                setEditorMode('edit');
                setEditorOpen(true);
              }}
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
          {data.isCycleComplete ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-accent">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">Ciclo Completo!</span>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Reiniciar Ciclo
              </Button>
            </div>
          ) : data.isCurrentComplete ? (
            <div className="space-y-2">
              <p className="text-xs text-accent font-medium">
                Meta atingida!
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => handleAdvance()}
                disabled={isLoading}
                title={`Avançar para ${data.nextSubject}`}
              >
                <ChevronRight className="h-3.5 w-3.5 mr-1 shrink-0" />
                <span className="truncate">Avançar para {data.nextSubject}</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <span>Faltam </span>
                <span className="font-medium text-foreground">
                  {formatDuration(data.remainingMinutes)}
                </span>
                <span> para completar</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => handleAdvance(true)}
                disabled={isLoading}
                title="Considerar matéria como completa e avançar"
              >
                <SkipForward className="h-3 w-3 mr-1.5" />
                Avançar mesmo assim
              </Button>
            </div>
          )}

          {/* Next subject preview */}
          {!data.isCurrentComplete && !data.isCycleComplete && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground truncate" title={`Próximo: ${data.nextSubject}`}>
                Próximo: <span className="font-medium">{data.nextSubject}</span>
                {' '}({formatDuration(data.nextTargetMinutes)})
              </p>
            </div>
          )}

          {/* All items progress (collapsible) */}
          {data.allItemsProgress && data.allItemsProgress.length > 1 && (
            <div className="pt-2 border-t">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                onClick={() => setShowAllItems(!showAllItems)}
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showAllItems ? 'rotate-180' : ''}`}
                />
                {showAllItems ? 'Ocultar matérias' : 'Ver todas as matérias'}
              </button>

              {showAllItems && (
                <div className="mt-2 space-y-2">
                  {/* Statistics summary */}
                  {(() => {
                    const totalTarget = data.allItemsProgress.reduce((sum, item) => sum + item.targetMinutes, 0);
                    const totalAccumulated = data.allItemsProgress.reduce((sum, item) => sum + item.accumulatedMinutes, 0);
                    const completedCount = data.allItemsProgress.filter((item) => item.isComplete).length;
                    const overallPercent = totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0;
                    return (
                      <div className="p-2 rounded-md bg-muted/30 border border-border/50 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progresso geral</span>
                          <span className="font-medium">{Math.min(100, overallPercent)}%</span>
                        </div>
                        <Progress value={Math.min(100, overallPercent)} className="h-1.5" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{completedCount}/{data.allItemsProgress.length} matérias</span>
                          <span>{formatDuration(totalAccumulated)}/{formatDuration(totalTarget)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Individual items */}
                  {data.allItemsProgress.map((item) => {
                    const itemProgress = calculateCycleProgress(item.accumulatedMinutes, item.targetMinutes);
                    const isCurrent = item.position === data.currentPosition;
                    return (
                      <div
                        key={item.position}
                        className={`p-2 rounded-md ${isCurrent ? 'bg-primary/10' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs truncate ${isCurrent ? 'font-medium' : ''}`} title={item.subject}>
                            {item.isComplete && <Check className="h-3 w-3 inline mr-1 text-accent" />}
                            {item.subject}
                          </span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatDuration(item.accumulatedMinutes)}/{formatDuration(item.targetMinutes)}
                          </span>
                        </div>
                        <Progress value={itemProgress} className="h-1.5" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <CycleEditorModal open={editorOpen} onOpenChange={setEditorOpen} mode={editorMode} />
      <PricingModal open={pricingModalOpen} onOpenChange={setPricingModalOpen} />
      <Confetti {...confettiProps} />
    </>
  );
}

export default CycleSuggestionCard;
