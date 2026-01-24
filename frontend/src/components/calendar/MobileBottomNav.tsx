/**
 * Mobile Bottom Navigation - Tab bar for mobile calendar page
 */
import { Calendar, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFeatureBadgesStore, type FeatureKey } from '@/store/featureBadgesStore';
import { useHaptic } from '@/hooks/useHaptic';

export type MobileTab = 'calendar' | 'cycle' | 'progress' | 'timer';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  timerActive?: boolean;
}

const tabs: { id: MobileTab; label: string; icon: typeof Calendar; badgeKey: FeatureKey | null }[] = [
  { id: 'calendar', label: 'Dia', icon: Calendar, badgeKey: null },
  { id: 'cycle', label: 'Ciclo', icon: RefreshCw, badgeKey: 'cycles' },
  { id: 'progress', label: 'Progresso', icon: TrendingUp, badgeKey: null },
  { id: 'timer', label: 'Timer', icon: Clock, badgeKey: 'timer' },
];

export function MobileBottomNav({
  activeTab,
  onTabChange,
  timerActive = false,
}: MobileBottomNavProps) {
  const { isFeatureNew, markFeatureSeen } = useFeatureBadgesStore();
  const { trigger: triggerHaptic } = useHaptic();

  const handleTabChange = (tab: MobileTab) => {
    // Haptic feedback for tab change
    if (tab !== activeTab) {
      triggerHaptic('light');
    }
    // Mark feature as seen when user clicks on the tab
    const tabConfig = tabs.find((t) => t.id === tab);
    if (tabConfig?.badgeKey && isFeatureNew(tabConfig.badgeKey)) {
      markFeatureSeen(tabConfig.badgeKey);
    }
    onTabChange(tab);
  };

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== null) {
      const nextTab = tabs[nextIndex];
      handleTabChange(nextTab.id);
      // Focus the next button
      const buttons = (e.currentTarget.parentElement as HTMLElement)?.querySelectorAll('button');
      (buttons?.[nextIndex] as HTMLElement)?.focus();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-inset-bottom" aria-label="Navegação principal" data-tour="mobile-nav">
      <div className="flex items-center justify-around h-16 w-full max-w-lg mx-auto px-2 sm:px-4" role="tablist">
        {tabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showPulse = tab.id === 'timer' && timerActive && !isActive;
          const showNewBadge = tab.badgeKey && isFeatureNew(tab.badgeKey) && !isActive;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-[56px] py-2 px-1 transition-all duration-200 relative',
                'touch-action-manipulation select-none',
                'active:scale-95 active:opacity-80',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              tabIndex={isActive ? 0 : -1}
            >
              {/* Pulse indicator for active timer */}
              {showPulse && (
                <span className="absolute top-2 right-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}

              {/* New feature badge */}
              {showNewBadge && (
                <span className="absolute top-1 right-1/4 px-1 py-0 text-[8px] font-semibold bg-primary text-primary-foreground rounded">
                  Novo
                </span>
              )}

              {/* Icon with background pill when active */}
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-7 rounded-full transition-all duration-200',
                  isActive ? 'bg-primary/15' : 'bg-transparent'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 transition-transform duration-200',
                    isActive && 'scale-110'
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] mt-0.5 font-medium transition-all duration-200',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}
              >
                {tab.label}
              </span>

              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomNav;
