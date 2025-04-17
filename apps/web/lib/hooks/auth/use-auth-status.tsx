import { useContext, createContext, useState, useMemo, useCallback, ReactNode, useEffect } from 'react';
import { User } from '@/lib/types';

interface AuthStatusContextType {
  isLoggingOut: boolean;
  isAuthenticated: boolean;
  user: User | null;
  setLoggingOut: (status: boolean) => void;
  checkIsLoggingOut: () => boolean;
  setUser: (user: User | null) => void;
}

// Đảm bảo context được khởi tạo chính xác
const AuthStatusContext = createContext<AuthStatusContextType>({
  isLoggingOut: false,
  isAuthenticated: false,
  user: null,
  setLoggingOut: () => {},
  checkIsLoggingOut: () => false,
  setUser: () => {}
});

// Thêm key toàn cục để tương thích với code cũ
export const GLOBAL_LOGOUT_KEY = '__isUserLoggingOut__';

export function AuthStatusProvider({ children }: { children: ReactNode }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Đảm bảo đồng bộ state khi mount component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentStatus = !!(window as any)[GLOBAL_LOGOUT_KEY];
      if (currentStatus !== isLoggingOut) {
        setIsLoggingOut(currentStatus);
      }
    }
  }, []);
  
  const setLoggingOut = useCallback((status: boolean) => {
    setIsLoggingOut(status);
    
    // Cập nhật cả biến global để tương thích với mã cũ
    if (typeof window !== 'undefined') {
      (window as any)[GLOBAL_LOGOUT_KEY] = status;
    }
  }, []);
  
  // Thêm helper function để kiểm tra trạng thái đăng xuất từ bất kỳ đâu
  const checkIsLoggingOut = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as any)[GLOBAL_LOGOUT_KEY] || isLoggingOut;
  }, [isLoggingOut]);
  
  const isAuthenticated = useMemo(() => {
    return user !== null;
  }, [user]);
  
  const value = useMemo(() => ({
    isLoggingOut,
    isAuthenticated,
    user,
    setLoggingOut,
    checkIsLoggingOut,
    setUser
  }), [isLoggingOut, setLoggingOut, checkIsLoggingOut, isAuthenticated, user, setUser]);
  
  return (
    <AuthStatusContext.Provider value={value}>
      {children}
    </AuthStatusContext.Provider>
  );
}

export function useAuthStatus() {
  const context = useContext(AuthStatusContext);
  return context;
}

// Hàm tiện ích để các module khác có thể sử dụng mà không cần hook
export function isUserLoggingOut(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window as any)[GLOBAL_LOGOUT_KEY];
}