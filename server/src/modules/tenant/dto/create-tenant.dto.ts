import { ApiProperty } from '@nestjs/swagger';
import { IdentityType } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Họ tên người thuê',
    example: 'Nguyễn Văn A',
  })
  @IsString()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    description: 'Số điện thoại người thuê',
    example: '+84912345678',
  })
  @IsPhoneNumber('VN')
  phone: string;

  @ApiProperty({
    description: 'Email người thuê',
    example: 'example@gmail.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Số CMND/CCCD/Hộ chiếu',
    example: '001200012345',
  })
  @IsString()
  @Length(9, 20)
  identityNumber: string;

  @ApiProperty({
    description: 'Loại giấy tờ tùy thân',
    enum: IdentityType,
    default: IdentityType.CITIZEN_ID,
  })
  @IsEnum(IdentityType)
  @IsOptional()
  identityType?: IdentityType;

  @ApiProperty({
    description: 'Ngày sinh',
    example: '1990-01-01',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Địa chỉ thường trú',
    example: '123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    required: false,
  })
  @IsString()
  @IsOptional()
  permanentAddress?: string;

  @ApiProperty({
    description: 'Thông tin liên hệ khẩn cấp',
    example: 'Nguyễn Văn B, 0987654321 (Anh/Em)',
    required: false,
  })
  @IsString()
  @IsOptional()
  emergencyContact?: string;
} 