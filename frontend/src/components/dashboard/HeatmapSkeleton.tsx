/**
 * HeatmapSkeleton - Loading skeleton that matches AnnualHeatmap layout
 */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DAY_LABELS = ['Dom', '', 'Ter', '', 'Qui', '', 'Sáb'];
const DEFAULT_WEEKS = 53;
const MONTHS_COUNT = 12;

interface HeatmapSkeletonProps {
  /** Number of week columns to display (default: 53) */
  weekCount?: number;
}

export function HeatmapSkeleton({ weekCount = DEFAULT_WEEKS }: HeatmapSkeletonProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded" />
          <Skeleton className="h-4 w-28 sm:w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 sm:px-6">
        {/* Heatmap container */}
        <div className="w-full overflow-x-auto pb-2 -mx-1 px-1">
          <div className="min-w-[320px] sm:min-w-[450px] lg:min-w-[600px] flex flex-col">
            {/* Month labels row */}
            <div className="flex pl-7 gap-1">
              {Array.from({ length: MONTHS_COUNT }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-3 flex-1"
                  style={{ maxWidth: `${100 / MONTHS_COUNT}%` }}
                />
              ))}
            </div>

            {/* Grid with day labels */}
            <div className="flex gap-1 mt-1">
              {/* Day labels */}
              <div className="flex flex-col justify-between py-[2px] text-[10px] text-muted-foreground shrink-0 w-6">
                {DAY_LABELS.map((day, i) => (
                  <div key={i} className="h-0 flex items-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Weeks grid */}
              <div className="flex-1 flex gap-[2px]">
                {Array.from({ length: weekCount }).map((_, weekIndex) => (
                  <div key={weekIndex} className="flex-1 flex flex-col gap-[2px]">
                    {Array.from({ length: 7 }).map((_, dayIndex) => (
                      <Skeleton
                        key={dayIndex}
                        className="aspect-square rounded-sm"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly totals row */}
            <div className="flex pl-7 mt-1 gap-1">
              {Array.from({ length: MONTHS_COUNT }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-3 flex-1"
                  style={{ maxWidth: `${100 / MONTHS_COUNT}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
          <Skeleton className="h-3 w-10" />
          <div className="flex items-center gap-1">
            <span>Menos</span>
            <div className="flex gap-[2px]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="w-[10px] h-[10px] rounded-sm" />
              ))}
            </div>
            <span>Mais</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default HeatmapSkeleton;
