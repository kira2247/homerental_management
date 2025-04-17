'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLocale } from '@/lib/i18n/client';

interface LocaleSwitcherProps {
  variant?: 'default' | 'auth';
}

export default function LocaleSwitcher({ variant = 'default' }: LocaleSwitcherProps) {
  const { t, locale, changeLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Danh sách các ngôn ngữ được hỗ trợ
  const languages = [
    { code: 'en', nameKey: 'common.languages.english' },
    { code: 'vi', nameKey: 'common.languages.vietnamese' },
  ];

  // Lấy tên hiển thị cho ngôn ngữ hiện tại
  const currentLanguageName =
    languages.find((lang) => lang.code === locale)?.nameKey || 'common.languages.english';

  // Xử lý khi click ra ngoài dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Xử lý khi chọn ngôn ngữ
  const handleSelectLanguage = (code: string) => {
    if (code !== locale) {
      changeLocale(code);
    }
    setIsOpen(false);
  };

  // Styles dựa vào biến thể (variant)
  const buttonClass =
    variant === 'auth'
      ? 'flex items-center gap-1 text-white hover:text-blue-100 px-3 py-2 text-xs font-medium'
      : 'flex items-center gap-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium';

  const dropdownClass =
    variant === 'auth'
      ? 'absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg overflow-hidden z-20 ring-1 ring-black ring-opacity-5 text-gray-700'
      : 'absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg overflow-hidden z-20 ring-1 ring-black ring-opacity-5';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={buttonClass}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.switchLanguageLabel')}
        aria-expanded={isOpen}
      >
        <span>{t(currentLanguageName)}</span>
        <ChevronDown className={`h-4 w-4 ${variant === 'auth' ? 'text-blue-100' : ''}`} />
      </button>

      {isOpen && (
        <div className={dropdownClass}>
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`${
                  language.code === locale
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-50'
                } block w-full text-left px-4 py-2 text-sm`}
                onClick={() => handleSelectLanguage(language.code)}
              >
                {t(language.nameKey)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
