import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { SupportedCurrency } from '../interfaces/currency.interface';

/**
 * DTO for setting user currency preferences
 */
export class SetCurrencyPreferenceDto {
  @ApiProperty({
    description: 'Preferred currency for display',
    enum: SupportedCurrency,
    example: SupportedCurrency.VND,
  })
  @IsEnum(SupportedCurrency)
  preferredCurrency: SupportedCurrency;

  @ApiProperty({
    description: 'Automatically convert amounts to preferred currency',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  autoConvert?: boolean = true;
}

/**
 * Response DTO for currency preferences
 */
export class CurrencyPreferenceResponseDto {
  @ApiProperty({
    description: 'Preferred currency for display',
    enum: SupportedCurrency,
    example: SupportedCurrency.VND,
  })
  preferredCurrency: SupportedCurrency;

  @ApiProperty({
    description: 'Automatically convert amounts to preferred currency',
    example: true,
  })
  autoConvert: boolean;
}

/**
 * DTO for currency conversion request
 */
export class ConvertCurrencyDto {
  @ApiProperty({
    description: 'Amount to convert',
    example: 1000000,
  })
  amount: number;

  @ApiProperty({
    description: 'Source currency',
    enum: SupportedCurrency,
    example: SupportedCurrency.VND,
  })
  @IsEnum(SupportedCurrency)
  from: SupportedCurrency;

  @ApiProperty({
    description: 'Target currency',
    enum: SupportedCurrency,
    example: SupportedCurrency.USD,
  })
  @IsEnum(SupportedCurrency)
  to: SupportedCurrency;

  @ApiProperty({
    description: 'Format the result as a string',
    example: true,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  format?: boolean = false;

  @ApiProperty({
    description: 'Number of decimal places',
    example: 2,
    required: false,
  })
  @IsOptional()
  decimals?: number;
} 