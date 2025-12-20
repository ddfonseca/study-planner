/**
 * Calendar Header - Month navigation controls
 */
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface CalendarHeaderProps {
  monthYearDisplay: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function CalendarHeader({
  monthYearDisplay,
  onPreviousMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousMonth}
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onNextMonth}
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold text-text capitalize ml-2">
          {monthYearDisplay}
        </h2>
      </div>

      <Button variant="outline" onClick={onToday} className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4" />
        Hoje
      </Button>
    </div>
  );
}

export default CalendarHeader;
