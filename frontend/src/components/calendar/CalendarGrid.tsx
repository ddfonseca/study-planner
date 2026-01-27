/**
 * Calendar Grid - Main calendar view with cells (heatmap style)
 */
import { useState, useEffect } from 'react';
import { CalendarOff, Plus } from 'lucide-react';
import { CalendarCell } from './CalendarCell';
import { WeeklyGoalEditor } from './WeeklyGoalEditor';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { formatDateKey } from '@/lib/utils/date';
import { formatTime, formatPomodoros, hoursToPomodoros } from '@/lib/utils/time';
import { useConfigStore } from '@/store/configStore';
import { useSessions } from '@/hooks/useSessions';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';
import type { DayData } from '@/types/session';

interface CalendarGridProps {
  weeks: Date[][];
  currentMonth: number;
  dayNames: string[];
  onCellClick: (date: Date) => void;
}

export function CalendarGrid({
  weeks,
  currentMonth,
  dayNames,
  onCellClick,
}: CalendarGridProps) {
  const { sessions, getCellIntensity, getWeekTotals, hasSessionsInMonth } = useSessions();
  const { getCachedGoalForWeek, prefetchGoals, calculateWeekStart } = useWeeklyGoals();
  const { timeDisplayMode } = useConfigStore();

  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [selectedWeekTotal, setSelectedWeekTotal] = useState<number>(0);

  // Prefetch goals for displayed weeks (use date range as stable key)
  const dateRangeKey =
    weeks.length > 0 && weeks[0].length > 0
      ? `${formatDateKey(weeks[0][0])}-${formatDateKey(weeks[weeks.length - 1][weeks[weeks.length - 1].length - 1])}`
      : '';

  useEffect(() => {
    if (dateRangeKey && weeks.length > 0) {
      const firstWeek = weeks[0];
      const lastWeek = weeks[weeks.length - 1];
      prefetchGoals(firstWeek[0], lastWeek[lastWeek.length - 1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeKey]);

  const handleTotalClick = (week: Date[], weekTotal: number) => {
    // Get the first day of the week to calculate week start
    const weekStart = new Date(calculateWeekStart(week[0]));
    setSelectedWeekStart(weekStart);
    setSelectedWeekTotal(weekTotal);
  };

  const isGoalAchieved = (week: Date[], weekTotal: number): boolean => {
    const weekStartStr = calculateWeekStart(week[0]);
    const goal = getCachedGoalForWeek(new Date(weekStartStr));
    if (!goal) return false;
    const totalHours = weekTotal / 60;
    return totalHours >= goal.targetHours;
  };

  const getWeekProgress = (week: Date[], weekTotal: number): number => {
    const weekStartStr = calculateWeekStart(week[0]);
    const goal = getCachedGoalForWeek(new Date(weekStartStr));
    if (!goal || goal.targetHours === 0) return 0;
    const totalHours = weekTotal / 60;
    return Math.min(100, (totalHours / goal.targetHours) * 100);
  };

  return (
    <>
      <div className="overflow-x-auto" data-tour="calendar-grid">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr>
              {dayNames.map((day) => (
                <th
                  key={day}
                  className="py-2 px-1 text-sm font-medium text-muted-foreground text-center w-[12.5%]"
                >
                  {day}
                </th>
              ))}
              <th className="py-2 px-1 text-sm font-medium text-muted-foreground text-center w-[12.5%]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => {
              const weekTotal = getWeekTotals(week);
              const achieved = isGoalAchieved(week, weekTotal);
              const statusStyles = achieved
                ? 'bg-primary/20 border-primary/50 text-primary dark:text-primary'
                : 'bg-muted/50 border-border text-muted-foreground';

              return (
                <tr key={weekIndex}>
                  {week.map((date) => {
                    const dateKey = formatDateKey(date);
                    const dayData: DayData = sessions[dateKey] || {
                      totalMinutos: 0,
                      materias: [],
                    };
                    const intensity = getCellIntensity(dateKey);

                    return (
                      <td key={dateKey} className="p-1">
                        <CalendarCell
                          date={date}
                          currentMonth={currentMonth}
                          dayData={dayData}
                          intensity={intensity}
                          onClick={() => onCellClick(date)}
                        />
                      </td>
                    );
                  })}
                  <td className="p-1">
                    <button
                      onClick={() => handleTotalClick(week, weekTotal)}
                      className={`w-full h-[80px] sm:h-[100px] flex flex-col items-center justify-center rounded-md border transition-colors hover:opacity-80 cursor-pointer px-1 sm:px-2 ${statusStyles}`}
                    >
                      <span className="text-sm font-medium">
                        {weekTotal > 0
                          ? timeDisplayMode === 'pomodoros'
                            ? formatPomodoros(weekTotal)
                            : formatTime(weekTotal)
                          : '-'}
                      </span>
                      {getCachedGoalForWeek(new Date(calculateWeekStart(week[0]))) && (
                        <>
                          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full transition-all ${
                                achieved ? 'bg-primary' : 'bg-gray-400'
                              }`}
                              style={{ width: `${getWeekProgress(week, weekTotal)}%` }}
                            />
                          </div>
                          <span className="text-[10px] opacity-70 mt-1">
                            {timeDisplayMode === 'pomodoros'
                              ? `${hoursToPomodoros(getCachedGoalForWeek(new Date(calculateWeekStart(week[0])))?.targetHours || 0)} 🍅`
                              : `${getCachedGoalForWeek(new Date(calculateWeekStart(week[0])))?.targetHours}h`}
                          </span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!hasSessionsInMonth(weeks) && (
          <EmptyState
            icon={CalendarOff}
            title="Nenhuma sessão neste mês"
            description="Clique em um dia para adicionar sua primeira sessão de estudo"
            variant="subtle"
            size="sm"
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCellClick(new Date())}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar sessão
              </Button>
            }
          />
        )}
      </div>

      {selectedWeekStart && (
        <WeeklyGoalEditor
          isOpen={!!selectedWeekStart}
          onClose={() => setSelectedWeekStart(null)}
          weekStart={selectedWeekStart}
          currentTotal={selectedWeekTotal}
        />
      )}
    </>
  );
}

export default CalendarGrid;
