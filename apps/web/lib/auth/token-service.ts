/**
 * Token Service - Quản lý token xác thực tập trung
 */
import { jwtDecode } from 'jwt-decode';
import { authLogger } from '@/lib/utils/logging';

// Định nghĩa interface cho token payload
export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
  iat: number;
}

export class TokenService {
  private static instance: TokenService;
  private tokenExpiredListeners: (() => void)[] = [];
  private refreshingPromise: Promise<boolean> | null = null;
  private lastRefreshAttempt = 0;
  private refreshAttemptCount = 0;
  private readonly MAX_REFRESH_ATTEMPTS = 3;
  private readonly REFRESH_COOLDOWN = 10000; // 10 seconds

  private constructor() {}

  // Singleton pattern
  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  // Thêm listener cho sự kiện token hết hạn
  public addTokenExpiredListener(listener: () => void): () => void {
    this.tokenExpiredListeners.push(listener);
    
    // Return function to remove the listener
    return () => {
      this.tokenExpiredListeners = this.tokenExpiredListeners.filter(l => l !== listener);
    };
  }

  // Kích hoạt sự kiện token hết hạn
  public notifyTokenExpired(): void {
    // Đếm số lần thông báo
    const currentTime = Date.now();
    if (currentTime - this.lastRefreshAttempt < this.REFRESH_COOLDOWN) {
      this.refreshAttemptCount++;
    } else {
      this.refreshAttemptCount = 1;
    }
    this.lastRefreshAttempt = currentTime;
    
    // Nếu quá số lần thử, xóa token và chuyển hướng đến trang đăng nhập
    if (this.refreshAttemptCount > this.MAX_REFRESH_ATTEMPTS) {
      this.clearTokens();
      this.redirectToLogin();
      return;
    }
    
    // Thông báo cho tất cả listeners
    for (const listener of this.tokenExpiredListeners) {
      listener();
    }
  }

  // Làm mới token
  public async refreshToken(): Promise<boolean> {
    // Nếu đang refresh, trả về promise hiện tại
    if (this.refreshingPromise) {
      return this.refreshingPromise;
    }
    
    try {
      this.refreshingPromise = this.doRefreshToken();
      return await this.refreshingPromise;
    } finally {
      this.refreshingPromise = null;
    }
  }

  // Thực hiện làm mới token
  private async doRefreshToken(): Promise<boolean> {
    try {
      // Kiểm tra nếu đang ở trang xác thực
      if (this.isAuthPage()) {
        return false;
      }
      
      // Gọi API làm mới token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
        credentials: 'same-origin',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Nếu không thành công, return false
      if (!response.ok) {
        authLogger.error('Failed to refresh token, status:', response.status);
        return false;
      }
      
      // Parse response data
      const data = await response.json();
      return data.success;
    } catch (err) {
      authLogger.error('Error refreshing token:', err);
      return false;
    }
  }

  // Kiểm tra token có hết hạn không
  public isTokenExpired(token?: string): boolean {
    try {
      const tokenToCheck = token || this.getAuthToken();
      if (!tokenToCheck) return true;
      
      const decoded = jwtDecode<TokenPayload>(tokenToCheck);
      const currentTime = Date.now() / 1000;
      
      // Token hết hạn trước thời điểm hiện tại + 5 phút buffer
      return decoded.exp <= currentTime + 300; // 300 seconds = 5 minutes
    } catch (error) {
      return true;
    }
  }

  // Lấy auth token từ cookie
  public getAuthToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    if (!tokenCookie) return null;
    
    return tokenCookie.split('=')[1];
  }

  // Lấy refresh token từ cookie
  public getRefreshToken(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('refresh_token='));
    if (!tokenCookie) return null;
    
    return tokenCookie.split('=')[1];
  }

  // Xóa tất cả tokens
  public clearTokens(): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; secure';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; secure';
  }

  // Kiểm tra nếu đang ở trang xác thực
  private isAuthPage(): boolean {
    if (typeof window === 'undefined') return false;
    
    const pathname = window.location.pathname;
    authLogger.debug('Checking isAuthPage, pathname:', pathname);
    
    // Tách đường dẫn thành các phần để kiểm tra chính xác hơn
    const pathParts = pathname.split('/').filter(Boolean);
    
    // Nếu không có ít nhất 2 phần (locale và route), không phải auth page
    if (pathParts.length < 2) return false;
    
    // Phần thứ hai sau locale là route thực tế
    const route = pathParts[1];
    const isAuth = route === 'login' || route === 'register' || route === 'forgot-password';
    
    authLogger.debug('Route part:', route, 'isAuth:', isAuth);
    return isAuth;
  }

  // Chuyển hướng đến trang đăng nhập
  private redirectToLogin(): void {
    if (typeof window === 'undefined') return;
    
    const locale = window.location.pathname.split('/')[1] || 'vi';
    window.location.href = `/${locale}/login?error=session_expired`;
  }
}

// Export một instance sẵn có để sử dụng
export const tokenService = TokenService.getInstance(); 