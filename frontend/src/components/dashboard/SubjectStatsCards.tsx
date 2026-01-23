/**
 * Subject Stats Cards - Display statistics for a specific subject
 */
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Hash, Target, Percent } from 'lucide-react';
import { formatTime } from '@/lib/utils/time';
import type { SubjectStats } from '@/types/session';

interface SubjectStatsCardsProps {
  stats: SubjectStats | null;
}

export function SubjectStatsCards({ stats }: SubjectStatsCardsProps) {
  const cards = [
    {
      title: 'Total de Horas',
      value: stats ? formatTime(stats.totalMinutes) : '-',
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Sessoes',
      value: stats ? stats.totalSessions.toString() : '-',
      icon: Hash,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Media por Sessao',
      value: stats ? formatTime(stats.averageSessionMinutes) : '-',
      icon: Target,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: '% do Total',
      value: stats ? `${stats.percentageOfTotal}%` : '-',
      icon: Percent,
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
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold text-foreground truncate max-w-[150px]">
                  {value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default SubjectStatsCards;
