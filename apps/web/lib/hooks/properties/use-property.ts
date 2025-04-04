import { useQuery } from '@tanstack/react-query';
import { 
  usePropertyApi, 
  Property,
  parseResponse,
  isApiSuccess,
  createErrorFromResponse 
} from '@/lib/api';
import { useAuthStatus } from '@/lib/hooks/auth';
import { propertyKeys } from './property-keys';

interface UsePropertyProps {
  id: string;
  enabled?: boolean;
}

/**
 * Hook để lấy thông tin chi tiết của một bất động sản từ API
 * @param props Tham số cấu hình
 * @returns Thông tin chi tiết bất động sản và các trạng thái liên quan
 */
export function useProperty(props: UsePropertyProps) {
  const { id, enabled = true } = props;
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[useProperty] Khởi tạo hook', { id, enabled, isLoggingOut });
  }
  
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: async () => {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useProperty] Đang tải dữ liệu', { id });
      }
      
      const response = await propertyApi.getPropertyById(id);
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useProperty] Nhận phản hồi API', { 
          success: response.success,
          hasData: !!response.data,
          hasError: !!response.error
        });
      }
      
      // Sử dụng helper function để kiểm tra response thành công
      if (!isApiSuccess(response)) {
        console.error('[useProperty] Lỗi API', response.error);
        // Sử dụng helper function để tạo error có format chuẩn
        throw createErrorFromResponse(response);
      }
      
      // Xử lý cấu trúc dữ liệu lồng nhau hoặc phẳng
      const responseData = response.data as any;
      // Kiểm tra nếu có cấu trúc lồng nhau (data.data)
      const propertyData = responseData?.data || responseData;
      
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[useProperty] Dữ liệu bất động sản', {
          id: propertyData?.id,
          name: propertyData?.name
        });
      }
      
      if (!propertyData) {
        console.error('[useProperty] Không tìm thấy dữ liệu bất động sản trong phản hồi');
        throw new Error('Không tìm thấy dữ liệu bất động sản');
      }
      
      return propertyData;
    },
    enabled: enabled && !!id && !isLoggingOut,
    staleTime: 0, // Luôn coi dữ liệu là cũ để đảm bảo refetch
    gcTime: 10 * 60 * 1000,   // Garbage collection after 10 minutes
    refetchOnMount: 'always', // Luôn refetch khi component mount
    refetchOnWindowFocus: true, // Refetch khi focus lại window
    retry: 2, // Thử lại 2 lần nếu request thất bại
  });
} 