'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useLocale } from '@/lib/i18n/client';
import { ViewModeProvider } from '@/lib/view/view-mode-context';
import { Home, Building, Users, CreditCard, Wrench as Tool, BarChart3 as BarChart, Settings } from 'lucide-react';
import UserProfile from '@/components/ui/user-profile';
import LocaleSwitcher from '@/components/ui/locale-switcher';
import { ErrorBoundary } from '@/components/error';

export default function ProtectedLayout({
  children,
  params: { locale: routeLocale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t, locale, changeLocale } = useLocale();
  
  // Handle closing menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Switch language
  const switchLocale = () => {
    const newLocale = locale === 'vi' ? 'en' : 'vi';
    changeLocale(newLocale);
  };
  
  // Navigation menu items
  const navigation = [
    { name: t('dashboard.navigation.dashboard'), href: `/${locale}/dashboard`, icon: Home },
    { name: t('dashboard.navigation.properties'), href: `/${locale}/properties`, icon: Building },
    { name: t('dashboard.navigation.tenants'), href: `/${locale}/tenants`, icon: Users },
    { name: t('dashboard.navigation.bills'), href: `/${locale}/bills`, icon: CreditCard },
    { name: t('dashboard.navigation.maintenance'), href: `/${locale}/maintenance`, icon: Tool },
    { name: t('dashboard.navigation.reports'), href: `/${locale}/reports`, icon: BarChart },
    { name: t('dashboard.navigation.settings'), href: `/${locale}/settings`, icon: Settings },
  ];
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <ViewModeProvider initialMode="grid">
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100">
          {/* Desktop sidebar */}
          <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
            <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                  <span className="text-white text-xl font-bold">{t('common.appName')}</span>
                </div>
                <nav className="mt-5 flex-1 px-2 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          pathname === item.href
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                      >
                        <Icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:pl-64 flex flex-col flex-1">
            <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
              <button
                type="button"
                className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setSidebarOpen(true)}
              >
                <span className="sr-only">{t('common.openMenu')}</span>
                {/* Hamburger icon */}
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
            
            {/* Mobile sidebar */}
            {sidebarOpen && (
              <div className="md:hidden fixed inset-0 flex z-40">
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-800">
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">{t('common.closeMenu')}</span>
                      {/* X icon */}
                      <svg
                        className="h-6 w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                      <span className="text-white text-xl font-bold">{t('common.appName')}</span>
                    </div>
                    <nav className="mt-5 flex-1 px-2 space-y-1">
                      {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={`${
                              pathname === item.href
                                ? 'bg-gray-900 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <Icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            )}
            
            {/* Header */}
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 md:px-8 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-gray-900">
                  {navigation.find(item => pathname === item.href)?.name || t('dashboard.title')}
                </h1>
                
                <div className="flex items-center">
                  <LocaleSwitcher />
                  
                  <UserProfile 
                    user={user}
                    onSignOut={handleLogout}
                  />
                </div>
              </div>
            </header>
            
            {/* Main content */}
            <main className="flex-1">
              <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </ErrorBoundary>
    </ViewModeProvider>
  );
} 