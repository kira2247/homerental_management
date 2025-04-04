import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsDateString, 
  Min 
} from 'class-validator';
import { Priority } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Tiêu đề yêu cầu bảo trì' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Mô tả chi tiết yêu cầu bảo trì' })
  description: string;

  @IsEnum(Priority)
  @ApiProperty({ 
    description: 'Mức độ ưu tiên của yêu cầu',
    enum: Priority,
    default: Priority.MEDIUM 
  })
  priority: Priority;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ description: 'ID của bất động sản' })
  propertyId: string;

  @IsUUID()
  @IsOptional()
  @ApiPropertyOptional({ description: 'ID của phòng/căn hộ (nếu có)' })
  unitId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Ngày dự kiến thực hiện bảo trì' })
  scheduledDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Chi phí dự kiến (nếu có)' })
  cost?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Ghi chú bổ sung' })
  notes?: string;
} 