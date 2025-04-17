import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authLogger } from '@/lib/utils/logging';

export async function POST(request: NextRequest) {
  try {
    authLogger.debug('auth/login: Bắt đầu xử lý đăng nhập');
    
    const body = await request.json();
    const { email, password } = body;
    
    authLogger.debug('auth/login: Thông tin đăng nhập', { email: email ? 'Provided' : 'Missing' });

    // Validate input
    if (!email || !password) {
      authLogger.debug('auth/login: Thiếu thông tin đăng nhập', { email: !!email, password: !!password });
      return NextResponse.json(
        { success: false, error: { message: 'Email và mật khẩu không được để trống' } },
        { status: 400 }
      );
    }

    // Call backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    authLogger.debug(`auth/login: Gọi API backend ${backendUrl}/api/auth/login`);
    
    try {
      const backendResponse = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3000',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      authLogger.debug(`auth/login: Phản hồi từ backend API - Status:`, backendResponse.status);
      
      let data;
      let responseText;
      try {
        responseText = await backendResponse.text();
        authLogger.debug(`auth/login: Phản hồi từ backend API - Body:`, responseText);
        
        data = JSON.parse(responseText);
      } catch (jsonError) {        
        authLogger.error('auth/login: Lỗi parse JSON', jsonError, 'Response text:', responseText);
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Lỗi định dạng phản hồi từ server',
              code: 'INVALID_RESPONSE'
            } 
          },
          { status: 500 }
        );
      }

      if (!backendResponse.ok) {
        authLogger.debug(`auth/login: Đăng nhập thất bại`, { status: backendResponse.status, error: data?.error });
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: data.message || 'Đăng nhập thất bại',
              code: data.error?.code || 'UNAUTHORIZED'
            } 
          },
          { status: backendResponse.status }
        );
      }

      // Set auth cookie - NestJS trả về access_token
      const token = data.access_token;
      const refreshToken = data.refresh_token;
      
      if (!token) {
        authLogger.error('auth/login: Token not found in API response:', JSON.stringify(data, null, 2));
        return NextResponse.json(
          { success: false, error: { message: 'Không tìm thấy token xác thực' } },
          { status: 500 }
        );
      }
      
      authLogger.debug('auth/login: Đăng nhập thành công, nhận được token', { 
        hasAccessToken: !!token, 
        hasRefreshToken: !!refreshToken,
        tokenLength: token.length
      });

      // Tạo response với cookie
      const clientResponse = NextResponse.json({
        success: true,
        data: {
          user: {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role || 'user',
          }
        },
        message: 'Đăng nhập thành công'
      });

      // Set cookie trực tiếp vào response
      authLogger.debug('auth/login: Thiết lập cookie auth_token');
      
      clientResponse.cookies.set({
        name: 'auth_token',
        value: token,
        httpOnly: true,
        path: '/',
        secure: false, // Tắt secure khi dev để hoạt động trên http
        sameSite: 'lax',
        maxAge: 30 * 60, // 30 phút
      });
      
      // Lưu refresh token nếu có
      if (refreshToken) {
        authLogger.debug('auth/login: Thiết lập cookie refresh_token');
        clientResponse.cookies.set({
          name: 'refresh_token',
          value: refreshToken,
          httpOnly: true,
          path: '/',
          secure: false, // Tắt secure khi dev để hoạt động trên http
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 ngày
        });
      }

      authLogger.debug('auth/login: Trả về phản hồi thành công cho client.');
      return clientResponse;
      
    } catch (fetchError) {
      authLogger.error('auth/login: Fetch error:', fetchError);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Không thể kết nối đến máy chủ backend. Vui lòng kiểm tra kết nối mạng.',
            code: 'NETWORK_ERROR'
          } 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    authLogger.error('auth/login: Login API error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Lỗi xử lý đăng nhập', code: 'SERVER_ERROR' } },
      { status: 500 }
    );
  }
} 