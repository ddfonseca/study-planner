/**
 * Weekly Progress - Visual progress for the current week
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { useSessionStore } from '@/store/sessionStore';
import { useConfigStore } from '@/store/configStore';
import { formatTime } from '@/lib/utils/time';
import { getDayNames } from '@/lib/utils/date';

export function WeeklyProgress() {
  const { sessions } = useSessionStore();
  const { targetHours, weekStartDay } = useConfigStore();

  // Get current week data (fixed days, respecting weekStartDay)
  const weekData = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().split('T')[0];
    const currentDayOfWeek = today.getDay(); // 0=Dom, 1=Seg...

    // Calculate start of current week
    let diff = currentDayOfWeek - weekStartDay;
    if (diff < 0) diff += 7;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - diff);

    // Get day labels based on weekStartDay
    const dayLabels = getDayNames(weekStartDay);

    // Generate 7 days of the week
    const days: { date: Date; minutes: number; label: string; isToday: boolean; isFuture: boolean }[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = sessions[dateKey];

      days.push({
        date,
        minutes: dayData?.totalMinutos || 0,
        label: dayLabels[i],
        isToday: dateKey === todayKey,
        isFuture: date > today,
      });
    }

    return days;
  }, [sessions, weekStartDay]);

  // Calculate weekly total and progress
  const weeklyStats = useMemo(() => {
    const totalMinutes = weekData.reduce((acc, day) => acc + day.minutes, 0);
    const totalHours = totalMinutes / 60;
    const targetMinutes = targetHours * 60;
    const progress = targetMinutes > 0 ? Math.min(100, (totalMinutes / targetMinutes) * 100) : 0;
    const maxMinutes = Math.max(...weekData.map(d => d.minutes), 60); // Minimum scale of 1 hour

    return { totalMinutes, totalHours, progress, maxMinutes };
  }, [weekData, targetHours]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Progresso Semanal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Circular Progress */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              {/* Background circle */}
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${weeklyStats.progress} 100`}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold">
                {Math.round(weeklyStats.progress)}%
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">
              {formatTime(weeklyStats.totalMinutes)}
            </p>
            <p className="text-xs text-muted-foreground">
              de {targetHours}h meta
            </p>
          </div>
        </div>

        {/* Bar Chart - Current week */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Semana atual</p>
          <div className="flex items-end gap-1 h-16">
            {weekData.map((day, index) => {
              const height = weeklyStats.maxMinutes > 0
                ? (day.minutes / weeklyStats.maxMinutes) * 100
                : 0;

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full relative group"
                    style={{ height: '48px' }}
                  >
                    <div
                      className={`absolute bottom-0 w-full rounded-t transition-all ${
                        day.isFuture
                          ? 'bg-muted/30'
                          : day.isToday
                          ? 'bg-primary'
                          : day.minutes > 0
                          ? 'bg-sky-300 dark:bg-sky-700'
                          : 'bg-muted'
                      }`}
                      style={{
                        height: day.isFuture ? '4px' : day.minutes > 0 ? `${Math.max(height, 8)}%` : '4px'
                      }}
                    />
                    {/* Tooltip */}
                    {day.minutes > 0 && !day.isFuture && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md border">
                        {formatTime(day.minutes)}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] ${
                    day.isFuture
                      ? 'text-muted-foreground/50'
                      : day.isToday
                      ? 'font-bold text-primary'
                      : 'text-muted-foreground'
                  }`}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WeeklyProgress;
