import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BaseFilterDto } from './base-filter.dto';

/**
 * Property distribution by type response
 */
export class PropertyDistributionItemDto {
  @ApiProperty({ description: 'ID của loại bất động sản' })
  id: string;
  
  @ApiProperty({ description: 'Tên loại bất động sản' })
  name: string;
  
  @ApiProperty({ description: 'Doanh thu từ loại bất động sản' })
  revenue: number;
  
  @ApiProperty({ description: 'Chi phí của loại bất động sản' })
  expenses: number;
  
  @ApiProperty({ description: 'Lợi nhuận của loại bất động sản (doanh thu - chi phí)' })
  profit: number;
  
  @ApiProperty({ description: 'Phần trăm đóng góp vào tổng doanh thu' })
  percentage: number;
  
  @ApiProperty({ description: 'Số lượng đơn vị thuộc loại bất động sản này' })
  unitCount: number;
}

/**
 * Property distribution response DTO
 */
export class PropertyDistributionDto {
  @ApiProperty({ description: 'Danh sách thông tin phân bố theo loại bất động sản', type: [PropertyDistributionItemDto] })
  items: PropertyDistributionItemDto[];
  
  @ApiProperty({ description: 'Tổng số bất động sản' })
  totalProperties: number;
  
  @ApiProperty({ description: 'Tổng số đơn vị' })
  totalUnits: number;
  
  @ApiProperty({ description: 'Tổng doanh thu' })
  totalRevenue: number;
}

/**
 * Filter DTO for property distribution
 */
export class PropertyDistributionFilterDto extends BaseFilterDto {
  @ApiProperty({
    description: 'Loại bất động sản để lọc dữ liệu',
    required: false,
    enum: ['APARTMENT', 'HOUSE', 'COMMERCIAL', 'OFFICE', 'WAREHOUSE']
  })
  @IsEnum(['APARTMENT', 'HOUSE', 'COMMERCIAL', 'OFFICE', 'WAREHOUSE'])
  @IsOptional()
  type?: string;
  
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
} 