/**
 * Annual Heatmap - GitHub-style year activity visualization
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatDateKey } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/time';
import { useConfigStore } from '@/store/configStore';
import type { SessionsMap } from '@/types/session';

interface AnnualHeatmapProps {
  sessions: SessionsMap;
}

interface DayData {
  date: Date;
  dateKey: string;
  minutes: number;
  isFuture: boolean;
}

interface MonthInfo {
  month: number;
  year: number;
  weekIndex: number;
  totalMinutes: number;
}

const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Rotate day labels based on weekStartDay
function getDayLabels(weekStartDay: number): string[] {
  const fullDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const rotated = [...fullDays.slice(weekStartDay), ...fullDays.slice(0, weekStartDay)];
  // Show only every other label for space
  return rotated.map((d, i) => i % 2 === 0 ? d : '');
}

// Get intensity level based on minutes studied
function getIntensityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes === 0) return 0;
  if (minutes < 60) return 1;
  if (minutes < 120) return 2;
  if (minutes < 180) return 3;
  return 4;
}

// Gradient style: warm tones (stone → amber → terracotta)
const gradientColors: Record<number, string> = {
  0: 'bg-muted',
  1: 'bg-stone-200 dark:bg-stone-800',
  2: 'bg-amber-200 dark:bg-amber-900/50',
  3: 'bg-amber-300 dark:bg-amber-800/60',
  4: 'bg-[#c17a5c] dark:bg-[#c17a5c]',
};

export function AnnualHeatmap({ sessions }: AnnualHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const weekStartDay = useConfigStore((state) => state.weekStartDay);
  const heatmapStyle = useConfigStore((state) => state.heatmapStyle);

  const dayLabels = useMemo(() => getDayLabels(weekStartDay), [weekStartDay]);

  const { weeks, monthsData } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from first day of the year, adjusted to the previous weekStartDay
    const jan1 = new Date(currentYear, 0, 1);
    const startDate = new Date(jan1);
    // Calculate days to go back to reach weekStartDay
    let daysBack = jan1.getDay() - weekStartDay;
    if (daysBack < 0) daysBack += 7;
    startDate.setDate(jan1.getDate() - daysBack);

    // End at Dec 31 of the current year
    const dec31 = new Date(currentYear, 11, 31);

    const weeksData: DayData[][] = [];
    const monthsInfo: MonthInfo[] = [];
    const monthTotals: Record<string, number> = {};

    let lastMonth = -1;
    const currentDate = new Date(startDate);

    // Generate weeks until we pass Dec 31
    while (currentDate <= dec31) {
      const weekData: DayData[] = [];
      const weekIndex = weeksData.length;

      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDate);
        const isOutOfYear = date.getFullYear() !== currentYear;
        const isFuture = date > today;
        const dateKey = formatDateKey(date);
        const minutes = (!isFuture && !isOutOfYear) ? (sessions[dateKey]?.totalMinutos || 0) : 0;

        const month = date.getMonth();

        // Track month changes (only for current year)
        if (month !== lastMonth && !isOutOfYear) {
          lastMonth = month;
          monthsInfo.push({
            month,
            year: currentYear,
            weekIndex,
            totalMinutes: 0,
          });
        }

        // Accumulate monthly totals (only for current year, not future)
        if (!isFuture && !isOutOfYear) {
          const monthKey = `${currentYear}-${month}`;
          monthTotals[monthKey] = (monthTotals[monthKey] || 0) + minutes;
        }

        weekData.push({ date, dateKey, minutes, isFuture: isFuture || isOutOfYear });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeksData.push(weekData);
    }

    // Update month totals
    monthsInfo.forEach(m => {
      const key = `${m.year}-${m.month}`;
      m.totalMinutes = monthTotals[key] || 0;
    });

    return {
      weeks: weeksData,
      monthsData: monthsInfo,
    };
  }, [sessions, currentYear, weekStartDay]);

  // Format date for tooltip
  const formatTooltip = (day: DayData): string => {
    if (day.isFuture) return '';
    const dateStr = day.date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return day.minutes > 0
      ? `${dateStr}\n${formatTime(day.minutes)} de estudo`
      : `${dateStr}\nSem estudo`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Atividade do Ano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-3 sm:px-6">
        {/* Heatmap container - horizontal scroll on mobile */}
        <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
          <div className="min-w-[320px] sm:min-w-[450px] lg:min-w-[600px] flex flex-col">
          {/* Month labels row */}
          <div className="flex pl-7">
            {monthsData.map((m, i) => {
              const nextMonth = monthsData[i + 1];
              const totalWeeks = weeks.length;
              const weeksSpan = nextMonth
                ? nextMonth.weekIndex - m.weekIndex
                : totalWeeks - m.weekIndex;
              // Calculate flex basis as percentage of total weeks
              const flexBasis = (weeksSpan / totalWeeks) * 100;

              return (
                <div
                  key={`label-${m.year}-${m.month}`}
                  style={{ flexBasis: `${flexBasis}%` }}
                  className="text-[10px] text-muted-foreground shrink-0"
                >
                  {MONTHS_SHORT[m.month]}
                </div>
              );
            })}
          </div>

          {/* Grid with day labels */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col justify-between py-[2px] text-[10px] text-muted-foreground shrink-0 w-6">
              {dayLabels.map((day, i) => (
                <div key={i} className="h-0 flex items-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks grid - responsive */}
            <div className="flex-1 flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex-1 flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => {
                    const intensity = getIntensityLevel(day.minutes);
                    const cellClass = day.isFuture
                      ? 'bg-transparent'
                      : heatmapStyle === 'dots'
                        ? 'bg-card border border-border'
                        : gradientColors[intensity];

                    return (
                      <div
                        key={dayIndex}
                        className={`aspect-square rounded-sm relative ${cellClass} ${!day.isFuture ? 'hover:ring-1 hover:ring-foreground cursor-pointer' : ''}`}
                        title={formatTooltip(day)}
                      >
                        {/* Dots indicator */}
                        {heatmapStyle === 'dots' && !day.isFuture && intensity > 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[5px] h-[5px] rounded-full bg-primary" style={{ opacity: 0.3 + intensity * 0.175 }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Monthly totals row */}
          <div className="flex pl-7 mt-1">
            {monthsData.map((m, i) => {
              const nextMonth = monthsData[i + 1];
              const totalWeeks = weeks.length;
              const weeksSpan = nextMonth
                ? nextMonth.weekIndex - m.weekIndex
                : totalWeeks - m.weekIndex;
              const flexBasis = (weeksSpan / totalWeeks) * 100;
              const hours = Math.round(m.totalMinutes / 60);

              return (
                <div
                  key={`total-${m.year}-${m.month}`}
                  style={{ flexBasis: `${flexBasis}%` }}
                  className="text-[10px] text-muted-foreground shrink-0"
                >
                  {hours > 0 ? `${hours}h` : '-'}
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="text-foreground font-medium">{currentYear}</span>
          <div className="flex items-center gap-1">
            <span>Menos</span>
            <div className="flex gap-[2px]">
              {heatmapStyle === 'gradient' ? (
                // Gradient legend
                <>
                  <div className="w-[10px] h-[10px] rounded-sm bg-muted" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-stone-200 dark:bg-stone-800" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-amber-200 dark:bg-amber-900/50" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-amber-300 dark:bg-amber-800/60" />
                  <div className="w-[10px] h-[10px] rounded-sm bg-[#c17a5c]" />
                </>
              ) : (
                // Dots legend
                [0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-[10px] h-[10px] rounded-sm bg-card border border-border flex items-center justify-center"
                  >
                    {i > 0 && (
                      <div className="w-[5px] h-[5px] rounded-full bg-primary" style={{ opacity: 0.3 + i * 0.175 }} />
                    )}
                  </div>
                ))
              )}
            </div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnnualHeatmap;
