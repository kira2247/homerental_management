import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { 
  IsDateString, 
  IsEnum, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsPositive, 
  IsString, 
  IsUUID 
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID của hóa đơn',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  billId: string;

  @ApiProperty({
    description: 'Số tiền thanh toán',
    example: 1500000,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Ngày thanh toán',
    example: '2023-06-01',
  })
  @IsDateString()
  @IsNotEmpty()
  paymentDate: string;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Số tham chiếu giao dịch (mã giao dịch ngân hàng...)',
    example: 'FT23152987651',
  })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú về thanh toán',
    example: 'Thanh toán tiền thuê tháng 6/2023',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'URL hình ảnh chứng từ thanh toán',
    example: 'https://example.com/payments/receipt123.jpg',
  })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;
} 