import { IsOptional, IsEnum, IsInt, IsString, Min, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SupportedCurrency } from '../../currency/interfaces/currency.interface';

/**
 * Transaction response DTO
 */
export class TransactionDto {
  @ApiProperty({ description: 'ID của giao dịch' })
  id: string;
  
  @ApiProperty({ description: 'ID của bất động sản liên quan đến giao dịch' })
  propertyId: string;
  
  @ApiProperty({ description: 'Tên bất động sản liên quan đến giao dịch' })
  propertyName: string;
  
  @ApiProperty({ description: 'Tên đơn vị liên quan đến giao dịch' })
  unitName: string;
  
  @ApiProperty({ description: 'Tên người thuê thực hiện giao dịch' })
  tenantName: string;
  
  @ApiProperty({ description: 'Số tiền giao dịch' })
  amount: number;
  
  @ApiProperty({ description: 'Loại tiền tệ của giao dịch', enum: SupportedCurrency })
  currency: SupportedCurrency;
  
  @ApiProperty({ description: 'Số tiền đã chuyển đổi (nếu áp dụng)', required: false })
  convertedAmount?: number;
  
  @ApiProperty({ description: 'Loại tiền tệ đã chuyển đổi (nếu áp dụng)', enum: SupportedCurrency, required: false })
  convertedCurrency?: SupportedCurrency;
  
  @ApiProperty({ description: 'Ngày thực hiện giao dịch' })
  date: Date;
  
  @ApiProperty({ description: 'Phương thức thanh toán', enum: ['BANK_TRANSFER', 'CASH', 'CREDIT_CARD', 'OTHER'] })
  paymentMethod: string;
  
  @ApiProperty({ description: 'Trạng thái giao dịch', enum: ['completed', 'pending', 'cancelled'] })
  status: 'completed' | 'pending' | 'cancelled';
  
  @ApiProperty({ description: 'Loại giao dịch', enum: ['rent', 'maintenance', 'deposit', 'other'] })
  type: 'rent' | 'maintenance' | 'deposit' | 'other';
}

/**
 * Transaction list response DTO
 */
export class TransactionListDto {
  @ApiProperty({ description: 'Danh sách giao dịch', type: [TransactionDto] })
  items: TransactionDto[];
  
  @ApiProperty({ description: 'Tổng số giao dịch' })
  totalItems: number;
  
  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;
  
  @ApiProperty({ description: 'Số lượng giao dịch trên một trang' })
  limit: number;
  
  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
}

/**
 * Filter DTO for transactions
 */
export class TransactionFilterDto {
  @ApiProperty({ 
    description: 'Số lượng giao dịch trên một trang', 
    default: 10, 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Số trang', 
    default: 1, 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Ngày bắt đầu tìm kiếm (định dạng YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({ 
    description: 'Ngày kết thúc tìm kiếm (định dạng YYYY-MM-DD)', 
    required: false 
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({ 
    description: 'ID của bất động sản để lọc', 
    required: false 
  })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiProperty({ 
    description: 'Trạng thái giao dịch', 
    enum: ['completed', 'pending', 'cancelled'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['completed', 'pending', 'cancelled'])
  status?: 'completed' | 'pending' | 'cancelled';

  @ApiProperty({ 
    description: 'Loại giao dịch', 
    enum: ['rent', 'maintenance', 'deposit', 'other'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['rent', 'maintenance', 'deposit', 'other'])
  type?: 'rent' | 'maintenance' | 'deposit' | 'other';

  @ApiProperty({ 
    description: 'Sắp xếp theo trường', 
    enum: ['date', 'amount'], 
    default: 'date', 
    required: false 
  })
  @IsOptional()
  @IsEnum(['date', 'amount'])
  sortBy?: 'date' | 'amount' = 'date';

  @ApiProperty({ 
    description: 'Thứ tự sắp xếp', 
    enum: ['asc', 'desc'], 
    default: 'desc', 
    required: false 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
  
  @ApiProperty({ 
    description: 'Loại tiền tệ để lọc', 
    enum: SupportedCurrency, 
    required: false 
  })
  @IsOptional()
  @IsEnum(SupportedCurrency)
  currency?: SupportedCurrency;
  
  @ApiProperty({ 
    description: 'Chuyển đổi tất cả giá trị tiền tệ sang tiền tệ ưa thích của người dùng', 
    default: true, 
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  convertToPreferred?: boolean = true;
  
  @ApiProperty({
    description: 'Tìm kiếm theo tên người thuê, tên bất động sản, hoặc mã giao dịch',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;
} 