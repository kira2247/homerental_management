/**
 * Unit Query Keys
 * 
 * File này chứa các hàm và hằng số để tạo query keys cho React Query
 * cho các hooks liên quan đến đơn vị cho thuê.
 * 
 * Việc tách riêng query keys giúp:
 * 1. Tổ chức code tốt hơn
 * 2. Tái sử dụng keys giữa các hooks
 * 3. Dễ dàng invalidate cache
 */

/**
 * Helper function to convert readonly arrays to regular arrays for queryKey compatibility
 */
export const toQueryKey = <T extends readonly unknown[]>(key: T): unknown[] => {
  return [...key] as unknown[];
};

/**
 * Base key cho tất cả các query liên quan đến đơn vị cho thuê
 */
const BASE_KEY = 'unit';

/**
 * Hàm tạo query key cho danh sách đơn vị cho thuê
 */
const all = () => [BASE_KEY, 'list'];

/**
 * Hàm tạo query key cho danh sách đơn vị cho thuê có filter
 */
const filteredLists = (filters: Record<string, any> = {}) => [
  BASE_KEY,
  'list',
  filters
];

/**
 * Hàm tạo query key cho danh sách đơn vị cho thuê của một bất động sản
 */
const byProperty = (propertyId: string, filters: Record<string, any> = {}) => [
  BASE_KEY,
  'property',
  propertyId,
  filters
];

/**
 * Hàm tạo query key cho danh sách đơn vị cho thuê còn trống của một bất động sản
 */
const vacantByProperty = (propertyId: string) => [
  BASE_KEY,
  'property',
  propertyId,
  'vacant'
];

/**
 * Hàm tạo query key cho chi tiết đơn vị cho thuê
 */
const detail = (id: string) => [
  BASE_KEY,
  'detail',
  id
];

/**
 * Hàm tạo query key cho thông tin tóm tắt của đơn vị cho thuê
 */
const summary = (id: string) => [
  BASE_KEY,
  'summary',
  id
];

/**
 * Object chứa tất cả các hàm tạo query key
 */
export const unitKeys = {
  all,
  filteredLists,
  byProperty,
  vacantByProperty,
  detail,
  summary
};
