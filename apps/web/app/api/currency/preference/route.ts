import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const cookieHeader = request.headers.get('cookie') || '';
    
    const response = await fetch(`${backendUrl}/api/currency/preference`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch currency preference');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching currency preference:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Currency preference service unavailable',
        message: error.message || 'Unable to connect to currency preference service'
      },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const cookieHeader = request.headers.get('cookie') || '';
    const body = await request.json();
    
    const response = await fetch(`${backendUrl}/api/currency/preference`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to update currency preference');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating currency preference:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Currency preference service unavailable',
        message: error.message || 'Unable to connect to currency preference service'
      },
      { status: 503 }
    );
  }
} 