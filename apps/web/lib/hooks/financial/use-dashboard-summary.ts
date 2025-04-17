import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/financial';
import type { DashboardSummaryDto, DashboardSummaryFilterDto } from '@/lib/api/financial/types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { financialKeys } from './financial-keys';
import { isApiSuccess, createErrorFromResponse } from '@/lib/api/helpers';

export type { DashboardSummaryFilterDto };

/**
 * Hook để lấy dữ liệu tổng quan cho dashboard
 * @param filters - Bộ lọc (startDate, endDate, timeRange, etc.)
 */
export function useDashboardSummary(filters: DashboardSummaryFilterDto = {}) {
  const { isLoggingOut } = useAuthStatus();
  
  return useQuery({
    queryKey: financialKeys.dashboard.summary(filters),
    queryFn: async () => {
      // Nếu người dùng đang đăng xuất, không thực hiện request API
      if (isLoggingOut) {
        return null;
      }
      
      const response = await dashboardApi.getDashboardSummary(filters);
      
      if (!isApiSuccess(response)) {
        // Sử dụng createErrorFromResponse để tạo lỗi chuẩn hóa
        throw createErrorFromResponse(response);
      }
      
      return response.data as DashboardSummaryDto;
    },
    // Sử dụng cấu hình mặc định từ QueryClient
    refetchOnWindowFocus: false,
    // Không thực hiện query nếu đang đăng xuất
    enabled: !isLoggingOut
  });
} 
