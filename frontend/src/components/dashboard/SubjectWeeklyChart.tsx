/**
 * Subject Weekly Chart - Bar chart showing average time per weekday
 */
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime } from '@/lib/utils/time';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface SubjectWeeklyChartProps {
  data: ChartData<'bar'>;
}

export function SubjectWeeklyChart({ data }: SubjectWeeklyChartProps) {
  const hasData = data.labels && data.labels.length > 0;
  const hasNonZeroData = data.datasets[0]?.data.some((value) => (value as number) > 0);
  const isMobile = useIsMobile();

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return ` Media: ${formatTime(context.parsed.x ?? 0)}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatTime(Number(value));
          },
          font: {
            family: 'Manrope',
            size: isMobile ? 9 : 10,
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Manrope',
            size: isMobile ? 10 : 12,
          },
        },
      },
    },
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Media por Dia da Semana</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {hasData && hasNonZeroData ? (
          <div className="h-[280px] sm:h-[300px]">
            <Bar data={data} options={options} />
          </div>
        ) : (
          <div className="h-[280px] sm:h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum dado disponivel</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubjectWeeklyChart;
