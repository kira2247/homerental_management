import { IsArray, IsBoolean, IsDate, IsDateString, IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class AdditionalFeeDto {
  @IsString()
  @ApiProperty({ description: 'Tên khoản phí bổ sung' })
  name: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Số tiền của khoản phí', minimum: 0 })
  amount: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Ghi chú về khoản phí' })
  note?: string;
}

export class ElectricityTierDto {
  @IsNumber()
  @ApiProperty({ description: 'Ngưỡng tiêu thụ điện (kWh)' })
  limit: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Giá điện cho ngưỡng này (VND/kWh)', minimum: 0 })
  rate: number;
}

export class CreateBillDto {
  @IsDateString()
  @ApiProperty({ description: 'Ngày tạo hóa đơn' })
  billDate: string;

  @IsDateString()
  @ApiProperty({ description: 'Ngày đến hạn thanh toán' })
  dueDate: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Tiền thuê phòng', minimum: 0 })
  rentAmount: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Chỉ số điện kỳ trước' })
  electricityPreviousReading?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Chỉ số điện hiện tại' })
  electricityCurrentReading?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Đơn giá điện (VND/kWh)' })
  electricityRate?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Sử dụng giá điện bậc thang' })
  usesTieredPricing?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ElectricityTierDto)
  @ApiPropertyOptional({ description: 'Chi tiết giá điện bậc thang', type: [ElectricityTierDto] })
  electricityTierDetails?: ElectricityTierDto[];

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Chỉ số nước kỳ trước' })
  waterPreviousReading?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Chỉ số nước hiện tại' })
  waterCurrentReading?: number;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Đơn giá nước (VND/m3)' })
  waterRate?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalFeeDto)
  @ApiPropertyOptional({ description: 'Các khoản phí bổ sung', type: [AdditionalFeeDto] })
  additionalFees?: AdditionalFeeDto[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Ghi chú cho hóa đơn' })
  notes?: string;

  @IsUUID()
  @ApiProperty({ description: 'ID của đơn vị cho thuê' })
  unitId: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID của tenant (nếu có)' })
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID của mẫu hóa đơn' })
  templateId?: string;
} 