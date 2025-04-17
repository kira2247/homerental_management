/**
 * Authentication Types
 * Các types liên quan đến xác thực và phân quyền
 */

/**
 * Roles for authorization
 */
export enum Role {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  TENANT = 'TENANT',
  GUEST = 'GUEST'
}

/**
 * User base information
 */
export interface UserBase {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
}

/**
 * User with authentication details
 */
export interface User extends UserBase {
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  preferences?: UserPreferences;
}

/**
 * User preferences for application settings
 */
export interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  currency?: string;
  notifications?: NotificationPreferences;
  dashboard?: DashboardPreferences;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
  categories: {
    payments: boolean;
    maintenance: boolean;
    leases: boolean;
    announcements: boolean;
  };
}

/**
 * Dashboard display preferences
 */
export interface DashboardPreferences {
  defaultView: 'summary' | 'financial' | 'properties';
  widgets: string[];
  widgetLayout?: Record<string, any>;
}

/**
 * Authentication token payload
 */
export interface TokenPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: Role;
  iat: number; // issued at
  exp: number; // expiration
}

/**
 * Authentication tokens response
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data
 */
export interface RegistrationData {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  role?: Role;
  acceptTerms: boolean;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  token: string;
  newPassword: string;
}

/**
 * Password change
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Auth state for client-side context
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isLoggingOut: boolean;
  error: string | null;
}

// Alias types for backward compatibility
export type UserDto = User;
export type AuthTokensDto = AuthTokens;
export type LoginCredentialsDto = LoginCredentials;
export type RegistrationDataDto = RegistrationData;
