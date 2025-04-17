import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

/**
 * Props for the StatCard component
 * @property title - The title of the stat card
 * @property value - The main value to display
 * @property icon - The icon to display alongside the stat
 * @property change - Optional change information showing increase/decrease
 * @property change.value - The numeric value of the change
 * @property change.type - Whether the change is an increase or decrease
 * @property change.period - Optional time period for the change (e.g., "vs last month")
 * @property footer - Optional footer text
 * @property colorClass - Optional CSS class for custom coloring
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  footer?: string;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  footer,
  colorClass = 'bg-blue-500',
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h2>
            <div className="mt-1 flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
              {change && (
                <span 
                  className={`ml-2 flex items-center text-xs font-medium ${
                    change.type === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {change.type === 'increase' ? (
                    <ArrowUp className="h-3 w-3 mr-1 flex-shrink-0" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1 flex-shrink-0" />
                  )}
                  {Math.abs(change.value)}%
                  {change.period && <span className="ml-1 text-gray-500 dark:text-gray-400">({change.period})</span>}
                </span>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-full ${colorClass} bg-opacity-10 dark:bg-opacity-20`}>
            {icon}
          </div>
        </div>
        {footer && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default StatCard; 