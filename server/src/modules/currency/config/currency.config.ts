import { CurrencyConfig, SupportedCurrency } from '../interfaces/currency.interface';

/**
 * Configuration for all supported currencies in the application
 */
export const CURRENCY_CONFIG: Record<SupportedCurrency, CurrencyConfig> = {
  [SupportedCurrency.VND]: {
    symbol: '₫',
    decimals: 0,
    symbolPosition: 'after',
    thousandsSeparator: '.',
    decimalSeparator: ',',
  },
  [SupportedCurrency.USD]: {
    symbol: '$',
    decimals: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
  },
};

/**
 * Default exchange rate API URL
 * Using example API for now, should be replaced with a real API in production
 */
export const EXCHANGE_RATE_API_URL = 'https://api.exchangerate-api.com/v4/latest/VND';

/**
 * Base currency of the application for storing values
 */
export const BASE_CURRENCY = SupportedCurrency.VND;

/**
 * Default user currency preference
 */
export const DEFAULT_CURRENCY_PREFERENCE = {
  preferredCurrency: SupportedCurrency.VND,
  autoConvert: true,
};

/**
 * Cache expiration time for exchange rates (in milliseconds)
 */
export const EXCHANGE_RATE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours 