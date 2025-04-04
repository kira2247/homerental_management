import React from 'react';
import { ChartCard } from './chart-card';
import SummaryChart from './summary-chart';
import { useLocale } from '@/lib/i18n/client';
import { useCurrency } from '@/lib/currency/currency-context';

interface FinancialOverview {
  totalRevenue: number;
  revenueChange: number;
  totalExpenses: number;
  expenseChange: number;
  netProfit: number;
  profitChange: number;
  chartData: {
    income: number[];
    expense: number[];
    profit: number[];
    labels: string[];
  };
}

interface OverviewCardProps {
  data?: FinancialOverview;
  isLoading?: boolean;
  period?: 'month' | 'quarter' | 'year';
  className?: string;
}

const defaultData: FinancialOverview = {
  totalRevenue: 0,
  revenueChange: 0,
  totalExpenses: 0,
  expenseChange: 0,
  netProfit: 0,
  profitChange: 0,
  chartData: {
    income: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    expense: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    profit: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    labels: Array(12).fill(''),
  },
};

// Định dạng phần trăm thay đổi
const formatChange = (change: number) => {
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${change.toFixed(1)}%`;
};

export const OverviewCard: React.FC<OverviewCardProps> = ({
  data = defaultData,
  isLoading = false,
  period = 'year',
  className = '',
}) => {
  const { t, locale } = useLocale();
  const { formatCurrency } = useCurrency();

  const getPeriodText = () => {
    if (period === 'month') return t('dashboard.financial.period.month');
    if (period === 'quarter') return t('dashboard.financial.period.quarter');
    return t('dashboard.financial.period.year');
  };

  return (
    <ChartCard
      title={t('dashboard.financial.overview.title')}
      description={t('dashboard.financial.overview.subtitle', { period: getPeriodText() })}
      className={className}
      isLoading={isLoading}
      footer={
        <div className="grid grid-cols-3 gap-4 mt-2 border-t pt-3">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">{t('dashboard.financial.revenue.total')}</span>
            <span className="text-lg font-semibold">{formatCurrency(data.totalRevenue)}</span>
            <div className={`text-xs ${data.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(data.revenueChange)}
              <span className="text-gray-500 ml-1">{t('dashboard.financial.comparison.previousPeriod')}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">{t('dashboard.financial.expenses.total')}</span>
            <span className="text-lg font-semibold">{formatCurrency(data.totalExpenses)}</span>
            <div className={`text-xs ${data.expenseChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(data.expenseChange)}
              <span className="text-gray-500 ml-1">{t('dashboard.financial.comparison.previousPeriod')}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">{t('dashboard.financial.profit.net')}</span>
            <span className="text-lg font-semibold">{formatCurrency(data.netProfit)}</span>
            <div className={`text-xs ${data.profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChange(data.profitChange)}
              <span className="text-gray-500 ml-1">{t('dashboard.financial.comparison.previousPeriod')}</span>
            </div>
          </div>
        </div>
      }
    >
      <SummaryChart 
        data={data.chartData}
        isLoading={isLoading}
        chartType="monthly"
        period={period}
      />
    </ChartCard>
  );
};

export default OverviewCard; 