/**
 * Payment API Service - Quản lý các API liên quan đến thanh toán tiền thuê nhà
 */

import { BaseApiService } from './base-api-service';
import { ApiResponse, PaginatedResponse } from '@/lib/types/api-types';

// Types
export interface Payment {
  id: string;
  contractId: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  MOMO = 'MOMO',
  ZALO_PAY = 'ZALO_PAY',
  OTHER = 'OTHER'
}

export interface PaymentFilters {
  contractId?: string;
  tenantId?: string;
  propertyId?: string;
  status?: PaymentStatus;
  dueDateFrom?: string;
  dueDateTo?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
}

export interface CreatePaymentRequest {
  contractId: string;
  amount: number;
  dueDate: string;
  notes?: string;
}

export interface UpdatePaymentRequest {
  amount?: number;
  dueDate?: string;
  notes?: string;
}

export interface RecordPaymentRequest {
  paymentDate: string;
  method: PaymentMethod;
  amount: number;
  reference?: string;
  notes?: string;
}

// PaymentApiService class
class PaymentApiService extends BaseApiService {
  constructor() {
    super('payments');
  }
  
  /**
   * Lấy danh sách thanh toán có phân trang
   */
  async getPayments(
    page: number = 1, 
    limit: number = 10, 
    filters?: PaymentFilters
  ): Promise<ApiResponse<PaginatedResponse<Payment>>> {
    return this.getPaginated<Payment>({
      page,
      limit,
      ...filters
    });
  }
  
  /**
   * Lấy thông tin thanh toán theo ID
   */
  async getPaymentById(id: string): Promise<ApiResponse<Payment>> {
    return this.getById<Payment>(id);
  }
  
  /**
   * Tạo khoản thanh toán mới
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<ApiResponse<Payment>> {
    return this.create<Payment>(paymentData);
  }
  
  /**
   * Cập nhật thông tin khoản thanh toán
   */
  async updatePayment(id: string, paymentData: UpdatePaymentRequest): Promise<ApiResponse<Payment>> {
    return this.update<Payment>(id, paymentData);
  }
  
  /**
   * Xóa khoản thanh toán
   */
  async deletePayment(id: string): Promise<ApiResponse<void>> {
    return this.delete(id);
  }
  
  /**
   * Ghi nhận thanh toán
   */
  async recordPayment(id: string, paymentData: RecordPaymentRequest): Promise<ApiResponse<Payment>> {
    return this.fetchApi<Payment>(
      'POST',
      `/${id}/record`,
      paymentData,
      {}
    );
  }
  
  /**
   * Hủy khoản thanh toán
   */
  async cancelPayment(id: string, reason: string): Promise<ApiResponse<Payment>> {
    return this.patch<Payment>(id, { status: PaymentStatus.CANCELLED, notes: reason }, { action: 'cancel' });
  }
  
  /**
   * Tải lên biên lai thanh toán
   */
  async uploadPaymentReceipt(id: string, receipt: File): Promise<ApiResponse<{ receiptUrl: string }>> {
    const formData = new FormData();
    formData.append('receipt', receipt);
    
    return this.fetchApi<{ receiptUrl: string }>(
      'POST',
      `/${id}/receipt`,
      formData,
      {},
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );
  }
  
  /**
   * Xuất biên lai thanh toán ra PDF
   */
  async exportPaymentReceipt(id: string): Promise<ApiResponse<{ fileUrl: string }>> {
    return this.fetchApi<{ fileUrl: string }>(
      'GET',
      `/${id}/export-receipt`,
      undefined,
      {}
    );
  }
  
  /**
   * Lấy thống kê thanh toán
   */
  async getPaymentStatistics(
    startDate: string, 
    endDate: string, 
    propertyId?: string
  ): Promise<ApiResponse<{
    totalReceived: number;
    totalPending: number;
    totalOverdue: number;
    paymentsByStatus: Record<PaymentStatus, number>;
    paymentTrend: Array<{ date: string; amount: number }>;
  }>> {
    return this.fetchApi<any>(
      'GET',
      '/statistics',
      undefined,
      {
        startDate,
        endDate,
        propertyId
      }
    );
  }
  
  /**
   * Tạo nhiều khoản thanh toán cho hợp đồng
   */
  async createBulkPayments(
    contractId: string, 
    startDate: string, 
    endDate: string,
    amount: number
  ): Promise<ApiResponse<{ count: number }>> {
    return this.fetchApi<{ count: number }>(
      'POST',
      '/bulk',
      {
        contractId,
        startDate,
        endDate,
        amount
      },
      {}
    );
  }
}

// Export singleton instance
export const paymentApiService = new PaymentApiService(); 









