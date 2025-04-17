import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Parse request body
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: { message: 'Name, email and password are required' } }, 
        { status: 400 }
      );
    }
    
    // Connect to the backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
    
    // Get response data
    const data = await response.json();
    
    // Handle API error
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: { message: data.message || 'Registration failed' } }, 
        { status: response.status }
      );
    }
    
    // Set HttpOnly cookie with JWT token
    cookies().set({
      name: 'auth_token',
      value: data.access_token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: data.user
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Internal server error' } }, 
      { status: 500 }
    );
  }
} 