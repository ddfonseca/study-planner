/**
 * Mobile Day View - Single day view for mobile devices
 */
import { isToday, addDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { formatTime } from '@/lib/utils/time';
import type { DayData } from '@/types/session';
import { cn } from '@/lib/utils';
import { SwipeableSessionItem } from './SwipeableSessionItem';

interface MobileDayViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  dayData: DayData;
  onAddSession: () => void;
  onEditSession: () => void;
  onDeleteSession: (id: string) => void;
  canModify?: boolean;
}

export function MobileDayView({
  date,
  onDateChange,
  dayData,
  onAddSession,
  onEditSession,
  onDeleteSession,
  canModify = true,
}: MobileDayViewProps) {
  const isTodayDate = isToday(date);

  const goToPreviousDay = () => {
    onDateChange(addDays(date, -1));
  };

  const goToNextDay = () => {
    onDateChange(addDays(date, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  // Format: "Segunda, 23 Dez 2025"
  const formattedDate = format(date, "EEEE, d MMM yyyy", { locale: ptBR });
  // Capitalize first letter
  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="space-y-4" data-tour="mobile-day-view">
      {/* Navigation Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousDay}
              aria-label="Dia anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <div className="text-center flex-1">
              <p className={cn(
                "text-lg font-semibold",
                isTodayDate && "text-primary"
              )}>
                {displayDate}
              </p>
              {!isTodayDate && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={goToToday}
                  className="text-xs h-auto p-0"
                >
                  Ir para hoje
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              aria-label="Próximo dia"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Day Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-4xl font-bold text-primary">
              {dayData.totalMinutos > 0 ? formatTime(dayData.totalMinutos) : '0min'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {dayData.materias.length === 0
                ? 'Nenhuma sessão registrada'
                : dayData.materias.length === 1
                  ? '1 sessão'
                  : `${dayData.materias.length} sessões`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {dayData.materias.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Sessões do dia
            </h3>
            <div className="space-y-2">
              {dayData.materias.map((materia) => (
                <SwipeableSessionItem
                  key={materia.id}
                  session={materia}
                  onEdit={onEditSession}
                  onDelete={onDeleteSession}
                  canModify={canModify}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Session Button */}
      {canModify ? (
        <Button
          onClick={onAddSession}
          size="lg"
          className="w-full"
        >
          <Plus className="h-5 w-5 mr-2" />
          Adicionar Sessão
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
              Selecione um workspace para adicionar sessões.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default MobileDayView;
