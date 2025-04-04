/**
 * @file Error Service
 * @description Xử lý các lỗi và thông báo trong ứng dụng một cách thống nhất
 */

// Định nghĩa interface cho lỗi API
export interface ApiError {
  code?: string;
  message: string;
  details?: any;
}

// Định nghĩa các mã lỗi của ứng dụng
export enum ErrorCode {
  // Lỗi xác thực
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Lỗi quyền truy cập
  FORBIDDEN = 'FORBIDDEN',
  
  // Lỗi dữ liệu
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Lỗi server
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Lỗi mạng
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Lỗi chưa xác định
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Ánh xạ giữa HTTP status code và error code
const statusToErrorCode: Record<number, ErrorCode> = {
  400: ErrorCode.VALIDATION_ERROR,
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  409: ErrorCode.DUPLICATE_ENTRY,
  500: ErrorCode.SERVER_ERROR,
  503: ErrorCode.SERVICE_UNAVAILABLE
};

// Dịch vụ xử lý lỗi
export class ErrorService {
  /**
   * Xử lý lỗi từ API
   * @param error Lỗi từ fetch/axios
   * @returns ApiError object
   */
  static async handleApiError(error: any): Promise<ApiError> {
    console.error('API Error:', error);
    
    // Nếu là lỗi mạng
    if (!window.navigator.onLine || error.name === 'TypeError') {
      return {
        code: ErrorCode.NETWORK_ERROR,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
      };
    }
    
    // Nếu là response từ API với status code lỗi
    if (error.response) {
      let errorResponse;
      
      try {
        // Thử parse body là JSON
        errorResponse = await error.response.json();
      } catch (e) {
        // Nếu không phải JSON, sử dụng status text
        return {
          code: statusToErrorCode[error.response.status] || ErrorCode.UNKNOWN_ERROR,
          message: error.response.statusText || 'Đã có lỗi xảy ra'
        };
      }
      
      // Nếu là error format chuẩn từ API
      if (errorResponse.error) {
        return {
          code: errorResponse.error.code || statusToErrorCode[error.response.status] || ErrorCode.UNKNOWN_ERROR,
          message: errorResponse.error.message || 'Đã có lỗi xảy ra',
          details: errorResponse.error.details
        };
      }
      
      // Nếu không theo format chuẩn
      return {
        code: statusToErrorCode[error.response.status] || ErrorCode.UNKNOWN_ERROR,
        message: errorResponse.message || 'Đã có lỗi xảy ra'
      };
    }
    
    // Lỗi không xác định
    return {
      code: ErrorCode.UNKNOWN_ERROR,
      message: error.message || 'Đã có lỗi không xác định xảy ra'
    };
  }
  
  /**
   * Ghi nhật ký lỗi
   * @param error Lỗi cần ghi nhật ký
   * @param context Ngữ cảnh của lỗi
   */
  static logError(error: any, context: string): void {
    // Thông tin cơ bản
    const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message || 'Unknown error',
      stack: error.stack,
      code: error.code
    };
    
    // Ghi nhật ký vào console
    console.error('Error Logged:', errorInfo);
    
    // TODO: Gửi lỗi đến dịch vụ theo dõi lỗi như Sentry
    // if (process.env.NODE_ENV === 'production') {
    //   captureException(error, { extra: { context } });
    // }
  }
  
  /**
   * Lấy thông báo lỗi người dùng từ mã lỗi
   * @param code Mã lỗi
   * @param defaultMessage Thông báo mặc định
   * @returns Thông báo lỗi dành cho người dùng
   */
  static getUserMessage(code: ErrorCode | string, defaultMessage: string): string {
    const messages: Record<string, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Vui lòng đăng nhập để tiếp tục.',
      [ErrorCode.INVALID_CREDENTIALS]: 'Email hoặc mật khẩu không đúng.',
      [ErrorCode.SESSION_EXPIRED]: 'Phiên làm việc đã hết hạn, vui lòng đăng nhập lại.',
      [ErrorCode.TOKEN_EXPIRED]: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      [ErrorCode.FORBIDDEN]: 'Bạn không có quyền truy cập tài nguyên này.',
      [ErrorCode.NOT_FOUND]: 'Không tìm thấy thông tin yêu cầu.',
      [ErrorCode.VALIDATION_ERROR]: 'Thông tin không hợp lệ, vui lòng kiểm tra lại.',
      [ErrorCode.DUPLICATE_ENTRY]: 'Thông tin đã tồn tại trong hệ thống.',
      [ErrorCode.SERVER_ERROR]: 'Hệ thống đang gặp sự cố, vui lòng thử lại sau.',
      [ErrorCode.SERVICE_UNAVAILABLE]: 'Dịch vụ tạm thời không khả dụng, vui lòng thử lại sau.',
      [ErrorCode.NETWORK_ERROR]: 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng.',
      [ErrorCode.UNKNOWN_ERROR]: 'Đã có lỗi xảy ra, vui lòng thử lại.'
    };
    
    return messages[code] || defaultMessage;
  }
} 