import { useQuery } from '@tanstack/react-query';
import { financialApi } from '@/lib/api/financial';
import type { PendingTasksResponseDto, PendingTasksFilterDto } from '@/lib/api/financial/types';
import { useAuthStatus } from '@/lib/hooks/auth';
import { financialKeys } from './financial-keys';

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
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Lỗi khi tải danh sách công việc chờ xử lý');
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