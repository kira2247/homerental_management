import { LoggerService } from './logger.service';

/**
 * Mail Logger - Dịch vụ logging dành riêng cho module Mail
 */
export const mailLogger = LoggerService.forContext('MailService');
