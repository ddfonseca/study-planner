/**
 * Calendar Grid - Main calendar view with cells
 */
import { CalendarCell } from './CalendarCell';
import { formatDateKey, getDayNames } from '@/lib/utils/date';
import { formatTime } from '@/lib/utils/time';
import { useSessions } from '@/hooks/useSessions';
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
  const dayNames = getDayNames();

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {dayNames.map((day) => (
              <th
                key={day}
                className="py-2 px-1 text-sm font-medium text-text-light text-center"
              >
                {day}
              </th>
            ))}
            <th className="py-2 px-1 text-sm font-medium text-text-light text-center w-20">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => {
            const weekTotal = getWeekTotals(week);
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
                  <div className="min-h-[100px] flex items-center justify-center bg-gray-50 rounded-md border border-border">
                    <span className="text-sm font-medium text-text-light">
                      {weekTotal > 0 ? formatTime(weekTotal) : '-'}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CalendarGrid;
