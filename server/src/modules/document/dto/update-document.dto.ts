import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateDocumentDto } from './create-document.dto';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {
  /* Tất cả các trường đều là tùy chọn khi cập nhật */
} 