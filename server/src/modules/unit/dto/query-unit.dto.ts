import { ApiProperty } from '@nestjs/swagger';
import { UnitStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class QueryUnitDto {
  @ApiProperty({
    description: 'Số trang',
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Số lượng bản ghi mỗi trang',
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'ID của bất động sản',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({
    description: 'Trạng thái của đơn vị',
    enum: UnitStatus,
    required: false,
  })
  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;

  @ApiProperty({
    description: 'Tìm kiếm theo tên đơn vị',
    required: false,
    example: 'Căn hộ',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Sắp xếp theo giá thuê tăng dần',
    required: false,
    example: false,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  sortByPriceAsc?: boolean;

  @ApiProperty({
    description: 'Lọc theo giá thuê tối thiểu',
    required: false,
    example: 5000000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;

  @ApiProperty({
    description: 'Lọc theo giá thuê tối đa',
    required: false,
    example: 10000000,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({
    description: 'Lọc theo diện tích tối thiểu (m²)',
    required: false,
    example: 30,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minArea?: number;

  @ApiProperty({
    description: 'Lọc theo diện tích tối đa (m²)',
    required: false,
    example: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxArea?: number;

  @ApiProperty({
    description: 'Lọc theo số phòng ngủ',
    required: false,
    example: 2,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  bedrooms?: number;

  @ApiProperty({
    description: 'Lọc theo số phòng tắm',
    required: false,
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  bathrooms?: number;

  @ApiProperty({
    description: 'Lọc theo tầng',
    required: false,
    example: 3,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  floor?: number;

  @ApiProperty({
    description: 'Lọc theo đơn vị có nội thất',
    required: false,
    example: true,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  hasFurniture?: boolean;

  @ApiProperty({
    description: 'Lọc theo đơn vị có điều hòa',
    required: false,
    example: true,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  hasAirCon?: boolean;

  @ApiProperty({
    description: 'Lọc theo đơn vị có máy nước nóng',
    required: false,
    example: true,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  hasWaterHeater?: boolean;

  @ApiProperty({
    description: 'Lọc theo đơn vị có ban công',
    required: false,
    example: true,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  hasBalcony?: boolean;
} 