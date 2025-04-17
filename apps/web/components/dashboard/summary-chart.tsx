import React, { useEffect, useRef, useMemo } from 'react';
import { ChartData } from 'chart.js/auto';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useLocale } from '@/lib/i18n/client';
import { useCurrency } from '@/lib/currency/currency-context';

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Financial data structure for the summary chart
 * @property income - Array of income values for each time period
 * @property expense - Array of expense values for each time period
 * @property profit - Array of profit values for each time period
 * @property labels - Labels for each time period on the x-axis
 */
interface FinancialData {
  income: number[];
  expense: number[];
  profit: number[];
  labels: string[];
}

/**
 * Props for the SummaryChart component
 * @property data - Financial data to display in the chart
 * @property isLoading - Whether the chart data is currently loading
 * @property chartType - Type of chart to display (monthly, quarterly, yearly)
 * @property period - Time period for the financial data
 * @property showLegend - Whether to show the chart legend
 */
interface SummaryChartProps {
  data?: FinancialData;
  isLoading?: boolean;
  chartType?: 'monthly' | 'quarterly' | 'yearly';
  period?: 'month' | 'quarter' | 'year';
  showLegend?: boolean;
}

export const SummaryChart: React.FC<SummaryChartProps> = ({
  data,
  isLoading = false,
  chartType = 'monthly',
  period = 'year',
  showLegend = true,
}) => {
  const chartRef = useRef<ChartJS>(null);
  const { t, locale } = useLocale();
  const { formatCurrency } = useCurrency();
  
  // Tạo labels dựa trên period
  const getLabels = useMemo(() => {
    switch (period) {
      case 'month':
        // Chia tháng thành 4 tuần
        return Array.from({ length: 4 }, (_, i) => t('dashboard.financial.period.week', { week: i + 1 }));
      case 'quarter':
        // 3 tháng trong quý
        return Array.from({ length: 3 }, (_, i) => t('dashboard.months.' + ((i + 1).toString())));
      case 'year':
      default:
        // 12 tháng trong năm
        return Array.from({ length: 12 }, (_, i) => t('dashboard.months.' + ((i + 1).toString())));
    }
  }, [period, t]);

  // Tạo dữ liệu mặc định với labels phù hợp
  const defaultData: FinancialData = useMemo(() => ({
    income: Array(getLabels.length).fill(0),
    expense: Array(getLabels.length).fill(0),
    profit: Array(getLabels.length).fill(0),
    labels: getLabels,
  }), [getLabels]);
  
  // Sử dụng labels dựa trên period
  const chartData: ChartData<'line'> = {
    labels: getLabels,
    datasets: [
      {
        label: t('dashboard.financial.revenue.label'),
        data: data?.income || defaultData.income,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 1,
      },
      {
        label: t('dashboard.financial.expenses.label'),
        data: data?.expense || defaultData.expense,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 1,
      },
      {
        label: t('dashboard.financial.profit.label'),
        data: data?.profit || defaultData.profit,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: 'rgba(255, 255, 255, 1)',
        pointBorderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(tickValue: number | string, index: number, ticks: any[]): string | number {
            const value = Number(tickValue);
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        callbacks: {
          label: function(tooltipItem: any): string {
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (tooltipItem.parsed.y !== null) {
              label += formatCurrency(tooltipItem.parsed.y);
            }
            return label;
          }
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  // Xử lý tự động resize biểu đồ
  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="h-80 w-full relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Line ref={chartRef} data={chartData} options={options} />
      )}
    </div>
  );
};

export default SummaryChart; 