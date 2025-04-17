import { useQuery } from '@tanstack/react-query';
import { 
  usePropertyApi, 
  Property, 
  PropertyFilters,
  isApiSuccess,
  createErrorFromResponse,
  handleApiError
} from '@/lib/api';
import { useAuthStatus } from '@/lib/hooks/auth';
import { propertyKeys } from './property-keys';

interface UsePropertiesProps {
  page?: number;
  limit?: number;
  filters?: PropertyFilters;
  enabled?: boolean;
}

// Interface phụ trợ cho dữ liệu API trả về
interface PropertyResponseWithItems {
  items: Property[];
  totalItems?: number;
}

/**
 * Hook để lấy danh sách bất động sản từ API
 * @param props Tham số cấu hình
 * @returns Danh sách bất động sản và các trạng thái liên quan
 */
export function useProperties(props: UsePropertiesProps = {}) {
  const { 
    page = 1, 
    limit = 10, 
    filters = {}, 
    enabled = true 
  } = props;
  
  const propertyApi = usePropertyApi();
  const { isLoggingOut } = useAuthStatus();
  
  const queryFilter = { page, limit, ...filters };
  
  return useQuery({
    queryKey: propertyKeys.filteredLists(queryFilter),
    queryFn: async () => {
      try {
        const response = await propertyApi.getProperties(queryFilter);
        
        if (!isApiSuccess(response)) {
          throw createErrorFromResponse(response);
        }
        
        // Truy cập items từ response data với xử lý linh hoạt hơn
        const data = response.data;
        
        // Kiểm tra xem data có phải là mảng trực tiếp không
        if (Array.isArray(data)) {
          if (process.env.NODE_ENV !== 'production') {
            console.debug('[useProperties] Nhận được mảng dữ liệu trực tiếp', { count: data.length });
          }
          return data as Property[];
        }
        
        // Kiểm tra cấu trúc chuẩn với items
        if (data && typeof data === 'object') {
          // Kiểm tra thuộc tính items
          if ('items' in data && Array.isArray(data.items)) {
            const typedData = data as PropertyResponseWithItems;
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[useProperties] Nhận được dữ liệu dạng { items: [] }', { 
                count: typedData.items.length,
                totalItems: typedData.totalItems
              });
            }
            return typedData.items;
          }
          
          // Kiểm tra cấu trúc lồng nhau với data.data
          if ('data' in data && Array.isArray(data.data)) {
            if (process.env.NODE_ENV !== 'production') {
              console.debug('[useProperties] Nhận được dữ liệu lồng nhau { data: [] }', { 
                count: data.data.length
              });
            }
            return data.data as Property[];
          }
        }
        
        // Log cấu trúc không xác định và trả về mảng rỗng
        console.warn('[useProperties] Cấu trúc phản hồi API không xác định', data);
        return [] as Property[];
      } catch (error) {
        // Sử dụng helper function để xử lý lỗi và trả về giá trị mặc định
        return handleApiError<Property[]>(error, [], true);
      }
    },
    enabled: enabled && !isLoggingOut,
    staleTime: 60 * 1000, // Dữ liệu có hiệu lực trong 1 phút
    gcTime: 5 * 60 * 1000, // Garbage collection sau 5 phút
    placeholderData: (previousData) => previousData, // giữ dữ liệu cũ khi đang fetch dữ liệu mới
  });
} 