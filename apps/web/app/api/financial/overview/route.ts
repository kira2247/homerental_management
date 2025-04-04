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
      const response = await fetch(`${backendUrl}/api/financial/overview${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader,
        },
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Get response data
      const data = await response.json();    
    
      // Return data with proper status code
      return NextResponse.json(data, {
        status: response.status,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {
      console.error('Error fetching financial overview:', error);
      
      // Return error response
      return NextResponse.json(
        { 
          error: 'Financial overview service unavailable',
          message: error.message || 'Unable to connect to financial overview service'
        },
        { 
          status: 503,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Content-Type': 'application/json',
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Error in overview API route:', error);
    
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
} 