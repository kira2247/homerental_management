/**
 * Base API Service - Cung cấp các phương thức CRUD cơ bản và xử lý lỗi
 * để các service khác kế thừa và tái sử dụng
 */

import { ErrorCode, ErrorService } from '../errors/error-service';
import { tokenService } from '../auth/token-service';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  cache?: RequestCache;
  skipAuthCheck?: boolean; // Tùy chọn để bỏ qua kiểm tra auth
}

export abstract class BaseApiService {
  private baseUrl: string;
  
  constructor(resource: string) {
    this.baseUrl = `/api/${resource}`;
  }
  
  /**
   * Call API method with standardized error handling and response normalization
   */
  protected async fetchApi<T>(
    method: string,
    path: string,
    data?: any,
    queryParams: Record<string, any> = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 10);
    
    try {
      // Kiểm tra trạng thái đăng xuất từ global state (nếu có)
      if (!options.skipAuthCheck && this.isUserLoggingOut()) {
        return {
          success: false,
          error: {
            code: 'USER_LOGGING_OUT',
            message: 'Không thể thực hiện yêu cầu API khi đang đăng xuất'
          }
        };
      }
      
      const queryString = this.buildQueryString(queryParams);
      const url = `${this.baseUrl}${path}${queryString}`;
      
      // Log request details (trong môi trường development)
      if (process.env.NODE_ENV !== 'production') {
        // Tạo object chứa các thông tin cần log
        const logInfo: any = {};
        
        // Chỉ thêm data nếu có dữ liệu thực sự
        if (data !== undefined && data !== null && data !== '') {
          logInfo.data = data;
        }
        
        // Chỉ thêm params nếu có tham số
        if (Object.keys(queryParams).length > 0) {
          logInfo.params = queryParams;
        }
        
        // Chỉ thêm options nếu có options thực sự
        if (Object.keys(options).length > 0 && options.headers) {
          logInfo.options = { ...options };
          // Xóa headers khỏi log để tránh lộ thông tin nhạy cảm
          delete logInfo.options.headers;
        }
        
        console.log(`[API][${requestId}] ${method} ${url}`, Object.keys(logInfo).length > 0 ? logInfo : '');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers
      };
      
      const response = await this.fetchApiWithHeaders<T>(method, url, data, headers, options);
      
      // Log response time (trong môi trường development)
      if (process.env.NODE_ENV !== 'production') {
        const duration = Date.now() - startTime;
        console.log(`[API][${requestId}] Completed in ${duration}ms with status: ${response.success ? 'SUCCESS' : 'ERROR'}`);
      }
      
      return response;
    } catch (error) {
      // Log error details (trong môi trường development)
      if (process.env.NODE_ENV !== 'production') {
        const duration = Date.now() - startTime;
        console.error(`[API][${requestId}] Failed after ${duration}ms with error:`, error);
      }
      
      // Trả về standardized error response
      return {
        success: false,
        error: {
          code: error instanceof Error ? 'CLIENT_ERROR' : 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Lỗi không xác định khi gọi API'
        }
      };
    }
  }
  
  /**
   * Kiểm tra xem người dùng có đang trong quá trình đăng xuất không
   * Sử dụng cơ chế lấy trạng thái từ window
   */
  private isUserLoggingOut(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window as any).__isUserLoggingOut__;
  }
  
  /**
   * Build query string from params
   */
  protected buildQueryString(params: Record<string, any> = {}): string {
    const query = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
        }
        
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      })
      .join('&');
      
    return query ? `?${query}` : '';
  }
  
  /**
   * Parse JSON response
   */
  private async parseJsonResponse(response: Response): Promise<any> {
    if (response.status === 204) return {}; // No Content
    
    try {
      // Sử dụng clone để tránh lỗi stream đã đóng
      const clonedResponse = response.clone();
      return await clonedResponse.json();
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      
      try {
        // Nếu parse JSON thất bại, thử lấy response text
        const textContent = await response.text();
        console.log('Response text content:', textContent);
        
        // Thử parse lại nếu là JSON string hợp lệ
        try {
          return JSON.parse(textContent);
        } catch {
          // Không phải JSON, trả về text như là error message
          return { message: textContent || 'Invalid response from server' };
        }
      } catch (textError) {
        console.error('Error reading response text:', textError);
        return { message: 'Could not read server response' };
      }
    }
  }
  
  /**
   * Make API request with headers
   */
  protected async fetchApiWithHeaders<T>(
    method: string,
    url: string,
    data: any = undefined,
    headers: Record<string, string> = {},
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Create fetch config
      const config: RequestInit = {
        method,
        headers,
        credentials: 'include', // Include cookies
        signal: options.signal,
        cache: options.cache || 'no-store', // Default to no-store để tránh cache gây lỗi
      };
      
      // Add body if method is not GET or HEAD
      if (method !== 'GET' && method !== 'HEAD' && data !== undefined) {
        if (data instanceof FormData) {
          config.body = data;
          // Xóa Content-Type để browser tự thêm boundary
          if (config.headers) {
            delete (config.headers as Record<string, string>)['Content-Type'];
          }
        } else {
          config.body = JSON.stringify(data);
        }
      }
      
      // Make request
      const response = await fetch(url, config);
      
      // Handle unauthorized (token expired)
      if (response.status === 401) {
        // Thông báo cho TokenService để xử lý token hết hạn
        tokenService.notifyTokenExpired();
        
        return {
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Phiên đăng nhập đã hết hạn, đang tải lại...'
          }
        };
      }
      
      // Parse JSON response với xử lý lỗi stream
      const responseData = await this.parseJsonResponse(response);
      
      // Handle successful response
      if (response.ok) {
        return {
          success: true,
          data: responseData as T
        };
      }
      
      // Handle error response
      return {
        success: false,
        error: {
          message: responseData.message || responseData.error || 'Lỗi không xác định',
          code: responseData.code || `HTTP_${response.status}`
        }
      };
      
    } catch (error: any) {
      // Handle network errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            message: 'Yêu cầu đã bị hủy hoặc hết thời gian chờ',
            code: 'REQUEST_ABORTED'
          }
        };
      }
      
      return {
        success: false,
        error: {
          message: error.message || 'Lỗi kết nối đến máy chủ',
          code: 'NETWORK_ERROR'
        }
      };
    }
  }
  
  // CRUD methods
  
  /**
   * Lấy danh sách items
   */
  protected async getList<T>(
    queryParams?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T[]>> {
    return this.fetchApi<T[]>('GET', '', undefined, queryParams, options);
  }
  
  /**
   * Lấy danh sách items có phân trang
   */
  protected async getPaginated<T>(
    queryParams?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<PaginatedResponse<T>>> {
    return this.fetchApi<PaginatedResponse<T>>('GET', '', undefined, queryParams, options);
  }
  
  /**
   * Lấy chi tiết item theo ID với xử lý lỗi nâng cao
   */
  protected async getById<T>(
    id: string,
    queryParams?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    if (!id) {
      console.error('[API] getById called with empty ID');
      return {
        success: false,
        error: {
          code: 'VAL_003', // ErrorCode.INVALID_PARAMETER
          message: 'ID không được để trống'
        }
      };
    }
    
    // Thêm caching options cho GET requests if not specified
    const enhancedOptions: RequestOptions = {
      ...options,
      cache: options?.cache || 'default'
    };
    
    try {
      const response = await this.fetchApi<T>('GET', `/${id}`, undefined, queryParams, enhancedOptions);
      
      // Kiểm tra nếu không tìm thấy resource
      if (!response.success && response.error?.code === 'HTTP_404') {
        return {
          success: false,
          error: {
            code: 'RES_001', // ErrorCode.RESOURCE_NOT_FOUND
            message: `Không tìm thấy resource với ID: ${id}`
          }
        };
      }
      
      return response;
    } catch (error) {
      console.error(`[API] Error in getById for ID ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'SYS_001', // ErrorCode.INTERNAL_ERROR
          message: error instanceof Error ? error.message : 'Lỗi khi lấy thông tin chi tiết'
        }
      };
    }
  }
  
  /**
   * Create a new resource with enhanced validation and error handling
   */
  protected async create<T, D = any>(
    data: D,
    queryParams?: Record<string, any>,
    options?: RequestOptions & {
      validateFn?: (data: D) => { valid: boolean; errors?: Record<string, string> };
      beforeRequest?: (data: D) => NonNullable<D>;
      afterResponse?: (response: ApiResponse<T>) => ApiResponse<T>;
    }
  ): Promise<ApiResponse<T>> {
    if (!data) {
      console.error('[API] create called with empty data');
      return {
        success: false,
        error: {
          code: 'VAL_001', // Validation error
          message: 'Dữ liệu không được để trống'
        }
      };
    }
    
    // Optional validation function
    if (options?.validateFn) {
      const validation = options.validateFn(data);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'VAL_001', // Validation error
            message: 'Dữ liệu không hợp lệ'
          }
        };
      }
    }
    
    // Optional data transformation before request
    let processedData = data as NonNullable<D>;
    if (options?.beforeRequest) {
      processedData = options.beforeRequest(data);
    }
    
    try {
      // Gọi API để tạo resource mới
      const response = await this.fetchApi<T>('POST', '', processedData as any, queryParams, options);
      
      // Optional response transformation
      if (options?.afterResponse) {
        return options.afterResponse(response);
      }
      
      return response;
    } catch (error) {
      console.error('[API] Error in create:', error);
      return {
        success: false,
        error: {
          code: 'SYS_001', // System error
          message: error instanceof Error ? error.message : 'Lỗi khi tạo resource mới'
        }
      };
    }
  }
  
  /**
   * Cập nhật item theo ID với xử lý lỗi nâng cao
   */
  protected async update<T, D = any>(
    id: string,
    data: D,
    queryParams?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    if (!id) {
      console.error('[API] update called with empty ID');
      return {
        success: false,
        error: {
          code: 'VAL_003', // Invalid parameter
          message: 'ID không được để trống'
        }
      };
    }
    
    if (!data) {
      console.error('[API] update called with empty data');
      return {
        success: false,
        error: {
          code: 'VAL_001', // Validation error
          message: 'Dữ liệu cập nhật không được để trống'
        }
      };
    }
    
    try {
      // Gọi API để cập nhật resource
      return await this.fetchApi<T>('PUT', `/${id}`, data, queryParams, options);
    } catch (error) {
      console.error(`[API] Error in update for ID ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'SYS_001', // System error
          message: error instanceof Error ? error.message : 'Lỗi khi cập nhật resource'
        }
      };
    }
  }
  
  /**
   * Cập nhật một phần item theo ID
   */
  protected async patch<T, D = any>(
    id: string,
    data: D,
    queryParams?: Record<string, any>,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.fetchApi<T>('PATCH', `/${id}`, data, queryParams, options);
  }
  
  /**
   * Xóa item theo ID với xử lý lỗi nâng cao
   */
  protected async delete(
    id: string,
    queryParams?: Record<string, any>,
    options?: RequestOptions & {
      confirmation?: boolean;
    }
  ): Promise<ApiResponse<void>> {
    if (!id) {
      console.error('[API] delete called with empty ID');
      return {
        success: false,
        error: {
          code: 'VAL_003', // Invalid parameter
          message: 'ID không được để trống'
        }
      };
    }
    
    // Kiểm tra xác nhận xóa (nếu được yêu cầu)
    if (options?.confirmation === false) {
      console.warn('[API] delete operation was canceled due to missing confirmation');
      return {
        success: false,
        error: {
          code: 'BUS_002', // Operation not allowed
          message: 'Hành động xóa đã bị hủy do thiếu xác nhận'
        }
      };
    }
    
    try {
      // Gọi API để xóa resource
      const response = await this.fetchApi<void>('DELETE', `/${id}`, undefined, queryParams, options);
      
      // Kiểm tra phản hồi để đảm bảo xóa thành công
      if (response.success) {
        console.log(`[API] Successfully deleted resource with ID: ${id}`);
      } else {
        console.error(`[API] Failed to delete resource with ID: ${id}`, response.error);
      }
      
      return response;
    } catch (error) {
      console.error(`[API] Error in delete for ID ${id}:`, error);
      return {
        success: false,
        error: {
          code: 'SYS_001', // System error
          message: error instanceof Error ? error.message : 'Lỗi khi xóa resource'
        }
      };
    }
  }
} 