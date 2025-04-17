'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocale } from '@/lib/i18n/client';
import { Home, Users, CreditCard } from 'lucide-react';
import { DistributionCard } from "@/components/dashboard/distribution-card";
import { OverviewCard } from "@/components/dashboard/overview-card";
import { StatCard } from '@/components/dashboard/stat-card';
import { TaskCard, Task } from '@/components/dashboard/task-card';
import { CurrencySelector } from '@/components/ui/currency-selector';
import { useCurrency } from '@/lib/currency/currency-context';
import { 
  useFinancialDashboardApi, 
  useFinancialApi, 
  useTransactionsApi 
} from '@/lib/api';
import { 
  DashboardSummaryDto, 
  PropertyDistributionDto,
  FinancialOverviewDto,
  DashboardSummaryFilterDto,
  PropertyDistributionFilterDto,
  FinancialOverviewFilterDto,
  PendingTaskDto,
  TimePeriod
} from '@/lib/types';
import { HealthIndicator } from '@/components/ui/health-indicator';
import { ApiResponse } from '@/lib/types/api-types';
import { isApiSuccess } from '@/lib/api/helpers';

// Data types
type Period = TimePeriod;

interface PropertyItem {
  name: string;
  value: number;
  color: string;
}

export default function DashboardContent() {
  const { t, locale } = useLocale();
  const { currency, formatCurrency } = useCurrency();
  const [period, setPeriod] = useState<Period>("year");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // API data states
  const [summaryData, setSummaryData] = useState<DashboardSummaryDto | null>(null);
  const [financialData, setFinancialData] = useState<FinancialOverviewDto | null>(null);
  // Đảm bảo kiểu dữ liệu trả về từ API tương thích với state
  const [propertyData, setPropertyData] = useState<any | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Component error tracking
  const [componentErrors, setComponentErrors] = useState<Record<string, string>>({});

  // API service hooks
  const financialDashboardApi = useFinancialDashboardApi();
  const financialApi = useFinancialApi();
  const transactionsApi = useTransactionsApi();
  
  // Task completion handler
  const handleTaskComplete = async (taskId: string) => {
    try {
      // API call would go here
      
      // Update UI optimistically
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId 
            ? { ...task, status: 'completed' } 
            : task
        )
      );
    } catch (error) {
      // Error handling
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setComponentErrors({});

      // Prepare filter parameters
      const timeRange = 'year' as const;
      const dashboardFilter = { timeRange };
      const financialFilter = { period: timeRange as 'year' };
      const propertyFilter = { period: timeRange as 'year', type: undefined };

      try {
        // Run requests in parallel
        const [summaryResponse, financialResponse, propertyResponse, tasksResponse] = await Promise.all([
          // Fetch summary data
          financialDashboardApi.getDashboardSummary(dashboardFilter)
            .catch(error => {
              setComponentErrors(prev => ({
                ...prev,
                summary: error instanceof Error ? error.message : 'Lỗi khi tải dữ liệu tổng quan'
              }));
              return { success: false, data: undefined, error: { message: 'Fetch failed' } };
            }),
          
          // Fetch financial data
          financialApi.getFinancialOverview(financialFilter)
            .catch(error => {
              setComponentErrors(prev => ({
                ...prev,
                financial: error instanceof Error ? error.message : 'Lỗi khi tải dữ liệu tài chính'
              }));
              return { success: false, data: undefined, error: { message: 'Fetch failed' } };
            }),
          
          // Fetch property distribution data
          financialDashboardApi.getPropertyDistribution(propertyFilter)
            .catch(error => {
              setComponentErrors(prev => ({
                ...prev,
                property: error instanceof Error ? error.message : 'Lỗi khi tải dữ liệu phân phối'
              }));
              return { success: false, data: undefined, error: { message: 'Fetch failed' } };
            }),
          
          // Fetch pending tasks
          financialDashboardApi.getPendingTasks({ limit: 5, page: 1, type: 'maintenance' })
            .catch(error => {
              setComponentErrors(prev => ({
                ...prev,
                tasks: error instanceof Error ? error.message : 'Lỗi khi tải danh sách nhiệm vụ'
              }));
              return { success: false, data: undefined, error: { message: 'Fetch failed' } };
            })
        ]);
        
        // Process API responses
        if (isApiSuccess(summaryResponse as ApiResponse<DashboardSummaryDto>) && summaryResponse.data) {
          setSummaryData(summaryResponse.data);
        }
        
        if (isApiSuccess(financialResponse as ApiResponse<FinancialOverviewDto>) && financialResponse.data) {
          setFinancialData(financialResponse.data);
        }
        
        if (isApiSuccess(propertyResponse as ApiResponse<PropertyDistributionDto>) && propertyResponse.data) {
          setPropertyData(propertyResponse.data);
        }
        
        if (isApiSuccess(tasksResponse as ApiResponse<any>) && tasksResponse.data && tasksResponse.data.tasks) {
          // Convert API tasks to component tasks
          interface PendingTaskDtoTemp {
            id: string;
            title: string;
            description: string;
            dueDate: string | Date;
            priority: 'HIGH' | 'MEDIUM' | 'LOW';
            status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
            propertyName?: string;
          }
          
          const mappedTasks: Task[] = tasksResponse.data.tasks.map((task: PendingTaskDtoTemp) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: new Date(task.dueDate),
            // Chuyển đổi đúng priority và status từ enum sang dạng chuỗi thường
            priority: (task.priority === 'HIGH' ? 'high' : task.priority === 'MEDIUM' ? 'medium' : 'low') as 'high' | 'medium' | 'low',
            status: (task.status === 'PENDING' ? 'pending' : task.status === 'IN_PROGRESS' ? 'in-progress' : 'completed') as 'pending' | 'in-progress' | 'completed',
            property: task.propertyName
          }));
          
          setTasks(mappedTasks);
        } else {
          setTasks([]);
          // Check for error in task response
          if (tasksResponse && 'error' in tasksResponse && tasksResponse.error) {
            const errorMessage = tasksResponse.error.message || 'Định dạng dữ liệu nhiệm vụ không hợp lệ';
            setComponentErrors(prev => ({
              ...prev,
              tasks: errorMessage
            }));
          }
        }
        
        // Check if all components have errors
        const allErrors = ['summary', 'financial', 'property', 'tasks'];
        const hasErrors = Object.keys(componentErrors).length > 0;
        
        if (hasErrors && allErrors.every(key => componentErrors[key])) {
          setError('Đã xảy ra lỗi khi tải dữ liệu cho dashboard');
        }
      } catch (error) {
        setError('Đã xảy ra lỗi khi tải dữ liệu dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [financialDashboardApi, financialApi, transactionsApi, currency]);
  
  // Color palette for distribution chart
  const colors = ["#4ade80", "#f87171", "#60a5fa", "#c084fc", "#fcd34d", "#e879f9", "#2dd4bf", "#f97316"];
  
  // Process property distribution data
  const mapPropertyDistribution = useMemo(() => {
    if (!propertyData || !propertyData.items || propertyData.items.length === 0) {
      return [];
    }
    
    // Group by property type
    const groupedByType: Record<string, { count: number, color?: string }> = {};
    
    // Helper to determine property type from name
    const getPropertyType = (name: string): string => {
      if (name.includes('APARTMENT') || name.includes('Căn hộ') || name.includes('Apartment')) {
        return 'APARTMENT';
      } else if (name.includes('HOUSE') || name.includes('Nhà') || name.includes('House')) {
        return 'HOUSE';
      } else if (name.includes('VILLA') || name.includes('Biệt thự') || name.includes('Villa')) {
        return 'VILLA';
      } else if (name.includes('LAND') || name.includes('Đất') || name.includes('Land')) {
        return 'LAND';
      } else if (name.includes('OFFICE') || name.includes('Văn phòng') || name.includes('Office')) {
        return 'OFFICE';
      } else if (name.includes('SHOP') || name.includes('Cửa hàng') || name.includes('Shop')) {
        return 'SHOP';
      } else {
        return 'OTHER';
      }
    };
    
    // Group all properties by type
    propertyData.items.forEach((item: { name: string; unitCount: number }) => {
      const type = getPropertyType(item.name);
      
      if (!groupedByType[type]) {
        groupedByType[type] = { count: 0 };
      }
      
      groupedByType[type].count += item.unitCount;
    });
    
    // Convert to array and assign colors
    return Object.entries(groupedByType).map(([type, data], index) => ({
      name: type,
      value: data.count,
      color: colors[index % colors.length]
    }));
  }, [propertyData, colors]);
  
  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
  };
  
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!isLoading && summaryData && (
          <>
            <StatCard
              title={t('dashboard.properties')}
              value={summaryData.properties.count}
              change={{
                value: summaryData.properties.change,
                type: summaryData.properties.change >= 0 ? 'increase' : 'decrease'
              }}
              icon={<Home className="h-5 w-5 text-blue-500" />}
            />
            <StatCard
              title={t('dashboard.tenants')}
              value={summaryData.tenants.count}
              change={{
                value: summaryData.tenants.change,
                type: summaryData.tenants.change >= 0 ? 'increase' : 'decrease'
              }}
              icon={<Users className="h-5 w-5 text-green-500" />}
            />
            <StatCard
              title={t('dashboard.pendingPayments')}
              value={formatCurrency(summaryData.pendingPayments)}
              icon={<CreditCard className="h-5 w-5 text-orange-500" />}
            />
          </>
        )}
      </div>
      
      {/* Financial Overview */}
      <div className="grid grid-cols-1 gap-4">
        <OverviewCard 
          data={financialData || undefined} 
          isLoading={isLoading} 
          period={period === 'day' || period === 'week' ? 'month' : period as 'month' | 'quarter' | 'year'}
          className="h-full"
        />
      </div>
      
      {/* Distribution and Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <DistributionCard 
            data={mapPropertyDistribution} 
            loading={isLoading} 
            className="h-full"
          />
        </div>
        <div>
          <TaskCard 
            tasks={tasks} 
            loading={isLoading}
            onTaskComplete={handleTaskComplete}
            className="h-full"
          />
        </div>
      </div>
      
      {/* Error displays */}
      {error && (
        <div className="p-4 mt-4 bg-red-50 text-red-800 rounded-lg">
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {componentErrors.global && (
        <div className="p-4 mt-4 bg-yellow-50 text-yellow-800 rounded-lg">
          <p className="font-medium">{componentErrors.global}</p>
          <HealthIndicator />
        </div>
      )}
    </div>
  );
} 
