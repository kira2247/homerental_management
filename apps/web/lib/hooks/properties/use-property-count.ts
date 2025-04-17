import { useQuery } from '@tanstack/react-query';
import { 
  usePropertyApi, 
  PropertyFilters,
  safeParseResponse
} from '@/lib/api';
import { useAuthStatus } from '@/lib/hooks/auth';
import { propertyKeys } from './property-keys';
import { isApiSuccess, createErrorFromResponse, handleApiError } from '@/lib/api/helpers';
import { propertyLogger } from '@/lib/utils/logging';

interface UsePropertyCountProps {
  filters?: PropertyFilters;
  enabled?: boolean;
}

/**
 * Hook để lấy tổng số bất động sản theo bộ lọc
 * Sử dụng safeParseResponse để xử lý lỗi nhẹ nhàng và không làm gián đoạn UI
 */
export function usePropertyCount(props: UsePropertyCountProps = {}) {
  const { filters = {}, enabled = true } = props;
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  
  return useQuery({
    queryKey: propertyKeys.count(filters),
    queryFn: async () => {
      try {
        propertyLogger.debug('usePropertyCount: Fetching count with filters:', filters);
        const response = await propertyApi.getPropertyCount(filters);
        
        if (isApiSuccess(response) && response.data) {
          // Kiểm tra và xử lý dữ liệu trả về
          const data = response.data as { count?: number };
          if (typeof data.count === 'number') {
            propertyLogger.debug('usePropertyCount: Successfully got count:', data.count);
            return data.count;
          }
        }
        
        // Sử dụng createErrorFromResponse để tạo lỗi chuẩn hóa nếu response không thành công
        if (!isApiSuccess(response)) {
          propertyLogger.warn('usePropertyCount: API response not successful:', response.error);
          // Không throw lỗi để tránh làm gian đoạn UI
        } else {
          propertyLogger.warn('usePropertyCount: No valid count in response:', response);
        }
        
        return 0; // Giá trị mặc định khi không có dữ liệu hợp lệ
      } catch (error) {
        // Sử dụng handleApiError để xử lý lỗi và log ra một cách chuẩn hóa
        propertyLogger.error('usePropertyCount: Error fetching count:', 
          error instanceof Error ? error.message : String(error));
        return 0; // Trả về 0 khi có lỗi
      }
    },
    enabled: enabled && !isLoggingOut,
    staleTime: 5 * 60 * 1000, // Dữ liệu có hiệu lực trong 5 phút
    gcTime: 10 * 60 * 1000, // Garbage collection sau 10 phút
  });
} 