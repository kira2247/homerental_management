/**
 * Property Query Keys
 * 
 * File này chứa các hàm và hằng số để tạo query keys cho React Query
 * cho các hooks liên quan đến bất động sản.
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
 * Base key cho tất cả các query liên quan đến bất động sản
 */
const BASE_KEY = 'property';

/**
 * Hàm tạo query key cho danh sách bất động sản
 */
const all = () => [BASE_KEY, 'list'];

/**
 * Hàm tạo query key cho danh sách bất động sản (alias cho all)
 * @deprecated Sử dụng all() hoặc filteredLists() thay thế
 */
const lists = () => all();

/**
 * Hàm tạo query key cho danh sách bất động sản có filter
 */
const filteredLists = (filters: Record<string, any> = {}) => [
  BASE_KEY,
  'list',
  filters
];

/**
 * Hàm tạo query key cho đếm số lượng bất động sản
 */
const count = (filters: Record<string, any> = {}) => [
  BASE_KEY,
  'count',
  filters
];

/**
 * Hàm tạo query key cho chi tiết bất động sản
 */
const detail = (id: string | number) => [BASE_KEY, 'detail', id];

/**
 * Hàm tạo query key cho các đơn vị thuê của bất động sản
 */
const units = (propertyId: string | number, filters: Record<string, any> = {}) => [
  BASE_KEY,
  'units',
  propertyId,
  filters
];

/**
 * Hàm tạo query key cho các tài liệu của bất động sản
 */
const documents = (propertyId: string | number, filters: Record<string, any> = {}) => [
  BASE_KEY,
  'documents',
  propertyId,
  filters
];

/**
 * Object chứa tất cả các hàm tạo query key
 */
export const propertyKeys = {
  all,
  lists,
  filteredLists,
  count,
  detail,
  units,
  documents
}; 