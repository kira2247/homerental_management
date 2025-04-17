import { useQueryClient } from '@tanstack/react-query';
import { Property } from '@/lib/api';
import { propertyKeys, toQueryKey } from './property-keys';
import { optimisticListUpdate, optimisticPaginatedUpdate } from '@/lib/utils/optimistic';

interface UseOptimisticPropertyUpdateProps {
  /**
   * Whether to log debug information in development mode
   */
  debug?: boolean;
}

/**
 * Hook cung cấp các phương thức để thực hiện optimistic updates cho property data
 * Optimistic updates giúp cải thiện UX bằng cách cập nhật UI ngay lập tức trước khi API request hoàn thành
 * 
 * @param options Tùy chọn cấu hình
 * @returns Các methods để thực hiện optimistic updates
 */
export function useOptimisticPropertyUpdate(options: UseOptimisticPropertyUpdateProps = {}) {
  const { debug = false } = options;
  const queryClient = useQueryClient();
  
  /**
   * Lưu trữ trạng thái trước khi thực hiện optimistic update (để rollback nếu cần)
   * @param propertyId ID của bất động sản
   * @returns Original property data để có thể rollback
   */
  const saveOriginalProperty = (propertyId: string) => {
    const detailKey = propertyKeys.detail(propertyId);
    const originalProperty = queryClient.getQueryData(detailKey);
    
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useOptimisticPropertyUpdate] Lưu trữ dữ liệu gốc', { propertyId, data: !!originalProperty });
    }
    
    return originalProperty;
  };
  
  /**
   * Cập nhật optimistic cho một property trong cache chi tiết và danh sách
   * @param propertyId ID của bất động sản cần cập nhật
   * @param updatedData Dữ liệu cập nhật một phần hoặc toàn bộ
   * @returns Boolean cho biết có thực hiện cập nhật hay không
   */
  const updatePropertyData = (propertyId: string, updatedData: Partial<Property>) => {
    // Cập nhật trong cache chi tiết
    const detailKey = propertyKeys.detail(propertyId);
    const existingData = queryClient.getQueryData<Property>(detailKey);
    
    if (existingData) {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useOptimisticPropertyUpdate] Cập nhật dữ liệu chi tiết', { propertyId, updatedData });
      }
      
      // Update dữ liệu chi tiết
      queryClient.setQueryData<Property>(detailKey, {
        ...existingData,
        ...updatedData
      });
      
      // Cập nhật trong tất cả các danh sách
      const allListsKey = propertyKeys.lists();
      const filteredListsPattern = [propertyKeys.all()[0], 'list'];
      
      // Tìm tất cả các query keys liên quan đến danh sách property
      const queryCache = queryClient.getQueryCache();
      const listQueries = queryCache.findAll({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Kiểm tra nếu key có pattern [propertyKeys.all()[0], 'list', ...]
          return Array.isArray(queryKey) && 
                 queryKey.length >= 2 && 
                 queryKey[0] === filteredListsPattern[0] && 
                 queryKey[1] === filteredListsPattern[1];
        }
      });
      
      // Cập nhật trong từng danh sách
      if (listQueries.length > 0) {
        if (debug && process.env.NODE_ENV !== 'production') {
          console.debug('[useOptimisticPropertyUpdate] Cập nhật trong các danh sách', { 
            propertyId, 
            listCount: listQueries.length 
          });
        }
        
        // Tạo đối tượng property được cập nhật hoàn chỉnh
        const updatedProperty = {
          ...existingData,
          ...updatedData
        };
        
        // Cập nhật trong mỗi danh sách
        listQueries.forEach(query => {
          const queryKeyData = query.queryKey;
          
          // Kiểm tra kiểu dữ liệu trong cache
          const cachedData = queryClient.getQueryData(queryKeyData);
          
          if (Array.isArray(cachedData)) {
            // Danh sách dạng array
            optimisticListUpdate(queryClient, toQueryKey(queryKeyData), updatedProperty as any);
          } else if (cachedData && typeof cachedData === 'object' && 'items' in (cachedData as any)) {
            // Danh sách dạng phân trang
            optimisticPaginatedUpdate(queryClient, toQueryKey(queryKeyData), updatedProperty as any);
          }
        });
      }
      
      return true;
    }
    
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useOptimisticPropertyUpdate] Không tìm thấy dữ liệu chi tiết để cập nhật', { propertyId });
    }
    
    return false;
  };
  
  /**
   * Phục hồi dữ liệu gốc trong trường hợp xảy ra lỗi
   * @param propertyId ID của bất động sản
   * @param originalData Dữ liệu gốc đã lưu trữ trước đó
   */
  const rollbackPropertyData = (propertyId: string, originalData: any) => {
    if (!originalData) {
      if (debug && process.env.NODE_ENV !== 'production') {
        console.debug('[useOptimisticPropertyUpdate] Không thể rollback do không có dữ liệu gốc', { propertyId });
      }
      return;
    }
    
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useOptimisticPropertyUpdate] Phục hồi dữ liệu gốc', { propertyId });
    }
    
    const detailKey = propertyKeys.detail(propertyId);
    queryClient.setQueryData(detailKey, originalData);
    
    // Refetch để đảm bảo dữ liệu đồng bộ với server
    queryClient.invalidateQueries({
      queryKey: detailKey
    });
    
    // Cần invalidate cả danh sách
    queryClient.invalidateQueries({
      queryKey: propertyKeys.lists()
    });
  };
  
  return {
    saveOriginalProperty,
    updatePropertyData,
    rollbackPropertyData
  };
} 