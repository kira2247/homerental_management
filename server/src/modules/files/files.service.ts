import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { FileType } from '@prisma/client';

@Injectable()
export class FilesService {
  constructor(
    private configService: ConfigService,
    private cloudinaryProvider: CloudinaryProvider,
  ) {}

  /**
   * Xác định loại file dựa vào MIME type
   */
  detectFileType(mimetype: string): FileType {
    if (mimetype.includes('image')) return FileType.IMAGE;
    if (mimetype.includes('pdf')) return FileType.PDF;
    if (mimetype.includes('word') || mimetype.includes('doc')) {
      // Không phải Excel
      if (!mimetype.includes('excel') && !mimetype.includes('spreadsheet') && !mimetype.includes('sheet')) {
        return FileType.WORD;
      }
    }
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet') || mimetype.includes('sheet')) return FileType.EXCEL;
    if (mimetype.includes('text')) return FileType.TEXT;
    throw new BadRequestException(`Unsupported file type: ${mimetype}`);
  }

  async uploadFile(file: Express.Multer.File, fileType: FileType, folderId?: string) {
    try {
      // Truyền thêm folderId cho CloudinaryProvider
      const result = await this.cloudinaryProvider.uploadFile(file, fileType.toString(), folderId);
      return {
        ...result,
        mimetype: file.mimetype,
        size: file.size,
        id: result.publicId,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async deleteFile(fileId: string, provider: string) {
    // Kiểm tra provider có phải là cloudinary không
    if (provider !== 'cloudinary') {
      throw new BadRequestException('Chỉ hỗ trợ provider Cloudinary');
    }

    try {
      return this.cloudinaryProvider.deleteFile(fileId);
    } catch (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }

  getFileUrl(fileId: string, provider: string) {
    // Kiểm tra provider có phải là cloudinary không
    if (provider !== 'cloudinary') {
      throw new BadRequestException('Chỉ hỗ trợ provider Cloudinary');
    }

    try {
      return this.cloudinaryProvider.getFileUrl(fileId);
    } catch (error) {
      throw new BadRequestException(`Get URL failed: ${error.message}`);
    }
  }

  /**
   * Di chuyển file từ vị trí tạm thời sang vị trí chính thức
   * @param sourcePublicId - Public ID của file nguồn (thư mục tạm)
   * @param targetFolder - Thư mục đích (ví dụ: properties/{id}/thumbnail)
   * @returns Thông tin file đã di chuyển
   */
  async moveFile(sourcePublicId: string, targetFolder: string) {
    try {
      const result = await this.cloudinaryProvider.moveFile(sourcePublicId, targetFolder);
      return result;
    } catch (error) {
      throw new BadRequestException(`Move file failed: ${error.message}`);
    }
  }
} 