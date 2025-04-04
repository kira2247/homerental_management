import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    // Kiểm tra backend có hoạt động không
    let backendStatus = 'DOWN';
    let backendMessage = 'Failed to connect to backend service';
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${backendUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        backendStatus = 'UP';
        backendMessage = 'Backend service is running';
        
        // Thử lấy thông tin chi tiết từ backend health check
        try {
          const data = await response.json();
          backendMessage = data.message || backendMessage;
        } catch (e) {
          // Không làm gì nếu không parse được JSON
        }
      } else {
        backendMessage = `Backend returned status ${response.status}`;
      }
    } catch (error) {
      console.error('Error checking backend health:', error);
      // Sử dụng giá trị mặc định đã thiết lập
    }
    
    // Trả về trạng thái tổng thể
    const frontendStatus = 'UP';
    const isSystemHealthy = backendStatus === 'UP';
    
    // Trả về response
    return NextResponse.json({
      status: isSystemHealthy ? 'UP' : 'PARTIAL',
      timestamp: new Date().toISOString(),
      components: {
        frontend: {
          status: frontendStatus,
          message: 'Frontend service is running'
        },
        backend: {
          status: backendStatus,
          message: backendMessage
        }
      },
      message: isSystemHealthy 
        ? 'All systems operational' 
        : 'System is partially operational - backend may be unavailable'
    }, {
      status: isSystemHealthy ? 200 : 207, // 207 Multi-Status
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      message: 'Error performing health check',
      error: error.message
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }
} 