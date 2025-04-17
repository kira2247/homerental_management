import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get token from query params
    const token = request.nextUrl.searchParams.get('token');

    // Validate input
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Use backend API to verify email
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/api';
    const response = await fetch(`${backendUrl}/auth/verify-email?token=${token}`, {
      method: 'GET',
    });

    // Handle API error
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Email verification failed' }, { status: response.status });
    }

    // Return success response
    return NextResponse.json({
      message: 'Email has been verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 