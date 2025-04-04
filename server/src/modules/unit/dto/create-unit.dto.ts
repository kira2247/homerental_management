import { ApiProperty } from '@nestjs/swagger';
import { UnitStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({
    description: 'Tên của đơn vị (căn hộ, phòng)',
    example: 'Căn hộ 101',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'ID của bất động sản mà đơn vị này thuộc về',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  propertyId: string;

  @ApiProperty({
    description: 'Tầng của đơn vị',
    example: 3,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  floor?: number;

  @ApiProperty({
    description: 'Diện tích của đơn vị (m²)',
    example: 45.5,
  })
  @IsNumber()
  @IsPositive()
  area: number;

  @ApiProperty({
    description: 'Số phòng ngủ',
    example: 2,
  })
  @IsNumber()
  @Min(0)
  bedrooms: number;

  @ApiProperty({
    description: 'Số phòng tắm',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  bathrooms: number;

  @ApiProperty({
    description: 'Giá thuê hàng tháng',
    example: 5000000,
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    description: 'Tiền đặt cọc',
    example: 10000000,
  })
  @IsNumber()
  @IsPositive()
  depositAmount: number;

  @ApiProperty({
    description: 'Trạng thái của đơn vị',
    enum: UnitStatus,
    default: UnitStatus.VACANT,
  })
  @IsEnum(UnitStatus)
  @IsOptional()
  status?: UnitStatus;

  @ApiProperty({
    description: 'Giá điện theo đơn vị (VND/kWh)',
    example: 3500,
  })
  @IsNumber()
  @IsPositive()
  electricityRate: number;

  @ApiProperty({
    description: 'Giá nước theo đơn vị (VND/m3)',
    example: 15000,
  })
  @IsNumber()
  @IsPositive()
  waterRate: number;

  @ApiProperty({
    description: 'Phí internet hàng tháng',
    example: 200000,
  })
  @IsNumber()
  @IsPositive()
  internetRate: number;

  @ApiProperty({
    description: 'Phí rác hàng tháng',
    example: 100000,
  })
  @IsNumber()
  @IsPositive()
  garbageRate: number;

  @ApiProperty({
    description: 'Phí bảo trì hàng tháng',
    example: 50000,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  maintenanceFee?: number;

  @ApiProperty({
    description: 'Các khoản phí khác (dạng JSON)',
    example: { securityFee: 100000, elevatorFee: 50000 },
    required: false,
  })
  @IsObject()
  @IsOptional()
  otherFees?: Record<string, any>;

  @ApiProperty({
    description: 'Có nội thất không',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasFurniture?: boolean;

  @ApiProperty({
    description: 'Có điều hòa không',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasAirCon?: boolean;

  @ApiProperty({
    description: 'Có máy nước nóng không',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasWaterHeater?: boolean;

  @ApiProperty({
    description: 'Có ban công không',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  hasBalcony?: boolean;

  @ApiProperty({
    description: 'Chi tiết về nội thất (dạng JSON)',
    example: {
      beds: 2,
      tables: 1,
      chairs: 4,
      sofas: 1,
      tvs: 1,
      refrigerators: 1,
    },
    required: false,
  })
  @IsObject()
  @IsOptional()
  furnitureDetails?: Record<string, any>;

  @ApiProperty({
    description: 'Có quản lý tiện ích không',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  hasUtilityManagement?: boolean;

  @ApiProperty({
    description: 'Có đồng hồ điện riêng không',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  hasSeparateElectricMeter?: boolean;

  @ApiProperty({
    description: 'Có đồng hồ nước riêng không',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  hasSeparateWaterMeter?: boolean;

  @ApiProperty({
    description: 'Sử dụng giá điện bậc thang',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  usesTieredElectricityPricing?: boolean;

  @ApiProperty({
    description: 'Bậc giá điện (nếu sử dụng giá điện bậc thang)',
    example: [
      { limit: 50, rate: 1678 },
      { limit: 100, rate: 1734 },
      { limit: 200, rate: 2014 },
      { limit: 300, rate: 2536 },
      { limit: 400, rate: 2834 },
      { limit: Infinity, rate: 2927 },
    ],
    required: false,
  })
  @IsObject()
  @IsOptional()
  electricityTiers?: Record<string, any>;

  @ApiProperty({
    description: 'Chỉ số điện ban đầu',
    example: 1000,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  initialElectricityReading?: number;

  @ApiProperty({
    description: 'Chỉ số nước ban đầu',
    example: 50,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  initialWaterReading?: number;

  @ApiProperty({
    description: 'Ngày ghi nhận chỉ số ban đầu',
    example: '2023-03-26T00:00:00.000Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  initialReadingDate?: string;
} 