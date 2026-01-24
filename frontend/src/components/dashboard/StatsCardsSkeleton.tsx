/**
 * StatsCardsSkeleton - Loading skeleton that matches StatsCards layout
 */
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CARD_COUNT = 4;

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {Array.from({ length: CARD_COUNT }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Skeleton className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
                <Skeleton className="h-5 sm:h-7 w-12 sm:w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default StatsCardsSkeleton;
