import { Module } from '@nestjs/common';
import { LoggingService } from './services/logging.service';
import { CacheService } from './services/cache.service';

/**
 * Module chung cung cấp các service dùng chung cho toàn bộ ứng dụng
 */
@Module({
  providers: [
    LoggingService,
    CacheService,
  ],
  exports: [
    LoggingService,
    CacheService,
  ],
})
export class CommonModule {} 