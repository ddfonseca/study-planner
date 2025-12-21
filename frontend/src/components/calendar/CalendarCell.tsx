/**
 * Calendar Cell - Individual day in the calendar (heatmap style)
 */
import { isToday } from 'date-fns';
import type { DayData, CellIntensity } from '@/types/session';
import { formatTime } from '@/lib/utils/time';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfigStore } from '@/store/configStore';

// Gradient style: slate → sky → blue (smooth transition)
const gradientColors: Record<CellIntensity, string> = {
  0: 'bg-card',
  1: 'bg-slate-100 dark:bg-slate-800',
  2: 'bg-sky-100 dark:bg-sky-900',
  3: 'bg-sky-200 dark:bg-sky-800',
  4: 'bg-blue-300 dark:bg-blue-700',
};

interface CalendarCellProps {
  date: Date;
  currentMonth: number;
  dayData: DayData;
  intensity: CellIntensity;
  onClick: () => void;
  onDeleteSession: (id: string) => void;
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
  onDeleteSession,
}: CalendarCellProps) {
  const heatmapStyle = useConfigStore((state) => state.heatmapStyle);
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isTodayDate = isToday(date);

  // High intensity needs better text contrast
  const isHighIntensity = heatmapStyle === 'gradient' && intensity >= 3;

  // Background color based on intensity and style
  const getBgColor = () => {
    if (!isCurrentMonth) return 'bg-muted/50';
    if (heatmapStyle === 'dots') return 'bg-card';
    return gradientColors[intensity];
  };

  return (
    <div
      className={cn(
        'h-[100px] p-2 border border-border rounded-md cursor-pointer transition-all hover:shadow-md overflow-hidden relative',
        getBgColor(),
        isTodayDate && 'ring-2 ring-primary ring-offset-1',
        !isCurrentMonth && 'opacity-50'
      )}
      onClick={onClick}
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
            isTodayDate ? 'text-primary font-bold' : 'text-foreground',
            !isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {date.getDate()}
        </span>
        {dayData.totalMinutos > 0 && heatmapStyle === 'gradient' && (
          <span className="text-[10px] text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
            {formatTime(dayData.totalMinutos)}
          </span>
        )}
      </div>

      {/* Sessions list - compact */}
      {dayData.materias.length > 0 && (
        <div className="space-y-0.5 max-h-[55px] overflow-hidden">
          {dayData.materias.slice(0, 2).map((materia) => (
            <div
              key={materia.id}
              className="flex items-center gap-1 text-[11px] bg-background/60 rounded px-1.5 py-0.5 group min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate flex-1 text-foreground min-w-0">{materia.materia}</span>
              <span className="text-muted-foreground whitespace-nowrap text-[10px] shrink-0">
                {formatTime(materia.minutos)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(materia.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-danger hover:text-danger/80 transition-opacity"
                aria-label="Remover sessão"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {dayData.materias.length > 2 && (
            <span className="text-[10px] text-muted-foreground pl-1">
              +{dayData.materias.length - 2} mais
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarCell;
