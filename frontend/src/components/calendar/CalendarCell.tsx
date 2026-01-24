/**
 * Calendar Cell - Individual day in the calendar (heatmap style)
 */
import { isToday } from 'date-fns';
import type { DayData, CellIntensity } from '@/types/session';
import { formatTime } from '@/lib/utils/time';
import { cn } from '@/lib/utils';
import { useConfigStore } from '@/store/configStore';

// Gradient style: warm tones (stone → amber → terracotta)
const gradientColors: Record<CellIntensity, string> = {
  0: 'bg-card',
  1: 'bg-stone-100 dark:bg-stone-800',
  2: 'bg-amber-100 dark:bg-amber-900/50',
  3: 'bg-amber-200 dark:bg-amber-800/60',
  4: 'bg-[#c17a5c] dark:bg-[#c17a5c]',
};

interface CalendarCellProps {
  date: Date;
  currentMonth: number;
  dayData: DayData;
  intensity: CellIntensity;
  onClick: () => void;
}

// Dots indicator component
function IntensityDots({ intensity }: { intensity: CellIntensity }) {
  if (intensity === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-0.5">
      {[...Array(intensity)].map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary"
        />
      ))}
    </div>
  );
}

export function CalendarCell({
  date,
  currentMonth,
  dayData,
  intensity,
  onClick,
}: CalendarCellProps) {
  const heatmapStyle = useConfigStore((state) => state.heatmapStyle);
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isTodayDate = isToday(date);

  // High intensity needs better text contrast
  const isHighIntensity = heatmapStyle === 'gradient' && intensity >= 3;
  // Terracotta (level 4) needs white text for contrast
  const needsLightText = heatmapStyle === 'gradient' && intensity === 4;

  // Background color based on intensity and style
  const getBgColor = () => {
    if (!isCurrentMonth) return 'bg-muted/50';
    if (heatmapStyle === 'dots') return 'bg-card';
    return gradientColors[intensity];
  };

  return (
    <div
      className={cn(
        'h-[80px] sm:h-[100px] p-1.5 sm:p-2 border border-border/40 rounded-md cursor-pointer transition-all overflow-hidden relative',
        'touch-action-manipulation select-none',
        'active:scale-[0.98] active:opacity-90',
        getBgColor(),
        isTodayDate && 'ring-2 ring-accent ring-offset-1 ring-offset-background',
        !isCurrentMonth && 'opacity-50'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Dots indicator (top-right) */}
      {heatmapStyle === 'dots' && isCurrentMonth && intensity > 0 && (
        <div className="absolute top-1.5 right-1.5">
          <IntensityDots intensity={intensity} />
        </div>
      )}

      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            needsLightText ? 'text-white font-bold' : isTodayDate ? 'text-primary font-bold' : 'text-foreground',
            !isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {date.getDate()}
        </span>
        {dayData.totalMinutos > 0 && heatmapStyle === 'gradient' && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded font-medium",
            needsLightText
              ? "text-white bg-black/30"
              : isHighIntensity
                ? "text-foreground bg-background/90"
                : "text-muted-foreground bg-background/80"
          )}>
            {formatTime(dayData.totalMinutos)}
          </span>
        )}
      </div>

      {/* Sessions list - compact */}
      {dayData.materias.length > 0 && (
        <div className="space-y-0.5 max-h-[35px] sm:max-h-[55px] overflow-hidden">
          {dayData.materias.slice(0, 2).map((materia) => (
            <div
              key={materia.id}
              className={cn(
                "flex items-center gap-1 text-[11px] rounded px-1.5 py-0.5 min-w-0",
                needsLightText
                  ? "bg-black/20"
                  : isHighIntensity
                    ? "bg-background/90"
                    : "bg-background/60"
              )}
            >
              <span className={cn(
                "truncate flex-1 min-w-0",
                needsLightText ? "text-white" : "text-foreground"
              )}>{materia.materia}</span>
              <span className={cn(
                "whitespace-nowrap text-[10px] shrink-0",
                needsLightText
                  ? "text-white/80"
                  : isHighIntensity
                    ? "text-foreground/70"
                    : "text-muted-foreground"
              )}>
                {formatTime(materia.minutos)}
              </span>
            </div>
          ))}
          {dayData.materias.length > 2 && (
            <span className={cn(
              "text-[10px] pl-1",
              needsLightText ? "text-white/80" : isHighIntensity ? "text-foreground/70" : "text-muted-foreground"
            )}>
              +{dayData.materias.length - 2} mais
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarCell;
