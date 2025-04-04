import { QueryClient } from '@tanstack/react-query';

/**
 * Xử lý optimistic update cho pagination data (dữ liệu phân trang) 
 * @param queryClient QueryClient instance
 * @param queryKey Query key của danh sách cần update
 * @param updatedItem Dữ liệu của item đã được cập nhật
 * @param idField Tên trường ID để xác định item (mặc định là 'id')
 */
export function optimisticPaginatedUpdate<
  T extends Record<string, any>,
  P extends { items: T[], total?: number, totalItems?: number }
>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updatedItem: T,
  idField: keyof T = 'id' as keyof T
) {
  // Lấy dữ liệu hiện tại từ cache
  const previousData = queryClient.getQueryData<P>(queryKey);
  
  if (!previousData || !previousData.items) return;
  
  // Update cache bằng dữ liệu mới
  queryClient.setQueryData<P>(queryKey, old => {
    if (!old || !old.items) return old;
    
    return {
      ...old,
      items: old.items.map(item => 
        item[idField] === updatedItem[idField] ? updatedItem : item
      )
    };
  });
} 