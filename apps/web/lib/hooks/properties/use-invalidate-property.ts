import { useQueryClient } from '@tanstack/react-query';
import { propertyKeys } from './property-keys';

interface UseInvalidatePropertyProps {
  /**
   * Whether to log debug information in development mode
   */
  debug?: boolean;
}

/**
 * Hook để invalidate cache của các query liên quan đến bất động sản
 * @param options Tùy chọn cấu hình
 * @returns Các hàm để invalidate cache của query
 */
export function useInvalidateProperty(options: UseInvalidatePropertyProps = {}) {
  const { debug = false } = options;
  const queryClient = useQueryClient();
  
  /**
   * Invalidate cache của một bất động sản cụ thể
   * @param id ID của bất động sản cần invalidate
   */
  const invalidateProperty = async (id: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useInvalidateProperty] Invalidate chi tiết bất động sản', { id });
    }
    
    await queryClient.invalidateQueries({
      queryKey: propertyKeys.detail(id),
    });
  };
  
  /**
   * Invalidate cache của danh sách bất động sản
   */
  const invalidateProperties = async () => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useInvalidateProperty] Invalidate danh sách bất động sản');
    }
    
    await queryClient.invalidateQueries({
      queryKey: propertyKeys.all(),
    });
  };
  
  /**
   * Invalidate cache của danh sách đơn vị (phòng) của một bất động sản
   * @param propertyId ID của bất động sản chứa các đơn vị
   */
  const invalidatePropertyUnits = async (propertyId: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useInvalidateProperty] Invalidate danh sách đơn vị của bất động sản', { propertyId });
    }
    
    await queryClient.invalidateQueries({
      queryKey: propertyKeys.units(propertyId),
    });
  };
  
  /**
   * Invalidate cache của danh sách tài liệu của một bất động sản
   * @param propertyId ID của bất động sản chứa các tài liệu
   */
  const invalidatePropertyDocuments = async (propertyId: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useInvalidateProperty] Invalidate danh sách tài liệu của bất động sản', { propertyId });
    }
    
    await queryClient.invalidateQueries({
      queryKey: propertyKeys.documents(propertyId),
    });
  };
  
  /**
   * Invalidate cache của tất cả data liên quan đến một bất động sản cụ thể
   * @param propertyId ID của bất động sản
   */
  const invalidatePropertyAll = async (propertyId: string) => {
    if (debug && process.env.NODE_ENV !== 'production') {
      console.debug('[useInvalidateProperty] Invalidate tất cả dữ liệu của bất động sản', { propertyId });
    }
    
    // Invalidate chi tiết bất động sản
    await invalidateProperty(propertyId);
    
    // Invalidate danh sách đơn vị
    await invalidatePropertyUnits(propertyId);
    
    // Invalidate danh sách tài liệu
    await invalidatePropertyDocuments(propertyId);
    
    // Invalidate danh sách bất động sản
    await invalidateProperties();
  };
  
  return {
    invalidateProperty,
    invalidateProperties,
    invalidatePropertyUnits,
    invalidatePropertyDocuments,
    invalidatePropertyAll,
  };
} 