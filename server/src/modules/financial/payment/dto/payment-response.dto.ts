import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'ID của payment',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Số biên lai thanh toán',
    example: 'RCPT-202306-0001',
  })
  receiptNumber: string;

  @ApiProperty({
    description: 'Số tiền thanh toán',
    example: 1500000,
  })
  amount: number;

  @ApiProperty({
    description: 'Ngày thanh toán',
    example: '2023-06-01T00:00:00.000Z',
  })
  paymentDate: Date;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.BANK_TRANSFER,
  })
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Số tham chiếu giao dịch (mã giao dịch ngân hàng...)',
    example: 'FT23152987651',
  })
  referenceNumber?: string;

  @ApiProperty({
    description: 'Người xác nhận thanh toán',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Nguyễn Văn A',
    },
  })
  paymentConfirmedBy: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Thời gian xác nhận thanh toán',
    example: '2023-06-01T09:30:00.000Z',
  })
  paymentConfirmedAt: Date;

  @ApiPropertyOptional({
    description: 'Ghi chú về thanh toán',
    example: 'Thanh toán tiền thuê tháng 6/2023',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'URL hình ảnh chứng từ thanh toán',
    example: 'https://example.com/payments/receipt123.jpg',
  })
  attachmentUrl?: string;

  @ApiProperty({
    description: 'Thông tin hóa đơn được thanh toán',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      billNumber: 'BILL-202306-0001',
      totalAmount: 1500000,
      dueDate: '2023-06-05T00:00:00.000Z',
    },
  })
  bill: {
    id: string;
    billNumber: string;
    totalAmount: number;
    dueDate: Date;
  };

  @ApiPropertyOptional({
    description: 'Thông tin người thuê',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Nguyễn Văn B',
      phone: '0901234567',
    },
  })
  tenant?: {
    id: string;
    name: string;
    phone: string;
  };

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2023-06-01T09:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    example: '2023-06-01T09:30:00.000Z',
  })
  updatedAt: Date;
} 