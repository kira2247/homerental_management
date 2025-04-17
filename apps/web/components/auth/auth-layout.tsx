'use client';

import React from 'react';
import Image from 'next/image';
import { useLocale } from '@/lib/i18n/client';
import LocaleSwitcher from '@/components/ui/locale-switcher';
import { DEFAULT_IMAGES } from '@/lib/constants/images';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({
  children
}: AuthLayoutProps) {
  const { t } = useLocale();

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-900 to-blue-700 opacity-90 z-10"></div>
        <Image
          src={DEFAULT_IMAGES.AUTH_BACKGROUND}
          alt="Background"
          className="object-cover"
          fill
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center z-20 p-12">
          <h1 className="text-white text-4xl font-bold mb-6 text-center">
            {t('auth.welcome')}
          </h1>
          <p className="text-blue-100 text-xl text-center max-w-md">
            {t('auth.tagline')}
          </p>
        </div>
      </div>

      <div className="flex w-full md:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-xl bg-white shadow-xl border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 relative">
              <h2 className="text-center text-xl font-semibold text-white drop-shadow-sm">{t('common.appName')}</h2>
              <div className="absolute right-3 top-0 bottom-0 flex items-center">
                <div className="text-white">
                  <LocaleSwitcher variant="auth" />
                </div>
              </div>
            </div>

            <div className="p-7 bg-white">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
