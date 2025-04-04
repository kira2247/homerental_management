/**
 * Types và DTO cho module Financial
 * Các interfaces này sẽ được đồng bộ hóa với backend
 */

import { SupportedCurrency } from '@/lib/currency/currency-context';

/**
 * Count with change percentage DTO
 */
export interface CountWithChangeDto {
  count: number;
  change: number;
}

/**
 * Revenue with change percentage DTO
 */
export interface RevenueWithChangeDto {
  amount: number;
  change: number;
}

/**
 * Financial status DTO
 */
export interface FinancialStatusDto {
  overdue: number;
  upcoming: number;
}

/**
 * Dashboard summary DTO
 */
export interface DashboardSummaryDto {
  properties: CountWithChangeDto;
  units: CountWithChangeDto;
  tenants: CountWithChangeDto;
  revenue: RevenueWithChangeDto;
  pendingPayments: number;
  financialStatus: FinancialStatusDto;
}

/**
 * Dashboard summary filter DTO
 */
export interface DashboardSummaryFilterDto {
  startDate?: string;
  endDate?: string;
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

/**
 * Property distribution item DTO
 */
export interface PropertyDistributionItemDto {
  id: string;
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
  percentage: number;
  unitCount: number;
}

/**
 * Property distribution DTO
 */
export interface PropertyDistributionDto {
  items: PropertyDistributionItemDto[];
  totalProperties: number;
  totalUnits: number;
  totalRevenue: number;
}

/**
 * Property distribution filter DTO
 */
export interface PropertyDistributionFilterDto {
  startDate?: string;
  endDate?: string;
  type?: 'APARTMENT' | 'HOUSE' | 'COMMERCIAL' | 'OFFICE' | 'WAREHOUSE';
}

/**
 * Transaction DTO
 */
export interface TransactionDto {
  id: string;
  propertyId: string;
  propertyName: string;
  unitName: string;
  tenantName: string;
  amount: number;
  currency: SupportedCurrency;
  convertedAmount?: number;
  convertedCurrency?: SupportedCurrency;
  date: Date | string;
  paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CREDIT_CARD' | 'OTHER';
  status: 'completed' | 'pending' | 'cancelled';
  type: 'rent' | 'maintenance' | 'deposit' | 'other';
}

/**
 * Transaction filter DTO
 */
export interface TransactionFilterDto {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  type?: 'rent' | 'maintenance' | 'deposit' | 'other';
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  currency?: SupportedCurrency;
  convertToPreferred?: boolean;
  search?: string;
}

/**
 * Transaction list DTO
 */
export interface TransactionListDto {
  items: TransactionDto[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Financial chart DTO
 */
export interface FinancialChartDto {
  income: number[];
  expense: number[];
  profit: number[];
  labels: string[];
}

/**
 * Financial overview DTO
 */
export interface FinancialOverviewDto {
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
  currency: SupportedCurrency;
  originalCurrency?: SupportedCurrency;
}

/**
 * Financial overview filter DTO
 */
export interface FinancialOverviewFilterDto {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
  currency?: SupportedCurrency;
  convertToPreferred?: boolean;
}

/**
 * Pending task DTO
 */
export interface PendingTaskDto {
  id: string;
  title: string;
  description: string;
  dueDate: string | Date;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  type: 'BILL' | 'MAINTENANCE' | 'CONTRACT' | 'OTHER';
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitName?: string;
}

/**
 * Pending tasks filter DTO
 */
export interface PendingTasksFilterDto {
  page?: number;
  limit?: number;
  type?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  propertyId?: string;
}

/**
 * Pending tasks response DTO
 */
export interface PendingTasksResponseDto {
  tasks: PendingTaskDto[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
} 