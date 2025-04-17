import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = new URL(request.url);
    const queryString = url.search;       
    
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    // Forward the cookies for authentication
    const cookieHeader = request.headers.get('cookie') || '';
    
    try {
      // Call backend API
      const response = await fetch(`${backendUrl}/api/financial/dashboard-summary${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3000',
          'Cookie': cookieHeader,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
        },
        credentials: 'include',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      
      // Xử lý lỗi không có quyền truy cập
      if (response.status === 401) {
        
        return NextResponse.json(
          { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
          { status: 401 }
        );
      }
      
      // Xử lý lỗi 404 (không tìm thấy tài nguyên)
      if (response.status === 404) {
        
        return NextResponse.json(
          { success: false, error: { message: 'Resource not found', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }
      
      // Xử lý các lỗi server khác
      if (!response.ok) {
        
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: `Server returned error: ${response.status} ${response.statusText}`, 
              code: 'SERVER_ERROR' 
            } 
          },
          { status: response.status }
        );
      }
      
      // Get response data
      let data;
      try {
        data = await response.json();
        
      } catch (jsonError) {
        console.error('[Dashboard API] Error parsing JSON response:', jsonError);
        
        // Xử lý lỗi phân tích JSON
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Error parsing server response', 
              code: 'INVALID_RESPONSE' 
            } 
          },
          { status: 500 }
        );
      }
      
      // Kiểm tra dữ liệu trả về có hợp lệ không
      if (!data || (typeof data === 'object' && !data.data && !Object.keys(data).length)) {
        
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'No data returned from server', 
              code: 'NO_DATA' 
            } 
          },
          { status: 204 }
        );
      }
      
      // Return the response from the backend
      return NextResponse.json(data, { status: response.status });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      console.error('[Dashboard API] Fetch error:', fetchError);
      
      // Handle abort error (timeout)
      if (fetchError.name === 'AbortError') {
        console.error('[Dashboard API] Request timeout');
        return NextResponse.json(
          { 
            success: false, 
            error: { 
              message: 'Request timeout connecting to server', 
              code: 'TIMEOUT' 
            } 
          },
          { status: 504 }
        );
      }
      
      // Xử lý lỗi mạng hoặc kết nối
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: `Network error: ${fetchError.message || 'Unknown network error'}`, 
            code: 'NETWORK_ERROR' 
          } 
        },
        { status: 503 }
      );
    }
    
  } catch (error: any) {
    console.error('[Dashboard API] General error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: `Internal server error: ${error.message || 'Unknown error'}`, 
          code: 'INTERNAL_ERROR' 
        } 
      },
      { status: 500 }
    );
  }
} 