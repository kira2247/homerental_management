import React, { ReactNode } from 'react';

/**
 * Props for the ChartCard component
 * @property title - The title of the chart card
 * @property description - Optional description text for the chart
 * @property children - The chart or content to render inside the card
 * @property footer - Optional footer content
 * @property className - Optional additional CSS classes
 * @property actions - Optional action buttons or controls
 * @property isLoading - Whether the chart data is currently loading
 */
interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  actions?: ReactNode;
  isLoading?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  footer,
  className = '',
  actions,
  isLoading = false,
}) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
      
      <div className="p-5">
        {isLoading ? (
          <div className="w-full h-60 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="w-full">{children}</div>
        )}
      </div>
      
      {footer && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default ChartCard; 