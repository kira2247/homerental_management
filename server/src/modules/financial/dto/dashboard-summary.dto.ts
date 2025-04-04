import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFilterDto } from './base-filter.dto';

/**
 * Count with change percentage DTO
 */
export class CountWithChangeDto {
  @ApiProperty({ description: 'Số lượng' })
  count: number;
  
  @ApiProperty({ description: 'Phần trăm thay đổi so với kỳ trước' })
  change: number;
}

/**
 * Revenue with change percentage DTO
 */
export class RevenueWithChangeDto {
  @ApiProperty({ description: 'Số tiền' })
  amount: number;
  
  @ApiProperty({ description: 'Phần trăm thay đổi so với kỳ trước' })
  change: number;
}

/**
 * Financial status DTO
 */
export class FinancialStatusDto {
  @ApiProperty({ description: 'Số tiền quá hạn' })
  overdue: number;
  
  @ApiProperty({ description: 'Số tiền sắp đến hạn' })
  upcoming: number;
}

/**
 * Dashboard summary DTO
 */
export class DashboardSummaryDto {
  @ApiProperty({ description: 'Thông tin về bất động sản', type: CountWithChangeDto })
  properties: CountWithChangeDto;
  
  @ApiProperty({ description: 'Thông tin về đơn vị cho thuê', type: CountWithChangeDto })
  units: CountWithChangeDto;
  
  @ApiProperty({ description: 'Thông tin về người thuê', type: CountWithChangeDto })
  tenants: CountWithChangeDto;
  
  @ApiProperty({ description: 'Thông tin về doanh thu', type: RevenueWithChangeDto })
  revenue: RevenueWithChangeDto;
  
  @ApiProperty({ description: 'Số lượng khoản thanh toán đang chờ xử lý' })
  pendingPayments: number;
  
  @ApiProperty({ description: 'Tình hình tài chính (quá hạn và sắp đến hạn)', type: FinancialStatusDto })
  financialStatus: FinancialStatusDto;
}

/**
 * Filter DTO for dashboard summary
 */
export class DashboardSummaryFilterDto extends BaseFilterDto {
  @ApiProperty({
    description: 'Ngày bắt đầu khoảng thời gian tùy chỉnh (định dạng YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsString()
  startDate?: string;
  
  @ApiProperty({
    description: 'Ngày kết thúc khoảng thời gian tùy chỉnh (định dạng YYYY-MM-DD)',
    required: false
  })
  @IsOptional()
  @IsString()
  endDate?: string;
  
  @ApiProperty({
    description: 'Khoảng thời gian thống kê',
    required: false,
    enum: ['week', 'month', 'quarter', 'year'],
    default: 'month'
  })
  @IsOptional()
  @IsEnum(['week', 'month', 'quarter', 'year'])
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
} 