import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @ApiPropertyOptional({ description: 'public_id của thumbnail trên Cloudinary' })
  thumbnailId?: string;
} 