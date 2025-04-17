import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsString, IsDateString } from 'class-validator';
import { MaintenanceStatus, Priority } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryMaintenanceDto {
  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lọc theo ID bất động sản' })
  propertyId?: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Lọc theo ID phòng/căn hộ' })
  unitId?: string;

  @IsEnum(MaintenanceStatus, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Lọc theo trạng thái', 
    isArray: true,
    enum: MaintenanceStatus
  })
  status?: MaintenanceStatus[];

  @IsEnum(Priority, { each: true })
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Lọc theo mức độ ưu tiên', 
    isArray: true,
    enum: Priority
  })
  priority?: Priority[];

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc từ ngày yêu cầu' })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc đến ngày yêu cầu' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Số bản ghi trên mỗi trang', default: 10 })
  limit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Số trang', default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Sắp xếp theo trường', default: 'createdAt' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Thứ tự sắp xếp', default: 'desc', enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc' = 'desc';
} 