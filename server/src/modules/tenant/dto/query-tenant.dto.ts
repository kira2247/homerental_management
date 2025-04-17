import { ApiProperty } from '@nestjs/swagger';
import { IdentityType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class QueryTenantDto {
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
    description: 'Tìm kiếm theo tên, email, số điện thoại, số CMND/CCCD',
    required: false,
    example: 'Nguyễn',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Lọc theo loại giấy tờ',
    enum: IdentityType,
    required: false,
  })
  @IsEnum(IdentityType)
  @IsOptional()
  identityType?: IdentityType;

  @ApiProperty({
    description: 'Sắp xếp theo ngày tạo mới nhất',
    required: false,
    default: true,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  sortByLatest?: boolean = true;

  @ApiProperty({
    description: 'Lọc theo ngày tạo từ',
    required: false,
    example: '2023-01-01',
  })
  @IsDateString()
  @IsOptional()
  createdFrom?: string;

  @ApiProperty({
    description: 'Lọc theo ngày tạo đến',
    required: false,
    example: '2023-12-31',
  })
  @IsDateString()
  @IsOptional()
  createdTo?: string;

  @ApiProperty({
    description: 'Lọc theo unitId (đang thuê đơn vị nào)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  unitId?: string;

  @ApiProperty({
    description: 'Lọc theo propertyId (đang thuê trong tòa nhà nào)',
    required: false,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({
    description: 'Chỉ lấy các tenant đang thuê (còn hợp đồng active)',
    required: false,
    default: false,
  })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  activeOnly?: boolean;
} 