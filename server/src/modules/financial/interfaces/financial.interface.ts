import { SupportedCurrency } from '../../currency/interfaces/currency.interface';

/**
 * Interface cho giao dịch tài chính có hỗ trợ đa tiền tệ
 */
export interface FinancialTransaction {
  id: string;
  amount: number;
  currency: SupportedCurrency;
  date: Date;
  description?: string;
  type: TransactionType;
}

/**
 * Loại giao dịch tài chính
 */
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

/**
 * Cài đặt hiển thị tài chính
 */
export interface FinancialDisplaySetting {
  /**
   * Hiển thị số tiền theo tiền tệ ưa thích
   */
  displayInPreferredCurrency: boolean;
  
  /**
   * Tiền tệ mặc định cho các giao dịch mới
   */
  defaultCurrency: SupportedCurrency;
  
  /**
   * Tự động chuyển đổi giữa các loại tiền tệ
   */
  autoConvert: boolean;
}

/**
 * Kết quả tài chính với thông tin đa tiền tệ
 */
export interface MultiCurrencyFinancialResult {
  /**
   * Số tiền gốc
   */
  originalAmount: number;
  
  /**
   * Tiền tệ gốc
   */
  originalCurrency: SupportedCurrency;
  
  /**
   * Số tiền đã chuyển đổi (nếu có)
   */
  convertedAmount?: number;
  
  /**
   * Tiền tệ đã chuyển đổi (nếu có)
   */
  convertedCurrency?: SupportedCurrency;
  
  /**
   * Số tiền đã định dạng (dưới dạng chuỗi)
   */
  formattedAmount: string;
} 