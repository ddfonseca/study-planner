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
    if (!isCurrentMonth) return 'bg-muted/50';
    switch (status) {
      case 'desired':
        return 'bg-calendar-blue';
      case 'minimum':
        return 'bg-calendar-green';
      default:
        return 'bg-card';
    }
  };

  return (
    <div
      className={cn(
        'h-[100px] p-2 border border-border rounded-md cursor-pointer transition-all hover:shadow-md overflow-hidden',
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
            isTodayDate ? 'text-primary font-bold' : 'text-foreground',
            !isCurrentMonth && 'text-muted-foreground'
          )}
        >
          {date.getDate()}
        </span>
        {dayData.totalMinutos > 0 && (
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
