import { BaseApiService } from '@/lib/api/base-api-service';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@/lib/types/api-types';
import { 
  DashboardSummaryDto, 
  DashboardSummaryFilterDto, 
  PropertyDistributionDto, 
  PropertyDistributionFilterDto,
  PendingTasksFilterDto,
  PendingTasksResponseDto
} from './types';

/**
 * API Service cho chức năng bảng điều khiển tài chính
 * Cung cấp các endpoint liên quan đến bảng điều khiển
 */
export class DashboardApiService extends BaseApiService {
  constructor() {
    super('financial');
  }
  
  /**
   * Lấy dữ liệu tổng quan cho dashboard
   * @param filters - Bộ lọc (startDate, endDate, timeRange, etc.)
   */
  async getDashboardSummary(filters?: DashboardSummaryFilterDto): Promise<ApiResponse<DashboardSummaryDto>> {
    return this.fetchApi<DashboardSummaryDto>('GET', '/dashboard-summary', undefined, filters);
  }
  
  /**
   * Lấy dữ liệu phân phối bất động sản
   * @param filters - Bộ lọc (startDate, endDate, type, etc.)
   */
  async getPropertyDistribution(filters?: PropertyDistributionFilterDto): Promise<ApiResponse<PropertyDistributionDto>> {
    return this.fetchApi<PropertyDistributionDto>('GET', '/property-distribution', undefined, filters);
  }
  
  /**
   * Lấy dữ liệu thống kê cho bảng điều khiển
   * @param metric - Loại số liệu (revenue, expenses, profit, occupancy)
   * @param filters - Bộ lọc (startDate, endDate, type, etc.)
   */
  async getDashboardMetrics(metric: string, filters?: any): Promise<ApiResponse<any>> {
    return this.fetchApi<any>('GET', `/dashboard/metrics/${metric}`, undefined, filters);
  }
  
  /**
   * Lấy danh sách nhiệm vụ đang chờ xử lý cho dashboard
   * @param filters - Bộ lọc (limit, page, type, priority, etc.)
   */
  async getPendingTasks(filters?: PendingTasksFilterDto): Promise<ApiResponse<PendingTasksResponseDto>> {
    return this.fetchApi<PendingTasksResponseDto>('GET', '/pending-tasks', undefined, filters);
  }
} 









