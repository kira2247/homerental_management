/**
 * API Helper Types and Functions
 * Các utilities để hỗ trợ xử lý API responses
 */
import { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from './api-types';

// Map các mã lỗi sang các key dịch trong file i18n
export const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  // Authentication errors
  'UNAUTHORIZED': 'errors.auth.unauthorized',
  'INVALID_CREDENTIALS': 'errors.auth.invalidCredentials',
  'TOKEN_EXPIRED': 'errors.auth.tokenExpired',
  'ACCESS_DENIED': 'errors.auth.accessDenied',
  'USER_LOGGING_OUT': 'errors.auth.userLoggingOut',
  
  // Resource errors
  'RESOURCE_NOT_FOUND': 'errors.resource.notFound',
  'RESOURCE_ALREADY_EXISTS': 'errors.resource.alreadyExists',
  'RESOURCE_CONFLICT': 'errors.resource.conflict',
  
  // Validation errors
  'VALIDATION_ERROR': 'errors.validation.general',
  'INVALID_REQUEST': 'errors.validation.invalidRequest',
  'INVALID_PARAMETER': 'errors.validation.invalidParameter',
  
  // System errors
  'INTERNAL_ERROR': 'errors.system.internal',
  'SERVICE_UNAVAILABLE': 'errors.system.serviceUnavailable',
  'DATABASE_ERROR': 'errors.system.database',
  'PARSE_ERROR': 'errors.system.parse',
  'NETWORK_ERROR': 'errors.system.network',
  'CLIENT_ERROR': 'errors.system.client',
  'UNKNOWN_ERROR': 'errors.system.unknown',
  'REQUEST_ABORTED': 'errors.system.requestAborted',
  
  // Business logic errors
  'BUSINESS_RULE_VIOLATION': 'errors.business.ruleViolation',
  'OPERATION_NOT_ALLOWED': 'errors.business.operationNotAllowed',
  
  // File/upload errors
  'FILE_UPLOAD_ERROR': 'errors.file.uploadError',
  'FILE_SIZE_EXCEEDED': 'errors.file.sizeExceeded',
  'INVALID_FILE_TYPE': 'errors.file.invalidType',
  
  // Rate limiting
  'RATE_LIMIT_EXCEEDED': 'errors.rate.limitExceeded'
};

/**
 * Type guard để kiểm tra xem một API response có thành công hay không
 * @param response API response cần kiểm tra
 * @returns boolean xác định response có thành công
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard để kiểm tra xem một API response có lỗi hay không
 * @param response API response cần kiểm tra
 * @returns boolean xác định response có lỗi
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Phân tích API response và trích xuất dữ liệu hoặc throw lỗi
 * @param response API response cần phân tích
 * @returns Dữ liệu từ API response
 * @throws Error nếu response không thành công
 */
export function parseResponse<T>(response: ApiResponse<T>): T {
  if (isApiSuccess(response) && response.data !== undefined) {
    return response.data;
  }
  throw createErrorFromResponse(response as ApiErrorResponse);
}

/**
 * Trích xuất dữ liệu từ một API response thành công
 * @param response API response cần trích xuất dữ liệu
 * @param defaultValue Giá trị mặc định nếu không có dữ liệu hoặc có lỗi
 * @returns Dữ liệu từ API response hoặc giá trị mặc định
 */
export function extractApiData<T>(response: ApiResponse<T>, defaultValue: T): T {
  if (isApiSuccess(response) && response.data !== undefined) {
    return response.data;
  }
  return defaultValue;
}

/**
 * Trích xuất dữ liệu từ API responses lồng nhau
 * @param response API response
 * @param dataKey Key của dữ liệu cần trích xuất
 * @returns Dữ liệu đã trích xuất
 * @throws Error nếu response không thành công hoặc không có dữ liệu
 */
export function extractNestedData<T, K extends keyof NonNullable<T>>(
  response: ApiResponse<T>,
  dataKey: K
): NonNullable<T>[K] {
  if (isApiSuccess(response) && response.data !== null && response.data !== undefined) {
    const data = response.data[dataKey];
    if (data !== undefined) {
      return data;
    }
    throw new Error(`Không thể trích xuất dữ liệu: ${String(dataKey)} không tồn tại`);
  }
  throw createErrorFromResponse(response as ApiErrorResponse);
}

/**
 * Lấy thông báo lỗi từ API response
 * @param response API response cần lấy thông báo lỗi
 * @param defaultMessage Thông báo mặc định nếu không có lỗi hoặc lỗi không có thông báo
 * @returns Thông báo lỗi hoặc thông báo mặc định
 */
export function getApiErrorMessage(response: ApiResponse<any>, defaultMessage = 'Đã xảy ra lỗi'): string {
  if (isApiError(response) && response.error?.message) {
    return response.error.message;
  }
  return defaultMessage;
}

