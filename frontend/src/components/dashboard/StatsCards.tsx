/**
 * Stats Cards - Summary statistics display
 */
import { Card, CardContent } from '@/components/ui/card';
import { Clock, BookOpen, Target, BarChart3 } from 'lucide-react';
import { formatTime } from '@/lib/utils/time';
import type { StudyStats } from '@/types/session';

interface StatsCardsProps {
  stats: StudyStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Tempo Total',
      value: formatTime(stats.totalMinutes),
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Dias Estudados',
      value: stats.totalDays.toString(),
      icon: BookOpen,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Média por Dia',
      value: formatTime(stats.averageMinutesPerDay),
      icon: Target,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Matéria Principal',
      value: stats.mostStudiedSubject || 'N/A',
      icon: BarChart3,
      color: 'text-danger',
      bgColor: 'bg-danger/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {cards.map(({ title, value, icon: Icon, color, bgColor }) => (
        <Card key={title}>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className={`p-2 sm:p-3 rounded-lg ${bgColor} w-fit`}>
                <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
                <p className="text-lg sm:text-2xl font-bold text-foreground truncate">{value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default StatsCards;
