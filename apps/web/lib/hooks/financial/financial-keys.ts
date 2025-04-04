/**
 * Financial Query Keys
 * 
 * File này chứa các hàm và hằng số để tạo query keys cho React Query
 * cho các hooks liên quan đến tài chính.
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
 * Base key cho tất cả các query liên quan đến tài chính
 */
const BASE_KEY = 'financial';

/**
 * Keys cho dashboard
 */
const dashboard = {
  /**
   * Base key cho dashboard
   */
  all: () => [BASE_KEY, 'dashboard'],
  
  /**
   * Key cho dashboard summary
   */
  summary: (filters: Record<string, any> = {}) => [
    BASE_KEY, 
    'dashboard', 
    'summary', 
    filters
  ],
  
  /**
   * Key cho revenue data
   */
  revenue: (filters: Record<string, any> = {}) => [
    BASE_KEY, 
    'dashboard', 
    'revenue', 
    filters
  ],
  
  /**
   * Key cho property distribution
   */
  propertyDistribution: (filters: Record<string, any> = {}) => [
    BASE_KEY, 
    'dashboard', 
    'property-distribution', 
    filters
  ],
  
  /**
   * Key cho tác vụ đang chờ
   */
  pendingTasks: (filters: Record<string, any> = {}) => [
    BASE_KEY, 
    'dashboard', 
    'pending-tasks', 
    filters
  ],
  
  /**
   * Key cho tổng quan tài chính
   */
  overview: {
    all: () => [BASE_KEY, 'dashboard', 'overview'],
    data: (filters: Record<string, any> = {}) => [
      BASE_KEY, 
      'dashboard', 
      'overview', 
      filters
    ]
  }
};

/**
 * Keys cho transactions
 */
const transactions = {
  /**
   * Base key cho tất cả các transactions
   */
  all: () => [BASE_KEY, 'transactions'],
  
  /**
   * Key cho danh sách giao dịch
   * @deprecated Sử dụng all() hoặc lists() thay thế
   */
  list: () => [BASE_KEY, 'transactions', 'list'],
  
  /**
   * Key cho danh sách giao dịch có filter
   */
  lists: (filters: Record<string, any> = {}) => [
    BASE_KEY, 
    'transactions', 
    'list', 
    filters
  ],
  
  /**
   * Key cho chi tiết giao dịch
   */
  detail: (id: string) => [BASE_KEY, 'transactions', 'detail', id]
};

/**
 * Object chứa tất cả các hàm tạo query key
 */
export const financialKeys = {
  dashboard,
  transactions
}; 