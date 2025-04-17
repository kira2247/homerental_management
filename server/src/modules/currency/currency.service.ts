import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { 
  ConversionOptions, 
  CurrencyPreference, 
  ExchangeRate, 
  SupportedCurrency 
} from './interfaces/currency.interface';
import { 
  BASE_CURRENCY, 
  CURRENCY_CONFIG, 
  DEFAULT_CURRENCY_PREFERENCE, 
  EXCHANGE_RATE_API_URL, 
  EXCHANGE_RATE_CACHE_TTL 
} from './config/currency.config';
import { UpdateExchangeRateDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CurrencyService implements OnModuleInit {
  private exchangeRates: ExchangeRate;
  private lastFetched: Date;
  private readonly logger = new Logger(CurrencyService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Initialize the service
   */
  async onModuleInit() {
    await this.fetchExchangeRates();
  }

  /**
   * Fetch latest exchange rates from the API
   */
  async fetchExchangeRates(): Promise<ExchangeRate> {
    try {
      const apiUrl = this.configService.get<string>('EXCHANGE_RATE_API_URL') || EXCHANGE_RATE_API_URL;
      
      const { data } = await lastValueFrom(this.httpService.get(apiUrl));
      
      // Format the response to match our ExchangeRate interface
      this.exchangeRates = {
        base: data.base as SupportedCurrency,
        date: data.date || new Date().toISOString().split('T')[0],
        rates: data.rates || {},
      };
      
      this.lastFetched = new Date();
      return this.exchangeRates;
    } catch (error) {
      this.logger.error(`Failed to fetch exchange rates: ${error.message}`);
      
      // If we failed to fetch, but have existing rates, return those
      if (this.exchangeRates) {
        return this.exchangeRates;
      }
      
      // Otherwise, return a default rate with at least our supported currencies
      return {
        base: BASE_CURRENCY,
        date: new Date().toISOString().split('T')[0],
        rates: {
          [SupportedCurrency.VND]: 1,
          [SupportedCurrency.USD]: 0.000043, // Approximate fallback rate
        },
      };
    }
  }

  /**
   * Get current exchange rates
   */
  async getExchangeRates(): Promise<ExchangeRate> {
    // If rates are expired or don't exist, fetch new ones
    if (!this.exchangeRates || this.isRatesExpired()) {
      return this.fetchExchangeRates();
    }
    return this.exchangeRates;
  }

  /**
   * Update exchange rates manually (admin only)
   */
  updateExchangeRates(updateRatesDto: UpdateExchangeRateDto): ExchangeRate {
    this.exchangeRates = {
      base: updateRatesDto.base,
      date: new Date().toISOString().split('T')[0],
      rates: updateRatesDto.rates,
    };
    this.lastFetched = new Date();
    return this.exchangeRates;
  }

  /**
   * Convert amount from one currency to another
   */
  async convert(
    amount: number,
    from: SupportedCurrency = BASE_CURRENCY,
    to: SupportedCurrency = BASE_CURRENCY,
    options: ConversionOptions = {},
  ): Promise<number | string> {
    // Get fresh rates if necessary
    const rates = await this.getExchangeRates();
    
    // If same currency, no conversion needed
    if (from === to) {
      return options.format 
        ? this.formatCurrency(amount, to, options.decimals) 
        : amount;
    }
    
    // Convert to base currency first (if not already)
    let valueInBaseCurrency = amount;
    if (from !== rates.base) {
      const fromRate = rates.rates[from];
      valueInBaseCurrency = amount / fromRate;
    }
    
    // Then convert from base to target currency
    let result = valueInBaseCurrency;
    if (rates.base !== to) {
      const toRate = rates.rates[to];
      result = valueInBaseCurrency * toRate;
    }
    
    // Format if requested
    return options.format 
      ? this.formatCurrency(result, to, options.decimals) 
      : result;
  }

  /**
   * Format a currency amount according to locale settings
   */
  formatCurrency(amount: number, currency: SupportedCurrency, decimals?: number): string {
    const config = CURRENCY_CONFIG[currency];
    const roundedAmount = this.roundAmount(amount, decimals ?? config.decimals);
    
    // Format with appropriate separators
    const parts = roundedAmount.toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandsSeparator);
    
    let formattedAmount = integerPart;
    if (parts.length > 1) {
      formattedAmount += config.decimalSeparator + parts[1];
    } else if (decimals || config.decimals > 0) {
      formattedAmount += config.decimalSeparator + '0'.repeat(decimals ?? config.decimals);
    }
    
    // Add symbol in correct position
    return config.symbolPosition === 'before' 
      ? `${config.symbol}${formattedAmount}` 
      : `${formattedAmount} ${config.symbol}`;
  }

  /**
   * Round amount to specified decimal places
   */
  private roundAmount(amount: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(amount * factor) / factor;
  }

  /**
   * Check if cached rates are expired
   */
  private isRatesExpired(): boolean {
    if (!this.lastFetched) return true;
    
    const now = new Date();
    const elapsed = now.getTime() - this.lastFetched.getTime();
    return elapsed > EXCHANGE_RATE_CACHE_TTL;
  }

  /**
   * Get currency preferences for a user
   */
  async getUserCurrencyPreference(userId: string): Promise<CurrencyPreference> {
    // Check for user preference in database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currencyPreference: true }
    });
    
    // Return user preference if it exists
    if (user?.currencyPreference) {
      const preference = user.currencyPreference as Prisma.JsonValue;
      // Convert from JSON format to CurrencyPreference
      return {
        preferredCurrency: (preference as any).preferredCurrency as SupportedCurrency,
        autoConvert: (preference as any).autoConvert as boolean,
      };
    }
    
    // Otherwise return default
    return DEFAULT_CURRENCY_PREFERENCE;
  }

  /**
   * Set currency preferences for a user
   */
  async setUserCurrencyPreference(
    userId: string, 
    preference: CurrencyPreference
  ): Promise<CurrencyPreference> {
    // Update user preference in database
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { 
        currencyPreference: preference as unknown as Prisma.InputJsonValue
      },
      select: { 
        currencyPreference: true 
      }
    });
    
    const savedPreference = updatedUser.currencyPreference as Prisma.JsonValue;
    return {
      preferredCurrency: (savedPreference as any).preferredCurrency as SupportedCurrency,
      autoConvert: (savedPreference as any).autoConvert as boolean,
    };
  }
}
