/**
 * CalendarGridSkeleton - Loading skeleton that matches CalendarGrid layout
 */
import { Skeleton } from '@/components/ui/skeleton';

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DEFAULT_WEEKS = 5;

interface CalendarGridSkeletonProps {
  /** Number of week rows to display (default: 5) */
  weekCount?: number;
}

export function CalendarGridSkeleton({ weekCount = DEFAULT_WEEKS }: CalendarGridSkeletonProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            {DAY_NAMES.map((day) => (
              <th
                key={day}
                className="py-2 px-1 text-sm font-medium text-muted-foreground text-center w-[12.5%]"
              >
                {day}
              </th>
            ))}
            <th className="py-2 px-1 text-sm font-medium text-muted-foreground text-center w-[12.5%]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: weekCount }).map((_, weekIndex) => (
            <tr key={weekIndex}>
              {/* Day cells */}
              {Array.from({ length: 7 }).map((_, dayIndex) => (
                <td key={dayIndex} className="p-1">
                  <Skeleton className="w-full h-[80px] sm:h-[100px] rounded-md" />
                </td>
              ))}
              {/* Total cell */}
              <td className="p-1">
                <Skeleton className="w-full h-[80px] sm:h-[100px] rounded-md" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CalendarGridSkeleton;
