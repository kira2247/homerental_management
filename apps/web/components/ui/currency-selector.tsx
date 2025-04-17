'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, ChevronDown, Loader2 } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';
import { useCurrency, SupportedCurrency } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface CurrencySelectorProps {
  onCurrencyChange: (currency: string) => void;
  className?: string;
}

const currencies = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'VND', label: 'VND - Vietnamese Dong', symbol: '₫' },
];

export function CurrencySelector({ onCurrencyChange, className }: CurrencySelectorProps) {
  const { locale } = useLocale();
  const { currency, setCurrency, exchangeRates, isLoading, error } = useCurrency();
  const [open, setOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set default currency based on locale when component mounts
    const defaultCurrency = locale === 'vi' ? 'VND' : 'USD';
    setCurrency(defaultCurrency as SupportedCurrency);
    onCurrencyChange(defaultCurrency);
  }, [locale, onCurrencyChange, setCurrency]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedCurrency = currencies.find((c) => c.value === currency);

  // Format exchange rate for display
  const getExchangeRateDisplay = (targetCurrency: string) => {
    if (targetCurrency === currency) return '';
    const rate = exchangeRates[targetCurrency as SupportedCurrency];
    const baseRate = exchangeRates[currency];
    if (!rate || !baseRate) return '';
    const exchangeRate = rate / baseRate;
    return `1 ${currency} = ${exchangeRate.toFixed(2)} ${targetCurrency}`;
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-between w-[140px] h-10 px-3 py-2 text-sm',
          'bg-white border border-gray-300 rounded-md shadow-sm',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </span>
        ) : selectedCurrency ? (
          <span className="flex items-center">
            <span className="mr-2">{selectedCurrency.symbol}</span>
            {selectedCurrency.value}
          </span>
        ) : (
          <span className="flex items-center">
            <DollarSign className="mr-2 h-4 w-4" />
            Select
          </span>
        )}
        <ChevronDown className={cn(
          'ml-2 h-4 w-4 opacity-50 transition-transform duration-200',
          open && 'transform rotate-180'
        )} />
      </button>

      {open && !isLoading && (
        <div className={cn(
          'absolute z-10 w-[250px] mt-1',
          'bg-white border border-gray-300 rounded-md shadow-lg',
          'transform transition-all duration-200 ease-out'
        )}>
          {error && (
            <div className="px-3 py-2 text-sm text-red-600 border-b border-gray-300">
              {error}
            </div>
          )}
          <ul className="max-h-[250px] overflow-y-auto py-1">
            {currencies.map((c) => (
              <li
                key={c.value}
                className={cn(
                  'px-3 py-2 text-sm cursor-pointer',
                  'hover:bg-gray-100 transition-colors duration-150',
                  currency === c.value && 'bg-blue-50 text-blue-700'
                )}
                onClick={() => {
                  setCurrency(c.value as SupportedCurrency);
                  onCurrencyChange(c.value);
                  setOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="mr-2">{c.symbol}</span>
                    {c.label}
                  </span>
                  {currency === c.value && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                {getExchangeRateDisplay(c.value) && (
                  <div className="mt-1 text-xs text-gray-500">
                    {getExchangeRateDisplay(c.value)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
