import { QueryClient } from '@tanstack/react-query';
import { PaginatedData } from '@/lib/types/utility-types';

/**
 * Xử lý optimistic update cho trường hợp cập nhật đối tượng trong danh sách
 * @param queryClient QueryClient instance
 * @param queryKey Query key của danh sách cần update
 * @param updatedItem Dữ liệu của item đã được cập nhật
 * @param idField Tên trường ID để xác định item (mặc định là 'id')
 */
export function optimisticListUpdate<T extends Record<string, any>>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updatedItem: T,
  idField: keyof T = 'id' as keyof T
) {
  // Lấy dữ liệu hiện tại từ cache
  const previousData = queryClient.getQueryData<T[]>(queryKey);
  
  if (!previousData) return;
  
  // Update cache bằng dữ liệu mới
  queryClient.setQueryData<T[]>(queryKey, old => {
    if (!old) return [updatedItem];
    
    return old.map(item => 
      item[idField] === updatedItem[idField] ? updatedItem : item
    );
  });
}

/**
 * Xử lý optimistic update cho trường hợp thêm đối tượng mới vào danh sách
 * @param queryClient QueryClient instance
 * @param queryKey Query key của danh sách cần update
 * @param newItem Dữ liệu của item mới
 */
export function optimisticListAddition<T extends Record<string, any>>(
  queryClient: QueryClient,
  queryKey: unknown[],
  newItem: T
) {
  // Lấy dữ liệu hiện tại từ cache
  const previousData = queryClient.getQueryData<T[]>(queryKey);
  
  // Update cache bằng dữ liệu mới
  queryClient.setQueryData<T[]>(queryKey, old => {
    if (!old) return [newItem];
    return [...old, newItem];
  });
}

/**
 * Xử lý optimistic update cho trường hợp xóa đối tượng khỏi danh sách
 * @param queryClient QueryClient instance
 * @param queryKey Query key của danh sách cần update
 * @param itemId ID của item cần xóa
 * @param idField Tên trường ID để xác định item (mặc định là 'id')
 */
export function optimisticListRemoval<T extends Record<string, any>>(
  queryClient: QueryClient,
  queryKey: unknown[],
  itemId: string | number,
  idField: keyof T = 'id' as keyof T
) {
  // Lấy dữ liệu hiện tại từ cache
  const previousData = queryClient.getQueryData<T[]>(queryKey);
  
  if (!previousData) return;
  
  // Update cache bằng dữ liệu mới
  queryClient.setQueryData<T[]>(queryKey, old => {
    if (!old) return [];
    return old.filter(item => item[idField] !== itemId);
  });
}

/**
 * Xử lý optimistic update cho pagination data (dữ liệu phân trang) 
 * @param queryClient QueryClient instance
 * @param queryKey Query key của danh sách cần update
 * @param updatedItem Dữ liệu của item đã được cập nhật
 * @param idField Tên trường ID để xác định item (mặc định là 'id')
 */
export function optimisticPaginatedUpdate<
  T extends Record<string, any>,
  P extends PaginatedData<T> = PaginatedData<T>
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

/**
 * Xử lý optimistic update cho trường hợp thêm đối tượng mới vào danh sách phân trang
 * @param queryClient QueryClient instance
 * @param queryKey Query key của danh sách cần update
 * @param newItem Dữ liệu của item mới
 */
export function optimisticPaginatedAddition<
  T extends Record<string, any>,
  P extends PaginatedData<T> = PaginatedData<T>
>(
  queryClient: QueryClient,
  queryKey: unknown[],
  newItem: T
) {
  // Lấy dữ liệu hiện tại từ cache
  const previousData = queryClient.getQueryData<P>(queryKey);
  
  if (!previousData) return;
  
  // Update cache bằng dữ liệu mới
  queryClient.setQueryData<P>(queryKey, old => {
    if (!old || !old.items) return old;
    
    const newTotal = (old.totalItems ?? old.items.length) + 1;
    
    return {
      ...old,
      items: [newItem, ...old.items],
      totalItems: newTotal
    };
  });
}

/**
 * Xử lý optimistic update cho trường hợp xóa đối tượng khỏi danh sách phân trang
 * @param queryClient QueryClient instance
 * @param queryKey Query key của danh sách cần update
 * @param itemId ID của item cần xóa
 * @param idField Tên trường ID để xác định item (mặc định là 'id')
 */
export function optimisticPaginatedRemoval<
  T extends Record<string, any>,
  P extends PaginatedData<T> = PaginatedData<T>
>(
  queryClient: QueryClient,
  queryKey: unknown[],
  itemId: string | number,
  idField: keyof T = 'id' as keyof T
) {
  // Lấy dữ liệu hiện tại từ cache
  const previousData = queryClient.getQueryData<P>(queryKey);
  
  if (!previousData || !previousData.items) return;
  
  // Update cache bằng dữ liệu mới
  queryClient.setQueryData<P>(queryKey, old => {
    if (!old || !old.items) return old;
    
    const filteredItems = old.items.filter(item => item[idField] !== itemId);
    const newTotal = Math.max(0, (old.totalItems ?? old.items.length) - 1);
    
    return {
      ...old,
      items: filteredItems,
      totalItems: newTotal
    };
  });
}
