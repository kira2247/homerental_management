import { SupportedCurrency } from '../../../currency/interfaces/currency.interface';

export const createMockCurrencyService = () => {
  return {
    getExchangeRates: jest.fn().mockResolvedValue({
      base: SupportedCurrency.VND,
      date: '2023-03-28',
      rates: {
        [SupportedCurrency.VND]: 1,
        [SupportedCurrency.USD]: 0.000043
      }
    }),
    convert: jest.fn().mockImplementation((amount, from, to) => {
      if (from === to) {
        return amount;
      }
      if (from === SupportedCurrency.VND && to === SupportedCurrency.USD) {
        return amount * 0.000043;
      }
      if (from === SupportedCurrency.USD && to === SupportedCurrency.VND) {
        return amount * 23255.81;
      }
      return amount;
    }),
    formatCurrency: jest.fn().mockImplementation((amount, currency) => {
      if (currency === SupportedCurrency.VND) {
        return `${amount.toLocaleString('vi-VN')} ₫`;
      } else {
        return `$${amount.toLocaleString('en-US')}`;
      }
    }),
    getUserCurrencyPreference: jest.fn().mockResolvedValue({
      preferredCurrency: SupportedCurrency.VND,
      autoConvert: true
    }),
    setUserCurrencyPreference: jest.fn().mockResolvedValue({
      preferredCurrency: SupportedCurrency.VND,
      autoConvert: true
    })
  };
}; 