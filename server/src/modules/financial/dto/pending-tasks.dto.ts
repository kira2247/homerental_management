import { IsEnum, IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Pending task DTO
 */
export class PendingTaskDto {
  @ApiProperty({ description: 'ID của công việc' })
  id: string;
  
  @ApiProperty({ description: 'Tiêu đề công việc' })
  title: string;
  
  @ApiProperty({ description: 'Mô tả chi tiết công việc' })
  description: string;
  
  @ApiProperty({ description: 'Ngày đến hạn của công việc' })
  dueDate: Date;
  
  @ApiProperty({ description: 'Mức độ ưu tiên', enum: ['low', 'medium', 'high'] })
  priority: 'low' | 'medium' | 'high';
  
  @ApiProperty({ description: 'Trạng thái công việc', enum: ['pending', 'in-progress', 'completed'] })
  status: 'pending' | 'in-progress' | 'completed';
  
  @ApiProperty({ description: 'Loại công việc', enum: ['rent', 'maintenance', 'contract', 'other'] })
  type: 'rent' | 'maintenance' | 'contract' | 'other';
  
  @ApiProperty({ description: 'ID của bất động sản liên quan', required: false })
  propertyId?: string;
  
  @ApiProperty({ description: 'Tên bất động sản liên quan', required: false })
  propertyName?: string;
  
  @ApiProperty({ description: 'ID của đơn vị liên quan', required: false })
  unitId?: string;
  
  @ApiProperty({ description: 'Tên đơn vị liên quan', required: false })
  unitName?: string;
}

/**
 * Pending tasks response DTO
 */
export class PendingTasksResponseDto {
  @ApiProperty({ description: 'Danh sách công việc cần thực hiện', type: [PendingTaskDto] })
  tasks: PendingTaskDto[];
  
  @ApiProperty({ description: 'Tổng số công việc' })
  total: number;
  
  @ApiProperty({ description: 'Trang hiện tại' })
  page: number;
  
  @ApiProperty({ description: 'Số lượng công việc trên một trang' })
  limit: number;
}

/**
 * Filter DTO for pending tasks
 */
export class PendingTasksFilterDto {
  @ApiProperty({ 
    description: 'Số lượng công việc trên một trang', 
    default: 5, 
    required: false 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 5;

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
    description: 'Lọc theo trạng thái công việc', 
    enum: ['pending', 'in-progress', 'completed'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['pending', 'in-progress', 'completed'])
  status?: 'pending' | 'in-progress' | 'completed';

  @ApiProperty({ 
    description: 'Lọc theo mức độ ưu tiên', 
    enum: ['low', 'medium', 'high'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: 'low' | 'medium' | 'high';

  @ApiProperty({ 
    description: 'Lọc theo loại công việc', 
    enum: ['rent', 'maintenance', 'contract', 'other'], 
    required: false 
  })
  @IsOptional()
  @IsEnum(['rent', 'maintenance', 'contract', 'other'])
  type?: 'rent' | 'maintenance' | 'contract' | 'other';

  @ApiProperty({ 
    description: 'ID của bất động sản để lọc', 
    required: false 
  })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiProperty({ 
    description: 'Sắp xếp theo trường', 
    enum: ['dueDate', 'priority'], 
    default: 'dueDate', 
    required: false 
  })
  @IsOptional()
  @IsEnum(['dueDate', 'priority'])
  sortBy?: 'dueDate' | 'priority' = 'dueDate';

  @ApiProperty({ 
    description: 'Thứ tự sắp xếp', 
    enum: ['asc', 'desc'], 
    default: 'asc', 
    required: false 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
} 