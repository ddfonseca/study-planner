/**
 * Subject Chart - Doughnut chart showing time per subject
 */
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime } from '@/lib/utils/time';
import { useIsMobile } from '@/hooks/useMediaQuery';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface SubjectChartProps {
  data: ChartData<'doughnut'>;
}

export function SubjectChart({ data }: SubjectChartProps) {
  const hasData = data.labels && data.labels.length > 0;
  const isMobile = useIsMobile();

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right',
        labels: {
          padding: isMobile ? 12 : 20,
          usePointStyle: true,
          font: {
            family: 'Manrope',
            size: isMobile ? 11 : 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed;
            return ` ${context.label}: ${formatTime(value)}`;
          },
        },
      },
    },
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="text-base sm:text-lg">Tempo por Matéria</CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {hasData ? (
          <div className="h-[280px] sm:h-[300px]">
            <Doughnut data={data} options={options} />
          </div>
        ) : (
          <div className="h-[280px] sm:h-[300px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubjectChart;
