import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateBillDto } from './create-bill.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class UpdateBillDto extends PartialType(OmitType(CreateBillDto, ['unitId'])) {
  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Trạng thái thanh toán' })
  isPaid?: boolean;

  @IsOptional()
  @IsEnum(PaymentMethod)
  @ApiPropertyOptional({ 
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    enumName: 'PaymentMethod'
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Xác nhận đã nhận tiền' })
  paymentConfirmed?: boolean;
} 