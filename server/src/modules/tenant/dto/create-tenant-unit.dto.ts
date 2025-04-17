import { ApiProperty } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTenantUnitDto {
  @ApiProperty({
    description: 'ID của người thuê',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  tenantId: string;

  @ApiProperty({
    description: 'ID của đơn vị cho thuê',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  unitId: string;

  @ApiProperty({
    description: 'Ngày bắt đầu thuê',
    example: '2023-01-01',
  })
  @IsDateString()
  moveInDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc thuê (dự kiến)',
    example: '2023-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  moveOutDate?: string;

  @ApiProperty({
    description: 'Có phải là người thuê chính không',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isMainTenant?: boolean = false;

  @ApiProperty({
    description: 'Ghi chú',
    example: 'Tenant đặc biệt cần chú ý',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'ID của tài liệu hợp đồng (nếu có)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  contractDocumentId?: string;

  @ApiProperty({
    description: 'Ngày bắt đầu hợp đồng',
    example: '2023-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  contractStartDate?: string;

  @ApiProperty({
    description: 'Ngày kết thúc hợp đồng',
    example: '2023-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  contractEndDate?: string;

  @ApiProperty({
    description: 'Trạng thái hợp đồng',
    enum: ContractStatus,
    default: ContractStatus.ACTIVE,
    required: false,
  })
  @IsEnum(ContractStatus)
  @IsOptional()
  contractStatus?: ContractStatus;

  @ApiProperty({
    description: 'Tiền thuê hàng tháng theo hợp đồng',
    example: 5000000,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  monthlyRent?: number;

  @ApiProperty({
    description: 'Tiền đặt cọc theo hợp đồng',
    example: 10000000,
    required: false,
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  depositAmount?: number;
} 