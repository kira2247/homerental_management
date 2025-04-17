import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authLogger } from '@/lib/utils/logging';

export async function POST() {
  try {
    // Get token for API call
    const token = cookies().get('auth_token')?.value;
    const refreshToken = cookies().get('refresh_token')?.value;
    
    // Call backend API to logout (blacklist token if implemented)
    if (token) {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
      await fetch(`${backendUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: refreshToken ? JSON.stringify({ refreshToken }) : undefined,
      });
    }
    
    // Always delete auth cookies
    cookies().delete('auth_token');
    cookies().delete('refresh_token');
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    authLogger.error('Logout error:', error);
    
    // Delete cookies even if backend call fails
    cookies().delete('auth_token');
    cookies().delete('refresh_token');
    
    return NextResponse.json(
      { success: false, error: { message: 'Logout failed' } }, 
      { status: 500 }
    );
  }
} 