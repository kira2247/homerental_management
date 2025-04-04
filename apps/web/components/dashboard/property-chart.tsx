import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useLocale } from '@/lib/i18n/client';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PropertyData {
  name: string;
  value: number;
  color: string;
}

interface PropertyChartProps {
  data?: PropertyData[];
  isLoading?: boolean;
  showLegend?: boolean;
  centerText?: string;
  height?: number;
}

const defaultColors = [
  'rgba(59, 130, 246, 0.8)', // blue-500
  'rgba(16, 185, 129, 0.8)', // green-500
  'rgba(245, 158, 11, 0.8)', // yellow-500
  'rgba(239, 68, 68, 0.8)',  // red-500
  'rgba(139, 92, 246, 0.8)', // purple-500
  'rgba(236, 72, 153, 0.8)', // pink-500
  'rgba(20, 184, 166, 0.8)', // teal-500
  'rgba(249, 115, 22, 0.8)', // orange-500
];

export const PropertyChart: React.FC<PropertyChartProps> = ({
  data = [],
  isLoading = false,
  showLegend = true,
  centerText,
  height = 240,
}) => {
  const { t } = useLocale();
  
  // Nếu không có dữ liệu, sử dụng dữ liệu mặc định
  const chartData = {
    labels: data.length > 0 
      ? data.map(item => item.name) 
      : [
          t('dashboard.propertyTypes.apartment'),
          t('dashboard.propertyTypes.house'),
          t('dashboard.propertyTypes.land'),
          t('dashboard.propertyTypes.office'),
        ],
    datasets: [
      {
        data: data.length > 0 
          ? data.map(item => item.value) 
          : [0, 0, 0, 0],
        backgroundColor: data.length > 0
          ? data.map(item => item.color)
          : defaultColors.slice(0, 4),
        borderColor: data.length > 0 
          ? data.map(item => item.color.replace('0.8', '1'))
          : defaultColors.slice(0, 4).map(color => color.replace('0.8', '1')),
        borderWidth: 1,
        hoverOffset: 4,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc: number, curr: number) => acc + curr, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  // Tính tổng giá trị
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);
  const defaultCenterText = t('dashboard.propertyDistribution.total');

  return (
    <div style={{ height: height }} className="relative">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="relative h-full">
            <Doughnut data={chartData} options={options} />
            {(centerText || defaultCenterText) && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-xs text-gray-500">{centerText || defaultCenterText}</div>
                <div className="text-lg font-bold">{totalValue}</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PropertyChart; 