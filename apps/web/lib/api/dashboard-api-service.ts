import { BaseApiService } from './base-api-service';
import { ApiResponse } from '@/lib/types/api-types';
import { isApiSuccess } from './helpers';
import { ApiRequestOptions } from '@/lib/types/api-types';

// Các kiểu dữ liệu đã được định nghĩa trong @/lib/types/api-types

export interface FinancialOverview {
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

export interface PropertyDistribution {
  items: {
    id: string;
    name: string;
    revenue: number;
    percentage: number;
    unitCount: number;
  }[];
  totalProperties: number;
  totalRevenue: number;
}

export interface Transaction {
  id: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'cancelled';
  type: 'rent' | 'maintenance' | 'deposit' | 'other';
}

export interface TransactionList {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardSummary {
  propertyCount: number;
  propertyChangePercent: number;
  tenantCount: number;
  tenantChangePercent: number;
  maintenanceCount: number;
  maintenanceChangePercent: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingMaintenance: number;
  contractsEndingSoon: number;
  overdueBills: number;
}

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  type: 'rent' | 'maintenance' | 'contract' | 'other';
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitName?: string;
}

export interface PendingTasksResponse {
  tasks: PendingTask[];
  total: number;
  page: number;
  limit: number;
}

export class DashboardApiService extends BaseApiService {
  constructor() {
    super('financial');
  }

  async getFinancialOverview(period: string = 'month'): Promise<FinancialOverview> {
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await this.fetchApi<FinancialOverview>(
      'GET',
      '/overview',
      undefined,
      { period },
      { signal: controller.signal, cache: 'no-store' }
    );
    
    clearTimeout(timeoutId);
    
    // Use isApiSuccess helper with type assertion for safety
    if (isApiSuccess(response as ApiResponse<FinancialOverview>)) {
      return response.data as FinancialOverview;
    }
    
    // Throw error with proper message when it fails
    throw new Error(
      response.error?.message || 'Failed to fetch financial overview'
    );
  }

  async getPropertyDistribution(period: string = 'month'): Promise<PropertyDistribution> {
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await this.fetchApi<PropertyDistribution>(
      'GET',
      '/property-distribution',
      undefined,
      { period },
      { signal: controller.signal, cache: 'no-store' }
    );
    
    clearTimeout(timeoutId);
    
    // Use isApiSuccess helper with type assertion for safety
    if (isApiSuccess(response as ApiResponse<PropertyDistribution>)) {
      return response.data as PropertyDistribution;
    }
    
    // Throw error with proper message when it fails
    throw new Error(
      response.error?.message || 'Failed to fetch property distribution'
    );
  }

  async getTransactions(limit: number = 10, page: number = 1): Promise<TransactionList> {
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await this.fetchApi<TransactionList>(
      'GET',
      '/transactions',
      undefined,
      { limit, page },
      { signal: controller.signal, cache: 'no-store' }
    );
    
    clearTimeout(timeoutId);
    
    // Use isApiSuccess helper with type assertion for safety
    if (isApiSuccess(response as ApiResponse<TransactionList>)) {
      return response.data as TransactionList;
    }
    
    // Throw error with proper message when it fails
    throw new Error(
      response.error?.message || 'Failed to fetch transactions'
    );
  }

  async getDashboardSummary(filters: { timeRange?: 'week' | 'month' | 'quarter' | 'year' } = { timeRange: 'month' }): Promise<ApiResponse<DashboardSummary>> {
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await this.fetchApi<DashboardSummary>(
        'GET',
        '/dashboard-summary',
        undefined,
        filters,
        { signal: controller.signal, cache: 'no-store' }
      );
      
      clearTimeout(timeoutId);
      
      // We need to convert from the base-api-service ApiResponse to our standardized ApiResponse
      if (response.success) {
        return {
          success: true,
          data: response.data as DashboardSummary
        };
      } else {
        return {
          success: false,
          error: {
            code: response.error?.code || 'UNKNOWN_ERROR',
            message: response.error?.message || 'Failed to fetch dashboard summary'
          }
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  async getPendingTasks(limit: number = 5, page: number = 1): Promise<PendingTasksResponse> {
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await this.fetchApi<PendingTasksResponse>(
      'GET',
      '/pending-tasks',
      undefined,
      { limit, page },
      { signal: controller.signal, cache: 'no-store' }
    );
    
    clearTimeout(timeoutId);
    
    // Use isApiSuccess helper with type assertion for safety
    if (isApiSuccess(response as ApiResponse<PendingTasksResponse>)) {
      return response.data as PendingTasksResponse;
    }
    
    // Throw error with proper message when it fails
    throw new Error(
      response.error?.message || 'Failed to fetch pending tasks'
    );
  }
} 