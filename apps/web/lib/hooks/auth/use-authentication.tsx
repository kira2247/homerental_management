import { useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useAuthStatus } from './use-auth-status';
import { tokenService } from '@/lib/auth/token-service';

/**
 * Hook tập trung cho việc quản lý xác thực, kết hợp thông tin người dùng và trạng thái đăng xuất
 */
export function useAuthentication() {
  const auth = useAuth();
  const authStatus = useAuthStatus();
  
  // Hàm đăng xuất mở rộng
  const logout = useCallback(async () => {
    // Cập nhật trạng thái đăng xuất
    authStatus.setLoggingOut(true);
    
    try {
      // Gọi hàm logout từ Auth Context
      await auth.logout();
    } finally {
      // Đảm bảo đặt lại trạng thái trong trường hợp xảy ra lỗi
      authStatus.setLoggingOut(false);
    }
  }, [auth, authStatus]);
  
  // Kiểm tra token có hết hạn không
  const isTokenExpired = useCallback(() => {
    return tokenService.isTokenExpired();
  }, []);
  
  // Làm mới token
  const refreshToken = useCallback(async () => {
    return await auth.refreshToken();
  }, [auth]);
  
  return {
    // Thông tin người dùng từ Auth Context
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
    
    // Trạng thái đăng xuất từ AuthStatus
    isLoggingOut: authStatus.isLoggingOut,
    
    // Các phương thức xác thực
    login: auth.login,
    register: auth.register,
    logout,
    updateUser: auth.updateUser,
    clearError: auth.clearError,
    
    // Các phương thức token
    isTokenExpired,
    refreshToken,
    
    // Truy cập TokenService
    tokenService
  };
} 