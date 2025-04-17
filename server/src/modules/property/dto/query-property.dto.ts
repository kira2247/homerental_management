import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { PropertyStatus, PropertyType } from '@prisma/client';

export class QueryPropertyDto {
  @ApiPropertyOptional({
    description: 'Trang cần lấy (bắt đầu từ 1)',
    default: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng property mỗi trang',
    default: 10,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên property',
    type: String,
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo thành phố',
    type: String,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo quận/huyện',
    type: String,
  })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái property',
    enum: PropertyStatus,
  })
  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @ApiPropertyOptional({
    description: 'Lọc theo loại property',
    enum: PropertyType,
  })
  @IsEnum(PropertyType)
  @IsOptional()
  type?: PropertyType;

  @ApiPropertyOptional({
    description: 'Lọc theo ID chủ sở hữu',
    type: String,
  })
  @IsUUID()
  @IsOptional()
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường (ví dụ: name, createdAt)',
    default: 'createdAt',
    type: String,
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp (asc: tăng dần, desc: giảm dần)',
    default: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
} 