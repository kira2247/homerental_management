'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

interface DashboardErrorHandlerProps {
  error?: Error | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DashboardErrorHandler({ 
  error, 
  onRetry, 
  children 
}: DashboardErrorHandlerProps) {
  const [authError, setAuthError] = useState<boolean>(false);
  const { t } = useLocale();
  const router = useRouter();
  const { logout, refreshToken } = useAuth();

  // Kiểm tra lỗi có liên quan đến token không
  useEffect(() => {
    if (error) {
      
      
      // Kiểm tra lỗi token hết hạn
      const errorMessage = error.message?.toLowerCase() || '';
      if (
        errorMessage.includes('token') && 
        (errorMessage.includes('expired') || 
         errorMessage.includes('invalid') || 
         errorMessage.includes('unauthorized'))
      ) {
        
        setAuthError(true);
        
        // Thử refresh token một lần
        refreshToken().catch(err => {
          console.error('Failed to refresh token:', err);
        });
      }
    }
  }, [error, refreshToken]);

  // Xử lý sự kiện khi người dùng muốn đăng xuất
  const handleLogout = async () => {
    try {
      // Không cần xóa cookie thủ công vì đã được xử lý trong hàm logout
      await logout();
      // Không cần chuyển hướng vì đã được xử lý trong hàm logout
    } catch (err) {
      console.error('Error during logout:', err);
    }
  };

  // Xử lý sự kiện thử lại (refresh page hoặc gọi lại API)
  const handleRetry = () => {
    if (authError) {
      // Kiểm tra xem có quá nhiều lần thử không
      const retryCount = parseInt(sessionStorage.getItem('dashboard_retry_count') || '0', 10);
      
      if (retryCount >= 3) {
        
        handleLogout();
        return;
      }
      
      // Tăng số lần thử
      sessionStorage.setItem('dashboard_retry_count', (retryCount + 1).toString());
      
      // Nếu là lỗi xác thực, thử làm mới token trước
      refreshToken()
        .then(success => {
          if (success && onRetry) {
            // Token được làm mới thành công, gọi lại API
            setAuthError(false);
            // Reset retry count on success
            sessionStorage.setItem('dashboard_retry_count', '0');
            onRetry();
          } else if (!success) {
            // Token không thể làm mới, chuyển hướng đến trang đăng nhập
            handleLogout();
          }
        })
        .catch(() => {
          // Có lỗi khi làm mới token, chuyển hướng đến trang đăng nhập
          handleLogout();
        });
    } else if (onRetry) {
      // Nếu không phải lỗi xác thực, gọi lại hàm retry
      onRetry();
    }
  };

  // Nếu có lỗi, hiển thị thông báo lỗi
  if (error || authError) {
    return (
      <div className="p-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <div className="font-medium">
            {authError 
              ? t('dashboard.authError')
              : t('dashboard.errorTitle')}
          </div>
          <AlertDescription>
            {authError 
              ? t('dashboard.sessionExpired')
              : error?.message || t('dashboard.unknownError')}
          </AlertDescription>
        </Alert>
        
        <div className="flex space-x-2 mt-4">
          <Button onClick={handleRetry} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
          
          {authError && (
            <Button variant="outline" onClick={handleLogout} className="flex items-center">
              <LogOut className="h-4 w-4 mr-2" />
              {t('auth.logout')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Nếu không có lỗi, hiển thị nội dung bình thường
  return <>{children}</>;
} 