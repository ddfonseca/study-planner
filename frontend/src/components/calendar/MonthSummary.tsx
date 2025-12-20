/**
 * Month Summary - Shows stats for current month
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessions } from '@/hooks/useSessions';
import { useConfigStore } from '@/store/configStore';

interface MonthSummaryProps {
  year: number;
  month: number;
}

export function MonthSummary({ year, month }: MonthSummaryProps) {
  const { getMonthStats } = useSessions();
  const { minHours, desHours } = useConfigStore();

  const { greenDays, blueDays } = getMonthStats(year, month);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumo do Mês</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Green days (minimum) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-calendar-green border border-success/30" />
            <span className="text-sm text-muted-foreground">
              ≥ {minHours}h (mínimo)
            </span>
          </div>
          <span className="text-lg font-bold text-success">{greenDays}</span>
        </div>

        {/* Blue days (desired) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-calendar-blue border border-primary/30" />
            <span className="text-sm text-muted-foreground">
              ≥ {desHours}h (desejado)
            </span>
          </div>
          <span className="text-lg font-bold text-primary">{blueDays}</span>
        </div>

        {/* Total */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total de dias ativos</span>
            <span className="text-lg font-bold text-foreground">{greenDays + blueDays}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MonthSummary;
