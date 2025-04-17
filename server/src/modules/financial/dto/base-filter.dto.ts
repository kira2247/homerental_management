import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Filter DTO with common filtering options
 */
export class BaseFilterDto {
  @ApiProperty({
    description: 'Khoảng thời gian cho dữ liệu',
    enum: ['day', 'week', 'month', 'quarter', 'year'],
    default: 'month',
    required: false
  })
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'])
  @IsOptional()
  period?: string = 'month';

  @ApiProperty({
    description: 'ID của bất động sản để lọc dữ liệu',
    required: false
  })
  @IsOptional()
  @IsString()
  propertyId?: string;
} 