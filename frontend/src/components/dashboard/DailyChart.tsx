/**
 * Daily Chart - Bar chart showing minutes per day
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

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DailyChartProps {
  data: ChartData<'bar'>;
}

export function DailyChart({ data }: DailyChartProps) {
  const hasData = data.labels && data.labels.length > 0;

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const date = context[0].label as string;
            // Format date to DD/MM
            const parts = date.split('-');
            return `${parts[2]}/${parts[1]}`;
          },
          label: (context) => {
            return ` ${formatTime(context.parsed.y ?? 0)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          callback: function (_value, index) {
            // Show only every nth label to avoid overcrowding
            const labels = data.labels as string[];
            if (labels.length <= 14 || index % 2 === 0) {
              const date = labels[index];
              const parts = date.split('-');
              return `${parts[2]}/${parts[1]}`;
            }
            return '';
          },
          font: {
            family: 'Poppins',
            size: 10,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatTime(Number(value));
          },
          font: {
            family: 'Poppins',
            size: 10,
          },
        },
      },
    },
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Tempo por Dia</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[300px]">
            <Bar data={data} options={options} />
          </div>
        ) : (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-text-lighter">Nenhum dado disponível</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DailyChart;
