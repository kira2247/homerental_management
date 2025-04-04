import { useQueryClient } from '@tanstack/react-query';
import { propertyKeys } from './property-keys';

interface UseResetPropertyQueriesProps {
  /**
   * Whether to log debug information in development mode
   */
  debug?: boolean;
}

/**
 * Hook để reset (xóa hoàn toàn) cache của các query liên quan đến bất động sản
 * Khác với invalidate, reset hoàn toàn xóa dữ liệu khỏi cache thay vì chỉ đánh dấu là stale
 * @param options Tùy chọn cấu hình
 * @returns Các hàm để reset cache của query
 */
export function useResetPropertyQueries(options: UseResetPropertyQueriesProps = {}) {
  const { debug = false } = options;
  const queryClient = useQueryClient();
  
  /**
   * Reset cache của một bất động sản cụ thể
   * @param id ID của bất động sản cần reset
   */
  const resetProperty = (id: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useResetPropertyQueries] Reset chi tiết bất động sản', { id });
    }
    
    queryClient.removeQueries({
      queryKey: propertyKeys.detail(id),
    });
  };
  
  /**
   * Reset cache của danh sách bất động sản
   */
  const resetProperties = () => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useResetPropertyQueries] Reset danh sách bất động sản');
    }
    
    queryClient.removeQueries({
      queryKey: propertyKeys.all(),
    });
  };
  
  /**
   * Reset cache của số lượng bất động sản
   */
  const resetPropertyCount = () => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useResetPropertyQueries] Reset đếm số lượng bất động sản');
    }
    
    queryClient.removeQueries({
      queryKey: propertyKeys.count(),
    });
  };
  
  /**
   * Reset cache của danh sách đơn vị (phòng) của một bất động sản
   * @param propertyId ID của bất động sản chứa các đơn vị
   */
  const resetPropertyUnits = (propertyId: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useResetPropertyQueries] Reset danh sách đơn vị của bất động sản', { propertyId });
    }
    
    queryClient.removeQueries({
      queryKey: propertyKeys.units(propertyId),
    });
  };
  
  /**
   * Reset cache của danh sách tài liệu của một bất động sản
   * @param propertyId ID của bất động sản chứa các tài liệu
   */
  const resetPropertyDocuments = (propertyId: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useResetPropertyQueries] Reset danh sách tài liệu của bất động sản', { propertyId });
    }
    
    queryClient.removeQueries({
      queryKey: propertyKeys.documents(propertyId),
    });
  };
  
  /**
   * Reset tất cả cache liên quan đến một bất động sản
   * @param propertyId ID của bất động sản
   */
  const resetPropertyAll = (propertyId: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useResetPropertyQueries] Reset tất cả dữ liệu của bất động sản', { propertyId });
    }
    
    // Reset từng cache cụ thể
    resetProperty(propertyId);
    resetPropertyUnits(propertyId);
    resetPropertyDocuments(propertyId);
    
    // Reset cả danh sách và đếm để đảm bảo dữ liệu mới nhất
    resetProperties();
    resetPropertyCount();
  };
  
  /**
   * Reset tất cả cache liên quan đến bất động sản trên toàn hệ thống
   */
  const resetAllPropertyQueries = () => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useResetPropertyQueries] Reset tất cả dữ liệu bất động sản trong hệ thống');
    }
    
    queryClient.removeQueries({
      queryKey: [propertyKeys.all()[0]], // Dùng phần tử đầu tiên của key (BASE_KEY)
    });
  };
  
  return {
    resetProperty,
    resetProperties,
    resetPropertyCount,
    resetPropertyUnits,
    resetPropertyDocuments,
    resetPropertyAll,
    resetAllPropertyQueries,
  };
} 