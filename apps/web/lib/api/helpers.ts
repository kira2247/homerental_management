/**
 * API Response Helper Functions
 * Cung cấp các utility functions để xử lý API response đã chuẩn hóa
 */

import { 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiErrorResponse, 
  ErrorCode,
  UnwrapApiResponse 
} from './types';

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
 * Create an Error object from an API error response
 */
export function createErrorFromResponse(response: ApiErrorResponse): Error {
  const formattedMessage = formatApiError(response);
  const error = new Error(formattedMessage);
  
  // Attach the original error response for further processing if needed
  (error as any).apiError = response.error;
  (error as any).errorCode = response.error?.code;
  
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