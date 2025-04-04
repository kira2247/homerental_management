import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEnum, 
  IsOptional, 
  IsUUID, 
  IsString, 
  IsBoolean, 
  IsArray,
  IsInt,
  Min,
  Max,
  IsDateString,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType, FileType } from '@prisma/client';

export class QueryDocumentDto {
  @IsOptional()
  @IsArray()
  @IsEnum(DocumentType, { each: true })
  @ApiPropertyOptional({ 
    description: 'Lọc theo loại tài liệu',
    enum: DocumentType,
    isArray: true
  })
  type?: DocumentType[];

  @IsOptional()
  @IsArray()
  @IsEnum(FileType, { each: true })
  @ApiPropertyOptional({ 
    description: 'Lọc theo loại tập tin',
    enum: FileType,
    isArray: true
  })
  fileType?: FileType[];

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ 
    description: 'Lọc theo trạng thái quan trọng',
    type: Boolean
  })
  isImportant?: boolean;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID người thuê' })
  tenantId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID căn hộ/phòng' })
  unitId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID bất động sản' })
  propertyId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID phương tiện' })
  vehicleId?: string;

  @IsOptional()
  @IsUUID()
  @ApiPropertyOptional({ description: 'Lọc theo ID yêu cầu bảo trì' })
  maintenanceId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc tài liệu từ ngày (bao gồm)' })
  fromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc tài liệu đến ngày (bao gồm)' })
  toDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc tài liệu hết hạn từ ngày (bao gồm)' })
  expiryFromDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Lọc tài liệu hết hạn đến ngày (bao gồm)' })
  expiryToDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Tìm kiếm theo tên tài liệu hoặc mô tả' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional({ 
    description: 'Số trang',
    type: Number,
    default: 1
  })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({ 
    description: 'Số lượng kết quả mỗi trang',
    type: Number,
    default: 10
  })
  limit?: number = 10;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Sắp xếp theo trường',
    default: 'createdAt'
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Thứ tự sắp xếp',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
} 