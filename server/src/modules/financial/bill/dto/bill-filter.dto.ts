import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class BillFilterDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID của property' })
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID của unit' })
  unitId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID của tenant' })
  tenantId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc từ ngày (billDate)' })
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc đến ngày (billDate)' })
  toDate?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @ApiPropertyOptional({ description: 'Lọc theo trạng thái thanh toán' })
  isPaid?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Tìm kiếm theo bill number' })
  search?: string;
} 