import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const url = new URL(request.url);
    const queryString = url.search;    
   
    
    // Forward the cookies for authentication
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Call backend API
    const response = await fetch(`${backendUrl}/api/financial/pending-tasks${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
        'Cookie': cookieHeader,
      },
      credentials: 'include',
    });
    
    // Get response data
    let data;
    try {
      data = await response.json();
      
    } catch (jsonError) {
      
      const text = await response.text();      
      
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
    
    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Pending tasks API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Lỗi kết nối đến máy chủ tài chính',
          code: 'SERVER_ERROR'
        }
      },
      { status: 500 }
    );
  }
} 