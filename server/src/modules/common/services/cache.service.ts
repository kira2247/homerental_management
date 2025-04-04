import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './logging.service';

type CacheEntry<T> = {
  value: T;
  expiry: number;
};

/**
 * Service quản lý bộ nhớ đệm cho các API endpoint
 * Giúp giảm tải cho database và tăng tốc độ phản hồi
 */
@Injectable()
export class CacheService {
  // In-memory cache map
  private cache: Map<string, CacheEntry<any>> = new Map();
  // Default TTL: 5 phút
  private defaultTtl: number = 5 * 60 * 1000;
  // Flag kiểm soát việc sử dụng cache
  private cacheEnabled: boolean = true;

  constructor(
    private configService: ConfigService,
    private logger: LoggingService,
  ) {
    // Disable cache trong các môi trường phát triển nếu cần
    const disableCache = this.configService.get<string>('DISABLE_CACHE');
    if (disableCache === 'true') {
      this.cacheEnabled = false;
      this.logger.info('Cache đã bị tắt theo cấu hình', 'CacheService');
    }
  }

  /**
   * Lưu giá trị vào cache
   * @param key Khóa lưu trữ
   * @param value Giá trị cần lưu
   * @param ttl Thời gian sống (ms), mặc định 5 phút
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTtl): void {
    if (!this.cacheEnabled) return;
    
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
    this.logger.debug(`Cache: SET ${key}`, 'CacheService');
  }

  /**
   * Lấy giá trị từ cache
   * @param key Khóa cần lấy
   * @returns Giá trị được cache hoặc null nếu không tìm thấy/hết hạn
   */
  get<T>(key: string): T | null {
    if (!this.cacheEnabled) return null;
    
    const entry = this.cache.get(key);
    
    // Nếu không có entry hoặc đã hết hạn
    if (!entry || entry.expiry < Date.now()) {
      if (entry) {
        // Xóa entry đã hết hạn
        this.cache.delete(key);
        this.logger.debug(`Cache: EXPIRED ${key}`, 'CacheService');
      }
      return null;
    }
    
    this.logger.debug(`Cache: HIT ${key}`, 'CacheService');
    return entry.value as T;
  }

  /**
   * Xóa một entry khỏi cache
   * @param key Khóa cần xóa
   */
  delete(key: string): void {
    if (!this.cacheEnabled) return;
    
    this.cache.delete(key);
    this.logger.debug(`Cache: DELETE ${key}`, 'CacheService');
  }

  /**
   * Xóa tất cả các entry có prefix đã chỉ định
   * @param prefix Tiền tố khóa cần xóa
   */
  invalidateByPrefix(prefix: string): void {
    if (!this.cacheEnabled) return;
    
    let count = 0;
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    });
    
    if (count > 0) {
      this.logger.debug(`Cache: INVALIDATED ${count} entries with prefix "${prefix}"`, 'CacheService');
    }
  }

  /**
   * Xóa toàn bộ cache
   */
  clear(): void {
    if (!this.cacheEnabled) return;
    
    const count = this.cache.size;
    this.cache.clear();
    this.logger.debug(`Cache: CLEARED ${count} entries`, 'CacheService');
  }
} 