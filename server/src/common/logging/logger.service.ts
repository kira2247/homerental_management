import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Logger Service - Dịch vụ logging tập trung cho server
 * Cung cấp các phương thức để ghi log với các cấp độ khác nhau
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private context: string;
  
  constructor(context?: string) {
    this.context = context || 'Application';
  }
  
  /**
   * Tạo một instance logger mới với context cụ thể
   */
  static forContext(context: string): LoggerService {
    return new LoggerService(context);
  }
  
  /**
   * Format message với timestamp và context
   */
  private formatMessage(message: any, context?: string): string {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context;
    return `[${timestamp}] [${ctx}] ${message}`;
  }
  
  /**
   * Log message ở cấp độ debug
   */
  debug(message: any, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(message, context));
    }
  }
  
  /**
   * Log message ở cấp độ verbose
   */
  verbose(message: any, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this.formatMessage(`[VERBOSE] ${message}`, context));
    }
  }
  
  /**
   * Log message ở cấp độ log
   */
  log(message: any, context?: string): void {
    console.log(this.formatMessage(message, context));
  }
  
  /**
   * Log message ở cấp độ warning
   */
  warn(message: any, context?: string): void {
    console.warn(this.formatMessage(`[WARN] ${message}`, context));
  }
  
  /**
   * Log message ở cấp độ error
   */
  error(message: any, trace?: string, context?: string): void {
    console.error(this.formatMessage(`[ERROR] ${message}`, context));
    if (trace) {
      console.error(trace);
    }
  }
}

// Tạo các logger cho các module chính
export const propertyLogger = LoggerService.forContext('PropertyService');
export const authLogger = LoggerService.forContext('AuthService');
export const userLogger = LoggerService.forContext('UserService');
export const financialLogger = LoggerService.forContext('FinancialService');
export const appLogger = LoggerService.forContext('Application');

// Export logger mặc định
export default new LoggerService();
