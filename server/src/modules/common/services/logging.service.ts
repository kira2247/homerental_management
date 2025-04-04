import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service quản lý logging cho toàn bộ ứng dụng
 * Giúp kiểm soát mức độ ghi log trong các môi trường khác nhau
 */
@Injectable()
export class LoggingService {
  private isDevelopment: boolean;

  constructor(private configService: ConfigService) {
    this.isDevelopment = this.configService.get('NODE_ENV') !== 'production';
  }

  /**
   * Log lỗi nghiêm trọng - luôn ghi log trong mọi môi trường
   * @param message Thông điệp lỗi
   * @param context Ngữ cảnh (tên module, service...)
   * @param error Object lỗi hoặc thông tin bổ sung
   */
  error(message: string, context?: string, error?: any): void {
    // Sử dụng một hệ thống logging thay thế
    // Ví dụ: winston, pino, hoặc một service ghi log tùy chỉnh
    this.logToSystem('error', message, context, error);
  }

  /**
   * Log cảnh báo - luôn ghi log trong mọi môi trường
   * @param message Thông điệp cảnh báo
   * @param context Ngữ cảnh
   */
  warn(message: string, context?: string): void {
    this.logToSystem('warn', message, context);
  }

  /**
   * Log thông tin - chỉ ghi log trong môi trường development
   * @param message Thông điệp
   * @param context Ngữ cảnh
   */
  info(message: string, context?: string): void {
    if (this.isDevelopment) {
      this.logToSystem('info', message, context);
    }
  }

  /**
   * Log gỡ lỗi - chỉ ghi log trong môi trường development
   * @param message Thông điệp
   * @param context Ngữ cảnh
   * @param data Dữ liệu bổ sung
   */
  debug(message: string, context?: string, data?: any): void {
    if (this.isDevelopment) {
      this.logToSystem('debug', message, context, data);
    }
  }

  /**
   * Hàm trung gian để ghi log
   * Có thể được mở rộng để tích hợp với hệ thống logging khác
   */
  private logToSystem(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: string, data?: any): void {
    // Đây là nơi để tích hợp với hệ thống logging tùy chỉnh như winston hoặc pino
    // Trong tương lai, có thể thêm logic để ghi log vào file, gửi đến dịch vụ giám sát, v.v.
    
    // Ví dụ tích hợp winston:
    // this.logger.log({ level, message, context, data });
  }
} 