import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api/financial';
import type { PropertyDistributionDto, PropertyDistributionFilterDto } from '@/lib/api/financial/types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { financialKeys } from './financial-keys';
import { isApiSuccess, createErrorFromResponse } from '@/lib/api/helpers';

export type { PropertyDistributionFilterDto };

/**
 * Hook để lấy dữ liệu phân phối bất động sản
 * @param filters - Bộ lọc (startDate, endDate, type, etc.)
 */
export function usePropertyDistribution(filters: PropertyDistributionFilterDto = {}) {
  const { isLoggingOut } = useAuthStatus();
  
  return useQuery({
    queryKey: financialKeys.dashboard.propertyDistribution(filters),
    queryFn: async () => {
      // Nếu người dùng đang đăng xuất, không thực hiện request API
      if (isLoggingOut) {
        return null;
      }
    
      const response = await dashboardApi.getPropertyDistribution(filters);
      
      if (!isApiSuccess(response)) {
        // Sử dụng createErrorFromResponse để tạo lỗi chuẩn hóa
        throw createErrorFromResponse(response);
      }
      
      return response.data as PropertyDistributionDto;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 1,
    // Không thực hiện query nếu đang đăng xuất
    enabled: !isLoggingOut
  });
} 