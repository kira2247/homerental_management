import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Exclude, Transform, Type } from 'class-transformer';
import { AdditionalFeeDto, ElectricityTierDto } from './create-bill.dto';

export class BillResponseDto {
  @ApiProperty({ description: 'ID của hóa đơn' })
  id: string;

  @ApiProperty({ description: 'Số hóa đơn' })
  billNumber: string;

  @ApiProperty({ description: 'Ngày tạo hóa đơn' })
  billDate: Date;

  @ApiProperty({ description: 'Ngày đến hạn thanh toán' })
  dueDate: Date;

  @ApiProperty({ description: 'Tổng số tiền hóa đơn' })
  totalAmount: number;

  @ApiProperty({ description: 'Trạng thái thanh toán' })
  isPaid: boolean;

  @ApiPropertyOptional({ description: 'Ngày thanh toán', required: false })
  paymentDate?: Date;

  @ApiPropertyOptional({ 
    description: 'Phương thức thanh toán', 
    required: false,
    enum: PaymentMethod,
    enumName: 'PaymentMethod'
  })
  paymentMethod?: PaymentMethod;

  @ApiProperty({ description: 'Xác nhận đã nhận tiền' })
  paymentConfirmed: boolean;

  @ApiPropertyOptional({ description: 'Ghi chú thanh toán', required: false })
  paymentNotes?: string;

  @ApiProperty({ description: 'Tiền thuê phòng' })
  rentAmount: number;

  @ApiPropertyOptional({ description: 'Chỉ số điện kỳ trước', required: false })
  electricityPreviousReading?: number;

  @ApiPropertyOptional({ description: 'Chỉ số điện hiện tại', required: false })
  electricityCurrentReading?: number;

  @ApiPropertyOptional({ description: 'Lượng điện tiêu thụ', required: false })
  electricityConsumption?: number;

  @ApiPropertyOptional({ description: 'Đơn giá điện', required: false })
  electricityRate?: number;

  @ApiPropertyOptional({ description: 'Tổng tiền điện', required: false })
  electricityAmount?: number;

  @ApiProperty({ description: 'Sử dụng giá điện bậc thang' })
  usesTieredPricing: boolean;

  @ApiPropertyOptional({ 
    description: 'Chi tiết giá điện bậc thang', 
    required: false,
    type: [ElectricityTierDto] 
  })
  electricityTierDetails?: ElectricityTierDto[];

  @ApiPropertyOptional({ description: 'Chỉ số nước kỳ trước', required: false })
  waterPreviousReading?: number;

  @ApiPropertyOptional({ description: 'Chỉ số nước hiện tại', required: false })
  waterCurrentReading?: number;

  @ApiPropertyOptional({ description: 'Lượng nước tiêu thụ', required: false })
  waterConsumption?: number;

  @ApiPropertyOptional({ description: 'Đơn giá nước', required: false })
  waterRate?: number;

  @ApiPropertyOptional({ description: 'Tổng tiền nước', required: false })
  waterAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Các khoản phí bổ sung', 
    required: false,
    type: [AdditionalFeeDto] 
  })
  additionalFees?: AdditionalFeeDto[];

  @ApiPropertyOptional({ description: 'ID mẫu hóa đơn', required: false })
  templateId?: string;

  @ApiPropertyOptional({ description: 'Ghi chú chung cho hóa đơn', required: false })
  notes?: string;

  @ApiPropertyOptional({ description: 'Phương thức gửi hóa đơn', required: false })
  sentVia?: string;

  @ApiPropertyOptional({ description: 'Thời gian gửi hóa đơn', required: false })
  sentAt?: Date;

  @ApiProperty({ description: 'ID của property' })
  propertyId: string;

  @ApiProperty({ description: 'ID của unit' })
  unitId: string;

  @ApiPropertyOptional({ description: 'ID của tenant', required: false })
  tenantId?: string;

  @ApiProperty({ description: 'ID của người tạo hóa đơn' })
  createdById: string;

  @ApiProperty({ description: 'Thời gian tạo' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật gần nhất' })
  updatedAt: Date;
} 