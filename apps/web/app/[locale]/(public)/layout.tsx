'use client';

import React from 'react';

export default function PublicLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div className="min-h-screen">
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
} 