import { useState, useEffect } from 'react';
import { uiLogger } from '@/lib/utils/logging';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface HealthIndicatorProps {
  className?: string;
  pollingInterval?: number; // ms
}

interface HealthStatus {
  status: 'UP' | 'PARTIAL' | 'ERROR' | 'DOWN';
  components: {
    frontend: {
      status: string;
      message: string;
    };
    backend: {
      status: string;
      message: string;
    };
  };
  message: string;
  timestamp: string;
}

export function HealthIndicator({ className = '', pollingInterval = 30000 }: HealthIndicatorProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  // Fetch health status
  const checkHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      uiLogger.error('Failed to check health', error);
      setHealth({
        status: 'ERROR',
        components: {
          frontend: { status: 'UP', message: 'Frontend is running' },
          backend: { status: 'DOWN', message: 'Failed to connect to backend' },
        },
        message: 'Failed to check health status',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial check and polling
  useEffect(() => {
    checkHealth();

    const interval = setInterval(checkHealth, pollingInterval);
    return () => clearInterval(interval);
  }, [pollingInterval]);

  // Determine icon and color based on status
  let icon = <AlertCircle className="text-yellow-500" />;
  let label = 'Đang kiểm tra...';
  let color = 'text-yellow-500';

  if (health) {
    if (health.status === 'UP') {
      icon = <CheckCircle className="text-green-500" />;
      label = 'Hệ thống hoạt động bình thường';
      color = 'text-green-500';
    } else if (health.status === 'PARTIAL') {
      icon = <Wifi className="text-yellow-500" />;
      label = 'Kết nối không ổn định';
      color = 'text-yellow-500';
    } else {
      icon = <WifiOff className="text-red-500" />;
      label = 'Lỗi kết nối';
      color = 'text-red-500';
    }
  }

  return (
    <div className={`${className} inline-flex items-center`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center text-sm gap-1.5 hover:opacity-80"
      >
        <span className="w-4 h-4">{icon}</span>
        <span className={color}>{label}</span>
      </button>

      {expanded && health && (
        <div className="absolute top-full mt-2 right-0 z-10 bg-white shadow-lg rounded-md p-3 w-64 text-xs border border-gray-200">
          <div className="text-sm font-medium mb-2">Trạng thái hệ thống</div>
          <div
            className={`mb-2 ${health.components.backend.status === 'UP' ? 'text-green-500' : 'text-red-500'}`}
          >
            <div className="font-medium">Backend:</div>
            <div>{health.components.backend.message}</div>
          </div>
          <div className="text-green-500 mb-2">
            <div className="font-medium">Frontend:</div>
            <div>{health.components.frontend.message}</div>
          </div>
          <div className="text-gray-500 text-xs">
            Cập nhật: {new Date(health.timestamp).toLocaleTimeString()}
          </div>
          <button
            onClick={checkHealth}
            className="mt-2 w-full text-center text-xs bg-gray-100 hover:bg-gray-200 py-1 px-2 rounded"
          >
            Kiểm tra lại
          </button>
        </div>
      )}
    </div>
  );
}
