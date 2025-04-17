'use client';

import React, { useState } from 'react';
import { useLocale } from '@/lib/i18n/client';
import { CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Represents a task in the system
 * @property id - Unique identifier for the task
 * @property title - Title of the task
 * @property description - Detailed description of the task
 * @property dueDate - Due date for task completion
 * @property priority - Priority level of the task
 * @property status - Current status of the task
 * @property property - Optional related property name
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  property?: string;
}

/**
 * Props for the TaskCard component
 * @property tasks - Array of tasks to display
 * @property loading - Whether the tasks are currently loading
 * @property onTaskComplete - Callback function when a task is marked as complete
 * @property className - Optional additional CSS classes
 */
interface TaskCardProps {
  tasks: Task[];
  loading?: boolean;
  onTaskComplete: (taskId: string) => void;
  className?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  tasks,
  loading = false,
  onTaskComplete,
  className = ''
}) => {
  const { t, locale } = useLocale();
  const [displayCount, setDisplayCount] = useState(2); // Chỉ hiển thị 2 task ban đầu
  
  // Format date based on locale
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };
  
  // Calculate days remaining
  const getDaysRemaining = (dueDate: Date) => {
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return days;
  };
  
  // Get status icon based on task priority and status
  const getStatusIcon = (task: Task) => {
    if (task.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    if (task.priority === 'high') {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
    
    if (task.priority === 'medium') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    
    return <Clock className="h-5 w-5 text-blue-500" />;
  };
  
  if (loading) {
    return (
      <div className={`rounded-lg border bg-white text-card-foreground shadow-sm h-[460px] ${className}`}>
        <div className="p-6 pb-4 border-b">
          <h3 className="text-lg font-medium">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start space-x-4">
                <div className="h-5 w-5 mt-1 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Hiển thị một số task theo giới hạn
  const visibleTasks = tasks.slice(0, displayCount);
  const hasMoreTasks = tasks.length > 0; // Luôn hiển thị nút View All nếu có task
  
  return (
    <div className={`rounded-lg border bg-white text-card-foreground shadow-sm h-[460px] flex flex-col ${className}`}>
      <div className="p-6 pb-4 border-b flex items-center justify-between">
        <h3 className="text-lg font-medium">{t('dashboard.tasks.maintenanceRequests')}</h3>
        {hasMoreTasks && (
          <Link href={`/${locale}/maintenance`} className="ml-auto">
            <button 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center transition-colors"
            >
              {t('dashboard.tasks.viewAll')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </button>
          </Link>
        )}
      </div>
      <div className="p-6 flex-grow">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center h-full">
            <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{t('dashboard.tasks.noMaintenanceRequests')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleTasks.map((task) => {
              const daysRemaining = getDaysRemaining(task.dueDate);
              
              return (
                <div key={task.id} className="flex items-start space-x-4">
                  {getStatusIcon(task)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex items-center">
                        <button
                          className="ml-2 text-xs bg-green-100 text-green-800 hover:bg-green-200 px-2 py-0.5 rounded-full transition-colors"
                          onClick={() => onTaskComplete(task.id)}
                        >
                          {t('dashboard.tasks.complete')}
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    {task.property && (
                      <p className="text-xs text-blue-600 mt-1">
                        {task.property}
                      </p>
                    )}
                    <div className="mt-1 flex items-center text-xs">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span className={`${
                        daysRemaining < 0 ? 'text-red-500' :
                        daysRemaining < 3 ? 'text-yellow-500' :
                        'text-muted-foreground'
                      }`}>
                        {daysRemaining < 0
                          ? `${Math.abs(daysRemaining)} ${t('dashboard.tasks.daysOverdue')}`
                          : daysRemaining === 0
                          ? t('dashboard.tasks.dueToday')
                          : `${t('dashboard.tasks.dueIn')} ${daysRemaining} ${t('dashboard.tasks.days')}`}
                        {' - '}{formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}; 