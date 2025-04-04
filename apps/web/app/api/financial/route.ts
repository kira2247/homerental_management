import { NextRequest, NextResponse } from 'next/server';

// Generic handler for the financial API routes
export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Get the URL path segments after /api/financial/
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/api/financial/');
    const apiPath = pathSegments.length > 1 ? pathSegments[1] : '';
    
    // Include all query parameters
    const queryString = url.search;
    
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    // Forward the cookies for authentication
    const cookieHeader = request.headers.get('cookie') || '';
    
    try {
      // Call backend API
      const response = await fetch(`${backendUrl}/api/financial/${apiPath}${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3000',
          'Cookie': cookieHeader,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        },
        credentials: 'include',
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      // Xử lý lỗi cụ thể
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' } },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: { message: 'Resource not found', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }
      
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
        // Trả về lỗi phân tích JSON
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
      
      // Return the response from the backend
      return NextResponse.json(data, { status: response.status });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle abort error (timeout)
      if (fetchError.name === 'AbortError') {
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
      
      // Trả về lỗi mạng
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

// Handle POST requests
export async function POST(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Get the URL path segments after /api/financial/
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/api/financial/');
    const apiPath = pathSegments.length > 1 ? pathSegments[1] : '';
    
    // Get the request body
    const body = await request.json();
    
    // Include all query parameters
    const queryString = url.search;
    
    // Thêm timeout để tránh request treo vô thời hạn
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    // Forward the cookies for authentication
    const cookieHeader = request.headers.get('cookie') || '';
    
    try {
      // Call backend API
      const response = await fetch(`${backendUrl}/api/financial/${apiPath}${queryString}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': request.headers.get('origin') || 'http://localhost:3000',
          'Cookie': cookieHeader,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify(body),
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Xử lý lỗi cụ thể
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: { message: 'Unauthorized access', code: 'UNAUTHORIZED' } },
          { status: 401 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: { message: 'Resource not found', code: 'NOT_FOUND' } },
          { status: 404 }
        );
      }
      
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
        // Trả về lỗi phân tích JSON
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
      
      // Return the response from the backend
      return NextResponse.json(data, { status: response.status });
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle abort error (timeout)
      if (fetchError.name === 'AbortError') {
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
      
      // Trả về lỗi mạng
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