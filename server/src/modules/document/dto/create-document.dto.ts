import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsOptional, 
  IsNumber, 
  IsDateString, 
  IsBoolean,
  IsUrl,
  IsObject
} from 'class-validator';
import { DocumentType, FileType } from '@prisma/client';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Tên tài liệu' })
  name: string;

  @IsEnum(DocumentType)
  @ApiProperty({ 
    description: 'Loại tài liệu',
    enum: DocumentType,
    example: DocumentType.CONTRACT 
  })
  type: DocumentType;

  @IsEnum(FileType)
  @ApiProperty({ 
    description: 'Định dạng tập tin',
    enum: FileType,
    default: FileType.OTHER
  })
  fileType: FileType;

  @IsUrl()
  @IsNotEmpty()
  @ApiProperty({ description: 'URL tải xuống tài liệu' })
  url: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Loại MIME của tập tin' })
  mimeType?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ description: 'Kích thước tập tin (bytes)' })
  size?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ 
    description: 'Đánh dấu tài liệu quan trọng',
    default: false
  })
  isImportant?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Mô tả chi tiết về tài liệu' })
  description?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Ngày hết hạn của tài liệu (nếu có)' })
  expiryDate?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ 
    description: 'Chi tiết hợp đồng (chỉ áp dụng cho tài liệu loại CONTRACT)',
    example: {
      contractNumber: 'HĐ-001',
      startDate: '2023-01-01',
      endDate: '2024-01-01',
      value: 10000000
    } 
  })
  contractDetails?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID của người thuê (nếu tài liệu liên quan đến người thuê)' })
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID của căn hộ/phòng (nếu tài liệu liên quan đến căn hộ/phòng)' })
  unitId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID của bất động sản (nếu tài liệu liên quan đến bất động sản)' })
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID của phương tiện (nếu tài liệu liên quan đến phương tiện)' })
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'ID của yêu cầu bảo trì (nếu tài liệu liên quan đến bảo trì)' })
  maintenanceId?: string;
} 