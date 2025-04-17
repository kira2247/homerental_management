'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { tokenService, TokenPayload } from './token-service';
import { useAuthStatus } from '@/lib/hooks/auth';
import { authLogger } from '@/lib/utils/logging';

// User type definition
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Login information interface
interface LoginCredentials {
  email: string;
  password: string;
}

// Registration information interface
interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// User update data interface
interface UpdateUserData {
  name: string;
  email: string;
}

// Auth Context type definition
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isLoggingOut: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: UpdateUserData) => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use Auth Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const { isLoggingOut, setLoggingOut } = useAuthStatus();

  // Clear error
  const clearError = () => setError(null);
  
  // Hàm làm mới token sử dụng TokenService
  const refreshToken = async (): Promise<boolean> => {
    try {
      // Kiểm tra nếu đang trong quá trình refresh
      if (isRefreshingToken) {
        return false;
      }
      
      // Nếu đang logout, không refresh
      if (isLoggingOut) {
        return false;
      }
      
      // Đánh dấu đang refresh
      setIsRefreshingToken(true);
      
      // Sử dụng TokenService để refresh
      const success = await tokenService.refreshToken();
      
      // Nếu thành công, cập nhật user từ API
      if (success) {
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate',
              'Pragma': 'no-cache'
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUser(data.user);
            }
          }
        } catch (error) {
          authLogger.error('Error fetching user data after token refresh:', error);
        }
      }
      
      return success;
    } catch (err) {
      authLogger.error('Error during refreshToken:', err);
      return false;
    } finally {
      setIsRefreshingToken(false);
    }
  };

  // Check if the user is logged in
  useEffect(() => {
    let isMounted = true; // Biến theo dõi component mount/unmount
    
    const checkAuthStatus = async () => {
      try {
        if (isMounted) setIsLoading(true);
        
        authLogger.debug('Bắt đầu kiểm tra trạng thái xác thực...');
        
        // Kiểm tra xem đường dẫn hiện tại có phải là public route không 
        // (đặc biệt là trang login/register)
        const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
        authLogger.debug('Current pathname:', pathname);
        
        const isAuthPage = pathname.includes('/login') || 
                          pathname.includes('/register') ||
                          pathname.includes('/forgot-password');
        
        authLogger.debug('isAuthPage:', isAuthPage);
        
        // Nếu đang ở trang xác thực (login, register, forgot-password),
        // không cần gọi API kiểm tra xác thực - điều này sẽ luôn trả về 401
        if (isAuthPage) {
          authLogger.debug('Đang ở trang xác thực, bỏ qua kiểm tra API');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Thiết lập timeout để tránh treo ứng dụng nếu API không phản hồi
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000); // Tăng timeout lên 7s
        
        // Trực tiếp gọi API kiểm tra xác thực. Cookie sẽ được trình duyệt tự động gửi.
        authLogger.debug('Gọi API /api/auth/me để xác thực...');
        try {
          const headers: HeadersInit = {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache'
          };
          
          // Thêm header để chỉ định đây là kiểm tra im lặng nếu đang ở trang xác thực
          if (isAuthPage) {
            headers['X-Silent-Auth-Check'] = '1';
          }
          
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers,
            credentials: 'include', // Quan trọng: Đảm bảo cookie được gửi
            signal: controller.signal // Kết nối signal để có thể hủy yêu cầu
          });
          
          clearTimeout(timeoutId); // Xóa timeout khi có phản hồi
          
          // Giảm log nếu đang ở trang xác thực và API trả về 401 (điều này là bình thường)
          if (!(isAuthPage && response.status === 401)) {
            authLogger.debug('Phản hồi từ /api/auth/me - Status:', response.status, response.statusText);
          }
          
          if (response.ok) {
            const data = await response.json();
            authLogger.debug('Dữ liệu phản hồi từ /api/auth/me:', data);
            
            if (data.success && data.user) {
              authLogger.info('Xác thực thành công, cập nhật state user:', data.user);
              if (isMounted) setUser(data.user);
            } else {
              // API trả về 200 nhưng không thành công hoặc không có user
              authLogger.warn('Phản hồi API OK nhưng không hợp lệ, đặt user = null');
              if (isMounted) setUser(null);
              // Có thể xem xét việc thử refresh token ở đây nếu muốn
            }
          } else {
            // Phản hồi không OK (ví dụ: 401 Unauthorized, 500 Server Error)
            // Chỉ log chi tiết nếu không phải ở trang xác thực hoặc lỗi khác 401
            if (!(isAuthPage && response.status === 401)) {
              authLogger.warn(`Phản hồi API không thành công (${response.status}), đặt user = null`);
            }
            
            if (isMounted) setUser(null);
            
            // Xử lý cụ thể cho lỗi 401 (Unauthorized)
            if (response.status === 401 && !isAuthPage) {
              authLogger.warn('Lỗi 401 - Có thể token hết hạn hoặc không hợp lệ. Thử làm mới token...');
              // Tự động thử làm mới token - chỉ khi không phải ở trang xác thực
              const refreshed = await refreshToken();
              if (refreshed) {
                 authLogger.info('Làm mới token thành công. Sẽ thử lại checkAuthStatus...');
                 // Không cần làm gì thêm ở đây, useEffect với dependency [] sẽ không chạy lại
                 // Nhưng lần tải trang tiếp theo hoặc component khác dùng useAuth sẽ có user mới
                 // Hoặc có thể gọi lại checkAuthStatus một cách có kiểm soát nếu cần cập nhật ngay
              } else if (!isAuthPage) {
                 authLogger.error('Làm mới token thất bại.');
                 // Có thể gọi logout ở đây nếu muốn ép đăng xuất hoàn toàn
                 // await logout();
              }
            }
          }
        } catch (fetchErr) {
          // Chỉ log chi tiết nếu không phải ở trang xác thực
          if (!isAuthPage) {
            console.error('❌ [AuthContext] Lỗi khi gọi API /api/auth/me:', fetchErr);
            if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
              console.error('⏱️ [AuthContext] Yêu cầu /api/auth/me bị timeout.');
            }
          }
          if (isMounted) setUser(null);
        }
      } catch (err) {
        // Chỉ log chi tiết nếu không phải ở trang xác thực
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          console.error('❌ [AuthContext] Lỗi tổng thể khi kiểm tra trạng thái xác thực:', err);
        }
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) {
          // Cần đảm bảo user state đã được cập nhật trước khi log ở đây
          // Log này có thể hiển thị giá trị cũ của user do state update là bất đồng bộ
          const isAuthPage = typeof window !== 'undefined' && 
            (window.location.pathname.includes('/login') || 
             window.location.pathname.includes('/register'));
          
          if (!isAuthPage) {
            authLogger.debug('Kết thúc kiểm tra xác thực, đặt isLoading = false.');
          }
          setIsLoading(false);
        }
      }
    };

    checkAuthStatus();
    
    // Dọn dẹp khi component unmount
    return () => {
      isMounted = false;
    };
  }, []); // Chỉ chạy một lần khi component mount

  // Thêm lắng nghe sự kiện token expired từ TokenService
  useEffect(() => {
    // Xử lý khi token hết hạn
    const handleTokenExpired = async () => {
      // Kiểm tra nếu đang refresh hoặc đã đăng xuất
      if (isRefreshingToken || isLoggingOut) {
        return;
      }
      
      // Thực hiện refresh token
      const success = await refreshToken();
      if (!success) {
        // Nếu refresh thất bại, logout
        await logout();
      }
    };
    
    // Đăng ký listener với TokenService
    const removeListener = tokenService.addTokenExpiredListener(handleTokenExpired);
    
    // Cleanup listener khi component unmount
    return () => {
      removeListener();
    };
  }, [isRefreshingToken, isLoggingOut]);

  // Login
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || 'Login failed';
        throw new Error(errorMessage);
      }

      if (data.success) {
        setUser(data.data.user);
        // Lấy locale từ pathname hiện tại
        const currentPathnameParts = window.location.pathname.split('/');
        const locale = currentPathnameParts.length > 1 ? currentPathnameParts[1] : 'vi';
        
        // Chuyển hướng sử dụng window.location để reload trang
        window.location.href = `/${locale}/dashboard`;
      }
    } catch (err) {
      authLogger.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register
  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      if (data.success) {
        setUser(data.data.user);
      }
    } catch (err) {
      authLogger.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data
  const updateUser = async (data: UpdateUserData) => {
    try {
      setIsLoading(true);
      clearError();

      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'Failed to update user data');
      }

      if (responseData.success) {
        setUser(responseData.data.user);
      }
    } catch (err) {
      authLogger.error('Error updating user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoggingOut(true);
      setIsLoading(true);
      
      // Xóa cookies ngay lập tức
      tokenService.clearTokens();
      
      // Luôn xóa user state trước
      setUser(null);
      
      // Sau đó mới gọi API để thông báo cho server
      try {
        // Thiết lập timeout nếu API không phản hồi
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        await fetch('/api/auth/logout', {
          method: 'POST',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
      } catch (error) {
        authLogger.error('Error calling logout API:', error);
        // Không cần xử lý vì đã xóa cookie và user state rồi
      } finally {
        // Đảm bảo chuyển hướng dù API có lỗi hay không
        const locale = window.location.pathname.split('/')[1] || 'vi';
        // Sử dụng window.location thay vì router để buộc tải lại hoàn toàn trang
        window.location.href = `/${locale}/login`;
      }
    } catch (error) {
      authLogger.error('Logout error:', error);
      
      // Đảm bảo user được đăng xuất dù có lỗi nghiêm trọng
      setUser(null);
      const locale = window.location.pathname.split('/')[1] || 'vi';
      window.location.href = `/${locale}/login`;
    } finally {
      setIsLoading(false);
      // Không đặt lại isLoggingOut ở đây vì trang sẽ được load lại
      // Việc đặt lại biến này sẽ được thực hiện trong quá trình tải trang mới
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        isLoggingOut,
        login,
        register,
        logout,
        updateUser,
        clearError,
        refreshToken
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 