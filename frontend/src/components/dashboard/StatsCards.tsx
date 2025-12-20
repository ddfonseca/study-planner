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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, value, icon: Icon, color, bgColor }) => (
        <Card key={title}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${bgColor}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div>
                <p className="text-sm text-text-light">{title}</p>
                <p className="text-2xl font-bold text-text truncate max-w-[150px]">{value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default StatsCards;
