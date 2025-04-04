import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { i18n } from './lib/i18n/dict';

// Định nghĩa interface cho token payload
interface TokenPayload {
  sub: string; // User ID
  email: string;
  name: string;
  role: string;
  exp: number; // Thời gian hết hạn
}

// Các đường dẫn công khai, không yêu cầu đăng nhập
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/verify-email'
];

// Các đường dẫn API không cần xác thực
const publicApiPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/resend-verification'
];

// Các đường dẫn dành cho admin
const adminPaths = ['/admin', '/system', '/users', '/settings/system'];

// Các API chỉ dành cho admin
const adminApiPaths = [
  '/api/admin/',
  '/api/users',
  '/api/system'
];

// Các vai trò admin
const adminRoles = ['SUPER_ADMIN', 'ADMIN'];

// Danh sách các route không cần xác thực
const publicRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',
  '/about',
  '/contact',
];

// Danh sách API endpoint không cần xác thực
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/healthcheck',
];

// Prefixes cần bỏ qua
const bypassPrefixes = [
  '/_next',
  '/favicon.ico',
  '/images',
  '/assets',
];

// Hàm kiểm tra token
function parseToken(token: string): TokenPayload | null {
  try {
    return jwtDecode<TokenPayload>(token);
  } catch (error) {
    console.error('Token parsing error:', error);
    return null;
  }
}

// Kiểm tra xem token có hợp lệ không
function isValidToken(payload: TokenPayload | null): boolean {
  if (!payload) return false;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp > currentTime;
}

// Kiểm tra xem người dùng có quyền admin không
function hasAdminPermission(payload: TokenPayload | null): boolean {
  if (!payload) return false;
  return adminRoles.includes(payload.role);
}

// Kiểm tra nếu route là public
function isPublicRoute(pathname: string): boolean {
  // Loại bỏ locale khỏi pathname để kiểm tra
  const pathWithoutLocale = i18n.locales.reduce((path, locale) => {
    return path.replace(new RegExp(`^/${locale}`), '');
  }, pathname);
  
  // Kiểm tra nếu là route không cần xác thực
  return publicRoutes.some(route => pathWithoutLocale === route || 
                                     pathWithoutLocale.startsWith(`${route}/`));
}

// Kiểm tra nếu route là API public
function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some(route => pathname === route || 
                                        pathname.startsWith(`${route}/`));
}

// Kiểm tra nếu route cần bỏ qua
function shouldBypass(pathname: string): boolean {
  return bypassPrefixes.some(prefix => pathname.startsWith(prefix));
}

// Hàm lấy locale ưu tiên từ headers
function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  // @ts-ignore locales là chuỗi, Negotiator mong đợi string[]
  const locales: string[] = new Negotiator({ headers: negotiatorHeaders }).languages();
  
  // Fallback nếu không phát hiện locale
  if (!locales || locales.length === 0) {
    return i18n.defaultLocale;
  }
  
  try {
    return matchLocale(locales, i18n.locales, i18n.defaultLocale);
  } catch (e) {
    console.error('Error matching locale:', e);
    return i18n.defaultLocale;
  }
}

