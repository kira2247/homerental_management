'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from './use-translation';

type LocaleContextType = {
  locale: string;
  changeLocale: (newLocale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

/**
 * Hook to use language in components
 * @returns Methods and values related to language
 */
export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

interface LocaleProviderProps {
  children: React.ReactNode;
  initialLocale: string;
}

/**
 * Provider component to manage global language in the application
 */
export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocale] = useState(initialLocale);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation(locale);
  
  // Always check URL path on first render and navigation
  useEffect(() => {
    // Extract locale from URL path
    const pathLocale = pathname.split('/')[1];
    
    // If URL contains a valid locale and it's different from current state, update it
    if (pathLocale && (pathLocale === 'en' || pathLocale === 'vi') && pathLocale !== locale) {
      setLocale(pathLocale);
    }
  }, [pathname, locale]);

  // Also listen for popstate events (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const pathLocale = window.location.pathname.split('/')[1];
      if (pathLocale && (pathLocale === 'en' || pathLocale === 'vi') && pathLocale !== locale) {
        setLocale(pathLocale);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [locale]);

  /**
   * Change language and update URL
   */
  const changeLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    
    // Set the locale immediately for UI updates
    setLocale(newLocale);
    
    // Update URL with new locale
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    
    // Use window.location to avoid flash when changing locale
    // (router.push does not fully refresh the page)
    window.location.href = newPath;
  };

  const contextValue: LocaleContextType = {
    locale,
    changeLocale,
    t
  };

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  );
} 