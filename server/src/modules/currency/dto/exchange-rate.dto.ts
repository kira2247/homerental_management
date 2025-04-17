import { ApiProperty } from '@nestjs/swagger';
import { SupportedCurrency } from '../interfaces/currency.interface';

/**
 * Exchange rate response DTO
 */
export class ExchangeRateResponseDto {
  @ApiProperty({
    description: 'Base currency for the exchange rates',
    enum: SupportedCurrency,
    example: SupportedCurrency.VND,
  })
  base: SupportedCurrency;

  @ApiProperty({
    description: 'Date when rates were fetched',
    example: '2023-04-07',
  })
  date: string;

  @ApiProperty({
    description: 'Exchange rates for all supported currencies',
    example: {
      VND: 1,
      USD: 0.000043,
    },
  })
  rates: Record<SupportedCurrency, number>;
}

/**
 * DTO for updating exchange rates manually
 */
export class UpdateExchangeRateDto {
  @ApiProperty({
    description: 'Base currency for the exchange rates',
    enum: SupportedCurrency,
    example: SupportedCurrency.VND,
  })
  base: SupportedCurrency;

  @ApiProperty({
    description: 'Exchange rates for all supported currencies',
    example: {
      VND: 1,
      USD: 0.000043,
    },
  })
  rates: Record<SupportedCurrency, number>;
} 