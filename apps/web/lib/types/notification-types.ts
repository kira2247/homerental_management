/**
 * Notification Types
 * Các types liên quan đến hệ thống thông báo và alerts
 */

/**
 * Loại thông báo
 */
export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

/**
 * Nguồn thông báo
 */
export enum NotificationSource {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  PROPERTY = 'PROPERTY',
  TENANT = 'TENANT',
  PAYMENT = 'PAYMENT',
  MAINTENANCE = 'MAINTENANCE',
  CONTRACT = 'CONTRACT'
}

/**
 * Mức độ ưu tiên của thông báo
 */
export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Trạng thái thông báo
 */
export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Notification model
 */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  source: NotificationSource;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  link?: string;
  image?: string;
  recipientId: string;
  senderId?: string;
  metadata?: Record<string, any>;
}

/**
 * Thông tin người nhận thông báo
 */
export interface NotificationRecipient {
  id: string;
  userId: string;
  notificationId: string;
  status: NotificationStatus;
  readAt?: Date;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sms: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
  sources: {
    [key in NotificationSource]?: boolean;
  };
  doNotDisturb?: {
    enabled: boolean;
    startTime?: string; // HH:MM format
    endTime?: string; // HH:MM format
    timezone?: string;
  };
}

/**
 * Notification filter options
 */
export interface NotificationFilterOptions {
  status?: NotificationStatus;
  type?: NotificationType;
  source?: NotificationSource;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

/**
 * Notification create options
 */
export interface CreateNotificationOptions {
  title: string;
  message: string;
  type: NotificationType;
  source: NotificationSource;
  priority?: NotificationPriority;
  recipientIds: string[];
  link?: string;
  image?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Notification update options
 */
export interface UpdateNotificationOptions {
  id: string;
  status?: NotificationStatus;
  readAt?: Date;
}

/**
 * Notification counter
 */
export interface NotificationCount {
  total: number;
  unread: number;
  priority: {
    high: number;
    urgent: number;
  };
}

// Types for backward compatibility
export type NotificationDto = Notification;
export type NotificationRecipientDto = NotificationRecipient;
export type NotificationPreferencesDto = NotificationPreferences;
export type NotificationFilterOptionsDto = NotificationFilterOptions;
export type CreateNotificationOptionsDto = CreateNotificationOptions;
export type UpdateNotificationOptionsDto = UpdateNotificationOptions;
export type NotificationCountDto = NotificationCount;
