import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiLogger } from '@/lib/utils/logging';

// Sử dụng Map để lưu trữ thông tin rate limiting
// Key là IP, value là thời gian yêu cầu gần nhất
const rateLimitMap = new Map<string, { count: number, lastRequest: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 phút
const MAX_REQUESTS = 30; // Tăng lên 30 request/phút
const REQUEST_TIMEOUT = 15000; // Tăng timeout lên 15 giây

export async function POST(request: NextRequest) { 
  try {
    // Kiểm tra nếu đây là kiểm tra xác thực im lặng
    const isSilentCheck = request.headers.get('X-Silent-Auth-Check') === '1';
    
    // Lấy IP của client để rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Kiểm tra rate limit
    const now = Date.now();
    const rateLimitInfo = rateLimitMap.get(ip) || { count: 0, lastRequest: now - RATE_LIMIT_WINDOW };
    
    // Reset counter nếu đã quá thời gian window
    if (now - rateLimitInfo.lastRequest > RATE_LIMIT_WINDOW) {
      rateLimitInfo.count = 0;
      rateLimitInfo.lastRequest = now;
    }
    
    // Tăng counter và kiểm tra rate limit
    rateLimitInfo.count++;
    rateLimitMap.set(ip, rateLimitInfo);
    
    if (rateLimitInfo.count > MAX_REQUESTS) {
      return NextResponse.json(
        { success: false, error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
        { status: 429 }
      );
    }
    
    // Lấy refresh token từ cookie
    const refreshToken = cookies().get('refresh_token')?.value;
    
    if (!refreshToken) {
      if (!isSilentCheck) {
        apiLogger.warn('auth/refresh: Không tìm thấy refresh token trong cookie');
      }
      return NextResponse.json(
        { success: false, error: { message: 'No refresh token', code: 'NO_REFRESH_TOKEN' } },
        { status: 401 }
      );
    }
    
    // Gọi API backend để làm mới token
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    if (!isSilentCheck) {
      apiLogger.debug(`auth/refresh: Gọi backend API ${backendUrl}/api/auth/refresh-token`);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    try {
      const response = await fetch(`${backendUrl}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include',
        signal: controller.signal,
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      
      if (!isSilentCheck) {
        apiLogger.debug(`auth/refresh: Phản hồi từ backend - Status: ${response.status}`);
      }
      
      if (!response.ok) {
        let errorText;
        try {
          const errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } catch (e) {
          errorText = await response.text();
        }
        
        if (!isSilentCheck) {
          apiLogger.error('Error refreshing token:', errorText);
        }
        
        // Xóa cookie nếu refresh token không hợp lệ hoặc hết hạn
        cookies().delete('auth_token');
        cookies().delete('refresh_token');
        
        // Trạng thái lỗi cụ thể
        const errorStatus = response.status === 401 ? 401 : 
                           response.status === 403 ? 403 : 500;
        
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Failed to refresh token',
              code: response.status === 401 ? 'INVALID_REFRESH_TOKEN' : 
                    response.status === 403 ? 'FORBIDDEN' : 'SERVER_ERROR',
              details: errorText
            } 
          },
          { status: errorStatus }
        );
      }
      
      // Parse response data
      const data = await response.json();
      
      if (!isSilentCheck) {
        apiLogger.info(`auth/refresh: Nhận được token mới từ backend API`);
      }
      
      // Cập nhật cookie với token mới
      const newToken = data.access_token;
      const newRefreshToken = data.refresh_token;
      
      if (!newToken) {
        if (!isSilentCheck) {
          apiLogger.error('New token not found in API response');
        }
        return NextResponse.json(
          { success: false, error: { message: 'Token not found in response', code: 'INVALID_RESPONSE' } },
          { status: 500 }
        );
      }
      
      // Cập nhật thời gian sống của cookie
      const cookieOptions = {
        httpOnly: true,
        path: '/',
        secure: false, // Tắt secure khi dev để hoạt động trên http
        sameSite: 'strict' as const,
      };
      
      cookies().set({
        name: 'auth_token',
        value: newToken,
        ...cookieOptions,
        maxAge: 30 * 60, // Tăng lên 30 phút
      });
      
      if (newRefreshToken) {
        if (!isSilentCheck) {
          apiLogger.info('auth/refresh: Cập nhật refresh token mới');
        }
        cookies().set({
          name: 'refresh_token',
          value: newRefreshToken,
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60, // 7 ngày
        });
      }
      
      // Trả về phản hồi thành công với thông tin người dùng
      return NextResponse.json({
        success: true,
        data: {
          user: data.user,
          expiresIn: 30 * 60, // Thêm thông tin về thời gian hết hạn
        },
        message: 'Token refreshed successfully'
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (!isSilentCheck) {
        apiLogger.error('Fetch error during token refresh:', fetchError);
      }
      
      // Reset cookies in case of error
      cookies().delete('auth_token');
      cookies().delete('refresh_token');
      
      const isAbortError = fetchError instanceof Error && fetchError.name === 'AbortError';
      
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: isAbortError ? 'Timeout refreshing token' : 
                    fetchError instanceof Error ? fetchError.message : 'Network error refreshing token',
            code: isAbortError ? 'TIMEOUT' : 'NETWORK_ERROR'
          } 
        },
        { status: isAbortError ? 504 : 500 }
      );
    }
  } catch (error) {
    // Kiểm tra nếu đây là kiểm tra xác thực im lặng
    const isSilentCheck = request.headers.get('X-Silent-Auth-Check') === '1';
    if (!isSilentCheck) {
      apiLogger.error('Refresh token general error:', error);
    }
    
    // Xóa cookie để tránh vòng lặp vô hạn
    cookies().delete('auth_token');
    cookies().delete('refresh_token');
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error instanceof Error ? error.message : 'Error refreshing token', 
          code: 'SERVER_ERROR' 
        } 
      },
      { status: 500 }
    );
  }
} 