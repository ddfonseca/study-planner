/**
 * Calendar Cell - Individual day in the calendar
 */
import { isToday } from 'date-fns';
import type { DayData, CellStatus } from '@/types/session';
import { formatTime } from '@/lib/utils/time';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarCellProps {
  date: Date;
  currentMonth: number;
  dayData: DayData;
  status: CellStatus;
  onClick: () => void;
  onDeleteSession: (id: string) => void;
}

export function CalendarCell({
  date,
  currentMonth,
  dayData,
  status,
  onClick,
  onDeleteSession,
}: CalendarCellProps) {
  const isCurrentMonth = date.getMonth() === currentMonth;
  const isTodayDate = isToday(date);

  // Background color based on status
  const getBgColor = () => {
    if (!isCurrentMonth) return 'bg-gray-50';
    switch (status) {
      case 'desired':
        return 'bg-calendar-blue';
      case 'minimum':
        return 'bg-calendar-green';
      default:
        return 'bg-white';
    }
  };

  return (
    <div
      className={cn(
        'min-h-[100px] p-2 border border-border rounded-md cursor-pointer transition-all hover:shadow-md',
        getBgColor(),
        isTodayDate && 'ring-2 ring-primary ring-offset-1',
        !isCurrentMonth && 'opacity-50'
      )}
      onClick={onClick}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            'text-sm font-medium',
            isTodayDate ? 'text-primary font-bold' : 'text-text',
            !isCurrentMonth && 'text-text-lighter'
          )}
        >
          {date.getDate()}
        </span>
        {dayData.totalMinutos > 0 && (
          <span className="text-xs text-text-light bg-white/80 px-1.5 py-0.5 rounded">
            {formatTime(dayData.totalMinutos)}
          </span>
        )}
      </div>

      {/* Sessions list */}
      <div className="space-y-1 max-h-[60px] overflow-y-auto">
        {dayData.materias.slice(0, 3).map((materia) => (
          <div
            key={materia.id}
            className="flex items-center justify-between gap-1 text-xs bg-white/60 rounded px-1.5 py-0.5 group"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate flex-1 text-text-light">{materia.materia}</span>
            <span className="text-text-lighter whitespace-nowrap">
              {formatTime(materia.minutos)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(materia.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-danger hover:text-danger/80 transition-opacity p-0.5"
              aria-label="Remover sessão"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        {dayData.materias.length > 3 && (
          <span className="text-xs text-text-lighter">
            +{dayData.materias.length - 3} mais
          </span>
        )}
      </div>
    </div>
  );
}

export default CalendarCell;
