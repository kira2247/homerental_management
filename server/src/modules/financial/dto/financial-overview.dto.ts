import { IsEnum, IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFilterDto } from './base-filter.dto';
import { IsTimePeriod } from '../validators/is-time-period.validator';
import { SupportedCurrency } from '../../currency/interfaces/currency.interface';

/**
 * Financial overview response DTO
 */
export class FinancialOverviewDto {
  @ApiProperty({ description: 'Tổng doanh thu trong kỳ' })
  totalRevenue: number;
  
  @ApiProperty({ description: 'Phần trăm thay đổi doanh thu so với kỳ trước' })
  revenueChange: number;
  
  @ApiProperty({ description: 'Tổng chi phí trong kỳ' })
  totalExpenses: number;
  
  @ApiProperty({ description: 'Phần trăm thay đổi chi phí so với kỳ trước' })
  expenseChange: number;
  
  @ApiProperty({ description: 'Lợi nhuận ròng (doanh thu - chi phí)' })
  netProfit: number;
  
  @ApiProperty({ description: 'Phần trăm thay đổi lợi nhuận so với kỳ trước' })
  profitChange: number;
  
  @ApiProperty({ description: 'Dữ liệu biểu đồ theo thời gian' })
  chartData: {
    income: number[];
    expense: number[];
    profit: number[];
    labels: string[];
  };
  
  @ApiProperty({ description: 'Currency used for amounts', enum: SupportedCurrency })
  currency: SupportedCurrency;
  
  @ApiProperty({ description: 'Original currency before conversion', enum: SupportedCurrency, required: false })
  originalCurrency?: SupportedCurrency;
}

/**
 * Filter DTO for financial overview
 */
export class FinancialOverviewFilterDto extends BaseFilterDto {
  @ApiProperty({ 
    description: 'Ngày bắt đầu (định dạng YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ 
    description: 'Ngày kết thúc (định dạng YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ 
    description: 'So sánh với kỳ trước đó', 
    default: true, 
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  compareWithPrevious?: boolean = true;

  @ApiProperty({
    description: 'Filter by time period',
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    default: 'month',
  })
  @IsOptional()
  @IsTimePeriod()
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month';
  
  @ApiProperty({
    description: 'Convert amounts to the specified currency',
    enum: SupportedCurrency,
    required: false,
  })
  @IsOptional()
  @IsEnum(SupportedCurrency)
  currency?: SupportedCurrency;
  
  @ApiProperty({
    description: 'Convert to user preferred currency',
    default: true,
    required: false,
  })
  @IsOptional()
  convertToPreferred?: boolean = true;
}

/**
 * Financial chart data structure
 */
export class FinancialChartDto {
  @ApiProperty({ description: 'Income data points', type: [Number] })
  income: number[];

  @ApiProperty({ description: 'Expense data points', type: [Number] })
  expense: number[];

  @ApiProperty({ description: 'Profit data points', type: [Number] })
  profit: number[];

  @ApiProperty({ description: 'Chart labels', type: [String] })
  labels: string[];
} 