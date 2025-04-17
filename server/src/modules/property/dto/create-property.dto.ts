import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsUUID,
  IsObject,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PropertyStatus, PropertyType } from '@prisma/client';

export class CreatePropertyDto {
  @ApiProperty({ description: 'Tên bất động sản', example: 'Chung cư Mỹ Đình' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Địa chỉ', example: '123 Nguyễn Văn Linh' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  address: string;

  @ApiProperty({ description: 'Thành phố', example: 'Hà Nội' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  city: string;

  @ApiProperty({ description: 'Quận/Huyện', example: 'Nam Từ Liêm' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  district: string;

  @ApiPropertyOptional({ description: 'Phường/Xã', example: 'Mỹ Đình' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  ward?: string;

  @ApiProperty({
    description: 'Loại bất động sản',
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  @IsEnum(PropertyType)
  type: PropertyType;

  @ApiProperty({
    description: 'Trạng thái bất động sản',
    enum: PropertyStatus,
    example: PropertyStatus.AVAILABLE,
    default: PropertyStatus.AVAILABLE,
  })
  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @ApiProperty({
    description: 'Giá điện mặc định (VND/kWh)',
    example: 3500,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  defaultElectricityRate?: number;

  @ApiProperty({
    description: 'Giá nước mặc định (VND/m3)',
    example: 20000,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  defaultWaterRate?: number;

  @ApiProperty({
    description: 'Giá internet mặc định (VND/tháng)',
    example: 200000,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  defaultInternetRate?: number;

  @ApiProperty({
    description: 'Phí rác mặc định (VND/tháng)',
    example: 50000,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  defaultGarbageRate?: number;

  @ApiPropertyOptional({
    description: 'Các phí khác mặc định',
    example: { cleaning: 100000, security: 150000 },
  })
  @IsObject()
  @IsOptional()
  defaultOtherFees?: Record<string, any>;

  @ApiProperty({
    description: 'Có dịch vụ bảo vệ không',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasSecurity?: boolean;

  @ApiProperty({
    description: 'Có thang máy không',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasElevator?: boolean;

  @ApiProperty({
    description: 'Có bãi đỗ xe không',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasParking?: boolean;

  @ApiPropertyOptional({
    description: 'Phí đỗ xe (VND/tháng)',
    example: 200000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  parkingFee?: number;

  @ApiPropertyOptional({
    description: 'Các tiện ích bổ sung',
    example: { gym: true, pool: true, playground: false },
  })
  @IsObject()
  @IsOptional()
  additionalFacilities?: Record<string, any>;

  @ApiProperty({
    description: 'ID của người tạo bất động sản',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'ID của chủ sở hữu bất động sản',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  ownerId: string;

  @ApiPropertyOptional({ description: 'URL hình ảnh đại diện' })
  @IsString()
  @IsOptional()
  thumbnail?: string;

  @ApiPropertyOptional({ description: 'public_id của thumbnail trên Cloudinary' })
  @IsString()
  @IsOptional()
  thumbnailId?: string;
} 