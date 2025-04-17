/**
 * Utility types for the application
 * These types are used for various utility functions throughout the application
 */

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface chuẩn hóa cho dữ liệu phân trang
 * Hợp nhất từ các phiên bản cũ khác nhau trong ứng dụng
 */
export interface PaginatedData<T> {
  items: T[];
  // Số lượng items tổng cộng
  totalItems?: number;
  // Thông tin về trang hiện tại
  page?: number;
  limit?: number;
  pageSize?: number; // Alias cho limit
  // Thông tin về số trang
  totalPages?: number;
  // Flag cho biết có còn dữ liệu để tải hay không
  hasMore?: boolean;
}

// Filter types
export interface BaseFilterOptions {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FilterState<T> {
  filters: T;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  resetFilters: () => void;
}

// Form controls types
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  description?: string;
  icon?: string;
}

// Common utility types
export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type KeysOfType<T, TProp> = {
  [P in keyof T]: T[P] extends TProp ? P : never;
}[keyof T];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Date utility types
export type DateRange = {
  startDate: Date;
  endDate: Date;
};

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

// View mode types
export type ViewMode = 'grid' | 'list';

// Status color mapping type
export type StatusColorMap<T extends string> = Record<T, string>;

// Callback types
export type VoidFunction = () => void;
export type ErrorCallback = (error: Error) => void;
export type SuccessCallback<T> = (data: T) => void;
