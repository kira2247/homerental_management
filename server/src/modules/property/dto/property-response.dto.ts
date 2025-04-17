import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus, PropertyType } from '@prisma/client';

export class PropertyResponseDto {
  @ApiProperty({ description: 'ID của property', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Tên property', example: 'Chung cư Mỹ Đình' })
  name: string;

  @ApiProperty({ description: 'Địa chỉ', example: '123 Nguyễn Văn Linh' })
  address: string;

  @ApiProperty({ description: 'Thành phố', example: 'Hà Nội' })
  city: string;

  @ApiProperty({ description: 'Quận/Huyện', example: 'Nam Từ Liêm' })
  district: string;

  @ApiPropertyOptional({ description: 'Phường/Xã', example: 'Mỹ Đình' })
  ward?: string;

  @ApiProperty({
    description: 'Loại bất động sản',
    enum: PropertyType,
    example: PropertyType.APARTMENT,
  })
  type: PropertyType;

  @ApiProperty({
    description: 'Trạng thái bất động sản',
    enum: PropertyStatus,
    example: PropertyStatus.AVAILABLE,
  })
  status: PropertyStatus;

  @ApiProperty({
    description: 'Giá điện mặc định (VND/kWh)',
    example: 3500,
  })
  defaultElectricityRate: number;

  @ApiProperty({
    description: 'Giá nước mặc định (VND/m3)',
    example: 20000,
  })
  defaultWaterRate: number;

  @ApiProperty({
    description: 'Giá internet mặc định (VND/tháng)',
    example: 200000,
  })
  defaultInternetRate: number;

  @ApiProperty({
    description: 'Phí rác mặc định (VND/tháng)',
    example: 50000,
  })
  defaultGarbageRate: number;

  @ApiPropertyOptional({
    description: 'Các phí khác mặc định',
    example: { cleaning: 100000, security: 150000 },
  })
  defaultOtherFees?: Record<string, any>;

  @ApiProperty({
    description: 'Có dịch vụ bảo vệ không',
    example: true,
  })
  hasSecurity: boolean;

  @ApiProperty({
    description: 'Có thang máy không',
    example: true,
  })
  hasElevator: boolean;

  @ApiProperty({
    description: 'Có bãi đỗ xe không',
    example: true,
  })
  hasParking: boolean;

  @ApiPropertyOptional({
    description: 'Phí đỗ xe (VND/tháng)',
    example: 200000,
  })
  parkingFee?: number;

  @ApiPropertyOptional({
    description: 'Các tiện ích bổ sung',
    example: { gym: true, pool: true, playground: false },
  })
  additionalFacilities?: Record<string, any>;

  @ApiProperty({
    description: 'ID của người tạo bất động sản',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'ID của chủ sở hữu bất động sản',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  ownerId: string;

  @ApiProperty({
    description: 'Ngày tạo',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật gần nhất',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Tổng số đơn vị (units) trong property',
    example: 10,
  })
  unitCount?: number;

  @ApiPropertyOptional({
    description: 'Tổng số đơn vị đang trống',
    example: 3,
  })
  vacantUnitCount?: number;

  @ApiPropertyOptional({
    description: 'Tổng doanh thu ước tính mỗi tháng',
    example: 30000000,
  })
  estimatedMonthlyRevenue?: number;

  @ApiPropertyOptional({
    description: 'public_id của thumbnail trên Cloudinary',
    example: 'rental-management/image/properties/1a38e39c-2666-43ac-8c86-65563bd615c1/thumbnail/file_xfzupz',
  })
  thumbnailId?: string;
}