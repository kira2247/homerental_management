import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class PaymentFilterDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID của hóa đơn' })
  billId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID của property' })
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID của unit' })
  unitId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID của tenant' })
  tenantId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc từ ngày (ngày thanh toán)' })
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc đến ngày (ngày thanh toán)' })
  toDate?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  @ApiPropertyOptional({ 
    description: 'Lọc theo phương thức thanh toán',
    enum: PaymentMethod 
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Tìm kiếm theo số biên lai' })
  search?: string;
} 