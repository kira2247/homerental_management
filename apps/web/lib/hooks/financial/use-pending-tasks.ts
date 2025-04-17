import { useQuery } from '@tanstack/react-query';
import { financialApi } from '@/lib/api/financial';
import type { PendingTasksResponseDto, PendingTasksFilterDto } from '@/lib/api/financial/types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { financialKeys } from './financial-keys';
import { isApiSuccess, createErrorFromResponse } from '@/lib/api/helpers';

export type { PendingTasksFilterDto };

/**
 * Hook để lấy danh sách công việc đang chờ xử lý
 * @param filters - Bộ lọc cho danh sách công việc (type, limit, page, etc.)
 */
export function usePendingTasks(filters: PendingTasksFilterDto = {}) {
  const { isLoggingOut } = useAuthStatus();
  
  return useQuery({
    queryKey: financialKeys.dashboard.pendingTasks(filters),
    queryFn: async () => {
      // Nếu người dùng đang đăng xuất, không thực hiện request API
      if (isLoggingOut) {
        return null;
      }
    
      const response = await financialApi.getPendingTasks(filters);
      
      if (!isApiSuccess(response)) {
        // Sử dụng createErrorFromResponse để tạo lỗi chuẩn hóa
        throw createErrorFromResponse(response);
      }
      
      return response.data as PendingTasksResponseDto;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    retry: 1,
    // Không thực hiện query nếu đang đăng xuất
    enabled: !isLoggingOut
  });
} 
