import { useQuery } from '@tanstack/react-query';
import { financialApi } from '@/lib/api/financial';
import type { FinancialOverviewDto, FinancialOverviewFilterDto } from '@/lib/api/financial/types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { financialKeys } from './financial-keys';
import { isApiSuccess, createErrorFromResponse } from '@/lib/api/helpers';

export type { FinancialOverviewFilterDto };

/**
 * Hook để lấy tổng quan tài chính
 * @param filters - Bộ lọc tổng quan tài chính (startDate, endDate, period, etc.)
 */
export function useFinancialOverview(filters: FinancialOverviewFilterDto = {}) {
  const { isLoggingOut } = useAuthStatus();
  
  return useQuery({
    queryKey: financialKeys.dashboard.overview.data(filters),
    queryFn: async () => {
      // Nếu người dùng đang đăng xuất, không thực hiện request API
      if (isLoggingOut) {
        return null;
      }
    
      const response = await financialApi.getFinancialOverview(filters);
      
      if (!isApiSuccess(response)) {
        // Sử dụng createErrorFromResponse để tạo lỗi chuẩn hóa
        throw createErrorFromResponse(response);
      }
      
      return response.data as FinancialOverviewDto;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 1,
    // Không thực hiện query nếu đang đăng xuất
    enabled: !isLoggingOut
  });
} 
