/**
 * Supported currencies in the application
 */
export enum SupportedCurrency {
  VND = 'VND',
  USD = 'USD',
}

/**
 * Exchange rate data structure
 */
export interface ExchangeRate {
  base: SupportedCurrency;
  date: string;
  rates: Record<SupportedCurrency, number>;
}

/**
 * Currency conversion options
 */
export interface ConversionOptions {
  /**
   * Format the result as a string (e.g., "$1,234.56" or "1.234.567 ₫")
   */
  format?: boolean;
  
  /**
   * Round to specified number of decimal places
   */
  decimals?: number;
}

/**
 * Currency configuration
 */
export interface CurrencyConfig {
  /**
   * Symbol used for the currency (e.g., "$", "₫")
   */
  symbol: string;
  
  /**
   * Default decimal places to show for this currency
   */
  decimals: number;
  
  /**
   * Symbol position (before or after the amount)
   */
  symbolPosition: 'before' | 'after';
  
  /**
   * Thousands separator
   */
  thousandsSeparator: string;
  
  /**
   * Decimal separator
   */
  decimalSeparator: string;
}

/**
 * Currency preference settings for a user
 */
export interface CurrencyPreference {
  /**
   * The user's preferred currency
   */
  preferredCurrency: SupportedCurrency;

  /**
   * Whether to automatically convert amounts to preferred currency
   */
  autoConvert: boolean;
} 