import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { notFound } from 'next/navigation';
import { LocaleProvider } from '@/lib/i18n/locale-provider';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hệ Thống Quản Lý Nhà Cho Thuê',
  description: 'Hệ thống quản lý nhà cho thuê toàn diện',
};

// Danh sách các locales được hỗ trợ
const locales = ['en', 'vi'];

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Kiểm tra xem locale có hợp lệ không
  const isValidLocale = locales.some((cur) => cur === locale);
  if (!isValidLocale) notFound();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <LocaleProvider initialLocale={locale}>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </LocaleProvider>
      </body>
    </html>
  );
} 