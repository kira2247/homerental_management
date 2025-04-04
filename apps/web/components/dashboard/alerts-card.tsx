import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Calendar, CreditCard, Bell } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';

type AlertType = 'warning' | 'info' | 'danger';
type AlertCategory = 'contract' | 'payment' | 'maintenance' | 'other';

interface Alert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  message: string;
  link?: string;
  date: Date | string;
}

interface AlertsCardProps {
  alerts: Alert[];
  title?: string;
  viewAllHref?: string;
  maxAlerts?: number;
}

const getCategoryIcon = (category: AlertCategory) => {
  switch (category) {
    case 'contract':
      return <Calendar className="h-5 w-5 text-blue-500" />;
    case 'payment':
      return <CreditCard className="h-5 w-5 text-green-500" />;
    case 'maintenance':
      return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" />;
  }
};

const getAlertBackground = (type: AlertType) => {
  switch (type) {
    case 'danger':
      return 'bg-red-50 dark:bg-opacity-10 dark:bg-red-900';
    case 'warning':
      return 'bg-yellow-50 dark:bg-opacity-10 dark:bg-yellow-900';
    case 'info':
      return 'bg-blue-50 dark:bg-opacity-10 dark:bg-blue-900';
    default:
      return 'bg-gray-50 dark:bg-opacity-10 dark:bg-gray-800';
  }
};

export const AlertsCard: React.FC<AlertsCardProps> = ({
  alerts,
  title,
  viewAllHref,
  maxAlerts = 5,
}) => {
  const { t, locale } = useLocale();
  
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const alertsToShow = alerts.slice(0, maxAlerts);
  const defaultTitle = t('dashboard.alerts.title');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900 dark:text-white">{title || defaultTitle}</h3>
        {viewAllHref && (
          <Link 
            href={viewAllHref} 
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            {t('common.viewAll')}
          </Link>
        )}
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {alertsToShow.length > 0 ? (
          alertsToShow.map((alert) => (
            <div 
              key={alert.id}
              className={`px-5 py-4 ${getAlertBackground(alert.type)}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">{getCategoryIcon(alert.category)}</div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {alert.link ? (
                      <Link href={alert.link} className="hover:underline">
                        {alert.message}
                      </Link>
                    ) : (
                      alert.message
                    )}
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(alert.date)}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
            {t('dashboard.alerts.noAlerts')}
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsCard; 