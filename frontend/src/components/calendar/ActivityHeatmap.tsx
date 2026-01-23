/**
 * Activity Heatmap - GitHub-style activity visualization
 */
import { useSessionStore } from '@/store/sessionStore';
import { useConfigStore } from '@/store/configStore';
import { getCalendarDays, getDayNames } from '@/lib/utils/date';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
  year: number;
  month: number;
}

type Intensity = 0 | 1 | 2 | 3 | 4;

// Gradient style: warm tones (stone → amber → terracotta)
const gradientColors: Record<Intensity, string> = {
  0: 'bg-muted',
  1: 'bg-stone-200 dark:bg-stone-800',
  2: 'bg-amber-200 dark:bg-amber-900/50',
  3: 'bg-amber-300 dark:bg-amber-800/60',
  4: 'bg-[#c17a5c] dark:bg-[#c17a5c]',
};

export function ActivityHeatmap({ year, month }: ActivityHeatmapProps) {
  const { sessions } = useSessionStore();
  const heatmapStyle = useConfigStore((state) => state.heatmapStyle);
  const days = getCalendarDays(year, month);
  const dayNames = getDayNames();

  // Group days into weeks (7 days each)
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getIntensity = (minutes: number): Intensity => {
    if (minutes === 0) return 0;
    if (minutes < 60) return 1;   // < 1h
    if (minutes < 120) return 2;  // 1-2h
    if (minutes < 180) return 3;  // 2-3h
    return 4;                     // 3h+
  };

  const getMinutesForDay = (date: Date): number => {
    const dateKey = date.toISOString().split('T')[0];
    return sessions[dateKey]?.totalMinutos || 0;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === month;
  };

  // Get cell color based on style
  const getCellColor = (intensity: Intensity) => {
    if (heatmapStyle === 'dots') return 'bg-card border border-border';
    return gradientColors[intensity];
  };

  // Render dots for intensity
  const renderDots = (intensity: Intensity) => {
    if (intensity === 0) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-2 gap-px">
          {[...Array(intensity)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-primary" />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">
          Atividade do Mês
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Menos</span>
          {heatmapStyle === 'gradient' ? (
            // Gradient legend
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn('w-3 h-3 rounded-sm', gradientColors[i as Intensity])}
              />
            ))
          ) : (
            // Dots legend
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-sm bg-card border border-border flex items-center justify-center"
              >
                {i > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" style={{ opacity: 0.25 + i * 0.2 }} />
                )}
              </div>
            ))
          )}
          <span>Mais</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {dayNames.map((day) => (
                <th
                  key={day}
                  className="text-[10px] font-normal text-muted-foreground text-center pb-1 w-[14.28%]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((date, dayIndex) => {
                  const minutes = getMinutesForDay(date);
                  const intensity = getIntensity(minutes);
                  const inMonth = isCurrentMonth(date);

                  return (
                    <td key={dayIndex} className="p-0.5">
                      <div
                        className={cn(
                          'aspect-square rounded-sm transition-colors relative',
                          inMonth ? getCellColor(intensity) : 'bg-transparent',
                          inMonth && 'hover:ring-1 hover:ring-primary'
                        )}
                        title={
                          inMonth
                            ? `${date.getDate()}/${month + 1}: ${Math.floor(minutes / 60)}h ${minutes % 60}min`
                            : undefined
                        }
                      >
                        {heatmapStyle === 'dots' && inMonth && renderDots(intensity)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ActivityHeatmap;
