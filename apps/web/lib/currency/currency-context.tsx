'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export type SupportedCurrency = 'USD' | 'VND';

const DEFAULT_EXCHANGE_RATES = {
  USD: 1,
  VND: 24500,
};

const CACHE_KEY = 'currency_exchange_rates';
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

interface CurrencyContextType {
  currency: SupportedCurrency;
  setCurrency: (currency: SupportedCurrency) => void;
  exchangeRates: Record<SupportedCurrency, number>;
  convertCurrency: (amount: number, from: SupportedCurrency, to: SupportedCurrency) => number;
  formatCurrency: (amount: number, currency?: SupportedCurrency, options?: Intl.NumberFormatOptions) => string;
  isLoading: boolean;
  error: string | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

interface CurrencyProviderProps {
  children: ReactNode;
  initialCurrency?: SupportedCurrency;
}

// Cache management functions
const getCachedRates = () => {
  if (typeof window === 'undefined') return null;
  
  const cached = localStorage.getItem(CACHE_KEY);
  if (!cached) return null;
  
  const { rates, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_EXPIRY) {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
  
  return { rates, timestamp };
};

const cacheRates = (rates: Record<SupportedCurrency, number>) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    rates,
    timestamp: Date.now()
  }));
};

export function CurrencyProvider({ 
  children, 
  initialCurrency 
}: CurrencyProviderProps) {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<SupportedCurrency>('VND'); // Default to VND initially
  const [exchangeRates, setExchangeRates] = useState<Record<SupportedCurrency, number>>(() => {
    const cached = getCachedRates();
    return cached?.rates || DEFAULT_EXCHANGE_RATES;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user's currency preference when user is available
  useEffect(() => {
    if (!user) return;

    const fetchUserPreference = async () => {
      try {
        const response = await fetch('/api/currency/preference');
        if (!response.ok) throw new Error('Failed to fetch currency preference');
        
        const data = await response.json();
        if (data.success && data.data) {
          setCurrency(data.data.preferredCurrency);
        }
      } catch (error) {
        console.error('Error fetching user currency preference:', error);
        setError('Không thể tải thiết lập tiền tệ. Đang sử dụng giá trị mặc định.');
      }
    };

    fetchUserPreference();
  }, [user]);
  
  // Fetch exchange rates
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    
    async function fetchExchangeRates() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check cache first
        const cached = getCachedRates();
        if (cached) {
          setExchangeRates(cached.rates);
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/currency/exchange-rates');
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rates');
        }
        
        const data = await response.json();
        if (data.success && data.data && isMounted) {
          setExchangeRates(data.data);
          cacheRates(data.data);
        }
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
        if (isMounted) {
          setError('Không thể tải tỷ giá hối đoái. Đang sử dụng tỷ giá mặc định.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    fetchExchangeRates();
    
    // Refresh rates every hour
    const intervalId = setInterval(fetchExchangeRates, CACHE_EXPIRY);
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user]);
  
  // Currency conversion
  const convertCurrency = (amount: number, from: SupportedCurrency, to: SupportedCurrency): number => {
    if (from === to) return amount;
    
    const fromRate = exchangeRates[from];
    const toRate = exchangeRates[to];
    
    if (!fromRate || !toRate) return amount;
    
    // Convert to USD first, then to target currency
    const valueInUSD = amount / fromRate;
    return valueInUSD * toRate;
  };
  
  // Currency formatting
  const formatCurrency = (
    amount: number, 
    currencyToUse: SupportedCurrency = currency,
    options: Intl.NumberFormatOptions = {}
  ): string => {
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currencyToUse,
      minimumFractionDigits: currencyToUse === 'VND' ? 0 : 2,
      maximumFractionDigits: currencyToUse === 'VND' ? 0 : 2,
    };
    
    const formatter = new Intl.NumberFormat(
      currencyToUse === 'VND' ? 'vi-VN' : 'en-US',
      { ...defaultOptions, ...options }
    );
    
    return formatter.format(amount);
  };
  
  const value: CurrencyContextType = {
    currency,
    setCurrency,
    exchangeRates,
    convertCurrency,
    formatCurrency,
    isLoading,
    error
  };
  
  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export default CurrencyProvider; 