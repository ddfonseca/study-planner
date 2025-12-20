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

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

interface SubjectChartProps {
  data: ChartData<'doughnut'>;
}

export function SubjectChart({ data }: SubjectChartProps) {
  const hasData = data.labels && data.labels.length > 0;

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            family: 'Poppins',
            size: 12,
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
      <CardHeader>
        <CardTitle className="text-lg">Tempo por Matéria</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[300px]">
            <Doughnut data={data} options={options} />
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SubjectChart;
