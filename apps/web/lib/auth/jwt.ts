import { jwtVerify, SignJWT } from 'jose';

// Định nghĩa kiểu dữ liệu cho payload JWT
export interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'OWNER';
  iat?: number;
  exp?: number;
}

// Secret key cho JWT (nên lưu trong env variable)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-secret-key-please-change-in-production'
);

// Tạo JWT token
export async function signJwtToken(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
  try {
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Token hết hạn sau 7 ngày
      .sign(JWT_SECRET);
    
    return token;
  } catch (error) {
    console.error('Error signing JWT token:', error);
    throw new Error('Failed to sign JWT token');
  }
}

// Xác thực JWT token
export async function verifyJwtToken(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Chuyển đổi qua unknown trước, sau đó mới ép kiểu thành JwtPayload
    return payload as unknown as JwtPayload;
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    throw new Error('Invalid or expired token');
  }
} 