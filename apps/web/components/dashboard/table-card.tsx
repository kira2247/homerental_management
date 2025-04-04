import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/client';

interface TableCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const TableCard: React.FC<TableCardProps> = ({
  title,
  description,
  children,
  viewAllHref,
  viewAllLabel,
  isLoading = false,
  emptyMessage,
  className = '',
}) => {
  const { t } = useLocale();
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900 dark:text-white">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {viewAllLabel || t('common.viewAll')}
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : React.Children.count(children) > 0 ? (
        <div className="overflow-x-auto">{children}</div>
      ) : (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">{emptyMessage || t('common.noData')}</div>
      )}
    </div>
  );
};

export default TableCard; 