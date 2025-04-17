/**
 * API Response Helper Functions
 * Cung cấp các utility functions để xử lý API response đã chuẩn hóa
 */

import { 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  ErrorCode
} from '@/lib/types/api-types';

// Utility type để lấy kiểu dữ liệu từ ApiResponse
export type UnwrapApiResponse<T> = T extends ApiResponse<infer U> ? U : never;

// Map các mã lỗi sang các key dịch trong file i18n
const ERROR_CODE_TO_I18N_KEY: Record<string, string> = {
  // Authentication errors
  [ErrorCode.UNAUTHORIZED]: 'errors.auth.unauthorized',
  [ErrorCode.INVALID_CREDENTIALS]: 'errors.auth.invalidCredentials',
  [ErrorCode.TOKEN_EXPIRED]: 'errors.auth.tokenExpired',
  [ErrorCode.ACCESS_DENIED]: 'errors.auth.accessDenied',
  [ErrorCode.USER_LOGGING_OUT]: 'errors.auth.userLoggingOut',
  
  // Resource errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 'errors.resource.notFound',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'errors.resource.alreadyExists',
  [ErrorCode.RESOURCE_CONFLICT]: 'errors.resource.conflict',
  
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'errors.validation.general',
  [ErrorCode.INVALID_REQUEST]: 'errors.validation.invalidRequest',
  [ErrorCode.INVALID_PARAMETER]: 'errors.validation.invalidParameter',
  
  // System errors
  [ErrorCode.INTERNAL_ERROR]: 'errors.system.internal',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'errors.system.serviceUnavailable',
  [ErrorCode.DATABASE_ERROR]: 'errors.system.database',
  [ErrorCode.PARSE_ERROR]: 'errors.system.parse',
  [ErrorCode.NETWORK_ERROR]: 'errors.system.network',
  [ErrorCode.CLIENT_ERROR]: 'errors.system.client',
  [ErrorCode.UNKNOWN_ERROR]: 'errors.system.unknown',
  [ErrorCode.REQUEST_ABORTED]: 'errors.system.requestAborted',
  
  // Business logic errors
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'errors.business.ruleViolation',
  [ErrorCode.OPERATION_NOT_ALLOWED]: 'errors.business.operationNotAllowed',
  
  // File/upload errors
  [ErrorCode.FILE_UPLOAD_ERROR]: 'errors.file.uploadError',
  [ErrorCode.FILE_SIZE_EXCEEDED]: 'errors.file.sizeExceeded',
  [ErrorCode.INVALID_FILE_TYPE]: 'errors.file.invalidType',
  
  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'errors.rate.limitExceeded'
};

/**
 * Type guard function to check if an API response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Parse API response and extract data or throw an error
 * @throws Error with formatted error message if response is not successful
 */
export function parseResponse<T>(response: ApiResponse<T>): T {
  if (isApiSuccess(response)) {
    return response.data;
  }
  
  throw createErrorFromResponse(response);
}

/**
 * Extract data from nested API responses
 * Useful when API returns paginated data or other nested structures
 */
export function extractNestedData<T, K extends keyof T>(
  response: ApiResponse<T>, 
  dataKey: K
): T[K] {
  if (isApiSuccess(response)) {
    return response.data[dataKey];
  }
  
  throw createErrorFromResponse(response);
}

/**
 * Format API error response into a readable message
 */
export function formatApiError(error: ApiErrorResponse): string {
  if (!error.error) {
    return 'Lỗi không xác định';
  }
  
  let message = error.error.message || 'Lỗi không xác định';
  
  // Add error code if available
  if (error.error.code) {
    message = `[${error.error.code}] ${message}`;
  }
  
  // Add details if available
  if (error.error.details && Object.keys(error.error.details).length > 0) {
    const detailsStr = Object.entries(error.error.details)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    message = `${message} (${detailsStr})`;
  }
  
  return message;
}

/**
 * Format API error response into a readable message with i18n support
 */
export function formatApiErrorI18n(error: ApiErrorResponse, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (!error.error) {
    return t('errors.system.unknown');
  }
  
  let messageKey = 'errors.system.unknown';
  let fallbackMessage = error.error.message || 'Lỗi không xác định';
  
  // Get translation key based on error code
  if (error.error.code && ERROR_CODE_TO_I18N_KEY[error.error.code]) {
    messageKey = ERROR_CODE_TO_I18N_KEY[error.error.code];
  }
  
  // Translate the message
  let message = t(messageKey, { fallback: fallbackMessage });
  
  // Add error code if available and in development mode
  if (process.env.NODE_ENV === 'development' && error.error.code) {
    message = `[${error.error.code}] ${message}`;
  }
  
  // Add details if available
  if (error.error.details && Object.keys(error.error.details).length > 0) {
    const detailsStr = Object.entries(error.error.details)
      .map(([key, value]) => `${t(`errors.fields.${key}`, { fallback: key })}: ${value}`)
      .join(', ');
    message = `${message} (${detailsStr})`;
  }
  
  return message;
}

/**
 * Create an Error object from an API error response
 */
export function createErrorFromResponse(response: ApiErrorResponse | ApiResponse<any>): Error {
  // Xử lý các loại response khác nhau
  if ('data' in response && !('error' in response && response.error && 'code' in response.error)) {
    // Xử lý trường hợp response có cấu trúc cũ
    const errorMessage = response.error?.message || 'Lỗi không xác định';
    const error = new Error(errorMessage);
    
    // Attach the original error response for further processing if needed
    (error as any).apiError = response.error;
    (error as any).errorCode = response.error?.code;
    
    return error;
  }
  
  const formattedMessage = formatApiError(response as ApiErrorResponse);
  const error = new Error(formattedMessage);
  
  // Attach the original error response for further processing if needed
  (error as any).apiError = (response as ApiErrorResponse).error;
  (error as any).errorCode = (response as ApiErrorResponse).error?.code;
  
  return error;
}

/**
 * Create an Error object from an API error response with i18n support
 */
export function createErrorFromResponseI18n(response: ApiErrorResponse, t: (key: string, params?: Record<string, string | number>) => string): Error {
  const formattedMessage = formatApiErrorI18n(response, t);
  const error = new Error(formattedMessage);
  
  // Attach the original error response for further processing if needed
  (error as any).apiError = response.error;
  (error as any).errorCode = response.error?.code;
  (error as any).i18nKey = response.error?.code ? ERROR_CODE_TO_I18N_KEY[response.error.code] : null;
  
  return error;
}

/**
 * Handle API error and return a default value
 * Useful for non-critical API calls where we want to fallback to a default value
 */
export function handleApiError<T>(error: unknown, defaultValue: T, logError: boolean = true): T {
  if (logError) {
    console.error('API Error handled with default value:', error);
  }
  return defaultValue;
}

/**
 * Try to parse API response and return default value if it fails
 */
export function safeParseResponse<T>(response: ApiResponse<T>, defaultValue: T): T {
  try {
    return parseResponse(response);
  } catch (error) {
    return defaultValue;
  }
} 

