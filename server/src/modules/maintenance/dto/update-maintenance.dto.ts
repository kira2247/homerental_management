import { PartialType } from '@nestjs/swagger';
import { CreateMaintenanceDto } from './create-maintenance.dto';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { MaintenanceStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaintenanceDto extends PartialType(CreateMaintenanceDto) {
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  @ApiPropertyOptional({ 
    description: 'Trạng thái yêu cầu bảo trì',
    enum: MaintenanceStatus
  })
  status?: MaintenanceStatus;

  @IsDateString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Ngày hoàn thành bảo trì' })
  completedDate?: string;
} 