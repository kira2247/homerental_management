/**
 * Types và interfaces cho tính năng Financial
 * Được tổ chức theo Domain-Driven Design
 */

import { SupportedCurrency } from '@/lib/currency/currency-context';

/**
 * Enums
 */

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER'
}

export enum TransactionStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  CANCELLED = 'cancelled'
}

export enum TransactionType {
  RENT = 'rent',
  MAINTENANCE = 'maintenance',
  DEPOSIT = 'deposit',
  OTHER = 'other'
}

export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum TaskType {
  BILL = 'BILL',
  MAINTENANCE = 'MAINTENANCE',
  CONTRACT = 'CONTRACT',
  OTHER = 'OTHER'
}

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Core Types
 */

export interface CountWithChange {
  count: number;
  change: number;
}

export interface RevenueWithChange {
  amount: number;
  change: number;
}

export interface FinancialStatus {
  overdue: number;
  upcoming: number;
}

/**
 * Dashboard Data Types
 */

export interface DashboardSummary {
  properties: CountWithChange;
  units: CountWithChange;
  tenants: CountWithChange;
  revenue: RevenueWithChange;
  pendingPayments: number;
  financialStatus: FinancialStatus;
}

export interface DashboardSummaryFilter {
  startDate?: string;
  endDate?: string;
  timeRange?: TimePeriod;
}

export interface PropertyDistributionItem {
  id: string;
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
  units: number;
  unitCount: number;
  vacancyRate: number;
  occupiedUnits: number;
}

export interface PropertyDistribution {
  items: PropertyDistributionItem[];
  totalProperties: number;
  totalUnits: number;
  totalRevenue: number;
}

export interface PropertyDistributionFilter {
  startDate?: string;
  endDate?: string;
  propertyType?: string;
}

/**
 * Transaction Types
 */

export interface Transaction {
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
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  type: TransactionType;
}

export interface TransactionFilter {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  propertyId?: string;
  status?: TransactionStatus;
  type?: TransactionType;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  currency?: SupportedCurrency;
  convertToPreferred?: boolean;
  search?: string;
}

export interface TransactionList {
  items: Transaction[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Financial Overview Types
 */

export interface FinancialChart {
  income: number[];
  expense: number[];
  profit: number[];
  labels: string[];
}

export interface FinancialOverview {
  totalRevenue: number;
  revenueChange: number;
  totalExpenses: number;
  expenseChange: number;
  netProfit: number;
  profitChange: number;
  chartData: FinancialChart;
  currency: SupportedCurrency;
  originalCurrency?: SupportedCurrency;
}

export interface FinancialOverviewFilter {
  startDate?: string;
  endDate?: string;
  period?: TimePeriod;
  compareWithPrevious?: boolean;
  currency?: SupportedCurrency;
  convertToPreferred?: boolean;
}

/**
 * Task Types
 */

export interface PendingTask {
  id: string;
  title: string;
  description: string;
  dueDate: string | Date;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  propertyId?: string;
  propertyName?: string;
  unitId?: string;
  unitName?: string;
}

export interface PendingTasksFilter {
  page?: number;
  limit?: number;
  type?: string;
  priority?: TaskPriority;
  propertyId?: string;
}

export interface PendingTasksResponse {
  tasks: PendingTask[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Type aliases cho tương thích ngược
 */

// Giữ lại các tên DTO cũ để đảm bảo tương thích
export type CountWithChangeDto = CountWithChange;
export type RevenueWithChangeDto = RevenueWithChange;
export type FinancialStatusDto = FinancialStatus;
export type DashboardSummaryDto = DashboardSummary;
export type DashboardSummaryFilterDto = DashboardSummaryFilter;
export type PropertyDistributionItemDto = PropertyDistributionItem;
export type PropertyDistributionDto = PropertyDistribution;
export type PropertyDistributionFilterDto = PropertyDistributionFilter;
export type TransactionDto = Transaction;
export type TransactionFilterDto = TransactionFilter;
export type TransactionListDto = TransactionList;
export type FinancialChartDto = FinancialChart;
export type FinancialOverviewDto = FinancialOverview;
export type FinancialOverviewFilterDto = FinancialOverviewFilter;
export type PendingTaskDto = PendingTask;
export type PendingTasksFilterDto = PendingTasksFilter;
export type PendingTasksResponseDto = PendingTasksResponse;
