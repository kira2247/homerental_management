import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use backend API to request password reset
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/api';
    const response = await fetch(`${backendUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    // Handle API error
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'Failed to process request' }, { status: response.status });
    }

    // Return success response (regardless of whether the email exists for security reasons)
    return NextResponse.json({
      message: 'If your email exists in our system, you will receive a password reset link shortly',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 