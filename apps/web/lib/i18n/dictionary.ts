import { TranslationDictionary } from './types';
import { common } from './translations/common-translations';
import { auth } from './translations/auth-translations';
import { dashboard } from './translations/dashboard-translations';
import { properties } from './translations/properties-translations';
import { errors } from './translations/errors-translations';
import { unitsTranslations } from './translations/units-translations';

export const dictionary: TranslationDictionary = {
  common,
  auth,
  dashboard,
  properties,
  errors,
  units: unitsTranslations
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