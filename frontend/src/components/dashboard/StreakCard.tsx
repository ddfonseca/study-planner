/**
 * Streak Card - Displays study streak information
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy, Calendar, Zap } from 'lucide-react';
import type { StreakData } from '@/types/api';

interface StreakCardProps {
  streak: StreakData | null;
  isLoading?: boolean;
}

export function StreakCard({ streak, isLoading }: StreakCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Sequência de Estudos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!streak) {
    return null;
  }

  const { currentStreak, longestStreak, isActiveToday, totalStudyDays } = streak;

  // Determine streak status and message
  const getStreakMessage = () => {
    if (currentStreak === 0 && !isActiveToday) {
      return 'Comece a estudar hoje!';
    }
    if (currentStreak >= 30) {
      return 'Incrivel! Voce e uma maquina!';
    }
    if (currentStreak >= 14) {
      return 'Duas semanas! Excelente!';
    }
    if (currentStreak >= 7) {
      return 'Uma semana seguida!';
    }
    if (currentStreak >= 3) {
      return 'Continue assim!';
    }
    if (isActiveToday) {
      return 'Bom trabalho hoje!';
    }
    return 'Nao quebre a sequencia!';
  };

  // Get flame color based on streak
  const getFlameColor = () => {
    if (currentStreak >= 30) return 'text-purple-500';
    if (currentStreak >= 14) return 'text-red-500';
    if (currentStreak >= 7) return 'text-orange-500';
    if (currentStreak >= 3) return 'text-yellow-500';
    return 'text-gray-400';
  };

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className={`h-5 w-5 ${getFlameColor()}`} />
          Sequencia de Estudos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current streak display */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-foreground">
                {currentStreak}
              </span>
              <span className="text-lg text-muted-foreground">
                {currentStreak === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {getStreakMessage()}
            </p>
          </div>
          {isActiveToday && (
            <div className="flex items-center gap-1 text-green-500 text-sm font-medium bg-green-500/10 px-2 py-1 rounded-full">
              <Zap className="h-4 w-4" />
              Ativo hoje
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Recorde</p>
              <p className="text-sm font-semibold">{longestStreak} dias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">{totalStudyDays} dias</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StreakCard;
