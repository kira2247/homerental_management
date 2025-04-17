'use client';

import React, { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CurrencyProvider } from '@/lib/currency';
import { FinancialProvider } from '@/lib/financial';
import { ViewModeProvider } from '@/lib/view/view-mode-context';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AuthStatusProvider } from '@/lib/hooks/auth';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // Tăng staleTime lên 5 phút để giảm số lượng requests
        gcTime: 10 * 60 * 1000, // Dữ liệu cache được giữ trong 10 phút
        retry: (failureCount, error: any) => {
          // Không retry các lỗi 401, 403, 404
          if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
            return false;
          }
          // Tối đa 2 lần retry cho các lỗi khác
          return failureCount < 2;
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
        refetchOnWindowFocus: false, // Tắt refetch khi focus lại window
        refetchOnMount: true, // Cho phép refetch khi component mount
      },
      mutations: {
        retry: false, // Không retry các mutations
        onError: (error) => {
          console.error('Mutation error:', error);
        }
      }
    },
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthStatusProvider>
        <AuthProvider>
          <CurrencyProvider>
            <FinancialProvider>
              <ViewModeProvider>
                {children}
              </ViewModeProvider>
            </FinancialProvider>
          </CurrencyProvider>
        </AuthProvider>
      </AuthStatusProvider>
    </QueryClientProvider>
  );
} 