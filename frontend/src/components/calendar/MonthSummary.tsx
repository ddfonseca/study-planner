/**
 * Month Summary - Shows day counts and daily goal legend
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessions } from '@/hooks/useSessions';

interface MonthSummaryProps {
  year: number;
  month: number;
}

export function MonthSummary({ year, month }: MonthSummaryProps) {
  const { getMonthStats } = useSessions();
  const { greenDays, blueDays, dailyMin, dailyDes } = getMonthStats(year, month);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Dias com Meta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Green (minimum) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/50" />
            <span className="text-sm text-muted-foreground">
              ≥ {dailyMin}h/dia (mínimo)
            </span>
          </div>
          <span className="text-lg font-semibold text-green-600 dark:text-green-400">
            {greenDays}
          </span>
        </div>

        {/* Blue (desired) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/50" />
            <span className="text-sm text-muted-foreground">
              ≥ {dailyDes}h/dia (desejado)
            </span>
          </div>
          <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {blueDays}
          </span>
        </div>

        {/* Info */}
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Clique no Total para editar a meta semanal
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default MonthSummary;
