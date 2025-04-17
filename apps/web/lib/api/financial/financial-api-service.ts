import { BaseApiService } from '@/lib/api/base-api-service';
import { ApiResponse } from '@/lib/types/api-types';
import { FinancialOverviewDto, FinancialOverviewFilterDto, PendingTasksFilterDto, PendingTasksResponseDto } from './types';

/**
 * API Service cho chức năng tài chính tổng quan
 * Cung cấp các endpoint liên quan đến tổng quát tài chính
 */
export class FinancialApiService extends BaseApiService {
  constructor() {
    super('financial');
  }
  
  /**
   * Lấy tổng quan tài chính theo khoảng thời gian
   * @param filters - Bộ lọc (startDate, endDate, period, etc.)
   */
  async getFinancialOverview(filters?: FinancialOverviewFilterDto): Promise<ApiResponse<FinancialOverviewDto>> {
    return this.fetchApi<FinancialOverviewDto>('GET', '/overview', undefined, filters);
  }
  
  /**
   * Lấy phân tích xu hướng tài chính
   * @param filters - Bộ lọc (startDate, endDate, metric, etc.)
   */
  async getFinancialTrends(filters?: any): Promise<ApiResponse<any>> {
    return this.fetchApi<any>('GET', '/trends', undefined, filters);
  }
  
  /**
   * Lấy dữ liệu dự báo tài chính
   * @param filters - Bộ lọc (months, propertyType, etc.)
   */
  async getFinancialForecast(filters?: any): Promise<ApiResponse<any>> {
    return this.fetchApi<any>('GET', '/forecast', undefined, filters);
  }
  
  /**
   * Lấy danh sách công việc đang chờ xử lý
   * @param filters - Bộ lọc (type, page, limit, etc.)
   */
  async getPendingTasks(filters?: PendingTasksFilterDto): Promise<ApiResponse<PendingTasksResponseDto>> {
    return this.fetchApi<PendingTasksResponseDto>('GET', '/pending-tasks', undefined, filters);
  }
} 









