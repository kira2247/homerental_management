/**
 * Auth API Service - Quản lý các API liên quan đến xác thực
 */

import { BaseApiService } from './base-api-service';
import { ApiResponse } from '@/lib/types/api-types';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  token?: string;
  expiresIn?: number;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// AuthApiService class
class AuthApiService extends BaseApiService {
  constructor() {
    super('auth');
  }
  
  /**
   * Đăng nhập
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    
    try {
      const response = await this.create<AuthResponse, LoginCredentials>(credentials, {}, {
        headers: {
          'X-Auth-Token-Request': '1' // Flag để xác định request yêu cầu token auth
        }
      });
      
      
      return response;
    } catch (error) {
      console.error('AuthApiService: Login API error:', error);
      throw error;
    }
  }
  
  /**
   * Đăng ký
   */
  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.create<AuthResponse, RegisterCredentials>(credentials, {}, {
      headers: {
        'X-Auth-Token-Request': '1'
      }
    });
  }
  
  /**
   * Đăng xuất
   */
  async logout(): Promise<ApiResponse<void>> {
    return this.create<void>({}, {}, {
      headers: {
        'X-Auth-Token-Revoke': '1'
      }
    });
  }
  
  /**
   * Lấy thông tin người dùng đang đăng nhập
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.getById<User>('me');
  }
  
  /**
   * Làm mới token
   */
  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    return this.create<AuthResponse>({}, {}, {
      headers: {
        'X-Auth-Token-Refresh': '1'
      }
    });
  }
  
  /**
   * Yêu cầu đặt lại mật khẩu
   */
  async forgotPassword(email: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.create<{ success: boolean }>({ email }, {}, {
      headers: {
        'X-Auth-Action': 'forgot-password'
      }
    });
  }
  
  /**
   * Đặt lại mật khẩu
   */
  async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<{ success: boolean }>> {
    return this.create<{ success: boolean }, ResetPasswordRequest>(data, {}, {
      headers: {
        'X-Auth-Action': 'reset-password'
      }
    });
  }
  
  /**
   * Thay đổi mật khẩu
   */
  async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ success: boolean }>> {
    return this.create<{ success: boolean }, ChangePasswordRequest>(data, {}, {
      headers: {
        'X-Auth-Action': 'change-password'
      }
    });
  }
  
  /**
   * Xác minh email
   */
  async verifyEmail(data: VerifyEmailRequest): Promise<ApiResponse<{ success: boolean }>> {
    return this.create<{ success: boolean }, VerifyEmailRequest>(data, {}, {
      headers: {
        'X-Auth-Action': 'verify-email'
      }
    });
  }
  
  /**
   * Gửi lại email xác minh
   */
  async resendVerificationEmail(email: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.create<{ success: boolean }>({ email }, {}, {
      headers: {
        'X-Auth-Action': 'resend-verification'
      }
    });
  }
}

// Export singleton instance
export const authApiService = new AuthApiService(); 