// Middleware chính
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
  
  console.log(`[Middleware ${requestId}] Xử lý request: ${request.method} ${pathname}`);
  
  // ===== BYPASS CHECK =====
  // Bỏ qua các static assets và system routes
  if (shouldBypass(pathname)) {
    console.log(`[Middleware ${requestId}] Bỏ qua middleware cho static/system path: ${pathname}`);
    return NextResponse.next();
  }
  
  // ===== LOCALE HANDLING =====
  // Kiểm tra nếu pathname đã bao gồm locale
  const pathnameHasLocale = i18n.locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Nếu pathname không có locale hoặc là root path
  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    console.log(`[Middleware ${requestId}] Đang thêm locale: ${locale} vào đường dẫn`);
    
    // Đối với path là /api, không cần thêm locale
    if (pathname.startsWith('/api')) {
      return NextResponse.next();
    }
    
    // Tạo URL mới với locale
    const newUrl = new URL(`/${locale}${pathname.startsWith('/') ? '' : '/'}${pathname}`, request.url);
    // Sao chép search params
    request.nextUrl.searchParams.forEach((value, key) => {
      newUrl.searchParams.set(key, value);
    });
    
    return NextResponse.redirect(newUrl);
  }
  
  // ===== API ROUTES =====
  // Kiểm tra nếu là API route
  if (pathname.startsWith('/api')) {
    // Kiểm tra nếu là API public
    if (isPublicApiRoute(pathname)) {
      console.log(`[Middleware ${requestId}] API route public: ${pathname}`);
      return NextResponse.next();
    }
    
    // Các API route khác cần xác thực
    const token = request.cookies.get('auth_token');
    
    if (!token || !token.value) {
      console.log(`[Middleware ${requestId}] Token không tồn tại cho API route: ${pathname}`);
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }
    
    // Kiểm tra tính hợp lệ của token
    const tokenPayload = parseToken(token.value);
    console.log(`[Middleware ${requestId}] Token payload:`, 
                tokenPayload ? 
                {userId: tokenPayload.sub, role: tokenPayload.role, exp: new Date(tokenPayload.exp * 1000).toISOString()} : 
                'Invalid token');
    
    if (!isValidToken(tokenPayload)) {
      console.log(`[Middleware ${requestId}] Token hết hạn hoặc không hợp lệ cho API route: ${pathname}`);
      return NextResponse.json(
        { success: false, error: { message: 'Token expired or invalid', code: 'INVALID_TOKEN' } },
        { status: 401 }
      );
    }
    
    // Nếu có token, cho phép request tiếp tục
    console.log(`[Middleware ${requestId}] API request có token hợp lệ: ${pathname}`);
    return NextResponse.next();
  }
  
  // ===== PROTECTED ROUTES =====
  // Lấy locale từ URL
  const locale = pathname.split('/')[1];
  
  // Xử lý route mở (không cần xác thực)
  if (isPublicRoute(pathname)) {
    console.log(`[Middleware ${requestId}] Route public: ${pathname}`);
    
    // Kiểm tra nếu user đã đăng nhập và đang truy cập trang login/register
    // thì redirect về trang dashboard
    if (pathname.includes('/login') || pathname.includes('/register')) {
      const token = request.cookies.get('auth_token');
      
      if (token && token.value) {
        console.log(`[Middleware ${requestId}] User đã đăng nhập, chuyển hướng từ trang đăng nhập đến dashboard`);
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
      }
    }
    
    return NextResponse.next();
  }
  
  // Kiểm tra xác thực cho route protected
  const token = request.cookies.get('auth_token');
  console.log(`[Middleware ${requestId}] Kiểm tra xác thực cho route: ${pathname}, token: ${token ? 'Có' : 'Không'}`);
  
  if (!token || !token.value) {
    // Redirect đến trang login nếu không có token
    console.log(`[Middleware ${requestId}] Không có token, chuyển hướng đến trang login`);
    const searchParams = new URLSearchParams({
      returnUrl: pathname + request.nextUrl.search,
    });
    
    return NextResponse.redirect(new URL(`/${locale}/login?${searchParams.toString()}`, request.url));
  }
  
  // Kiểm tra nếu đường dẫn là route admin
  if (pathname.includes('/(admin)') || pathname.includes('/admin')) {
    // Thêm logic kiểm tra role admin nếu cần
    // ...
  }
  
  // Cho phép request tiếp tục
  console.log(`[Middleware ${requestId}] Token hợp lệ, cho phép tiếp tục đến: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  // Matcher cho phép middleware bỏ qua các static files
  matcher: ['/((?!_next/static|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|webp)$).*)'],
}; 