/**
 * ChartSkeleton - Loading skeleton for chart components with bar/line variants
 */
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ChartVariant = 'bar' | 'line';

interface ChartSkeletonProps {
  /** Chart variant: 'bar' or 'line' */
  variant?: ChartVariant;
  /** Number of data points to display (default: 7) */
  barCount?: number;
}

const DEFAULT_BAR_COUNT = 7;

export function ChartSkeleton({ variant = 'bar', barCount = DEFAULT_BAR_COUNT }: ChartSkeletonProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex flex-col">
          {/* Y-axis area */}
          <div className="flex-1 flex">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between pr-2 py-4">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-8" />
            </div>
            {/* Chart area */}
            <div className="flex-1 flex items-end gap-2 pb-8 border-l border-b border-muted">
              {variant === 'bar' ? (
                <BarVariant barCount={barCount} />
              ) : (
                <LineVariant />
              )}
            </div>
          </div>
          {/* X-axis labels */}
          <div className="flex justify-between pl-10 pt-2">
            {Array.from({ length: Math.min(barCount, 7) }).map((_, index) => (
              <Skeleton key={index} className="h-3 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarVariant({ barCount }: { barCount: number }) {
  // Generate varied heights for visual interest
  const heights = [60, 80, 45, 90, 70, 55, 85];

  return (
    <>
      {Array.from({ length: barCount }).map((_, index) => (
        <Skeleton
          key={index}
          className="flex-1 rounded-t-sm"
          style={{ height: `${heights[index % heights.length]}%` }}
        />
      ))}
    </>
  );
}

function LineVariant() {
  return (
    <div className="flex-1 flex items-center justify-center relative h-full">
      {/* Simulated line chart with dots and connecting skeleton areas */}
      <div className="absolute inset-4 flex items-end">
        <Skeleton className="w-full h-[60%] rounded-md opacity-50" />
      </div>
      {/* Data points */}
      <div className="absolute inset-4 flex items-end justify-between">
        {[65, 45, 70, 55, 80, 60, 75].map((height, index) => (
          <Skeleton
            key={index}
            className="w-3 h-3 rounded-full"
            style={{ marginBottom: `${height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export default ChartSkeleton;
