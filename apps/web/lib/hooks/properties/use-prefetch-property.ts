import { useQueryClient } from '@tanstack/react-query';
import { usePropertyApi } from '@/lib/api';
import { propertyKeys } from './property-keys';
import { isApiSuccess, createErrorFromResponse } from '@/lib/api/helpers';

interface UsePrefetchPropertyProps {
  /**
   * Whether to log debug information in development mode
   */
  debug?: boolean;
}

/**
 * Hook để prefetch dữ liệu bất động sản từ API và lưu vào cache
 * @param options Tùy chọn cấu hình
 * @returns Hàm prefetchProperty để gọi khi cần prefetch dữ liệu
 */
export function usePrefetchProperty(options: UsePrefetchPropertyProps = {}) {
  const { debug = false } = options;
  const queryClient = useQueryClient();
  const propertyApi = usePropertyApi();
  
  /**
   * Prefetch dữ liệu của một bất động sản và lưu vào cache
   * @param id ID của bất động sản cần prefetch
   * @param staleTime Thời gian dữ liệu vẫn được coi là mới (ms)
   */
  const prefetchProperty = async (id: string, staleTime = 10 * 60 * 1000) => {
    if (!id) {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[usePrefetchProperty] Bỏ qua prefetch do không có ID');
      }
      return;
    }
    
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[usePrefetchProperty] Bắt đầu prefetch', { id });
    }
    
    // Kiểm tra xem đã có dữ liệu trong cache chưa
    const cachedData = queryClient.getQueryData(propertyKeys.detail(id));
    
    if (cachedData) {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[usePrefetchProperty] Đã có dữ liệu trong cache, bỏ qua prefetch', { id });
      }
      return;
    }
    
    // Prefetch dữ liệu
    try {
      await queryClient.prefetchQuery({
        queryKey: propertyKeys.detail(id),
        queryFn: async () => {
          const response = await propertyApi.getPropertyById(id);
          
          if (!isApiSuccess(response)) {
            // Sử dụng createErrorFromResponse để tạo lỗi chuẩn hóa
            throw createErrorFromResponse(response);
          }
          
          return response.data;
        },
        staleTime,
      });
      
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[usePrefetchProperty] Prefetch thành công', { id });
      }
    } catch (error) {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.error('[usePrefetchProperty] Lỗi khi prefetch', { id, error });
      }
    }
  };
  
  return { prefetchProperty };
} 