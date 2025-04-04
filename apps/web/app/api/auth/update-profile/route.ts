import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyJwtToken } from '@/lib/auth/jwt';

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

    // TODO: In a real application, update user information in the database
    // Example: await prisma.user.update({ where: { id: userData.id }, data: { name, email } });

    // Return updated information
    // Note: Here we're simulating a successful update without actually saving to the database
    // In a real application, check if the new email is already in use before updating
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          name,
          email,
          role: userData.role
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Server error' } },
      { status: 500 }
    );
  }
} 