/**
 * Format API error response thành thông báo dễ đọc
 * @param error API error response
 * @returns Thông báo lỗi đã được format
 */
export function formatApiError(error: ApiErrorResponse): string {
  if (!error || !error.error) {
    return 'Đã xảy ra lỗi không xác định';
  }
  
  let message = error.error.message || 'Đã xảy ra lỗi';
  
  // Thêm chi tiết lỗi nếu có
  if (error.error.details) {
    const details = Object.entries(error.error.details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    message += ` (${details})`;
  }
  
  return message;
}

/**
 * Format API error response với hỗ trợ i18n
 * @param error API error response
 * @param t Hàm dịch từ i18n
 * @returns Thông báo lỗi đã được dịch và format
 */
export function formatApiErrorI18n(
  error: ApiErrorResponse,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  if (!error || !error.error) {
    return t('errors.system.unknown');
  }
  
  // Sử dụng code để map sang key i18n nếu có
  const code = error.error.code;
  const i18nKey = code ? ERROR_CODE_TO_I18N_KEY[code] : null;
  
  // Nếu có i18n key, sử dụng nó để dịch
  if (i18nKey) {
    const params: Record<string, string | number> = {};
    
    // Thêm các chi tiết làm params nếu có
    if (error.error.details) {
      Object.entries(error.error.details).forEach(([key, value]) => {
        params[key] = String(value);
      });
    }
    
    return t(i18nKey, params);
  }
  
  // Nếu không có i18n key, sử dụng message trực tiếp
  return error.error.message || t('errors.system.unknown');
}

/**
 * Tạo Error object từ API error response
 * @param response API error response
 * @returns Error object
 */
export function createErrorFromResponse(response: ApiErrorResponse): Error {
  const message = formatApiError(response);
  const error = new Error(message);
  
  // Thêm thông tin từ response vào error object để có thể truy cập sau này
  if (response.error?.code) {
    (error as any).code = response.error.code;
  }
  
  if (response.error?.details) {
    (error as any).details = response.error.details;
  }
  
  return error;
}

/**
 * Tạo Error object từ API error response với hỗ trợ i18n
 * @param response API error response
 * @param t Hàm dịch từ i18n
 * @returns Error object với thông báo đã được dịch
 */
export function createErrorFromResponseI18n(
  response: ApiErrorResponse,
  t: (key: string, params?: Record<string, string | number>) => string
): Error {
  const message = formatApiErrorI18n(response, t);
  const error = new Error(message);
  
  if (response.error?.code) {
    (error as any).code = response.error.code;
  }
  
  if (response.error?.details) {
    (error as any).details = response.error.details;
  }
  
  return error;
}

/**
 * Xử lý API error và trả về giá trị mặc định
 * @param error Error object
 * @param defaultValue Giá trị mặc định
 * @param logError Có log lỗi hay không
 * @returns Giá trị mặc định
 */
export function handleApiError<T>(error: unknown, defaultValue: T, logError = true): T {
  if (logError && error instanceof Error) {
    console.error('API Error:', error.message);
  }
  return defaultValue;
}

/**
 * Phân tích API response và trả về giá trị mặc định nếu có lỗi
 * @param response API response
 * @param defaultValue Giá trị mặc định
 * @returns Dữ liệu từ API response hoặc giá trị mặc định
 */
export function safeParseResponse<T>(response: ApiResponse<T>, defaultValue: T): T {
  try {
    return parseResponse(response);
  } catch (error) {
    return handleApiError(error, defaultValue);
  }
}

/**
 * Chuyển đổi một object thành một ApiSuccessResponse
 * @param data Dữ liệu cần chuyển đổi
 * @returns ApiSuccessResponse với dữ liệu đã cung cấp
 */
export function toApiSuccess<T>(data: T, meta?: ApiSuccessResponse<T>['meta']): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    meta
  };
}

/**
 * Chuyển đổi một error message thành một ApiErrorResponse
 * @param message Thông báo lỗi
 * @param code Mã lỗi (tùy chọn)
 * @returns ApiErrorResponse với thông báo lỗi đã cung cấp
 */
export function toApiError(message: string, code?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code
    }
  };
}

/**
 * Tạo một API response lỗi từ một Error object
 * @param error Error object
 * @returns ApiErrorResponse từ Error object
 */
export function createApiErrorFromError(error: Error): ApiErrorResponse {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.name
    }
  };
}

/**
 * Kiểm tra xem một object có phải là một ApiResponse không
 * @param obj Object cần kiểm tra
 * @returns boolean xác định object có phải là ApiResponse
 */
export function isApiResponse(obj: any): obj is ApiResponse<any> {
  return obj !== null && 
         typeof obj === 'object' &&
         'success' in obj &&
         typeof obj.success === 'boolean';
}
