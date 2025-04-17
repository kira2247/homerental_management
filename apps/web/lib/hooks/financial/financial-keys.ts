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
  summary: (filters: Record<string, any> = {}) => {
    const baseKey = [BASE_KEY, 'dashboard', 'summary'];
    return Object.keys(filters).length ? [...baseKey, filters] : baseKey;
  },
  
  /**
   * Key cho revenue data
   */
  revenue: (filters: Record<string, any> = {}) => {
    const baseKey = [BASE_KEY, 'dashboard', 'revenue'];
    return Object.keys(filters).length ? [...baseKey, filters] : baseKey;
  },
  
  /**
   * Key cho property distribution
   */
  propertyDistribution: (filters: Record<string, any> = {}) => {
    const baseKey = [BASE_KEY, 'dashboard', 'property-distribution'];
    return Object.keys(filters).length ? [...baseKey, filters] : baseKey;
  },
  
  /**
   * Key cho tác vụ đang chờ
   */
  pendingTasks: (filters: Record<string, any> = {}) => {
    const baseKey = [BASE_KEY, 'dashboard', 'pending-tasks'];
    return Object.keys(filters).length ? [...baseKey, filters] : baseKey;
  },
  
  /**
   * Key cho tổng quan tài chính
   */
  overview: {
    all: () => [BASE_KEY, 'dashboard', 'overview'],
    data: (filters: Record<string, any> = {}) => {
      const baseKey = [BASE_KEY, 'dashboard', 'overview', 'data'];
      return Object.keys(filters).length ? [...baseKey, filters] : baseKey;
    }
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
   * Key cho danh sách giao dịch (với hoặc không có filter)
   */
  list: (filters: Record<string, any> = {}) => {
    const baseKey = [BASE_KEY, 'transactions', 'list'];
    return Object.keys(filters).length ? [...baseKey, filters] : baseKey;
  },
  
  /**
   * Key cho danh sách giao dịch có filter
   * @deprecated Sử dụng list() thay thế
   */
  lists: (filters: Record<string, any> = {}) => {
    return [BASE_KEY, 'transactions', 'lists', filters];
  },
  
  /**
   * Key cho chi tiết giao dịch
   */
  detail: (id: string) => [BASE_KEY, 'transactions', 'detail', id]
};

/**
 * Object chứa tất cả các hàm tạo query key
 */
export const financialKeys = {
  all: () => [BASE_KEY],
  dashboard,
  transactions
};