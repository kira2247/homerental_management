/**
 * API related types for the application
 * These types are used for API calls and responses
 */

// Base API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * API response thành công với data và metadata
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * API response với lỗi
 */
export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

/**
 * Mã lỗi tiêu chuẩn cho API errors
 */
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  USER_LOGGING_OUT = 'USER_LOGGING_OUT',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CLIENT_ERROR = 'CLIENT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  REQUEST_ABORTED = 'REQUEST_ABORTED',
  
  // Business logic errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // File/upload errors
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

// API request types
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  cache?: RequestCache;
  signal?: AbortSignal;
  skipAuthCheck?: boolean;
}

/**
 * Type cũ cho tương thích ngược
 * @deprecated Sử dụng ApiResponse<T> thay thế
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * Dữ liệu phân trang chuẩn hóa
 */
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}



// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Property API types
export interface PropertyFilter extends Record<string, any> {
  search?: string;
  city?: string;
  district?: string;
  status?: string;
  type?: string;
  ownerId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Financial API types
export interface TransactionFilter extends Record<string, any> {
  search?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  type?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Maintenance API types
export interface MaintenanceFilter extends Record<string, any> {
  search?: string;
  propertyId?: string;
  unitId?: string;
  tenantId?: string;
  priority?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Error handling types
export interface ErrorResponse extends Error {
  status?: number;
  data?: any;
}

// Cache key types
export type QueryKey = string | readonly unknown[];

// Unit API types
/**
 * Filter cho danh sách đơn vị cho thuê
 */
export interface UnitFilter {
  search?: string;
  propertyId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  hasFurniture?: boolean;
  hasAirCon?: boolean;
  hasWaterHeater?: boolean;
  hasBalcony?: boolean;
  /**
   * Tham số sắp xếp theo giá tăng dần (backend API)
   * @deprecated Sử dụng sortByPriceAsc thay cho sortBy và sortOrder
   */
  sortByPriceAsc?: boolean;
  /**
   * Trường sắp xếp (chưa được hỗ trợ ở backend)
   * @deprecated Sử dụng sortByPriceAsc thay cho sortBy và sortOrder
   */
  sortBy?: string;
  /**
   * Thứ tự sắp xếp (chưa được hỗ trợ ở backend)
   * @deprecated Sử dụng sortByPriceAsc thay cho sortBy và sortOrder
   */
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Response cho danh sách đơn vị cho thuê
 */
export interface UnitListResponse {
  units: UnitWithProperty[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Unit với thông tin property
 */
export interface UnitWithProperty {
  id: string;
  name: string;
  floor?: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  depositAmount: number;
  status: string;
  hasFurniture: boolean;
  hasAirCon: boolean;
  hasWaterHeater: boolean;
  hasBalcony: boolean;
  propertyId: string;
  createdAt: string;
  updatedAt: string;
  property: {
    name: string;
    address: string;
  };
}

/**
 * Unit với thông tin chi tiết
 */
export interface UnitDetail extends UnitWithProperty {
  electricityRate: number;
  waterRate: number;
  internetRate: number;
  garbageRate: number;
  maintenanceFee: number;
  otherFees?: Record<string, any>;
  furnitureDetails?: Record<string, any>;
  hasUtilityManagement: boolean;
  hasSeparateElectricMeter: boolean;
  hasSeparateWaterMeter: boolean;
  usesTieredElectricityPricing: boolean;
  electricityTiers?: Record<string, any>;
  initialElectricityReading?: number;
  initialWaterReading?: number;
  initialReadingDate?: string;
  handoverDate?: string;
  lastElectricityReading?: number;
  lastWaterReading?: number;
  lastReadingDate?: string;
  tenantUnits?: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    tenant: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  }[];
}

/**
 * Thông tin tóm tắt của unit
 */
export interface UnitSummary {
  id: string;
  name: string;
  status: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  currentTenant?: {
    id: string;
    name: string;
    phone: string;
  };
  contractEndDate?: string;
  unpaidBillsCount: number;
  maintenanceRequestsCount: number;
  lastPaymentDate?: string;
  propertyName: string;
}

/**
 * Request tạo đơn vị cho thuê mới
 */
export interface CreateUnitRequest {
  name: string;
  propertyId: string;
  floor?: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  depositAmount: number;
  status?: string;
  electricityRate: number;
  waterRate: number;
  internetRate: number;
  garbageRate: number;
  maintenanceFee?: number;
  otherFees?: Record<string, any>;
  hasFurniture?: boolean;
  hasAirCon?: boolean;
  hasWaterHeater?: boolean;
  hasBalcony?: boolean;
  furnitureDetails?: Record<string, any>;
  hasUtilityManagement?: boolean;
  hasSeparateElectricMeter?: boolean;
  hasSeparateWaterMeter?: boolean;
  usesTieredElectricityPricing?: boolean;
  electricityTiers?: Record<string, any>;
}

/**
 * Request cập nhật đơn vị cho thuê
 */
export interface UpdateUnitRequest extends Partial<CreateUnitRequest> {}
