/**
 * Định nghĩa kiểu dữ liệu cho API Response
 * Sử dụng discriminated union với trường success
 */

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
