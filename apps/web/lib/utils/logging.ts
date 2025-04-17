/**
 * Logging Service
 * Cung cấp các utility functions để log thông tin, cảnh báo và lỗi
 * Chỉ hiển thị logs trong môi trường development
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4 // Sử dụng để tắt logging
}

// Định nghĩa interface cho cấu hình logger
interface LoggerConfig {
  level: LogLevel;
  enabledNamespaces: string[];
  disabledNamespaces: string[];
}

// Cấu hình mặc định
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
  enabledNamespaces: ['*'], // Mặc định cho phép tất cả namespaces
  disabledNamespaces: [] // Không có namespace nào bị tắt
};

// Cấu hình hiện tại
let config: LoggerConfig = { ...DEFAULT_CONFIG };

// Màu sắc cho các log levels khác nhau
const COLORS = {
  [LogLevel.DEBUG]: '\x1b[36m', // Cyan
  [LogLevel.INFO]: '\x1b[32m',  // Green
  [LogLevel.WARN]: '\x1b[33m',  // Yellow
  [LogLevel.ERROR]: '\x1b[31m', // Red
  reset: '\x1b[0m'
};

// Tên các log levels
const LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.NONE]: 'NONE'
};

/**
 * Kiểm tra xem một namespace có được cho phép log hay không
 */
function isNamespaceEnabled(namespace: string): boolean {
  // Nếu namespace nằm trong danh sách disabled, không cho phép
  if (config.disabledNamespaces.includes(namespace)) {
    return false;
  }
  
  // Nếu danh sách enabled có '*', cho phép tất cả
  if (config.enabledNamespaces.includes('*')) {
    return true;
  }
  
  // Kiểm tra từng namespace cụ thể
  return config.enabledNamespaces.some(enabled => {
    // Hỗ trợ wildcard ở cuối, ví dụ: 'api:*'
    if (enabled.endsWith('*')) {
      const prefix = enabled.slice(0, -1);
      return namespace.startsWith(prefix);
    }
    return namespace === enabled;
  });
}

/**
 * Tạo một logger với namespace cụ thể
 */
export function createLogger(namespace: string) {
  return {
    debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, namespace, message, ...args),
    info: (message: string, ...args: any[]) => log(LogLevel.INFO, namespace, message, ...args),
    warn: (message: string, ...args: any[]) => log(LogLevel.WARN, namespace, message, ...args),
    error: (message: string, ...args: any[]) => log(LogLevel.ERROR, namespace, message, ...args)
  };
}

/**
 * Hàm log chính
 * @param level Mức độ log
 * @param namespace Namespace của log
 * @param message Nội dung log
 * @param args Arguments bổ sung cho log message
 */
function log(level: LogLevel, namespace: string, message: string, ...args: any[]): void {
  // Check if logging level is enabled
  if (level < config.level) {
    return;
  }

  // Check if namespace is enabled
  if (!isNamespaceEnabled(namespace)) {
    return;
  }

  // Format timestamp
  const timestamp = new Date().toISOString();
  
  // Format log message
  const logPrefix = `[${timestamp}] [${LEVEL_NAMES[level]}] [${namespace}]`;
  
  // Sử dụng console method tương ứng
  switch (level) {
    case LogLevel.DEBUG:
      if (typeof window !== 'undefined' && window.console) {
        console.debug(`${COLORS[LogLevel.DEBUG]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      } else if (typeof process !== 'undefined') {
        console.debug(`${COLORS[LogLevel.DEBUG]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      }
      break;
    case LogLevel.INFO:
      if (typeof window !== 'undefined' && window.console) {
        console.log(`${COLORS[LogLevel.INFO]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      } else if (typeof process !== 'undefined') {
        console.log(`${COLORS[LogLevel.INFO]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      }
      break;
    case LogLevel.WARN:
      if (typeof window !== 'undefined' && window.console) {
        console.warn(`${COLORS[LogLevel.WARN]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      } else if (typeof process !== 'undefined') {
        console.warn(`${COLORS[LogLevel.WARN]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      }
      break;
    case LogLevel.ERROR:
      if (typeof window !== 'undefined' && window.console) {
        console.error(`${COLORS[LogLevel.ERROR]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      } else if (typeof process !== 'undefined') {
        console.error(`${COLORS[LogLevel.ERROR]}${logPrefix}${COLORS.reset} ${message}`, ...args);
      }
      break;
  }
}

/**
 * Cấu hình logger
 */
export function configureLogger(options: Partial<LoggerConfig>) {
  config = {
    ...config,
    ...(options as LoggerConfig)
  };
}

/**
 * Reset cấu hình logger về mặc định
 */
export function resetLoggerConfig() {
  config = { ...DEFAULT_CONFIG };
}

// Pre-defined loggers
export const apiLogger = createLogger('api');
export const uiLogger = createLogger('ui');
export const authLogger = createLogger('auth');
export const propertyLogger = createLogger('property');
export const propertyDeleteLogger = createLogger('property:delete'); // Logger chuyên dụng cho việc xóa property
export const tenantLogger = createLogger('tenant');
export const documentLogger = createLogger('document');
export const paymentLogger = createLogger('payment');
export const financialLogger = createLogger('financial');

// Export logger mặc định
export default createLogger('app');
