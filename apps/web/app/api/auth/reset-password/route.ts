import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { token, password } = await request.json();

    // Validate input
    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    // Use backend API to reset password
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/api';
    const response = await fetch(`${backendUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });

    // Handle API error
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: response.status });
    }

    // Return success response
    return NextResponse.json({
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 