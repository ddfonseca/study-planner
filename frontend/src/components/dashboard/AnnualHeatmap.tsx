/**
 * Annual Heatmap - GitHub-style year activity visualization
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { formatDateKey } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/time';
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

const DAYS_SHORT = ['Dom', '', 'Ter', '', 'Qui', '', 'Sáb'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// Get intensity color based on minutes studied
function getIntensityColor(minutes: number): string {
  if (minutes === 0) return 'bg-muted';
  if (minutes < 60) return 'bg-green-200 dark:bg-green-900';
  if (minutes < 120) return 'bg-green-300 dark:bg-green-800';
  if (minutes < 180) return 'bg-green-400 dark:bg-green-700';
  return 'bg-green-500 dark:bg-green-600';
}

export function AnnualHeatmap({ sessions }: AnnualHeatmapProps) {
  const currentYear = new Date().getFullYear();

  const { weeks, monthsData } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from first day of the year, adjusted to the previous Sunday
    const jan1 = new Date(currentYear, 0, 1);
    const startDate = new Date(jan1);
    startDate.setDate(jan1.getDate() - jan1.getDay()); // Go back to Sunday

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
  }, [sessions, currentYear]);

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
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Atividade do Ano
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Heatmap container */}
        <div className="w-full flex flex-col">
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
              {DAYS_SHORT.map((day, i) => (
                <div key={i} className="h-0 flex items-center">
                  {day}
                </div>
              ))}
            </div>

            {/* Weeks grid - responsive */}
            <div className="flex-1 flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex-1 flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={`aspect-square rounded-sm ${
                        day.isFuture
                          ? 'bg-transparent'
                          : getIntensityColor(day.minutes)
                      } ${!day.isFuture ? 'hover:ring-1 hover:ring-foreground cursor-pointer' : ''}`}
                      title={formatTooltip(day)}
                    />
                  ))}
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

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <span className="text-foreground font-medium">{currentYear}</span>
          <div className="flex items-center gap-1">
            <span>Menos</span>
            <div className="flex gap-[2px]">
              <div className="w-[10px] h-[10px] rounded-sm bg-muted" />
              <div className="w-[10px] h-[10px] rounded-sm bg-green-200 dark:bg-green-900" />
              <div className="w-[10px] h-[10px] rounded-sm bg-green-300 dark:bg-green-800" />
              <div className="w-[10px] h-[10px] rounded-sm bg-green-400 dark:bg-green-700" />
              <div className="w-[10px] h-[10px] rounded-sm bg-green-500 dark:bg-green-600" />
            </div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AnnualHeatmap;
