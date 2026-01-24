/**
 * Date Range Filter - Filter dashboard by date range
 */
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface DateRangeFilterProps {
  currentDays: number;
  onSelectPreset: (days: number) => void;
}

const presets = [
  { days: 7, label: '7 dias' },
  { days: 14, label: '14 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
];

export function DateRangeFilter({ currentDays, onSelectPreset }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" aria-hidden="true" />
        <span className="text-sm" id="date-range-label">Período:</span>
      </div>
      <div className="flex gap-2" role="group" aria-labelledby="date-range-label">
        {presets.map(({ days, label }) => (
          <Button
            key={days}
            variant={currentDays === days ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectPreset(days)}
            aria-current={currentDays === days ? 'true' : undefined}
            aria-label={`Filtrar últimos ${label}`}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default DateRangeFilter;
