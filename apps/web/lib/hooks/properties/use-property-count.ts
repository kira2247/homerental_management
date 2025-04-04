import { useQuery } from '@tanstack/react-query';
import { 
  usePropertyApi, 
  PropertyFilters,
  safeParseResponse
} from '@/lib/api';
import { useAuthStatus } from '@/lib/hooks/auth';
import { propertyKeys } from './property-keys';

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
        console.log('[usePropertyCount] Fetching count with filters:', filters);
        const response = await propertyApi.getPropertyCount(filters);
        
        if (response.success && response.data && typeof response.data.count === 'number') {
          console.log('[usePropertyCount] Successfully got count:', response.data.count);
          return response.data.count;
        }
        
        console.warn('[usePropertyCount] No valid count in response:', response);
        return 0; // Giá trị mặc định khi không có dữ liệu hợp lệ
      } catch (error) {
        console.error('[usePropertyCount] Error fetching count:', error);
        return 0; // Trả về 0 khi có lỗi
      }
    },
    enabled: enabled && !isLoggingOut,
    staleTime: 5 * 60 * 1000, // Dữ liệu có hiệu lực trong 5 phút
    gcTime: 10 * 60 * 1000, // Garbage collection sau 10 phút
  });
} 