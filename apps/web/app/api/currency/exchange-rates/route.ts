import { NextResponse } from 'next/server';

// Tỷ giá mặc định sử dụng khi API bên ngoài không khả dụng
const FALLBACK_EXCHANGE_RATES = {
  USD: 1,
  VND: 24500,
};

export async function GET() {
  try {
    // Kiểm tra nếu đang ở môi trường production
    const isProduction = process.env.NODE_ENV === 'production';
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Nếu đang ở môi trường production, lấy tỷ giá từ backend
    if (isProduction) {
      try {
        // Thêm timeout để tránh request treo vô thời hạn
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        // Gọi API backend để lấy tỷ giá hối đoái
        const response = await fetch(`${backendUrl}/api/currency/exchange-rates`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          signal: controller.signal,
          cache: 'no-store'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            success: true,
            data: data.data || FALLBACK_EXCHANGE_RATES,
          });
        } else {
          console.warn('Error fetching exchange rates from backend, using fallback data');
          throw new Error('Backend returned non-OK response');
        }
      } catch (backendError) {
        console.error('Error fetching from backend:', backendError);
        // Nếu không thể kết nối đến backend, sử dụng dữ liệu mặc định
        return NextResponse.json({
          success: true,
          data: FALLBACK_EXCHANGE_RATES,
        });
      }
    }
    
    // Trong môi trường development hoặc nếu không có backend URL
    // Sử dụng tỷ giá mặc định
    return NextResponse.json({
      success: true,
      data: FALLBACK_EXCHANGE_RATES,
    });
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Không thể lấy tỷ giá hối đoái',
          code: 'CURRENCY_API_ERROR',
        },
      },
      { status: 500 }
    );
  }
} 