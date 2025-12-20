/**
 * Calendar Grid - Main calendar view with cells
 */
import { useState, useEffect } from 'react';
import { CalendarCell } from './CalendarCell';
import { WeeklyGoalEditor } from './WeeklyGoalEditor';
import { formatDateKey, getDayNames } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/time';
import { useSessions } from '@/hooks/useSessions';
import { useWeeklyGoals } from '@/hooks/useWeeklyGoals';
import type { DayData } from '@/types/session';

interface CalendarGridProps {
  weeks: Date[][];
  currentMonth: number;
  onCellClick: (date: Date) => void;
  onDeleteSession: (id: string) => void;
}

export function CalendarGrid({
  weeks,
  currentMonth,
  onCellClick,
  onDeleteSession,
}: CalendarGridProps) {
  const { sessions, getCellStatus, getWeekTotals } = useSessions();
  const { getCachedGoalForWeek, prefetchGoals, calculateWeekStart } = useWeeklyGoals();
  const dayNames = getDayNames();

  const [selectedWeekStart, setSelectedWeekStart] = useState<Date | null>(null);
  const [selectedWeekTotal, setSelectedWeekTotal] = useState<number>(0);

  // Prefetch goals for displayed weeks
  useEffect(() => {
    if (weeks.length > 0) {
      const firstWeek = weeks[0];
      const lastWeek = weeks[weeks.length - 1];
      if (firstWeek.length > 0 && lastWeek.length > 0) {
        prefetchGoals(firstWeek[0], lastWeek[lastWeek.length - 1]);
      }
    }
  }, [weeks, prefetchGoals]);

  const handleTotalClick = (week: Date[], weekTotal: number) => {
    // Get the first day of the week to calculate week start
    const weekStart = new Date(calculateWeekStart(week[0]));
    setSelectedWeekStart(weekStart);
    setSelectedWeekTotal(weekTotal);
  };

  const getWeekStatus = (week: Date[], weekTotal: number): 'BLUE' | 'GREEN' | 'NONE' => {
    const weekStartStr = calculateWeekStart(week[0]);
    const goal = getCachedGoalForWeek(new Date(weekStartStr));

    if (!goal) return 'NONE';

    const totalHours = weekTotal / 60;
    if (totalHours >= goal.desHours) return 'BLUE';
    if (totalHours >= goal.minHours) return 'GREEN';
    return 'NONE';
  };

  const getWeekProgress = (week: Date[], weekTotal: number): number => {
    const weekStartStr = calculateWeekStart(week[0]);
    const goal = getCachedGoalForWeek(new Date(weekStartStr));
    if (!goal || goal.desHours === 0) return 0;
    const totalHours = weekTotal / 60;
    return Math.min(100, (totalHours / goal.desHours) * 100);
  };

  const getWeekStatusStyles = (status: 'BLUE' | 'GREEN' | 'NONE'): string => {
    switch (status) {
      case 'BLUE':
        return 'bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300';
      case 'GREEN':
        return 'bg-green-500/20 border-green-500/50 text-green-700 dark:text-green-300';
      default:
        return 'bg-muted/50 border-border text-muted-foreground';
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
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
              const weekStatus = getWeekStatus(week, weekTotal);
              const statusStyles = getWeekStatusStyles(weekStatus);

              return (
                <tr key={weekIndex}>
                  {week.map((date) => {
                    const dateKey = formatDateKey(date);
                    const dayData: DayData = sessions[dateKey] || {
                      totalMinutos: 0,
                      materias: [],
                    };
                    const status = getCellStatus(dateKey);

                    return (
                      <td key={dateKey} className="p-1">
                        <CalendarCell
                          date={date}
                          currentMonth={currentMonth}
                          dayData={dayData}
                          status={status}
                          onClick={() => onCellClick(date)}
                          onDeleteSession={onDeleteSession}
                        />
                      </td>
                    );
                  })}
                  <td className="p-1">
                    <button
                      onClick={() => handleTotalClick(week, weekTotal)}
                      className={`w-full h-[100px] flex flex-col items-center justify-center rounded-md border transition-colors hover:opacity-80 cursor-pointer px-2 ${statusStyles}`}
                    >
                      <span className="text-sm font-medium">
                        {weekTotal > 0 ? formatTime(weekTotal) : '-'}
                      </span>
                      {getCachedGoalForWeek(new Date(calculateWeekStart(week[0]))) && (
                        <>
                          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full transition-all ${
                                weekStatus === 'BLUE'
                                  ? 'bg-blue-500'
                                  : weekStatus === 'GREEN'
                                    ? 'bg-green-500'
                                    : 'bg-gray-400'
                              }`}
                              style={{ width: `${getWeekProgress(week, weekTotal)}%` }}
                            />
                          </div>
                          <span className="text-[10px] opacity-70 mt-1">
                            {getCachedGoalForWeek(new Date(calculateWeekStart(week[0])))?.desHours}h
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
