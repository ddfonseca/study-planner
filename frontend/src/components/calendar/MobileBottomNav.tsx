/**
 * Mobile Bottom Navigation - Tab bar for mobile calendar page
 */
import { Calendar, RefreshCw, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MobileTab = 'calendar' | 'cycle' | 'progress' | 'timer';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  timerActive?: boolean;
}

const tabs: { id: MobileTab; label: string; icon: typeof Calendar }[] = [
  { id: 'calendar', label: 'Dia', icon: Calendar },
  { id: 'cycle', label: 'Ciclo', icon: RefreshCw },
  { id: 'progress', label: 'Progresso', icon: TrendingUp },
  { id: 'timer', label: 'Timer', icon: Clock },
];

export function MobileBottomNav({
  activeTab,
  onTabChange,
  timerActive = false,
}: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const showPulse = tab.id === 'timer' && timerActive && !isActive;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-2 px-1 transition-all duration-200 relative',
                'touch-manipulation active:scale-95',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Pulse indicator for active timer */}
              {showPulse && (
                <span className="absolute top-2 right-1/4 w-2 h-2 bg-primary rounded-full animate-pulse" />
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
