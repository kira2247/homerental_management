/**
 * Transaction Types
 * Các types liên quan đến giao dịch tài chính
 */

import { SupportedCurrency } from '@/lib/currency/currency-context';
import { TransactionStatus, TransactionType, PaymentMethod } from './financial-types';

/**
 * Dữ liệu về một giao dịch
 */
export interface Transaction {
  id: string;
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  type: TransactionType;
  amount: number;
  currency: SupportedCurrency;
  status: TransactionStatus;
  dueDate?: Date;
  completedDate?: Date;
  description?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Danh sách các giao dịch
 */
export interface TransactionList {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Thông tin để lọc giao dịch
 */
export interface TransactionFilter {
  search?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  type?: TransactionType;
  category?: string;
  status?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'amount' | string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Dữ liệu để tạo hoặc cập nhật giao dịch
 */
export interface TransactionFormData {
  propertyId: string;
  unitId?: string;
  tenantId?: string;
  type: TransactionType;
  amount: number;
  currency: SupportedCurrency;
  status: TransactionStatus;
  dueDate?: Date | string;
  completedDate?: Date | string;
  description?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  reference?: string;
  attachments?: string[];
  metadata?: Record<string, any>;
}

/**
 * Thông tin tổng hợp về giao dịch
 */
export interface TransactionSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingTransactions: number;
  pendingAmount: number;
  currency: SupportedCurrency;
}

/**
 * Context trong quá trình mutation giao dịch
 */
export interface TransactionMutationContext {
  previousTransaction?: unknown;
}

// Types cho backward compatibility - phải tương thích với api/financial/types.ts
export interface TransactionDto {
  id: string;
  propertyId: string;
  propertyName?: string;
  unitName?: string;
  tenantName?: string;
  amount: number;
  currency: SupportedCurrency;
  convertedAmount?: number;
  convertedCurrency?: SupportedCurrency;
  date?: string | Date;
  paymentMethod?: PaymentMethod;
  status: 'completed' | 'pending' | 'cancelled';
  type: 'rent' | 'maintenance' | 'deposit' | 'other';
  description?: string;
  category?: string;
  dueDate?: string | Date;
  completedDate?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  attachments?: string[];
  metadata?: Record<string, any>;
}

export interface TransactionListDto {
  items: TransactionDto[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionFilterDto {
  search?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  type?: 'rent' | 'maintenance' | 'deposit' | 'other';
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  currency?: SupportedCurrency;
  convertToPreferred?: boolean;
}

export type TransactionFormDataDto = TransactionFormData;
export type TransactionSummaryDto = TransactionSummary;
