import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Get auth token from cookie
    const authToken = cookies().get('auth-token')?.value;

    // Check if user is authenticated
    if (!authToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Use backend API to resend verification email
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/api';
    const response = await fetch(`${backendUrl}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Handle API error
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Failed to resend verification email' }, { status: response.status });
    }

    // Return success response
    return NextResponse.json({
      message: 'Verification email has been sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 