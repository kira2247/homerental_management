import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/auth/jwt';
import { apiLogger } from '@/lib/utils/logging';
import { userApiService } from '@/lib/api';

export async function PUT(request: Request) {
  try {
    // Get token from cookie
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { message: 'You are not logged in' } },
        { status: 401 }
      );
    }

    // Verify token
    let userData;
    try {
      userData = await verifyJwtToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid token' } },
        { status: 401 }
      );
    }

    // Get data from request body
    const body = await request.json();
    const { name, email } = body;

    // Validate data
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: { message: 'Name and email are required' } },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    try {
      // Gửi yêu cầu cập nhật thông tin người dùng đến API backend
      const updateResponse = await userApiService.updateUser(userData.id, {
        name,
        email
      });
      
      // Kiểm tra kết quả từ API
      if (!updateResponse.success) {
        // Xử lý các lỗi cụ thể từ backend
        const errorMessage = updateResponse.error?.message || 'Failed to update profile';
        const statusCode = updateResponse.error?.code === 'DUPLICATE_EMAIL' ? 400 : 500;
        
        return NextResponse.json(
          { success: false, error: { message: errorMessage } },
          { status: statusCode }
        );
      }
      
      // Trả về thông tin người dùng đã cập nhật
      return NextResponse.json({
        success: true,
        data: {
          user: updateResponse.data
        }
      });
    } catch (apiError) {
      apiLogger.error('Error calling update profile API:', apiError);
      return NextResponse.json(
        { success: false, error: { message: 'Failed to update user profile' } },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    );
  }
} 