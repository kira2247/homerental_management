import { BaseApiService } from '@/lib/api/base-api-service';
import { ApiResponse } from '@/lib/types/api-types';
import { TransactionListDto, TransactionDto, TransactionFilterDto } from './types';

/**
 * API Service cho chức năng quản lý giao dịch tài chính
 * Cung cấp các endpoint liên quan đến giao dịch
 */
export class TransactionsApiService extends BaseApiService {
  constructor() {
    super('financial');
  }
  
  /**
   * Lấy danh sách giao dịch có phân trang
   * @param filters - Bộ lọc giao dịch (page, limit, type, status, etc.)
   */
  async getTransactions(filters?: TransactionFilterDto): Promise<ApiResponse<TransactionListDto>> {
    return this.fetchApi<TransactionListDto>('GET', '/transactions', undefined, filters);
  }
  
  /**
   * Lấy chi tiết giao dịch theo ID
   * @param id - ID của giao dịch
   */
  async getTransactionById(id: string): Promise<ApiResponse<TransactionDto>> {
    return this.fetchApi<TransactionDto>('GET', `/transactions/${id}`);
  }
  
  /**
   * Tạo giao dịch mới
   * @param data - Dữ liệu giao dịch
   */
  async createTransaction(data: Partial<TransactionDto>): Promise<ApiResponse<TransactionDto>> {
    return this.fetchApi<TransactionDto>('POST', '/transactions', data);
  }
  
  /**
   * Cập nhật giao dịch
   * @param id - ID của giao dịch
   * @param data - Dữ liệu cập nhật
   */
  async updateTransaction(id: string, data: Partial<TransactionDto>): Promise<ApiResponse<TransactionDto>> {
    return this.fetchApi<TransactionDto>('PUT', `/transactions/${id}`, data);
  }
  
  /**
   * Xóa giao dịch
   * @param id - ID của giao dịch
   */
  async deleteTransaction(id: string): Promise<ApiResponse<void>> {
    return this.fetchApi<void>('DELETE', `/transactions/${id}`);
  }
  
  /**
   * Xuất danh sách giao dịch theo định dạng
   * @param filters - Bộ lọc giao dịch
   * @param format - Định dạng xuất (pdf, csv, excel)
   */
  async exportTransactions(filters?: TransactionFilterDto, format: string = 'csv'): Promise<ApiResponse<{ url: string }>> {
    return this.fetchApi<{ url: string }>('GET', `/transactions/export/${format}`, undefined, filters);
  }
} 
