import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authLogger } from '@/lib/utils/logging';

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra nếu đây là kiểm tra xác thực không hiển thị lỗi
    const isSilentCheck = request.headers.get('X-Silent-Auth-Check') === '1';
    
    if (!isSilentCheck) {
      authLogger.debug('auth/me: Bắt đầu kiểm tra xác thực', { isSilentCheck });
    }
    
    // Kiểm tra tất cả cookies
    const allCookies = request.cookies.getAll();
    if (!isSilentCheck) {
      authLogger.debug('auth/me: Tất cả cookie nhận được:', 
                  allCookies.map(c => `${c.name}=${c.value.substring(0, 10)}...`));
    }
    
    // Get token from cookie
    const token = cookies().get('auth_token')?.value;
    if (!isSilentCheck) {
      authLogger.debug('auth/me: Token từ cookies():', token ? `${token.substring(0, 10)}...` : 'Không có');
    }
    
    // Kiểm tra token từ cookies API
    const tokenFromRequest = request.cookies.get('auth_token')?.value;
    if (!isSilentCheck) {
      authLogger.debug('auth/me: Token từ request.cookies:', tokenFromRequest ? `${tokenFromRequest.substring(0, 10)}...` : 'Không có');
    
      // Kiểm tra token từ header Authorization
      const authHeader = request.headers.get('Authorization');
      authLogger.debug('auth/me: Authorization header:', authHeader || 'Không có');
    }
    
    if (!token) {
      if (!isSilentCheck) {
        authLogger.debug('auth/me: Không tìm thấy token trong cookie');
      }
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'NO_TOKEN'
          }
        },
        { status: 401 }
      );
    }
    
    // Call real backend API to validate token and get user data
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    if (!isSilentCheck) {
      authLogger.debug(`auth/me: Gọi backend API ${backendUrl}/api/auth/me`);
    }
    
    try {
      // Timeout for backend API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      if (!isSilentCheck) {
        authLogger.debug(`auth/me: Gửi request với token: ${token?.substring(0, 10)}...`);
      }
      
      // Tạo headers với nhiều cách xác thực
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Cookie': `auth_token=${token}`
      };
      
      if (!isSilentCheck) {
        authLogger.debug('auth/me: Headers được sử dụng:', headers);
      }
      
      const response = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        headers,
        signal: controller.signal,
        credentials: 'include',
      });
      
      clearTimeout(timeoutId);
      
      if (!isSilentCheck) {
        authLogger.debug(`auth/me: Nhận phản hồi từ backend: status=${response.status}`);
      }
      
      // Xử lý lỗi từ backend
      if (!response.ok) {
        // Trích xuất thông báo lỗi từ phản hồi nếu có
        let errorMessage = 'Unauthorized';
        let errorCode = 'UNAUTHORIZED';
        
        try {
          const errorData = await response.json();
          if (!isSilentCheck) {
            authLogger.debug(`auth/me: Dữ liệu lỗi:`, errorData);
          }
          errorMessage = errorData.message || errorMessage;
          errorCode = errorData.code || errorCode;
        } catch (e) {
          if (!isSilentCheck) {
            authLogger.error('auth/me: Không thể parse phản hồi lỗi:', e);
          }
        }
        
        // Clear cookie if unauthorized (token expired or invalid)
        if (response.status === 401) {
          if (!isSilentCheck) {
            authLogger.debug(`auth/me: Xóa cookie do token không hợp lệ`);
          }
          cookies().delete('auth_token');
        }
        
        return NextResponse.json(
          {
            success: false,
            error: {
              message: errorMessage,
              code: errorCode
            }
          },
          { status: response.status }
        );
      }
      
      // Lấy nội dung phản hồi dưới dạng text
      const responseText = await response.text();
      if (!isSilentCheck) {
        authLogger.debug(`auth/me: Phản hồi từ backend API - Body:`, responseText);
      }
      
      // Parse JSON nếu có
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        authLogger.error(`auth/me: Lỗi parse JSON:`, parseError);
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid JSON response from server',
              code: 'INVALID_RESPONSE_FORMAT'
            }
          },
          { status: 500 }
        );
      }
      
      // Kiểm tra xem có dữ liệu người dùng không
      if (!data || !data.user) {
        authLogger.error(`auth/me: Không có dữ liệu người dùng trong phản hồi:`, data);
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'User data not found in response',
              code: 'NO_USER_DATA'
            }
          },
          { status: 500 }
        );
      }
      
      // Chuyển đổi cấu trúc dữ liệu nếu cần
      const userData = {
        id: data.user.id || data.user.sub || '',
        name: data.user.name || '',
        email: data.user.email || '',
        role: data.user.role || 'USER'
      };
      
      if (!isSilentCheck) {
        authLogger.debug(`auth/me: Trả về dữ liệu người dùng thành công:`, userData);
      }
      
      // Return user data
      return NextResponse.json({
        success: true,
        user: userData
      });
    } catch (fetchError) {
      if (!isSilentCheck) {
        authLogger.error(`auth/me: Lỗi khi gọi backend API:`, fetchError);
      }
      return NextResponse.json(
        {
          success: false,
          error: {
            message: fetchError instanceof Error ? fetchError.message : 'Failed to fetch authentication data',
            code: 'FETCH_ERROR'
          }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Chỉ ghi nhật ký lỗi nếu không phải là kiểm tra im lặng
    const isSilentCheck = request.headers.get('X-Silent-Auth-Check') === '1';
    if (!isSilentCheck) {
      authLogger.error('Error in auth/me route:', error);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Authentication failed',
          code: 'GENERAL_ERROR'
        }
      },
      { status: 500 }
    );
  }
} 