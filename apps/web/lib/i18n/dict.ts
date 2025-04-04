import { TranslationDictionary } from './types';
import { common } from './translations/common';
import { auth } from './translations/auth';
import { dashboard } from './translations/dashboard';
import { properties } from './translations/properties';
import { errors } from './translations/errors';

export const dictionary: TranslationDictionary = {
  common,
  auth,
  dashboard,
  properties,
  errors
}; 

export const i18n = {
  defaultLocale: 'vi',
  locales: ['vi', 'en'],
};

/**
 * Dictionary object containing all text strings used in the application
 * Each key has translations for English and Vietnamese
 * 
 * Formatting rules:
 * - Vietnamese translations should have the first letter of each word capitalized
 * - Example: "Đăng Nhập" instead of "đăng nhập" or "Đăng nhập"
 */